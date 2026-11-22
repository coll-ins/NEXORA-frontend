/* registry.sam.js: Sam's nine pages in the dev harness. */
import OverviewPage from '../pages/money/overview/OverviewPage.jsx';
import SavingsPage from '../pages/money/savings/SavingsPage.jsx';
import DepositPage from '../pages/money/requests/DepositPage.jsx';
import WithdrawPage from '../pages/money/requests/WithdrawPage.jsx';
import AccountsPage from '../pages/money/accounts/AccountsPage.jsx';
import PostMoneyPage from '../pages/money/post/PostMoneyPage.jsx';
import RequestsPage from '../pages/money/requests/RequestsPage.jsx';
import LoansPage from '../pages/money/loans/LoansPage.jsx';
import ReportsPage from '../pages/money/reports/ReportsPage.jsx';

export default [
  { path: 'overview', title: 'Overview', Component: OverviewPage },
  { path: 'savings', title: 'My savings', Component: SavingsPage },
  { path: 'deposit', title: 'Deposit', Component: DepositPage },
  { path: 'withdraw', title: 'Withdraw', Component: WithdrawPage },
  { path: 'accounts', title: 'Accounts', Component: AccountsPage },
  { path: 'money', title: 'Post money', Component: PostMoneyPage },
  { path: 'requests', title: 'Requests', Component: RequestsPage },
  { path: 'loans', title: 'Loans', Component: LoansPage },
  { path: 'reports', title: 'Reports', Component: ReportsPage }
];