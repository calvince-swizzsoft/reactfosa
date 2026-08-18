import { apiFetch } from "@/lib/api";

const API_BASE = `${import.meta.env.VITE_APP_FIN_URL}/api/accounts/financial-statements`;

async function readResponse(response) {
  const payload = await response.json().catch(() => ({}));
  if (!response.ok || payload?.success === false) {
    throw new Error(payload?.message || `Request failed (${response.status})`);
  }
  return payload?.data ?? payload?.Data ?? payload;
}

export async function getFinancialStatement(statementType, endDate) {
  const query = new URLSearchParams({ endDate });
  return readResponse(await apiFetch(`${API_BASE}/${statementType}?${query}`));
}

export async function getBranchFinancialStatement(endDate, branchId) {
  const query = new URLSearchParams({ endDate, branchId });
  return readResponse(await apiFetch(`${API_BASE}/branch?${query}`));
}
