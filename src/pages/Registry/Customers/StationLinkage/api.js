import { apiFetch, normalizeList } from "@/lib/api";

// Client for the real, live CustomerController.cs (api/registry/customer,
// singular) — Station Linkage isn't a separate domain entity, it's just
// Customer.StationId. GET by-station/{id} and PUT {id}/station already
// existed (used elsewhere); DELETE {id}/station (reset, i.e. unlink) was
// added for this screen, wrapping ICustomerAppService.ResetCustomerStationAsync
// which was already fully built but had no REST endpoint.
const BASE = `${import.meta.env.VITE_APP_FIN_URL}`;
const CUSTOMER_BASE = `${BASE}/api/registry/customer`;
export const STATIONS_BASE = `${BASE}/api/registry/zone/stations`;

async function unwrapJson(responsePromise) {
  const res = await responsePromise;
  const body = await res.json().catch(() => ({}));
  if (!res.ok || body?.success === false) {
    throw new Error(body?.message || body?.Message || `Request failed (${res.status})`);
  }
  return body?.data ?? body;
}

/** GET /by-station/{stationId} (paged) — customers currently linked to this station. */
export async function listCustomersForStation(stationId, { text = "", pageIndex = 0, pageSize = 20 } = {}) {
  const params = new URLSearchParams({ pageIndex: String(pageIndex), pageSize: String(pageSize) });
  if (text.trim()) params.set("text", text.trim());
  const page = await unwrapJson(apiFetch(`${CUSTOMER_BASE}/by-station/${stationId}?${params.toString()}`));
  return {
    items: normalizeList(page?.PageCollection ?? page?.pageCollection ?? page),
    itemsCount: Number(page?.ItemsCount ?? page?.itemsCount ?? 0),
  };
}

/** PUT /{id}/station — links the customer to the given station. */
export function linkCustomerToStation(customerId, stationId) {
  return unwrapJson(apiFetch(`${CUSTOMER_BASE}/${customerId}/station`, {
    method: "PUT",
    body: JSON.stringify({ Id: customerId, StationId: stationId }),
  }));
}

/** DELETE /{id}/station — clears the customer's station (Customer.StationId = null). */
export function unlinkCustomerFromStation(customerId) {
  return unwrapJson(apiFetch(`${CUSTOMER_BASE}/${customerId}/station`, { method: "DELETE" }));
}
