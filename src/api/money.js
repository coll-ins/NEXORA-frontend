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

/* kind: 'deposit' | 'withdrawal'. amount in whole shillings. The same reference on a retry returns the first result. */
export async function postMoney(accountId, kind, { amount, reference, note }) {
  if (MOCK) {
    await mockDelay();
    logRef(kind, reference);
    const prior = store.refs.get('tx:' + reference);
    if (prior) { if (lostReply()) throw lost(); return { ...prior, replayed: true }; }
    const acct = accountOf(accountId);
    if (!acct) throw new ApiError(404, 'not_found', 'Not found.');
    const minor = toMinor(amount);
    if (kind === 'withdrawal' && minor > acct.balance) throw new ApiError(409, 'INSUFFICIENT_FUNDS', 'Insufficient funds in savings account.');
    acct.balance += kind === 'deposit' ? minor : -minor;
    const entry = { id: store.next.tx++, type: kind, amount: minor, reference, note: note || null, created_at: new Date().toISOString(), reverses_id: null };
    ledgerOf(accountId).unshift(entry);
    store.refs.set('tx:' + reference, entry);
    if (lostReply()) throw lost();
    return { ...entry, replayed: false };
  }
  return http.post(`/savings/accounts/${accountId}/${kind === 'deposit' ? 'deposits' : 'withdrawals'}`, { body: { amount: toMinor(amount), reference, note: note || undefined } });
}

/* POST /savings/transactions/<id>/reversals. `override` sends the reason as `override_reason`: only a SACCO admin may, and only to reverse past an open loan's cap (the server answers 409 LOAN_OVER_CAP first); the sentence for a double reverse comes from the server. */
export async function reverseTransaction(accountId, transactionId, { reference, reason, override = false }) {
  if (MOCK) {
    await mockDelay();
    logRef('reversal', reference);
    const rows = ledgerOf(accountId);
    const orig = rows.find(t => t.id === transactionId);
    if (!orig) throw new ApiError(404, 'not_found', 'Not found.');
    if (rows.some(t => t.reverses_id === transactionId)) throw new ApiError(409, 'ALREADY_REVERSED', 'This entry was already reversed.');
    const acct = accountOf(accountId);
    const back = orig.type === 'deposit' ? 'withdrawal' : 'deposit';
    if (back === 'withdrawal' && orig.amount > acct.balance) throw new ApiError(409, 'INSUFFICIENT_FUNDS', 'Insufficient funds in savings account.');
    acct.balance += back === 'deposit' ? orig.amount : -orig.amount;
    rows.unshift({ id: store.next.tx++, type: back, amount: orig.amount, reference, note: reason, created_at: new Date().toISOString(), reverses_id: transactionId });
    return { ok: true };
  }
  return http.post(`/savings/transactions/${transactionId}/reversals`, { body: { reference, reason, override_reason: override ? reason : undefined } });
}

/* One account, fresh (the ledger header shows its balance). */
export async function getAccount(accountId) {
  if (MOCK) { await mockDelay(); const a = accountOf(accountId); if (!a) throw new ApiError(404, 'not_found', 'Not found.'); return { id: a.account_id, balance: a.balance, name: a.name, email: a.email, code: a.code }; }
  return http.get(`/savings/accounts/${accountId}`);
}