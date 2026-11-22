/* loans.js: the loan list, one loan with its decisions, and the actions on it. Principal and repaid_total are MINOR units. */
import { http, MOCK, mockDelay, ApiError } from '../lib/http.js';
import { toMinor } from '../lib/format.js';
import { store, LOAN_ME, MY_ACCOUNT_ID, lostReply, logRef } from '../mocks/sam.js';

const lost = () => new ApiError(0, 'offline', 'You are offline.');
const strip = l => { const { decisions, ...rest } = l; void decisions; return { ...rest }; };

/* status: 'requested' | 'approved' | 'disbursed' | 'repaid' | 'rejected' | '' (all). own: mock only, a member sees just their own loans (the server decides that for the real call). */
export async function listLoans(saccoId, status = '', { own = false } = {}) {
  if (MOCK) {
    await mockDelay();
    return store.loans.filter(l => (!status || l.status === status) && (!own || l.membership_id === MY_ACCOUNT_ID)).sort((a, b) => b.id - a.id).map(strip);
  }
  const body = await http.get(`/loans/saccos/${saccoId}`, { params: { status, per_page: 100 } });
  return body.loans;
}

export async function getLoan(id) {
  if (MOCK) {
    await mockDelay();
    const l = store.loans.find(x => x.id === Number(id));
    if (!l) throw new ApiError(404, 'not_found', 'Not found.');
    return { ...strip(l), decisions: l.decisions.map(d => ({ ...d })) };
  }
  return http.get(`/loans/${id}`);
}

/* principal in whole shillings */
export async function requestLoan(saccoId, { principal, term_months }) {
  if (MOCK) {
    await mockDelay();
    const l = { id: store.next.loan++, sacco_id: saccoId, membership_id: MY_ACCOUNT_ID, name: 'Jordan Mwangi', principal: toMinor(principal), term_months, required_approvals: 2, approvals_count: 0, repaid_total: 0, status: 'requested', disbursed_by_membership_id: null, disbursed_at: null, disbursement_transaction_id: null, created_at: new Date().toISOString(), decisions: [] };
    store.loans = [l, ...store.loans];
    return strip(l);
  }
  return http.post(`/loans/saccos/${saccoId}`, { body: { principal: toMinor(principal), term_months } });
}

/* decision: 'approve' | 'reject'. A rejection needs a reason. */
export async function decideLoan(id, { step, decision, reason }) {
  if (MOCK) {
    await mockDelay();
    const l = store.loans.find(x => x.id === Number(id));
    if (!l || l.status !== 'requested') throw new ApiError(409, 'conflict', 'This loan is not waiting for a decision.');
    if (decision === 'reject' && !String(reason || '').trim()) throw new ApiError(400, 'validation_error', 'A rejection needs a reason.');
    if (l.decisions.some(d => d.decided_by_membership_id === LOAN_ME)) throw new ApiError(403, 'LOAN_SAME_OFFICER', 'A different officer must give the second approval.');
    l.decisions.push({ step, decision, reason: (reason || '').trim() || null, decided_by_membership_id: LOAN_ME, created_at: new Date().toISOString() });
    if (decision === 'reject') l.status = 'rejected';
    else { l.approvals_count += 1; if (l.approvals_count >= l.required_approvals) l.status = 'approved'; }
    return strip(l);
  }
  return http.post(`/loans/${id}/decisions`, { body: { step, decision, reason: reason || undefined } });
}

export async function disburseLoan(id, reference) {
  if (MOCK) {
    await mockDelay();
    logRef('disbursement', reference);
    const l = store.loans.find(x => x.id === Number(id));
    if (l.status === 'disbursed') { if (lostReply()) throw lost(); return strip(l); }
    if (l.status !== 'approved') throw new ApiError(409, 'LOAN_NEEDS_APPROVAL', 'This loan needs all its approvals before it can be paid out.');
    Object.assign(l, { status: 'disbursed', disbursed_at: new Date().toISOString(), disbursed_by_membership_id: 9 });
    if (lostReply()) throw lost();
    return strip(l);
  }
  return http.post(`/loans/${id}/disbursements`, { body: { reference } });
}

/* amount in whole shillings */
export async function repayLoan(id, { amount, reference }) {
  if (MOCK) {
    await mockDelay();
    logRef('repayment', reference);
    const l = store.loans.find(x => x.id === Number(id));
    if (store.refs.has('rp:' + reference)) { if (lostReply()) throw lost(); return strip(l); }
    if (l.status !== 'disbursed') throw new ApiError(409, 'conflict', 'This loan is not open for repayments.');
    l.repaid_total += toMinor(amount);
    if (l.repaid_total >= l.principal) l.status = 'repaid';
    store.refs.set('rp:' + reference, true);
    if (lostReply()) throw lost();
    return strip(l);
  }
  return http.post(`/loans/${id}/repayments`, { body: { amount: toMinor(amount), reference } });
}