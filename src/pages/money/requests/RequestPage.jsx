/* RequestPage: the Deposit and Withdraw pages are the same page with a different `kind`.
 * A request is not money: nothing here changes the balance. An officer confirms it on Requests, and only then does the ledger change. */
import { useRef, useState } from 'react';
import { useSession } from '../../../lib/session.jsx';
import { useAsync } from '../../../lib/useAsync.js';
import { dTime, parseAmount, kes, kesFromMinor, fromMinor, newReference } from '../../../lib/format.js';
import { createRequest } from '../../../api/requests.js';
import { getPayIn } from '../../../api/payin.js';
import { getMyAccount } from '../../../api/money.js';
import Field from '../../../components/Field.jsx';
import ErrorBanner from '../../../components/ErrorBanner.jsx';
import ErrorPage from '../../../components/ErrorPage.jsx';
import PayInView from '../../../components/PayInView.jsx';
import { Loading } from '../../../components/States.jsx';
import MethodSwitch from './MethodSwitch.jsx';
import RequestHistory from './RequestHistory.jsx';
import { Body } from '../common.jsx';
import { isPhone, wirePhone, failure } from '../helpers.js';

const COPY = {
  deposit: {
    title: 'Deposit to my savings', switchLabel: 'How will you pay?', button: 'Send deposit request', again: 'Send',
    sent: 'Deposit request sent. An officer will confirm it and it shows in My savings.', phoneLabel: 'M-Pesa phone number you paid from',
    refLabel: 'Reference on your bank receipt', refHolder: 'TRF-88213', refError: 'Enter the reference from your bank receipt.'
  },
  withdrawal: {
    title: 'Withdraw from my savings', switchLabel: 'Where should the money go?', button: 'Send withdrawal request', again: 'Send',
    sent: 'Withdrawal request sent. An officer will confirm it and it shows in My savings.', phoneLabel: 'M-Pesa phone number to receive the money',
    refLabel: 'Account number', refHolder: '0123456789', refError: 'Enter your account number, 6 to 20 digits.'
  }
};

/* What the SACCO's officers set under Pay-in details. Nothing here is a sample: with no details set the page says so. */
/* A withdrawal sends money out of the SACCO, so it needs no pay-in details and is never blocked by them. */
function WhatHappensNext() {
  return (
    <ol className="sam-steps">
      <li>Enter the amount and where the money should go.</li>
      <li>An officer checks your balance and sends the money.</li>
      <li>The status below changes to Confirmed or Rejected. A rejection always shows a reason.</li>
    </ol>
  );
}

function HowToPay({ method, pay }) {
  if (pay.status === 'loading') return <Loading lines={3} />;
  if (pay.status === 'error') return <ErrorBanner onRetry={pay.reload}>We could not load the pay-in details. Try again.</ErrorBanner>;
  const details = pay.data.details;
  if (!details) return <ErrorBanner kind="warn">Pay-in details not set. Ask an officer of your SACCO to set them. You cannot send a request until they are.</ErrorBanner>;
  const till = details.mpesa_type === 'till';
  const scheduled = pay.data.scheduled;
  return (
    <>
      {scheduled && <ErrorBanner kind="info">The pay-in details are changing on {dTime(scheduled.go_live_at)}. Until then, pay to the details shown below. If you were not told about this change, ask an officer before you pay.</ErrorBanner>}
      {method === 'mpesa' ? (
        <ol className="sam-steps">
          <li>Open M-Pesa on your phone and choose Lipa na M-Pesa, then {till ? 'Buy Goods and Services' : 'Pay Bill'}.</li>
          <li>Enter the {till ? 'till' : 'business'} number{till ? '' : ' and the account number'} shown below, then the amount and your M-Pesa PIN.</li>
          <li>Check the name M-Pesa shows. If it is not the name below, stop and ask an officer.</li>
          <li>Come back here, enter the same amount and the phone number you paid from, then send the request.</li>
        </ol>
      ) : (
        <ol className="sam-steps">
          <li>Pay into the bank account shown below.</li>
          <li>Come back here, enter the amount, the bank you paid from and the reference on your receipt, then send the request.</li>
        </ol>
      )}
      <PayInView details={details} />
    </>
  );
}

export default function RequestPage({ kind }) {
  const { saccoId } = useSession();
  const t = COPY[kind];
  const withdrawing = kind === 'withdrawal';
  const [method, setMethod] = useState('mpesa');
  const [form, setForm] = useState({ amount: '', phone: '', bank: '', ref: '' });
  const [errors, setErrors] = useState({});
  const [banner, setBanner] = useState(null);          // { kind: 'ok' | 'err' | 'warn', text }
  const [sending, setSending] = useState(false);
  const [blocked, setBlocked] = useState(null);        // '403' | '423': the whole page is replaced
  const [reference, setReference] = useState(newReference);   // one per form open, kept on every retry, replaced only after a success
  const [sentCount, setSentCount] = useState(0);
  const busy = useRef(false);

  const pay = useAsync(() => (withdrawing ? Promise.resolve('skip') : getPayIn(saccoId)), [saccoId, kind], { isEmpty: () => false });
  const details = !withdrawing && pay.status === 'ready' ? pay.data.details : null;
  const notSet = !withdrawing && pay.status === 'ready' && !details;
  /* until the details have loaded, a deposit cannot say where to pay */
  const payUnready = !withdrawing && pay.status !== 'ready';
  /* a deposit by a method the SACCO does not offer cannot be paid anywhere */
  const methodOff = !withdrawing && !!details && (method === 'mpesa' ? !details.mpesa_number : !details.bank_name);

  const account = useAsync(() => (withdrawing ? getMyAccount(saccoId) : Promise.resolve('skip')), [saccoId, kind], { isEmpty: () => false });
  const balance = withdrawing && account.status === 'ready' ? (account.data ? account.data.balance : 0) : null;
  const noBalance = withdrawing && account.status === 'ready' && !(balance > 0);

  const set = key => e => { setForm(f => ({ ...f, [key]: e.target.value })); if (errors[key]) setErrors(x => ({ ...x, [key]: undefined })); };

  function validate() {
    const e = {};
    const amount = parseAmount(form.amount);
    if (!(amount > 0)) e.amount = 'Enter an amount greater than zero.';
    else if (!Number.isInteger(amount)) e.amount = 'Enter whole shillings, for example 5,000.';
    else if (withdrawing && balance != null && amount * 100 > balance) e.amount = `You can withdraw up to ${kesFromMinor(balance)}.`;
    if (method === 'mpesa') { if (!isPhone(form.phone)) e.phone = 'Enter a Safaricom number like 0712 345 678 or +254 712 345 678.'; }
    else {
      if (form.bank.trim().length < 2) e.bank = 'Enter the name of the bank.';
      const ref = form.ref.trim();
      if (withdrawing ? !/^\d{6,20}$/.test(ref.replace(/\s/g, '')) : ref.length < 3) e.ref = t.refError;
    }
    return e;
  }

  async function submit(ev) {
    ev.preventDefault();
    if (busy.current || noBalance || notSet || methodOff || payUnready) return;
    const e = validate();
    setErrors(e);
    const first = ['amount', 'phone', 'bank', 'ref'].find(k => e[k]);
    if (first) { const el = document.getElementById(`rq-${kind}-${first}`); if (el) el.focus(); return; }
    busy.current = true; setSending(true); setBanner(null);
    const body = { kind, method, amount: parseAmount(form.amount), reference };
    if (method === 'mpesa') body.phone = wirePhone(form.phone);
    else { body.bank_name = form.bank.trim(); body.account_ref = withdrawing ? form.ref.replace(/\s/g, '') : form.ref.trim(); }
    try {
      await createRequest(saccoId, body);
      setBanner({ kind: 'ok', text: t.sent });
      setForm({ amount: '', phone: '', bank: '', ref: '' }); setErrors({});
      setReference(newReference());
      setSentCount(n => n + 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (err) {
      const f = failure(err, t.again);
      if (f.page) setBlocked(f.page);
      else setBanner({ kind: f.offline ? 'warn' : 'err', text: f.text });   // the reference stays the same, so pressing again cannot send twice
    } finally { busy.current = false; setSending(false); }
  }

  if (blocked) return <ErrorPage code={blocked} />;
  const id = key => `rq-${kind}-${key}`;
  return (
    <div className="sam-stack">
      {banner && banner.kind === 'ok' && <ErrorBanner kind="ok">{banner.text}</ErrorBanner>}
      <div className="sam-grid">
        <form className="glass sam-form sam-s7" onSubmit={submit} noValidate aria-label={t.title}>
          <div className="sam-head"><div><div className="eyebrow">New request</div><h2 className="font-serif text-2xl">{t.title}</h2></div><span className="chip lock">savings.request</span></div>

          {withdrawing && (
            <Body status={account.status} error={account.error} reload={account.reload} lines={2}>
              <div className="kv"><div><span>Available balance</span><b>{kes(fromMinor(balance || 0))}</b></div></div>
              {noBalance && <p className="muted">You have no balance to withdraw.</p>}
            </Body>
          )}

          <MethodSwitch label={t.switchLabel} value={method} onChange={setMethod} />

          <Field id={id('amount')} label="Amount (KES)" error={errors.amount}>
            <input inputMode="numeric" autoComplete="off" placeholder="5,000" value={form.amount} onChange={set('amount')} />
          </Field>
          {method === 'mpesa' ? (
            <Field id={id('phone')} label={t.phoneLabel} error={errors.phone}>
              <input inputMode="tel" autoComplete="tel" placeholder="0712 345 678" value={form.phone} onChange={set('phone')} />
            </Field>
          ) : (
            <>
              <Field id={id('bank')} label="Bank name" error={errors.bank}>
                <input autoComplete="off" placeholder="Equity Bank" value={form.bank} onChange={set('bank')} />
              </Field>
              <Field id={id('ref')} label={t.refLabel} error={errors.ref}>
                <input inputMode={withdrawing ? 'numeric' : 'text'} autoComplete="off" placeholder={t.refHolder} value={form.ref} onChange={set('ref')} />
              </Field>
            </>
          )}

          {banner && banner.kind !== 'ok' && <ErrorBanner kind={banner.kind}>{banner.text}</ErrorBanner>}
          {notSet && <ErrorBanner kind="warn">Pay-in details not set. Ask an officer of your SACCO to set them.</ErrorBanner>}
          {methodOff && <ErrorBanner kind="warn">This SACCO does not take {method === 'mpesa' ? 'M-Pesa' : 'bank'} payments. Choose the other way to pay.</ErrorBanner>}
          <button type="submit" className="btn" disabled={sending || noBalance || notSet || methodOff || payUnready}>{sending ? 'Sending...' : t.button}</button>
          <p className="sam-note">This sends a request only. Your balance changes after an officer confirms it. Each request has its own reference, so a retry never sends it twice.</p>
        </form>

        <aside className="glass sam-stack sam-s5" aria-label={withdrawing ? 'What happens next' : 'How to pay'}>
          <div><div className="eyebrow">{withdrawing ? 'Next' : 'Pay in'}</div><h3 className="font-serif text-xl">{withdrawing ? 'What happens next' : 'How to pay'}</h3></div>
          {withdrawing ? <WhatHappensNext /> : <HowToPay method={method} pay={pay} />}
        </aside>

        <div className="sam-s12"><RequestHistory kind={kind} reloadKey={sentCount} /></div>
      </div>
    </div>
  );
}