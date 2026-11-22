/* requests.js: member deposit and withdrawal REQUESTS (a request is not money) and the officers' queue.
 * One function per endpoint, each with a mock twin. Pages never call fetch. Items always have amount_minor. */
import { http, MOCK, mockDelay, ApiError } from '../lib/http.js';
import { toMinor } from '../lib/format.js';
import { store, accountOf, ledgerOf, MY_ACCOUNT_ID, MY_EMAIL, lostReply, noAccount, logRef } from '../mocks/sam.js';

const LIMIT = 10;
const lost = () => new ApiError(0, 'offline', 'You are offline.');
const page = (rows, cursor) => {
  const list = rows.filter(r => !cursor || r.id < Number(cursor)).sort((a, b) => b.id - a.id);
  const items = list.slice(0, LIMIT);
  return { items: items.map(r => ({ ...r })), next: list.length > LIMIT ? items[items.length - 1].id : null };
};

/* ---- member ---- */
/* body: { kind, method, amount (whole shillings), phone | bank_name + account_ref, reference } */
export async function createRequest(saccoId, body) {
  if (MOCK) {
    await mockDelay();
    logRef('request', body.reference);
    const again = store.requests.find(r => r.reference === body.reference);
    if (again) { if (lostReply()) throw lost(); return { ...again }; }
    if (body.kind === 'withdrawal') {
      const acct = noAccount() ? null : accountOf(MY_ACCOUNT_ID);
      if (!acct || toMinor(body.amount) > acct.balance) throw new ApiError(409, 'INSUFFICIENT_FUNDS', 'Insufficient funds.');
    }
    const row = {
      id: store.next.request++, sacco_id: saccoId, membership_id: MY_ACCOUNT_ID, name: 'Jordan Mwangi', email: MY_EMAIL, kind: body.kind, method: body.method,
      amount_minor: toMinor(body.amount), phone: body.phone || null, bank_name: body.bank_name || null, account_ref: body.account_ref || null,
      reference: body.reference, status: 'pending', reject_reason: null, ledger_transaction_id: null, decided_at: null, created_at: new Date().toISOString()
    };
    store.requests = [row, ...store.requests];
    if (lostReply()) throw lost();
    return { ...row };
  }
  return http.post('/savings/requests', { body: { sacco_id: saccoId, ...body, amount: toMinor(body.amount) } });
}

export async function listMyRequests(saccoId, kind, cursor) {
  if (MOCK) { await mockDelay(); return page(store.requests.filter(r => r.email === MY_EMAIL && r.kind === kind), cursor); }
  return http.get('/savings/requests/me', { params: { sacco_id: saccoId, kind, limit: LIMIT, cursor } });
}

/* ---- officers ---- */
export async function listSaccoRequests(saccoId, status, cursor) {
  if (MOCK) { await mockDelay(); return page(store.requests.filter(r => !status || r.status === status), cursor); }
  return http.get(`/savings/saccos/${saccoId}/requests`, { params: { status, limit: LIMIT, cursor } });
}

export async function confirmRequest(id, reference) {
  if (MOCK) {
    await mockDelay();
    logRef('confirm', reference);
    const r = store.requests.find(x => x.id === id);
    if (!r) throw new ApiError(404, 'not_found', 'Not found.');
    if (r.email === MY_EMAIL) throw new ApiError(403, 'OWN_REQUEST', 'You cannot decide your own request.');
    if (r.status !== 'pending') throw new ApiError(409, 'REQUEST_ALREADY_DECIDED', 'Someone already decided this request.');
    const acct = accountOf(r.membership_id);
    if (!acct) throw new ApiError(409, 'conflict', 'The member has no savings account in this SACCO.');
    if (r.kind === 'withdrawal' && r.amount_minor > acct.balance) throw new ApiError(409, 'INSUFFICIENT_FUNDS', 'Insufficient funds in savings account.');
    acct.balance += r.kind === 'deposit' ? r.amount_minor : -r.amount_minor;
    const entry = { id: store.next.tx++, type: r.kind, amount: r.amount_minor, reference, created_at: new Date().toISOString(), reverses_id: null };
    ledgerOf(acct.account_id).unshift(entry);
    Object.assign(r, { status: 'confirmed', decided_at: entry.created_at, ledger_transaction_id: entry.id });
    return { ...r };
  }
  return http.post(`/savings/requests/${id}/confirm`, { body: { reference } });
}

export async function rejectRequest(id, reason) {
  if (MOCK) {
    await mockDelay();
    const r = store.requests.find(x => x.id === id);
    if (!r) throw new ApiError(404, 'not_found', 'Not found.');
    if (r.email === MY_EMAIL) throw new ApiError(403, 'OWN_REQUEST', 'You cannot decide your own request.');
    if (r.status !== 'pending') throw new ApiError(409, 'REQUEST_ALREADY_DECIDED', 'Someone already decided this request.');
    if (!String(reason || '').trim()) throw new ApiError(400, 'validation_error', 'Write a reason before you reject this request.');
    Object.assign(r, { status: 'rejected', reject_reason: reason.trim(), decided_at: new Date().toISOString() });
    return { ...r };
  }
  return http.post(`/savings/requests/${id}/reject`, { body: { reason } });
}

/* The balance of one member's account, so a refused confirm can say "Member 5 has KES 41,800, which is less than KES 60,000." */
export async function accountBalanceOf(membershipId) {
  if (MOCK) { await mockDelay(60); const a = accountOf(membershipId); return a ? a.balance : null; }
  return null;   /* the real API has no read for another member's balance on this page: the server's own sentence is shown instead */
}
