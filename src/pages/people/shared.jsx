import '../../styles/neo.css';
/* shared.jsx: the four states of a card, in one place for Neo's pages. */
import { useEffect, useRef } from 'react';
import { Loading, Empty } from '../../components/States.jsx';
import ErrorBanner from '../../components/ErrorBanner.jsx';
import ErrorPage from '../../components/ErrorPage.jsx';
import { describe } from '../../lib/errors.js';

export function Body({ status, error, reload, emptyTitle, emptyHint, children }) {
  if (status === 'loading') return <Loading lines={4} />;
  if (status === 'error') {
    const shown = describe(error, { mode: 'page' });
    if (shown.page) return <ErrorPage code={shown.page} />;
    return <ErrorBanner onRetry={reload}>{shown.text}</ErrorBanner>;
  }
  if (status === 'empty') return <Empty title={emptyTitle} hint={emptyHint} />;
  return children;
}

/* One "are you sure" for every destructive action in Neo's pages, in the page
 * itself. A native window.confirm cannot be photographed, freezes the whole app
 * while it is open, and is outside a keyboard pass; this is an ordinary part of
 * the page, so Tab reaches it and the question is in the screenshot. */
export function Confirm({ question, yes = 'Yes', no = 'Cancel', onYes, onNo, busy = false }) {
  /* The safe answer takes the focus, so Enter on a panel nobody has touched does
   * nothing destructive, and Escape always backs out. */
  const safe = useRef(null);
  useEffect(() => { safe.current?.focus(); }, []);
  return (
    <div
      className="neo-confirm"
      role="alertdialog"
      aria-label={question}
      onKeyDown={event => {
        if (event.key === 'Escape') {
          event.stopPropagation();
          onNo();
        }
      }}
    >
      <p>{question}</p>
      <div className="flex flex-wrap gap-2">
        <button type="button" className="btn small" onClick={onYes} disabled={busy}>
          {busy ? 'Working…' : yes}
        </button>
        <button type="button" className="btn small ghost" onClick={onNo} disabled={busy} ref={safe}>
          {no}
        </button>
      </div>
    </div>
  );
}
