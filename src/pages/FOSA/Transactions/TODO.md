# FOSA/Transactions — remaining work (Phase 1 fidelity pass)

Covers the 7 pre-existing front-office areas against
`docs/api/frontoffice-api-spec.md` / `WebApplication1/Areas/FrontOffice/WORKFLOW.md`.
Phase 2 (account closure, fixed deposits, expense payables, sundry
payments, customer receipts, in-house cheques, automated clearing, fiscal
counts — the 8 areas with no screen at all) is a separate, not-yet-started
planning pass.

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
- **Cheque Deposit and Payment Voucher have no queue UI** — by design, not
  an oversight. `ChequeDeposit.jsx` always posts directly server-side (no
  pending/authorized request type exists for it). An above-limit
  `PaymentVoucher.jsx` submission is stored as a plain `CashWithdrawalRequest`
  server-side (`TransactionType` hardcoded back to plain `CashWithdrawal`),
  so it surfaces in the ordinary Cash Withdrawal queue's Authorized tab —
  there's no server-side way to filter "just the voucher-flavored" rows out
  of that list. `PaymentVoucher.jsx` links users there directly instead of
  faking a queue it can't actually query.
- **`ChequeDeposit.jsx`'s `ChequeType` field is a raw GUID text input** — no
  lookup/reference endpoint for cheque types exists in the spec. Swap for a
  real picker once one is exposed.
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
