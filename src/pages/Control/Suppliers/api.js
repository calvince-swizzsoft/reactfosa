import { apiJson as apiFetch, normalizeList } from "@/lib/api";

// Client for WebApplication1's SupplierController
// (Areas/Control/Controllers/SupplierController.cs). NavigationMenu.cs Code
// 30003 ("Suppliers", under Control (Procurement) > Setup) had no
// domain/AppService/controller of its own anywhere until this build — only
// a lone, unused SupplierDTO existed. Backed now by ISupplierAppService
// (Application.MainBoundedContext/InventoryModule/Services), following the
// existing (until now unused/unwired) InventoryModule namespace's sibling
// entities (Category, Inventory, PurchaseOrder, SalesOrder).
const BASE = `${import.meta.env.VITE_APP_FIN_URL}`;
export const SUPPLIERS_BASE = `${BASE}/api/control/suppliers`;
export const CHART_OF_ACCOUNTS_BASE = `${BASE}/api/accounts/chartofaccounts`;

async function unwrapJson(responsePromise) {
  const body = await responsePromise;
  return body?.data ?? body;
}

/** GET / — the list-page listing, searchable & paged. */
export async function listSuppliers({ text = "", pageIndex = 0, pageSize = 20 } = {}) {
  const params = new URLSearchParams({ pageIndex: String(pageIndex), pageSize: String(pageSize) });
  if (text.trim()) params.set("text", text.trim());
  const page = await unwrapJson(apiFetch(`${SUPPLIERS_BASE}?${params.toString()}`));
  return {
    items: normalizeList(page?.PageCollection ?? page?.pageCollection ?? page),
    itemsCount: Number(page?.ItemsCount ?? page?.itemsCount ?? 0),
  };
}

export function createSupplier(supplier) {
  return unwrapJson(apiFetch(SUPPLIERS_BASE, {
    method: "POST",
    body: JSON.stringify(supplier),
  }));
}

export function updateSupplier(id, supplier) {
  return unwrapJson(apiFetch(`${SUPPLIERS_BASE}/${id}`, {
    method: "PUT",
    body: JSON.stringify({ ...supplier, Id: id }),
  }));
}
