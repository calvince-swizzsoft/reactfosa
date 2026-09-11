import { apiJson } from "@/lib/api";

const base = `${import.meta.env.VITE_APP_FIN_URL}/api/accounts/financial-statements/cash-flow`;
export const unwrap = (value) => value?.data ?? value?.Data ?? value;
export const field = (value, name) => value?.[name] ?? value?.[name[0].toUpperCase() + name.slice(1)];
export async function cashFlowRequest(path = "", options) {
  return unwrap(await apiJson(`${base}${path}`, options));
}
export function cashFlowQuery(filters, extra = {}) {
  return new URLSearchParams(Object.entries({ ...filters, ...extra }).filter(([, value]) => value !== "" && value != null)).toString();
}
