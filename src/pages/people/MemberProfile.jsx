import '../../styles/neo.css';
import { useState } from 'react';
import { useSession } from '../../lib/session.jsx';
import { useAsync } from '../../lib/useAsync.js';
import { getMember, setRoles, updateMember, addMember } from '../../api/people.js';
import ErrorBanner from '../../components/ErrorBanner.jsx';
import StatusChip from '../../components/StatusChip.jsx';
import { Body, Confirm } from './shared.jsx';
import { ROLE_LABEL, when } from './data.js';
import { describe } from '../../lib/errors.js';

const TITLES = ['member', 'secretary', 'finance_officer', 'loans_officer'];

export default function MemberProfile({ membershipId, onBack }) {
  const { saccoId, can, toast } = useSession();
  const { status, data, error, reload } = useAsync(
    () => getMember(saccoId, membershipId),
    [saccoId, membershipId],
  );
  const [picked, setPicked] = useState(null);
  const [notice, setNotice] = useState(null);
  const [busy, setBusy] = useState(false);
  const [askingOff, setAskingOff] = useState(false);

  const roles = picked ?? (data ? data.roles : []);
  const toggle = code => setPicked(
    roles.includes(code) ? roles.filter(r => r !== code) : [...roles, code],
  );

  async function run(action, message) {
    setBusy(true);
    setNotice(null);
    try {
      await action();
      toast(message);
      setPicked(null);
      reload();
    } catch (e) {
      setNotice(describe(e, { context: 'member' }).text);
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="glass neo-stack">
      <button type="button" className="back" onClick={onBack}>← Back to members</button>
      <Body
        status={status}
        error={error}
        reload={reload}
        emptyTitle="This member is gone."
        emptyHint="Go back to the list."
      >
        {data && (
          <>
            <div className="neo-search">
              <div className="grow">
                <div className="eyebrow">Member</div>
                <h2 className="font-serif text-xl">{data.email || data.phone}</h2>
                <p className="muted text-sm">Joined {when(data.created_at)}</p>
              </div>
              <StatusChip status={data.status === 'active' ? 'Active' : data.status === 'invited' ? 'Invited' : 'Inactive'} />
            </div>

            {notice && <ErrorBanner>{notice}</ErrorBanner>}

            {can('member.manage') && (
              <div className="neo-stack tight">
                <b>Roles in this SACCO</b>
                <div className="flex flex-wrap gap-2">
                  {roles.includes('sacco_admin') && (
                    <span className="chip up">SACCO admin (only the platform owner changes this)</span>
                  )}
                  {TITLES.map(code => (
                    <label key={code} className="chip pick">
                      <input
                        type="checkbox"
                        checked={roles.includes(code)}
                        onChange={() => toggle(code)}
                        disabled={busy}
                      />
                      {ROLE_LABEL[code]}
                    </label>
                  ))}
                </div>
                <div>
                  <button
                    type="button"
                    className="btn small"
                    disabled={busy || !picked || roles.length === 0}
                    onClick={() => run(() => setRoles(saccoId, data.id, roles), 'Roles saved')}
                  >
                    Save roles
                  </button>
                </div>
              </div>
            )}

            {can('member.manage') && (
              <div className="neo-stack tight">
                <b>Access</b>
                <div className="flex flex-wrap gap-2">
                  {data.status === 'active' ? (
                    <button
                      type="button"
                      className="btn small warn"
                      disabled={busy}
                      onClick={() => {
                        setAskingOff(true);
                      }}
                    >
                      Deactivate
                    </button>
                  ) : data.status === 'inactive' ? (
                    <button
                      type="button"
                      className="btn small"
                      disabled={busy}
                      onClick={() => run(() => updateMember(saccoId, data.id, { status: 'active' }), 'Member reactivated')}
                    >
                      Activate
                    </button>
                  ) : null}
                  {askingOff && (
                    <Confirm
                      question="Deactivate this member? They lose access to this SACCO."
                      yes="Deactivate"
                      no="Keep them active"
                      busy={busy}
                      onNo={() => setAskingOff(false)}
                      onYes={() => {
                        setAskingOff(false);
                        run(() => updateMember(saccoId, data.id, { status: 'inactive' }), 'Member deactivated');
                      }}
                    />
                  )}
                  {data.status === 'invited' && (
                    <button
                      type="button"
                      className="btn small ghost"
                      disabled={busy || !data.phone}
                      onClick={() => run(
                        async () => {
                          const made = await addMember(saccoId, { phone: data.phone, role: data.role });
                          setNotice(`New join code: ${made.join_code} (works once, 15 minutes).`);
                        },
                        'A new code was made',
                      )}
                    >
                      Send a new code
                    </button>
                  )}
                </div>
              </div>
            )}
          </>
        )}
      </Body>
    </section>
  );
}
