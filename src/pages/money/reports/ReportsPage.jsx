/* ReportsPage: summary tiles, a sortable member-activity table, a period filter and Print (report.view). */
import { useState } from 'react';
import { useSession } from '../../../lib/session.jsx';
import { useAsync } from '../../../lib/useAsync.js';
import { dShort, dLong } from '../../../lib/format.js';
import { getSummary, getMemberActivity } from '../../../api/reports.js';
import { Body, KesCount, Count } from '../common.jsx';

const nairobiDay = d => new Date(d.getTime() + 3 * 3600000).toISOString().slice(0, 10);
const PERIODS = [
  ['all', 'All time', () => ({ from: '', to: '' })],
  ['30', 'Last 30 days', () => ({ from: nairobiDay(new Date(Date.now() - 29 * 86400000)), to: nairobiDay(new Date()) })],
  ['year', 'This year', () => ({ from: `${nairobiDay(new Date()).slice(0, 4)}-01-01`, to: nairobiDay(new Date()) })]
];
const COLUMNS = [['email', 'Member'], ['account_id', 'Account'], ['transaction_count', 'Transactions'], ['last_transaction_at', 'Last activity']];

export default function ReportsPage() {
  const { saccoId } = useSession();
  const [period, setPeriod] = useState('all');
  const [sort, setSort] = useState({ key: 'transaction_count', dir: 'desc' });
  const range = PERIODS.find(p => p[0] === period)[2]();
  const summary = useAsync(() => getSummary(saccoId, range), [saccoId, period], { isEmpty: () => false });
  const activity = useAsync(() => getMemberActivity(saccoId), [saccoId]);

  const rows = [...(activity.data || [])].sort((a, b) => {
    const x = a[sort.key], y = b[sort.key];
    const c = typeof x === 'number' && typeof y === 'number' ? x - y : String(x ?? '').localeCompare(String(y ?? ''));
    return sort.dir === 'asc' ? c : -c;
  });
  const click = key => setSort(s => (s.key === key ? { key, dir: s.dir === 'asc' ? 'desc' : 'asc' } : { key, dir: key === 'email' ? 'asc' : 'desc' }));

  return (
    <div className="sam-stack">
      <section className="glass sam-stack" aria-labelledby="rep-title">
        <div className="sam-head">
          <div><div className="eyebrow">report.view</div><h2 id="rep-title" className="font-serif text-2xl">Reports</h2><p className="muted">{summary.data && summary.data.from ? `${dLong(summary.data.from)} to ${dLong(summary.data.to)}` : 'Everything on record'}</p></div>
          <button type="button" className="btn ghost sam-noprint" onClick={() => window.print()}>Print</button>
        </div>
        <div className="sam-row-gap sam-noprint" role="group" aria-label="Period">
          {PERIODS.map(([key, label]) => <button key={key} type="button" className="chip pick" aria-pressed={period === key} onClick={() => setPeriod(key)}>{label}</button>)}
        </div>
        <Body status={summary.status} error={summary.error} reload={summary.reload} lines={3}>
          {summary.data && (
            <div className="sam-tiles">
              <div className="glass"><div className="eyebrow">Member accounts</div><Count value={summary.data.account_count} /></div>
              <div className="glass"><div className="eyebrow">Total savings</div><KesCount minor={summary.data.total_balance} /></div>
              <div className="glass"><div className="eyebrow">Deposits</div><KesCount minor={summary.data.deposit_total} /></div>
              <div className="glass"><div className="eyebrow">Withdrawals</div><KesCount minor={summary.data.withdrawal_total} /></div>
              <div className="glass"><div className="eyebrow">Reversals</div><Count value={summary.data.reversal_count} /></div>
            </div>
          )}
        </Body>
      </section>

      <section className="glass sam-stack" aria-labelledby="act-title">
        <div><div className="eyebrow">Members</div><h3 id="act-title" className="font-serif text-xl">Member activity</h3></div>
        <Body status={activity.status} error={activity.error} reload={activity.reload} emptyTitle="No member activity yet." emptyHint="Activity appears once accounts have transactions.">
          <div className="table-wrap">
            <table className="sam-table">
              <thead>
                <tr>{COLUMNS.map(([key, label]) => (
                  <th key={key} aria-sort={sort.key === key ? (sort.dir === 'asc' ? 'ascending' : 'descending') : 'none'} className={key === 'transaction_count' ? 'sam-r' : ''}>
                    <button type="button" onClick={() => click(key)}>{label}<span aria-hidden="true">{sort.key === key ? (sort.dir === 'asc' ? '▲' : '▼') : ''}</span></button>
                  </th>))}</tr>
              </thead>
              <tbody>
                {rows.map(r => (
                  <tr key={r.account_id}><td>{r.email}</td><td>{r.account_id}</td><td className="sam-r">{r.transaction_count}</td><td>{r.last_transaction_at ? dShort(r.last_transaction_at) : 'None yet'}</td></tr>
                ))}
              </tbody>
            </table>
          </div>
        </Body>
      </section>
    </div>
  );
}