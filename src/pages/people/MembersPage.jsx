import { useState } from 'react';
import { useSession } from '../../lib/session.jsx';
import { useAsync } from '../../lib/useAsync.js';
import { listMembers } from '../../api/people.js';
import StatusChip from '../../components/StatusChip.jsx';
import Field from '../../components/Field.jsx';
import { Body } from './shared.jsx';
import { initials, roleChips } from './data.js';
import MemberProfile from './MemberProfile.jsx';
import '../../styles/neo.css';

const chipFor = status => (status === 'active' ? 'Active' : status === 'invited' ? 'Invited' : 'Inactive');

export default function MembersPage() {
  const { saccoId, can, navigate } = useSession();
  const { status, data, error, reload } = useAsync(() => listMembers(saccoId), [saccoId]);
  const [query, setQuery] = useState('');
  const [openId, setOpenId] = useState(null);

  if (openId) return <MemberProfile membershipId={openId} onBack={() => { setOpenId(null); reload(); }} />;

  const rows = (data || []).filter(m =>
    !query || (m.email || m.phone || '').toLowerCase().includes(query.trim().toLowerCase()));

  return (
    <section className="glass neo-stack">
      <div className="neo-search">
        <div className="grow">
          <h2 className="font-serif text-xl">Members</h2>
          <p className="muted text-sm">
            {data ? `${data.length} people in this SACCO.` : 'The member list for this SACCO.'}
          </p>
        </div>
        {can('member.manage') && (
          <button type="button" className="btn" onClick={() => navigate('/add-member')}>
            Add a member
          </button>
        )}
      </div>

      <Field id="member-search" label="Search by email or phone">
        <input
          id="member-search"
          type="search"
          value={query}
          onChange={e => setQuery(e.target.value)}
          placeholder="jordan@example.com"
        />
      </Field>

      <Body
        status={status}
        error={error}
        reload={reload}
        emptyTitle="No members yet."
        emptyHint="Add the first person with their phone number."
      >
        {rows.length === 0 ? (
          <p className="muted">Nobody matches that search.</p>
        ) : (
          <div className="neo-stack tight">
            {rows.map(m => (
              <button type="button" key={m.id} className="row neo-member" onClick={() => setOpenId(m.id)}>
                <span className="icon" aria-hidden="true">{initials(m.email || m.phone)}</span>
                <span className="grow text-left">
                  <span className="title">{m.email || m.phone}</span>
                  <span className="neo-roles">
                    {roleChips(m.roles).length === 0
                      ? <span className="chip lock">Member</span>
                      : roleChips(m.roles).map(label => <span className="chip" key={label}>{label}</span>)}
                  </span>
                </span>
                <StatusChip status={chipFor(m.status)} />
              </button>
            ))}
          </div>
        )}
      </Body>
    </section>
  );
}
