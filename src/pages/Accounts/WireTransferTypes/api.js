import { apiJson, normalizeList } from "@/lib/api";

export const FIN_BASE = `${import.meta.env.VITE_APP_FIN_URL}`;
const BASE = `${FIN_BASE}/api/accounts/wiretransfertypes`;
const unwrap = (body) => body?.data ?? body;

export function listWireTransferTypes({ text = "", pageIndex = 0, pageSize = 20 }) {
  const query = new URLSearchParams({ text, pageIndex: String(pageIndex), pageSize: String(pageSize) });
  return apiJson(`${BASE}?${query}`).then(unwrap);
}

export function getWireTransferTypeCommissions(id) {
  return apiJson(`${BASE}/${id}/commissions`).then(unwrap);
}

export function saveWireTransferType(id, payload) {
  return apiJson(id ? `${BASE}/${id}` : BASE, { method: id ? "PUT" : "POST", body: JSON.stringify(payload) }).then(unwrap);
}

export async function getWireTransferTypeOptions() {
  return { commissions: normalizeList(await apiJson(`${FIN_BASE}/api/accounts/commissions`)) };
}
