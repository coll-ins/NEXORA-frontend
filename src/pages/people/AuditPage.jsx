import '../../styles/neo.css';
import { useState } from 'react';
import { useSession } from '../../lib/session.jsx';
import { useAsync } from '../../lib/useAsync.js';
import { listAudit } from '../../api/people.js';
import { Body } from './shared.jsx';
import { when } from './data.js';

const FILTERS = [
  { code: '', label: 'Everything' },
  { code: 'savings.deposit', label: 'Deposits' },
  { code: 'savings.withdrawal', label: 'Withdrawals' },
  { code: 'member.invite', label: 'Members' },
  { code: 'support.approve', label: 'Support access' },
];

const WORDS = {
  'savings.deposit': 'Money paid in',
  'savings.withdrawal': 'Money paid out',
  'savings.reverse': 'A ledger entry was reversed',
  'savings.request.confirm': 'A member request was confirmed',
  'savings.request.reject': 'A member request was rejected',
  'member.invite': 'A member was invited',
  'member.update': 'A member was changed',
  'member.activate': 'A member joined',
  'member.sacco_login': 'Someone entered the SACCO',
  /* legacy: written before circle became SACCO. The audit log is append-only, so these rows keep the action they were recorded with and are shown as such, not rewritten. */
  'member.circle_login': 'Someone entered the SACCO (legacy entry, recorded as member.circle_login)',
  'support.approve': 'Support access was approved',
  'support.deny': 'Support access was denied',
  'support.revoke': 'Support access was revoked',
  'sacco.rename': 'The SACCO was renamed',
  'sacco.activate': 'The SACCO was activated',
  'sacco.deactivate': 'The SACCO was deactivated',
};

const label = action => WORDS[action] || action.replace(/[._]/g, ' ');

export default function AuditPage() {
  const { saccoId } = useSession();
  const [filter, setFilter] = useState('');
  const [page, setPage] = useState(1);
  const [more, setMore] = useState([]);
  const { status, data, error, reload } = useAsync(
    () => listAudit(saccoId, { action: filter || undefined, page: 1 }),
    [saccoId, filter],
  );
  const rows = [...(data ? data.entries : []), ...more];

  async function loadMore() {
    const next = page + 1;
    const body = await listAudit(saccoId, { action: filter || undefined, page: next });
    setMore([...more, ...body.entries]);
    setPage(next);
  }

  return (
    <section className="glass neo-stack">
      <div>
        <h2 className="font-serif text-xl">Audit log</h2>
        <p className="muted text-sm">Everything that happened in this SACCO. Nobody edits this list.</p>
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
        emptyHint="Money movements, members and support access appear here."
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
