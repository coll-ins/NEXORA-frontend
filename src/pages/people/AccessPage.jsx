import '../../styles/neo.css';
import { useState } from 'react';
import { useSession } from '../../lib/session.jsx';
import { useAsync } from '../../lib/useAsync.js';
import { listAccess, decideAccess } from '../../api/people.js';
import ErrorBanner from '../../components/ErrorBanner.jsx';
import Select from '../../components/Select.jsx';
import StatusChip from '../../components/StatusChip.jsx';
import { Body, Confirm } from './shared.jsx';
import { STATUS_LABEL, when } from './data.js';
import { describe } from '../../lib/errors.js';

const HOURS = [1, 4, 8, 24];

export default function AccessPage() {
  const { saccoId, can, toast } = useSession();
  const { status, data, error, reload } = useAsync(() => listAccess(saccoId), [saccoId]);
  const [hours, setHours] = useState(4);
  const [notice, setNotice] = useState(null);
  const [busyId, setBusyId] = useState(null);
  const [asking, setAsking] = useState(null);

  async function run(row, action) {
    setBusyId(row.id);
    setNotice(null);
    try {
      await decideAccess(row.id, action, action === 'approve' ? { hours } : {});
      toast(action === 'approve' ? 'Access approved' : action === 'deny' ? 'Request denied' : 'Access revoked');
      reload();
    } catch (e) {
      setNotice(describe(e, { context: 'access' }).text);
    } finally {
      setBusyId(null);
    }
  }

  const pending = (data || []).filter(r => r.status === 'requested');
  const decided = (data || []).filter(r => r.status !== 'requested');

  return (
    <section className="glass neo-stack">
      <div className="neo-search">
        <div className="grow">
          <h2 className="font-serif text-xl">Access requests</h2>
          <p className="muted text-sm">A platform owner reads this SACCO's records only with your consent.</p>
        </div>
        <div className="muted flex shrink-0 items-center gap-2 whitespace-nowrap text-sm">
          Give access for
          <Select
            className="w-32"
            value={hours}
            onChange={next => setHours(Number(next))}
            options={HOURS.map(h => ({ value: h, label: `${h} hour${h === 1 ? '' : 's'}` }))}
          />
        </div>
      </div>

      {notice && <ErrorBanner>{notice}</ErrorBanner>}

      {asking && (
        <Confirm
          question={asking.action === 'deny' ? 'Deny this request?' : 'Revoke this access now?'}
          yes={asking.action === 'deny' ? 'Deny it' : 'Revoke now'}
          no={asking.action === 'deny' ? 'Keep it' : 'Leave it'}
          busy={busyId === asking.row.id}
          onNo={() => setAsking(null)}
          onYes={() => {
            const { row, action } = asking;
            setAsking(null);
            run(row, action);
          }}
        />
      )}

      <Body
        status={status}
        error={error}
        reload={reload}
        emptyTitle="No one has asked for access."
        emptyHint="Support requests from the platform owner appear here."
      >
        {data && data.length === 0 ? (
          <p className="muted">No one has asked for access.</p>
        ) : (
          <div className="neo-stack">
            <div className="neo-stack tight">
              <b>Waiting for you</b>
              {pending.length === 0 && <p className="muted text-sm">Nothing is waiting.</p>}
              {pending.map(row => (
                <div key={row.id} className="row neo-request">
                  <span className="icon" aria-hidden="true">{row.scope.slice(0, 1).toUpperCase()}</span>
                  <span className="grow text-left">
                    <span className="title">{row.reason}</span>
                    <span className="sub">Scope: {row.scope} · asked {when(row.created_at)}</span>
                  </span>
                  <span className="neo-request-actions flex gap-2">
                    <button type="button" className="btn small" disabled={busyId === row.id || !can('support.approve')} onClick={() => run(row, 'approve')}>
                      Approve
                    </button>
                    <button type="button" className="btn small warn" disabled={busyId === row.id || !can('support.approve')} onClick={() => setAsking({ row, action: 'deny' })}>
                      Deny
                    </button>
                  </span>
                </div>
              ))}
            </div>

            <div className="neo-stack tight">
              <b>Decided</b>
              {decided.length === 0 && <p className="muted text-sm">Nothing decided yet.</p>}
              {decided.map(row => (
                <div key={row.id} className="row neo-request">
                  <span className="icon" aria-hidden="true">{row.scope.slice(0, 1).toUpperCase()}</span>
                  <span className="grow text-left">
                    <span className="title">{row.reason}</span>
                    <span className="sub">
                      Scope: {row.scope} · {row.decided_at ? `decided ${when(row.decided_at)}` : 'no date'}
                      {row.expires_at && row.status === 'approved' ? ` · ends ${when(row.expires_at)}` : ''}
                    </span>
                  </span>
                  <span className="neo-request-actions flex items-center gap-2">
                    <StatusChip status={STATUS_LABEL[row.status] || row.status} />
                    {row.status === 'approved' && (
                      <button type="button" className="btn small ghost" disabled={busyId === row.id || !can('support.approve')} onClick={() => setAsking({ row, action: 'revoke' })}>
                        Revoke
                      </button>
                    )}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </Body>
    </section>
  );
}
