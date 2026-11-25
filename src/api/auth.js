import { ApiError, MOCK, getTokens, http, mockDelay } from '../lib/http.js';
import { ROLES } from '../lib/perms.js';
import {
  RYAN_SACCO_PIN,
  RYAN_JOIN_CODES,
  RYAN_JOIN_PHONES,
  RYAN_JOIN_SACCO_ID,
  RYAN_MOCK_ACCOUNTS,
} from '../mocks/ryan.js';

const mockRoleNames = {
  admin: 'sacco_admin',
  secretary: 'secretary',
  finance: 'finance_officer',
  loans: 'loans_officer',
  member: 'member',
  platform: 'platform_owner',
};

const loginFailures = new Map();
const loginLocks = new Map();
const pinFailures = new Map();
const pinLocks = new Map();

function normalizedEmail(email) {
  return String(email || '').trim().toLowerCase();
}

function mockAccountFor(email, selectedRole = 'member') {
  const address = normalizedEmail(email) || 'jordan@example.com';
  const fixture = RYAN_MOCK_ACCOUNTS[address] || RYAN_MOCK_ACCOUNTS['jordan@example.com'];
  const role = fixture.is_platform_owner
    ? 'platform'
    : Object.hasOwn(ROLES, selectedRole) ? selectedRole : 'member';
  const roleName = mockRoleNames[role];
  const memberships = fixture.memberships.map(item => ({
    ...item,
    role: roleName,
  }));
  const user = {
    ...fixture,
    // The mock role picker represents separate test people; keep their saved appearances isolated.
    id: `${fixture.id}-${role}-mock`,
    email: address,
    memberships,
  };
  const accessToken = `mock:${role}:${encodeURIComponent(address)}`;
  return {
    user,
    saccos: fixture.saccos.map(sacco => ({ ...sacco })),
    access_token: accessToken,
    refresh_token: accessToken,
  };
}

function lockError(code, message) {
  return new ApiError(423, code, message, 900);
}

export async function loginRequest(email, password, selectedRole = 'member') {
  if (!MOCK) {
    return http.post('/auth/login', {
      body: { email, password },
      auth: false,
    });
  }

  await mockDelay(250);
  const address = normalizedEmail(email) || 'jordan@example.com';
  const lockedUntil = loginLocks.get(address) || 0;
  if (lockedUntil > Date.now()) {
    throw lockError('LOGIN_LOCKED', 'This account is locked.');
  }
  if (password !== 'demo') {
    const failures = (loginFailures.get(address) || 0) + 1;
    loginFailures.set(address, failures);
    if (failures >= 5) {
      loginLocks.set(address, Date.now() + 15 * 60 * 1000);
      throw lockError('LOGIN_LOCKED', 'This account is locked.');
    }
    throw new ApiError(401, 'unauthorized', 'Your email or password is not right.');
  }

  loginFailures.delete(address);
  loginLocks.delete(address);
  const fixture = RYAN_MOCK_ACCOUNTS[address];
  if (fixture && !fixture.verified) {
    throw new ApiError(403, 'EMAIL_NOT_VERIFIED', 'Open the link we sent to verify your email.');
  }
  return mockAccountFor(address, selectedRole);
}

export function mockAccountFromTokens(tokens = getTokens()) {
  if (!MOCK || !tokens || !tokens.access || !tokens.access.startsWith('mock:')) return null;
  const [, tokenRole, encodedEmail = ''] = tokens.access.split(':');
  let email = 'jordan@example.com';
  try {
    email = encodedEmail ? decodeURIComponent(encodedEmail) : email;
  } catch {
    return null;
  }
  const role = Object.hasOwn(ROLES, tokenRole) ? tokenRole : 'member';
  return mockAccountFor(email, role);
}

export async function resendVerificationRequest(email) {
  if (MOCK) {
    await mockDelay(200);
    return { ok: true };
  }
  return http.post('/auth/resend-verification', {
    body: { email },
    auth: false,
  });
}

export async function joinRequest(phone, code) {
  if (!MOCK) {
    // No phone: the code came by email and belongs to the signed-in account.
    const given = String(phone || '').trim();
    return http.post('/auth/join', { body: given ? { phone: given, code } : { code } });
  }

  await mockDelay(300);
  if (code === RYAN_JOIN_CODES.expired) {
    throw new ApiError(410, 'CODE_EXPIRED', 'This code has expired.');
  }
  if (code === RYAN_JOIN_CODES.used) {
    throw new ApiError(409, 'CODE_USED', 'This code was already used.');
  }
  if (code === RYAN_JOIN_CODES.burned) {
    throw new ApiError(400, 'CODE_BURNED', 'This code was locked after too many wrong tries.');
  }
  if (code !== RYAN_JOIN_CODES.success) {
    throw new ApiError(400, 'CODE_WRONG', 'That code is not correct.');
  }

  const normalizedPhone = String(phone || '').replace(/\D/g, '');
  if (normalizedPhone === RYAN_JOIN_PHONES.otherAccount) {
    throw new ApiError(409, 'PHONE_ACCOUNT_MISMATCH', 'That phone belongs to another account.');
  }
  if (normalizedPhone === RYAN_JOIN_PHONES.alreadyMember) {
    throw new ApiError(409, 'ALREADY_MEMBER', 'You are already a member of this SACCO.');
  }
  if (normalizedPhone === RYAN_JOIN_PHONES.suspended) {
    throw new ApiError(423, 'SACCO_SUSPENDED', 'This SACCO is suspended.');
  }

  const createdAt = normalizedPhone === RYAN_JOIN_PHONES.expiredSetup
    ? Date.now() - 11 * 60 * 1000
    : Date.now();
  return {
    setup_token: `mock-setup:${createdAt}:${RYAN_JOIN_SACCO_ID}`,
    membership_id: 0,
    sacco_id: RYAN_JOIN_SACCO_ID,
  };
}

export async function joinPinRequest(setupToken, pin) {
  if (!MOCK) {
    return http.post('/auth/join/pin', {
      body: { setup_token: setupToken, pin },
    });
  }

  await mockDelay(300);
  const match = /^mock-setup:(\d+):(\d+)$/.exec(setupToken);
  if (!match || Date.now() - Number(match[1]) > 10 * 60 * 1000) {
    throw new ApiError(401, 'SETUP_EXPIRED', 'The setup took too long.');
  }
  if (!/^\d{4}$/.test(pin)) {
    throw new ApiError(400, 'PIN_INVALID', 'Enter a four-digit PIN.');
  }
  return {
    membership_id: 0,
    sacco_id: Number(match[2]),
    role: 'member',
    status: 'active',
  };
}

export async function saccoLoginRequest(session, saccoId, pin) {
  if (!MOCK) {
    return http.post('/auth/sacco-login', {
      body: { sacco_id: saccoId, pin },
      refreshOn401: false,
    });
  }

  await mockDelay(300);
  const sacco = session.saccos.find(item => String(item.id) === String(saccoId));
  if (!sacco || sacco.membershipStatus !== 'active') {
    throw new ApiError(403, 'NOT_ALLOWED', 'You do not have access to this page.');
  }
  if (String(sacco.status).toLowerCase() === 'suspended') {
    throw new ApiError(423, 'SACCO_SUSPENDED', 'This SACCO is suspended.');
  }
  if (session.sourceUser.saccoLogin === 'deactivated') {
    throw new ApiError(403, 'NOT_ALLOWED', 'You do not have access to this page.');
  }

  const attemptKey = `${session.user.email}:${saccoId}`;
  const lockedUntil = pinLocks.get(attemptKey) || 0;
  if (lockedUntil > Date.now()) {
    throw lockError('PIN_LOCKED', 'Too many wrong PINs.',);
  }
  if (pin !== RYAN_SACCO_PIN) {
    const failures = (pinFailures.get(attemptKey) || 0) + 1;
    pinFailures.set(attemptKey, failures);
    if (failures >= 5) {
      pinLocks.set(attemptKey, Date.now() + 15 * 60 * 1000);
      throw lockError('PIN_LOCKED', 'Too many wrong PINs.');
    }
    throw new ApiError(401, 'PIN_WRONG', 'That PIN is not right.');
  }

  pinFailures.delete(attemptKey);
  pinLocks.delete(attemptKey);
  const membership = session.memberships.find(item => String(item.sacco_id) === String(saccoId));
  return {
    ok: true,
    membership_id: membership.membership_id,
    role: membership.role,
  };
}

export async function logoutRequest() {
  if (MOCK) return;
  const tokens = getTokens();
  if (!tokens) return;

  try {
    await http.post('/auth/logout', {
      body: { refresh_token: tokens.refresh },
      token: tokens.access,
      auth: false,
    });
  } catch {
    // Logout must clear local tokens even when the API cannot be reached.
  }
}


export async function changePasswordRequest(currentPassword, newPassword) {
  if (!MOCK) {
    return http.post('/auth/change-password', {
      body: { current_password: currentPassword, new_password: newPassword },
    });
  }
  await mockDelay(250);
  if (currentPassword !== 'demo') {
    throw new ApiError(400, 'PASSWORD_WRONG', 'Your current password is not right.');
  }
  return { ok: true };
}

export async function logoutAllRequest() {
  if (!MOCK) return http.post('/auth/logout-all', { body: {} });
  await mockDelay(200);
  return { ok: true };
}

export async function registerRequest(name, email, password) {
  if (!MOCK) {
    return http.post('/auth/register', { body: { name, email, password }, auth: false });
  }
  await mockDelay(250);
  if (normalizedEmail(email) === 'taken@example.com') {
    throw new ApiError(409, 'EMAIL_TAKEN', 'That email already has an account. Sign in instead.');
  }
  return { ok: true };
}

export async function verifyEmailRequest(token) {
  if (!MOCK) {
    return http.post('/auth/verify-email', { body: { token }, auth: false });
  }
  await mockDelay(250);
  if (token === 'expired') {
    throw new ApiError(410, 'LINK_EXPIRED', 'This link has expired. Ask for a new one.');
  }
  if (token === 'used') {
    throw new ApiError(409, 'LINK_USED', 'This link was already used. Sign in instead.');
  }
  return { ok: true };
}

export async function forgotPasswordRequest(email) {
  if (!MOCK) {
    return http.post('/auth/forgot-password', { body: { email }, auth: false });
  }
  await mockDelay(250);
  return { ok: true };
}

export async function resetPasswordRequest(token, password) {
  if (!MOCK) {
    return http.post('/auth/reset-password', { body: { token, new_password: password }, auth: false });
  }
  await mockDelay(250);
  if (token === 'expired') {
    throw new ApiError(410, 'LINK_EXPIRED', 'This link has expired.');
  }
  if (token === 'used') {
    throw new ApiError(409, 'LINK_USED', 'This link was already used.');
  }
  return { ok: true };
}
