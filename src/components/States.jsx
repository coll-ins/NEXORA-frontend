/*
 * States: the three things every list or card must be able to show besides its data.
 *   <Loading lines={3} />            while the request is in flight (a calm shimmer, never a spinner)
 *   <Empty title="..." hint="..." /> when the request worked and there is nothing to show
 *   Failure uses <ErrorBanner onRetry={reload}> from ErrorBanner.jsx
 * A card is never blank. If you cannot say which of these three it is showing, the page is not finished.
 */
export function Loading({ lines = 3, label = 'Loading' }) {
  const widths = ['60%', '100%', '80%', '70%'];
  return (
    <div role="status" aria-label={label}>
      {Array.from({ length: lines }).map((_, i) => (
        <div key={i} className="sk" style={{ height: i === 1 ? '5rem' : '1rem', width: widths[i % widths.length], margin: '.6rem 0' }} />
      ))}
    </div>
  );
}

export function Empty({ title, hint, action }) {
  return (
    <div className="empty">
      <div className="empty-ic" aria-hidden="true">0</div>
      <b>{title}</b>
      {hint && <span className="muted">{hint}</span>}
      {action}
    </div>
  );
}
