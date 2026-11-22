/* helpers.js: plain functions, constants and the load-more hook for the money pages (Sam's file). */
import { useCallback, useEffect, useRef, useState } from 'react';
import { describe } from '../../lib/errors.js';

/* ---- phones: accept what people type, send 2547..., show 0712 345 678 ---- */
export const PHONE_RE = /^(?:\+254|254|0)([17]\d{8})$/;
export const stripPhone = v => String(v).replace(/[\s-]/g, '');
export const isPhone = v => PHONE_RE.test(stripPhone(v));
export const wirePhone = v => { const m = PHONE_RE.exec(stripPhone(v)); return m ? `254${m[1]}` : ''; };
export const prettyPhone = v => {
  const m = PHONE_RE.exec(stripPhone(v || ''));
  if (!m) return v || '';
  const n = m[1];
  return `0${n.slice(0, 3)} ${n.slice(3, 6)} ${n.slice(6)}`;
};

/* ---- people and requests ---- */
export const whoOf = r => r.name || r.email || `Member ${r.membership_id}`;
export const KIND = { deposit: 'Deposit', withdrawal: 'Withdrawal' };
export const METHOD = { mpesa: 'M-Pesa', bank: 'Bank' };
export const detailsOf = r => (r.method === 'mpesa' ? prettyPhone(r.phone) : r.kind === 'deposit' ? `${r.bank_name}, ref ${r.account_ref}` : `${r.bank_name}, account ${r.account_ref}`);

export const REQUEST_CHIP_TEXT = { pending: ['Pending', 'warn'], confirmed: ['Confirmed', 'up'], rejected: ['Rejected', 'bad'] };
export const LOAN_CHIP_TEXT = { requested: ['Waiting', 'warn'], approved: ['Approved', 'up'], disbursed: ['Disbursed', 'up'], repaid: ['Repaid', 'up'], rejected: ['Rejected', 'bad'] };
export const LOAN_FILTERS = [['', 'All'], ['requested', 'Waiting'], ['approved', 'Approved'], ['disbursed', 'Disbursed'], ['repaid', 'Repaid'], ['rejected', 'Rejected']];
/* whole shillings, rounded up so the parts never fall short of the loan; no interest is added because the API does not send a rate */
export const instalmentMinor = l => Math.ceil(l.principal / Math.max(1, l.term_months || 1));

/* ---- ledger rows ---- */
export const TX_LABEL = { deposit: 'Deposit', withdrawal: 'Withdrawal', interest: 'Interest', fee: 'Fee' };
export const isCredit = t => t.type === 'deposit' || t.type === 'interest';
export const reversedSet = items => new Set(items.filter(t => t.reverses_id).map(t => t.reverses_id));
export const txTitle = t => (t.reverses_id ? `Reversal of #${t.reverses_id}` : TX_LABEL[t.type] || t.type);

/* ---- what to show after a button press ----
 * Returns { page, text, offline }. page is '403' or '423' when the whole page must be replaced; offline means "carry on, same reference". */
export function failure(err, again) {
  if (err && err.status === 0) return { offline: true, text: `We could not confirm that went through. Press ${again} again; it will not be sent twice.` };
  const d = describe(err, { mode: 'page' });
  return { page: d.page === '403' || d.page === '423' ? d.page : null, text: d.text };
}

/* ---- Load more: pages (or cursors) with the four states ----
 * fetchPage(token) answers { items, next }. token is undefined for the first page, then whatever `next` was. */
export function usePaged(fetchPage, deps) {
  const key = JSON.stringify(deps);
  const [st, setSt] = useState({ key: null, status: 'loading', items: [], next: null, error: null, busy: false, moreError: null });
  const run = useRef(0);
  const latest = useRef(fetchPage);
  useEffect(() => { latest.current = fetchPage; });
  /* read the first page; `silent` keeps the rows on screen while it refreshes */
  const read = useCallback(() => {
    const id = ++run.current;
    Promise.resolve().then(() => latest.current(undefined)).then(
      r => { if (id === run.current) setSt({ key, status: r.items.length ? 'ready' : 'empty', items: r.items, next: r.next, error: null, busy: false, moreError: null }); },
      e => { if (id === run.current) setSt(s => ({ ...s, key, status: 'error', error: e, busy: false })); }
    );
  }, [key]);
  useEffect(() => { read(); return () => { run.current += 1; }; }, [read]);
  const reload = useCallback(() => { setSt(s => ({ ...s, status: 'loading', error: null, moreError: null })); read(); }, [read]);
  const refresh = read;
  const more = useCallback(() => {
    const id = run.current;
    setSt(s => {
      if (s.busy || s.next == null) return s;
      const token = s.next;
      Promise.resolve().then(() => latest.current(token)).then(
        r => { if (id === run.current) setSt(p => ({ ...p, items: [...p.items, ...r.items], next: r.next, busy: false, moreError: null })); },
        e => { if (id === run.current) setSt(p => ({ ...p, busy: false, moreError: e })); }
      );
      return { ...s, busy: true, moreError: null };
    });
  }, []);
  const stale = st.key !== key;   // the inputs changed and the new page has not arrived yet
  return { ...st, status: stale ? 'loading' : st.status, items: stale ? [] : st.items, reload, refresh, more };
}

export const initialsOf = text => String(text || '?').replace(/@.*/, '').split(/[\s.]+/).filter(Boolean).slice(0, 2).map(p => p[0].toUpperCase()).join('') || '?';