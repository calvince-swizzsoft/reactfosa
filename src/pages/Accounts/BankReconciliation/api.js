import { apiJson } from "@/lib/api";

const BASE = `${import.meta.env.VITE_APP_FIN_URL}/api/accounts/bank-reconciliations`;
const unwrap = async (promise) => (await promise)?.data;

export const listPeriods = ({ text = "", pageIndex = 0, pageSize = 20 } = {}) => {
  const query = new URLSearchParams({ text, pageIndex: String(pageIndex), pageSize: String(pageSize) });
  return unwrap(apiJson(`${BASE}/periods?${query}`));
};
export const listAllPeriods = () => unwrap(apiJson(`${BASE}/periods/all`));
export const createPeriod = (body) => unwrap(apiJson(`${BASE}/periods`, { method: "POST", body: JSON.stringify(body) }));
export const listEntries = (id, { text = "", pageIndex = 0, pageSize = 100 } = {}) => {
  const query = new URLSearchParams({ text, pageIndex: String(pageIndex), pageSize: String(pageSize) });
  return unwrap(apiJson(`${BASE}/periods/${id}/entries?${query}`));
};
export const addEntry = (id, body) => unwrap(apiJson(`${BASE}/periods/${id}/entries`, { method: "POST", body: JSON.stringify(body) }));
export const removeEntry = (periodId, entryId) => apiJson(`${BASE}/periods/${periodId}/entries/${entryId}`, { method: "DELETE" });
export const closePeriod = (id, authOption, authorizationRemarks) => unwrap(apiJson(`${BASE}/periods/${id}/close`, {
  method: "POST", body: JSON.stringify({ AuthOption: authOption, AuthorizationRemarks: authorizationRemarks }),
}));
