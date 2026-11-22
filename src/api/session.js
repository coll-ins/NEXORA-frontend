import { ApiError, MOCK, clearTokens, getTokens, http, mockDelay, setTokens } from '../lib/http.js';
import { ROLES } from '../lib/perms.js';
import {
  RYAN_AUDIT,
  RYAN_MOCK_PAGE_FAILURES,
  RYAN_SACCOS,
} from '../mocks/ryan.js';
import {
  saccoLoginRequest,
  loginRequest,
  logoutRequest,
  mockAccountFromTokens,
} from './auth.js';

const roleAliases = {
  admin: 'admin',
  sacco_admin: 'admin',
  secretary: 'secretary',
  finance: 'finance',
  finance_officer: 'finance',
  loans: 'loans',
  loans_officer: 'loans',
  member: 'member',
  platform: 'platform',
  platform_owner: 'platform',
};

function roleKeysForMembership(membership) {
  const names = Array.isArray(membership.roles)
    ? membership.roles
    : [membership.role];
  return names.map(name => roleAliases[name]).filter(Boolean);
}

function toSessionUser(user) {
  const name = user.name || user.full_name || user.email || 'Member';
  const initials = user.initials
    || name.split(/\s+/).slice(0, 2).map(part => part.charAt(0)).join('').toUpperCase();
  return {
    id: user.id,
    email: user.email,
    name,
    initials,
  };
}

function listFromResponse(response, key) {
  const list = Array.isArray(response) ? response : response && response[key];
  if (!Array.isArray(list)) throw new Error(`The ${key} response was not a list.`);
  return list;
}

/* The login answer lists each membership with the legacy role (sacco_admin | staff | member).
 * The job titles (sacco_admin, finance_officer, loans_officer, secretary, member) come from
 * GET /members/me/saccos as `roles`. Use them when they are there, so staff are not "unsupported". */
function withJobTitles(memberships, saccos) {
  return memberships.map(item => {
    const sacco = saccos.find(entry => String(entry.id) === String(item.sacco_id));
    return sacco && Array.isArray(sacco.roles) && sacco.roles.length
      ? { ...item, roles: sacco.roles }
      : item;
  });
}

function permissionsForRoles(roleKeys) {
  return [...new Set(roleKeys.flatMap(role => ROLES[role].perms))];
}

function isSuspended(sacco) {
  return Boolean(sacco && String(sacco.status).toLowerCase() === 'suspended');
}

function attachMembershipStatus(saccos, memberships) {
  return saccos.map(sacco => {
    const membership = memberships.find(item => String(item.sacco_id) === String(sacco.id));
    return {
      ...sacco,
      membershipStatus: membership ? membership.status : sacco.membershipStatus || null,
    };
  });
}

/* `ahead` is a permissions request that was already started for this SACCO (or an answer we already hold),
 * so sign-in does not wait for the SACCO list before asking. */
function askPermissions(saccoId) {
  return http.get('/members/me/permissions', {
    params: saccoId == null ? undefined : { sacco_id: saccoId },
  });
}

async function loadPermissions(saccoId, roleKeys, ahead = null) {
  try {
    const usable = ahead && saccoId != null && String(ahead.saccoId) === String(saccoId);
    const response = await (usable ? ahead.request : askPermissions(saccoId));
    if (!response || !Array.isArray(response.permissions)) {
      throw new Error('The permissions response did not contain a permissions list.');
    }
    return response.permissions;
  } catch (error) {
    if (error instanceof ApiError && (error.status === 404 || error.status === 405)) {
      return permissionsForRoles(roleKeys);
    }
    throw error;
  }
}

async function buildSession(user, saccos, selectedSaccoId = null, ahead = null) {
  const saccoList = Array.isArray(saccos) ? saccos : [];
  const memberships = withJobTitles(Array.isArray(user.memberships) ? user.memberships : [], saccoList);
  const accountSaccos = attachMembershipStatus(saccoList, memberships);
  const selectedSacco = selectedSaccoId == null
    ? null
    : accountSaccos.find(item => String(item.id) === String(selectedSaccoId)) || null;

  if (selectedSaccoId != null && !selectedSacco) {
    throw new Error('The selected SACCO is not available to this account.');
  }

  const activeMemberships = memberships.filter(item => item.status === 'active');
  const membership = selectedSacco
    ? activeMemberships.find(item => String(item.sacco_id) === String(selectedSacco.id)) || null
    : activeMemberships[0] || null;

  if (selectedSacco && !membership) {
    throw new Error('The selected SACCO does not have an active membership.');
  }

  const roleKeys = membership ? roleKeysForMembership(membership) : [];
  const membershipPerms = permissionsForRoles(roleKeys);
  const isPlatform = Boolean(user.is_platform_owner) || membershipPerms.includes('platform');
  if (membership && roleKeys.length === 0 && !isPlatform) {
    throw new Error('The signed-in membership has an unsupported role.');
  }

  const role = isPlatform ? 'platform' : roleKeys[0] || 'member';
  const saccoId = isPlatform || !membership
    ? null
    : selectedSacco
      ? selectedSacco.id
      : membership.sacco_id;
  const sacco = saccoId == null
    ? null
    : accountSaccos.find(item => String(item.id) === String(saccoId)) || null;
  const fallbackRoles = isPlatform ? ['platform'] : membership ? roleKeys : [];
  const perms = MOCK || isSuspended(sacco)
    ? permissionsForRoles(fallbackRoles)
    : fallbackRoles.length
      ? await loadPermissions(saccoId, fallbackRoles, ahead)
      : [];

  return {
    user: toSessionUser(user),
    role,
    perms,
    can: permission => perms.includes(permission),
    saccoId,
    sacco,
    saccos: accountSaccos,
    memberships,
    sourceUser: user,
  };
}

async function loadCurrentSession(user = null) {
  const userRequest = user ? Promise.resolve(user) : http.get('/members/me');
  const saccosRequest = http.get('/members/me/saccos');
  const currentUser = await userRequest;
  // The permissions of the SACCO the person lands in need only its id, and the account already lists it,
  // so ask for them now, side by side with the SACCO list, not after it.
  const landing = currentUser.is_platform_owner
    ? null
    : (Array.isArray(currentUser.memberships) ? currentUser.memberships : []).find(item => item.status === 'active');
  let ahead = null;
  if (landing) {
    ahead = { saccoId: landing.sacco_id, request: askPermissions(landing.sacco_id) };
    ahead.request.catch(() => {});   // if it is not used, a failure here is not an unhandled error
  }
  const saccosResponse = await saccosRequest;
  return buildSession(currentUser, listFromResponse(saccosResponse, 'saccos'), null, ahead);
}

export function afterSignIn(saccos, user = null, perms = []) {
  if ((user && user.is_platform_owner) || perms.includes('platform')) {
    return { path: '/pf-overview', view: 'platform' };
  }

  const active = saccos.filter(item => item.membershipStatus === 'active');
  const invited = saccos.filter(item => item.membershipStatus === 'invited');
  if (active.length === 0) {
    return { path: '/enter', view: 'no-sacco', invited };
  }
  if (active.length === 1) {
    return { path: '/enter', view: 'enter', saccoId: active[0].id };
  }
  return { path: '/enter', view: 'chooser' };
}

export async function restoreSession() {
  const tokens = getTokens();
  if (!tokens) return null;

  if (MOCK) {
    const mockAccount = mockAccountFromTokens(tokens);
    if (!mockAccount) {
      clearTokens();
      return null;
    }
    return buildSession(mockAccount.user, mockAccount.saccos);
  }

  return loadCurrentSession();
}

export async function signIn(email, password, selectedRole) {
  const result = await loginRequest(email, password, selectedRole);
  setTokens({ access: result.access_token, refresh: result.refresh_token });

  try {
    if (MOCK) return buildSession(result.user, result.saccos);
    return await loadCurrentSession(result.user);
  } catch (error) {
    clearTokens();
    throw error;
  }
}

export async function selectSacco(session, saccoId) {
  if (!session || !session.sourceUser) {
    throw new Error('A signed-in session is required to switch SACCOs.');
  }
  return buildSession(session.sourceUser, session.saccos, saccoId);
}

export async function enterSacco(session, saccoId, pin) {
  if (!session || !session.sourceUser) {
    throw new Error('A signed-in session is required to enter a SACCO.');
  }
  const result = await saccoLoginRequest(session, saccoId, pin);
  if (!result || result.ok !== true) {
    throw new Error('The SACCO sign-in did not complete.');
  }
  const memberships = session.sourceUser.memberships.map(item => (
    String(item.sacco_id) === String(saccoId)
      ? { ...item, role: result.role }
      : item
  ));
  const sourceUser = { ...session.sourceUser, memberships };
  // The PIN does not change what the role may do, so reuse the permissions already loaded for this SACCO.
  const ahead = session.perms && session.perms.length && String(session.saccoId) === String(saccoId)
    ? { saccoId, request: Promise.resolve({ permissions: session.perms }) }
    : null;
  return buildSession(sourceUser, session.saccos, saccoId, ahead);
}

export async function completeJoin(session, joinResult) {
  if (!session || !session.sourceUser) {
    throw new Error('A signed-in session is required to complete a join.');
  }

  if (!MOCK) {
    const refreshed = await loadCurrentSession();
    const joined = refreshed.memberships.find(item => (
      String(item.membership_id) === String(joinResult.membership_id)
      || String(item.sacco_id) === String(joinResult.sacco_id)
    ));
    return joined ? buildSession(refreshed.sourceUser, refreshed.saccos, joined.sacco_id) : refreshed;
  }

  const saccoId = Number(joinResult.sacco_id);
  const joinedSacco = RYAN_SACCOS.find(item => String(item.id) === String(saccoId));
  if (!joinedSacco) throw new Error('The joined SACCO was not found in the mock fixtures.');
  const memberships = session.sourceUser.memberships
    .filter(item => String(item.sacco_id) !== String(saccoId))
    .concat({
      membership_id: joinResult.membership_id || Date.now(),
      sacco_id: saccoId,
      role: joinResult.role || 'member',
      status: 'active',
    });
  const sourceUser = { ...session.sourceUser, memberships };
  const saccos = session.saccos.some(item => String(item.id) === String(saccoId))
    ? session.saccos
    : [...session.saccos, joinedSacco];
  return buildSession(sourceUser, saccos, saccoId);
}

export async function listRecentAudit(saccoId) {
  if (saccoId == null) return [];

  if (MOCK) {
    await mockDelay();
    return RYAN_AUDIT
      .filter(entry => String(entry.sacco_id) === String(saccoId))
      .slice(0, 5)
      .map(entry => ({ ...entry }));
  }

  const response = await http.get(`/admin/saccos/${saccoId}/audit`, {
    params: { page: 1, per_page: 5 },
  });
  return listFromResponse(response, 'entries');
}

export async function loadMockPlaceholderFailure(path, search) {
  if (!MOCK || !path) return null;

  const failureName = new URLSearchParams(search).get('__ryan_error');
  const failure = RYAN_MOCK_PAGE_FAILURES[failureName];
  if (!failure) return null;

  await mockDelay(100);
  if (failure.renderError) return { renderError: true };
  throw new ApiError(
    failure.status,
    failure.code,
    'Mock placeholder failure.',
    failure.retryAfter,
  );
}

export async function signOut() {
  try {
    await logoutRequest();
  } finally {
    clearTokens();
  }
}