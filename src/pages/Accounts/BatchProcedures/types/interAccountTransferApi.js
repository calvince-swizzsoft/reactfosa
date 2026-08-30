import { apiJson as apiFetch, normalizeList } from "@/lib/api";

// Client for WebApplication1's InterAccountTransferBatchController
// (Areas/Accounts/Controllers/InterAccountTransferBatchController.cs),
// api/accounts/interaccounttransferbatches —
// docs/api/batch-procedures-api-spec.md §9. One source CustomerAccount
// (the header) transfers its balance out to however many entries, each
// targeting EITHER a customer account or a raw G/L account via ApportionTo
// (1=CustomerAccount, 2=GeneralLedgerAccount) — genuinely consulted
// server-side (AddNewInterAccountTransferBatchEntry nulls out whichever of
// ChartOfAccountId/CustomerAccountId doesn't apply), unlike Voucher's
// lookalike-but-dead per-entry fields.
//
// No control-total validation exists for this type at all — nothing
// server-side stops entries' Principal+Interest from exceeding what the
// source account can actually cover. The reference app's
// AvailableBalance field has no backing column and there's no endpoint in
// this backend that returns a real, trustworthy balance for a customer
// account (CustomerAccountsController.Get uses a no-balance projection on
// purpose), so this client deliberately does not show a fake "you're
// over-transferring" warning — see the panel's own note on this gap.

const FIN_BASE = `${import.meta.env.VITE_APP_FIN_URL}`;
const BASE = `${FIN_BASE}/api/accounts/interaccounttransferbatches`;

async function unwrap(responsePromise) {
  const body = await responsePromise;
  return body?.data ?? body;
}

// status is optional, same four-overload dispatch as Journal Voucher/General Ledger.
export function listInterAccountTransferBatches({ status, text = "", startDate, endDate, pageIndex = 0, pageSize = 20 } = {}) {
  const params = new URLSearchParams({ text, pageIndex: String(pageIndex), pageSize: String(pageSize) });
  if (status !== undefined && status !== null && status !== "") params.set("status", String(status));
  if (startDate) params.set("startDate", startDate);
  if (endDate) params.set("endDate", endDate);
  return unwrap(apiFetch(`${BASE}?${params.toString()}`));
}

// Only BranchId/CustomerAccountId/Reference actually persist — everything
// else on the DTO (AvailableBalance, StartDate/EndDate, denormalized
// customer fields) is display-only, not stored.
export function createInterAccountTransferBatch(dto) {
  return unwrap(apiFetch(BASE, { method: "POST", body: JSON.stringify(dto) }));
}

export function auditInterAccountTransferBatch(id, request) {
  return unwrap(apiFetch(`${BASE}/${id}/audit`, { method: "POST", body: JSON.stringify(request) }));
}

// Refuses outright unless already Audited (a real control-bypass bug in
// the reference app's equivalent was fixed here — see spec §9.1).
export function authorizeInterAccountTransferBatch(id, request) {
  return unwrap(apiFetch(`${BASE}/${id}/authorize`, { method: "POST", body: JSON.stringify(request) }));
}

export function listInterAccountTransferBatchEntries(id, { text = "", pageIndex = 0, pageSize = 50 } = {}) {
  const params = new URLSearchParams({ text, pageIndex: String(pageIndex), pageSize: String(pageSize) });
  return unwrap(apiFetch(`${BASE}/${id}/entries?${params.toString()}`));
}

// entryDTO: { ApportionTo, ChartOfAccountId?, CustomerAccountId?, Principal,
// Interest, PrimaryDescription, SecondaryDescription, Reference }
export function addInterAccountTransferBatchEntry(id, entryDTO) {
  return unwrap(apiFetch(`${BASE}/${id}/entries`, { method: "POST", body: JSON.stringify(entryDTO) }));
}

export function removeInterAccountTransferBatchEntries(entries) {
  return unwrap(apiFetch(`${BASE}/entries/remove`, { method: "POST", body: JSON.stringify(entries) }));
}

export function getInterAccountTransferDynamicCharges(id) {
  return unwrap(apiFetch(`${BASE}/${id}/dynamiccharges`));
}

export function replaceInterAccountTransferDynamicCharges(id, dynamicCharges) {
  return unwrap(apiFetch(`${BASE}/${id}/dynamiccharges`, { method: "PUT", body: JSON.stringify(dynamicCharges.map((item) => ({ Id: item.Id }))) }));
}

export { normalizeList };
