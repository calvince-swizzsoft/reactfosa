import { apiFetch, normalizeList } from "@/lib/api";

// Client for WebApplication1's new HolidaysController
// (Areas/HumanResource/Controllers/HolidaysController.cs, added 2026-08-18
// — NavigationMenu.cs Code 22005 existed server-side with no REST
// controller behind it until now). Every action here returns the DTO/
// PageCollectionInfo bare, no { success, message, data } envelope — same
// as the sibling DepartmentsController/DesignationsController/
// EmployeeTypesController Ok(...) calls. A plain BadRequest(string)
// (validation failures) serializes as { Message } (capital M), not the
// usual lowercase envelope — same gotcha documented in
// FOSA/TellerTransactions/requestsApi.js for the same reason (Web API's
// default BadRequest(string) overload).
const BASE = `${import.meta.env.VITE_APP_FIN_URL}`;
const HOLIDAYS_BASE = `${BASE}/api/humanresource/holidays`;

async function unwrap(responsePromise) {
  const res = await responsePromise;
  const body = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(body?.Message || body?.message || `Request failed (${res.status})`);
  }
  return body;
}

/** GET / — paged, text matches Description (server treats blank text as no filter). */
export function listHolidays({ text = "", pageIndex = 0, pageSize = 20 } = {}) {
  const params = new URLSearchParams({ pageIndex: String(pageIndex), pageSize: String(pageSize) });
  if (text.trim()) params.set("text", text.trim());
  return unwrap(apiFetch(`${HOLIDAYS_BASE}?${params.toString()}`));
}

/**
 * GET /posting-periods — unpaged list, for the create/edit form's picker.
 * A holiday's DurationStartDate/EndDate must fall within its posting
 * period's own bounds (HolidayDTO.CheckDates, enforced server-side) — the
 * form uses each period's DurationStartDate/EndDate to constrain the date
 * inputs' min/max once one is selected.
 */
export function listPostingPeriods() {
  return unwrap(apiFetch(`${HOLIDAYS_BASE}/posting-periods`)).then((body) => normalizeList(body));
}

export function createHoliday(holiday) {
  return unwrap(apiFetch(HOLIDAYS_BASE, { method: "POST", body: JSON.stringify(holiday) }));
}

export function updateHoliday(id, holiday) {
  return unwrap(apiFetch(`${HOLIDAYS_BASE}/${id}`, { method: "PUT", body: JSON.stringify(holiday) }));
}

export function deleteHoliday(id) {
  return unwrap(apiFetch(`${HOLIDAYS_BASE}/${id}`, { method: "DELETE" }));
}
