import { apiFetch } from "@/lib/api";

// Client for WebApplication1's AutomatedClearingController
// (Controllers/AutomatedClearingController.cs), base
// api/frontoffice/automatedclearing, docs/api/frontoffice-api-spec.md §15.
// Image-based (truncated) cheque clearing. /upload and /{id}/close read
// file paths/PGP keys entirely from server config — never sent by the
// client (confirmed against source). Close/Clear/MatchVoucher all take id
// only, no body.

const FIN_BASE = `${import.meta.env.VITE_APP_FIN_URL}`;
const AUTOMATED_CLEARING_BASE = `${FIN_BASE}/api/frontoffice/automatedclearing`;

async function unwrap(responsePromise) {
  const res = await responsePromise;
  const body = await res.json().catch(() => ({}));
  if (!res.ok || body.success === false) {
    throw new Error(body?.message || body?.Message || `Request failed (${res.status})`);
  }
  return body?.data ?? body;
}

export function listElectronicJournals({ status = 0, text = "", startDate, endDate, pageIndex = 0, pageSize = 20 } = {}) {
  const params = new URLSearchParams({ status: String(status), text, pageIndex: String(pageIndex), pageSize: String(pageSize) });
  if (startDate) params.set("startDate", startDate);
  if (endDate) params.set("endDate", endDate);
  return unwrap(apiFetch(`${AUTOMATED_CLEARING_BASE}?${params.toString()}`));
}

export function getElectronicJournal(id) {
  return unwrap(apiFetch(`${AUTOMATED_CLEARING_BASE}/${id}`));
}

export function listTruncatedCheques(id, { status, text = "", pageIndex = 0, pageSize = 20 } = {}) {
  const params = new URLSearchParams({ text, pageIndex: String(pageIndex), pageSize: String(pageSize) });
  if (status !== undefined && status !== null && status !== "") params.set("status", String(status));
  return unwrap(apiFetch(`${AUTOMATED_CLEARING_BASE}/${id}/truncatedcheques?${params.toString()}`));
}

// `apiFetch` already special-cases a FormData body by skipping the JSON
// Content-Type header (lib/api.js) — the browser sets the multipart
// boundary itself.
export function uploadElectronicJournal(file) {
  const formData = new FormData();
  formData.append("file", file);
  return unwrap(apiFetch(`${AUTOMATED_CLEARING_BASE}/upload`, { method: "POST", body: formData }));
}

export function closeElectronicJournal(id) {
  return unwrap(apiFetch(`${AUTOMATED_CLEARING_BASE}/${id}/close`, { method: "POST" }));
}

export function clearTruncatedCheque(id) {
  return unwrap(apiFetch(`${AUTOMATED_CLEARING_BASE}/truncatedcheques/${id}/clear`, { method: "POST" }));
}

export function matchTruncatedChequeVoucher(id) {
  return unwrap(apiFetch(`${AUTOMATED_CLEARING_BASE}/truncatedcheques/${id}/match-voucher`, { method: "POST" }));
}
