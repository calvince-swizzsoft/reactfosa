import { apiFetch } from "@/lib/api";

const BASE = `${import.meta.env.VITE_APP_FIN_URL}/api/accounts/account-statuses`;

async function read(response) {
  const payload = await response.json().catch(() => ({}));
  if (!response.ok || payload?.success === false) throw new Error(payload?.message || `Request failed (${response.status})`);
  return payload?.data ?? payload?.Data ?? payload;
}

export async function searchCustomers({ text = "", customerFilter = 0, pageIndex = 0, pageSize = 20 } = {}) {
  const query = new URLSearchParams({ text, customerFilter, pageIndex, pageSize });
  return read(await apiFetch(`${BASE}/customers?${query}`));
}

export async function getCustomerStatus(customerId) {
  return read(await apiFetch(`${BASE}/customers/${customerId}`));
}

export async function getAccountHistory(accountId) {
  return read(await apiFetch(`${import.meta.env.VITE_APP_FIN_URL}/api/accounts/customer-accounts/${accountId}/history`));
}
