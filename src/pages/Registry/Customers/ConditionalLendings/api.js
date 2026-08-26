import { apiJson as apiFetch, normalizeList } from "@/lib/api";

// Client for WebApplication1's ConditionalLendingController
// (Areas/Registry/Controllers/ConditionalLendingController.cs), wrapping the
// pre-existing IConditionalLendingAppService — same "group + entries" shape
// as ChargesExemptions, but tied to a loan product rather than a
// commission.
const BASE = `${import.meta.env.VITE_APP_FIN_URL}`;
const CONDITIONAL_LENDINGS_BASE = `${BASE}/api/registry/conditionallendings`;
export const LOAN_PRODUCTS_BASE = `${BASE}/api/accounts/loanproducts`;

async function unwrapJson(responsePromise) {
  const body = await responsePromise;
  return body?.data ?? body;
}

/** GET /paged — the list-page listing, searchable. */
export async function listConditionalLendings({ text = "", pageIndex = 0, pageSize = 20 } = {}) {
  const params = new URLSearchParams({ pageIndex: String(pageIndex), pageSize: String(pageSize) });
  if (text.trim()) params.set("text", text.trim());
  const page = await unwrapJson(apiFetch(`${CONDITIONAL_LENDINGS_BASE}/paged?${params.toString()}`));
  return {
    items: normalizeList(page?.PageCollection ?? page?.pageCollection ?? page),
    itemsCount: Number(page?.ItemsCount ?? page?.itemsCount ?? 0),
  };
}

export function createConditionalLending({ loanProductId, description }) {
  return unwrapJson(apiFetch(CONDITIONAL_LENDINGS_BASE, {
    method: "POST",
    body: JSON.stringify({ LoanProductId: loanProductId, Description: description }),
  }));
}

export function updateConditionalLending(id, { loanProductId, description, isLocked }) {
  return unwrapJson(apiFetch(`${CONDITIONAL_LENDINGS_BASE}/${id}`, {
    method: "PUT",
    body: JSON.stringify({ Id: id, LoanProductId: loanProductId, Description: description, IsLocked: isLocked }),
  }));
}

export async function listEntries(conditionalLendingId) {
  const data = await unwrapJson(apiFetch(`${CONDITIONAL_LENDINGS_BASE}/${conditionalLendingId}/entries`));
  return normalizeList(data);
}

/** PUT /{id}/entries — full replace, same pattern as ChargesExemptions' entries save. */
export async function replaceEntries(conditionalLendingId, entries) {
  const data = await unwrapJson(apiFetch(`${CONDITIONAL_LENDINGS_BASE}/${conditionalLendingId}/entries`, {
    method: "PUT",
    body: JSON.stringify(entries.map((e) => ({ CustomerId: e.CustomerId, Remarks: e.Remarks || "" }))),
  }));
  return normalizeList(data);
}
