import '../../styles/neo.css';
import { useState } from 'react';
import { useAsync } from '../../lib/useAsync.js';
import { listSaccos, askForAccess, myAccessRequests } from '../../api/platform.js';
import ErrorBanner from '../../components/ErrorBanner.jsx';
import Field from '../../components/Field.jsx';
import StatusChip from '../../components/StatusChip.jsx';
import { Body } from '../people/shared.jsx';
import { STATUS_LABEL, when } from '../people/data.js';
import { describe } from '../../lib/errors.js';

const SCOPES = ['audit', 'members', 'savings', 'loans'];

export default function PfAccess() {
  const saccos = useAsync(listSaccos, []);
  const requests = useAsync(myAccessRequests, []);
  const [saccoId, setSaccoId] = useState('');
  const [reason, setReason] = useState('');
  const [scope, setScope] = useState('audit');
  const [errors, setErrors] = useState({});
  const [notice, setNotice] = useState(null);
  const [busy, setBusy] = useState(false);

  const chosen = saccoId || (saccos.data && saccos.data[0] ? String(saccos.data[0].id) : '');

  async function submit(event) {
    event.preventDefault();
    const next = {};
    if (!chosen) next.sacco = 'Create a SACCO first.';
    if (!reason.trim()) next.reason = 'Say why you need to look.';
    setErrors(next);
    if (Object.keys(next).length) return;
    setNotice(null);
    setBusy(true);
    try {
      await askForAccess(chosen, { reason: reason.trim(), scope });
      setReason('');
      requests.reload();
      setNotice('Your request was sent. The SACCO admin decides, and you cannot decide it yourself.');
    } catch (e) {
      setNotice(describe(e, { context: 'access' }).text);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="neo-grid">
      <section className="glass neo-span-5 neo-stack">
        <div>
          <h2 className="font-serif text-xl">Access to SACCOs</h2>
          <p className="muted text-sm">Ask one SACCO to let you read one scope for a while.</p>
        </div>
        {notice && <ErrorBanner kind="ok">{notice}</ErrorBanner>}
        <form className="neo-stack" onSubmit={submit}>
          <Field id="access-sacco" label="SACCO" error={errors.sacco}>
            <select id="access-sacco" value={chosen} onChange={e => setSaccoId(e.target.value)} disabled={busy}>
              {(saccos.data || []).map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          </Field>
          <Field id="access-scope" label="What you need to read">
            <select id="access-scope" value={scope} onChange={e => setScope(e.target.value)} disabled={busy}>
              {SCOPES.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </Field>
          <Field id="access-reason" label="Why" error={errors.reason}>
            <textarea
              id="access-reason"
              rows={3}
              value={reason}
              onChange={e => setReason(e.target.value)}
              placeholder="Customer ticket 4471"
              disabled={busy}
            />
          </Field>
          <div>
            <button type="submit" className="btn" disabled={busy}>{busy ? 'Sending…' : 'Ask for access'}</button>
          </div>
        </form>
      </section>

      <section className="glass neo-span-7 neo-stack tight">
        <b>Your requests</b>
        <Body
          status={requests.status}
          error={requests.error}
          reload={requests.reload}
          emptyTitle="You have not asked for access."
          emptyHint="Ask above; the SACCO's admin decides."
        >
          {(requests.data || []).map(row => (
            <div className="row" key={row.id}>
              <span className="icon" aria-hidden="true">{row.scope.slice(0, 1).toUpperCase()}</span>
              <span className="grow text-left">
                <span className="title">{row.reason}</span>
                <span className="sub">
                  {row.scope} · asked {when(row.created_at)}
                  {row.expires_at && row.status === 'approved' ? ` · ends ${when(row.expires_at)}` : ''}
                </span>
              </span>
              <StatusChip status={STATUS_LABEL[row.status] || row.status} />
            </div>
          ))}
          <p className="muted text-sm">Only the SACCO admin can revoke an approval, not you.</p>
        </Body>
      </section>
    </div>
  );
}
