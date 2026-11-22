/* AccountsPage: the SACCO's member accounts (savings.view_all). A row opens that account's ledger. */
import { useState } from 'react';
import { useSession } from '../../../lib/session.jsx';
import { kesFromMinor } from '../../../lib/format.js';
import { listAccounts } from '../../../api/money.js';
import Field from '../../../components/Field.jsx';
import { Body, LoadMore } from '../common.jsx';
import { initialsOf, usePaged } from '../helpers.js';
import LedgerPage from './LedgerPage.jsx';

export default function AccountsPage() {
  const { saccoId } = useSession();
  const [query, setQuery] = useState('');
  const [open, setOpen] = useState(null);
  const paged = usePaged(async page => { const r = await listAccounts(saccoId, page || 1); return { items: r.items, next: r.hasMore ? r.page + 1 : null }; }, [saccoId]);

  if (open) return <LedgerPage account={open} onBack={() => { setOpen(null); paged.refresh(); }} />;
  const q = query.trim().toLowerCase();
  const rows = paged.items.filter(a => !q || `${a.name || ''} ${a.email || ''} ${a.code || ''}`.toLowerCase().includes(q));
  return (
    <section className="glass sam-stack" aria-labelledby="acc-title">
      <div className="sam-head"><div><div className="eyebrow">savings.view_all</div><h2 id="acc-title" className="font-serif text-2xl">Member accounts</h2></div></div>
      <Field id="acc-search" label="Search by name, email or account">
        <input type="search" value={query} onChange={e => setQuery(e.target.value)} placeholder="Member 3" autoComplete="off" />
      </Field>
      <Body status={paged.status} error={paged.error} reload={paged.reload} emptyTitle="No savings accounts yet." emptyHint="An account opens when an officer posts a member's first deposit.">
        {rows.length === 0 ? <p className="muted">Nobody matches that search on the pages loaded so far.</p> : (
          <div className="sam-stack tight">
            {rows.map(a => (
              <button type="button" key={a.account_id} className="row sam-item" onClick={() => setOpen(a)}>
                <span className="ico" aria-hidden="true" style={{ background: 'var(--teal)' }}>{initialsOf(a.name || a.email)}</span>
                <span><span className="title">{a.name || a.email}</span><span className="sub">{a.code ? `Account ${a.code}` : `Account ${a.account_id}`}</span></span>
                <span className="amt">{kesFromMinor(a.balance)}</span>
              </button>
            ))}
          </div>
        )}
        <LoadMore paged={paged} />
      </Body>
    </section>
  );
}