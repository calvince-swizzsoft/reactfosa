import { apiJson } from "@/lib/api";
const BASE = `${import.meta.env.VITE_APP_FIN_URL}/api/accounts/budgets`;
const unwrap = async (promise) => (await promise)?.data;
export const listBudgets = ({ text = "", pageIndex = 0, pageSize = 100 } = {}) => unwrap(apiJson(`${BASE}?${new URLSearchParams({ text, pageIndex, pageSize })}`));
export const listAllBudgets = () => unwrap(apiJson(`${BASE}/all`));
export const getBudgetEntries = (id, includeBalances = true) => unwrap(apiJson(`${BASE}/${id}/entries?includeBalances=${includeBalances}`));
export const createBudget = (budget, entries) => unwrap(apiJson(BASE, { method: "POST", body: JSON.stringify({ Budget: budget, Entries: entries }) }));
export const updateBudget = (id, budget, entries) => unwrap(apiJson(`${BASE}/${id}`, { method: "PUT", body: JSON.stringify({ Budget: budget, Entries: entries }) }));
