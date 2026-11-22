/* reports.js: the SACCO's summary and member activity. Totals are MINOR units. */
import { http, MOCK, mockDelay } from '../lib/http.js';
import { store, ledgerOf, seedHistory } from '../mocks/sam.js';

/* from / to: 'YYYY-MM-DD' or ''. `history` is null when the API has no series (the real API sends totals only): the charts then say "No history yet." */
export async function getSummary(saccoId, { from = '', to = '' } = {}) {
  if (MOCK) {
    await mockDelay();
    const sum = type => store.accounts.reduce((t, a) => t + ledgerOf(a.account_id).filter(x => x.type === type && !x.reverses_id).reduce((s, x) => s + x.amount, 0), 0);
    const cut = from || to ? { from, to } : null;
    return {
      sacco_id: saccoId, from: cut && from, to: cut && to, account_count: store.accounts.length,
      total_balance: store.accounts.reduce((t, a) => t + a.balance, 0), deposit_total: sum('deposit'), withdrawal_total: sum('withdrawal'),
      reversal_count: store.accounts.reduce((t, a) => t + ledgerOf(a.account_id).filter(x => x.reverses_id).length, 0),
      history: { labels: seedHistory.labels, savings: seedHistory.savings, deposits: seedHistory.deposits, withdrawals: seedHistory.withdrawals }
    };
  }
  const body = await http.get(`/admin/saccos/${saccoId}/reports/summary`, { params: { from, to } });
  return { ...body, history: null };
}

export async function getMemberActivity(saccoId, page = 1) {
  if (MOCK) {
    await mockDelay();
    return store.accounts.map(a => { const rows = ledgerOf(a.account_id); return { membership_id: a.membership_id, email: a.name, account_id: a.account_id, transaction_count: rows.length, last_transaction_at: rows.length ? rows[0].created_at : null }; });
  }
  const body = await http.get(`/admin/saccos/${saccoId}/reports/member-activity`, { params: { page, per_page: 100 } });
  return body.members;
}