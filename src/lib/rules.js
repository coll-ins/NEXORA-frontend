/* SACCO rules: the form's empty state, the browser-side check and the request body.
 * The server checks the same things; these messages say the format, give an example
 * and give the reason, so nobody has to guess. Keys are the API's field names. */
import { parseAmount, toMinor } from './format.js';

export const FREQUENCY_WORDS = { weekly: 'every week', twice_monthly: 'twice a month', monthly: 'every month' };

export const emptyRules = () => ({
  contribution: '', frequency: 'monthly', multiple: '3', interest: '',
  periodValue: '', periodUnit: 'months', fine: '', cycle: '12',
  guarantors: '0', minDays: '0', exit: '', purposes: '',
});

const whole = text => /^\d+$/.test(String(text).trim());

export function checkRules(v) {
  const e = {};
  if (!(parseAmount(v.contribution) > 0)) e.contribution_amount = 'Enter the amount each member pays, above 0. Example: 500 means KES 500.';
  if (!whole(v.multiple) || v.multiple < 1 || v.multiple > 10) e.loan_cap_multiple = 'Enter a whole number from 1 to 10. Example: 3 means savings of KES 1,000 allow a loan of up to KES 3,000.';
  const rate = String(v.interest).trim();
  if (!/^\d+(\.\d{1,2})?$/.test(rate) || Number(rate) > 100) e.interest_percent = 'Type the percentage your SACCO charges per loan, from 0 to 100 with up to 2 decimals. Example: 10 means 10%. Type 0 for no charge. There is no default.';
  const max = v.periodUnit === 'days' ? 730 : 24;
  if (!whole(v.periodValue) || v.periodValue < 1 || v.periodValue > max) e.repayment_period_value = `Enter a whole number from 1 to ${max} ${v.periodUnit}. Example: 6 months.`;
  if (String(v.fine).trim() === '' || Number.isNaN(Number(String(v.fine).replace(/[^\d.]/g, ''))) || parseAmount(v.fine) < 0) e.late_fine_amount = 'Enter a flat amount for each late payment. Example: 50 means KES 50. Type 0 for no fine.';
  if (!whole(v.cycle) || v.cycle < 9 || v.cycle > 12) e.cycle_months = 'Enter 9, 10, 11 or 12 months. Example: 12.';
  if (!whole(v.guarantors) || v.guarantors > 10) e.guarantors_required = 'Enter a whole number from 0 to 10. Example: 2. Type 0 for none.';
  if (!whole(v.minDays) || v.minDays > 730) e.min_membership_days = 'Enter a whole number of days from 0 to 730. Example: 90. Type 0 for none.';
  if (v.exit.length > 500) e.exit_rules = 'Keep this to 500 characters or fewer.';
  if (v.purposes.length > 200) e.loan_purposes = 'Keep this to 200 characters or fewer. Example: school fees, stock, medical bills.';
  return e;
}

export const rulesBody = v => ({
  contribution_amount: toMinor(parseAmount(v.contribution)),
  contribution_frequency: v.frequency,
  loan_cap_multiple: Number(v.multiple),
  interest_percent: Number(v.interest),
  repayment_period_value: Number(v.periodValue),
  repayment_period_unit: v.periodUnit,
  late_fine_amount: toMinor(parseAmount(v.fine)),
  cycle_months: Number(v.cycle),
  guarantors_required: Number(v.guarantors),
  min_membership_days: Number(v.minDays),
  exit_rules: v.exit.trim() || null,
  loan_purposes: v.purposes.trim() || null,
});

/* The form's values for an existing set of rules, to start a proposed change from. */
export const rulesToForm = r => ({
  contribution: String(r.contribution_amount / 100), frequency: r.contribution_frequency,
  multiple: String(r.loan_cap_multiple), interest: String(r.interest_percent),
  periodValue: String(r.repayment_period_value), periodUnit: r.repayment_period_unit,
  fine: String(r.late_fine_amount / 100), cycle: String(r.cycle_months),
  guarantors: String(r.guarantors_required), minDays: String(r.min_membership_days),
  exit: r.exit_rules || '', purposes: r.loan_purposes || '',
});
