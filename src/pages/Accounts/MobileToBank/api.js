import { apiJson } from "@/lib/api";
const BASE = `${import.meta.env.VITE_APP_FIN_URL}/api/accounts/mobile-to-bank`;
const unwrap = (body) => body?.data ?? body?.Data ?? body;
export async function listPayments(criteria, signal) {
  const params = new URLSearchParams({ ...criteria, pageSize: 20 });
  if (criteria.status === "") params.delete("status");
  return unwrap(await apiJson(`${BASE}?${params}`, { signal }));
}
export async function getPayment(id, signal) {
  return unwrap(await apiJson(`${BASE}/${id}`, { signal }));
}
export function reconcilePayment(id, customerAccountId) {
  return apiJson(`${BASE}/${id}/reconcile`, { method: "PUT", body: JSON.stringify({ CustomerAccountId: customerAccountId }) });
}
export const canReconcile = (item) => Number(item?.Status) === 0 && Number(item?.RecordStatus) === 0;
export const matchingStatus = (item) => ({ 0: "Unmatched", 1: "Auto matched", 2: "Reconciliation matched" })[item.Status] || "Unknown";
export const verificationStatus = (item) => Number(item.Status) === 1 ? "Automatic matching" : ({ 0: "Pending verification", 2: "Verified", 3: "Rejected" })[item.RecordStatus] || "Unknown";