/* data.js: labels and small helpers for the People and Platform pages (no components). */

export const ROLE_LABEL = {
  sacco_admin: 'SACCO admin',
  secretary: 'Secretary',
  finance_officer: 'Finance officer',
  loans_officer: 'Loans officer',
  member: 'Member',
};

export const STATUS_LABEL = {
  active: 'Active',
  inactive: 'Inactive',
  invited: 'Invited',
  requested: 'Waiting',
  approved: 'Approved',
  denied: 'Denied',
  revoked: 'Revoked',
  expired: 'Expired',
};

export const initials = email => (email || '?').trim().slice(0, 1).toUpperCase();

export const when = iso => {
  if (!iso) return '—';
  return new Date(iso).toLocaleString('en-GB', {
    timeZone: 'Africa/Nairobi',
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });
};

export function roleChips(roles = []) {
  return roles.map(code => ROLE_LABEL[code] || code);
}
