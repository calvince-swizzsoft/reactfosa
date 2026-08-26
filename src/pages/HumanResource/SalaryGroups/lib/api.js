import { apiJson as apiFetch } from "@/lib/api";

// Client for WebApplication1's new SalaryGroupsController
// (Areas/HumanResource/Controllers/SalaryGroupsController.cs, added
// 2026-08-18 — NavigationMenu.cs Code 22021 existed server-side with no
// REST controller until now, same gap as Salary Heads). Bare DTO/
// PageCollectionInfo responses, no envelope. A plain BadRequest(string)
// serializes as { Message } (capital M).
//
// updateGroupEntries is a full-replace, and the backend's own diff matches
// entries purely by Id: an entry whose Id already exists is left
// completely untouched even if its other fields changed, Id === "" is
// always a fresh insert, and a persisted Id missing from the array is
// deleted. There is no in-place edit of an existing entry's value — to
// change one, drop its Id (so it lands in the delete side) and resubmit
// it with Id blank (so it's re-inserted with the new values). The
// SalaryGroups screen is built around that: every entry the user edits
// locally has its Id cleared before submit.
const BASE = `${import.meta.env.VITE_APP_FIN_URL}`;
const SALARY_GROUPS_BASE = `${BASE}/api/humanresource/salarygroups`;

async function unwrapJson(responsePromise) {
  const body = await responsePromise;
  return body;
}

export function listSalaryGroups({ text = "", pageIndex = 0, pageSize = 20 } = {}) {
  const params = new URLSearchParams({ pageIndex: String(pageIndex), pageSize: String(pageSize) });
  if (text.trim()) params.set("text", text.trim());
  return unwrapJson(apiFetch(`${SALARY_GROUPS_BASE}?${params.toString()}`));
}

export function getSalaryGroup(id) {
  return unwrapJson(apiFetch(`${SALARY_GROUPS_BASE}/${id}`));
}

export function createSalaryGroup(description) {
  return unwrapJson(apiFetch(SALARY_GROUPS_BASE, { method: "POST", body: JSON.stringify({ Description: description }) }));
}

export function updateSalaryGroup(id, description) {
  return unwrapJson(apiFetch(`${SALARY_GROUPS_BASE}/${id}`, { method: "PUT", body: JSON.stringify({ Id: id, Description: description }) }));
}

export function listGroupEntries(groupId) {
  return unwrapJson(apiFetch(`${SALARY_GROUPS_BASE}/${groupId}/entries`));
}

export function updateGroupEntries(groupId, entries) {
  return unwrapJson(apiFetch(`${SALARY_GROUPS_BASE}/${groupId}/entries`, { method: "PUT", body: JSON.stringify(entries) }));
}
