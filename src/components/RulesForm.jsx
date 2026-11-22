import Field from './Field.jsx';
import NotEnforced from './NotEnforced.jsx';

const Hint = ({ children }) => <p className="muted text-sm">{children}</p>;

/* The SACCO rules form. `value` is the object from emptyRules(); `errors` holds a
 * plain-words reason per API field name. Every field says its format and an example. */
export default function RulesForm({ value, onChange, errors = {}, disabled = false }) {
  const set = key => event => onChange({ ...value, [key]: event.target.value });
  const input = (key, extra = {}) => ({ value: value[key], onChange: set(key), disabled, ...extra });
  return (
    <div className="neo-stack">
      <b>SACCO rules</b>
      <p className="muted text-sm">Every member sees these and accepts them before joining. They are locked for the whole cycle.</p>

      <Field id="rule-contribution" label="Contribution amount (KES)" error={errors.contribution_amount}>
        <input {...input('contribution', { inputMode: 'decimal', placeholder: '500' })} />
      </Field>
      <Hint>Required. Whole shillings, above 0. Example: 500.</Hint>
      <Field id="rule-frequency" label="How often members contribute" error={errors.contribution_frequency}>
        <select {...input('frequency')}>
          <option value="weekly">Weekly</option>
          <option value="twice_monthly">Twice a month</option>
          <option value="monthly">Monthly</option>
        </select>
      </Field>

      <Field id="rule-multiple" label="Loan cap (times a member's savings)" error={errors.loan_cap_multiple}>
        <input {...input('multiple', { inputMode: 'numeric', placeholder: '3' })} />
      </Field>
      <Hint>A whole number from 1 to 10. Example: 3 means savings of KES 1,000 allow a loan of up to KES 3,000. Starts at 3, the limit the CARE VSLA manual recommends; you can change it.</Hint>
      <Field id="rule-interest" label={<>Interest or service charge per loan (%)<NotEnforced /></>} error={errors.interest_percent}>
        <input {...input('interest', { inputMode: 'decimal', placeholder: 'Type the rate' })} />
      </Field>
      <Hint>Required, with no default, because no standard rate has been verified. Type what your SACCO agreed, from 0 to 100. Example: 10 means 10% of each loan. Type 0 for no charge. NEXORA records the rate; it does not add interest to any loan.</Hint>

      <div className="grid grid-cols-2 gap-3">
        <Field id="rule-period" label="Repayment period" error={errors.repayment_period_value}>
          <input {...input('periodValue', { inputMode: 'numeric', placeholder: '6' })} />
        </Field>
        <Field id="rule-period-unit" label="Unit">
          <select {...input('periodUnit')}>
            <option value="months">Months</option>
            <option value="days">Days</option>
          </select>
        </Field>
      </div>
      <Hint>Required. The longest a loan may take to repay. Example: 6 months.</Hint>
      <Field id="rule-fine" label={<>Late-payment fine (KES)<NotEnforced /></>} error={errors.late_fine_amount}>
        <input {...input('fine', { inputMode: 'decimal', placeholder: '50' })} />
      </Field>
      <Hint>Required. A flat amount for each late payment. Example: 50. Type 0 for no fine. NEXORA records the fine; it does not charge it.</Hint>
      <Field id="rule-cycle" label="Cycle length (months)" error={errors.cycle_months}>
        <input {...input('cycle', { inputMode: 'numeric', placeholder: '12' })} />
      </Field>
      <Hint>9 to 12 months. Starts at 12. Rules cannot change before the cycle ends.</Hint>

      <b className="text-sm">Optional</b>
      <Field id="rule-guarantors" label={<>Guarantors required<NotEnforced /></>} error={errors.guarantors_required}>
        <input {...input('guarantors', { inputMode: 'numeric', placeholder: '0' })} />
      </Field>
      <Hint>A whole number from 0 to 10. Example: 2. Recorded as a rule; NEXORA does not check guarantors yet.</Hint>
      <Field id="rule-min-days" label="Days of membership before borrowing" error={errors.min_membership_days}>
        <input {...input('minDays', { inputMode: 'numeric', placeholder: '0' })} />
      </Field>
      <Hint>A whole number of days, 0 to 730. Example: 90 (about 3 months).</Hint>
      <Field id="rule-exit" label="What a leaving member gets back" error={errors.exit_rules}>
        <textarea {...input('exit', { rows: 3, maxLength: 500, placeholder: 'Their savings in full, less any unpaid fines.' })} />
      </Field>
      <Hint>Up to 500 characters. Say what is returned and any deduction.</Hint>
      <Field id="rule-purposes" label="Allowed loan purposes" error={errors.loan_purposes}>
        <input {...input('purposes', { maxLength: 200, placeholder: 'School fees, stock, medical bills' })} />
      </Field>
      <Hint>Up to 200 characters ({value.purposes.length} used). Leave empty to allow any purpose.</Hint>
    </div>
  );
}
