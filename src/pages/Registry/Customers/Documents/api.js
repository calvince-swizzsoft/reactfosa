import { apiFetch, normalizeList } from "@/lib/api";

// Client for WebApplication1's CustomerDocumentController
// (Areas/Registry/Controllers/CustomerDocumentController.cs). Browse/Create/
// Update/Download were added 2026-08-20 — the GET "" (picker, requires
// customerId+type) and GET {id:guid} actions already existed for the
// loan-case collateral picker, but the standalone Documents screen (see
// Areas/Registry/Documents.md) needed the flat, searchable, upload-capable
// side of the same controller. Every action returns the
// { success, message, data } envelope (unlike EmployeeDocumentsController's
// bare-DTO responses), so this uses the same unwrapJson shape as
// AlertPreferencesDrawer.jsx / Registry/Customers/DocumentsDrawer.jsx.
const BASE = `${import.meta.env.VITE_APP_FIN_URL}`;
const DOCUMENTS_BASE = `${BASE}/api/registry/customerdocuments`;
const CUSTOMERS_BASE = `${BASE}/api/registry/customer`;

async function unwrapJson(responsePromise) {
  const res = await responsePromise;
  const body = await res.json().catch(() => ({}));
  if (!res.ok || body?.success === false) {
    throw new Error(body?.message || body?.Message || `Request failed (${res.status})`);
  }
  return body?.data ?? body;
}

/** GET /browse — paged, text matches across the document/customer fields the backend indexes. */
export async function listDocuments({ text = "", pageIndex = 0, pageSize = 20 } = {}) {
  const params = new URLSearchParams({ pageIndex: String(pageIndex), pageSize: String(pageSize) });
  if (text.trim()) params.set("text", text.trim());
  const page = await unwrapJson(apiFetch(`${DOCUMENTS_BASE}/browse?${params.toString()}`));
  return {
    items: normalizeList(page?.PageCollection ?? page?.pageCollection ?? page),
    itemsCount: Number(page?.ItemsCount ?? page?.itemsCount ?? 0),
  };
}

/** GET api/registry/customer — the same paged search the Customers list page uses, reused for the create form's customer lookup. */
export async function searchCustomers({ text = "", customerFilter = 2, pageIndex = 0, pageSize = 20 } = {}) {
  const params = new URLSearchParams({ pageIndex: String(pageIndex), pageSize: String(pageSize), text, customerFilter: String(customerFilter) });
  const res = await apiFetch(`${CUSTOMERS_BASE}?${params.toString()}`);
  if (!res.ok) throw new Error("Could not search customers");
  const body = await res.json();
  const page = body?.data ?? body?.Data ?? body;
  return {
    items: normalizeList(page?.PageCollection ?? page?.pageCollection ?? page),
    totalPages: Math.max(1, Number(page?.TotalPages ?? page?.totalPages ?? 1)),
  };
}

/**
 * POST / (multipart/form-data) — file + CustomerId + Type (0=General,
 * 1=Collateral) + FileTitle + FileDescription.
 */
export function uploadDocument({ file, customerId, type, fileTitle, fileDescription }) {
  const formData = new FormData();
  formData.append("file", file);
  formData.append("CustomerId", customerId);
  formData.append("Type", String(type));
  formData.append("FileTitle", fileTitle || "");
  formData.append("FileDescription", fileDescription || "");
  return unwrapJson(apiFetch(DOCUMENTS_BASE, { method: "POST", body: formData }));
}

/** PUT /{id} — Title/Description/Type/Customer reassignment only, never the attached file. */
export function updateDocument(id, { customerId, type, fileTitle, fileDescription }) {
  return unwrapJson(apiFetch(`${DOCUMENTS_BASE}/${id}`, {
    method: "PUT",
    body: JSON.stringify({ Id: id, CustomerId: customerId, Type: type, FileTitle: fileTitle, FileDescription: fileDescription }),
  }));
}

/** GET /{id}/download — raw bytes, requires the Authorization header, so fetched as a blob and saved manually. */
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
