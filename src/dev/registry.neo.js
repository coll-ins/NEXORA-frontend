/* registry.neo.js: Neo's pages in the dev harness. */
import MembersPage from '../pages/people/MembersPage.jsx';
import AddMemberPage from '../pages/people/AddMemberPage.jsx';
import SettingsPage from '../pages/people/SettingsPage.jsx';
import AccessPage from '../pages/people/AccessPage.jsx';
import AuditPage from '../pages/people/AuditPage.jsx';
import PfOverview from '../pages/platform/PfOverview.jsx';
import PfSaccos from '../pages/platform/PfSaccos.jsx';
import PfOwners from '../pages/platform/PfOwners.jsx';
import PfAccess from '../pages/platform/PfAccess.jsx';
import PfAudit from '../pages/platform/PfAudit.jsx';

export default [
  { path: 'members', title: 'Members', Component: MembersPage },
  { path: 'add-member', title: 'Add a member', Component: AddMemberPage },
  { path: 'settings', title: 'SACCO settings', Component: SettingsPage },
  { path: 'access', title: 'Access requests', Component: AccessPage },
  { path: 'audit', title: 'Audit log', Component: AuditPage },
  { path: 'pf-overview', title: 'Platform overview', Component: PfOverview },
  { path: 'pf-saccos', title: 'SACCOs', Component: PfSaccos },
  { path: 'pf-owners', title: 'Owners', Component: PfOwners },
  { path: 'pf-access', title: 'Access to SACCOs', Component: PfAccess },
  { path: 'pf-audit', title: 'Platform audit', Component: PfAudit },
];
