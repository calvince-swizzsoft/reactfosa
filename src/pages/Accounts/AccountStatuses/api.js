import { apiJson } from "@/lib/api";

const BASE = `${import.meta.env.VITE_APP_FIN_URL}/api/accounts/account-statuses`;

async function read(responsePromise) {
  const payload = await responsePromise;
  return payload?.data ?? payload?.Data ?? payload;
}

export async function searchCustomers({ text = "", customerFilter = 0, pageIndex = 0, pageSize = 20 } = {}) {
  const query = new URLSearchParams({ text, customerFilter, pageIndex, pageSize });
  return read(apiJson(`${BASE}/customers?${query}`));
}

export async function getCustomerStatus(customerId) {
  return read(apiJson(`${BASE}/customers/${customerId}`));
}

export async function getAccountHistory(accountId) {
  return read(apiJson(`${import.meta.env.VITE_APP_FIN_URL}/api/accounts/customer-accounts/${accountId}/history`));
}
