# FOSA/TellerTransactions — remaining work (Phase 1 fidelity pass)

Renamed from `FOSA/Transactions` on 2026-08-08 when Cash Management and
Fiscal Counts (Treasury-area screens) were split out into their own
`FOSA/TreasuryTransactions/` folder — see that folder's own `TODO.md` for
their history, including the Fiscal Counts scope correction (it's a
read-only catalogue, not a CRUD screen). Everything below covers the
Teller-cycle screens that stayed behind.

Covers the 7 pre-existing front-office areas against
`docs/api/frontoffice-api-spec.md` / `WebApplication1/Areas/FrontOffice/WORKFLOW.md`.

**Phase 2 shipped 2026-08-11** — all 7 areas that had no screen at all
(account closure, fixed deposits, expense payables, sundry payments,
customer receipts, in-house cheques, automated clearing) are now built:
`SundryPayments.jsx`, `CustomerReceipts.jsx`, `ExpensePayables.jsx` (+
`ExpensePayables/create.jsx`), `FixedDeposits.jsx` (+
`FixedDeposits/create.jsx`), `AccountClosure.jsx` (+
`AccountClosure/create.jsx`), `InHouseCheques.jsx` (+
`InHouseCheques/create.jsx`), `AutomatedClearing.jsx`. Every controller/DTO
was read directly from the real backend source in the sibling
`SwiftFinancialz` repo before writing each screen, not guessed from the
spec doc's prose — several real field-casing/shape details only surfaced
that way (e.g. `AccountClosureController`'s real Approve->Verify->Settle
precondition order, which contradicts the reference controller's naming).
moduleRouteMap codes `25007`/`25008`/`25012`-`25014`/`25016`/`25017` are
all mapped now. Known deliberate simplifications, not oversights:
- ~~**`FixedDepositTypeId`** (Fixed Deposits create)~~ — **resolved
  2026-08-16.** `FixedDepositTypeController` (`api/accounts/
  fixeddeposittypes`, `NavigationMenu.cs` Code `23029`) was built as part
  of an end-to-end fidelity check of the whole Fixed Deposit lifecycle
  (origination -> verify/post -> terminate, all confirmed working for real
  against a live dev DB — see `SwiftFinancialz` repo's WCF-removal-branch
  session notes) — `swiftFin_FixedDepositTypes` had zero rows and no
  create screen existed anywhere, so the lifecycle was untestable end to
  end until this shipped. New screen: `Accounts/FixedDepositTypes/`
  (list + create + edit, full CRUD plus levies/attached-loan-products/
  graduated-scales sub-resources — the latter had no UI anywhere in the
  reference app despite `IFixedDepositTypeAppService` already supporting
  it). `FixedDeposits/create.jsx` now sources a real `FixedDepositTypeId`
  picker from it instead of omitting the field.
- **cheque number/bank name/bank account free-text fields** (In-House
  Cheques batch rows) are still left out of their forms — optional fields
  with no lookup endpoint or clear validated semantics, same "don't guess
  a picker/field that isn't grounded" call as the pre-existing `ChequeType`
  gap above.
- **`FixedDepositPayableDTO`** (`GET`/`PUT /{id}/payables`) is shown
  read-only in the Fixed Deposits detail drawer — its fields
  (`BookBalance`/`PrincipalBalance`/`InterestBalance`) read as a
  denormalized balance snapshot, not obviously user-editable business
  data, so no edit form was built for the `PUT` side.
- **Expense Payables' entry-line totals** are computed client-side by
  summing the fetched entries — the real `GET /{id}/entries` response has
  no server-computed total (unlike what an earlier, less-verified pass of
  the planning doc assumed).

Original Phase 1 scope below.

Cash Deposit/Cash Withdrawal/Cheque Deposit/Payment Voucher were later
unified into one screen, `SavingsReceiptsPayments.jsx`, replacing the 4
separate pages this file originally documented — see
`WebApplication1/Areas/FrontOffice/SAVINGS-RECEIPTS-PAYMENTS-FLOW.md` and
`-FORM-LAYOUT.md`. `moduleRouteMap.js` code `25006` ("Savings
Receipts/Payments", the one real nav entry for this whole cycle) now
points at it.

**`CashTransfer.jsx`/`ChequeTransfer.jsx` merged into `Transfers.jsx`,
2026-08-11** — the predicted follow-up above actually happened. Confirmed
against `NavigationMenu.cs`: there is no separate module code for Cash
Transfer vs. Cheque Transfer — the one real nav entry, `25009` ("Cheques/Cash
Transfer", `ControllerName: Transfers`), covers both, exactly the situation
Savings Receipts/Payments (`25006`) was in before its own merge. `25009` had
been pointed at `CashTransfer.jsx` only (arbitrary pick), leaving
`ChequeTransfer.jsx` reachable solely through the launcher hub, never the
real dynamic sidebar nav. `Transfers.jsx` now covers both under Cash
Transfer/Cheque Transfer top-level tabs (each keeping its own existing
status sub-tabs) at a single route, `/FrontOffice/Transfers` — `25009`
points there now. The two request shapes genuinely differ (confirmed
against `TransfersController.cs`): `POST /cash` takes a full
`CashTransferRequestDTO` (denomination breakdown, balance status), `POST
/cheques` takes a bare `List<ExternalChequeDTO>` with only
`Id`/`TellerId`/`TellerDescription` read.

**`UnpayReasons.jsx`/`/api/unpay` resolved, 2026-08-11.** The mystery
endpoint turned out to have a real, documented, entirely separate
replacement: `UnPayReasonController.cs` (`api/accounts/unpayreasons`,
`docs/api/unpayreason-api-spec.md`) — full CRUD plus an attached-
commissions sub-resource. `NavigationMenu.cs` confirms it belongs under
Accounts (Code `23028`, `ControllerName: UnpayReason`), not FrontOffice,
despite being consumed from this front-office area — moved to
`Accounts/UnpayReasons/` (list/create/edit) to match. `Cheques.jsx`'s
Clear tab now sources its unpay-reason dropdown from the real endpoint
too.

**Catalogue/BankCheques/ClearCheques merged into `Cheques.jsx`,
2026-08-11.** Same shape as the Transfers merge above:
`NavigationMenu.cs` has exactly one real nav Code for this whole area
(`25011`, "Cheques", `ControllerName: Cheques`) — Bank (`POST /bank`) and
Clear (`POST /clear`) are sub-actions of the same controller, not
separate nav items, so they were never reachable outside the launcher
hub. Unified into one screen with Catalogue/Bank/Clear tabs at
`/FrontOffice/Cheques`; Catalogue also gained a status filter
(All/Pending/Transferred/Banked/Cleared) — `GET /` has no server-side
status param, so this fetches the full list once (`pageSize=1000`, same
precedent Bank/Clear already used) and filters/paginates client-side.

Not done / known gaps:
- **`POST /markposted?id=`** (`CashDepositController`) — not wired up
  anywhere. No confirmed recovery use case surfaced during this pass (it
  looked like a manual-fix escape hatch for a request stuck between
  Authorized and Posted); add a client if/when one turns up.
- **Cheque Deposit rows never appear in `SavingsReceiptsPayments.jsx`'s
  queue** — by design, not an oversight. A cheque deposit always posts
  directly server-side (no pending/authorized request type exists for it).
  A queued Payment Voucher submission, by contrast, IS a plain
  `CashWithdrawalRequest` server-side (`TransactionType` hardcoded back to
  plain `CashWithdrawal`, `Category = PaymentVoucher`) — it surfaces
  automatically in the same merged queue as an ordinary withdrawal, tagged
  with the "Voucher" badge (`CashWithdrawalCategory.PaymentVoucher` in
  `frontOfficeEnums.js`).
- ~~The Cheque Type field in `SavingsReceiptsPayments.jsx`'s Cheque Deposit
  section is a raw GUID text input~~ — **resolved**, this note was stale;
  it's a real `Select` sourced from `GET /api/accounts/chequetypes/all`
  (`ChequeTypeController`, built the same day `Accounts/ChequeTypes` shipped).
- **The Payment Voucher section has no cheque-book → voucher picker** —
  `PaymentVoucher.Id` stays unset on submit (form-layout doc note 5); no
  lookup endpoint exists yet for that cheque-book/voucher relationship.
- ~~A genuinely balanced End of Day returned failure after posting its base
  journal~~ — **resolved**. `EndOfDayController.Create` now returns the
  teller-to-treasury journal as success for `Balanced`; only shortage and
  excess require a second variance journal.
- **`EndOfDayController`'s teller-lookup dependency**: `EndOfDay.jsx`
  resolves "my teller" via `GET tellers/teller?employeeId=<id>`, decoding
  the JWT's own `EmployeeId` claim client-side (`getEmployeeIdFromToken` in
  `src/lib/auth.js`) since no self-lookup endpoint exists. If that claim is
  ever renamed server-side, this breaks silently (falls back to a
  zero/blank Book Balance) — grep for `"EmployeeId"` in
  `JwtTokenService.cs` if this stops working.

## Teller/Treasury master data — re-verified against a later
`frontoffice-api-spec.md` update (§6/§7) and the real controller source

- **`TellerController`/`TreasurysController` responses are now enveloped**
  (`{ success, message, data }`) — they used to return bare DTOs/arrays.
  `Teller.jsx`'s list already worked either way (`normalizeList` handles
  both shapes), but `EndOfDay.jsx`'s single-teller lookup
  (`GET tellers/teller?employeeId=`) did not — it was reading `teller`
  straight off the unenveloped response, so `BookBalance`/`Description`
  silently came back `undefined` on every EOD close (fixed: unwrap
  `d?.data ?? d`). **This was a real production bug**, not a hypothetical
  one — it made every End of Day submission compute Book Balance as 0 and
  misclassify the closing status.
- **`GET /` on both controllers is now genuinely paged**
  (`pageIndex`/`pageSize`, `TellerController` also takes `tellerType`/
  `text`) — previously `TellerController.Index` took no params at all and
  returned everything unpaged. `Teller.jsx` and `Treasuries/index.jsx` now
  have real Prev/Next pagination instead of silently capping at the
  server's default 20 rows. `CashManagement.jsx`'s teller/treasury
  *picker* dropdowns request `pageSize=1000` instead — they need the full
  list, not a paginated view.
- **Neither controller has a `DELETE` route at all** — confirmed against
  the real controller source (only `GET`/`GET {id}`/`POST`/`PUT` exist on
  each). The old `Teller.jsx`/`Treasuries/index.jsx` delete buttons called
  `DELETE /api/frontoffice/tellers/{id}` /
  `.../treasurys/{id}`, which would always fail — removed rather than left
  as a guess, since this was verified, not assumed.
- **`PUT /{id}` on both controllers takes the route `id` as authoritative**
  — it's assigned onto the body DTO server-side before validation, so a
  stale/mismatched `Id` in the request body is silently overwritten. No
  teller edit UI exists yet (`Treasuries/index.jsx`'s `EditTreasuryDrawer`
  already relies on this correctly); worth remembering if a teller-edit
  screen gets built later.

## Denomination capture — backend now enforces reconciliation
(`WebApplication1/Areas/FrontOffice/DENOMINATION-CAPTURE-FRONTEND-GUIDE.md`)

`CashManagementController` and `EndOfDayController` require the 11
`Denomination*Value` fields to sum exactly to the transaction total.
Cash transfer requests require this reconciliation in Tally-by-Count mode;
Tally-by-Total deliberately carries no invented denomination breakdown —
`CashTransferRequestDTO` didn't carry these fields at all when
`EndOfDay.jsx`/`CashTransfer.jsx` were first built (confirmed by reading the
DTO source directly at the time); a later backend change added them and
made them mandatory.

- **Each field is a monetary subtotal, not a note/coin count** — the server
  sums the 11 fields directly against the total, it does not multiply by
  face value. `DenominationCountFields.jsx`'s own `counts` state is still
  piece-counts (natural teller UX: "3 of the 1000s..."); the new
  `toDenominationSubtotals()` export converts to the pre-multiplied wire
  shape. **Never spread `counts` directly into a request body** — that was
  a real, shipped bug in `CashManagement.jsx` (now in
  `FOSA/TreasuryTransactions/`; sending raw piece counts as if they were
  already subtotals) until this pass fixed it; it would have under-counted
  every submission by roughly the average face value and either 400'd or
  silently posted the wrong figures depending on exact values entered.
- **`EndOfDay.jsx` derives its total directly from `sumDenominations(counts)`**
  (`ClosingBalance`) — reconciliation is guaranteed by construction, the
  two numbers can never actually disagree. Same story for `CashManagement.jsx`
  (`TotalValue`), see `FOSA/TreasuryTransactions/TODO.md`.
- **The cash-transfer drawer now supports both documented tally modes.**
  Tally-by-Count derives `Amount` from `DenominationCountFields`; Tally-by-
  Total sends the entered amount with `TallyByTotal: true` and does not
  fabricate a denomination mix.

## TODO — Teller Daily Report

The AppService/domain layers already provide most of the primitives needed
for a Teller Daily Report, but there is no canonical consolidated report
contract yet.

Existing reusable support:

- `TellerAppService.FetchTellerBalances()` calculates today's opening
  balance, total credits, total debits, current/book balance, closing
  balance, and transaction count from the teller cash G/L account.
- `IFiscalCountAppService` supports date-range and transaction-code queries
  for teller transfers, treasury movements, End of Day, references, users,
  and denomination breakdowns.
- `ICashTransferRequestAppService` supports employee/date/status queries for
  the request and acknowledgement workflow.
- `IFiscalCountAppService.IsEndOfDayExecuted()` identifies whether the
  teller's daily close was recorded.
- Journal-entry services already calculate brought-forward/carried-forward
  balances and credit/debit totals.

Build a canonical Application-layer query such as:

```csharp
TellerDailyReportDTO GetTellerDailyReport(
    Guid tellerId,
    DateTime businessDate,
    ServiceHeader serviceHeader);
```

The DTO should contain teller/branch identity, business date, opening
balance, receipts, payments, transfers in/out, expected closing balance,
physical denomination count, shortage/excess, End-of-Day state, and detailed
movements with journal references. The reconciliation should be:

```text
opening + receipts - payments + transfers in - transfers out
        +/- adjustments = expected closing balance
```

Known gaps to address in that AppService implementation:

- `FetchTellerBalances()` is hard-coded to `DateTime.Today`/`DateTime.Now`;
  add a business-date overload for reproducible historical reports.
- Fiscal counts do not consistently carry a direct `TellerId`; attribution
  currently relies on the teller G/L account or `CreatedBy` in some flows.
- Cash-transfer requests, fiscal counts, and journals need one durable,
  immutable correlation identifier for an audit-grade movement trail.
- Add report-level completeness/reconciliation checks rather than composing
  these independent sources in an API controller or browser.
