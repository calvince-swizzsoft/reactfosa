import { apiFetch, normalizeList } from "@/lib/api";

// Client for WebApplication1's CreditBatchController
// (Areas/Accounts/Controllers/CreditBatchController.cs),
// api/accounts/creditbatches — docs/api/batch-procedures-api-spec.md §1.
// Every response (success and error, including 400s) goes through this
// controller's own ApiResponse/ErrorResponse helpers — { success, message,
// data }, lowercase `message` always (confirmed against source: none of the
// 9 batch controllers ever call a plain BadRequest(string), so there's no
// capital-M `Message` fallback needed here, unlike some other FOSA clients).

const FIN_BASE = `${import.meta.env.VITE_APP_FIN_URL}`;
const BASE = `${FIN_BASE}/api/accounts/creditbatches`;

async function unwrap(responsePromise) {
  const res = await responsePromise;
  const body = await res.json().catch(() => ({}));
  if (!res.ok || body.success === false) {
    throw new Error(body?.message || `Request failed (${res.status})`);
  }
  return body?.data ?? body;
}

export function listCreditBatches({ status, text = "", startDate, endDate, pageIndex = 0, pageSize = 20 } = {}) {
  const params = new URLSearchParams({ text, pageIndex: String(pageIndex), pageSize: String(pageSize) });
  if (status !== undefined && status !== null && status !== "") params.set("status", String(status));
  if (startDate) params.set("startDate", startDate);
  if (endDate) params.set("endDate", endDate);
  return unwrap(apiFetch(`${BASE}?${params.toString()}`));
}

export function getCreditBatch(id) {
  return unwrap(apiFetch(`${BASE}/${id}`));
}

// Create -> Pending. BatchNumber/Status/CreatedBy assigned server-side.
export function createCreditBatch(creditBatchDTO) {
  return unwrap(apiFetch(BASE, { method: "POST", body: JSON.stringify(creditBatchDTO) }));
}

// Only touches the batch's own header fields — entries have their own
// sub-resource endpoints below.
export function updateCreditBatch(id, creditBatchDTO) {
  return unwrap(apiFetch(`${BASE}/${id}`, { method: "PUT", body: JSON.stringify(creditBatchDTO) }));
}

// { Option, Remarks } — Option: 1=Post (-> Audited, only if entries total <=
// batch TotalValue), 2=Reject. Only accepts a Pending batch.
export function auditCreditBatch(id, request) {
  return unwrap(apiFetch(`${BASE}/${id}/audit`, { method: "POST", body: JSON.stringify(request) }));
}

// { Option, Remarks, ModuleNavigationItemCode } — Option: 1=Post (-> Posted;
// for Payout/CheckOff this also queues every entry for async GL posting),
// 2=Reject. NOT gated on the batch already being Audited server-side (a
// known reference-app quirk, not something to work around client-side).
export function authorizeCreditBatch(id, request) {
  return unwrap(apiFetch(`${BASE}/${id}/authorize`, { method: "POST", body: JSON.stringify(request) }));
}

export function listCreditBatchEntries(id, { text = "", filter = 0, pageIndex = 0, pageSize = 50 } = {}) {
  const params = new URLSearchParams({ text, filter: String(filter), pageIndex: String(pageIndex), pageSize: String(pageSize) });
  return unwrap(apiFetch(`${BASE}/${id}/entries?${params.toString()}`));
}

// entryDTO: { CustomerAccountId?, Beneficiary?, Principal, Interest,
// Reference } — CreditBatchId is set from `id`, everything else
// (CreditBatchCreditTypeChartOfAccountId etc.) is resolved server-side from
// the batch header.
export function addCreditBatchEntry(id, entryDTO) {
  return unwrap(apiFetch(`${BASE}/${id}/entries`, { method: "POST", body: JSON.stringify(entryDTO) }));
}

export function removeCreditBatchEntries(entries) {
  return unwrap(apiFetch(`${BASE}/entries/remove`, { method: "POST", body: JSON.stringify(entries) }));
}

export { normalizeList };
