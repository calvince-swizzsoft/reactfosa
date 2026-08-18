import { apiFetch } from "@/lib/api";

// Client for WebApplication1's new EmployeeDocumentsController
// (Areas/HumanResource/Controllers/EmployeeDocumentsController.cs, added
// 2026-08-18 — NavigationMenu.cs Code 22009 existed server-side with no
// REST controller behind it until now, same as Holidays/Code 22005). No
// DELETE here — IEmployeeDocumentAppService has no RemoveEmployeeDocument
// at all. Every action returns the DTO/PageCollectionInfo bare, no
// { success, message, data } envelope, same as the sibling
// Departments/Designations/EmployeeTypes/Holidays controllers' Ok(...)
// calls. A plain BadRequest(string) (validation failures, missing file)
// serializes as { Message } (capital M) — same gotcha documented in
// FOSA/TellerTransactions/requestsApi.js.
const BASE = `${import.meta.env.VITE_APP_FIN_URL}`;
const DOCUMENTS_BASE = `${BASE}/api/humanresource/employeedocuments`;
const EMPLOYEES_BASE = `${BASE}/api/humanresource/employees`;

async function unwrapJson(responsePromise) {
  const res = await responsePromise;
  const body = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(body?.Message || body?.message || `Request failed (${res.status})`);
  }
  return body;
}

/** GET / — paged, text matches across the document/employee fields the backend indexes. */
export function listDocuments({ text = "", pageIndex = 0, pageSize = 20 } = {}) {
  const params = new URLSearchParams({ pageIndex: String(pageIndex), pageSize: String(pageSize) });
  if (text.trim()) params.set("text", text.trim());
  return unwrapJson(apiFetch(`${DOCUMENTS_BASE}?${params.toString()}`));
}

/** GET api/humanresource/employees — unpaged, for the upload form's employee picker. */
export async function listEmployees() {
  const res = await apiFetch(EMPLOYEES_BASE);
  const body = await res.json().catch(() => []);
  return Array.isArray(body) ? body : [];
}

/**
 * POST / (multipart/form-data) — file + EmployeeId + FileTitle +
 * FileDescription. Response's FileBuffer is stripped server-side; this is
 * metadata-only, use downloadDocument() for the actual bytes.
 */
export function uploadDocument({ file, employeeId, fileTitle, fileDescription }) {
  const formData = new FormData();
  formData.append("file", file);
  formData.append("EmployeeId", employeeId);
  formData.append("FileTitle", fileTitle || "");
  formData.append("FileDescription", fileDescription || "");
  return unwrapJson(apiFetch(DOCUMENTS_BASE, { method: "POST", body: formData }));
}

/** PUT /{id} — Title/Description/employee reassignment only, never the attached file (see controller remarks). */
export function updateDocument(id, { employeeId, fileTitle, fileDescription }) {
  return unwrapJson(apiFetch(`${DOCUMENTS_BASE}/${id}`, {
    method: "PUT",
    body: JSON.stringify({ Id: id, EmployeeId: employeeId, FileTitle: fileTitle, FileDescription: fileDescription }),
  }));
}

/**
 * GET /{id}/download — raw bytes, not the envelope. Requires the
 * Authorization header (the endpoint is [Authorize]), so this can't be a
 * plain <a href> — fetch as a blob via apiFetch and trigger the browser
 * download manually, same pattern as
 * Accounts/CustomerAccountStatement/api.js's printStatement/downloadPdfBlob.
 */
export async function downloadDocument(id, suggestedFileName) {
  const res = await apiFetch(`${DOCUMENTS_BASE}/${id}/download`);
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(text || "Failed to download document");
  }
  const blob = await res.blob();
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = suggestedFileName || "document";
  document.body.appendChild(a);
  a.click();
  a.remove();
  window.URL.revokeObjectURL(url);
}
