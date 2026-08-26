import { apiJson as apiFetch, normalizeList } from "@/lib/api";

// Client for WebApplication1's DirectorController
// (Areas/Registry/Controllers/DirectorController.cs), wrapping the
// pre-existing IDirectorAppService. Same { success, message, data } envelope
// as ZoneController/EmployerController/DelegateController.
const BASE = `${import.meta.env.VITE_APP_FIN_URL}`;
const DIRECTORS_BASE = `${BASE}/api/registry/director`;
export const EMPLOYERS_BASE = `${BASE}/api/registry/employer`;

async function unwrapJson(responsePromise) {
  const body = await responsePromise;
  return body?.data ?? body;
}

/** GET / (paged) — the list-page listing, searchable. */
export async function listDirectors({ text = "", pageIndex = 0, pageSize = 20 } = {}) {
  const params = new URLSearchParams({ pageIndex: String(pageIndex), pageSize: String(pageSize) });
  if (text.trim()) params.set("text", text.trim());
  const page = await unwrapJson(apiFetch(`${DIRECTORS_BASE}?${params.toString()}`));
  return {
    items: normalizeList(page?.PageCollection ?? page?.pageCollection ?? page),
    itemsCount: Number(page?.ItemsCount ?? page?.itemsCount ?? 0),
  };
}

/** GET /{employerId}/divisions — the second step of the division lookup dialog. */
export async function listDivisionsForEmployer(employerId) {
  const data = await unwrapJson(apiFetch(`${EMPLOYERS_BASE}/${employerId}/divisions`));
  return normalizeList(data);
}

export function createDirector({ divisionId, customerId, remarks }) {
  return unwrapJson(apiFetch(DIRECTORS_BASE, {
    method: "POST",
    body: JSON.stringify({ DivisionId: divisionId, CustomerId: customerId, Remarks: remarks }),
  }));
}

export function updateDirector(id, { divisionId, customerId, remarks, isLocked }) {
  return unwrapJson(apiFetch(`${DIRECTORS_BASE}/${id}`, {
    method: "PUT",
    body: JSON.stringify({ Id: id, DivisionId: divisionId, CustomerId: customerId, Remarks: remarks, IsLocked: isLocked }),
  }));
}
