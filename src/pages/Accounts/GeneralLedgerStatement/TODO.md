# Accounts/GeneralLedgerStatement module — remaining work

Covers `GeneralLedgerStatementController`, against
`SwiftFinancialz/docs/api/general-ledger-statement-api-spec.md`. Same
unverified-against-a-live-response caveat as `CustomerAccountStatement`'s
TODO — built from the spec's documented shapes, not a live response sample.

Built:
- Three modes: By G/L Account (free-text + `journalEntryFilter`), By
  Transaction Code (`SystemTransactionCode` + optional `reference`), and
  unscoped Browse All (back-office audit view, no `chartOfAccountId`).
- G/L account picker reuses the existing `GET /api/values/GetChartOfAccount`
  endpoint (same one `Accounts/SavingsProducts` uses), switched to `apiFetch`
  for JWT auth — the existing `SavingsProducts` call to this endpoint still
  uses plain unauthenticated `fetch`, not changed here since that's a
  different page's file.
- `JOURNAL_ENTRY_FILTER_OPTIONS`/`SYSTEM_TRANSACTION_CODE_OPTIONS` (shared
  `../GeneralLedgerTransaction.jsx`) are the **full** enums transcribed from
  `Infrastructure.Crosscutting.Framework/Utils/Enumerations.cs` in the
  backend repo, not curated/partial lists.

Not done / known gaps:
- **Unscoped Browse All has no default narrowing** beyond the date range —
  the spec itself warns this can be a lot of rows on a live system; there's
  no extra guardrail here (e.g. forcing a narrower default date range) beyond
  what `CustomerAccountStatement`'s full statement already does.
- **`transactionDateFilter`** (ValueDate vs CreatedDate) is fixed to
  CreatedDate in the UI for the By G/L Account / By Transaction Code modes —
  no toggle exposed yet, defaults match the spec's own default.
