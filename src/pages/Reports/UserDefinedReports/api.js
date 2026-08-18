import { apiFetch } from "@/lib/api";

const BASE = `${import.meta.env.VITE_APP_REPORT_URL}/api/reports/user-defined`;

async function read(response) {
  response = await response;
  const payload = await response.json().catch(() => ({}));
  if (!response.ok || payload?.success === false) throw new Error(payload?.message || `Request failed (${response.status})`);
  return payload?.data ?? payload?.Data ?? payload;
}

export const listReports = (params) => read(apiFetch(`${BASE}?${new URLSearchParams(params)}`));
export const listCategories = () => read(apiFetch(`${BASE}/categories`));
export const getViewerUrl = (id) => read(apiFetch(`${BASE}/${id}/view`));
export const createCategory = (name) => read(apiFetch(`${BASE}/categories`, { method: "POST", body: JSON.stringify({ name }) }));
export const uploadReport = (formData) => read(apiFetch(BASE, { method: "POST", body: formData }));
export const updateReport = (id, body) => read(apiFetch(`${BASE}/${id}`, { method: "PUT", body: JSON.stringify(body) }));
export const deleteReport = (id) => read(apiFetch(`${BASE}/${id}`, { method: "DELETE" }));
export async function downloadRdl(id) {
  const response = await apiFetch(`${BASE}/${id}/rdl`);
  if (!response.ok) throw new Error(`RDL download failed (${response.status})`);
  const disposition = response.headers.get("content-disposition") || "";
  const fileName = disposition.match(/filename="?([^";]+)"?/i)?.[1] || `report-${id}.rdl`;
  return { blob: await response.blob(), fileName };
}
