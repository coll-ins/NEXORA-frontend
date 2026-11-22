/*
 * registry.example.js: HOW YOU PUT A PAGE IN THE HARNESS.
 * Copy this file to  frontend/src/dev/registry.<yourname>.js  (for example registry.sam.js) and list YOUR pages.
 * The harness finds every file called registry.*.js by itself, so you never edit a shared file and never get a merge conflict.
 *
 * path   : the route name from the Common setup section "Routes" (no slash). The harness uses perms.js to say who may open it.
 * title  : what the left list shows.
 * Component : your page's default export. It takes no props and reads everything from useSession().
 */
// import Loans from '../pages/money/loans/LoansPage.jsx';
// import Savings from '../pages/money/savings/SavingsPage.jsx';

export default [
  // { path: 'loans', title: 'Loans', Component: Loans },
  // { path: 'savings', title: 'My savings', Component: Savings },
];
