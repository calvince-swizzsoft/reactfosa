import { apiJson } from "@/lib/api";

const API_BASE = `${import.meta.env.VITE_APP_FIN_URL}/api/accounts/financial-statements`;

async function readResponse(responsePromise) {
  const payload = await responsePromise;
  return payload?.data ?? payload?.Data ?? payload;
}

export async function getFinancialStatement(statementType, endDate) {
  const query = new URLSearchParams({ endDate });
  return readResponse(apiJson(`${API_BASE}/${statementType}?${query}`));
}

export async function getBranchFinancialStatement(endDate, branchId) {
  const query = new URLSearchParams({ endDate, branchId });
  return readResponse(apiJson(`${API_BASE}/branch?${query}`));
}
