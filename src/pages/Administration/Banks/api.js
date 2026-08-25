import { apiJson } from "@/lib/api";

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

const unwrap = (body) => body?.data ?? body?.Data ?? body;

export function listBanks({ text = "", pageIndex = 0, pageSize = 20 } = {}) {
  const params = new URLSearchParams({ text, pageIndex: String(pageIndex), pageSize: String(pageSize) });
  return apiJson(`${BANKS_BASE}?${params.toString()}`, {}, { fallbackMessage: "Failed to load banks." }).then(unwrap);
}

// GET /all — unpaged, fine for a dropdown (bank-api-spec.md §4.2).
export function listAllBanks() {
  return apiJson(`${BANKS_BASE}/all`, {}, { fallbackMessage: "Failed to load banks." }).then(unwrap);
}

export function getBank(id) {
  return apiJson(`${BANKS_BASE}/${id}`, {}, { fallbackMessage: "Failed to load the bank." }).then(unwrap);
}

export function getBankBranches(id) {
  return apiJson(`${BANKS_BASE}/${id}/branches`, {}, { fallbackMessage: "Failed to load bank branches." }).then(unwrap);
}

export function createBank(bank, branches) {
  return apiJson(BANKS_BASE, {
    method: "POST",
    body: JSON.stringify({ Bank: bank, Branches: branches }),
  }, { fallbackMessage: "Failed to create the bank." }).then(unwrap);
}

export function updateBank(id, bank, branches) {
  return apiJson(`${BANKS_BASE}/${id}`, {
    method: "PUT",
    body: JSON.stringify({ Bank: { ...bank, Id: id }, Branches: branches }),
  }, { fallbackMessage: "Failed to update the bank." }).then(unwrap);
}
