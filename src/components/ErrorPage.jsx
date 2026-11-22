/*
 * ErrorPage: the full-page version of a failure. One component, seven looks. Show it INSIDE the app shell (sidebar stays),
 * in place of the page, never as a blank screen or a browser alert.
 *
 *   <ErrorPage code="404" onAction={name => ...} />
 *
 * What it shows, and nothing else: the big code (or the word Offline), the title, one sentence, one or two buttons.
 * NO logo, NO illustration, NO card, NO gradient. Calm terracotta text on the normal page background.
 *
 * code: '404' not found, '403' no access, '401' session ended, '423' SACCO suspended, '429' too many requests,
 *       '500' our fault (shows a reference the person can quote), 'offline' no connection, 'unavailable' API unreachable.
 * onAction(name) is called with 'home' | 'back' | 'login' | 'landing' | 'switcher' | 'account' | 'retry'. YOU wire what each does:
 *   home -> navigate to the person's start page (homeFor(perms) in lib/perms.js)
 *   back -> navigate(-1) if there is somewhere to go back to, otherwise home
 *   switcher -> open the SACCO switcher menu
 *   retry -> run the request again
 * Map HTTP answers to codes in ONE place (the API client): 401 -> '401' (after a failed refresh), 403 -> '403', 404 -> '404',
 * 423 -> '423', 429 -> '429' (use the Retry-After header for `wait`), 5xx -> '500'; a failed fetch is `offline` only when the browser reports no network.
 *
 * Styling is Tailwind utilities on the theme tokens from styles/tailwind.css (text-err, text-muted, font-serif), so it follows
 * the person's chosen colour theme and font. Buttons use the shared .btn classes from nexora.css.
 */
import { useEffect, useMemo, useState } from 'react';

export const ERRORS = {  // eslint-disable-line react-refresh/only-export-components
  '404': { n: '404', t: 'We could not find that page', s: 'The address may be mistyped, or the page was moved. Nothing was changed.', a: ['Go to my start page', 'home'], b: ['Go back', 'back'] },
  '403': { n: '403', t: 'You do not have access to this page', s: 'Your role does not include it. If you think it should, ask your SACCO admin.', a: ['Go to my start page', 'home'], b: ['Go back', 'back'] },
  '401': { n: '401', t: 'Your session ended', s: 'Sign in again to carry on. Nothing you were doing was saved or sent.', a: ['Sign in', 'login'], b: ['Back to home', 'landing'] },
  '423': { n: '423', t: 'This SACCO is suspended', s: 'Its records are locked until the platform owner reopens it. You can still change your account settings or pick another SACCO.', a: ['Choose another SACCO', 'switcher'], b: ['Account settings', 'account'] },
  '429': { n: '429', t: 'Too many requests', s: 'Please wait before trying again. The button turns on when the wait is over.', a: ['Try again', 'retry'], b: ['Go to my start page', 'home'] },
  '500': { n: '500', t: 'Something went wrong on our side', s: 'We recorded it. Try again in a moment. If it keeps happening, tell your admin the reference below.', a: ['Try again', 'retry'], b: ['Go to my start page', 'home'], ref: true },
  offline: { n: '', t: 'You are offline', s: 'Check your connection. Nothing was lost, and this page reloads by itself when you are back.', a: ['Try again', 'retry'], b: ['Go to my start page', 'home'] },
  unavailable: { n: '', word: 'Unavailable', t: 'NEXORA could not reach its service', s: 'Check that the API is running, then try again.', a: ['Try again', 'retry'], b: ['Go to my start page', 'home'] }
};

export default function ErrorPage({ code, wait = 30, onAction }) {
  const e = ERRORS[code] || ERRORS['500'];
  // eslint-disable-next-line react-hooks/purity, react-hooks/exhaustive-deps
  const ref = useMemo(() => (crypto.randomUUID ? crypto.randomUUID() : String(Date.now())).slice(0, 8), [code]);
  const [left, setLeft] = useState(code === '429' ? wait : 0);
  useEffect(() => {
    if (left <= 0) return undefined;
    const t = setTimeout(() => setLeft(left - 1), 1000);
    return () => clearTimeout(t);
  }, [left]);
  const copy = () => navigator.clipboard && navigator.clipboard.writeText(ref);
  return (
    <div className="mx-auto grid min-h-[60vh] max-w-xl content-center justify-items-center gap-3 py-[clamp(1.5rem,6vw,4rem)] text-center">
      <div aria-hidden="true" className={`font-serif font-medium leading-[0.95] tracking-tight text-err ${e.n ? 'text-[clamp(5rem,18vw,10rem)]' : 'text-[clamp(3.4rem,12vw,6.5rem)]'}`}>{e.word || e.n || 'Offline'}</div>
      <div role="alert" aria-live="assertive" className="grid justify-items-center gap-3">
        <h2 className="font-serif text-[clamp(1.5rem,3.4vw,2.2rem)] leading-tight">{e.t}</h2>
        <p className="max-w-[30rem] text-muted">{e.s}</p>
        <div className="mt-2 flex flex-wrap justify-center gap-3">
          <button className="btn" type="button" disabled={left > 0} onClick={() => onAction(e.a[1])}>{e.a[0]}{left > 0 ? ` (${left}s)` : ''}</button>
          <button className="btn ghost" type="button" onClick={() => onAction(e.b[1])}>{e.b[0]}</button>
        </div>
        {e.ref && <p className="text-sm text-muted">Reference <code className="rounded-lg bg-ink/10 px-2 py-0.5">{ref}</code> <button className="link-btn" type="button" onClick={copy}>Copy</button></p>}
      </div>
    </div>
  );
}
