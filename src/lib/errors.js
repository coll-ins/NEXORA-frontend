/*
 * errors.js: turn ANY failure into what the screen shows. Copy to frontend/src/lib/errors.js. Same file for everyone.
 *
 *   const { page, text } = describe(error, { mode: 'page' });     // while loading a page
 *   const { text }       = describe(error, { mode: 'action' });   // after a button or form submit
 *
 * page: null, or the code to show with <ErrorPage code={page}>:  '401' | '403' | '404' | '423' | '429' | '500' | 'offline'
 * text: ONE plain sentence for a banner. Never show error.status, error.code or a stack trace to a person.
 * wait: for 429, how many seconds to wait (from the Retry-After header, default 30).
 *
 * Backend messages for 400 and 409 are written for people ("Insufficient funds.") and are shown as they are.
 * Everything else uses the sentences below so the wording is identical on every screen.
 */
export function describe(err, { mode = 'action', context = '' } = {}) {
  const s = err && err.status != null ? err.status : -1;
  const asPage = mode === 'page';
  if (s === 0 && err.code === 'unavailable') {
    return {
      page: asPage ? 'unavailable' : null,
      text: err.message || 'NEXORA could not reach its service. Check that the API is running and try again.',
    };
  }
  if (s === 0) return { page: asPage ? 'offline' : null, text: 'You are offline. Check your connection and try again.' };
  if (s === 400) return { page: null, text: err.message };
  if (s === 401) {
    if (context === 'login') return { page: null, text: 'Your email or password is not right. Check both and try again.' };
    return { page: asPage ? '401' : null, text: 'Your session ended. Sign in again to carry on.' };
  }
  if (s === 403) return { page: asPage ? '403' : null, text: err.message && /own account/i.test(err.message) ? err.message : 'You are not allowed to do that. If you think you should be, ask your SACCO admin.' };
  if (s === 404) return { page: asPage ? '404' : null, text: 'That could not be found. It may have been removed. Reload the page and try again.' };
  if (s === 409) return { page: null, text: err.message };
  if (s === 413) return { page: null, text: 'That is too large to send. Shorten it and try again.' };
  if (s === 423) {
    if (context === 'login' && /locked/i.test(err.message || '')) return { page: null, text: 'This account is locked for 15 minutes after too many wrong passwords. You can reset your password to get back in now.', link: 'forgot' };
    return { page: asPage ? '423' : null, text: 'This SACCO is suspended. Its records are locked until the platform owner reopens it.' };
  }
  if (s === 429) { const wait = err.retryAfter || 30; return { page: asPage ? '429' : null, wait, text: `You are doing that too fast. Wait ${wait} seconds and try again.` }; }
  if (s >= 500 || s === -1) return { page: asPage ? '500' : null, text: 'Something went wrong on our side. Try again in a moment.' };
  return { page: null, text: err.message || 'Something went wrong. Try again.' };
}
