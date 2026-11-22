/* neo.js: sample data for the People and Platform pages (Neo).
 * The same shapes the API sends, so a page built here works against the backend.
 */

const iso = (daysAgo, hour = 9) => {
  const d = new Date();
  d.setDate(d.getDate() - daysAgo);
  d.setHours(hour, 15, 0, 0);
  return d.toISOString();
};

export const members = [
  { id: 101, user_id: 11, email: 'jordan.mwangi@example.com', phone: '254712345678', role: 'sacco_admin', roles: ['sacco_admin'], status: 'active', created_at: iso(140) },
  { id: 102, user_id: 12, email: 'aisha.otieno@example.com', phone: '254712345679', role: 'staff', roles: ['secretary'], status: 'active', created_at: iso(133) },
  { id: 103, user_id: 13, email: 'brian.kimani@example.com', phone: '254712345680', role: 'staff', roles: ['finance_officer'], status: 'active', created_at: iso(121) },
  { id: 104, user_id: 14, email: 'carol.wanjiku@example.com', phone: '254712345681', role: 'staff', roles: ['loans_officer'], status: 'active', created_at: iso(96) },
  { id: 105, user_id: 15, email: 'david.ochieng@example.com', phone: '254712345682', role: 'member', roles: ['member'], status: 'active', created_at: iso(74) },
  { id: 106, user_id: 16, email: 'esther.njeri@example.com', phone: '254712345683', role: 'member', roles: ['member'], status: 'active', created_at: iso(52) },
  { id: 107, user_id: null, email: null, phone: '254712345684', role: 'member', roles: ['member'], status: 'invited', created_at: iso(2, 16) },
  { id: 108, email: 'fred.omondi@example.com', user_id: 18, phone: '254712345685', role: 'member', roles: ['member'], status: 'inactive', created_at: iso(210) },
];

export const supportRequests = [
  { id: 31, sacco_id: 1, requested_by_user_id: 91, reason: 'Customer ticket 4471 (statement dispute)', scope: 'savings', status: 'requested', decided_by_membership_id: null, decided_at: null, expires_at: null, revoked_by_membership_id: null, revoked_at: null, created_at: iso(0, 8) },
  { id: 30, sacco_id: 1, requested_by_user_id: 91, reason: 'Checking the audit trail after a reversal', scope: 'audit', status: 'requested', decided_by_membership_id: null, decided_at: null, expires_at: null, revoked_by_membership_id: null, revoked_at: null, created_at: iso(1, 14) },
  { id: 29, sacco_id: 1, requested_by_user_id: 92, reason: 'Onboarding help for a new treasurer', scope: 'members', status: 'approved', decided_by_membership_id: 101, decided_at: iso(1, 10), expires_at: iso(-1, 10), revoked_by_membership_id: null, revoked_at: null, created_at: iso(1, 9) },
  { id: 24, sacco_id: 1, requested_by_user_id: 91, reason: 'Investigating a duplicate deposit', scope: 'savings', status: 'denied', decided_by_membership_id: 101, decided_at: iso(12), expires_at: null, revoked_by_membership_id: null, revoked_at: null, created_at: iso(13) },
];

export const auditLog = [
  { id: 900, action: 'savings.deposit', target: 'savings_account:44/transaction:512', actor_email: 'brian.kimani@example.com', created_at: iso(0, 11) },
  { id: 899, action: 'savings.request.confirm', target: 'payment_request:19', actor_email: 'brian.kimani@example.com', created_at: iso(0, 10) },
  { id: 898, action: 'member.invite', target: 'membership:107 member/member', actor_email: 'jordan.mwangi@example.com', created_at: iso(0, 9) },
  { id: 897, action: 'loan.decision', target: 'loan:2045 step 1 approve', actor_email: 'carol.wanjiku@example.com', created_at: iso(1, 15) },
  { id: 896, action: 'support.approve', target: 'grant:29 members', actor_email: 'jordan.mwangi@example.com', created_at: iso(1, 10) },
  { id: 895, action: 'member.update', target: 'membership:108 member/inactive', actor_email: 'jordan.mwangi@example.com', created_at: iso(3, 12) },
  { id: 894, action: 'savings.reverse', target: 'savings_account:22/transaction:498', actor_email: 'brian.kimani@example.com', created_at: iso(4, 16) },
  { id: 893, action: 'member.sacco_login', target: 'membership:105 ok', actor_email: 'david.ochieng@example.com', created_at: iso(5, 8) },
];

export const saccoSettings = {
  sacco_id: 1,
  loan_cap: 0,
  savings_multiple: 3,
  join_code_ttl_minutes: 15,
  required_approvals: 2,
};

export const platformSaccos = [
  { id: 1, name: 'Alpha SACCO', currency: 'KES', status: 'active', member_count: 6, created_at: iso(180) },
  { id: 2, name: 'Beta SACCO', currency: 'KES', status: 'active', member_count: 3, created_at: iso(120) },
  { id: 3, name: 'Gamma SACCO', currency: 'KES', status: 'suspended', member_count: 2, created_at: iso(90) },
  { id: 4, name: 'Delta SACCO', currency: 'KES', status: 'active', member_count: 0, created_at: iso(6) },
];

export const platformOwners = [
  { user_id: 91, email: 'owner@example.com' },
  { user_id: 92, email: 'owner2@example.com' },
  { user_id: 93, email: 'jordan@example.com' },   // the signed-in owner, so "you cannot remove yourself" is reachable in the harness
];

export const platformAudit = [
  { id: 880, action: 'sacco.create', target: 'sacco:4', actor_email: 'owner@example.com', created_at: iso(6) },
  { id: 879, action: 'sacco.deactivate', target: 'sacco:3', actor_email: 'owner@example.com', created_at: iso(9) },
  { id: 878, action: 'platform.owner_grant', target: 'user:92', actor_email: 'owner@example.com', created_at: iso(20) },
  { id: 877, action: 'support.request', target: 'grant:31 savings', actor_email: 'owner@example.com', created_at: iso(0, 8) },
  { id: 876, action: 'sacco.activate', target: 'sacco:2', actor_email: 'owner2@example.com', created_at: iso(30) },
];
