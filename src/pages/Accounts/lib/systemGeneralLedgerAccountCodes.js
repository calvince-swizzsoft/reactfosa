// SystemGeneralLedgerAccountCode — transcribed directly from
// Infrastructure.Crosscutting.Framework/Utils/Enumerations.cs, not
// guessed. 32 members total (an earlier, unverified comment elsewhere in
// this app guessed "40+" — the real count is 32).
//
// Values kept as `0xBEBA + N` expressions rather than pre-computed
// decimals, mirroring the C# source line-for-line, so a future diff
// against Enumerations.cs stays a direct visual comparison instead of
// requiring re-doing hex arithmetic by hand.
//
// Why this file exists: GET /systemgeneralledgermappings only returns
// codes that already have a persisted SystemGeneralLedgerAccountMapping
// row (confirmed against ChartOfAccountAppService.FindSystemGeneralLedgerAccountMappings
// — it queries the mapping repository directly, it does not enumerate this
// C# enum at all). A code nobody has ever mapped yet simply has no row and
// never appears in that list, even though the PUT endpoint
// (MapSystemGeneralLedgerAccountCodeToChartOfAccount) is a real upsert
// that creates a new row on demand. Mappings.jsx merges this full list
// against whatever rows the GET returns so every mappable code is always
// visible and editable, not just the ones someone happened to map before.
export const SYSTEM_GENERAL_LEDGER_ACCOUNT_CODES = [
  { value: 0xBEBA, label: "Payables Control" },
  { value: 0xBEBA + 1, label: "External Cheques Control" },
  { value: 0xBEBA + 3, label: "In-House Cheques Control" },
  { value: 0xBEBA + 4, label: "Electronic Funds Transfer Control" },
  { value: 0xBEBA + 5, label: "Profit & Loss Appropriation" },
  { value: 0xBEBA + 6, label: "Fixed Deposit" },
  { value: 0xBEBA + 7, label: "Fixed Deposit Interest" },
  { value: 0xBEBA + 9, label: "Sacco-Link Settlement" },
  { value: 0xBEBA + 18, label: "Sacco-Link Settlement (POS)" },
  { value: 0xBEBA + 10, label: "Deceased Control" },
  { value: 0xBEBA + 12, label: "MCo-op Cash Settlement" },
  { value: 0xBEBA + 13, label: "External Cheques-In-Hand" },
  { value: 0xBEBA + 14, label: "PesaPepe Settlement (B2C)" },
  { value: 0xBEBA + 20, label: "PesaPepe Settlement (C2B)" },
  { value: 0xBEBA + 16, label: "Legacy Balances Control" },
  { value: 0xBEBA + 17, label: "SpotCash Settlement" },
  { value: 0xBEBA + 19, label: "Truncated Cheques Settlement" },
  { value: 0xBEBA + 21, label: "Institution Settlement" },
  { value: 0xBEBA + 22, label: "Agent Commission Settlement" },
  { value: 0xBEBA + 23, label: "PesaPepe Settlement (Airtime)" },
  { value: 0xBEBA + 24, label: "ABC Bank Settlement" },
  { value: 0xBEBA + 25, label: "Employer's Contribution (NSSF)" },
  { value: 0xBEBA + 26, label: "Employer's Contribution (Provident Fund)" },
  { value: 0xBEBA + 27, label: "PesaPepe Settlement (SMS)" },
  { value: 0xBEBA + 28, label: "PesaPepe Settlement (Owner)" },
  { value: 0xBEBA + 29, label: "Super Saver Withholding Tax" },
  { value: 0xBEBA + 30, label: "Super Saver Interest" },
  { value: 0xBEBA + 31, label: "Funeral Rider Expense" },
  { value: 0xBEBA + 32, label: "Account Payables" },
  { value: 0xBEBA + 33, label: "Account Receivables" },
  { value: 0xBEBA + 34, label: "Internal Debtors" },
  { value: 0xBEBA + 35, label: "Inventory" },
];
