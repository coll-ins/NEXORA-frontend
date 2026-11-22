import { dLong, kesFromMinor } from '../lib/format.js';
import { FREQUENCY_WORDS } from '../lib/rules.js';
import NotEnforced from './NotEnforced.jsx';

const Row = ({ label, children }) => (
  <div className="flex flex-wrap justify-between gap-x-4 gap-y-1 border-b border-black/5 py-2 last:border-0">
    <dt className="text-muted">{label}</dt>
    <dd className="font-semibold">{children}</dd>
  </div>
);

/* Every rule of a SACCO in plain words. The money block comes first so nobody
 * meets a fee they were not shown. */
export default function RulesView({ rules }) {
  const r = rules;
  return (
    <div className="flex flex-col gap-4">
      <section aria-labelledby="rules-costs">
        <h3 id="rules-costs" className="font-serif text-lg">What it costs you</h3>
        <dl>
          <Row label="Contribution">{kesFromMinor(r.contribution_amount)} {FREQUENCY_WORDS[r.contribution_frequency]}</Row>
          <Row label={<>Late-payment fine<NotEnforced /></>}>{r.late_fine_amount ? `${kesFromMinor(r.late_fine_amount)} each time` : 'None'}</Row>
          <Row label={<>Interest or service charge<NotEnforced /></>}>{r.interest_percent ? `${r.interest_percent}% of each loan` : 'None'}</Row>
          <Row label="If you leave">{r.exit_rules || 'No exit rules were written.'}</Row>
        </dl>
        <p className="muted text-sm">There are no other charges in these rules. NEXORA records them; it does not move money or collect them for you.</p>
      </section>
      <section aria-labelledby="rules-loans">
        <h3 id="rules-loans" className="font-serif text-lg">Borrowing</h3>
        <dl>
          <Row label="Most you can borrow">{r.loan_cap_multiple} times your savings</Row>
          <Row label="Repay within">{r.repayment_period_value} {r.repayment_period_unit}</Row>
          <Row label={<>Guarantors needed<NotEnforced /></>}>{r.guarantors_required || 'None'}</Row>
          <Row label="Wait before your first loan">{r.min_membership_days ? `${r.min_membership_days} days` : 'None'}</Row>
          <Row label="Allowed purposes">{r.loan_purposes || 'Not limited'}</Row>
        </dl>
      </section>
      <section aria-labelledby="rules-cycle">
        <h3 id="rules-cycle" className="font-serif text-lg">The cycle</h3>
        <dl>
          <Row label="Length">{r.cycle_months} months</Row>
          {r.cycle_starts_on && <Row label="Runs">{dLong(r.cycle_starts_on)} to {dLong(r.cycle_ends_on)}</Row>}
        </dl>
        <p className="muted text-sm">These rules are locked until the cycle ends. After that they change only if the members vote for it.</p>
      </section>
    </div>
  );
}
