import { apiJson, normalizeList } from "@/lib/api";

const FIN_BASE = `${import.meta.env.VITE_APP_FIN_URL}`;
const BASE = `${FIN_BASE}/api/accounts/directdebits`;
const unwrap = (body) => body?.data ?? body;

export const listDirectDebits = ({ text = "", pageIndex = 0, pageSize = 20 } = {}) => {
  const params = new URLSearchParams({ text, pageIndex: String(pageIndex), pageSize: String(pageSize) });
  return apiJson(`${BASE}/paged?${params}`).then(unwrap);
};

export const saveDirectDebit = (id, directDebit) => apiJson(id ? `${BASE}/${id}` : BASE, {
  method: id ? "PUT" : "POST",
  body: JSON.stringify(directDebit),
}).then(unwrap);

export async function getProductOptions() {
  const sources = [
    [1, `${FIN_BASE}/api/accounts/savingsproducts`],
    [2, `${FIN_BASE}/api/accounts/loanproducts`],
    [3, `${FIN_BASE}/api/accounts/investmentsproducts`],
  ];
  const entries = await Promise.all(sources.map(async ([code, url]) => [code, normalizeList(await apiJson(url))]));
  return Object.fromEntries(entries);
}
