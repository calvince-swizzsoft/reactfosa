import { apiFetch } from "@/lib/api";

// Client functions for WebApplication1's BankLinkageController
// (Areas/Accounts/Controllers/BankLinkageController.cs), base
// api/accounts/banklinkages. Read directly from the real controller
// source — unlike BankController, Create/Update here bind a raw
// BankLinkageDTO directly (no wrapper request class), so the request body
// IS just the flat DTO (PascalCase, matching every other DTO in this app).
// PUT checks `bankLinkageDTO.Id != id` — Id must match the URL segment.

const FIN_BASE = `${import.meta.env.VITE_APP_FIN_URL}`;
const BANK_LINKAGES_BASE = `${FIN_BASE}/api/accounts/banklinkages`;

async function unwrap(responsePromise) {
  const res = await responsePromise;
  const body = await res.json().catch(() => ({}));
  if (!res.ok || body.success === false) {
    const err = new Error(body?.message || `Request failed (${res.status})`);
    err.status = res.status;
    throw err;
  }
  return body?.data ?? body;
}

export function listBankLinkages({ text = "", pageIndex = 0, pageSize = 20 } = {}) {
  const params = new URLSearchParams({ text, pageIndex: String(pageIndex), pageSize: String(pageSize) });
  return unwrap(apiFetch(`${BANK_LINKAGES_BASE}?${params.toString()}`));
}

export function createBankLinkage(bankLinkageDTO) {
  return unwrap(apiFetch(BANK_LINKAGES_BASE, { method: "POST", body: JSON.stringify(bankLinkageDTO) }));
}

export function updateBankLinkage(id, bankLinkageDTO) {
  return unwrap(apiFetch(`${BANK_LINKAGES_BASE}/${id}`, {
    method: "PUT",
    body: JSON.stringify({ ...bankLinkageDTO, Id: id }),
  }));
}
