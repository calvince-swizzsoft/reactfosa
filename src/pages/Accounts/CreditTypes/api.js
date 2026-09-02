import { apiJson, normalizeList } from "@/lib/api";

const FIN_BASE = `${import.meta.env.VITE_APP_FIN_URL}`;
export const CREDIT_TYPES_BASE = `${FIN_BASE}/api/accounts/credittypes`;

const unwrap = (body) => body?.data ?? body;

export const listCreditTypes = ({ text = "", pageIndex = 0, pageSize = 20 } = {}) => {
  const params = new URLSearchParams({ text, pageIndex: String(pageIndex), pageSize: String(pageSize) });
  return apiJson(`${CREDIT_TYPES_BASE}/paged?${params}`).then(unwrap);
};

export const getCreditTypeConfiguration = (id) => apiJson(`${CREDIT_TYPES_BASE}/${id}/configuration`).then(unwrap);
export const saveCreditType = (id, payload) => apiJson(id ? `${CREDIT_TYPES_BASE}/${id}` : CREDIT_TYPES_BASE, {
  method: id ? "PUT" : "POST",
  body: JSON.stringify(payload),
}).then(unwrap);

export async function getCreditTypeOptions() {
  const urls = {
    commissions: `${FIN_BASE}/api/accounts/commissions`,
    directDebits: `${FIN_BASE}/api/accounts/directdebits`,
    loanProducts: `${FIN_BASE}/api/accounts/loanproducts`,
    investmentProducts: `${FIN_BASE}/api/accounts/investmentsproducts`,
    savingsProducts: `${FIN_BASE}/api/accounts/savingsproducts`,
  };
  const entries = await Promise.all(Object.entries(urls).map(async ([key, url]) => [key, normalizeList(await apiJson(url))]));
  return Object.fromEntries(entries);
}

export { FIN_BASE };
