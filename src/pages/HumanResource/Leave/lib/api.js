import { apiJson as apiFetch } from "@/lib/api";

// Client for WebApplication1's new LeaveApplicationsController/
// LeaveTypesController (Areas/HumanResource/Controllers/, added
// 2026-08-18 — NavigationMenu.cs Codes 22016/22017/22018 (Application/
// Approval/Recall) existed server-side with no REST controller behind
// them until now, same gap as Holidays/Documents. All three nav leaves
// share this one controller/data source — Approval is the Pending queue,
// Recall is the Approved queue, Application is everything. Every action
// returns the DTO/PageCollectionInfo bare, no { success, message, data }
// envelope. A plain BadRequest(string) (validation failures, business
// rules like "start date must not be in the past") serializes as
// { Message } (capital M) — same gotcha documented in
// FOSA/TellerTransactions/requestsApi.js.
const BASE = `${import.meta.env.VITE_APP_FIN_URL}`;
const LEAVE_APPLICATIONS_BASE = `${BASE}/api/humanresource/leaveapplications`;
const LEAVE_TYPES_BASE = `${BASE}/api/humanresource/leavetypes`;
const EMPLOYEES_BASE = `${BASE}/api/humanresource/employees`;

async function unwrapJson(responsePromise) {
  const body = await responsePromise;
  return body;
}

/** GET / — status omitted browses every status; status supplied scopes to it (Approval passes Pending, Recall passes Approved). */
export function listLeaveApplications({ text = "", status, pageIndex = 0, pageSize = 20 } = {}) {
  const params = new URLSearchParams({ pageIndex: String(pageIndex), pageSize: String(pageSize) });
  if (text.trim()) params.set("text", text.trim());
  if (status !== undefined && status !== null) params.set("status", String(status));
  return unwrapJson(apiFetch(`${LEAVE_APPLICATIONS_BASE}?${params.toString()}`));
}

export function getLeaveApplication(id) {
  return unwrapJson(apiFetch(`${LEAVE_APPLICATIONS_BASE}/${id}`));
}

/** GET /balance — live remaining-balance preview for the selected employee + leave type. */
export function getLeaveBalance(employeeId, leaveTypeId) {
  const params = new URLSearchParams({ employeeId, leaveTypeId });
  return unwrapJson(apiFetch(`${LEAVE_APPLICATIONS_BASE}/balance?${params.toString()}`));
}

export function createLeaveApplication(payload) {
  return unwrapJson(apiFetch(LEAVE_APPLICATIONS_BASE, { method: "POST", body: JSON.stringify(payload) }));
}

/** PUT /{id} — only while the application is still Pending (server-enforced). */
export function updateLeaveApplication(id, payload) {
  return unwrapJson(apiFetch(`${LEAVE_APPLICATIONS_BASE}/${id}`, { method: "PUT", body: JSON.stringify({ ...payload, Id: id }) }));
}

/** POST /{id}/authorize — decision: "approve" | "reject". Only reachable from Pending (server-enforced). */
export function authorizeLeaveApplication(id, decision, remarks) {
  return unwrapJson(apiFetch(`${LEAVE_APPLICATIONS_BASE}/${id}/authorize`, {
    method: "POST",
    body: JSON.stringify({ Decision: decision, Remarks: remarks }),
  }));
}

/** POST /{id}/recall — only reachable from Approved (server-enforced). */
export function recallLeaveApplication(id, remarks) {
  return unwrapJson(apiFetch(`${LEAVE_APPLICATIONS_BASE}/${id}/recall`, {
    method: "POST",
    body: JSON.stringify({ Remarks: remarks }),
  }));
}

/** GET api/humanresource/leavetypes — the leave-type picker/management source. No delete: ILeaveTypeAppService has none. */
export function listLeaveTypes({ text = "", pageIndex = 0, pageSize = 200 } = {}) {
  const params = new URLSearchParams({ pageIndex: String(pageIndex), pageSize: String(pageSize) });
  if (text.trim()) params.set("text", text.trim());
  return unwrapJson(apiFetch(`${LEAVE_TYPES_BASE}?${params.toString()}`));
}

export function createLeaveType(payload) {
  return unwrapJson(apiFetch(LEAVE_TYPES_BASE, { method: "POST", body: JSON.stringify(payload) }));
}

export function updateLeaveType(id, payload) {
  return unwrapJson(apiFetch(`${LEAVE_TYPES_BASE}/${id}`, { method: "PUT", body: JSON.stringify({ ...payload, Id: id }) }));
}

/** GET api/humanresource/employees — unpaged, for the employee picker (same endpoint HumanResource/Documents/api.js already uses). */
export async function listEmployees() {
  const body = await apiFetch(EMPLOYEES_BASE);
  return Array.isArray(body) ? body : [];
}
