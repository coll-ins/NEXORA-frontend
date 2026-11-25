/* payin.js: where members pay in, set by officers and changed only with a second officer's approval.
 * One function per endpoint, each with a mock twin. Real mode never shows sample numbers. */
import { http, MOCK, mockDelay, ApiError } from '../lib/http.js';
import { payIn as sample } from '../mocks/data.js';

/* Mock mode only: one officer (id 1) is signed in and a change proposed by the same person cannot be approved. */
const MY_ID = 1;
const mock = {
  details: {
    mpesa_type: 'paybill', mpesa_number: sample.paybill, account_reference_hint: sample.account, display_name: 'Alpha SACCO',
    bank_name: sample.bank, bank_account_name: sample.bankAccountName, bank_account_number: sample.bankAccount, bank_branch: null,
    bank_uses_shared_paybill: false, bank_paybill_number: null, bank_manual_confirm_only: false, updated_at: '2026-11-10T09:00:00+03:00',
  },
  pending: null,
  next: 1,
};

/* -> { details, pending }. `pending` is a change waiting for a second officer, with its values;
 * a member never gets it. A second officer's approval is live as soon as it answers. */
export async function getPayIn(saccoId) {
  if (MOCK) { await mockDelay(80); return structuredClone({ details: mock.details, pending: mock.pending }); }
  return http.get(`/saccos/${saccoId}/payment-details`);
}

export async function proposePayIn(saccoId, body) {
  if (MOCK) {
    await mockDelay();
    mock.pending = {
      id: mock.next++, status: 'pending', proposed_by: MY_ID, proposed_by_email: 'you@example.com', proposed_at: new Date().toISOString(),
      values: { ...body, bank_manual_confirm_only: body.bank_uses_shared_paybill },
    };
    return structuredClone(mock.pending);
  }
  return (await http.post(`/saccos/${saccoId}/payment-details/changes`, { body })).change;
}

export async function approvePayIn(saccoId, changeId) {
  if (MOCK) {
    await mockDelay();
    if (!mock.pending || mock.pending.id !== changeId) throw new ApiError(409, 'conflict', 'This change was already approved or replaced by a newer one.');
    if (mock.pending.proposed_by === MY_ID) throw new ApiError(403, 'PAYIN_SAME_OFFICER', 'A different officer must approve this change. You proposed it.');
    const now = new Date().toISOString();
    /* The approval is the moment it takes effect: members see these values now. */
    mock.details = { ...mock.pending.values, updated_at: now };
    const done = { ...mock.pending, status: 'approved', approved_at: now, go_live_at: now };
    mock.pending = null;
    return structuredClone(done);
  }
  return (await http.post(`/saccos/${saccoId}/payment-details/changes/${changeId}/approve`)).change;
}
