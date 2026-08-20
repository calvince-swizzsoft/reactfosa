import { apiFetch, normalizeList } from "@/lib/api";

// Client for WebApplication1's PostingPeriodController
// (Areas/Accounts/Controllers/PostingPeriodController.cs), wrapping the
// pre-existing IPostingPeriodAppService.
const BASE = `${import.meta.env.VITE_APP_FIN_URL}`;
export const POSTING_PERIODS_BASE = `${BASE}/api/accounts/postingperiods`;

async function unwrapJson(responsePromise) {
  const res = await responsePromise;
  const body = await res.json().catch(() => ({}));
  if (!res.ok || body?.success === false) {
    throw new Error(body?.message || body?.Message || `Request failed (${res.status})`);
  }
  return body?.data ?? body;
}

/** GET /paged — the list-page listing, searchable. */
export async function listPostingPeriods({ text = "", pageIndex = 0, pageSize = 20 } = {}) {
  const params = new URLSearchParams({ pageIndex: String(pageIndex), pageSize: String(pageSize) });
  if (text.trim()) params.set("text", text.trim());
  const page = await unwrapJson(apiFetch(`${POSTING_PERIODS_BASE}/paged?${params.toString()}`));
  return {
    items: normalizeList(page?.PageCollection ?? page?.pageCollection ?? page),
    itemsCount: Number(page?.ItemsCount ?? page?.itemsCount ?? 0),
  };
}

export function createPostingPeriod({ description, startDate, endDate }) {
  return unwrapJson(apiFetch(POSTING_PERIODS_BASE, {
    method: "POST",
    body: JSON.stringify({ Description: description, DurationStartDate: startDate, DurationEndDate: endDate }),
  }));
}

export function updatePostingPeriod(id, { description, startDate, endDate, isLocked }) {
  return unwrapJson(apiFetch(`${POSTING_PERIODS_BASE}/${id}`, {
    method: "PUT",
    body: JSON.stringify({ Id: id, Description: description, DurationStartDate: startDate, DurationEndDate: endDate, IsLocked: isLocked }),
  }));
}

/**
 * PUT /{id}/close — a real, irreversible financial operation (posts
 * fiscal-period-closing journals across every branch), not a status flag
 * flip. Used by the separate Posting Period Closing screen
 * (Accounts > Operations > Transactions Journal).
 */
export function closePostingPeriod(id) {
  return unwrapJson(apiFetch(`${POSTING_PERIODS_BASE}/${id}/close`, { method: "PUT" }));
}
