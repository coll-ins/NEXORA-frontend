/* platform.js: the platform owner's calls. Counts and statuses only, never money. */
import { http, MOCK, mockDelay, ApiError } from '../lib/http.js';
import { platformSaccos as seedSaccos, platformOwners as seedOwners, platformAudit as seedAudit, supportRequests as seedSupport } from '../mocks/neo.js';
import { me } from '../mocks/data.js';

let saccos = seedSaccos.map(s => ({ ...s }));
let owners = seedOwners.map(o => ({ ...o }));
let support = seedSupport.map(s => ({ ...s }));

export async function listSaccos() {
  if (MOCK) { await mockDelay(); return saccos; }
  const body = await http.get('/saccos');
  return body.saccos;
}

export async function getSacco(saccoId) {
  if (MOCK) {
    await mockDelay();
    const row = saccos.find(s => s.id === Number(saccoId));
    if (!row) throw new ApiError(404, 'not_found', 'Not found.');
    return row;
  }
  return http.get(`/saccos/${saccoId}`);
}

export async function createSacco({ name, currency, rules }) {
  if (MOCK) {
    await mockDelay();
    if (!String(name).trim()) throw new ApiError(400, 'validation_error', 'A name is required.');
    if (saccos.some(s => s.name.toLowerCase() === String(name).trim().toLowerCase())) {
      throw new ApiError(409, 'conflict', 'A SACCO with this name already exists.');
    }
    const row = {
      id: Math.max(...saccos.map(s => s.id)) + 1,
      name: String(name).trim(),
      currency,
      status: 'active',
      member_count: 0,
      created_at: new Date().toISOString(),
    };
    saccos = [...saccos, row];
    return row;
  }
  return http.post('/saccos', { body: rules ? { name, currency, rules } : { name, currency } });
}

export async function setSaccoActive(saccoId, active) {
  if (MOCK) {
    await mockDelay();
    saccos = saccos.map(s => (s.id === Number(saccoId) ? { ...s, status: active ? 'active' : 'suspended' } : s));
    return saccos.find(s => s.id === Number(saccoId));
  }
  return http.post(`/saccos/${saccoId}/${active ? 'activate' : 'deactivate'}`);
}

export async function listOwners() {
  if (MOCK) { await mockDelay(); return owners; }
  const body = await http.get('/admin/owners');
  return body.owners;
}

export async function addOwner(email) {
  if (MOCK) {
    await mockDelay();
    if (owners.some(o => o.email === email)) throw new ApiError(409, 'conflict', 'That person is already a platform owner.');
    const row = { user_id: 90 + owners.length + 1, email };
    owners = [...owners, row];
    return row;
  }
  return http.post('/admin/owners', { body: { email } });
}

export async function removeOwner(userId) {
  if (MOCK) {
    await mockDelay();
    // Same refusal, same sentence as DELETE /admin/owners/<id>.
    const row = owners.find(o => o.user_id === Number(userId));
    if (row && row.email === me.email) throw new ApiError(403, 'forbidden', 'You cannot revoke your own platform ownership.');
    owners = owners.filter(o => o.user_id !== Number(userId));
    return owners;
  }
  return http.del(`/admin/owners/${userId}`);
}

/* The platform owner makes the first SACCO admin: only they hold admin.manage. */
export async function inviteFirstAdmin(saccoId, phone) {
  if (MOCK) {
    await mockDelay();
    const digits = String(phone).replace(/[\s-]/g, '').replace(/^\+/, '');
    const normal = digits.startsWith('0') ? `254${digits.slice(1)}` : digits;
    if (!/^254[71]\d{8}$/.test(normal)) {
      throw new ApiError(400, 'validation_error', 'Enter a Safaricom number like 0712 345 678.');
    }
    return {
      id: 1000 + Number(saccoId),
      phone: normal,
      role: 'sacco_admin',
      status: 'invited',
      join_code: String(Math.floor(100000 + Math.random() * 900000)),
      expires_at: new Date(Date.now() + 15 * 60000).toISOString(),
    };
  }
  return http.post(`/saccos/${saccoId}/members`, { body: { phone, role: 'sacco_admin' } });
}

export async function askForAccess(saccoId, { reason, scope }) {
  if (MOCK) {
    await mockDelay();
    if (!String(reason).trim()) throw new ApiError(400, 'validation_error', 'reason is required.');
    const row = {
      id: 100 + support.length,
      sacco_id: Number(saccoId),
      reason: String(reason).trim(),
      scope,
      status: 'requested',
      decided_at: null,
      expires_at: null,
      created_at: new Date().toISOString(),
    };
    support = [...support, row];
    return row;
  }
  return http.post(`/saccos/${saccoId}/support-access`, { body: { reason, scope } });
}

export async function myAccessRequests() {
  if (MOCK) { await mockDelay(); return support; }
  // There is no owner-wide access list; each SACCO's list is the queue.
  return [];
}

export async function platformAudit({ action, page = 1 } = {}) {
  if (MOCK) {
    await mockDelay();
    const rows = seedAudit.filter(e => !action || e.action === action);
    return { entries: rows, page, per_page: 20, total: rows.length };
  }
  return http.get('/admin/audit', { params: { action, page } });
}
