import { apiJson as apiFetch, normalizeList } from "@/lib/api";

// Client for WebApplication1's DelegateController
// (Areas/Registry/Controllers/DelegateController.cs), wrapping the
// pre-existing IDelegateAppService. Same { success, message, data } envelope
// as ZoneController/EmployerController.
const BASE = `${import.meta.env.VITE_APP_FIN_URL}`;
const DELEGATES_BASE = `${BASE}/api/registry/delegate`;
export const EMPLOYERS_BASE = `${BASE}/api/registry/employer`;

async function unwrapJson(responsePromise) {
  const body = await responsePromise;
  return body?.data ?? body;
}

/** GET / (paged) — the list-page listing, searchable. */
export async function listDelegates({ text = "", pageIndex = 0, pageSize = 20 } = {}) {
  const params = new URLSearchParams({ pageIndex: String(pageIndex), pageSize: String(pageSize) });
  if (text.trim()) params.set("text", text.trim());
  const page = await unwrapJson(apiFetch(`${DELEGATES_BASE}?${params.toString()}`));
  return {
    items: normalizeList(page?.PageCollection ?? page?.pageCollection ?? page),
    itemsCount: Number(page?.ItemsCount ?? page?.itemsCount ?? 0),
  };
}

/** GET /{employerId}/zones — the second step of the zone lookup dialog. */
export async function listZonesForEmployer(employerId) {
  const data = await unwrapJson(apiFetch(`${EMPLOYERS_BASE}/${employerId}/zones`));
  return normalizeList(data);
}

export function createDelegate({ zoneId, customerId, remarks }) {
  return unwrapJson(apiFetch(DELEGATES_BASE, {
    method: "POST",
    body: JSON.stringify({ ZoneId: zoneId, CustomerId: customerId, Remarks: remarks }),
  }));
}

export function updateDelegate(id, { zoneId, customerId, remarks, isLocked }) {
  return unwrapJson(apiFetch(`${DELEGATES_BASE}/${id}`, {
    method: "PUT",
    body: JSON.stringify({ Id: id, ZoneId: zoneId, CustomerId: customerId, Remarks: remarks, IsLocked: isLocked }),
  }));
}
