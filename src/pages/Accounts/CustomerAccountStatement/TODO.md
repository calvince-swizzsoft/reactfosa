# Accounts/CustomerAccountStatement module — remaining work

Covers `CustomerAccountStatementController`, against
`SwiftFinancialz/docs/api/customer-account-statement-api-spec.md`. Built
against the spec's documented shapes only — this doc's own author flagged
it as hand-written alongside the controller (not generated), so treat field
names as trustworthy but unverified against a live response.

Built:
- Customer → account picker (mirrors `FOSA/Transactions/CashDeposit.jsx`).
- Mini statement (`lastXDays`/`lastXItems`) and full statement (date range +
  paging + text/`journalEntryFilter` search) toggle.
- Print PDF dialog — `chargeForPrinting` defaults `false` and shows an
  explicit amber warning when checked (posts a real fee, per the spec);
  `includeInterestStatement` for loan accounts. Downloads the blob via
  `downloadPdfBlob()`, doesn't attempt to parse it as JSON.

Not done / known gaps:
- **`moduleNavigationItemCode`** on `/print` is hardcoded to `0` — the spec
  says to source it from `GET /api/administration/modules` rather than
  hardcode it, same caveat as `CreateCustomerRequest`'s field of the same
  name. Needs the real code once known (see how `Registry/Customers`'s
  `moduleNavigationItemCode` went from `0` to `21007`).
- **Not tested against a live PDF response.** The download flow
  (`Content-Type` check → blob → `<a download>`) is standard but unverified
  here — confirm the browser actually saves/opens a valid PDF, and that a
  failure response (plain `HttpError`, not the JSON envelope) surfaces a
  sensible message rather than a raw text dump.
- Print filename is just `statement-{accountId}.pdf` — no account
  number/customer name in the filename since neither is guaranteed loaded at
  print time independent of the account picker's own display label.
