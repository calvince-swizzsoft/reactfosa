import { apiJson, normalizeList } from "@/lib/api";

const FIN_BASE = `${import.meta.env.VITE_APP_FIN_URL}`;
export const DEBIT_TYPES_BASE = `${FIN_BASE}/api/accounts/debittypes`;

const unwrap = (body) => body?.data ?? body;

export const listDebitTypes = ({ text = "", pageIndex = 0, pageSize = 20 } = {}) => {
  const params = new URLSearchParams({ text, pageIndex: String(pageIndex), pageSize: String(pageSize) });
  return apiJson(`${DEBIT_TYPES_BASE}/paged?${params}`).then(unwrap);
};

export const getDebitTypeConfiguration = (id) => apiJson(`${DEBIT_TYPES_BASE}/${id}/configuration`).then(unwrap);
export const saveDebitType = (id, payload) => apiJson(id ? `${DEBIT_TYPES_BASE}/${id}` : DEBIT_TYPES_BASE, {
  method: id ? "PUT" : "POST",
  body: JSON.stringify(payload),
}).then(unwrap);

export async function getDebitTypeOptions() {
  const urls = {
    commissions: `${FIN_BASE}/api/accounts/commissions`,
  };
  const entries = await Promise.all(Object.entries(urls).map(async ([key, url]) => [key, normalizeList(await apiJson(url))]));
  return Object.fromEntries(entries);
}

export { FIN_BASE };
