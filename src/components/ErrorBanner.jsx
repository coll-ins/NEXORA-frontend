/*
 * ErrorBanner: the one way to show a message at the top of a page or a card.
 * kind: 'err' (loud terracotta, role=alert), 'warn' (saffron), 'info' (blue), 'ok' (green).
 * Rule: write ONE plain sentence that says what happened and what the person can do. Never a status code, never raw API text.
 * Pass onRetry to add a "Try again" button (use it for anything that can simply be tried again).
 */
export default function ErrorBanner({ kind = 'err', children, onRetry, retryLabel = 'Try again' }) {
  const role = kind === 'err' || kind === 'warn' ? 'alert' : 'status';
  return (
    <div className={`banner ${kind}`} role={role}>
      <span>{children}</span>
      {onRetry && <button className="btn small ghost" type="button" onClick={onRetry}>{retryLabel}</button>}
    </div>
  );
}
