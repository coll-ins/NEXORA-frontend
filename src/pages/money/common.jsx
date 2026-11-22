/* common.jsx: the small shared COMPONENTS of the money pages (Sam's file). Plain helpers and hooks live in helpers.js. */
import { useEffect, useRef } from 'react';
import { Loading, Empty } from '../../components/States.jsx';
import ErrorBanner from '../../components/ErrorBanner.jsx';
import ErrorPage from '../../components/ErrorPage.jsx';
import { describe } from '../../lib/errors.js';
import { REQUEST_CHIP_TEXT, LOAN_CHIP_TEXT } from './helpers.js';
import { countUp, fromMinor } from '../../lib/format.js';
import '../../styles/sam.css';

/* ---- the four states: loading, error (Try again), empty, ready ---- */
export function Body({ status, error, reload, emptyTitle, emptyHint, lines = 4, children }) {
  if (status === 'loading') return <Loading lines={lines} />;
  if (status === 'error') {
    const shown = describe(error, { mode: 'page' });
    if (shown.page) return <ErrorPage code={shown.page} />;
    return <ErrorBanner onRetry={reload}>{shown.text}</ErrorBanner>;
  }
  if (status === 'empty') return <Empty title={emptyTitle} hint={emptyHint} />;
  return children;
}

/* ---- a big number that counts up once when it appears. value is a number, pre/suf wrap it ---- */
export function Count({ value, pre = '', suf = '', dec = 0 }) {
  const ref = useRef(null);
  const final = pre + Number(value).toLocaleString('en-KE', { minimumFractionDigits: dec, maximumFractionDigits: dec }) + suf;
  useEffect(() => { if (ref.current) countUp(ref.current); }, [value]);
  return <div ref={ref} className="big" data-count={value} data-dec={dec} data-pre={pre} data-suf={suf}>{final}</div>;
}
export const KesCount = ({ minor }) => <Count value={fromMinor(minor)} pre="KES " />;


/* (the chip words live in helpers.js) */
const REQUEST_CHIP = REQUEST_CHIP_TEXT; // { pending: ['Pending', 'warn'], confirmed: ['Confirmed', 'up'], rejected: ['Rejected', 'bad'] };
export function RequestChip({ status }) {
  const [label, kind] = REQUEST_CHIP[status] || [status, ''];
  return <span className={`chip ${kind}`}>{label}</span>;
}


const LOAN_CHIP = LOAN_CHIP_TEXT; // { requested: ['Waiting', 'warn'], approved: ['Approved', 'up'], disbursed: ['Disbursed', 'up'], repaid: ['Repaid', 'up'], rejected: ['Rejected', 'bad'] };
export function LoanChip({ status }) {
  const [label, kind] = LOAN_CHIP[status] || [status, ''];
  return <span className={`chip ${kind}`}>{label}</span>;
}

export function LoadMore({ paged }) {
  if (paged.moreError) return <ErrorBanner onRetry={paged.more}>{describe(paged.moreError).text}</ErrorBanner>;
  if (paged.next == null) return null;
  return (
    <div className="sam-more">
      <button type="button" className="btn ghost small" disabled={paged.busy} onClick={paged.more}>{paged.busy ? 'Loading...' : 'Load more'}</button>
    </div>
  );
}