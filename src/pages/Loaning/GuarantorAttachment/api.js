import { apiJson as apiFetch } from "@/lib/api";

// Client for WebApplication1's LoanGuarantorAttachmentController
// (Areas/BackOffice/Controllers/LoanGuarantorAttachmentController.cs),
// api/backoffice/loanguarantorattachments —
// docs/api/loan-guarantor-attachment-api-spec.md. Consolidates 3 reference
// screens (Attach/Relieve/Substitute) behind one controller, matching 3
// distinct NavigationMenu codes (70014/70015/70016) — same "one controller,
// unite via tabs" precedent as Batch Procedures/Cheques.
//
// A guarantor's own CustomerAccount pledged as security against a LOAN
// PRODUCT (not a specific case) — a different concept from
// LoanGuarantorController's case-scoped guarantors (Phase 3). Real gotchas
// confirmed against AttachLoanGuarantors directly, not just the doc:
// - Each row in `loanGuarantors` must reference an EXISTING, already-
//   persisted LoanGuarantorDTO by `Id` — attach doesn't create new
//   guarantor records, it pledges security for ones that already exist
//   (create those first via loanguarantors, Phase 3's Guarantor Management
//   screen). No existence check happens server-side on that Id.
// - The real money fields per row are `PrincipalAttached`/`InterestAttached`
//   — `AmountGuaranteed` doesn't exist on this flow at all.
// - `destinationLoanProductId` is a LoanProduct id, not a LoanCase id —
//   easy to misname, confirmed directly against
//   ILoanProductAppService.FindLoanProduct's signature.
// - Attach/Relieve/Substitute all return `data: null` on success.

const FIN_BASE = `${import.meta.env.VITE_APP_FIN_URL}`;
const BASE = `${FIN_BASE}/api/backoffice/loanguarantorattachments`;

async function unwrap(responsePromise) {
  const body = await responsePromise;
  return body?.data ?? body;
}

// request: { SourceCustomerAccountId, DestinationLoanProductId,
// LoanGuarantors: [{Id, PrincipalAttached, InterestAttached}],
// ModuleNavigationItemCode }
export function attachLoanGuarantors(request) {
  return unwrap(apiFetch(BASE, { method: "POST", body: JSON.stringify(request) }));
}

// status defaults to LoanGuarantorAttachmentHistoryStatus.Attached (0) —
// server also defaults startDate/endDate to the last month if omitted.
export function listAttachmentHistory({ status = 0, startDate, endDate, text = "", pageIndex = 0, pageSize = 20 } = {}) {
  const params = new URLSearchParams({ status: String(status), text, pageIndex: String(pageIndex), pageSize: String(pageSize) });
  if (startDate) params.set("startDate", startDate);
  if (endDate) params.set("endDate", endDate);
  return unwrap(apiFetch(`${BASE}?${params.toString()}`));
}

export function getAttachmentHistoryEntries(id) {
  return unwrap(apiFetch(`${BASE}/${id}/entries`));
}

// request: { ModuleNavigationItemCode }. Relieves EVERY guarantee under
// one attachment history record in one call — there's no per-entry relieve.
export function relieveLoanGuarantors(id, moduleNavigationItemCode) {
  return unwrap(apiFetch(`${BASE}/${id}/relieve`, { method: "POST", body: JSON.stringify({ ModuleNavigationItemCode: moduleNavigationItemCode }) }));
}

// request: { SubstituteGuarantorCustomerId, LoanGuarantorIds: [guid, ...],
// ModuleNavigationItemCode } — each id must resolve to an existing
// LoanGuarantorDTO (400 if not found), the new guarantor replaces the
// guarantor on each of those records.
export function substituteLoanGuarantors(request) {
  return unwrap(apiFetch(`${BASE}/substitute`, { method: "POST", body: JSON.stringify(request) }));
}
