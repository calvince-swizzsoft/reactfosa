import { apiFetch, normalizeList } from "@/lib/api";

// Client for WebApplication1's PackageTypeController
// (Areas/Control/Controllers/PackageTypeController.cs). NavigationMenu.cs
// Code 30006 ("Package Types", under Control (Procurement) > Setup) had no
// domain/AppService/controller of its own anywhere until this build — only
// a lone, unused PackageTypeDTO existed. Same InventoryModule namespace as
// Suppliers (30003) and Asset Types (30004).
const BASE = `${import.meta.env.VITE_APP_FIN_URL}`;
export const PACKAGE_TYPES_BASE = `${BASE}/api/control/packagetypes`;

async function unwrapJson(responsePromise) {
  const res = await responsePromise;
  const body = await res.json().catch(() => ({}));
  if (!res.ok || body?.success === false) {
    throw new Error(body?.message || body?.Message || `Request failed (${res.status})`);
  }
  return body?.data ?? body;
}

/** GET / — the list-page listing, searchable & paged. */
export async function listPackageTypes({ text = "", pageIndex = 0, pageSize = 20 } = {}) {
  const params = new URLSearchParams({ pageIndex: String(pageIndex), pageSize: String(pageSize) });
  if (text.trim()) params.set("text", text.trim());
  const page = await unwrapJson(apiFetch(`${PACKAGE_TYPES_BASE}?${params.toString()}`));
  return {
    items: normalizeList(page?.PageCollection ?? page?.pageCollection ?? page),
    itemsCount: Number(page?.ItemsCount ?? page?.itemsCount ?? 0),
  };
}

export function createPackageType(packageType) {
  return unwrapJson(apiFetch(PACKAGE_TYPES_BASE, {
    method: "POST",
    body: JSON.stringify(packageType),
  }));
}

export function updatePackageType(id, packageType) {
  return unwrapJson(apiFetch(`${PACKAGE_TYPES_BASE}/${id}`, {
    method: "PUT",
    body: JSON.stringify({ ...packageType, Id: id }),
  }));
}
