import { useSession } from '../../lib/session.jsx';
import { useAsync } from '../../lib/useAsync.js';
import { listSaccos, platformAudit } from '../../api/platform.js';
import { Body } from '../people/shared.jsx';
import { when } from '../people/data.js';
import '../../styles/neo.css';

export default function PfOverview() {
  const { navigate } = useSession();
  const saccos = useAsync(listSaccos, []);
  const activity = useAsync(() => platformAudit({ page: 1 }), []);

  const rows = saccos.data || [];
  const active = rows.filter(s => s.status === 'active').length;
  const suspended = rows.filter(s => s.status === 'suspended').length;
  const people = rows.reduce((sum, s) => sum + (s.member_count || 0), 0);

  return (
    <div className="neo-stack loose">
      <section className="glass neo-stack">
        <div>
          <h2 className="font-serif text-xl">Platform overview</h2>
          <p className="muted text-sm">Counts and statuses only. You never see a SACCO's money.</p>
        </div>
        <Body
          status={saccos.status}
          error={saccos.error}
          reload={saccos.reload}
          emptyTitle="No SACCOs yet."
          emptyHint="Create the first one under SACCOs."
        >
          <div className="neo-3col">
            <div>
              <div className="eyebrow">SACCOs active</div>
              <div className="neo-count">{active}</div>
            </div>
            <div>
              <div className="eyebrow">Suspended</div>
              <div className="neo-count">{suspended}</div>
            </div>
            <div>
              <div className="eyebrow">Members</div>
              <div className="neo-count">{people}</div>
            </div>
          </div>
        </Body>
      </section>

      <section className="glass neo-stack tight">
        <b>Recent platform activity</b>
        <Body
          status={activity.status}
          error={activity.error}
          reload={activity.reload}
          emptyTitle="No platform activity yet."
          emptyHint="Creating or suspending a SACCO appears here."
        >
          {(activity.data ? activity.data.entries : []).map(entry => (
            <button
              type="button"
              className="row"
              key={entry.id}
              onClick={() => {
                const match = /sacco:(\d+)/.exec(entry.target || '');
                // PfSaccos reads this with takeOpen('sacco'), which expects the "sacco:" prefix.
                if (match) navigate('/pf-saccos', { open: `sacco:${match[1]}` });
              }}
            >
              <span className="icon" aria-hidden="true">·</span>
              <span className="grow text-left">
                <span className="title">{entry.action.replace(/[._]/g, ' ')}</span>
                <span className="sub">{entry.actor_email} · {when(entry.created_at)}</span>
              </span>
            </button>
          ))}
        </Body>
      </section>
    </div>
  );
}
