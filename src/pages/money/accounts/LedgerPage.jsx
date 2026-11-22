/* LedgerPage: one account's ledger. A drill-in from Accounts, so it has a Back button. Officers with savings.reverse can reverse a posted entry. */
import { useEffect, useRef, useState } from 'react';
import { useSession } from '../../../lib/session.jsx';
import { useAsync } from '../../../lib/useAsync.js';
import { kesFromMinor, dTime, newReference } from '../../../lib/format.js';
import { getAccount, listTransactions, reverseTransaction } from '../../../api/money.js';
import BackButton from '../../../components/BackButton.jsx';
import StatusChip from '../../../components/StatusChip.jsx';
import ErrorBanner from '../../../components/ErrorBanner.jsx';
import ErrorPage from '../../../components/ErrorPage.jsx';
import Field from '../../../components/Field.jsx';
import { Body, KesCount, LoadMore } from '../common.jsx';
import { failure, isCredit, reversedSet, txTitle, usePaged } from '../helpers.js';

const FILTERS = [['all', 'All'], ['deposit', 'Deposits'], ['withdrawal', 'Withdrawals'], ['reversed', 'Reversed']];

function ReverseDialog({ tx, onClose, onDone }) {
  const { can } = useSession();
  const [capBlock, setCapBlock] = useState(null);   // the server's sentence when an open loan's cap blocks the reversal
  const [reason, setReason] = useState('');
  const [error, setError] = useState('');
  const [note, setNote] = useState(null);
  const [sending, setSending] = useState(false);
  const [reference, setReference] = useState(newReference);   // one per dialog; reused when the press is retried
  const busy = useRef(false);
  const field = useRef(null);
  useEffect(() => { const el = document.getElementById('reverse-reason'); if (el) el.focus(); }, []);
  useEffect(() => { const k = e => { if (e.key === 'Escape' && !busy.current) onClose(); }; window.addEventListener('keydown', k); return () => window.removeEventListener('keydown', k); }, [onClose]);

  async function submit(e, override = false) {
    e.preventDefault();
    if (busy.current) return;
    if (!reason.trim()) { setError('Write a reason for the reversal.'); const el = document.getElementById('reverse-reason'); if (el) el.focus(); return; }
    if (override && reason.trim().length < 10) { setError('An override needs a reason of at least 10 characters.'); return; }
    busy.current = true; setSending(true); setNote(null);
    try { await reverseTransaction(tx.account_id, tx.id, { reference, reason: reason.trim(), override }); setReference(newReference()); onDone({ kind: 'ok', text: `Entry #${tx.id} reversed.` }); }
    catch (err) {
      const f = failure(err, 'Reverse');
      if (err.code === 'LOAN_OVER_CAP') setCapBlock(err.message);
      else if (f.page) onDone({ page: f.page });
      else if (f.offline) setNote({ kind: 'warn', text: f.text });
      else onDone({ kind: 'err', text: f.text });
    } finally { busy.current = false; setSending(false); }
  }

  return (
    <div className="sam-scrim" onMouseDown={e => { if (e.target === e.currentTarget && !busy.current) onClose(); }}>
      <form ref={field} className="glass sam-dialog sam-form" role="dialog" aria-modal="true" aria-labelledby="reverse-title" onSubmit={submit} noValidate>
        <div><div className="eyebrow">savings.reverse</div><h3 id="reverse-title" className="font-serif text-xl">Reverse {txTitle(tx).toLowerCase()} of {kesFromMinor(tx.amount)}</h3></div>
        <p className="muted">A reversal adds a new entry that cancels this one. Nothing is deleted.</p>
        <Field id="reverse-reason" label="Reason" error={error}>
          <textarea value={reason} onChange={e => { setReason(e.target.value); setError(''); }} />
        </Field>
        {note && <ErrorBanner kind={note.kind}>{note.text}</ErrorBanner>}
        {capBlock && <ErrorBanner kind="warn">{capBlock}</ErrorBanner>}
        <div className="sam-row-gap">
          {!capBlock && <button type="submit" className="btn warn" disabled={sending}>{sending ? 'Reversing...' : 'Reverse entry'}</button>}
          {capBlock && can('savings.reverse_override') && <button type="button" className="btn warn" disabled={sending} onClick={e => submit(e, true)}>{sending ? 'Reversing...' : 'Override and reverse'}</button>}
          <button type="button" className="btn ghost" disabled={sending} onClick={onClose}>Cancel</button>
        </div>
      </form>
    </div>
  );
}

export default function LedgerPage({ account, onBack }) {
  const { can } = useSession();
  const [filter, setFilter] = useState('all');
  const [banner, setBanner] = useState(null);
  const [dialog, setDialog] = useState(null);
  const [blocked, setBlocked] = useState(null);
  const fresh = useAsync(() => getAccount(account.account_id), [account.account_id], { isEmpty: () => false });
  const paged = usePaged(async page => { const r = await listTransactions(account.account_id, page || 1); return { items: r.items, next: r.hasMore ? r.page + 1 : null }; }, [account.account_id]);
  const reversed = reversedSet(paged.items);
  const shown = paged.items.filter(t => filter === 'all' || (filter === 'reversed' ? reversed.has(t.id) || t.reverses_id : t.type === filter && !t.reverses_id));
  const balance = fresh.data ? fresh.data.balance : account.balance;

  function done(result) {
    setDialog(null);
    if (result.page) return setBlocked(result.page);
    setBanner(result); fresh.reload(); paged.refresh();
  }

  if (blocked) return <ErrorPage code={blocked} />;
  return (
    <div className="sam-stack">
      <BackButton label="Back to accounts" onClick={onBack} />
      {banner && <ErrorBanner kind={banner.kind}>{banner.text}</ErrorBanner>}
      <section className="glass sam-stack" aria-labelledby="ledger-title">
        <div className="sam-head">
          <div><div className="eyebrow">Ledger</div><h2 id="ledger-title" className="font-serif text-2xl">{account.name || account.email}</h2><p className="muted">{account.code ? `Account ${account.code}` : `Account ${account.account_id}`}</p></div>
          <div><div className="eyebrow">Balance</div><KesCount minor={balance} /></div>
        </div>
        <div className="sam-row-gap" role="group" aria-label="Filter entries">
          {FILTERS.map(([key, label]) => <button key={key} type="button" className="chip pick" aria-pressed={filter === key} onClick={() => setFilter(key)}>{label}</button>)}
        </div>
        <Body status={paged.status} error={paged.error} reload={paged.reload} emptyTitle="No transactions yet.">
          {shown.length === 0 ? <p className="muted">Nothing matches that filter on the pages loaded so far.</p> : (
            <div className="table-wrap">
              <table className="sam-table">
                <thead><tr><th>When</th><th>Entry</th><th className="sam-r">Amount</th><th>Status</th>{can('savings.reverse') && <th><span className="sr-only">Actions</span></th>}</tr></thead>
                <tbody>
                  {shown.map(t => {
                    const isReversed = reversed.has(t.id);
                    return (
                      <tr key={t.id}>
                        <td>{dTime(t.created_at)}</td>
                        <td>{txTitle(t)}<span className="sam-sub">#{t.id}</span></td>
                        <td className={`sam-r${isCredit(t) ? ' sam-credit' : ''}`}>{isCredit(t) ? '+' : '-'}{kesFromMinor(t.amount)}</td>
                        <td><StatusChip status={isReversed ? 'Reversed' : 'Posted'} /></td>
                        {can('savings.reverse') && <td>{!t.reverses_id && !isReversed && <button type="button" className="btn warn small" onClick={() => setDialog({ ...t, account_id: account.account_id })}>Reverse</button>}</td>}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
          <LoadMore paged={paged} />
        </Body>
      </section>
      {dialog && <ReverseDialog tx={dialog} onClose={() => setDialog(null)} onDone={done} />}
    </div>
  );
}