/* RequestHistory: the member's own requests of one kind, newest first, with Pending / Confirmed / Rejected chips. */
import { useSession } from '../../../lib/session.jsx';
import { kesFromMinor, dTime } from '../../../lib/format.js';
import { listMyRequests } from '../../../api/requests.js';
import { Body, LoadMore, RequestChip } from '../common.jsx';
import { METHOD, detailsOf, usePaged } from '../helpers.js';

export default function RequestHistory({ kind, reloadKey }) {
  const { saccoId } = useSession();
  const paged = usePaged(cursor => listMyRequests(saccoId, kind, cursor), [saccoId, kind, reloadKey]);
  const pending = paged.items.filter(r => r.status === 'pending').length;
  return (
    <section className="glass sam-stack" aria-labelledby={`history-${kind}`}>
      <div className="sam-head">
        <div>
          <div className="eyebrow">History</div>
          <h3 id={`history-${kind}`} className="font-serif text-xl">My {kind} requests</h3>
        </div>
        {paged.status === 'ready' && <span className="chip">{pending} pending</span>}
      </div>
      <Body status={paged.status} error={paged.error} reload={paged.reload} emptyTitle={`You have not sent a ${kind} request yet.`}>
        <div className="table-wrap">
          <table className="sam-table">
            <thead><tr><th>When</th><th>Method</th><th className="sam-r">Amount</th><th>Details</th><th>Status</th></tr></thead>
            <tbody>
              {paged.items.map(r => (
                <tr key={r.id}>
                  <td>{dTime(r.created_at)}</td>
                  <td>{METHOD[r.method]}</td>
                  <td className="sam-r">{kesFromMinor(r.amount_minor)}</td>
                  <td>{detailsOf(r)}</td>
                  <td>
                    <RequestChip status={r.status} />
                    {r.status === 'rejected' && r.reject_reason && <span className="sam-sub">Reason: {r.reject_reason}</span>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <LoadMore paged={paged} />
      </Body>
    </section>
  );
}