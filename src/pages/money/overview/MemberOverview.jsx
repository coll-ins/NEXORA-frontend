/* MemberOverview: my balance, my loan, and my recent activity. Everything comes from the member's own account and loans. */
import { useSession } from '../../../lib/session.jsx';
import { useAsync } from '../../../lib/useAsync.js';
import { kesFromMinor, dLong } from '../../../lib/format.js';
import { getMyAccount, getMyHistory, listTransactions } from '../../../api/money.js';
import { listLoans } from '../../../api/loans.js';
import ChartBox from '../../../components/ChartBox.jsx';
import StatusChip from '../../../components/StatusChip.jsx';
import { Empty } from '../../../components/States.jsx';
import { renderLine, renderRing, fAx, fTipK } from '../../../lib/charts.js';
import { Body, KesCount, LoanChip } from '../common.jsx';
import { instalmentMinor, isCredit, reversedSet, txTitle } from '../helpers.js';

export default function MemberOverview() {
  const { saccoId, navigate } = useSession();
  const data = useAsync(async () => {
    const [account, history, loans] = await Promise.all([getMyAccount(saccoId), getMyHistory(saccoId), listLoans(saccoId, '', { own: true })]);
    const tx = account ? (await listTransactions(account.id, 1)).items.slice(0, 5) : [];
    return { account, history, loans, tx };
  }, [saccoId], { isEmpty: () => false });

  return (
    <Body status={data.status} error={data.error} reload={data.reload} lines={5}>
      {data.data && <Ready {...data.data} navigate={navigate} />}
    </Body>
  );
}

function Ready({ account, history, loans, tx, navigate }) {
  const loan = loans.find(l => l.status === 'disbursed') || loans.find(l => l.status === 'requested' || l.status === 'approved') || null;
  const pct = loan && loan.principal ? Math.min(100, Math.round(loan.repaid_total * 100 / loan.principal)) : 0;
  const reversed = reversedSet(tx);
  return (
    <div className="sam-grid">
      <section className="glass sam-stack sam-s8" aria-labelledby="mb-title">
        <div><div className="eyebrow" id="mb-title">My savings balance</div><KesCount minor={account ? account.balance : 0} />
          {!account && <p className="muted">Your savings account opens when an officer posts your first deposit.</p>}</div>
        {history ? <ChartBox label="My balance over 12 months" draw={(el, still) => renderLine(el, { values: history.values, labels: history.labels, color: '#0F4C47', fmtAxis: fAx('K'), fmtTip: fTipK }, still)} deps={[history]} />
          : <Empty title="No history yet." hint="The chart fills in as your balance changes." />}
      </section>

      <section className="glass sam-stack sam-s4" aria-labelledby="ml-title">
        <div><div className="eyebrow">My loan</div><h3 id="ml-title" className="font-serif text-xl">{loan ? `Loan #${loan.id}` : 'No open loan'}</h3></div>
        {loan ? (<>
          <div className="sam-row-gap"><b>{kesFromMinor(loan.principal)}</b><span className="muted">over {loan.term_months} months</span><LoanChip status={loan.status} /></div>
          {loan.status === 'disbursed' ? (<>
            <div className="ring-wrap"><ChartBox label={`${pct} percent repaid`} style={{ minHeight: 0 }} draw={(el, still) => renderRing(el, pct, still)} deps={[pct]} /></div>
            <p className="muted">Repaid {kesFromMinor(loan.repaid_total)}. About {kesFromMinor(instalmentMinor(loan))} a month in equal parts, before any interest. Due dates are not set in the system yet.</p>
          </>) : <p className="muted">{loan.status === 'requested' ? `${loan.approvals_count} of ${loan.required_approvals} approvals so far.` : 'Approved. An officer will pay it out.'}</p>}
          <div className="sam-row-gap">
            <button type="button" className="btn small" onClick={() => navigate('/loans', { open: `loan:${loan.id}` })}>{loan.status === 'disbursed' ? 'Repay' : 'Open loan'}</button>
          </div>
        </>) : (<>
          <p className="muted">You have no loan right now.</p>
          <button type="button" className="btn small" onClick={() => navigate('/loans')}>Request a loan</button>
        </>)}
      </section>

      <section className="glass sam-stack sam-s12" aria-labelledby="ra-title">
        <div className="sam-head"><div><div className="eyebrow">Latest</div><h3 id="ra-title" className="font-serif text-xl">Recent activity</h3></div><button type="button" className="btn ghost small" onClick={() => navigate('/savings')}>All transactions</button></div>
        {tx.length === 0 ? <Empty title="No transactions yet." /> : (
          <div className="sam-stack tight">
            {tx.map(t => (
              <div className="row" key={t.id}>
                <span className="ico" aria-hidden="true" style={{ background: 'var(--teal-2)' }}>{isCredit(t) ? '+' : '-'}</span>
                <span><span className="title">{txTitle(t)}</span><span className="sub">{dLong(t.created_at)}</span></span>
                <span className="amt"><span className={isCredit(t) ? 'sam-credit' : ''}>{isCredit(t) ? '+' : '-'}{kesFromMinor(t.amount)}</span> <StatusChip status={reversed.has(t.id) ? 'Reversed' : 'Posted'} /></span>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}