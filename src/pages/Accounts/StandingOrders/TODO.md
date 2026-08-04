# Accounts/StandingOrders module — remaining work

Covers `StandingOrderController` (`api.js`) and `StandingOrderExecutionController`
(`executionApi.js`), against the two specs in
`SwiftFinancialz/docs/api/standing-order*-api-spec.md` — field names for the
create/edit payload were taken directly from the real
`StandingOrderDTO.cs`/`StandingOrderHistoryDTO.cs` source in the backend repo
(not guessed), assuming the whole payload is camelCase like the rest of the
recently-added endpoints (e.g. `CreateCustomerRequest`) — **not yet confirmed
against a live response**, unlike the enum values which came straight from
the user.

Built:
- **List/search page** (`index.jsx`) — paged, with text/customerAccountFilter/
  customerFilter/trigger filters. Row fields (BenefactorFullAccountNumber,
  BeneficiaryCustomerAccountCustomerFullName, etc.) match the real DTO 1:1.
- **Create/edit drawer** (`StandingOrderDrawer.jsx`) — Parties (two-step
  customer → account picker, mirroring `FOSA/Transactions/CashDeposit.jsx`),
  Schedule & Charges, Loan Terms tabs. Handles the 409 "created but flagged"
  duplicate-combo case as a warning, not a hard failure.
- **Execution admin screen** (`Execution.jsx`) — the four batch triggers
  (execute/fix-skipped/sweep/payout), each behind a destructive-style
  confirm dialog since every one runs across potentially many accounts.

Not done / known gaps:
- **`CustomerAccountTypeProductCode`/`RecordStatus`/`RecordStatusDescription`**
  ("Additional DTOs" section of `StandingOrderDTO.cs`) aren't surfaced
  anywhere in the UI — unclear what they represent for a standing order
  specifically (looks copy-pasted from a customer-account-shaped DTO).
- **History view** (`getStandingOrderHistory`), **by-account/by-customer
  lookups** — still no UI; likely belong as tabs on a customer/account detail
  view once those exist, not standalone pages.
- **Due / Skipped operational review lists** (`getDueStandingOrders` /
  `getSkippedStandingOrders`) — no dedicated screens; `Execution.jsx`'s
  Execute/Fix-Skipped cards run against these result sets but don't display
  them.
- **Auto-create** (`autoCreateStandingOrders`) — no UI.
- **No delete** — no such endpoint was given for standing orders.
- **`BeneficiaryProductRoundingType`/loan fields** (Loan Terms tab) — spec
  only says these matter "for loan beneficiaries" without defining exactly
  when the backend expects them populated vs. left at 0; confirm before
  relying on them for a real Microloan/Check-Off order.
