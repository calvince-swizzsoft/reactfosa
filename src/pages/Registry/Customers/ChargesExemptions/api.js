import { apiJson as apiFetch, normalizeList } from "@/lib/api";

// Client for WebApplication1's ChargeExemptionsController
// (Areas/Registry/Controllers/ChargeExemptionsController.cs). NavigationMenu.cs
// Code 21010 ("Charges Exemptions") had no domain/DTO of its own anywhere —
// this is actually backed by ICommissionExemptionAppService (a
// CommissionExemption is a named exemption group tied to one commission;
// a CommissionExemptionEntry is one customer's membership in that group,
// i.e. that customer is exempt from that commission charge). Same "Charges"
// = Commission naming this codebase already uses for moduleRouteMap.js's
// Code 23009.
const BASE = `${import.meta.env.VITE_APP_FIN_URL}`;
const EXEMPTIONS_BASE = `${BASE}/api/registry/chargeexemptions`;
export const COMMISSIONS_BASE = `${BASE}/api/accounts/commissions`;

async function unwrapJson(responsePromise) {
  const body = await responsePromise;
  return body?.data ?? body;
}

/** GET /paged — the list-page listing, searchable. */
export async function listExemptions({ text = "", pageIndex = 0, pageSize = 20 } = {}) {
  const params = new URLSearchParams({ pageIndex: String(pageIndex), pageSize: String(pageSize) });
  if (text.trim()) params.set("text", text.trim());
  const page = await unwrapJson(apiFetch(`${EXEMPTIONS_BASE}/paged?${params.toString()}`));
  return {
    items: normalizeList(page?.PageCollection ?? page?.pageCollection ?? page),
    itemsCount: Number(page?.ItemsCount ?? page?.itemsCount ?? 0),
  };
}

export function createExemption({ commissionId, description }) {
  return unwrapJson(apiFetch(EXEMPTIONS_BASE, {
    method: "POST",
    body: JSON.stringify({ CommissionId: commissionId, Description: description }),
  }));
}

export function updateExemption(id, { commissionId, description, isLocked }) {
  return unwrapJson(apiFetch(`${EXEMPTIONS_BASE}/${id}`, {
    method: "PUT",
    body: JSON.stringify({ Id: id, CommissionId: commissionId, Description: description, IsLocked: isLocked }),
  }));
}

export async function listEntries(exemptionId) {
  const data = await unwrapJson(apiFetch(`${EXEMPTIONS_BASE}/${exemptionId}/entries`));
  return normalizeList(data);
}

/**
 * PUT /{id}/entries — full replace. The backend deletes every existing
 * entry for this exemption and re-inserts exactly what's submitted, so
 * there's no per-row Id to track — entries are plain { CustomerId, Remarks }
 * objects staged locally in the drawer, same pattern as
 * AlertPreferencesDrawer.jsx's account-alerts save.
 */
export async function replaceEntries(exemptionId, entries) {
  const data = await unwrapJson(apiFetch(`${EXEMPTIONS_BASE}/${exemptionId}/entries`, {
    method: "PUT",
    body: JSON.stringify(entries.map((e) => ({ CustomerId: e.CustomerId, Remarks: e.Remarks || "" }))),
  }));
  return normalizeList(data);
}
