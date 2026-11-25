/* money.js: savings accounts, the ledger, posting money, reversals. Money is in MINOR units on the wire.
 * Each function has the real call and a mock twin. Pages never call fetch. */
import { http, MOCK, mockDelay, ApiError } from '../lib/http.js';
import { toMinor } from '../lib/format.js';
import { store, accountOf, ledgerOf, seedHistory, MY_ACCOUNT_ID, lostReply, noAccount, logRef } from '../mocks/sam.js';

const PER_PAGE = 10;
const lost = () => new ApiError(0, 'offline', 'You are offline.');
const paged = (rows, page) => ({ items: rows.slice((page - 1) * PER_PAGE, page * PER_PAGE), page, hasMore: page * PER_PAGE < rows.length });

/* The signed-in member's account in THIS SACCO, or null when an officer has not opened it yet (that is not an error). */
export async function getMyAccount(saccoId) {
  if (MOCK) {
    await mockDelay();
    if (noAccount()) return null;
    const a = accountOf(MY_ACCOUNT_ID); return { id: a.account_id, membership_id: a.membership_id, sacco_id: saccoId, balance: a.balance };
  }
  const body = await http.get('/savings/accounts/me');
  return (body.accounts || []).find(a => a.sacco_id === saccoId) || null;
}

/* There is no history series endpoint yet, so the real call answers null and the charts say "No history yet." The mock has a sample series. */
export async function getMyHistory() {
  if (MOCK) { await mockDelay(); return noAccount() ? null : { labels: seedHistory.labels, values: seedHistory.myBalance }; }
  return null;
}

export async function listTransactions(accountId, page = 1) {
  if (MOCK) { await mockDelay(); return paged(ledgerOf(accountId), page); }
  const body = await http.get(`/savings/accounts/${accountId}/transactions`, { params: { page, per_page: PER_PAGE } });
  return { items: body.transactions, page: body.page, hasMore: body.page * body.per_page < body.total };
}

/* GET /admin/saccos/<id>/accounts : every account of the SACCO (savings.view_all). */
export async function listAccounts(saccoId, page = 1) {
  if (MOCK) { await mockDelay(); return { ...paged(store.accounts.map(a => ({ ...a })), page) }; }
  const body = await http.get(`/admin/saccos/${saccoId}/accounts`, { params: { page, per_page: 50 } });
  return { items: body.accounts.map(a => ({ account_id: a.account_id, membership_id: a.membership_id, email: a.email, balance: a.balance })), page: body.page, hasMore: body.page * body.per_page < body.total };
}

/* kind: 'deposit' | 'withdrawal'. amount in whole shillings. The same reference on a retry returns the first result.
 * A deposit is a MANUAL entry: it needs the M-Pesa receipt code and the payer's phone, and its ledger row is marked source 'manual'.
 * A flagged deposit (large, or a manual entry over the SACCO's limit) is not posted: the answer is { queued: true, request } and a second officer confirms it in the queue. */
export async function postMoney(accountId, kind, { amount, reference, note, mpesaReceipt, phone }) {
  if (MOCK) {
    await mockDelay();
    logRef(kind, reference);
    const prior = store.refs.get('tx:' + reference);
    if (prior) { if (lostReply()) throw lost(); return { ...prior, replayed: true }; }
    const acct = accountOf(accountId);
    if (!acct) throw new ApiError(404, 'not_found', 'Not found.');
    const minor = toMinor(amount);
    if (kind === 'withdrawal' && minor > acct.balance) throw new ApiError(409, 'INSUFFICIENT_FUNDS', 'Insufficient funds in savings account.');
    if (kind === 'deposit' && minor >= 2000000) {
      const request = { id: store.next.request++, kind, source: 'manual', amount_minor: minor, mpesa_receipt: mpesaReceipt, flags: ['manual_over_limit'], awaiting_second_approval: true, status: 'pending' };
      return { queued: true, request };
    }
    acct.balance += kind === 'deposit' ? minor : -minor;
    const entry = { id: store.next.tx++, type: kind, amount: minor, reference, note: note || null, created_at: new Date().toISOString(), reverses_id: null, source: kind === 'deposit' ? 'manual' : 'standard' };
    ledgerOf(accountId).unshift(entry);
    store.refs.set('tx:' + reference, entry);
    if (lostReply()) throw lost();
    return { ...entry, replayed: false };
  }
  const body = kind === 'deposit' ? { amount: toMinor(amount), mpesa_receipt: mpesaReceipt, phone } : { amount: toMinor(amount), reference, note: note || undefined };
  return http.post(`/savings/accounts/${accountId}/${kind === 'deposit' ? 'deposits' : 'withdrawals'}`, { body });
}

/* POST /savings/transactions/<id>/reversals: one officer ASKS for a reversal (needs a reason); nothing is posted. A different officer approves it with approveReversal. */
export async function requestReversal(accountId, transactionId, { reason }) {
  if (MOCK) {
    await mockDelay();
    const rows = ledgerOf(accountId);
    const orig = rows.find(t => t.id === transactionId);
    if (!orig) throw new ApiError(404, 'not_found', 'Not found.');
    if (rows.some(t => t.reverses_id === transactionId)) throw new ApiError(409, 'ALREADY_REVERSED', 'This entry was already reversed.');
    const found = store.reversals.find(r => r.transaction_id === transactionId && r.status === 'pending');
    if (found) return { ...found };
    const row = { id: store.reversals.length + 1, transaction_id: transactionId, account_id: accountId, type: orig.type, amount: orig.amount, reason, status: 'pending', requested_by: 0, created_at: new Date().toISOString() };
    store.reversals.unshift(row);
    return { ...row };
  }
  return http.post(`/savings/transactions/${transactionId}/reversals`, { body: { reason } });
}

/* GET /savings/saccos/<id>/reversal-requests (savings.reverse) */
export async function listReversalRequests(saccoId, status) {
  if (MOCK) { await mockDelay(); return store.reversals.filter(r => !status || r.status === status).map(r => ({ ...r })); }
  const body = await http.get(`/savings/saccos/${saccoId}/reversal-requests`, { params: { status } });
  return body.items;
}

/* `override` sends the reason as `override_reason`: only a SACCO admin may, and only to reverse past an open loan's cap (the server answers 409 LOAN_OVER_CAP first). Only a DIFFERENT officer than the requester may approve (403 SECOND_OFFICER_REQUIRED). */
export async function approveReversal(requestId, { reference, override = false, reason }) {
  if (MOCK) {
    await mockDelay();
    logRef('reversal', reference);
    const req = store.reversals.find(r => r.id === requestId);
    if (!req) throw new ApiError(404, 'not_found', 'Not found.');
    if (req.status !== 'pending') throw new ApiError(409, 'REQUEST_ALREADY_DECIDED', 'Someone already decided this request.');
    if (req.requested_by === 1) throw new ApiError(403, 'SECOND_OFFICER_REQUIRED', 'A different officer must approve a reversal you asked for.');
    const rows = ledgerOf(req.account_id);
    const acct = accountOf(req.account_id);
    const back = req.type === 'deposit' ? 'withdrawal' : 'deposit';
    if (back === 'withdrawal' && req.amount > acct.balance) throw new ApiError(409, 'INSUFFICIENT_FUNDS', 'Insufficient funds in savings account.');
    acct.balance += back === 'deposit' ? req.amount : -req.amount;
    rows.unshift({ id: store.next.tx++, type: back, amount: req.amount, reference, note: req.reason, created_at: new Date().toISOString(), reverses_id: req.transaction_id });
    req.status = 'approved';
    return { ok: true };
  }
  return http.post(`/savings/reversal-requests/${requestId}/approve`, { body: { reference, override_reason: override ? reason : undefined } });
}

export async function rejectReversal(requestId, reason) {
  if (MOCK) {
    await mockDelay();
    const req = store.reversals.find(r => r.id === requestId);
    if (!req) throw new ApiError(404, 'not_found', 'Not found.');
    if (req.status !== 'pending') throw new ApiError(409, 'REQUEST_ALREADY_DECIDED', 'Someone already decided this request.');
    Object.assign(req, { status: 'rejected', reject_reason: reason });
    return { ...req };
  }
  return http.post(`/savings/reversal-requests/${requestId}/reject`, { body: { reason } });
}

/* One account, fresh (the ledger header shows its balance). */
export async function getAccount(accountId) {
  if (MOCK) { await mockDelay(); const a = accountOf(accountId); if (!a) throw new ApiError(404, 'not_found', 'Not found.'); return { id: a.account_id, balance: a.balance, name: a.name, email: a.email, code: a.code }; }
  return http.get(`/savings/accounts/${accountId}`);
}