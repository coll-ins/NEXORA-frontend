/*
 * http.js: the only place that talks to the network. Copy to frontend/src/lib/http.js. Same file for everyone.
 *
 *   import { http, MOCK, mockDelay } from '../lib/http.js';
 *   await http.get('/loans/saccos/1', { params: { status: 'approved', page: 1 } });
 *   await http.post('/savings/accounts/3/deposits', { body: { amount: 250000, reference } });
 *
 * What it does for you (so your page does not):
 *   - adds the Bearer token, base URL and JSON headers
 *   - on 401: refreshes the token ONCE (one refresh at a time, shared by every waiting request), then retries; if the refresh fails the
 *     session is over: tokens are cleared and the handler set with onSessionEnded() runs
 *   - turns every failure into an ApiError { status, code, message, retryAfter } (see lib/errors.js for what to show)
 *   - a failed fetch becomes `offline` only when the browser reports no network; otherwise it reports an unreachable API
 * Rules from docs/frontend-handoff.md that this file already follows: the refresh token rotates (always keep the newest), and a refresh answered 401 or 423 ends the session.
 *
 * MOCK MODE: run with VITE_MOCK=1 (see the Common setup) and every api module returns its own sample data and never calls http.
 * Each api function does:   if (MOCK) { await mockDelay(); return structuredClone(sample); }
 */

const BASE = (import.meta.env && import.meta.env.VITE_API_URL) || 'http://localhost:5000/api/v1';
export const MOCK = !!(import.meta.env && import.meta.env.VITE_MOCK === '1') || (typeof window !== 'undefined' && window.__NEXORA_MOCK__ === true);
/* a believable wait so the loading state is visible while you build it */
export const mockDelay = (ms = 450 + Math.random() * 450) => new Promise(r => setTimeout(r, ms));

export class ApiError extends Error {
  constructor(status, code, message, retryAfter = 0, fields = null) { super(message); this.name = 'ApiError'; this.status = status; this.code = code; this.retryAfter = retryAfter; this.fields = fields; }
}

/* ---------- tokens: browser storage for release 1 (decision recorded in docs/frontend-work.md section 13) ---------- */
const KEY = 'nexora.tokens';
let tokens = null;
const read = () => { try { return JSON.parse(localStorage.getItem(KEY)); } catch { return null; } };
export const getTokens = () => (tokens ||= read());
export const setTokens = t => { tokens = t; try { t ? localStorage.setItem(KEY, JSON.stringify(t)) : localStorage.removeItem(KEY); } catch { /* storage blocked: stay in memory */ } };
export const clearTokens = () => setTokens(null);
let endHandler = () => {};
export const onSessionEnded = fn => { endHandler = fn; };

/* ---------- one refresh at a time ---------- */
let refreshing = null;
function refresh() {
  if (refreshing) return refreshing;
  const t = getTokens();
  if (!t || !t.refresh) return Promise.reject(new ApiError(401, 'unauthorized', 'Your session ended.'));
  refreshing = fetch(`${BASE}/auth/refresh`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ refresh_token: t.refresh }) })
    .then(async res => {
      if (!res.ok) throw new ApiError(res.status, 'unauthorized', 'Your session ended.');
      const j = await res.json(); setTokens({ access: j.access_token, refresh: j.refresh_token }); return j.access_token;
    })
    .finally(() => { refreshing = null; });
  return refreshing;
}

async function send(method, path, { body, params, auth = true, token } = {}) {
  const url = new URL(BASE + path);
  if (params) Object.entries(params).forEach(([k, v]) => { if (v !== undefined && v !== null && v !== '') url.searchParams.set(k, v); });
  const headers = { Accept: 'application/json' };
  if (body !== undefined) headers['Content-Type'] = 'application/json';
  const t = token || (auth && getTokens() && getTokens().access);
  if (t) headers.Authorization = `Bearer ${t}`;
  let res;
  try { res = await fetch(url, { method, headers, body: body === undefined ? undefined : JSON.stringify(body) }); }
  catch {
    const offline = typeof navigator !== 'undefined' && navigator.onLine === false;
    throw new ApiError(
      0,
      offline ? 'offline' : 'unavailable',
      offline
        ? 'You are offline.'
        : 'NEXORA could not reach its service. Check that the API is running and try again.',
    );
  }
  if (res.status === 204) return null;
  let json = null; try { json = await res.json(); } catch { /* no body */ }
  if (res.ok) return json;
  const err = (json && json.error) || {};
  throw new ApiError(res.status, err.code || 'error', err.message || 'Something went wrong.', Number(res.headers.get('Retry-After')) || 0, err.fields || null);
}

async function request(method, path, opts = {}) {
  try { return await send(method, path, opts); }
  catch (e) {
    if (e instanceof ApiError && e.status === 401 && opts.auth !== false && !opts._retried) {
      try { const fresh = await refresh(); return await send(method, path, { ...opts, token: fresh, _retried: true }); }
      catch (e2) { clearTokens(); endHandler(); throw e2 instanceof ApiError ? e2 : e; }
    }
    throw e;
  }
}

/* Two parts of the page asking for the same GET at the same moment (React's double render in development, a page and its panel)
 * share ONE request. Nothing is cached: once the answer arrives the next call goes to the server again. */
const inFlight = new Map();
function getShared(path, opts = {}) {
  if (opts.token) return request('GET', path, opts);
  const params = opts.params ? Object.entries(opts.params).filter(([, v]) => v !== undefined && v !== null && v !== '').sort() : [];
  const tokens = getTokens();
  const key = `${tokens ? tokens.access : ''} ${path}?${JSON.stringify(params)} ${opts.auth === false}`;
  if (inFlight.has(key)) return inFlight.get(key);
  const pending = request('GET', path, opts).finally(() => inFlight.delete(key));
  inFlight.set(key, pending);
  return pending;
}

export const http = {
  get: (p, o) => getShared(p, o),
  post: (p, o) => request('POST', p, o),
  patch: (p, o) => request('PATCH', p, o),
  put: (p, o) => request('PUT', p, o),
  del: (p, o) => request('DELETE', p, o)
};