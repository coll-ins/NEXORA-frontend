/* RequestsPage: officers (savings.post) confirm or reject the members' deposit and withdrawal requests.
 * Confirming posts the real ledger entry (the backend does it). Nobody decides their own request. */
import { useRef, useState } from 'react';
import { useSession } from '../../../lib/session.jsx';
import { kesFromMinor, dTime, newReference } from '../../../lib/format.js';
import { describe } from '../../../lib/errors.js';
import { listSaccoRequests, confirmRequest, rejectRequest, accountBalanceOf } from '../../../api/requests.js';
import ErrorBanner from '../../../components/ErrorBanner.jsx';
import ErrorPage from '../../../components/ErrorPage.jsx';
import Field from '../../../components/Field.jsx';
import { Body, LoadMore, RequestChip } from '../common.jsx';
import ReversalRequests from './ReversalRequests.jsx';
import { KIND, METHOD, detailsOf, whoOf, usePaged } from '../helpers.js';

const COLS = 7;
const FLAG = { large_amount: 'Large amount', manual_over_limit: 'Manual entry over the limit', repeated_amount: 'Same amount again and again', quick_withdrawal: 'Withdrawal soon after a deposit' };

/* the Decided tab is every request that is not pending; if a page is all pending rows, keep reading until there is something to show */
async function decidedPage(saccoId, cursor) {
  let next = cursor;
  for (let i = 0; i < 5; i += 1) {
    const r = await listSaccoRequests(saccoId, undefined, next);
    const items = r.items.filter(x => x.status !== 'pending');
    if (items.length || r.next == null) return { items, next: r.next };
    next = r.next;
  }
  return { items: [], next };
}

export default function RequestsPage() {
  const { saccoId, user, can } = useSession();
  const [tab, setTab] = useState('pending');
  const [banner, setBanner] = useState(null);       // { kind, text }
  const [busyId, setBusyId] = useState(null);
  const [rejecting, setRejecting] = useState(null); // { id, reason, error }
  const [blocked, setBlocked] = useState(null);
  const refs = useRef({});                           // one reference per confirm, reused when the same press is retried

  const pending = usePaged(cursor => listSaccoRequests(saccoId, 'pending', cursor), [saccoId]);
  /* the Decided list is read only once somebody opens that tab (it can take several calls); after that it stays fresh */
  const [decidedWanted, setDecidedWanted] = useState(false);
  const decided = usePaged(cursor => (decidedWanted ? decidedPage(saccoId, cursor) : Promise.resolve({ items: [], next: null })), [saccoId, decidedWanted]);
  const list = tab === 'pending' ? pending : (decided.status === 'empty' && !decidedWanted ? { ...decided, status: 'loading' } : decided);
  const count = `${pending.items.length}${pending.next != null ? '+' : ''}`;

  const mine = r => Boolean(user && user.email && r.email === user.email);
  const refreshBoth = () => { pending.refresh(); if (decidedWanted) decided.refresh(); };

  function fail(err, r, verb) {
    const d = describe(err, { mode: 'page' });
    if (d.page === '403' && err.code !== 'OWN_REQUEST') { setBlocked('403'); return; }
    if (d.page === '423') { setBlocked('423'); return; }
    if (err.status === 0) return setBanner({ kind: 'warn', text: `We could not confirm that went through. Press ${verb} again; it will not be posted twice.` });
    if (err.code === 'REQUEST_ALREADY_DECIDED') { setBanner({ kind: 'err', text: 'Someone already decided this request.' }); refreshBoth(); return; }
    if (err.code === 'OWN_REQUEST') return setBanner({ kind: 'err', text: 'You cannot decide your own request.' });
    if (err.code === 'SECOND_OFFICER_REQUIRED') return setBanner({ kind: 'err', text: 'A flagged payment needs a second, different officer.' });
    setBanner({ kind: 'err', text: d.text });
  }

  async function confirm(r) {
    if (busyId) return;
    setBusyId(r.id); setBanner(null);
    refs.current[r.id] ||= newReference();
    try {
      const done = await confirmRequest(r.id, refs.current[r.id]);
      delete refs.current[r.id];
      setBanner(done && done.status === 'pending'
        ? { kind: 'ok', text: `First approval recorded. A different officer must confirm this ${KIND[r.kind].toLowerCase()} of ${kesFromMinor(r.amount_minor)} before it posts.` }
        : { kind: 'ok', text: `${KIND[r.kind]} of ${kesFromMinor(r.amount_minor)} confirmed and posted to ${whoOf(r)}'s account.` });
      refreshBoth();
    } catch (err) {
      if (err.code === 'INSUFFICIENT_FUNDS') {
        const bal = await accountBalanceOf(r.membership_id).catch(() => null);
        setBanner({ kind: 'err', text: bal != null ? `${whoOf(r)} has ${kesFromMinor(bal)}, which is less than ${kesFromMinor(r.amount_minor)}. Reject this request and tell them why.` : `${describe(err).text} Reject this request and tell them why.` });
      } else fail(err, r, 'Confirm');
    } finally { setBusyId(null); }
  }

  async function reject(r) {
    const reason = (rejecting && rejecting.reason || '').trim();
    if (!reason) { setRejecting(x => ({ ...x, error: 'Write a reason before you reject this request.' })); const el = document.getElementById(`reason-${r.id}`); if (el) el.focus(); return; }
    if (busyId) return;
    setBusyId(r.id); setBanner(null);
    try {
      await rejectRequest(r.id, reason);
      setBanner({ kind: 'ok', text: `Request from ${whoOf(r)} rejected. They can see your reason.` });
      setRejecting(null); refreshBoth();
    } catch (err) {
      if (err.status === 400) setRejecting(x => ({ ...x, error: err.message }));
      else fail(err, r, 'Reject');
    } finally { setBusyId(null); }
  }

  if (blocked) return <ErrorPage code={blocked} />;
  return (
    <div className="sam-stack">
      {banner && <ErrorBanner kind={banner.kind}>{banner.text}</ErrorBanner>}
      <section className="glass sam-stack" aria-labelledby="requests-title">
        <div className="sam-head">
          <div><div className="eyebrow">savings.post</div><h2 id="requests-title" className="font-serif text-2xl">Member deposit and withdrawal requests</h2></div>
          <div className="seg" role="tablist" aria-label="Which requests">
            <button type="button" role="tab" aria-selected={tab === 'pending'} onClick={() => setTab('pending')}>Pending ({count})</button>
            <button type="button" role="tab" aria-selected={tab === 'decided'} onClick={() => { setDecidedWanted(true); setTab('decided'); }}>Decided</button>
          </div>
        </div>

        <Body status={list.status} error={list.error} reload={list.reload}
          emptyTitle={tab === 'pending' ? 'No requests are waiting.' : 'No decided requests yet.'}
          emptyHint={tab === 'pending' ? 'New member requests appear here.' : undefined}>
          <div className="table-wrap">
            <table className="sam-table">
              <thead><tr><th>Member</th><th>Type</th><th>Method</th><th className="sam-r">Amount</th><th>Details</th><th>Requested</th><th>{tab === 'pending' ? 'Decision' : 'Status'}</th></tr></thead>
              <tbody>
                {list.items.flatMap(r => {
                  const row = (
                    <tr key={r.id} aria-busy={busyId === r.id}>
                      <td>{whoOf(r)}</td>
                      <td><span className={`chip ${r.kind === 'deposit' ? 'up' : 'warn'}`}>{KIND[r.kind]}</span></td>
                      <td>{METHOD[r.method]}{r.source === 'manual' && <span className="chip lock">Manual</span>}{r.source === 'stk' && <span className="chip">M-Pesa prompt</span>}</td>
                      <td className="sam-r">{kesFromMinor(r.amount_minor)}</td>
                      <td>{detailsOf(r)}{r.mpesa_receipt && <span className="sam-sub">Receipt {r.mpesa_receipt}</span>}{(r.flags || []).map(f => <span key={f} className="chip warn">{FLAG[f] || f}</span>)}</td>
                      <td>{dTime(r.created_at)}</td>
                      <td>
                        {r.status !== 'pending' ? (
                          <><RequestChip status={r.status} />{r.status === 'rejected' && r.reject_reason && <span className="sam-sub">Reason: {r.reject_reason}</span>}</>
                        ) : mine(r) ? (
                          <span className="chip lock">You cannot decide your own request</span>
                        ) : (
                          <div className="sam-actions">
                            <button type="button" className="btn small" disabled={busyId === r.id} onClick={() => confirm(r)}>{busyId === r.id && !rejecting ? 'Confirming...' : (r.awaiting_second_approval ? 'Give second approval' : (r.flags || []).length ? 'Give first approval' : 'Confirm')}</button>
                            <button type="button" className="btn warn small" disabled={busyId === r.id} onClick={() => setRejecting({ id: r.id, reason: '', error: '' })}>Reject</button>
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                  if (!rejecting || rejecting.id !== r.id || r.status !== 'pending') return [row];
                  return [row, (
                    <tr key={`${r.id}-reject`} className="sam-reject-row">
                      <td colSpan={COLS}>
                        <div className="sam-form">
                          <Field id={`reason-${r.id}`} label="Reason the member will see" error={rejecting.error}>
                            <textarea value={rejecting.reason} onChange={e => setRejecting(x => ({ ...x, reason: e.target.value, error: '' }))} />
                          </Field>
                          <div className="sam-row-gap">
                            <button type="button" className="btn warn small" disabled={busyId === r.id} onClick={() => reject(r)}>{busyId === r.id ? 'Rejecting...' : 'Reject request'}</button>
                            <button type="button" className="btn ghost small" disabled={busyId === r.id} onClick={() => setRejecting(null)}>Cancel</button>
                          </div>
                        </div>
                      </td>
                    </tr>
                  )];
                })}
              </tbody>
            </table>
          </div>
          <LoadMore paged={list} />
        </Body>

        <div className="rules">
          <span>Confirming a request posts the real ledger entry. Rejecting needs a reason.</span>
          <span>Nobody decides their own request.</span>
          <span>A withdrawal above the member's balance cannot be confirmed.</span>
          <span>A flagged payment needs two different officers.</span>
        </div>
      </section>
      {can('savings.reverse') && <ReversalRequests />}
    </div>
  );
}