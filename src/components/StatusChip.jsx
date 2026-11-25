/* StatusChip: one colour per meaning, everywhere. Pass the status text exactly as the API words it. */
const GOOD = ['Active', 'Posted', 'Approved', 'Paid', 'Disbursed', 'Verified'];
const BAD = ['Reversed', 'Suspended', 'Denied', 'Revoked', 'Rejected', 'Inactive', 'Declined', 'In arrears'];

export default function StatusChip({ status }) {
  const kind = GOOD.includes(status) ? 'up' : BAD.includes(status) ? 'bad' : 'warn';
  return <span className={`chip ${kind}`}>{status}</span>;
}
