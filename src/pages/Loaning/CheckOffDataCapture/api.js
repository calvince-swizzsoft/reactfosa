import { apiJson as apiFetch, normalizeList } from "@/lib/api";

const FIN = import.meta.env.VITE_APP_FIN_URL;
const BASE = `${FIN}/api/backoffice/checkoff-data-capture`;

async function read(responsePromise) {
  const payload = await responsePromise;
  return payload?.data ?? payload?.Data ?? payload;
}

export const listPeriods = (params = {}) => read(apiFetch(`${BASE}/periods?${new URLSearchParams(params)}`));
export const getPeriod = (id) => read(apiFetch(`${BASE}/periods/${id}`));
export const listPostingPeriods = () => read(apiFetch(`${BASE}/posting-periods`));
export const createPeriod = (data) => read(apiFetch(`${BASE}/periods`, { method: "POST", body: JSON.stringify(data) }));
export const updatePeriod = (id, data) => read(apiFetch(`${BASE}/periods/${id}`, { method: "PUT", body: JSON.stringify(data) }));
export const closePeriod = (id, remarks) => read(apiFetch(`${BASE}/periods/${id}/close`, { method: "POST", body: JSON.stringify({ remarks }) }));
export const listEntries = (id, params = {}) => read(apiFetch(`${BASE}/periods/${id}/entries?${new URLSearchParams(params)}`));
export const addEntry = (id, data) => read(apiFetch(`${BASE}/periods/${id}/entries`, { method: "POST", body: JSON.stringify(data) }));
export const importEntries = (id, file) => { const form = new FormData(); form.append("file", file); return read(apiFetch(`${BASE}/periods/${id}/entries/import`, { method: "POST", body: form })); };
export const removeEntry = (periodId, entryId) => read(apiFetch(`${BASE}/periods/${periodId}/entries/${entryId}`, { method: "DELETE" }));
export async function customerAccounts(customerId) {
  const payload = await apiFetch(`${FIN}/api/accounts/customer-accounts/${customerId}/accounts`);
  return normalizeList(payload?.data ?? payload?.Data ?? payload);
}
