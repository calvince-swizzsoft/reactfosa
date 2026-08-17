import { apiFetch, normalizeList } from "@/lib/api";

// Client for WebApplication1's LoanProductController
// (Areas/Accounts/Controllers/LoanProductController.cs),
// api/accounts/loanproducts — docs/api/loan-product-api-spec.md. A
// different, Accounts-module LoanProduct concept from the legacy loan API
// src/pages/Loaning/LoanProducts.jsx talks to — do not assume matching ids.
// Standard { success, message, data } envelope throughout, no exceptions.

const FIN_BASE = `${import.meta.env.VITE_APP_FIN_URL}`;
const BASE = `${FIN_BASE}/api/accounts/loanproducts`;

async function unwrap(responsePromise) {
  const res = await responsePromise;
  const body = await res.json().catch(() => ({}));
  if (!res.ok || body.success === false) {
    throw new Error(body?.message || `Request failed (${res.status})`);
  }
  return body?.data ?? body;
}

// Unpaged — kept as the existing contract for pickers elsewhere in the app.
export function listAllLoanProducts() {
  return unwrap(apiFetch(BASE)).then(normalizeList);
}

export function listLoanProductsPaged({ text = "", pageIndex = 0, pageSize = 20 } = {}) {
  const params = new URLSearchParams({ text, pageIndex: String(pageIndex), pageSize: String(pageSize) });
  return unwrap(apiFetch(`${BASE}/paged?${params.toString()}`));
}

export function getLoanProduct(id) {
  return unwrap(apiFetch(`${BASE}/${id}`));
}

// Body: { LoanProduct, Deductibles?, LoanCycles?, AuxiliaryConditions?,
// AuxiliaryAppraisalFactors?, DynamicCharges?, AppraisalProducts?,
// Commissions?, CommissionKnownChargeType?, CommissionChargeBasisValue? } —
// only LoanProduct is required, every sub-collection is optional.
export function createLoanProduct(request) {
  return unwrap(apiFetch(BASE, { method: "POST", body: JSON.stringify(request) }));
}

// Main fields only — never touches sub-collections, use the sub-resource
// endpoints below for those.
export function updateLoanProduct(id, loanProductDTO) {
  return unwrap(apiFetch(`${BASE}/${id}`, { method: "PUT", body: JSON.stringify(loanProductDTO) }));
}

// Five flat sub-resources — GET returns the current list ([] if none), PUT
// is a full replace (send every item you want kept, not just the delta).
function subResourceClient(path) {
  return {
    list: (id) => unwrap(apiFetch(`${BASE}/${id}/${path}`)),
    replace: (id, items) => unwrap(apiFetch(`${BASE}/${id}/${path}`, { method: "PUT", body: JSON.stringify(items) })),
  };
}

export const dynamicCharges = subResourceClient("dynamic-charges");
export const loanCycles = subResourceClient("loan-cycles");
export const auxiliaryConditions = subResourceClient("auxiliary-conditions");
export const deductibles = subResourceClient("deductibles");
export const auxiliaryAppraisalFactors = subResourceClient("auxiliary-appraisal-factors");

// Non-flat — round-trips a whole ProductCollectionInfo (7 lists) at once.
export function getAppraisalProducts(id) {
  return unwrap(apiFetch(`${BASE}/${id}/appraisal-products`));
}
export function replaceAppraisalProducts(id, productCollectionInfo) {
  return unwrap(apiFetch(`${BASE}/${id}/appraisal-products`, { method: "PUT", body: JSON.stringify(productCollectionInfo) }));
}

// Scoped by knownChargeType — no "all commissions" view, required param.
export function getCommissions(id, knownChargeType) {
  const params = new URLSearchParams({ knownChargeType: String(knownChargeType) });
  return unwrap(apiFetch(`${BASE}/${id}/commissions?${params.toString()}`));
}
export function replaceCommissions(id, { knownChargeType, chargeBasisValue, commissions }) {
  return unwrap(apiFetch(`${BASE}/${id}/commissions`, {
    method: "PUT",
    body: JSON.stringify({ KnownChargeType: knownChargeType, ChargeBasisValue: chargeBasisValue, Commissions: commissions }),
  }));
}

export { normalizeList };
