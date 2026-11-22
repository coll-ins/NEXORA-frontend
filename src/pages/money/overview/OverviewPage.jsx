/* OverviewPage: the SACCO's version for anyone with report.view, the member's own version for everyone else. */
import { useSession } from '../../../lib/session.jsx';
import SaccoOverview from './SaccoOverview.jsx';
import MemberOverview from './MemberOverview.jsx';

export default function OverviewPage() {
  const { can } = useSession();
  return can('report.view') ? <SaccoOverview /> : <MemberOverview />;
}