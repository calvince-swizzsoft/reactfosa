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
- **`FixedDepositTypeId`** (Fixed Deposits create) and **cheque number/
  bank name/bank account free-text fields** (In-House Cheques batch rows)
  are left out of their forms — optional fields with no lookup endpoint or
  clear validated semantics, same "don't guess a picker/field that isn't
  grounded" call as the pre-existing `ChequeType` gap above.
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

Not done / known gaps:
- **`UnpayReasons.jsx` (`/api/unpay`) — left untouched.** This endpoint
  isn't documented anywhere in `frontoffice-api-spec.md`. Could be a
  separate undocumented reference-data resource, or the reason codes might
  actually be meant to come from a fixed enum rather than a CRUD table —
  not guessed either way. Needs a real answer from the backend before this
  file is touched; `ClearCheques.jsx`'s unpay-reason dropdown still calls
  the same unverified endpoint for the same reason.
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
- **The Cheque Type field in `SavingsReceiptsPayments.jsx`'s Cheque Deposit
  section is a raw GUID text input** — no lookup/reference endpoint for
  cheque types exists in the spec. Swap for a real picker once one is
  exposed.
- **The Payment Voucher section has no cheque-book → voucher picker** —
  `PaymentVoucher.Id` stays unset on submit (form-layout doc note 5); no
  lookup endpoint exists yet for that cheque-book/voucher relationship.
- **Backend bug found while building `EndOfDay.jsx` — a genuinely Balanced
  day can't succeed.** `EndOfDayController.Create` only sets its internal
  `postExcessOrShortage` flag inside the `Shortage`/`Excess` switch cases;
  the `Balanced` case just `break`s, leaving it `false`. The method then
  checks that same flag and returns `{ success: false, message:
  "postExcessOrShortage boolean was false." }` whenever it's `false` — so a
  teller who counts exactly their book balance currently always gets a
  failure response back, even though the base journal for the day already
  posted server-side before that check. `EndOfDay.jsx` surfaces this
  message as-is rather than special-casing it client-side (per the
  no-client-side-business-logic decision for this page) — needs a real
  backend fix (set `postExcessOrShortage = true` in the `Balanced` case
  too), not a frontend workaround.
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

`CashManagementController`, `EndOfDayController`, and `TransfersController`
(cash transfer requests) now all **require** the 11 `Denomination*Value`
fields to sum exactly to the transaction total, `400`ing otherwise —
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
- **`CashTransfer.jsx`'s create drawer used to have a free-typed `Amount`
  input with no denomination entry at all.** Replaced the input with a
  `DenominationCountFields` block and derive `Amount` from its sum, same
  pattern as the other two screens — deliberately not a separately-entered
  `Amount` with a live "diff vs. count" check (the guide's more generic
  recommendation for a case where the total is independently constrained),
  since nothing here actually fixes `Amount` independently of the count.
