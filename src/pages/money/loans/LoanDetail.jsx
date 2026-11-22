/* LoanDetail: one loan, its decisions timeline, and only the buttons this person may use.
 *   loan.approve + Waiting   -> Approve / Reject (a reason; a rejection needs one)
 *   loan.disburse + Approved -> Disburse (one reference per press)
 *   loan.repay + Disbursed   -> Record repayment (one reference per press) */
import { useRef, useState } from 'react';
import { useSession } from '../../../lib/session.jsx';
import { useAsync } from '../../../lib/useAsync.js';
import { parseAmount, kes, kesFromMinor, dLong, dTime, newReference } from '../../../lib/format.js';
import { getLoan, decideLoan, disburseLoan, repayLoan } from '../../../api/loans.js';
import { describe } from '../../../lib/errors.js';
import BackButton from '../../../components/BackButton.jsx';
import Field from '../../../components/Field.jsx';
import ErrorBanner from '../../../components/ErrorBanner.jsx';
import ErrorPage from '../../../components/ErrorPage.jsx';
import { Body, LoanChip } from '../common.jsx';
import { instalmentMinor, whoOf } from '../helpers.js';

export default function LoanDetail({ id, onBack }) {
  const { can } = useSession();
  const loan = useAsync(() => getLoan(id), [id], { isEmpty: () => false });   // a loan with no decisions yet is not an empty page
  const [banner, setBanner] = useState(null);
  const [panel, setPanel] = useState(null);         // null | { decision: 'approve' | 'reject', reason, error }
  const [amount, setAmount] = useState('');
  const [amountError, setAmountError] = useState('');
  const [busy, setBusy] = useState(false);
  const [blocked, setBlocked] = useState(null);
  const [disburseRef, setDisburseRef] = useState(newReference);
  const [repayRef, setRepayRef] = useState(newReference);
  const lock = useRef(false);

  async function run(work, again) {
    if (lock.current) return;
    lock.current = true; setBusy(true); setBanner(null);
    try { await work(); loan.reload(); }
    catch (err) {
      if (err.status === 0) setBanner({ kind: 'warn', text: `We could not confirm that went through. Press ${again} again; it will not be done twice.` });
      else if (err.code === 'LOAN_SAME_OFFICER') setBanner({ kind: 'err', text: 'A different officer must give the second approval.' });
      else { const d = describe(err, { mode: 'page' }); if (d.page === '403' && err.code !== 'LOAN_SAME_OFFICER') setBlocked('403'); else if (d.page === '423') setBlocked('423'); else setBanner({ kind: 'err', text: d.text }); }
    } finally { lock.current = false; setBusy(false); }
  }

  const decide = l => {
    const reason = (panel.reason || '').trim();
    if (panel.decision === 'reject' && !reason) { setPanel(p => ({ ...p, error: 'Write a reason before you reject this loan.' })); return; }
    run(async () => { await decideLoan(l.id, { step: l.approvals_count + 1, decision: panel.decision, reason }); setBanner({ kind: 'ok', text: panel.decision === 'approve' ? 'Approval recorded.' : 'Loan rejected. The member can see your reason.' }); setPanel(null); }, panel.decision === 'approve' ? 'Approve' : 'Reject');
  };
  const disburse = l => run(async () => { await disburseLoan(l.id, disburseRef); setDisburseRef(newReference()); setBanner({ kind: 'ok', text: 'Loan paid out.' }); }, 'Disburse');
  const repay = l => {
    const value = parseAmount(amount);
    if (!(value > 0)) { setAmountError('Enter an amount greater than zero.'); const el = document.getElementById('repay-amount'); if (el) el.focus(); return; }
    setAmountError('');
    run(async () => { await repayLoan(l.id, { amount: value, reference: repayRef }); setRepayRef(newReference()); setAmount(''); setBanner({ kind: 'ok', text: `Repayment of ${kes(value)} recorded.` }); }, 'Record repayment');
  };

  if (blocked) return <ErrorPage code={blocked} />;
  return (
    <div className="sam-stack">
      <BackButton label="Back to loans" onClick={onBack} />
      {banner && <ErrorBanner kind={banner.kind}>{banner.text}</ErrorBanner>}
      <Body status={loan.status} error={loan.error} reload={loan.reload} lines={5}>
        {loan.data && (() => {
          const l = loan.data;
          const pct = l.principal ? Math.min(100, Math.round(l.repaid_total * 100 / l.principal)) : 0;
          const canDecide = can('loan.approve') && l.status === 'requested';
          const canDisburse = can('loan.disburse') && l.status === 'approved';
          const canRepay = can('loan.repay') && l.status === 'disbursed';
          const waitingSteps = l.status === 'requested' ? Array.from({ length: Math.max(0, l.required_approvals - l.approvals_count) }, (_, i) => l.approvals_count + i + 1) : [];
          return (
            <div className="sam-grid">
              <section className="glass sam-stack sam-s7" aria-labelledby="ld-title">
                <div className="detail-head">
                  <div><div className="eyebrow">Loan #{l.id}</div><h2 id="ld-title" className="font-serif text-2xl">{kesFromMinor(l.principal)}</h2><p className="muted">{whoOf(l)} · {l.term_months} months · asked {dLong(l.created_at)}</p></div>
                  <LoanChip status={l.status} />
                </div>
                <div className="kv">
                  <div><span>Approvals</span><b>{l.approvals_count} of {l.required_approvals}</b></div>
                  <div><span>Repaid</span><b>{kesFromMinor(l.repaid_total)}</b></div>
                  <div><span>Monthly part (estimate)</span><b>{kesFromMinor(instalmentMinor(l))}</b></div>
                </div>
                {(l.status === 'disbursed' || l.status === 'repaid') && <div className="sam-bar"><div className="bar-track" role="img" aria-label={`${pct} percent repaid`}><i style={{ width: `${pct}%` }} /></div><p className="sam-note">{pct}% repaid. The monthly part is an equal share before any interest; due dates are not set in the system yet.</p></div>}

                {(canDecide || canDisburse || canRepay) && (
                  <div className="sam-stack tight">
                    {canDecide && !panel && <div className="sam-row-gap"><button type="button" className="btn" disabled={busy} onClick={() => setPanel({ decision: 'approve', reason: '', error: '' })}>Approve</button><button type="button" className="btn warn" disabled={busy} onClick={() => setPanel({ decision: 'reject', reason: '', error: '' })}>Reject</button></div>}
                    {canDecide && panel && (
                      <div className="sam-form">
                        <Field id="ld-reason" label={panel.decision === 'reject' ? 'Reason the member will see' : 'Reason (optional)'} error={panel.error}>
                          <textarea value={panel.reason} onChange={e => setPanel(p => ({ ...p, reason: e.target.value, error: '' }))} />
                        </Field>
                        <div className="sam-row-gap">
                          <button type="button" className={`btn${panel.decision === 'reject' ? ' warn' : ''}`} disabled={busy} onClick={() => decide(l)}>{busy ? 'Sending...' : panel.decision === 'approve' ? 'Confirm approval' : 'Reject loan'}</button>
                          <button type="button" className="btn ghost" disabled={busy} onClick={() => setPanel(null)}>Cancel</button>
                        </div>
                      </div>
                    )}
                    {canDisburse && <div className="sam-row-gap"><button type="button" className="btn" disabled={busy} onClick={() => disburse(l)}>{busy ? 'Paying out...' : 'Disburse'}</button><span className="sam-note">Pays the loan into the member's savings account.</span></div>}
                    {canRepay && (
                      <div className="sam-form">
                        <Field id="repay-amount" label="Repayment amount (KES)" error={amountError}><input inputMode="numeric" autoComplete="off" placeholder="8,500" value={amount} onChange={e => { setAmount(e.target.value); setAmountError(''); }} /></Field>
                        <div><button type="button" className="btn" disabled={busy} onClick={() => repay(l)}>{busy ? 'Recording...' : 'Record repayment'}</button></div>
                      </div>
                    )}
                  </div>
                )}
              </section>

              <section className="glass sam-stack sam-s5" aria-labelledby="dec-title">
                <div><div className="eyebrow">Decisions</div><h3 id="dec-title" className="font-serif text-xl">Who decided what</h3></div>
                <div className="timeline">
                  {l.decisions.map(d => (
                    <div key={`${d.step}-${d.created_at}`}>
                      <b>Step {d.step}: {d.decision === 'approve' ? 'Approved' : 'Rejected'}</b>
                      <small>Officer {d.decided_by_membership_id} · {dTime(d.created_at)}</small>
                      {d.reason && <span className="muted">Reason: {d.reason}</span>}
                    </div>
                  ))}
                  {waitingSteps.map(step => <div className="wait" key={`wait-${step}`}><b>Step {step}: waiting</b><small>A decision from {step > 1 ? 'a different officer' : 'an officer'}</small></div>)}
                  {l.decisions.length === 0 && waitingSteps.length === 0 && <p className="muted">No decisions on this loan.</p>}
                </div>
              </section>
            </div>
          );
        })()}
      </Body>
    </div>
  );
}