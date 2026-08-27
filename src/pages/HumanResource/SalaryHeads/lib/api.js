import { apiJson as apiFetch, normalizeList } from "@/lib/api";
import { listAllChartOfAccounts } from "@/pages/Accounts/ChartOfAccounts/api";

// Client for WebApplication1's new SalaryHeadsController
// (Areas/HumanResource/Controllers/SalaryHeadsController.cs, added
// 2026-08-18 — NavigationMenu.cs Code 22020 existed server-side with no
// REST controller behind it until now, same gap as Holidays/Leave). No
// DELETE — ISalaryHeadAppService has none. Bare DTO/PageCollectionInfo
// responses, no { success, message, data } envelope. A plain
// BadRequest(string) serializes as { Message } (capital M) — same gotcha
// documented in FOSA/TellerTransactions/requestsApi.js. A 409 Conflict
// means the chosen Type is one of the seven restricted to one instance
// system-wide and one already exists (see lib/enums.js SINGLETON_TYPES).
const BASE = `${import.meta.env.VITE_APP_FIN_URL}`;
const SALARY_HEADS_BASE = `${BASE}/api/humanresource/salaryheads`;

async function unwrapJson(responsePromise) {
  const body = await responsePromise;
  return body;
}

export function listSalaryHeads({ text = "", pageIndex = 0, pageSize = 20 } = {}) {
  const params = new URLSearchParams({ pageIndex: String(pageIndex), pageSize: String(pageSize) });
  if (text.trim()) params.set("text", text.trim());
  return unwrapJson(apiFetch(`${SALARY_HEADS_BASE}?${params.toString()}`));
}

export function createSalaryHead(payload) {
  return unwrapJson(apiFetch(SALARY_HEADS_BASE, { method: "POST", body: JSON.stringify(payload) }));
}

export function updateSalaryHead(id, payload) {
  return unwrapJson(apiFetch(`${SALARY_HEADS_BASE}/${id}`, { method: "PUT", body: JSON.stringify({ ...payload, Id: id }) }));
}

// G/L Account picker — same api/values/GetChartOfAccount lookup
// HumanResource/EmployeeTypes already uses for the identical purpose.
export function listChartOfAccounts() {
  return listAllChartOfAccounts();
}

// Product pickers, one per ProductCode — each already a real, working
// Accounts-module endpoint (SavingsProducts/InvestmentProducts/LoanProducts
// list pages use these same routes).
export function listSavingsProducts() {
  return apiFetch(`${BASE}/api/accounts/savingsproducts`)
    .then((d) => (Array.isArray(d) ? d : Array.isArray(d?.Data) ? d.Data : Array.isArray(d?.data) ? d.data : []));
}

export function listInvestmentProducts() {
  return apiFetch(`${BASE}/api/accounts/investmentsproducts`)
    .then((d) => (Array.isArray(d) ? d : Array.isArray(d?.Data) ? d.Data : Array.isArray(d?.data) ? d.data : []));
}

export function listLoanProducts() {
  return apiFetch(`${BASE}/api/accounts/loanproducts`)
    .then((body) => normalizeList(body?.data ?? body?.Data ?? body));
}
