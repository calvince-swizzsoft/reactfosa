import { apiFetch } from "@/lib/api";

// Client for WebApplication1's new SalaryCardsController
// (Areas/HumanResource/Controllers/SalaryCardsController.cs, added
// 2026-08-18 — NavigationMenu.cs Code 22022 existed server-side with no
// REST controller until now, same gap as Salary Heads/Groups). Bare DTO/
// PageCollectionInfo responses, no envelope. A plain BadRequest(string)
// serializes as { Message } (capital M). A 409 on create means the chosen
// employee already has a card — AddNewSalaryCard allows at most one per
// employee.
const BASE = `${import.meta.env.VITE_APP_FIN_URL}`;
const SALARY_CARDS_BASE = `${BASE}/api/humanresource/salarycards`;
const EMPLOYEES_BASE = `${BASE}/api/humanresource/employees`;

async function unwrapJson(responsePromise) {
  const res = await responsePromise;
  const body = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(body?.Message || body?.message || `Request failed (${res.status})`);
  }
  return body;
}

export function listSalaryCards({ text = "", pageIndex = 0, pageSize = 20 } = {}) {
  const params = new URLSearchParams({ pageIndex: String(pageIndex), pageSize: String(pageSize) });
  if (text.trim()) params.set("text", text.trim());
  return unwrapJson(apiFetch(`${SALARY_CARDS_BASE}?${params.toString()}`));
}

export function getSalaryCard(id) {
  return unwrapJson(apiFetch(`${SALARY_CARDS_BASE}/${id}`));
}

// 404 (not found) is expected/normal here — just means the employee has no
// card yet, not an error to surface.
export async function getSalaryCardByEmployee(employeeId) {
  const res = await apiFetch(`${SALARY_CARDS_BASE}/by-employee/${employeeId}`);
  if (res.status === 404) return null;
  const body = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(body?.Message || body?.message || `Request failed (${res.status})`);
  return body;
}

export function createSalaryCard(payload) {
  return unwrapJson(apiFetch(SALARY_CARDS_BASE, { method: "POST", body: JSON.stringify(payload) }));
}

export function updateSalaryCard(id, payload) {
  return unwrapJson(apiFetch(`${SALARY_CARDS_BASE}/${id}`, { method: "PUT", body: JSON.stringify({ ...payload, Id: id }) }));
}

export function listCardEntries(cardId) {
  return unwrapJson(apiFetch(`${SALARY_CARDS_BASE}/${cardId}/entries`));
}

export function resetCardEntries(cardId) {
  return unwrapJson(apiFetch(`${SALARY_CARDS_BASE}/${cardId}/reset-entries`, { method: "POST" }));
}

// Updates one entry's own card-level override value (ChargeType/
// ChargePercentage/ChargeFixedAmount) — the per-employee override the
// Salary Cards.md doc calls "Card value".
export function updateCardEntry(entryId, payload) {
  return unwrapJson(apiFetch(`${SALARY_CARDS_BASE}/entries/${entryId}`, { method: "PUT", body: JSON.stringify({ ...payload, Id: entryId }) }));
}

export async function listEmployees() {
  const res = await apiFetch(EMPLOYEES_BASE);
  const body = await res.json().catch(() => []);
  return Array.isArray(body) ? body : [];
}
