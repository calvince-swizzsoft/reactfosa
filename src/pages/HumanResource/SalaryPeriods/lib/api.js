import { apiJson as apiFetch } from "@/lib/api";

// Client for WebApplication1's new SalaryPeriodsController/PaySlipsController
// (Areas/HumanResource/Controllers/, added 2026-08-18 — NavigationMenu.cs
// Codes 22023 (Periods) / 22024 (Processing) / 22025 (Payslips) / 22026
// (Period Closing) existed server-side with no REST controller until now.
// See Salary Processing.md.
//
// Processing a period only ever stages Pending payslips — it never posts
// anything or moves money. Posting an individual payslip (postPaySlip) is
// the real step: it posts real G/L journals and, if the period has
// ExecutePayoutStandingOrders set, queues standing-order payouts. Always
// confirm with the user before calling postPaySlip, same as any other
// destructive/financial action in this app.
//
// Bare DTO/PageCollectionInfo responses, no envelope. A plain
// BadRequest(string) or a 409 Conflict both serialize as { Message }
// (capital M).
const BASE = `${import.meta.env.VITE_APP_FIN_URL}`;
const SALARY_PERIODS_BASE = `${BASE}/api/humanresource/salaryperiods`;
const PAYSLIPS_BASE = `${BASE}/api/humanresource/payslips`;

async function unwrapJson(responsePromise) {
  const body = await responsePromise;
  return body;
}

export function listSalaryPeriods({ text = "", pageIndex = 0, pageSize = 20 } = {}) {
  const params = new URLSearchParams({ pageIndex: String(pageIndex), pageSize: String(pageSize) });
  if (text.trim()) params.set("text", text.trim());
  return unwrapJson(apiFetch(`${SALARY_PERIODS_BASE}?${params.toString()}`));
}

export function getSalaryPeriod(id) {
  return unwrapJson(apiFetch(`${SALARY_PERIODS_BASE}/${id}`));
}

export function createSalaryPeriod(payload) {
  return unwrapJson(apiFetch(SALARY_PERIODS_BASE, { method: "POST", body: JSON.stringify(payload) }));
}

export function updateSalaryPeriod(id, payload) {
  return unwrapJson(apiFetch(`${SALARY_PERIODS_BASE}/${id}`, { method: "PUT", body: JSON.stringify({ ...payload, Id: id }) }));
}

// { salaryGroupIds, branchIds, departmentIds } — salaryGroupIds required,
// the other two optional narrowings (omit for "every branch/department").
export function processSalaryPeriod(id, { salaryGroupIds, branchIds, departmentIds }) {
  return unwrapJson(apiFetch(`${SALARY_PERIODS_BASE}/${id}/process`, {
    method: "POST",
    body: JSON.stringify({ SalaryGroupIds: salaryGroupIds, BranchIds: branchIds, DepartmentIds: departmentIds }),
  }));
}

export function closeSalaryPeriod(id) {
  return unwrapJson(apiFetch(`${SALARY_PERIODS_BASE}/${id}/close`, { method: "POST" }));
}

export function listPaySlips(salaryPeriodId, { text = "", pageIndex = 0, pageSize = 20 } = {}) {
  const params = new URLSearchParams({ salaryPeriodId, pageIndex: String(pageIndex), pageSize: String(pageSize) });
  if (text.trim()) params.set("text", text.trim());
  return unwrapJson(apiFetch(`${PAYSLIPS_BASE}?${params.toString()}`));
}

export function getPaySlipsSummary(salaryPeriodId) {
  return unwrapJson(apiFetch(`${PAYSLIPS_BASE}/summary?salaryPeriodId=${salaryPeriodId}`));
}

export function getPaySlip(id) {
  return unwrapJson(apiFetch(`${PAYSLIPS_BASE}/${id}`));
}

export function listPaySlipEntries(id) {
  return unwrapJson(apiFetch(`${PAYSLIPS_BASE}/${id}/entries`));
}

// The real posting/money-movement action — confirm with the user before
// calling this.
export function postPaySlip(id) {
  return unwrapJson(apiFetch(`${PAYSLIPS_BASE}/${id}/post`, { method: "POST" }));
}

// Posting Periods — same picker endpoint HumanResource/Holidays/lib/api.js
// already uses (HolidaysController exposes it, not a dedicated
// PostingPeriodController).
export function listPostingPeriods() {
  return unwrapJson(apiFetch(`${BASE}/api/humanresource/holidays/posting-periods`));
}

export async function listBranches() {
  const body = await apiFetch(`${import.meta.env.VITE_APP_MEMBERSHIP_URL}/api/administration/branches?pageIndex=0&pageSize=1000`);
  const page = body?.data ?? body?.Data ?? body;
  return page?.pageCollection || page?.PageCollection || (Array.isArray(page) ? page : []);
}

export async function listDepartments() {
  const body = await apiFetch(`${BASE}/api/humanresource/departments`);
  return Array.isArray(body) ? body : Array.isArray(body?.data) ? body.data : [];
}
