/* ReversalRequests: reversals one officer asked for. A different officer (savings.reverse) approves or rejects them.
 * Approving appends the opposite ledger entry. An admin may override the loan-cap block with a reason (savings.reverse_override). */
import { useRef, useState } from 'react';
import { useSession } from '../../../lib/session.jsx';
import { kesFromMinor, dTime, newReference } from '../../../lib/format.js';
import { describe } from '../../../lib/errors.js';
import { listReversalRequests, approveReversal, rejectReversal } from '../../../api/money.js';
import ErrorBanner from '../../../components/ErrorBanner.jsx';
import Field from '../../../components/Field.jsx';
import { Body } from '../common.jsx';
import { TX_LABEL, usePaged } from '../helpers.js';

export default function ReversalRequests() {
  const { saccoId, can } = useSession();
  const list = usePaged(() => listReversalRequests(saccoId, 'pending').then(items => ({ items, next: null })), [saccoId]);
  const [banner, setBanner] = useState(null);
  const [busyId, setBusyId] = useState(null);
  const [capBlock, setCapBlock] = useState({});     // request id -> the server's loan-cap sentence
  const [rejecting, setRejecting] = useState(null); // { id, reason, error }
  const refs = useRef({});                           // one reference per approval, reused when the same press is retried

  async function approve(r, override = false) {
    if (busyId) return;
    setBusyId(r.id); setBanner(null);
    refs.current[r.id] ||= newReference();
    try {
      await approveReversal(r.id, { reference: refs.current[r.id], override, reason: r.reason });
      delete refs.current[r.id];
      setBanner({ kind: 'ok', text: `Entry #${r.transaction_id} reversed.` });
      list.refresh();
    } catch (err) {
      if (err.code === 'LOAN_OVER_CAP') setCapBlock(x => ({ ...x, [r.id]: err.message }));
      else if (err.status === 0) setBanner({ kind: 'warn', text: 'We could not confirm that went through. Press Approve again; it will not be posted twice.' });
      else { setBanner({ kind: 'err', text: err.code === 'SECOND_OFFICER_REQUIRED' ? 'A different officer must approve a reversal you asked for.' : describe(err).text }); if (err.code === 'REQUEST_ALREADY_DECIDED') list.refresh(); }
    } finally { setBusyId(null); }
  }

  async function reject(r) {
    const reason = (rejecting && rejecting.reason || '').trim();
    if (reason.length < 10) { setRejecting(x => ({ ...x, error: 'Write at least 10 characters saying why.' })); return; }
    setBusyId(r.id); setBanner(null);
    try { await rejectReversal(r.id, reason); setRejecting(null); setBanner({ kind: 'ok', text: `Reversal of entry #${r.transaction_id} rejected.` }); list.refresh(); }
    catch (err) { setBanner({ kind: 'err', text: err.code === 'SECOND_OFFICER_REQUIRED' ? 'A different officer must decide a reversal you asked for.' : describe(err).text }); }
    finally { setBusyId(null); }
  }

  return (
    <section className="glass sam-stack" aria-labelledby="reversals-title">
      <div className="sam-head"><div><div className="eyebrow">savings.reverse</div><h2 id="reversals-title" className="font-serif text-2xl">Reversal requests</h2></div></div>
      {banner && <ErrorBanner kind={banner.kind}>{banner.text}</ErrorBanner>}
      <Body status={list.status} error={list.error} reload={list.reload} emptyTitle="No reversals are waiting." emptyHint="An officer asks for a reversal from an account's ledger.">
        <div className="table-wrap">
          <table className="sam-table">
            <thead><tr><th>Entry</th><th className="sam-r">Amount</th><th>Reason</th><th>Asked</th><th>Decision</th></tr></thead>
            <tbody>
              {list.items.flatMap(r => [(
                <tr key={r.id} aria-busy={busyId === r.id}>
                  <td>{TX_LABEL[r.type] || r.type}<span className="sam-sub">#{r.transaction_id}</span></td>
                  <td className="sam-r">{kesFromMinor(r.amount)}</td>
                  <td>{r.reason}</td>
                  <td>{dTime(r.created_at)}</td>
                  <td>
                    <div className="sam-actions">
                      {!capBlock[r.id] && <button type="button" className="btn small" disabled={busyId === r.id} onClick={() => approve(r)}>{busyId === r.id ? 'Approving...' : 'Approve'}</button>}
                      {capBlock[r.id] && can('savings.reverse_override') && <button type="button" className="btn warn small" disabled={busyId === r.id} onClick={() => approve(r, true)}>Override and reverse</button>}
                      <button type="button" className="btn warn small" disabled={busyId === r.id} onClick={() => setRejecting({ id: r.id, reason: '', error: '' })}>Reject</button>
                    </div>
                    {capBlock[r.id] && <span className="sam-sub">{capBlock[r.id]}</span>}
                  </td>
                </tr>
              ), ...(rejecting && rejecting.id === r.id ? [(
                <tr key={`${r.id}-reject`} className="sam-reject-row">
                  <td colSpan={5}>
                    <div className="sam-form">
                      <Field id={`rev-reason-${r.id}`} label="Why you are rejecting this" error={rejecting.error}>
                        <textarea value={rejecting.reason} onChange={e => setRejecting(x => ({ ...x, reason: e.target.value, error: '' }))} />
                      </Field>
                      <div className="sam-row-gap">
                        <button type="button" className="btn warn small" disabled={busyId === r.id} onClick={() => reject(r)}>Reject reversal</button>
                        <button type="button" className="btn ghost small" onClick={() => setRejecting(null)}>Cancel</button>
                      </div>
                    </div>
                  </td>
                </tr>
              )] : [])])}
            </tbody>
          </table>
        </div>
      </Body>
      <div className="rules"><span>The officer who asked cannot approve. Approving adds a new ledger entry; nothing is deleted.</span></div>
    </section>
  );
}
