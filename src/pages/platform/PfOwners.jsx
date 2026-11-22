import '../../styles/neo.css';
import { useState } from 'react';
import { useSession } from '../../lib/session.jsx';
import { useAsync } from '../../lib/useAsync.js';
import { listOwners, addOwner, removeOwner } from '../../api/platform.js';
import ErrorBanner from '../../components/ErrorBanner.jsx';
import Field from '../../components/Field.jsx';
import { Body, Confirm } from '../people/shared.jsx';
import { initials } from '../people/data.js';
import { describe } from '../../lib/errors.js';

export default function PfOwners() {
  const { user, toast } = useSession();
  const owners = useAsync(listOwners, []);
  const [email, setEmail] = useState('');
  const [errors, setErrors] = useState({});
  const [notice, setNotice] = useState(null);
  const [busy, setBusy] = useState(false);
  const [asking, setAsking] = useState(null);

  async function submit(event) {
    event.preventDefault();
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email.trim())) {
      setErrors({ email: 'Enter the email address they signed up with.' });
      return;
    }
    setErrors({});
    setNotice(null);
    setBusy(true);
    try {
      await addOwner(email.trim());
      setEmail('');
      owners.reload();
      toast('Platform owner added');
    } catch (e) {
      setErrors({ email: describe(e, { context: 'member' }).text });
    } finally {
      setBusy(false);
    }
  }

  async function remove(row) {
    setNotice(null);
    try {
      await removeOwner(row.user_id);
      owners.reload();
      toast('Platform owner removed');
    } catch (e) {
      // Removing yourself is refused by the server; show its own sentence rather than a generic 403.
      setNotice(e.status === 403 && e.message ? e.message : describe(e, { context: 'member' }).text);
    }
  }

  return (
    <div className="neo-grid">
      <section className="glass neo-span-7 neo-stack tight">
        <div>
          <h2 className="font-serif text-xl">Owners</h2>
          <p className="muted text-sm">People who run NEXORA itself. Two must always remain.</p>
        </div>
        <Body
          status={owners.status}
          error={owners.error}
          reload={owners.reload}
          emptyTitle="No owners."
          emptyHint="Add the first one on the right."
        >
          {(owners.data || []).map(row => (
            <div className="row" key={row.user_id}>
              <span className="icon" aria-hidden="true">{initials(row.email)}</span>
              <span className="grow text-left">
                <span className="title">{row.email}</span>
                <span className="sub">{user && row.email === user.email ? 'That is you' : 'Platform owner'}</span>
              </span>
              <button
                type="button"
                className="btn small ghost"
                onClick={() => setAsking(row)}
              >
                Remove
              </button>
            </div>
          ))}
        </Body>
        {asking && (
          <Confirm
            question={`Remove ${asking.email} as a platform owner?`}
            yes="Remove them"
            no="Keep them"
            onNo={() => setAsking(null)}
            onYes={() => {
              const row = asking;
              setAsking(null);
              remove(row);
            }}
          />
        )}
      </section>

      <section className="glass neo-span-5 neo-stack">
        <b>Add an owner</b>
        {notice && <ErrorBanner onRetry={() => setNotice(null)}>{notice}</ErrorBanner>}
        <form className="neo-stack" onSubmit={submit}>
          <Field id="owner-email" label="Email" error={errors.email}>
            <input
              id="owner-email"
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="someone@example.com"
              disabled={busy}
            />
          </Field>
          <div>
            <button type="submit" className="btn" disabled={busy}>{busy ? 'Adding…' : 'Add owner'}</button>
          </div>
        </form>
      </section>
    </div>
  );
}
