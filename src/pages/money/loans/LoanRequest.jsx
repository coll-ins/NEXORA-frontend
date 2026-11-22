/* LoanRequest: a member asks for a loan (loan.request). Shows a plain estimate of the monthly part before any interest. */
import { useRef, useState } from 'react';
import { useSession } from '../../../lib/session.jsx';
import { parseAmount, kes } from '../../../lib/format.js';
import { requestLoan } from '../../../api/loans.js';
import BackButton from '../../../components/BackButton.jsx';
import Field from '../../../components/Field.jsx';
import ErrorBanner from '../../../components/ErrorBanner.jsx';
import ErrorPage from '../../../components/ErrorPage.jsx';
import { failure } from '../helpers.js';

export default function LoanRequest({ onBack, onSent }) {
  const { saccoId } = useSession();
  const [amount, setAmount] = useState('');
  const [term, setTerm] = useState('');
  const [errors, setErrors] = useState({});
  const [banner, setBanner] = useState(null);
  const [sending, setSending] = useState(false);
  const [blocked, setBlocked] = useState(null);
  const busy = useRef(false);
  const principal = parseAmount(amount);
  const months = Number(term);
  const estimate = principal > 0 && Number.isInteger(months) && months >= 1 && months <= 360 ? Math.ceil(principal / months) : null;

  async function submit(ev) {
    ev.preventDefault();
    if (busy.current) return;
    const e = {};
    if (!(principal > 0) || !Number.isInteger(principal)) e.amount = 'Enter an amount greater than zero, in whole shillings.';
    if (!Number.isInteger(months) || months < 1 || months > 360) e.term = 'Enter a whole number of months from 1 to 360.';
    setErrors(e);
    const first = ['amount', 'term'].find(k => e[k]);
    if (first) { const el = document.getElementById(`lr-${first}`); if (el) el.focus(); return; }
    busy.current = true; setSending(true); setBanner(null);
    try { await requestLoan(saccoId, { principal, term_months: months }); onSent(); }
    catch (err) { const f = failure(err, 'Send'); if (f.page) setBlocked(f.page); else setBanner({ kind: f.offline ? 'warn' : 'err', text: f.offline ? 'We could not confirm that went through. Check Loans before you send it again.' : f.text }); }
    finally { busy.current = false; setSending(false); }
  }

  if (blocked) return <ErrorPage code={blocked} />;
  return (
    <div className="sam-stack">
      <BackButton label="Back to loans" onClick={onBack} />
      <form className="glass sam-form" onSubmit={submit} noValidate aria-labelledby="lr-title">
        <div><div className="eyebrow">loan.request</div><h2 id="lr-title" className="font-serif text-2xl">Request a loan</h2></div>
        <Field id="lr-amount" label="Amount (KES)" error={errors.amount}><input inputMode="numeric" autoComplete="off" placeholder="50,000" value={amount} onChange={e => setAmount(e.target.value)} /></Field>
        <Field id="lr-term" label="Term in months" error={errors.term}><input inputMode="numeric" autoComplete="off" placeholder="12" value={term} onChange={e => setTerm(e.target.value)} /></Field>
        {estimate != null && <p className="muted">About {kes(estimate)} a month over {months} months, in equal parts. This is an estimate before any interest; officers decide the final terms.</p>}
        {banner && <ErrorBanner kind={banner.kind}>{banner.text}</ErrorBanner>}
        <button type="submit" className="btn" disabled={sending}>{sending ? 'Sending...' : 'Send loan request'}</button>
      </form>
    </div>
  );
}