export const RYAN_SACCOS = [
  { id: 1, name: 'Alpha SACCO', status: 'Active' },
  { id: 2, name: 'Beta SACCO', status: 'Active' },
  { id: 3, name: 'Gamma SACCO', status: 'Suspended' },
  { id: 4, name: 'Delta SACCO', status: 'Active' },
];

const member = (membershipId, saccoId, status = 'active', role = 'member') => ({
  membership_id: membershipId,
  sacco_id: saccoId,
  status,
  role,
});

export const RYAN_MOCK_ACCOUNTS = {
  'jordan@example.com': {
    id: 'ryan-jordan',
    name: 'Jordan Mwangi',
    initials: 'JM',
    verified: true,
    is_platform_owner: false,
    memberships: [member(1, 1), member(2, 2), member(3, 3)],
    saccos: RYAN_SACCOS.slice(0, 3),
  },
  'no-sacco@example.test': {
    id: 'ryan-no-sacco',
    name: 'Amina Hassan',
    initials: 'AH',
    verified: true,
    is_platform_owner: false,
    memberships: [],
    saccos: [],
  },
  'one-sacco@example.test': {
    id: 'ryan-one-sacco',
    name: 'Peter Otieno',
    initials: 'PO',
    verified: true,
    is_platform_owner: false,
    memberships: [member(11, 1)],
    saccos: [RYAN_SACCOS[0]],
  },
  'two-saccos@example.test': {
    id: 'ryan-two-saccos',
    name: 'Faith Njeri',
    initials: 'FN',
    verified: true,
    is_platform_owner: false,
    memberships: [member(21, 1), member(22, 2)],
    saccos: RYAN_SACCOS.slice(0, 2),
  },
  'suspended-choice@example.test': {
    id: 'ryan-suspended-choice',
    name: 'David Kamau',
    initials: 'DK',
    verified: true,
    is_platform_owner: false,
    memberships: [member(31, 1), member(32, 3)],
    saccos: [RYAN_SACCOS[0], RYAN_SACCOS[2]],
  },
  'invited-only@example.test': {
    id: 'ryan-invited-only',
    name: 'Grace Wanjiku',
    initials: 'GW',
    verified: true,
    is_platform_owner: false,
    memberships: [member(41, 4, 'invited')],
    saccos: [RYAN_SACCOS[3]],
  },
  'unverified@example.test': {
    id: 'ryan-unverified',
    name: 'Unverified Account',
    initials: 'UA',
    verified: false,
    is_platform_owner: false,
    memberships: [],
    saccos: [],
  },
  'deactivated@example.test': {
    id: 'ryan-deactivated',
    name: 'Deactivated Member',
    initials: 'DM',
    verified: true,
    is_platform_owner: false,
    saccoLogin: 'deactivated',
    memberships: [member(51, 1)],
    saccos: [RYAN_SACCOS[0]],
  },
  'second-person@example.test': {
    id: 'ryan-second-person',
    name: 'Second Person',
    initials: 'SP',
    verified: true,
    is_platform_owner: false,
    memberships: [member(61, 2)],
    saccos: [RYAN_SACCOS[1]],
  },
  'platform-owner@example.test': {
    id: 'ryan-platform-owner',
    name: 'Platform Owner',
    initials: 'PO',
    verified: true,
    is_platform_owner: true,
    memberships: [],
    saccos: [],
  },
};

export const RYAN_JOIN_CODES = {
  success: '123456',
  expired: '000000',
  used: '111111',
  burned: '222222',
};

export const RYAN_JOIN_PHONES = {
  success: '0712000000',
  otherAccount: '0712000001',
  alreadyMember: '0712000002',
  suspended: '0712000003',
  expiredSetup: '0712000004',
};

export const RYAN_SACCO_PIN = '1234';
export const RYAN_JOIN_SACCO_ID = 2;

export const RYAN_AUDIT = [
  {
    id: 'alpha-audit-1',
    sacco_id: 1,
    date: '2026-11-19',
    actor: 'Peter Otieno',
    action: 'Approved a deposit',
    target: 'Member deposit',
  },
  {
    id: 'alpha-audit-2',
    sacco_id: 1,
    date: '2026-11-18',
    actor: 'Faith Njeri',
    action: 'Updated a member',
    target: 'Member profile',
  },
  {
    id: 'beta-audit-1',
    sacco_id: 2,
    date: '2026-11-19',
    actor: 'Jordan Mwangi',
    action: 'Reviewed a loan',
    target: 'Loan request',
  },
];

export const RYAN_R5B_SCENARIOS = {
  wrongPassword: { email: 'wrong-password@example.test', password: 'wrong' },
  loginLocked: { email: 'locked-login@example.test', failedAttempts: 5 },
  unverifiedEmail: { email: 'unverified@example.test' },
  noSaccos: { email: 'no-sacco@example.test' },
  wrongCode: { phone: RYAN_JOIN_PHONES.success, code: '999999' },
  expiredCode: { phone: RYAN_JOIN_PHONES.success, code: RYAN_JOIN_CODES.expired },
  usedCode: { phone: RYAN_JOIN_PHONES.success, code: RYAN_JOIN_CODES.used },
  burnedCode: { phone: RYAN_JOIN_PHONES.success, code: RYAN_JOIN_CODES.burned },
  phoneOnAnotherAccount: { phone: RYAN_JOIN_PHONES.otherAccount, code: RYAN_JOIN_CODES.success },
  alreadyMember: { phone: RYAN_JOIN_PHONES.alreadyMember, code: RYAN_JOIN_CODES.success },
  suspendedAtJoin: { phone: RYAN_JOIN_PHONES.suspended, code: RYAN_JOIN_CODES.success },
  expiredSetup: { phone: RYAN_JOIN_PHONES.expiredSetup, code: RYAN_JOIN_CODES.success },
  mismatchedPins: { pin: '1234', repeatPin: '5678' },
  wrongSaccoPin: { pin: '0000', email: 'one-sacco@example.test' },
  lockedSaccoPin: { failedAttempts: 5, email: 'one-sacco@example.test' },
  deactivatedMembership: { email: 'deactivated@example.test', pin: RYAN_SACCO_PIN },
  suspendedAtPin: { email: 'suspended-choice@example.test', saccoId: 3 },
  suspendedWhileInside: { email: 'suspended-choice@example.test', saccoId: 3 },
  twoSaccosOneSuspended: { email: 'suspended-choice@example.test' },
  reloadInsideSacco: { email: 'one-sacco@example.test', pin: RYAN_SACCO_PIN },
  sharedComputerFirstPerson: { email: 'one-sacco@example.test' },
  sharedComputerSecondPerson: { email: 'second-person@example.test' },
};
