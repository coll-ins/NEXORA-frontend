import { http, MOCK, mockDelay } from '../lib/http.js';

const SAMPLE = {
  id: 1, version: 1, contribution_amount: 50000, contribution_frequency: 'monthly', loan_cap_multiple: 3,
  interest_percent: 10, repayment_period_value: 6, repayment_period_unit: 'months', late_fine_amount: 5000,
  cycle_months: 12, guarantors_required: 0, min_membership_days: 0, exit_rules: null, loan_purposes: null,
  cycle_starts_on: '2026-01-01', cycle_ends_on: '2027-01-01', locked: true, accepted: false,
};

export async function getRules(saccoId) {
  if (MOCK) { await mockDelay(); return SAMPLE; }
  return (await http.get(`/saccos/${saccoId}/rules`)).rules;
}
export async function publishRules(saccoId, body) {
  if (MOCK) { await mockDelay(); return { ...SAMPLE, ...body }; }
  return (await http.post(`/saccos/${saccoId}/rules`, { body })).rules;
}
export async function acceptRules(saccoId, version) {
  if (MOCK) { await mockDelay(); return { ...SAMPLE, accepted: true }; }
  return (await http.post(`/saccos/${saccoId}/rules/accept`, { body: { version } })).rules;
}
export async function listProposals(saccoId) {
  if (MOCK) { await mockDelay(); return []; }
  return (await http.get(`/saccos/${saccoId}/rules/proposals`)).proposals;
}
export async function proposeRules(saccoId, body) {
  if (MOCK) { await mockDelay(); return { id: 1, status: 'open' }; }
  return (await http.post(`/saccos/${saccoId}/rules/proposals`, { body })).proposal;
}
export async function voteOnProposal(saccoId, proposalId, approve) {
  if (MOCK) { await mockDelay(); return { id: proposalId, status: 'open' }; }
  return (await http.post(`/saccos/${saccoId}/rules/proposals/${proposalId}/votes`, { body: { approve } })).proposal;
}

/* The rules of the SACCO being joined, read with the setup token before the PIN step. */
export async function joinRules(setupToken) {
  if (MOCK) { await mockDelay(); return { rules: null, sacco: null }; }
  return http.post('/auth/join/rules', { body: { setup_token: setupToken } });
}
export async function joinAcceptRules(setupToken, version) {
  if (MOCK) { await mockDelay(); return null; }
  return (await http.post('/auth/join/rules/accept', { body: { setup_token: setupToken, version } })).rules;
}
/* Refuse the invitation after reading the rules. The reason is required and is
 * kept for the SACCO's officers; the membership never becomes active. */
export async function joinDeclineRules(setupToken, version, reason) {
  if (MOCK) { await mockDelay(); return null; }
  return http.post('/auth/join/rules/decline', { body: { setup_token: setupToken, version, reason } });
}
