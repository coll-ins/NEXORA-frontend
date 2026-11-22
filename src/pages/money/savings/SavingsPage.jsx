/* SavingsPage: the MEMBER's own savings (permission savings.request). Staff see the SACCO's savings under Accounts. */
import { useState } from 'react';
import { useSession } from '../../../lib/session.jsx';
import { useAsync } from '../../../lib/useAsync.js';
import { kesFromMinor, dLong } from '../../../lib/format.js';
import { getMyAccount, getMyHistory, listTransactions } from '../../../api/money.js';
import ChartBox from '../../../components/ChartBox.jsx';
import StatusChip from '../../../components/StatusChip.jsx';
import { renderLine, fAx, fTipK } from '../../../lib/charts.js';
import { Body, KesCount, LoadMore } from '../common.jsx';
import { isCredit, reversedSet, txTitle, usePaged } from '../helpers.js';
import { Empty } from '../../../components/States.jsx';

const FILTERS = [['all', 'All'], ['deposit', 'Deposits'], ['withdrawal', 'Withdrawals'], ['reversed', 'Reversed']];

function History({ account }) {
  const [filter, setFilter] = useState('all');
  const paged = usePaged(async page => { const r = await listTransactions(account.id, page || 1); return { items: r.items, next: r.hasMore ? r.page + 1 : null }; }, [account.id]);
  const reversed = reversedSet(paged.items);
  const shown = paged.items.filter(t => filter === 'all' || (filter === 'reversed' ? reversed.has(t.id) || t.reverses_id : t.type === filter && !t.reverses_id));
  return (
    <section className="glass sam-stack" aria-labelledby="tx-title">
      <div className="sam-head"><div><div className="eyebrow">Ledger</div><h3 id="tx-title" className="font-serif text-xl">My transactions</h3></div></div>
      <div className="sam-row-gap" role="group" aria-label="Filter transactions">
        {FILTERS.map(([key, label]) => <button key={key} type="button" className="chip pick" aria-pressed={filter === key} onClick={() => setFilter(key)}>{label}</button>)}
      </div>
      <Body status={paged.status} error={paged.error} reload={paged.reload} emptyTitle="No transactions yet.">
        {shown.length === 0 ? <p className="muted">Nothing matches that filter on the pages loaded so far.</p> : (
          <div className="sam-stack tight">
            {shown.map(t => (
              <div className="row" key={t.id}>
                <span className="ico" aria-hidden="true" style={{ background: 'var(--teal-2)' }}>{isCredit(t) ? '+' : '-'}</span>
                <span><span className="title">{txTitle(t)}</span><span className="sub">{dLong(t.created_at)}</span></span>
                <span className="amt"><span className={isCredit(t) ? 'sam-credit' : ''}>{isCredit(t) ? '+' : '-'}{kesFromMinor(t.amount)}</span> <StatusChip status={reversed.has(t.id) ? 'Reversed' : 'Posted'} /></span>
              </div>
            ))}
          </div>
        )}
        <LoadMore paged={paged} />
      </Body>
    </section>
  );
}

export default function SavingsPage() {
  const { saccoId, can, navigate } = useSession();
  const account = useAsync(() => getMyAccount(saccoId), [saccoId], { isEmpty: () => false });
  const history = useAsync(() => getMyHistory(saccoId), [saccoId], { isEmpty: () => false });

  return (
    <div className="sam-stack">
      <div className="sam-grid">
        <section className="glass sam-stack sam-s8" aria-labelledby="bal-title">
          <Body status={account.status} error={account.error} reload={account.reload} lines={3}>
            <div>
              <div className="eyebrow" id="bal-title">My savings balance</div>
              <KesCount minor={account.data ? account.data.balance : 0} />
              {!account.data && <p className="muted">Your savings account opens when an officer posts your first deposit.</p>}
            </div>
          </Body>
          <div>
            <div className="eyebrow">Last 12 months</div>
            {history.status === 'loading' ? <Empty title="Loading the chart..." /> : history.status === 'error' ? <Body status="error" error={history.error} reload={history.reload} />
              : history.data ? <ChartBox label="My balance over 12 months" draw={(el, still) => renderLine(el, { values: history.data.values, labels: history.data.labels, color: '#0F4C47', fmtAxis: fAx('K'), fmtTip: fTipK }, still)} deps={[history.data]} />
                : <Empty title="No history yet." hint="The chart fills in as your balance changes." />}
          </div>
        </section>
        {can('savings.request') && (
          <section className="glass sam-stack sam-s4" aria-labelledby="move-title">
            <div><div className="eyebrow">Move money</div><h3 id="move-title" className="font-serif text-xl">Add or take out money</h3></div>
            <p className="muted">Choose M-Pesa or Bank. An officer confirms it, then it shows in this ledger.</p>
            <div className="sam-row-gap">
              <button type="button" className="btn" onClick={() => navigate('/deposit')}>Deposit</button>
              <button type="button" className="btn ghost" onClick={() => navigate('/withdraw')}>Withdraw</button>
            </div>
          </section>
        )}
      </div>
      {account.status === 'ready' && account.data && <History account={account.data} />}
      {account.status === 'ready' && !account.data && (
        <section className="glass"><Empty title="No transactions yet." hint="Your first deposit will show here." /></section>
      )}
    </div>
  );
}