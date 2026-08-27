import { apiJson as apiFetch, normalizeList } from "@/lib/api";

// Client for WebApplication1's InHouseController
// (Controllers/InHouseController.cs), base api/frontoffice/inhousecheques,
// docs/api/frontoffice-api-spec.md §14. Batch build (each entry validated,
// first invalid entry fails the whole request — the CHEQUE-PROCESSING
// changelog fix that restored ValidateAll() actually being called here),
// then print per cheque (client renders/prints, server only flips
// IsPrinted/PrintedNumber and posts the GL journal — confirmed against
// InHouseChequeAppService, no server-side printing exists).

const FIN_BASE = `${import.meta.env.VITE_APP_FIN_URL}`;
const IN_HOUSE_CHEQUES_BASE = `${FIN_BASE}/api/frontoffice/inhousecheques`;

async function unwrap(responsePromise) {
  const body = await responsePromise;
  return body?.data ?? body;
}

export function listInHouseCheques({ text = "", startDate, endDate, pageIndex = 0, pageSize = 20 } = {}) {
  const params = new URLSearchParams({ text, pageIndex: String(pageIndex), pageSize: String(pageSize) });
  if (startDate) params.set("startDate", startDate);
  if (endDate) params.set("endDate", endDate);
  return unwrap(apiFetch(`${IN_HOUSE_CHEQUES_BASE}?${params.toString()}`));
}

export function getInHouseCheque(id) {
  return unwrap(apiFetch(`${IN_HOUSE_CHEQUES_BASE}/${id}`));
}

export function listUnprintedInHouseCheques(branchId, { text = "", pageIndex = 0, pageSize = 20 } = {}) {
  const params = new URLSearchParams({ branchId, text, pageIndex: String(pageIndex), pageSize: String(pageSize) });
  return unwrap(apiFetch(`${IN_HOUSE_CHEQUES_BASE}/unprinted?${params.toString()}`));
}

// request: { Cheques: InHouseChequeDTO[], ModuleNavigationItemCode }.
export function createInHouseCheques(request) {
  return unwrap(apiFetch(IN_HOUSE_CHEQUES_BASE, { method: "POST", body: JSON.stringify(request) }));
}

// request: { PrintedNumber, BankLinkage: BankLinkageDTO, ModuleNavigationItemCode }.
export function printInHouseCheque(id, request) {
  return unwrap(apiFetch(`${IN_HOUSE_CHEQUES_BASE}/${id}/print`, { method: "POST", body: JSON.stringify(request) }));
}

export { normalizeList };
