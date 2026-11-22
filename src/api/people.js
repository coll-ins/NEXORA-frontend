/* people.js: one function per People endpoint, each with a mock twin.
 * The page never calls fetch: this file is the only place that does.
 */
import { http, MOCK, mockDelay, ApiError } from '../lib/http.js';
import { members as seedMembers, supportRequests as seedSupport, auditLog as seedAudit, saccoSettings as seedSettings } from '../mocks/neo.js';

/* Mock memory: the pages behave like the real thing, including mutations. */
let members = seedMembers.map(m => ({ ...m }));
let support = seedSupport.map(s => ({ ...s }));
let settings = { ...seedSettings };

const code = () => String(Math.floor(100000 + Math.random() * 900000));
const expires = minutes => new Date(Date.now() + minutes * 60000).toISOString();

export async function listMembers(saccoId) {
  if (MOCK) { await mockDelay(); return members.filter(m => m.status !== 'invited' || m.phone); }
  const body = await http.get(`/saccos/${saccoId}/members`);
  return body.members;
}

export async function getMember(saccoId, membershipId) {
  if (MOCK) { await mockDelay(); return members.find(m => m.id === Number(membershipId)); }
  return http.get(`/saccos/${saccoId}/members/${membershipId}`);
}

export async function listInvited(saccoId) {
  if (MOCK) { await mockDelay(); return members.filter(m => m.status === 'invited'); }
  return listMembers(saccoId).then(rows => rows.filter(m => m.status === 'invited'));
}

export async function addMember(saccoId, { phone, role }) {
  if (MOCK) {
    await mockDelay();
    const digits = String(phone).replace(/[\s-]/g, '').replace(/^\+/, '');
    const normal = digits.startsWith('0') ? `254${digits.slice(1)}` : digits;
    if (!/^254[71]\d{8}$/.test(normal)) throw new ApiError(400, 'validation_error', 'Enter a Safaricom number like 0712 345 678.');
    const existing = members.find(m => m.phone === normal && m.status === 'active');
    if (existing) throw new ApiError(409, 'conflict', 'That number is already a member of this SACCO.');
    const invited = members.find(m => m.phone === normal);
    const row = invited || { id: 100 + members.length + 1, user_id: null, email: null, phone: normal, role, roles: [role], status: 'invited', created_at: new Date().toISOString() };
    if (invited) row.role = role;
    else members = [...members, row];
    return { id: row.id, phone: normal, role, status: 'invited', join_code: code(), expires_at: expires(15) };
  }
  return http.post(`/saccos/${saccoId}/members`, { body: { phone, role } });
}

export async function updateMember(saccoId, membershipId, body) {
  if (MOCK) {
    await mockDelay();
    members = members.map(m => (m.id === Number(membershipId) ? { ...m, ...body } : m));
    return members.find(m => m.id === Number(membershipId));
  }
  return http.patch(`/saccos/${saccoId}/members/${membershipId}`, { body });
}

export async function setRoles(saccoId, membershipId, roles) {
  if (MOCK) {
    await mockDelay();
    members = members.map(m => (m.id === Number(membershipId) ? { ...m, roles } : m));
    return { membership_id: Number(membershipId), roles };
  }
  return http.put(`/saccos/${saccoId}/members/${membershipId}/roles`, { body: { roles } });
}

export async function getSettings(saccoId) {
  if (MOCK) { await mockDelay(); return settings; }
  return http.get(`/saccos/${saccoId}/settings`);
}

export async function saveSettings(saccoId, body) {
  if (MOCK) { await mockDelay(); settings = { ...settings, ...body }; return settings; }
  return http.patch(`/saccos/${saccoId}/settings`, { body });
}

export async function renameSacco(saccoId, name) {
  if (MOCK) { await mockDelay(); return { id: Number(saccoId), name }; }
  return http.patch(`/saccos/${saccoId}`, { body: { name } });
}

export async function listAccess(saccoId) {
  if (MOCK) { await mockDelay(); return support.filter(s => s.sacco_id === Number(saccoId)); }
  const body = await http.get(`/saccos/${saccoId}/support-access`);
  return body.requests;
}

export async function decideAccess(requestId, action, body = {}) {
  if (MOCK) {
    await mockDelay();
    const status = action === 'approve' ? 'approved' : action === 'deny' ? 'denied' : 'revoked';
    support = support.map(s => (s.id === Number(requestId)
      ? { ...s, status, decided_at: new Date().toISOString(), expires_at: status === 'approved' ? expires(body.hours || 4) : null }
      : s));
    return support.find(s => s.id === Number(requestId));
  }
  return http.post(`/support-access/${requestId}/${action}`, { body });
}

export async function listAudit(saccoId, { action, page = 1 } = {}) {
  if (MOCK) {
    await mockDelay();
    const rows = seedAudit.filter(e => !action || e.action === action);
    return { entries: rows, page, per_page: 20, total: rows.length };
  }
  return http.get(`/admin/saccos/${saccoId}/audit`, { params: { action, page } });
}
