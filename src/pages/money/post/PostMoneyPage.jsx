/* PostMoneyPage: an officer (savings.post) posts a deposit or a withdrawal on a member's account. A deposit is a MANUAL entry: it needs the M-Pesa receipt code and the payer's phone.
 * One reference per submit: created when the form opens, reused on every retry, replaced only after a success. */
import { useRef, useState } from 'react';
import { useSession } from '../../../lib/session.jsx';
import { parseAmount, kesFromMinor, newReference } from '../../../lib/format.js';
import { listAccounts, postMoney } from '../../../api/money.js';
import Field from '../../../components/Field.jsx';
import ErrorBanner from '../../../components/ErrorBanner.jsx';
import ErrorPage from '../../../components/ErrorPage.jsx';
import { Body } from '../common.jsx';
import { failure, initialsOf, isPhone, wirePhone, usePaged } from '../helpers.js';

export default function PostMoneyPage() {
  const { saccoId, toast } = useSession();
  const accounts = usePaged(async page => { const r = await listAccounts(saccoId, page || 1); return { items: r.items, next: r.hasMore ? r.page + 1 : null }; }, [saccoId]);
  const [query, setQuery] = useState('');
  const [account, setAccount] = useState(null);
  const [kind, setKind] = useState('deposit');
  const [amount, setAmount] = useState('');
  const [note, setNote] = useState('');
  const [receipt, setReceipt] = useState('');
  const [phone, setPhone] = useState('');
  const [errors, setErrors] = useState({});
  const [banner, setBanner] = useState(null);
  const [sending, setSending] = useState(false);
  const [blocked, setBlocked] = useState(null);
  const [reference, setReference] = useState(newReference);
  const busy = useRef(false);

  const q = query.trim().toLowerCase();
  const matches = accounts.items.filter(a => q && `${a.name || ''} ${a.email || ''} ${a.code || ''}`.toLowerCase().includes(q)).slice(0, 6);
  const current = account && (accounts.items.find(a => a.account_id === account.account_id) || account);

  function validate() {
    const e = {};
    const text = amount.replace(/[,\s]/g, '').replace(/^KES/i, '');
    if (!account) e.account = 'Choose a member account.';
    if (!(parseAmount(amount) > 0)) e.amount = 'Enter an amount greater than zero.';
    else if (/\.\d{3,}/.test(text)) e.amount = 'Use at most 2 decimal places.';
    if (kind === 'deposit') {
      if (!/^[A-Za-z0-9]{8,12}$/.test(receipt.trim())) e.receipt = 'Enter the M-Pesa receipt code, like QGH7X2K9LM.';
      if (!isPhone(phone)) e.phone = 'Enter the payer\'s Safaricom number like 0712 345 678.';
    }
    return e;
  }

  async function submit(ev) {
    ev.preventDefault();
    if (busy.current) return;
    const e = validate(); setErrors(e);
    const first = ['account', 'amount', 'receipt', 'phone'].find(k => e[k]);
    if (first) { const el = document.getElementById({ account: 'pm-search', amount: 'pm-amount', receipt: 'pm-receipt', phone: 'pm-phone' }[first]); if (el) el.focus(); return; }
    busy.current = true; setSending(true); setBanner(null);
    const value = parseAmount(amount);
    try {
      const done = await postMoney(account.account_id, kind, { amount: value, reference, note: note.trim(), mpesaReceipt: receipt.trim().toUpperCase(), phone: wirePhone(phone) });
      toast(done && done.queued
        ? `Deposit of ${kesFromMinor(Math.round(value * 100))} is flagged. It is saved and waits for a second officer.`
        : `${kind === 'deposit' ? 'Deposit' : 'Withdrawal'} of ${kesFromMinor(Math.round(value * 100))} posted.`);
      setAmount(''); setNote(''); setReceipt(''); setPhone(''); setErrors({}); setReference(newReference()); accounts.refresh();
    } catch (err) {
      const f = failure(err, 'Post');
      if (f.page) setBlocked(f.page);
      else setBanner({ kind: f.offline ? 'warn' : 'err', text: f.text });   // the form stays filled and the reference stays the same
    } finally { busy.current = false; setSending(false); }
  }

  if (blocked) return <ErrorPage code={blocked} />;
  return (
    <section className="glass sam-stack" aria-labelledby="pm-title">
      <div className="sam-head"><div><div className="eyebrow">savings.post</div><h2 id="pm-title" className="font-serif text-2xl">Post money</h2></div></div>
      <Body status={accounts.status} error={accounts.error} reload={accounts.reload} emptyTitle="No savings accounts yet." emptyHint="An account opens when an officer posts a member's first deposit.">
        <form className="sam-form" onSubmit={submit} noValidate>
          <Field id="pm-search" label="Member account" error={errors.account}>
            <input type="search" autoComplete="off" placeholder="Search by name or account" value={query} onChange={e => { setQuery(e.target.value); if (errors.account) setErrors(x => ({ ...x, account: undefined })); }} />
          </Field>
          {matches.length > 0 && (
            <div className="sam-results" role="listbox" aria-label="Matching accounts">
              {matches.map(a => (
                <button type="button" role="option" aria-selected={account && account.account_id === a.account_id} key={a.account_id} className="row sam-item" onClick={() => { setAccount(a); setQuery(''); }}>
                  <span className="ico" aria-hidden="true" style={{ background: 'var(--teal)' }}>{initialsOf(a.name || a.email)}</span>
                  <span><span className="title">{a.name || a.email}</span><span className="sub">{a.code ? `Account ${a.code}` : `Account ${a.account_id}`}</span></span>
                  <span className="amt">{kesFromMinor(a.balance)}</span>
                </button>
              ))}
            </div>
          )}
          {current && (
            <div className="sam-pick"><span><b>{current.name || current.email}</b> <span className="muted">balance {kesFromMinor(current.balance)}</span></span>
              <button type="button" className="btn ghost small" onClick={() => setAccount(null)}>Change</button></div>
          )}

          <div className="field">
            <span id="pm-kind">What are you posting?</span>
            <div className="seg sam-switch" role="tablist" aria-labelledby="pm-kind">
              {[['deposit', 'Deposit'], ['withdrawal', 'Withdrawal']].map(([key, label]) => <button key={key} type="button" role="tab" aria-selected={kind === key} onClick={() => setKind(key)}>{label}</button>)}
            </div>
          </div>
          <Field id="pm-amount" label="Amount (KES)" error={errors.amount}>
            <input inputMode="decimal" autoComplete="off" placeholder="12,000" value={amount} onChange={e => { setAmount(e.target.value); if (errors.amount) setErrors(x => ({ ...x, amount: undefined })); }} />
          </Field>
          {kind === 'deposit' && (
            <>
              <Field id="pm-receipt" label="M-Pesa receipt code" error={errors.receipt}>
                <input autoComplete="off" placeholder="QGH7X2K9LM" maxLength={12} value={receipt} onChange={e => { setReceipt(e.target.value); if (errors.receipt) setErrors(x => ({ ...x, receipt: undefined })); }} />
              </Field>
              <Field id="pm-phone" label="Payer's phone" error={errors.phone}>
                <input inputMode="tel" autoComplete="off" placeholder="0712 345 678" value={phone} onChange={e => { setPhone(e.target.value); if (errors.phone) setErrors(x => ({ ...x, phone: undefined })); }} />
              </Field>
            </>
          )}
          <Field id="pm-note" label="Note (optional)">
            <input autoComplete="off" placeholder="Cash at the office" maxLength={200} value={note} onChange={e => setNote(e.target.value)} />
          </Field>
          {banner && <ErrorBanner kind={banner.kind}>{banner.text}</ErrorBanner>}
          <button type="submit" className="btn" disabled={sending}>{sending ? 'Posting...' : 'Post'}</button>
          <p className="sam-note">A deposit is marked "manual" in the ledger and one M-Pesa receipt can be recorded once. A large or flagged deposit waits for a second officer. A withdrawal posts straight away unless it is flagged.</p>
        </form>
      </Body>
    </section>
  );
}