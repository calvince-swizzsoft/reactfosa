import { apiFetch } from "@/lib/api";

// Client functions for WebApplication1's BankController
// (Areas/Admin/Controllers/BankController.cs), base
// api/administration/banks. Read directly from the real controller source
// (docs/api/bank-api-spec.md's TypeScript-style interface pseudocode uses
// lowercase field names for readability, but that's not the real wire
// casing — confirmed by reading the actual C# classes, same pattern found
// in every other API area this session):
// - The Create/Update REQUEST body is bound via a real C# class
//   (`CreateBankRequest { BankDTO Bank; List<BankBranchDTO> Branches; }`),
//   so the wire shape is PascalCase `{ Bank, Branches }` — not the
//   lowercase `{ bank, branches }` the doc's pseudocode shows.
// - The RESPONSE `data` on Create/Update, by contrast, IS genuinely
//   lowercase `{ bank, branches }` — that's a literal C# anonymous object
//   (`new { bank = createdBank, branches }`) built directly in the
//   controller, not a DTO, so it keeps whatever casing the C# code
//   literally used.
// - `Bank.Code` is NOT server-assigned — the caller must send a unique
//   numeric code (bank-api-spec.md §4.5).
// - On update, omitting `Branches` (undefined) leaves existing branches
//   untouched; sending `Branches: []` clears them all; the full branch
//   list is replaced otherwise (BankController.Update always overwrites,
//   never merges).

const FIN_BASE = `${import.meta.env.VITE_APP_FIN_URL}`;
const BANKS_BASE = `${FIN_BASE}/api/administration/banks`;

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

export function listBanks({ text = "", pageIndex = 0, pageSize = 20 } = {}) {
  const params = new URLSearchParams({ text, pageIndex: String(pageIndex), pageSize: String(pageSize) });
  return unwrap(apiFetch(`${BANKS_BASE}?${params.toString()}`));
}

// GET /all — unpaged, fine for a dropdown (bank-api-spec.md §4.2).
export function listAllBanks() {
  return unwrap(apiFetch(`${BANKS_BASE}/all`));
}

export function getBank(id) {
  return unwrap(apiFetch(`${BANKS_BASE}/${id}`));
}

export function getBankBranches(id) {
  return unwrap(apiFetch(`${BANKS_BASE}/${id}/branches`));
}

export function createBank(bank, branches) {
  return unwrap(apiFetch(BANKS_BASE, {
    method: "POST",
    body: JSON.stringify({ Bank: bank, Branches: branches }),
  }));
}

export function updateBank(id, bank, branches) {
  return unwrap(apiFetch(`${BANKS_BASE}/${id}`, {
    method: "PUT",
    body: JSON.stringify({ Bank: { ...bank, Id: id }, Branches: branches }),
  }));
}
