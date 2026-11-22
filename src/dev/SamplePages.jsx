/* Two sample pages for the harness. They show the page pattern: useSession, useAsync, the four states, a chart. Copy the pattern, not the file. */
import { useSession } from '../lib/session.jsx';
import { useAsync } from '../lib/useAsync.js';
import { Loading, Empty } from '../components/States.jsx';
import ErrorBanner from '../components/ErrorBanner.jsx';
import StatusChip from '../components/StatusChip.jsx';
import ChartBox from '../components/ChartBox.jsx';
import { describe } from '../lib/errors.js';
import { renderLine, MONTHS, fAx, fTipM } from '../lib/charts.js';
import { loans, savings } from '../mocks/data.js';

const listLoans = async () => loans;

function GrowthChart() {
  return (
    <section className="glass mt-4">
      <ChartBox label="Savings over 12 months" deps={[]}
        draw={(el, still) => renderLine(el, { values: savings, labels: MONTHS, color: 'var(--teal)', fmtAxis: fAx('M'), fmtTip: fTipM }, still)} />
    </section>
  );
}

export function SampleLoans() {
  const { user, toast } = useSession();
  const { status, data, error, reload } = useAsync(listLoans, []);
  let body;
  if (status === 'loading') body = <Loading lines={4} />;
  else if (status === 'error') body = <ErrorBanner onRetry={reload}>{describe(error, { mode: 'page' }).text}</ErrorBanner>;
  else if (status === 'empty') body = <Empty title="No loans are waiting for a decision." hint="New requests show up here." />;
  else body = data.map(l => (
    <div className="row" key={l.id}>
      <div className="icon">{l.id % 10}</div>
      <div><div className="title">Loan #{l.id}</div><div className="sub">{l.who}</div></div>
      <StatusChip status={l.status === 'approved' ? 'Approved' : 'Waiting'} />
    </div>
  ));
  return (
    <>
      <section className="glass">
        <div className="eyebrow">Sample page for {user.name}</div>
        <h2 className="font-serif text-xl">Loans (read only)</h2>
        {body}
        <button type="button" className="btn small mt-2" onClick={() => toast('Saved')}>Toast</button>
      </section>
      <GrowthChart />
    </>
  );
}

export function SampleOverview() {
  const { user } = useSession();
  return (
    <>
      <section className="glass">
        <div className="eyebrow">Sample page for {user.name}</div>
        <h2 className="font-serif text-xl">Overview (sample)</h2>
      </section>
      <GrowthChart />
    </>
  );
}
