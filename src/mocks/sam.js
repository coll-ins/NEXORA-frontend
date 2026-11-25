/* sam.js: sample data for the money pages, in the SAME shapes the real API sends (money in minor units).
 * Built from mocks/data.js, which stays untouched. Only src/api/*.js imports this file. */
import { M, paymentRequests, myBalance, accounts as seedAccounts, loans as seedLoans, myLoan, savings, deposits, withdrawals, balance, me } from './data.js';

const NAIROBI = '+03:00';
const iso = (day, mon, hhmm) => new Date(`2026-${mon}-${String(day).padStart(2, '0')}T${hhmm}:00${NAIROBI}`).toISOString();
const minor = shillings => Math.round(shillings * 100);

/* ---- accounts: account_id equals membership_id here, so a request finds its account directly ---- */
export const MY_ACCOUNT_ID = 6;
export const seedAccountRows = seedAccounts.map(([name, code, bal, , status], i) => ({
  account_id: i + 1, membership_id: i + 1, sacco_id: 1, name, code, email: `${name.toLowerCase().replace(/\s+/g, '.')}@example.com`,
  balance: minor(bal), status
})).filter(a => a.status !== 'Invited');

/* ---- ledger: a posted entry is {id,type,amount,reference,created_at,reverses_id}. A reversal is its own row. ---- */
let txId = 1;
const tx = (type, shillings, created_at, reverses_id = null) => ({ id: txId++, type, amount: minor(shillings), reference: `seed-${txId}`, created_at, reverses_id });
export function seedLedgerFor(accountId) {
  const rows = [];
  const base = accountId === MY_ACCOUNT_ID ? 0 : accountId;
  rows.push(tx('deposit', 8500 + base * 100, iso(17, '11', '10:12')));
  rows.push(tx('withdrawal', 8500, iso(30, '10', '09:00')));
  rows.push(tx('deposit', 6000, iso(12, '10', '15:40')));
  const bad = tx('deposit', 2000, iso(4, '10', '11:05'));
  rows.push(bad, tx('withdrawal', 2000, iso(5, '10', '08:30'), bad.id));
  rows.push(tx('interest', 1240, iso(18, '09', '00:05')));
  rows.push(tx('withdrawal', 5000, iso(12, '09', '13:20')));
  for (let m = 8; m >= 1; m--) rows.push(tx(m % 3 ? 'deposit' : 'withdrawal', 3000 + m * 250, iso(10, String(m).padStart(2, '0'), '12:00')));
  return rows.sort((a, b) => (a.created_at < b.created_at ? 1 : -1));
}

/* ---- member deposit and withdrawal requests ---- */
const createdAt = { 1: iso(12, '11', '09:20'), 2: iso(17, '11', '16:05'), 3: iso(10, '11', '11:40'), 4: iso(18, '11', '08:15'), 5: iso(18, '11', '10:02'), 6: iso(18, '11', '11:30') };
const accountOfName = { 'Jordan Mwangi': 6, 'Member 3': 2, 'Member 5': 3, 'Member 7': 4 };
export const seedRequests = paymentRequests.map(r => ({
  id: r.id, sacco_id: 1, membership_id: accountOfName[r.who], name: r.who,
  email: r.mine ? me.email : `${r.who.toLowerCase().replace(/\s+/g, '')}@example.com`,
  kind: r.kind, method: r.method, amount_minor: minor(r.amount),
  phone: r.phone ? r.phone.replace(/\D/g, '').replace(/^0/, '254') : null,
  bank_name: r.bank_name || null, account_ref: r.account_ref || null,
  reference: `seed-request-${r.id}`, status: r.status, reject_reason: r.reject_reason || null,
  ledger_transaction_id: null, decided_at: r.status === 'pending' ? null : createdAt[r.id], created_at: createdAt[r.id]
}));
/* one more of the signed-in person's own requests, so an officer who is also a member sees one with no buttons */
seedRequests.push({ id: 7, sacco_id: 1, membership_id: 6, name: 'Jordan Mwangi', email: me.email, kind: 'withdrawal', method: 'bank', amount_minor: minor(15000), phone: null, bank_name: 'Equity Bank', account_ref: '0123456789', reference: 'seed-request-7', status: 'pending', reject_reason: null, ledger_transaction_id: null, decided_at: null, created_at: iso(18, '11', '12:10') });
export const MY_EMAIL = me.email;

/* ---- loans (the real API's shape: principal in minor units, status requested|approved|rejected|disbursed|repaid) ---- */
const LOAN_BY = { me: 7, other: 8 };
export const seedLoanRows = [
  ...seedLoans.map(l => ({
    id: l.id, sacco_id: 1, membership_id: Number(l.who.replace(/\D/g, '')), name: l.who, principal: minor(l.amount), term_months: l.term,
    required_approvals: l.need, approvals_count: l.steps.filter(Boolean).length, repaid_total: 0,
    status: l.status === 'open' ? 'requested' : 'approved', disbursed_by_membership_id: null, disbursed_at: null, disbursement_transaction_id: null,
    created_at: iso(Number(l.date.split(' ')[0]), '11', '09:00'),
    decisions: l.steps.map((s, i) => s && { step: i + 1, decision: 'approve', reason: null, decided_by_membership_id: LOAN_BY[s.by], created_at: iso(Number(l.date.split(' ')[0]) + 1, '11', '10:30') }).filter(Boolean)
  })),
  { id: 2019, sacco_id: 1, membership_id: 6, name: 'Jordan Mwangi', principal: minor(myLoan.amount), term_months: 12, required_approvals: 2, approvals_count: 2, repaid_total: minor(myLoan.repaid), status: 'disbursed', disbursed_by_membership_id: 9, disbursed_at: iso(2, '09', '14:00'), disbursement_transaction_id: 77, created_at: iso(20, '08', '09:00'), decisions: [{ step: 1, decision: 'approve', reason: null, decided_by_membership_id: 8, created_at: iso(22, '08', '10:00') }, { step: 2, decision: 'approve', reason: null, decided_by_membership_id: 7, created_at: iso(25, '08', '11:00') }] },
  { id: 2027, sacco_id: 1, membership_id: 3, name: 'Member 3', principal: minor(30000), term_months: 3, required_approvals: 1, approvals_count: 0, repaid_total: 0, status: 'rejected', disbursed_by_membership_id: null, disbursed_at: null, disbursement_transaction_id: null, created_at: iso(9, '11', '08:00'), decisions: [{ step: 1, decision: 'reject', reason: 'The member has an unpaid loan.', decided_by_membership_id: 8, created_at: iso(11, '11', '09:15') }] },
  { id: 2031, sacco_id: 1, membership_id: 7, name: 'Member 7', principal: minor(50000), term_months: 6, required_approvals: 1, approvals_count: 1, repaid_total: minor(50000), status: 'repaid', disbursed_by_membership_id: 9, disbursed_at: iso(15, '06', '09:00'), disbursement_transaction_id: 55, created_at: iso(1, '06', '08:00'), decisions: [{ step: 1, decision: 'approve', reason: null, decided_by_membership_id: 8, created_at: iso(3, '06', '09:00') }] }
];
export const LOAN_ME = LOAN_BY.me;

/* ---- reports ---- */
export const seedHistory = { labels: M, savings, deposits, withdrawals, myBalance: balance };
export const seedMyBalance = minor(myBalance);

/* ---- shared mock memory: every api module reads and writes this, so the member pages and the officers' queue see the same rows ---- */
export const store = {
  requests: seedRequests.map(r => ({ ...r })),
  accounts: seedAccountRows.map(a => ({ ...a })),
  ledgers: {},
  loans: seedLoanRows.map(l => ({ ...l, decisions: l.decisions.map(d => ({ ...d })) })),
  refs: new Map(),
  reversals: [],
  next: { request: 100, tx: 1000, loan: 3000 }
};
export const ledgerOf = id => (store.ledgers[id] ||= seedLedgerFor(id));
export const accountOf = id => store.accounts.find(a => a.account_id === Number(id));

/* Testing switches for the harness (set them in the browser console):
 *   window.__SAM_LOSE_REPLY__ = true   the NEXT money call is carried out, then answers "offline" (a lost reply). Press the button again: the same reference comes back as the first result.
 *   window.__SAM_NO_ACCOUNT__ = true   My savings, Deposit and Withdraw behave like a member whose account has not been opened yet. */
export const lostReply = () => { if (typeof window !== 'undefined' && window.__SAM_LOSE_REPLY__) { window.__SAM_LOSE_REPLY__ = false; return true; } return false; };
export const noAccount = () => typeof window !== 'undefined' && window.__SAM_NO_ACCOUNT__ === true;
export const logRef = (what, reference) => { if (!store.refs.has(reference)) store.refs.set(reference, what); console.info(`[mock] ${what} reference=${reference}`); };