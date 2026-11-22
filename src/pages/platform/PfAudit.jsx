import '../../styles/neo.css';
import { useState } from 'react';
import { useAsync } from '../../lib/useAsync.js';
import { platformAudit } from '../../api/platform.js';
import { Body } from '../people/shared.jsx';
import { when } from '../people/data.js';

const FILTERS = [
  { code: '', label: 'Everything' },
  { code: 'sacco.create', label: 'SACCOs created' },
  { code: 'sacco.deactivate', label: 'Suspended' },
  { code: 'platform.owner_grant', label: 'Owners' },
  { code: 'support.request', label: 'Support access' },
];

const label = action => action.replace(/[._]/g, ' ');

export default function PfAudit() {
  const [filter, setFilter] = useState('');
  const [page, setPage] = useState(1);
  const [more, setMore] = useState([]);
  const { status, data, error, reload } = useAsync(
    () => platformAudit({ action: filter || undefined, page: 1 }),
    [filter],
  );
  const rows = [...(data ? data.entries : []), ...more];

  async function loadMore() {
    const next = page + 1;
    const body = await platformAudit({ action: filter || undefined, page: next });
    setMore([...more, ...body.entries]);
    setPage(next);
  }

  return (
    <section className="glass neo-stack">
      <div>
        <h2 className="font-serif text-xl">Platform audit</h2>
        <p className="muted text-sm">What changed on NEXORA itself. Nobody edits this list.</p>
      </div>

      <div className="flex flex-wrap gap-2">
        {FILTERS.map(f => (
          <button
            key={f.code || 'all'}
            type="button"
            className={`chip pick${filter === f.code ? ' on' : ''}`}
            aria-pressed={filter === f.code}
            onClick={() => { setFilter(f.code); setMore([]); setPage(1); }}
          >
            {f.label}
          </button>
        ))}
      </div>

      <Body
        status={status}
        error={error}
        reload={reload}
        emptyTitle="No activity yet."
        emptyHint="Creating a SACCO or adding an owner appears here."
      >
        {rows.length === 0 ? (
          <p className="muted">No activity yet.</p>
        ) : (
          <div className="neo-stack tight">
            {rows.map(entry => (
              <div className="row" key={entry.id}>
                <span className="icon" aria-hidden="true">·</span>
                <span className="grow text-left">
                  <span className="title">{label(entry.action)}</span>
                  <span className="sub">
                    {entry.actor_email || 'NEXORA'} · {when(entry.created_at)}
                    {entry.target ? ` · ${entry.target}` : ''}
                  </span>
                </span>
              </div>
            ))}
            {data && data.total > rows.length && (
              <div>
                <button type="button" className="btn small ghost" onClick={loadMore}>Load more</button>
              </div>
            )}
          </div>
        )}
      </Body>
    </section>
  );
}
