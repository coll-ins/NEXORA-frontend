import '../../styles/neo.css';
import { useState } from 'react';
import { useSession } from '../../lib/session.jsx';
import { useAsync } from '../../lib/useAsync.js';
import { getSacco, setSaccoActive } from '../../api/platform.js';
import ErrorBanner from '../../components/ErrorBanner.jsx';
import StatusChip from '../../components/StatusChip.jsx';
import { Body, Confirm } from '../people/shared.jsx';
import { when } from '../people/data.js';
import { describe } from '../../lib/errors.js';

export default function PfSaccoDetail({ saccoId, onBack }) {
  const { toast } = useSession();
  const { status, data, error, reload } = useAsync(() => getSacco(saccoId), [saccoId]);
  const [notice, setNotice] = useState(null);
  const [busy, setBusy] = useState(false);
  const [asking, setAsking] = useState(false);

  async function flip() {
    const turningOff = data.status === 'active';
    setAsking(false);
    setBusy(true);
    setNotice(null);
    try {
      await setSaccoActive(data.id, !turningOff);
      toast(turningOff ? 'SACCO suspended' : 'SACCO activated');
      reload();
    } catch (e) {
      setNotice(describe(e, { context: 'settings' }).text);
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="glass neo-stack">
      <button type="button" className="back" onClick={onBack}>← Back to SACCOs</button>
      <Body
        status={status}
        error={error}
        reload={reload}
        emptyTitle="This SACCO is gone."
        emptyHint="Go back to the list."
      >
        {data && (
          <>
            <div className="neo-search">
              <div className="grow">
                <div className="eyebrow">SACCO</div>
                <h2 className="font-serif text-xl">{data.name}</h2>
                <p className="muted text-sm">
                  {data.member_count} member{data.member_count === 1 ? '' : 's'} · {data.currency} · created {when(data.created_at)}
                </p>
              </div>
              <StatusChip status={data.status === 'active' ? 'Active' : 'Suspended'} />
            </div>
            {notice && <ErrorBanner>{notice}</ErrorBanner>}
            <div>
              <button type="button" className="btn" disabled={busy} onClick={() => setAsking(true)}>
                {data.status === 'active' ? 'Deactivate' : 'Activate'}
              </button>
              {asking && (
                <Confirm
                  question={data.status === 'active'
                    ? "This locks the SACCO's records for all its members."
                    : 'This lets the members back in with their existing PINs.'}
                  yes={data.status === 'active' ? 'Deactivate it' : 'Activate it'}
                  no={data.status === 'active' ? 'Keep it active' : 'Leave it suspended'}
                  busy={busy}
                  onNo={() => setAsking(false)}
                  onYes={flip}
                />
              )}
            </div>
            <p className="muted text-sm">
              You never see this SACCO's money. Balances, accounts and loans stay with its own staff.
            </p>
          </>
        )}
      </Body>
    </section>
  );
}
