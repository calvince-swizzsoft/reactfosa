import { apiFetch, normalizeList } from "@/lib/api";

// Client for WebApplication1's AlternateChannelController
// (Areas/Accounts/Controllers/AlternateChannelController.cs),
// api/accounts/alternatechannels — docs/api/alternate-channel-api-spec.md.
// Standard { success, message, data } envelope throughout. IMPORTANT: there
// is no real maker-checker gate anywhere in this aggregate — approve/reject
// are a thin convenience over the same ungated PUT, nothing checks the
// record is currently New/Edited or that the approver differs from the
// creator/editor. Don't build UI that implies stronger guarantees than
// that (e.g. don't hide Approve/Reject just because someone already acted).

const FIN_BASE = `${import.meta.env.VITE_APP_FIN_URL}`;
const BASE = `${FIN_BASE}/api/accounts/alternatechannels`;

async function unwrap(responsePromise) {
  const res = await responsePromise;
  const body = await res.json().catch(() => ({}));
  if (!res.ok || body.success === false) {
    throw new Error(body?.message || `Request failed (${res.status})`);
  }
  return body?.data ?? body;
}

export function listAlternateChannelsPaged({ text = "", filter = 0, pageIndex = 0, pageSize = 20 } = {}) {
  const params = new URLSearchParams({ text, filter: String(filter), pageIndex: String(pageIndex), pageSize: String(pageSize) });
  return unwrap(apiFetch(`${BASE}/paged?${params.toString()}`));
}

// The checker-inbox query — both type and recordStatus are required, no
// "any" sentinel exists at the API layer.
export function listAlternateChannelsByTypeAndStatus(type, recordStatus, { text = "", filter = 0, pageIndex = 0, pageSize = 20 } = {}) {
  const params = new URLSearchParams({ text, filter: String(filter), pageIndex: String(pageIndex), pageSize: String(pageSize) });
  return unwrap(apiFetch(`${BASE}/paged/type/${type}/status/${recordStatus}?${params.toString()}`));
}

export function getAlternateChannel(id) {
  return unwrap(apiFetch(`${BASE}/${id}`));
}

export function listAlternateChannelsByCustomerAccount(customerAccountId) {
  return unwrap(apiFetch(`${BASE}/by-customer-account/${customerAccountId}`)).then(normalizeList);
}

// Required: CustomerAccountId, Type, CardNumber. New records always start
// RecordStatus: New (0).
export function linkAlternateChannel(dto) {
  return unwrap(apiFetch(BASE, { method: "POST", body: JSON.stringify(dto) }));
}

// Generic field update — CustomerAccountId in the body must match the
// persisted record's or this 404s. Prefer approve/reject below for
// RecordStatus changes specifically.
export function updateAlternateChannel(id, dto) {
  return unwrap(apiFetch(`${BASE}/${id}`, { method: "PUT", body: JSON.stringify(dto) }));
}

// Card/number replacement (lost/stolen SIM, new card) — sets RecordStatus
// back to Edited and logs a Channel Replacement history entry.
export function replaceAlternateChannel(id, dto) {
  return unwrap(apiFetch(`${BASE}/${id}/replace`, { method: "POST", body: JSON.stringify(dto) }));
}

// Same shape as replace — logs Channel Renewal instead.
export function renewAlternateChannel(id, dto) {
  return unwrap(apiFetch(`${BASE}/${id}/renew`, { method: "POST", body: JSON.stringify(dto) }));
}

// Locks the channel (IsLocked: true, transacting suspended) — distinct from
// delink, which removes the link entirely. Only CustomerAccountId/Remarks matter.
export function stopAlternateChannel(id, dto) {
  return unwrap(apiFetch(`${BASE}/${id}/stop`, { method: "POST", body: JSON.stringify(dto) }));
}

// Hard-deletes the row after logging a Channel Delinking history entry.
// POST, not DELETE — the body's CustomerAccountId/Remarks drive the log
// entry. Only CustomerAccountId/Remarks matter.
export function delinkAlternateChannel(id, dto) {
  return unwrap(apiFetch(`${BASE}/${id}/delink`, { method: "POST", body: JSON.stringify(dto) }));
}

export function approveAlternateChannel(id, remarks) {
  return unwrap(apiFetch(`${BASE}/${id}/approve`, { method: "POST", body: JSON.stringify({ remarks }) }));
}

export function rejectAlternateChannel(id, remarks) {
  return unwrap(apiFetch(`${BASE}/${id}/reject`, { method: "POST", body: JSON.stringify({ remarks }) }));
}

// Fees — scoped by channel type, not by individual link. knownChargeType
// required, no "all" default.
export function getAlternateChannelTypeCommissions(type, knownChargeType) {
  const params = new URLSearchParams({ knownChargeType: String(knownChargeType) });
  return unwrap(apiFetch(`${BASE}/types/${type}/commissions?${params.toString()}`));
}

export function replaceAlternateChannelTypeCommissions(type, { knownChargeType, chargeBenefactor, commissions }) {
  return unwrap(apiFetch(`${BASE}/types/${type}/commissions`, {
    method: "PUT",
    body: JSON.stringify({ KnownChargeType: knownChargeType, ChargeBenefactor: chargeBenefactor, Commissions: commissions }),
  }));
}

export { normalizeList };
