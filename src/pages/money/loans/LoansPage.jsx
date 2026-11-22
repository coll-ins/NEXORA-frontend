/* LoansPage: one route, three jobs by permission. The list (loan.view or loan.request), Request a loan (loan.request), and a loan's detail. */
import { useState } from 'react';
import { useSession } from '../../../lib/session.jsx';
import { useAsync } from '../../../lib/useAsync.js';
import { kesFromMinor, dShort } from '../../../lib/format.js';
import { listLoans } from '../../../api/loans.js';
import ErrorBanner from '../../../components/ErrorBanner.jsx';
import { Body, LoanChip } from '../common.jsx';
import { LOAN_FILTERS, whoOf } from '../helpers.js';
import LoanDetail from './LoanDetail.jsx';
import LoanRequest from './LoanRequest.jsx';

export default function LoansPage() {
  const { saccoId, can, takeOpen } = useSession();
  /* a dashboard row may have asked this page to open one loan (takeOpen answers once) */
  const [view, setView] = useState(() => { const id = takeOpen('loan'); return id ? { name: 'detail', id } : { name: 'list' }; });   // list | detail | request
  const [status, setStatus] = useState('');
  const [banner, setBanner] = useState(null);
  const own = !can('loan.view');
  const loans = useAsync(() => listLoans(saccoId, status, { own }), [saccoId, status, own]);


  if (view.name === 'detail') return <LoanDetail id={view.id} onBack={() => { setView({ name: 'list' }); loans.reload(); }} />;
  if (view.name === 'request') return <LoanRequest onBack={() => setView({ name: 'list' })} onSent={() => { setBanner({ kind: 'ok', text: 'Loan request sent. Officers will review it and you will see the decision here.' }); setView({ name: 'list' }); loans.reload(); }} />;

  return (
    <div className="sam-stack">
      {banner && <ErrorBanner kind={banner.kind}>{banner.text}</ErrorBanner>}
      <section className="glass sam-stack" aria-labelledby="loans-title">
        <div className="sam-head">
          <div><div className="eyebrow">{own ? 'My loans' : 'Loans'}</div><h2 id="loans-title" className="font-serif text-2xl">{own ? 'My loans' : "The SACCO's loans"}</h2></div>
          {can('loan.request') && <button type="button" className="btn" onClick={() => { setBanner(null); setView({ name: 'request' }); }}>Request a loan</button>}
        </div>
        <div className="sam-row-gap" role="group" aria-label="Filter by status">
          {LOAN_FILTERS.map(([key, label]) => <button key={key || 'all'} type="button" className="chip pick" aria-pressed={status === key} onClick={() => setStatus(key)}>{label}</button>)}
        </div>
        <Body status={loans.status} error={loans.error} reload={loans.reload} emptyTitle={status ? 'No loans with that status.' : 'No loans yet.'} emptyHint={can('loan.request') ? 'Press Request a loan to ask for one.' : undefined}>
          <div className="sam-stack tight">
            {(loans.data || []).map(l => (
              <button type="button" key={l.id} className="row sam-item" onClick={() => setView({ name: 'detail', id: l.id })}>
                <span className="ico" aria-hidden="true" style={{ background: 'var(--teal)' }}>#</span>
                <span><span className="title">Loan #{l.id}{!own && ` · ${whoOf(l)}`}</span><span className="sub">{kesFromMinor(l.principal)} · {l.term_months} months · {l.approvals_count} of {l.required_approvals} approvals · {dShort(l.created_at)}</span></span>
                <LoanChip status={l.status} />
              </button>
            ))}
          </div>
        </Body>
      </section>
    </div>
  );
}