import { apiFetch } from "@/lib/api";

// Client functions for WebApplication1's ChartOfAccountController
// (Areas/Accounts/Controllers/ChartOfAccountController.cs), base
// api/accounts/chartofaccounts. Read directly from the real controller
// source (docs/api/chartofaccount-api-spec.md matched it exactly, so this
// is a straight transcription, not a guess):
// - GET /tree returns a DIFFERENT shape from the flat CRUD endpoints —
//   GeneralLedgerAccount (Id/ParentId/Category/Type/Code/Description +
//   correctly-populated Depth), not ChartOfAccountDTO. Only /tree populates
//   Depth/Children — the flat list/get-by-id always come back Depth: 0,
//   Children: [].
// - A ParentId that doesn't resolve to a real account is rejected with a
//   400 by this controller itself (not the app service, which would
//   otherwise silently create a root account instead of erroring).
// - Duplicate AccountCode is a 409 on both create and update, despite the
//   two operations reporting it completely differently at the app-service
//   layer (ErrorMessageResult on create vs. a thrown exception on update)
//   — the controller normalizes both to the same 409 shape.

const FIN_BASE = `${import.meta.env.VITE_APP_FIN_URL}`;
const COA_BASE = `${FIN_BASE}/api/accounts/chartofaccounts`;

async function unwrap(responsePromise) {
  const res = await responsePromise;
  const body = await res.json().catch(() => ({}));
  if (!res.ok || body.success === false) {
    const err = new Error(body?.message || `Request failed (${res.status})`);
    err.status = res.status;
    throw err;
  }
  return body?.data ?? body;
}

export function listChartOfAccounts({ text = "", pageIndex = 0, pageSize = 20 } = {}) {
  const params = new URLSearchParams({ text, pageIndex: String(pageIndex), pageSize: String(pageSize) });
  return unwrap(apiFetch(`${COA_BASE}?${params.toString()}`));
}

export function getChartOfAccount(id) {
  return unwrap(apiFetch(`${COA_BASE}/${id}`));
}

// Returns List<GeneralLedgerAccount> — see module note above, not
// ChartOfAccountDTO[].
export function getChartOfAccountTree() {
  return unwrap(apiFetch(`${COA_BASE}/tree`));
}

export function createChartOfAccount(chartOfAccountDTO) {
  return unwrap(apiFetch(COA_BASE, { method: "POST", body: JSON.stringify(chartOfAccountDTO) }));
}

export function updateChartOfAccount(id, chartOfAccountDTO) {
  return unwrap(apiFetch(`${COA_BASE}/${id}`, { method: "PUT", body: JSON.stringify(chartOfAccountDTO) }));
}

export function listSystemGeneralLedgerMappings({ pageIndex = 0, pageSize = 20 } = {}) {
  const params = new URLSearchParams({ pageIndex: String(pageIndex), pageSize: String(pageSize) });
  return unwrap(apiFetch(`${COA_BASE}/systemgeneralledgermappings?${params.toString()}`));
}

// PUT /systemgeneralledgermappings/{code} — the body must be the raw
// JSON-quoted Guid string, e.g. "b2c3d4e5-...", NOT { chartOfAccountId }.
// ASP.NET Web API's [FromBody] simple-type binding for a bare Guid
// parameter expects the entire request body to be that JSON-quoted value —
// JSON.stringify(aGuidString) already produces exactly that shape, so this
// looks unremarkable in the code but would silently bind to Guid.Empty
// (→ 400) if wrapped in an object instead. One idempotent upsert endpoint,
// not separate create/update calls.
export function mapSystemGeneralLedgerAccountCode(code, chartOfAccountId) {
  return unwrap(
    apiFetch(`${COA_BASE}/systemgeneralledgermappings/${code}`, {
      method: "PUT",
      body: JSON.stringify(chartOfAccountId),
    })
  );
}
