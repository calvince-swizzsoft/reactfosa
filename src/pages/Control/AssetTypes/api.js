import { apiFetch, normalizeList } from "@/lib/api";

// Client for WebApplication1's AssetTypesController
// (Areas/Control/Controllers/AssetTypesController.cs). NavigationMenu.cs Code
// 30004 ("Asset Types", under Control (Procurement) > Setup) had no
// domain/AppService/controller of its own anywhere until this build — only
// a lone, unused AssetTypeDTO existed. Backed now by IAssetTypeAppService
// (Application.MainBoundedContext/InventoryModule/Services), the same
// namespace Suppliers (30003) was just built into.
const BASE = `${import.meta.env.VITE_APP_FIN_URL}`;
export const ASSET_TYPES_BASE = `${BASE}/api/control/assettypes`;

async function unwrapJson(responsePromise) {
  const res = await responsePromise;
  const body = await res.json().catch(() => ({}));
  if (!res.ok || body?.success === false) {
    throw new Error(body?.message || body?.Message || `Request failed (${res.status})`);
  }
  return body?.data ?? body;
}

/** GET / — the list-page listing, searchable & paged. */
export async function listAssetTypes({ text = "", pageIndex = 0, pageSize = 20 } = {}) {
  const params = new URLSearchParams({ pageIndex: String(pageIndex), pageSize: String(pageSize) });
  if (text.trim()) params.set("text", text.trim());
  const page = await unwrapJson(apiFetch(`${ASSET_TYPES_BASE}?${params.toString()}`));
  return {
    items: normalizeList(page?.PageCollection ?? page?.pageCollection ?? page),
    itemsCount: Number(page?.ItemsCount ?? page?.itemsCount ?? 0),
  };
}

export function createAssetType(assetType) {
  return unwrapJson(apiFetch(ASSET_TYPES_BASE, {
    method: "POST",
    body: JSON.stringify(assetType),
  }));
}

export function updateAssetType(id, assetType) {
  return unwrapJson(apiFetch(`${ASSET_TYPES_BASE}/${id}`, {
    method: "PUT",
    body: JSON.stringify({ ...assetType, Id: id }),
  }));
}
