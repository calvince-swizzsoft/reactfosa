import { apiJson, normalizeList } from "@/lib/api";

// Client for WebApplication1's FixedDepositTypeController
// (Areas/Accounts/Controllers/FixedDepositTypeController.cs), base
// api/accounts/fixeddeposittypes. New controller (2026-08-16) — this
// screen's whole reason for existing: FrontOffice's FixedDeposits screen
// had no way to pick a real FixedDepositTypeId (no lookup endpoint
// existed), and swiftFin_FixedDepositTypes had zero rows in the dev DB
// until this controller shipped.
//
// Real lifecycle confirmed against source: Create (AddNewFixedDepositType)
// takes { FixedDepositType, EnforceFixedDepositBands, AttachedLoanProductIds,
// LevyIds, GraduatedScales } — the two id arrays are bare Guid[], resolved
// to full DTOs server-side. The three sub-resource PUTs below (levies,
// attached-products, graduated-scales) are full-replace and take full DTO
// objects, not bare ids — resolve selected ids back to full items from an
// already-fetched list before submitting, same discipline as everywhere
// else full-DTO sub-resources are used in this app.

const FIN_BASE = `${import.meta.env.VITE_APP_FIN_URL}`;
const FIXED_DEPOSIT_TYPES_BASE = `${FIN_BASE}/api/accounts/fixeddeposittypes`;

async function unwrap(responsePromise) {
  const body = await responsePromise;
  return body?.data ?? body;
}

// Unpaged — for pickers (e.g. FixedDeposits' create form).
export function listAllFixedDepositTypes() {
  return unwrap(apiJson(FIXED_DEPOSIT_TYPES_BASE));
}

export function listFixedDepositTypes({ text = "", pageIndex = 0, pageSize = 20 } = {}) {
  const params = new URLSearchParams({ text, pageIndex: String(pageIndex), pageSize: String(pageSize) });
  return unwrap(apiJson(`${FIXED_DEPOSIT_TYPES_BASE}/paged?${params.toString()}`));
}

export function getFixedDepositType(id) {
  return unwrap(apiJson(`${FIXED_DEPOSIT_TYPES_BASE}/${id}`));
}

// request: { FixedDepositType: FixedDepositTypeDTO, EnforceFixedDepositBands,
// AttachedLoanProductIds?: Guid[], LevyIds?: Guid[], GraduatedScales?: [] }.
export function createFixedDepositType(request) {
  return unwrap(apiJson(FIXED_DEPOSIT_TYPES_BASE, { method: "POST", body: JSON.stringify(request) }));
}

// Only updates the type's own fields — levies/attached-products/graduated
// scales are separate full-replace sub-resources, saved with their own
// requests below.
export function updateFixedDepositType(id, fixedDepositTypeDTO, enforceFixedDepositBands = true) {
  const params = new URLSearchParams({ enforceFixedDepositBands: String(enforceFixedDepositBands) });
  return unwrap(apiJson(`${FIXED_DEPOSIT_TYPES_BASE}/${id}?${params.toString()}`, {
    method: "PUT",
    body: JSON.stringify(fixedDepositTypeDTO),
  }));
}

export function listFixedDepositTypeLevies(id) {
  return unwrap(apiJson(`${FIXED_DEPOSIT_TYPES_BASE}/${id}/levies`));
}

// Full replace — send the complete list of LevyDTO objects that should
// remain attached ([] clears all).
export function updateFixedDepositTypeLevies(id, levies) {
  return unwrap(apiJson(`${FIXED_DEPOSIT_TYPES_BASE}/${id}/levies`, { method: "PUT", body: JSON.stringify(levies) }));
}

export function listFixedDepositTypeAttachedProducts(id) {
  return unwrap(apiJson(`${FIXED_DEPOSIT_TYPES_BASE}/${id}/attached-products`));
}

// Full replace — body is a ProductCollectionInfo, only LoanProductCollection
// is ever populated from this screen (the only sub-collection the reference
// app's own Create wizard ever attached for this product type).
export function updateFixedDepositTypeAttachedProducts(id, loanProducts) {
  return unwrap(apiJson(`${FIXED_DEPOSIT_TYPES_BASE}/${id}/attached-products`, {
    method: "PUT",
    body: JSON.stringify({ LoanProductCollection: loanProducts }),
  }));
}

export function listFixedDepositTypeGraduatedScales(id) {
  return unwrap(apiJson(`${FIXED_DEPOSIT_TYPES_BASE}/${id}/graduated-scales`));
}

// Full replace — rows are { RangeLowerLimit, RangeUpperLimit, Percentage }
// (Id/FixedDepositTypeId are server-assigned on save).
export function updateFixedDepositTypeGraduatedScales(id, graduatedScales) {
  return unwrap(apiJson(`${FIXED_DEPOSIT_TYPES_BASE}/${id}/graduated-scales`, {
    method: "PUT",
    body: JSON.stringify(graduatedScales),
  }));
}

export { normalizeList };
