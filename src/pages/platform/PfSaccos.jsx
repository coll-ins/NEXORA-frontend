import { useState } from 'react';
import { useSession } from '../../lib/session.jsx';
import { useAsync } from '../../lib/useAsync.js';
import { listSaccos, createSacco, inviteFirstAdmin } from '../../api/platform.js';
import ErrorBanner from '../../components/ErrorBanner.jsx';
import Field from '../../components/Field.jsx';
import Select from '../../components/Select.jsx';
import RulesForm from '../../components/RulesForm.jsx';
import StatusChip from '../../components/StatusChip.jsx';
import { Body } from '../people/shared.jsx';
import { describe } from '../../lib/errors.js';
import { checkRules, emptyRules, rulesBody } from '../../lib/rules.js';
import PfSaccoDetail from './PfSaccoDetail.jsx';
import '../../styles/neo.css';

const CURRENCIES = ['KES', 'USD', 'EUR', 'UGX', 'TZS'];

export default function PfSaccos() {
  const { takeOpen, toast } = useSession();
  const list = useAsync(listSaccos, []);
  const opened = takeOpen('sacco');
  const [openId, setOpenId] = useState(opened);
  const [name, setName] = useState('');
  const [currency, setCurrency] = useState('KES');
  const [rules, setRules] = useState(emptyRules);
  const [errors, setErrors] = useState({});
  const [notice, setNotice] = useState(null);
  const [created, setCreated] = useState(null);
  const [busy, setBusy] = useState(false);
  const [adminPhone, setAdminPhone] = useState('');
  const [adminCode, setAdminCode] = useState(null);
  const [adminError, setAdminError] = useState(null);
  /* the SACCO the owner just made goes to the top of the list, as the scenario table says, whatever order the list came back in */
  const rows = created
    ? [created, ...(list.data || []).filter(s => s.id !== created.id)]
    : (list.data || []);

  if (openId) {
    return (
      <PfSaccoDetail
        saccoId={openId}
        onBack={() => { setOpenId(null); list.reload(); }}
      />
    );
  }

  async function submit(event) {
    event.preventDefault();
    const found = { ...(name.trim() ? {} : { name: 'Give the SACCO a name.' }), ...checkRules(rules) };
    if (Object.keys(found).length) {
      setErrors(found);
      return;
    }
    setErrors({});
    setNotice(null);
    setBusy(true);
    try {
      const row = await createSacco({ name: name.trim(), currency, rules: rulesBody(rules) });
      setCreated(row);
      setName('');
      setRules(emptyRules());
      list.reload();
      toast(`${row.name} was created.`);
    } catch (e) {
      const shown = describe(e, { context: 'settings' });
      if (e.fields) setErrors(e.fields);
      else if (e.status === 400 || e.status === 409) setErrors({ name: shown.text });
      else setNotice(shown.text);
    } finally {
      setBusy(false);
    }
  }

  async function makeAdminCode() {
    setAdminError(null);
    setBusy(true);
    try {
      setAdminCode(await inviteFirstAdmin(created.id, adminPhone));
    } catch (e) {
      setAdminError(describe(e, { context: 'member' }).text);
      setAdminCode(null);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="neo-grid">
      <section className="glass neo-span-7 neo-stack tight">
        <div>
          <h2 className="font-serif text-xl">SACCOs</h2>
          <p className="muted text-sm">Every SACCO on NEXORA, with its size and status.</p>
        </div>
        <Body
          status={list.status}
          error={list.error}
          reload={list.reload}
          emptyTitle="No SACCOs yet."
          emptyHint="Create the first one on the right."
        >
          {rows.map(s => (
            <button type="button" key={s.id} className="row" onClick={() => setOpenId(s.id)}>
              <span className="icon" aria-hidden="true">{s.name.slice(0, 1)}</span>
              <span className="grow text-left">
                <span className="title">{s.name}</span>
                <span className="sub">{s.member_count} member{s.member_count === 1 ? '' : 's'} · {s.currency}</span>
              </span>
              <StatusChip status={s.status === 'active' ? 'Active' : 'Suspended'} />
            </button>
          ))}
        </Body>
      </section>

      <section className="glass neo-span-5 neo-stack">
        <b>Create SACCO</b>
        {notice && <ErrorBanner>{notice}</ErrorBanner>}
        {created && (
          <ErrorBanner kind="ok">
            {created.name} was created with 0 members. Next: add the first SACCO admin.
          </ErrorBanner>
        )}
        <form className="neo-stack" onSubmit={submit}>
          <Field id="sacco-new-name" label="Name" error={errors.name}>
            <input id="sacco-new-name" value={name} onChange={e => setName(e.target.value)} disabled={busy} />
          </Field>
          <Field id="sacco-currency" label="Currency">
            <Select
              id="sacco-currency"
              value={currency}
              disabled={busy}
              onChange={setCurrency}
              options={CURRENCIES.map(c => ({ value: c, label: c }))}
            />
          </Field>
          <RulesForm value={rules} onChange={value => { setRules(value); setErrors(current => ({ name: current.name })); }} errors={errors} disabled={busy} />
          <div>
            <button type="submit" className="btn" disabled={busy}>{busy ? 'Creating…' : 'Create SACCO'}</button>
          </div>
        </form>
        {created && (
          <div className="neo-stack tight">
            <b>Next: add the first SACCO admin</b>
            <p className="muted text-sm">
              Only a platform owner may make a SACCO admin. Give them this code in person.
            </p>
            <Field id="first-admin-phone" label="Their phone number" error={adminError}>
              <input
                id="first-admin-phone"
                inputMode="tel"
                value={adminPhone}
                onChange={e => setAdminPhone(e.target.value)}
                placeholder="0712 345 678"
                disabled={busy}
              />
            </Field>
            <div>
              <button type="button" className="btn small" disabled={busy} onClick={makeAdminCode}>
                {busy ? 'Making the code…' : 'Make their join code'}
              </button>
            </div>
            {adminCode && (
              <>
                <div className="neo-code">{adminCode.join_code}</div>
                <ErrorBanner kind="info">
                  Send this to {adminCode.phone} as SACCO admin. It works once and lasts 15 minutes.
                </ErrorBanner>
              </>
            )}
          </div>
        )}
      </section>
    </div>
  );
}
