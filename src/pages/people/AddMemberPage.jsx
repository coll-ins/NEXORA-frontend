import { useEffect, useState } from 'react';
import { useSession } from '../../lib/session.jsx';
import { useAsync } from '../../lib/useAsync.js';
import { addMember, addMemberByEmail, listDeclined, listInvited } from '../../api/people.js';
import ErrorBanner from '../../components/ErrorBanner.jsx';
import Field from '../../components/Field.jsx';
import Select from '../../components/Select.jsx';
import StatusChip from '../../components/StatusChip.jsx';
import { Body } from './shared.jsx';
import { ROLE_LABEL } from './data.js';
import { describe } from '../../lib/errors.js';
import '../../styles/neo.css';

const PHONE_RE = /^(?:\+254|254|0)([17]\d{8})$/;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const ROLES = ['member', 'secretary', 'finance_officer', 'loans_officer'];

function secondsLeft(iso) {
  return Math.max(0, Math.round((new Date(iso).getTime() - Date.now()) / 1000));
}

export default function AddMemberPage() {
  const { saccoId, can, toast } = useSession();
  const invited = useAsync(() => listInvited(saccoId), [saccoId]);
  const declined = useAsync(() => listDeclined(saccoId), [saccoId]);
  const [mode, setMode] = useState('phone');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [role, setRole] = useState('member');
  const [fieldError, setFieldError] = useState(null);
  const [notice, setNotice] = useState(null);
  const [made, setMade] = useState(null);
  const [emailed, setEmailed] = useState(null);
  const [wasInvited, setWasInvited] = useState(false);
  const [busy, setBusy] = useState(false);
  const [, setTick] = useState(0);

  const live = made || emailed;
  useEffect(() => {
    if (!live) return undefined;
    const id = setInterval(() => setTick(t => t + 1), 1000);
    return () => clearInterval(id);
  }, [live]);

  const left = live ? secondsLeft(live.expires_at) : 0;

  function chooseMode(next) {
    setMode(next);
    setFieldError(null);
    setNotice(null);
    setMade(null);
    setEmailed(null);
  }

  async function makeCode(number = phone, chosen = role) {
    const clean = String(number).replace(/[\s-]/g, '');
    if (!PHONE_RE.test(clean)) {
      setFieldError('Enter a Safaricom number like 0712 345 678 or +254 712 345 678.');
      return;
    }
    setFieldError(null);
    setNotice(null);
    setEmailed(null);
    setBusy(true);
    const already = (invited.data || []).some(r => r.phone === clean);
    try {
      const row = await addMember(saccoId, { phone: clean, role: chosen });
      setMade(row);
      setWasInvited(already);
      invited.reload();
      declined.reload();
      toast(`Join code made for ${row.phone}.`);
    } catch (e) {
      const shown = describe(e, { context: 'member' });
      if (!e.status) {
        setNotice('We could not confirm that went through. Press Make a join code again; a new code is made and the old one stops working.');
      } else if (e.status === 400 || e.status === 409) setFieldError(shown.text);
      else setNotice(shown.text);
    } finally {
      setBusy(false);
    }
  }

  async function sendEmailCode(address = email, chosen = role) {
    const clean = String(address).trim().toLowerCase();
    if (!EMAIL_RE.test(clean)) {
      setFieldError('Enter the email the person used to create their NEXORA account.');
      return;
    }
    setFieldError(null);
    setNotice(null);
    setMade(null);
    setBusy(true);
    const already = (invited.data || []).some(r => r.email === clean);
    try {
      const row = await addMemberByEmail(saccoId, { email: clean, role: chosen });
      setEmailed({ email: row.email || clean, expires_at: row.expires_at });
      setWasInvited(already);
      invited.reload();
      declined.reload();
      toast(`Join code emailed to ${clean}.`);
    } catch (e) {
      const shown = describe(e, { context: 'member' });
      if (!e.status) {
        setNotice('We could not confirm that went through. Press Email the join code again; a new code is sent and the old one stops working.');
      } else if (e.status === 404) {
        setFieldError('No NEXORA account uses that email yet. Ask them to create an account and confirm their email first.');
      } else if (e.status === 400 || e.status === 409) setFieldError(shown.text);
      else setNotice(shown.text);
    } finally {
      setBusy(false);
    }
  }

  if (!can('member.manage')) {
    return <ErrorBanner kind="err">Only a SACCO admin can add members.</ErrorBanner>;
  }

  const byEmail = mode === 'email';

  return (
    <div className="neo-grid">
      <section className="glass neo-span-7 neo-stack">
        <div>
          <h2 className="font-serif text-xl">Add a member to this SACCO</h2>
          <p className="muted text-sm">
            They need a NEXORA account first. This code gives them a place only after they set their PIN.
          </p>
        </div>

        <div className="flex flex-wrap gap-2" role="group" aria-label="How to add them">
          <button
            type="button"
            className={`btn small${byEmail ? ' ghost' : ''}`}
            aria-pressed={!byEmail}
            disabled={busy}
            onClick={() => chooseMode('phone')}
          >
            By phone
          </button>
          <button
            type="button"
            className={`btn small${byEmail ? '' : ' ghost'}`}
            aria-pressed={byEmail}
            disabled={busy}
            onClick={() => chooseMode('email')}
          >
            By email
          </button>
        </div>

        {byEmail ? (
          <Field id="email" label="Their email" error={fieldError}>
            <input
              id="email"
              type="email"
              inputMode="email"
              autoComplete="off"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="name@example.com"
            />
          </Field>
        ) : (
          <Field id="phone" label="Phone number" error={fieldError}>
            <input
              id="phone"
              inputMode="tel"
              value={phone}
              onChange={e => setPhone(e.target.value)}
              placeholder="0712 345 678"
            />
          </Field>
        )}
        <Field id="role" label="Role">
          <Select
            id="role"
            value={role}
            disabled={busy}
            onChange={setRole}
            options={ROLES.map(code => ({ value: code, label: ROLE_LABEL[code] }))}
          />
        </Field>

        <div>
          {byEmail ? (
            <button type="button" className="btn" disabled={busy} onClick={() => sendEmailCode()}>
              {busy ? 'Sending the code…' : 'Email the join code'}
            </button>
          ) : (
            <button type="button" className="btn" disabled={busy} onClick={() => makeCode()}>
              {busy ? 'Making the code…' : 'Make a join code'}
            </button>
          )}
        </div>

        {notice && <ErrorBanner>{notice}</ErrorBanner>}

        {emailed && (
          <div className="neo-stack tight">
            <ErrorBanner kind="ok">Join code emailed to {emailed.email}.</ErrorBanner>
            {wasInvited && (
              <ErrorBanner kind="info">They were already invited. A new code was sent and the old one stopped working.</ErrorBanner>
            )}
            <ErrorBanner kind="info">The code goes only to their inbox. You do not see it, and it works once.</ErrorBanner>
            <div className="flex flex-wrap gap-2">
              {left > 0 ? (
                <span className="chip">Expires in {Math.floor(left / 60)}:{String(left % 60).padStart(2, '0')}</span>
              ) : (
                <ErrorBanner>That code expired. Email a new one.</ErrorBanner>
              )}
            </div>
          </div>
        )}

        {made && (
          <div className="neo-stack tight">
            <ErrorBanner kind="ok">Join code made for {made.phone} as {ROLE_LABEL[made.title] || ROLE_LABEL[made.role] || made.role}.</ErrorBanner>
            {wasInvited && (
              <ErrorBanner kind="info">This number was already invited. A new code was made and the old one stopped working.</ErrorBanner>
            )}
            <ErrorBanner kind="info">Give this code to the person now. It works once and is shown only on this screen.</ErrorBanner>
            <div className="neo-code">{made.join_code}</div>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                className="btn small ghost"
                onClick={async () => {
                  try {
                    await navigator.clipboard.writeText(made.join_code);
                    toast('Code copied');
                  } catch {
                    setNotice('Select the code and copy it.');
                  }
                }}
              >
                Copy code
              </button>
              {left > 0 ? (
                <span className="chip">Expires in {Math.floor(left / 60)}:{String(left % 60).padStart(2, '0')}</span>
              ) : (
                <ErrorBanner>That code expired. Make a new one.</ErrorBanner>
              )}
            </div>
          </div>
        )}
      </section>

      <section className="glass neo-span-5 neo-stack tight">
        <b>How a member joins</b>
        {byEmail ? (
          <ol className="muted text-sm neo-stack tight">
            <li>1. They create a NEXORA account and confirm their email.</li>
            <li>2. You type that email and the role, then email the join code.</li>
            <li>3. The code arrives in their inbox. NEXORA does not show it to you.</li>
            <li>4. They sign in, open Join with a code, and enter the 6 digits.</li>
            <li>5. They accept the rules and choose a 4-digit PIN, and from then on type it to enter this SACCO.</li>
          </ol>
        ) : (
          <ol className="muted text-sm neo-stack tight">
            <li>1. You type the phone and role and make the code.</li>
            <li>2. You give them the code in person or by a call. NEXORA does not send it.</li>
            <li>3. They sign in, open Join with a code, and enter the same phone and the code.</li>
            <li>4. They choose a 4-digit PIN, and from then on type it to enter this SACCO.</li>
          </ol>
        )}
        <p className="muted text-sm">Wrong guesses burn the code.</p>
      </section>

      <section className="glass neo-span-7 neo-stack tight">
        <div className="neo-search">
          <b className="grow">Invited, not joined yet</b>
          <span className="chip">{invited.data ? `${invited.data.length} invited` : '—'}</span>
        </div>
        <Body
          status={invited.status}
          error={invited.error}
          reload={invited.reload}
          emptyTitle="Nobody is waiting."
          emptyHint="People you add appear here until they join."
        >
          {invited.data && invited.data.length === 0 ? (
            <p className="muted text-sm">Nobody is waiting. People you add appear here until they join.</p>
          ) : (
            <div className="table-wrap">
              <table>
                <thead>
                  <tr><th>Phone or email</th><th>Role</th><th>Status</th><th /></tr>
                </thead>
                <tbody>
                  {(invited.data || []).map(row => (
                    <tr key={row.id}>
                      <td>{row.phone || row.email}</td>
                      <td>{ROLE_LABEL[(row.roles && row.roles[0]) || row.role] || row.role}</td>
                      <td><StatusChip status="Invited" /></td>
                      <td>
                        <button
                          type="button"
                          className="btn small ghost"
                          disabled={busy}
                          onClick={() => (row.phone ? makeCode(row.phone, row.role) : sendEmailCode(row.email, row.role))}
                        >
                          {row.phone ? 'Make a new code' : 'Email a new code'}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Body>
      </section>

      <section className="glass neo-span-7 neo-stack tight">
        <div className="neo-search">
          <b className="grow">Declined the invitation</b>
          <span className="chip">{declined.data ? `${declined.data.length} declined` : '—'}</span>
        </div>
        <Body
          status={declined.status}
          error={declined.error}
          reload={declined.reload}
          emptyTitle="Nobody has declined."
          emptyHint="A person who reads the rules and refuses appears here, with their reason."
        >
          {declined.data && declined.data.length === 0 ? (
            <p className="muted text-sm">Nobody has declined. A person who reads the rules and refuses appears here, with their reason.</p>
          ) : (
            <div className="table-wrap">
              <table>
                <thead>
                  <tr><th>Phone or email</th><th>Role</th><th>Why they declined</th><th /></tr>
                </thead>
                <tbody>
                  {(declined.data || []).map(row => (
                    <tr key={row.id}>
                      <td>{row.phone || row.email}</td>
                      <td>{ROLE_LABEL[(row.roles && row.roles[0]) || row.role] || row.role}</td>
                      <td>{row.decline_reason}</td>
                      <td>
                        <button
                          type="button"
                          className="btn small ghost"
                          disabled={busy}
                          onClick={() => (row.phone ? makeCode(row.phone, row.role) : sendEmailCode(row.email, row.role))}
                        >
                          {row.phone ? 'Invite again' : 'Email a new code'}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Body>
      </section>
    </div>
  );
}
