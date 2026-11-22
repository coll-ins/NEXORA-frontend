/*
 * data.js: the sample data the prototype uses. Copy to frontend/src/mocks/data.js.
 * Everyone builds their pages against THIS data in mock mode, so a page looks the same on every machine and
 * nobody has to wait for the API. Money here is in SHILLINGS for readability; the real API sends minor units
 * (see lib/format.js fromMinor).
 *
 * Do not edit these arrays. If you need more rows for your page, add them in YOUR OWN file
 * (for example src/mocks/sam.js) and import both.
 */

export const M = ['Dec', 'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov'];

/* Chart series (millions of KES for the SACCO, thousands for one member) */
export const savings = [8.2, 8.6, 8.9, 9.4, 9.8, 10.1, 10.7, 11.0, 11.6, 12.0, 12.1, 12.4];
export const deposits = [0.9, 1.1, 0.8, 1.2, 1.0, 1.3, 1.4, 1.1, 1.5, 1.3, 1.2, 1.4];
export const withdrawals = [0.4, 0.6, 0.5, 0.7, 0.5, 0.6, 0.7, 0.6, 0.7, 0.5, 0.6, 0.5];
export const balance = [120, 128, 131, 140, 146, 152, 160, 164, 171, 177, 181, 186.4];
export const contrib = [5.5, 6, 6, 7, 6, 6.5, 7, 6, 6, 7.5, 6, 6.5];
export const membersTrend = [131, 133, 136, 138, 139, 141, 142, 143, 144, 145, 142, 148];
export const repayTrend = [91, 92, 90, 93, 94, 92, 95, 93, 96, 95, 94, 96];
export const betaBalance = [30, 31, 33, 34, 35, 36, 37, 38, 39, 40, 41, 42.8];
export const saccoGrowth = [1, 1, 1, 1, 2, 2, 2, 3, 3, 3, 4, 4];
export const memberGrowth = [120, 140, 160, 170, 210, 230, 250, 270, 290, 300, 320, 338];

/* Loan book */
export const loanBook = [{ label: 'Current', value: 3.5, color: '#0F4C47' }, { label: 'Watch', value: 0.4, color: '#F2B441' }, { label: 'In arrears', value: 0.2, color: '#D9663B' }];

/* Loans. steps: one entry per approval needed. null = not decided yet. by: 'me' | 'other'. */
export const loans = [
  { id: 2045, who: 'Member 3', amount: 150000, term: 12, need: 2, date: '14 Nov', steps: [{ by: 'me' }, null], status: 'open' },
  { id: 2051, who: 'Member 7', amount: 40000, term: 6, need: 1, date: '16 Nov', steps: [null], status: 'open' },
  { id: 2058, who: 'Member 5', amount: 200000, term: 18, need: 2, date: '17 Nov', steps: [{ by: 'other' }, null], status: 'open' },
  { id: 2039, who: 'Member 4', amount: 60000, term: 6, need: 1, date: '9 Nov', steps: [{ by: 'other' }], status: 'approved' }
];
export const myLoan = { id: 2019, amount: 100000, repaid: 62000, next: { due: '30 Nov', amount: 8500 }, schedule: [['30 Oct', 8500, 'Paid'], ['30 Nov', 8500, 'Next'], ['30 Dec', 8500, 'Upcoming']] };

/* Members, accounts, ledger */
export const members = [
  ['Member 1', '0712 *** 118', 'Active', 'member'], ['Member 3', '0722 *** 540', 'Active', 'loans'], ['Member 5', '0733 *** 902', 'Active', 'member'],
  ['Member 7', '0745 *** 261', 'Active', 'finance'], ['Member 9', '0758 *** 077', 'Invited', 'member']
];
export const accounts = [
  ['Member 1', 'A-0001', 186400, '17 Nov', 'Active'], ['Member 3', 'A-0003', 92500, '17 Nov', 'Active'], ['Member 5', 'A-0005', 41800, '12 Nov', 'Active'],
  ['Member 7', 'A-0007', 150200, '16 Nov', 'Active'], ['Member 9', 'A-0009', 0, 'None yet', 'Invited'], ['Jordan Mwangi', 'A-0011', 186400, '17 Nov', 'Active']
];
export const ledger = [
  { d: '17 Nov', t: 'Deposit', a: 8500, st: 'Posted' }, { d: '30 Oct', t: 'Loan repayment', a: 8500, st: 'Posted' }, { d: '12 Oct', t: 'Deposit', a: 6000, st: 'Posted' },
  { d: '4 Oct', t: 'Deposit', a: 2000, st: 'Reversed' }, { d: '18 Sep', t: 'Interest', a: 1240, st: 'Posted' }, { d: '12 Sep', t: 'Withdrawal', a: 5000, st: 'Posted' }
];
export const recentEntries = [
  { id: 1, who: 'Member 3', type: 'Deposit', amt: 12000, st: 'posted' }, { id: 2, who: 'Member 7', type: 'Withdrawal', amt: 4000, st: 'posted' }, { id: 3, who: 'Member 1', type: 'Deposit', amt: 20000, st: 'reversed' }
];

/* Audit */
export const audit = [
  ['17 Nov 14:02', 'Officer B', 'loan.approve', 'Loan #2058 step 1'], ['17 Nov 11:40', 'Jordan M.', 'savings.post', 'Deposit KES 12,000, Member 3'], ['16 Nov 16:22', 'Jordan M.', 'savings.reverse', 'Deposit KES 20,000, Member 1'],
  ['16 Nov 09:15', 'Admin', 'member.add', 'Member 9 invited'], ['15 Nov 15:48', 'Jordan M.', 'loan.disburse', 'Loan #2031'], ['15 Nov 10:05', 'Officer A', 'loan.approve', 'Loan #2045 step 1'],
  ['14 Nov 13:30', 'Member 3', 'loan.request', 'Loan #2045'], ['13 Nov 08:50', 'Admin', 'role.set', 'Member 7: finance officer'], ['12 Nov 17:12', 'Jordan M.', 'savings.post', 'Withdrawal KES 4,000, Member 7'], ['11 Nov 09:01', 'Officer B', 'loan.reject', 'Loan #2027']
];

/* Platform */
export const saccos = [
  { id: 1, name: 'Alpha SACCO', status: 'Active', members: 148, admin: 'Jordan Mwangi', approvals: 2, cap: 150000, mult: 3, created: '12 Mar 2024' },
  { id: 2, name: 'Beta SACCO', status: 'Active', members: 92, admin: 'Faith Njeri', approvals: 1, cap: 80000, mult: 3, created: '2 Jun 2024' },
  { id: 3, name: 'Gamma SACCO', status: 'Suspended', members: 41, admin: 'Peter Otieno', approvals: 2, cap: 100000, mult: 2, created: '19 Sep 2024' },
  { id: 4, name: 'Delta SACCO', status: 'Active', members: 57, admin: 'Amina Yusuf', approvals: 1, cap: 60000, mult: 3, created: '4 Jan 2025' }
];
export const owners = [{ name: 'Platform owner one', email: 'owner1@example.com', me: true }, { name: 'Platform owner two', email: 'owner2@example.com' }, { name: 'Platform owner three', email: 'owner3@example.com' }];
export const accessRequests = [
  { id: 1, sacco: 'Alpha SACCO', scopes: ['audit'], reason: 'Look into a reported sign-in problem', status: 'pending', expires: '' },
  { id: 2, sacco: 'Beta SACCO', scopes: ['members', 'loans'], reason: 'Help the admin fix a stuck loan', status: 'approved', expires: 'Tomorrow, 14:00' }
];
export const platformEvents = [
  ['18 Nov 15:12', 'Platform owner one', 'sacco.deactivate', 'Gamma SACCO'], ['17 Nov 09:40', 'Platform owner two', 'support.request', 'Alpha SACCO (audit)'],
  ['16 Nov 16:05', 'Platform owner one', 'owner.add', 'owner3@example.com'], ['14 Nov 11:20', 'Platform owner two', 'settings.update', 'Beta SACCO loan rules']
];

/* The user who is signed in, for every mock */
export const me = { name: 'Jordan Mwangi', email: 'jordan@example.com', initials: 'JM', verified: true };
export const mySaccos = [{ id: 1, name: 'Alpha SACCO', status: 'Active' }, { id: 2, name: 'Beta SACCO', status: 'Active' }, { id: 3, name: 'Gamma SACCO', status: 'Suspended' }];

/* Member deposit and withdrawal REQUESTS (new). Money is in SHILLINGS here; the real API sends minor units (amount_minor).
   kind: 'deposit' | 'withdrawal'   method: 'mpesa' | 'bank'   status: 'pending' | 'confirmed' | 'rejected'
   `mine: true` marks the signed-in member's own rows (the member pages show only those; the officer queue shows all). */
export const paymentRequests = [
  { id: 1, who: 'Jordan Mwangi', mine: true, kind: 'deposit', method: 'mpesa', amount: 5000, phone: '0712 345 678', status: 'confirmed', created: '12 Nov 09:20' },
  { id: 2, who: 'Jordan Mwangi', mine: true, kind: 'deposit', method: 'bank', amount: 20000, bank_name: 'Equity Bank', account_ref: 'TRF-88213', status: 'pending', created: '17 Nov 16:05' },
  { id: 3, who: 'Jordan Mwangi', mine: true, kind: 'withdrawal', method: 'mpesa', amount: 3000, phone: '0712 345 678', status: 'rejected', reject_reason: 'The phone number does not match your member record.', created: '10 Nov 11:40' },
  { id: 4, who: 'Member 3', kind: 'deposit', method: 'mpesa', amount: 12000, phone: '0722 111 540', status: 'pending', created: '18 Nov 08:15' },
  { id: 5, who: 'Member 5', kind: 'withdrawal', method: 'bank', amount: 60000, bank_name: 'KCB', account_ref: '1234567890', status: 'pending', created: '18 Nov 10:02' },
  { id: 6, who: 'Member 7', kind: 'withdrawal', method: 'mpesa', amount: 8000, phone: '0745 222 261', status: 'pending', created: '18 Nov 11:30' }
];
/* Where members pay in. SAMPLE values: real ones come from the SACCO. Used on the Deposit page instructions. */
export const payIn = { paybill: '400200', account: 'A-0011', bank: 'Equity Bank', bankAccount: '0123456789', bankAccountName: 'Alpha SACCO savings' };
/* The signed-in member's available balance in the sample (shillings). The Withdraw page validates against it. */
export const myBalance = 186400;