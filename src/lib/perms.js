/*
 * perms.js: who can do what, and which pages each person sees.
 * Copy to frontend/src/lib/perms.js. In release 1 this table is the fallback; the real answer comes from
 * the permissions endpoint (GET /api/v1/members/me/permissions, built by Neo). The permission NAMES are the
 * ones in backend/app/security/permissions.py and never change.
 *
 * savings.request is NEW (Neo adds it to the member role in backend item 6): a member may send a deposit or withdrawal REQUEST.
 * Officers (savings.post) confirm or reject those requests on the 'requests' page.
 *
 * RULE: the UI decides by permission name, never by role name. Role names exist only for labels and for the
 * prototype's "view as" menu.
 */

export const ROLES = {
  admin:     { label: 'SACCO admin',     perms: ['dashboard.view', 'sacco.view', 'member.view', 'member.manage', 'savings.view', 'savings.view_all', 'savings.post', 'savings.reverse', 'loan.view', 'report.view', 'sacco.update', 'support.approve', 'payin.manage'] },
  secretary: { label: 'Secretary',       perms: ['dashboard.view', 'sacco.view', 'member.view', 'savings.view', 'savings.view_all', 'loan.view', 'audit.view', 'report.view'] },
  finance:   { label: 'Finance officer', perms: ['dashboard.view', 'sacco.view', 'savings.view', 'savings.view_all', 'savings.post', 'savings.reverse', 'loan.view', 'loan.disburse', 'loan.repay', 'report.view', 'payin.manage'] },
  loans:     { label: 'Loans officer',   perms: ['dashboard.view', 'sacco.view', 'member.view', 'savings.view', 'loan.view', 'loan.approve', 'report.view'] },
  member:    { label: 'Member',          perms: ['dashboard.view', 'sacco.view', 'savings.view', 'savings.request', 'loan.request', 'loan.repay'] },
  platform:  { label: 'Platform owner',  perms: ['platform', 'dashboard.view', 'admin.manage', 'sacco.manage', 'sacco.update'] }
};

export const can = (perms, p) => perms.includes(p);

/* Every route the signed-in app has. `ok` says who may open it. `icon` is an SVG path (24x24, stroke). */
const sacco = perms => !perms.includes('platform');
export const ROUTES = [
  { path: 'pf-overview', title: 'Platform overview', icon: 'overview', ok: p => p.includes('platform') },
  { path: 'pf-saccos',   title: 'SACCOs',            icon: 'pf-saccos', ok: p => p.includes('platform') },
  { path: 'pf-owners',   title: 'Owners',            icon: 'pf-owners', ok: p => p.includes('platform') },
  { path: 'pf-access',   title: 'Access to SACCOs',  icon: 'pf-access', ok: p => p.includes('platform') },
  { path: 'pf-audit',    title: 'Platform audit',    icon: 'audit',     ok: p => p.includes('platform') },
  { path: 'overview',    title: 'Overview',          icon: 'overview',  ok: p => sacco(p) && p.includes('dashboard.view') },
  /* My savings is the MEMBER's own page (permission savings.request). Staff run the SACCO, so they see the SACCO's savings under Accounts. */
  { path: 'savings',     title: 'My savings',        icon: 'savings',   ok: p => sacco(p) && p.includes('savings.request') },
  { path: 'deposit',     title: 'Deposit',           icon: 'deposit',   ok: p => sacco(p) && p.includes('savings.request') },
  { path: 'withdraw',    title: 'Withdraw',          icon: 'withdraw',  ok: p => sacco(p) && p.includes('savings.request') },
  { path: 'accounts',    title: 'Accounts',          icon: 'accounts',  ok: p => sacco(p) && p.includes('savings.view_all') },
  { path: 'money',       title: 'Post money',        icon: 'money',     ok: p => sacco(p) && p.includes('savings.post') },
  { path: 'requests',    title: 'Requests',          icon: 'requests',  ok: p => sacco(p) && p.includes('savings.post') },
  { path: 'loans',       title: 'Loans',             icon: 'loans',     ok: p => sacco(p) && (p.includes('loan.view') || p.includes('loan.request')) },
  { path: 'members',     title: 'Members',           icon: 'members',   ok: p => sacco(p) && p.includes('member.view') },
  /* adding a member is a section of its own (SACCO admin): phone number, role, a one-time join code */
  { path: 'add-member',  title: 'Add a member',      icon: 'add-member', ok: p => sacco(p) && p.includes('member.manage') },
  { path: 'reports',     title: 'Reports',           icon: 'reports',   ok: p => sacco(p) && p.includes('report.view') },
  { path: 'audit',       title: 'Audit log',         icon: 'audit',     ok: p => sacco(p) && p.includes('audit.view') },
  { path: 'access',      title: 'Access requests',   icon: 'access',    ok: p => sacco(p) && p.includes('support.approve') },
  { path: 'rules',       title: 'SACCO rules',      icon: 'rules',     ok: p => sacco(p) && p.includes('sacco.view') },
  { path: 'payin',       title: 'Pay-in details',    icon: 'money',     ok: p => sacco(p) && p.includes('payin.manage') },
  { path: 'settings',    title: 'SACCO settings',    icon: 'settings',  ok: p => sacco(p) && p.includes('sacco.update') },
  /* every signed-in person, every role, has My settings: colour theme, font, text size (AppearanceCard). Last item of the menu. */
  { path: 'my-settings', title: 'My settings',       icon: 'my-settings', ok: () => true }
];
/* routes with no menu entry that every signed-in user may open */
export const OPEN_ROUTES = ['account', 'styleguide'];

export const menuFor = perms => ROUTES.filter(r => r.ok(perms));
export const homeFor = perms => (
  perms.includes('platform')
    ? 'pf-overview'
    : perms.includes('dashboard.view')
      ? 'overview'
      : 'my-settings'
);
/* null when allowed, otherwise the error page to show: '403' */
export const guardRoute = (perms, path) => {
  if (OPEN_ROUTES.includes(path)) return null;
  const r = ROUTES.find(x => x.path === path);
  return r && r.ok(perms) ? null : '403';
};
