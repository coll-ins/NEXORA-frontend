/* SaccoOverview: four stat tiles, savings line, deposits against withdrawals, loan book, and "Waiting for you" rows that open the record. */
import { useSession } from '../../../lib/session.jsx';
import { useAsync } from '../../../lib/useAsync.js';
import { fromMinor, kesFromMinor } from '../../../lib/format.js';
import { getSummary } from '../../../api/reports.js';
import { listLoans } from '../../../api/loans.js';
import { listSaccoRequests } from '../../../api/requests.js';
import ChartBox from '../../../components/ChartBox.jsx';
import { Empty } from '../../../components/States.jsx';
import { renderLine, renderBars, renderDonut, fAx, fTipM } from '../../../lib/charts.js';
import { Body, Count, KesCount, LoanChip } from '../common.jsx';
import { whoOf } from '../helpers.js';

const BOOK = [['requested', 'Waiting', '#F2B441'], ['approved', 'Approved', '#2F8A7B'], ['disbursed', 'Out on loan', '#0F4C47'], ['repaid', 'Repaid', '#8FA89B']];

export default function SaccoOverview() {
  const { saccoId, can, navigate } = useSession();
  const data = useAsync(async () => {
    const [summary, loans, requests] = await Promise.all([
      getSummary(saccoId), listLoans(saccoId, ''),
      can('savings.post') ? listSaccoRequests(saccoId, 'pending') : Promise.resolve(null)
    ]);
    return { summary, loans, requests };
  }, [saccoId], { isEmpty: () => false });

  return (
    <Body status={data.status} error={data.error} reload={data.reload} lines={5}>
      {data.data && <Ready {...data.data} can={can} navigate={navigate} />}
    </Body>
  );
}

function Ready({ summary, loans, requests, can, navigate }) {
  const h = summary.history;
  const book = BOOK.map(([status, label, color]) => ({ label, color, value: fromMinor(loans.filter(l => l.status === status).reduce((t, l) => t + l.principal, 0)) })).filter(p => p.value > 0);
  const bookTotal = book.reduce((t, p) => t + p.value, 0);
  const openLoans = loans.filter(l => l.status === 'requested' || l.status === 'approved' || l.status === 'disbursed').length;

  /* what is waiting for THIS person */
  const mine = [];
  if (can('loan.approve')) mine.push(...loans.filter(l => l.status === 'requested'));
  if (can('loan.disburse')) mine.push(...loans.filter(l => l.status === 'approved'));
  const waiting = can('loan.approve') || can('loan.disburse');
  const rows = waiting ? mine : loans.filter(l => l.status === 'requested' || l.status === 'approved');
  const pendingCount = requests ? `${requests.items.length}${requests.next != null ? '+' : ''}` : null;

  return (
    <div className="sam-stack">
      {(pendingCount != null || rows.length > 0) && (
        <div className="needs" aria-label="Waiting for you">
          {pendingCount != null && (
            <button type="button" className={`need${requests.items.length ? ' hot' : ''}`} onClick={() => navigate('/requests')}>
              <span className="n">{pendingCount}</span><span><b>Member requests waiting</b><small>Deposits and withdrawals to confirm</small></span>
            </button>
          )}
          {waiting && rows.length > 0 && (
            <button type="button" className="need hot" onClick={() => navigate('/loans')}>
              <span className="n">{rows.length}</span><span><b>Loans waiting for you</b><small>Open the queue</small></span>
            </button>
          )}
        </div>
      )}

      <div className="sam-tiles">
        <div className="glass"><div className="eyebrow">Total savings</div><KesCount minor={summary.total_balance} /></div>
        <div className="glass"><div className="eyebrow">Member accounts</div><Count value={summary.account_count} /></div>
        <div className="glass"><div className="eyebrow">Deposits posted</div><KesCount minor={summary.deposit_total} /></div>
        <div className="glass"><div className="eyebrow">Withdrawals posted</div><KesCount minor={summary.withdrawal_total} /></div>
      </div>

      <div className="sam-grid">
        <section className="glass sam-stack sam-s8" aria-labelledby="sv-title">
          <div><div className="eyebrow">Savings</div><h3 id="sv-title" className="font-serif text-xl">The SACCO's savings over 12 months</h3></div>
          {h ? <ChartBox label="SACCO savings over 12 months" draw={(el, still) => renderLine(el, { values: h.savings, labels: h.labels, color: '#0F4C47', fmtAxis: fAx('M'), fmtTip: fTipM }, still)} deps={[h]} />
            : <Empty title="No history yet." hint="The chart appears when the system keeps monthly totals." />}
        </section>
        <section className="glass sam-stack sam-s4" aria-labelledby="lb-title">
          <div><div className="eyebrow">Loan book</div><h3 id="lb-title" className="font-serif text-xl">{openLoans} open loans</h3></div>
          {book.length === 0 ? <Empty title="No loans yet." /> : (
            <div className="donut-wrap">
              <ChartBox label="Loan book by status" style={{ minHeight: 0 }} draw={(el, still) => renderDonut(el, book, `${(bookTotal / 1000).toFixed(0)}K`, 'KES', still)} deps={[loans]} />
              <div className="leg-list">{book.map(p => <div key={p.label}><span><i style={{ background: p.color }} />{p.label}</span><b>KES {p.value.toLocaleString('en-KE')}</b></div>)}</div>
            </div>
          )}
        </section>
        <section className="glass sam-stack sam-s7" aria-labelledby="flow-title">
          <div><div className="eyebrow">Money in and out</div><h3 id="flow-title" className="font-serif text-xl">Deposits against withdrawals</h3></div>
          {h ? (<>
            <ChartBox label="Monthly deposits and withdrawals" draw={(el, still) => renderBars(el, { labels: h.labels, series: [{ name: 'Deposits', values: h.deposits, color: '#0F4C47' }, { name: 'Withdrawals', values: h.withdrawals, color: '#D9663B' }], fmtAxis: fAx('M'), fmtTip: fTipM }, still)} deps={[h]} />
            <div className="legend"><span><i style={{ background: '#0F4C47' }} />Deposits (KES M)</span><span><i style={{ background: '#D9663B' }} />Withdrawals (KES M)</span></div>
          </>) : <Empty title="No history yet." />}
        </section>
        <section className="glass sam-stack sam-s5" aria-labelledby="wait-title">
          <div><div className="eyebrow">{waiting ? 'Waiting for you' : 'In progress'}</div><h3 id="wait-title" className="font-serif text-xl">{waiting ? 'Loans to act on' : 'Loans in progress'}</h3></div>
          {rows.length === 0 ? <Empty title="Nothing is waiting." hint="New loan requests appear here." /> : (
            <div className="sam-stack tight">
              {rows.slice(0, 6).map(l => (
                <button type="button" key={l.id} className="row sam-item" onClick={() => navigate('/loans', { open: `loan:${l.id}` })}>
                  <span className="ico" aria-hidden="true" style={{ background: 'var(--teal)' }}>#</span>
                  <span><span className="title">Loan #{l.id} · {whoOf(l)}</span><span className="sub">{kesFromMinor(l.principal)} · {l.term_months} months · {l.approvals_count} of {l.required_approvals} approvals</span></span>
                  <LoanChip status={l.status} />
                </button>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}