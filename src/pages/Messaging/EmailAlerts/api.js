import { apiFetch } from "@/lib/api";

const FIN_BASE = `${import.meta.env.VITE_APP_FIN_URL}`;
const BASE = `${FIN_BASE}/api/messaging/emailalerts`;

export const DLRStatus = {
  UnKnown: 1,
  Failed: 2,
  Pending: 4,
  Delivered: 8,
  NotApplicable: 16,
  Submitted: 32,
};

export const QueuePriority = {
  Lowest: 0,
  VeryLow: 1,
  Low: 2,
  Normal: 3,
  AboveNormal: 4,
  High: 5,
  VeryHigh: 6,
  Highest: 7,
};

async function unwrap(responsePromise) {
  const response = await responsePromise;
  const body = await response.json().catch(() => ({}));
  if (!response.ok || body.success === false) {
    const error = new Error(body.message || "Request failed");
    error.status = response.status;
    throw error;
  }
  return body.data;
}

function queryString(params) {
  const query = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== "") query.set(key, String(value));
  });
  return query.toString();
}

export function listEmailAlerts({ dlrStatus = DLRStatus.Delivered, text = "", startDate, endDate, pageIndex = 0, pageSize = 20 } = {}) {
  return unwrap(apiFetch(`${BASE}?${queryString({
    dlrStatus,
    text,
    startDate: startDate ? `${startDate}T00:00:00` : undefined,
    endDate: endDate ? `${endDate}T23:59:59.999` : undefined,
    pageIndex,
    pageSize,
  })}`));
}

export function getEmailAlert(id) {
  return unwrap(apiFetch(`${BASE}/${id}`));
}

export function createEmailAlert(emailAlert) {
  return unwrap(apiFetch(BASE, { method: "POST", body: JSON.stringify(emailAlert) }));
}
