# Accounts/BankLinkages — remaining work

Covers `Areas/Accounts/Controllers/BankLinkageController.cs`
(`api/accounts/banklinkages`) against `docs/api/bank-linkage-api-spec.md`.
This is a **new** controller — it didn't exist before this pass (the DTO/
domain layer did, just no HTTP controller). Module code `23022` was
previously dead-pointed at `/Finance/BanksSetup` (no matching route
anywhere); now points here.

Not done / known gaps:
- **No delete action** — `IBankLinkageAppService` doesn't expose one
  (spec §5.6).
- **No live balance column** — `bankLinkageBalance` and the denormalized
  bank display fields (`address`/`city`/`swiftCode`/`ibanNo`) are not
  populated by this controller at all (spec §4); only
  `ValuesController.getBankWithLinkages` computes those by cross-
  referencing G/L balances and the linked `Bank` record. If a live-balance
  view is wanted here later, it needs that separate endpoint, not this
  one — by design, not a gap to silently patch over.
- **`bankName`/`branchDescription`/`chartOfAccountAccount*` are
  denormalized display copies the caller sets, not derived server-side**
  (spec §4) — `BankLinkageForm.jsx` auto-fills them from whichever
  bank/branch/chart-of-account row is picked, but if the underlying
  record is renamed later, these go stale until the linkage itself is
  edited and re-saved. No background sync exists or is planned here.
- **This fixed a real bug in `FOSA/Transactions/CashManagement.jsx`**:
  its Bank picker (sourced from `getBankWithLinkages`, not this
  controller) was binding to the `BankLinkage` row's own `Id` instead of
  the real `BankId` FK — invisible until now because
  `CashManagementController`'s `BankToTreasury`/`TreasuryToBank` cases
  were guaranteed to 500 on a dead `_bankLinkageAppService` dependency,
  now also fixed server-side. See that file's inline comment.
