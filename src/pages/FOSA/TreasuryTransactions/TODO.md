# FOSA/TreasuryTransactions — remaining work

Covers `CashManagementController.cs` (§5) and `FiscalCountController.cs`
(§16) of `docs/api/frontoffice-api-spec.md`. Split out of the former
`FOSA/Transactions` (now `FOSA/TellerTransactions`) on 2026-08-08 — Cash
Management and Fiscal Counts are both Treasury-area screens
(`NavigationMenu.cs` AreaCode `0x000061A8+2`, alongside "Authorizations"
which has no screen of its own), distinct from the Teller-cycle screens
that stayed behind. Folder rename only — routes (`/FrontOffice/CashManagement`,
`/FrontOffice/FiscalCounts`) and `moduleRouteMap.js` codes are unaffected,
only the two files' import paths in `App.jsx` changed.

## Fiscal Counts — scope corrected against an updated §16 (2026-08-08)

**`FiscalCounts.jsx` was originally built as a list + manual-entry-drawer
screen** (§16 at the time only sketched three bullets: list, get-one, manual
POST). A later spec revision fleshed out §16 in full and explicitly
narrowed the frontend scope: **this is a read-only catalogue, not a CRUD
screen.** Every `FiscalCount` row that matters is written implicitly by
treasury cash movement (§5), EOD close (§9, `TellerEndOfDay`), or a cash
transfer request (§7, `TellerCashTransfer`) — the catalogue's job is to let
a user pick one of those transaction types and browse every row it ever
produced, not to create/edit rows by hand. §16.3 (`POST /`, manual/ad-hoc
entry) still exists on the controller for parity with every other
`FiscalCount` entry point, but isn't part of this screen's intended flow —
rebuilt to drop the "New Fiscal Count" drawer entirely.

What changed in the rebuild:
- **Removed** the manual-entry drawer (`NewFiscalCountDrawer` — branch/
  posting-period/G-L-account/cost-center pickers + denomination capture +
  `POST /`). No create/edit UI on this screen at all now.
- **Added** the `transactionCode` filter the updated §16.1 documents
  (`GET /?...&transactionCode=`, confirmed against the real controller
  source — `FiscalCountController.Index` now takes an `int transactionCode
  = 0` param it didn't have before). Rendered as filter chips using §16.1's
  own type table: Bank to Treasury / Treasury to Bank / Treasury to Teller
  / Treasury to Treasury / Teller End-of-Day / Teller Cash Transfer (values
  in `FiscalCountTransactionCode`, `FOSA/lib/frontOfficeEnums.js`) — `0`
  (omitted) means "all types". This endpoint's own filter is
  `TransactionCode` only — there's no `transactionType` query param.
- **Added** a detail drawer (`GET /{id}`, §16.2) — clicking a row now shows
  the full denomination breakdown (reusing the `DENOMINATIONS` label/key
  list from `DenominationCountFields.jsx`, rendered read-only rather than
  as editable inputs) plus every populated field from §16.4, including
  `TransactionTypeDescription` as a secondary field alongside
  `TransactionCodeDescription`.

**Update 2026-08-08, later same day**: §16.4 was revised again —
`TransactionType`/`TransactionTypeDescription` used to be permanently
`0`/empty on every read (no backing entity column). The entity
(`FiscalCount.cs`) gained a real `TransactionType` column and every
fiscal-count-creating flow now sets it: §5 persists whatever the client
sent (`BankToTreasury`/`TreasuryToBank`/`TreasuryToTeller`/`TreasuryToTreasury`,
including on the destination-side record for `TreasuryToTreasury`), §9
(End of Day) hardcodes `TellerToTreasury`, §7 (cash transfer) hardcodes
`TellerCashTransfer`. `TreasuryTransactionType`
(`FOSA/lib/frontOfficeEnums.js`) gained the two new backend enum members
(`TellerToTreasury = 16`, `TellerCashTransfer = 32`) for completeness, but
they're **not** added to `CashManagement.jsx`'s movement picker —
`CashManagementController.Create`'s own switch statement only handles the
original four, those two are only ever set by EndOfDayController/
TransfersController on their own companion records, never client-selectable
here. Worth knowing: `TransactionCode` and `TransactionType` use genuinely
different labels for the same End-of-Day row ("Teller End-of-Day" vs.
"Teller to Treasury") — not a bug, both are real, don't try to reconcile
them into one label.
- Posting-period, chart-of-account, and cost-center pickers, and the whole
  `toDenominationSubtotals()`/reconciliation dance, are gone from this
  screen along with the drawer — they were only ever needed for the manual
  POST path this screen no longer offers.

**Lesson reinforced**: don't treat a thin/early version of a spec section
as final — when the user says a doc section "was fleshed out" or points at
an update, always re-diff against the actual controller source
(`FiscalCountController.Index`'s signature literally grew a parameter)
rather than assuming the previous read is still accurate.

## Cash Management — carried over from the original `FOSA/Transactions/TODO.md`

- `CashManagement.jsx`'s destination-treasury picker was pointed at
  `api/frontoffice/treasurys`, which no longer exists — Treasury master
  data moved to `Areas/Accounts/Controllers/TreasurysController.cs`
  (`api/accounts/treasurys`, see `docs/api/treasury-api-spec.md` and
  `src/pages/Accounts/Treasuries/TODO.md`). Fixed; the actual
  `POST /api/frontoffice/cashmanagement` cash-movement endpoint itself is
  unaffected — it resolves treasuries via the app service directly, not
  through this HTTP route.
- `CashManagement.jsx`'s teller/treasury *picker* dropdowns request
  `pageSize=1000` rather than paging — `TellerController`/`TreasurysController.Index`
  are genuinely paged now (default 20), and these are picker dropdowns that
  need the full list, not a paginated view.
- **Denomination-capture bug (real, shipped)**: each `Denomination*Value`
  field is a monetary subtotal, not a note/coin count — the server sums the
  11 fields directly against the total, it does not multiply by face value.
  `CashManagement.jsx` was spreading raw piece-counts straight into the
  payload until fixed via `toDenominationSubtotals()` on
  `DenominationCountFields.jsx`; it would have under-counted every
  submission by roughly the average face value. `CashManagement.jsx`
  derives its total directly from `sumDenominations(counts)` (`TotalValue`)
  — reconciliation is guaranteed by construction, so the two numbers can
  never actually disagree.
