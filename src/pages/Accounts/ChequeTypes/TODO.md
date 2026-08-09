# Accounts/ChequeTypes — remaining work

Covers `Areas/Accounts/Controllers/ChequeTypeController.cs`
(`api/accounts/chequetypes`) against `docs/api/cheque-type-api-spec.md`.
`moduleRouteMap.js` code `23023` — was unmapped entirely, no screen existed.

**List (§5.1), edit (§5.5, including lock toggle), and create (§5.4) are
all done** (create landed 2026-08-08, after two backend endpoints were
added same day to unblock it — see below). Matches the Operational design
pattern (`Accounts/CostCenters/index.jsx`/`create.jsx` — bare `<div>` list,
`gray-700` grid header, row cards, separate `/create` route with an
indigo-700 header bar) per `CLAUDE.md`'s Design Language section.

## Create's backend gap (resolved 2026-08-08)

`POST /` requires the request body to carry **both** at least one
`CommissionDTO` and at least one loan/investment product
(`ProductCollectionInfo`). Neither had a list endpoint when this screen was
first built — `ICommissionAppService`/`ILoanProductAppService` (Accounts
module) both existed at the service layer but were never called from a
real controller route (see `docs/api/commission-api-spec.md` /
`docs/api/loan-product-api-spec.md` "History note" sections for exactly
what was found).

Two new read-only endpoints closed the gap:
- `GET /api/accounts/commissions` — `CommissionController.cs`, unpaged,
  `{ success, message, data: CommissionDTO[] }`.
- `GET /api/accounts/loanproducts` — `LoanProductController.cs`, unpaged,
  same envelope shape. **This is a different `LoanProduct` concept from
  the legacy loan API `Loaning/LoanProducts.jsx` talks to
  (`VITE_APP_LOANING_URL`)** — confirmed in the spec doc, don't conflate
  the two or assume shared ids.

`create.jsx` fetches both of those plus the pre-existing
`GET /api/accounts/investmentsproducts` in parallel, renders each as a
checkbox `PickerList` (`Description` + a secondary field —
`ChargeTypeDescription` for commissions, `PaddedCode`/`Code` for loan
products), and on submit sends `CreateChequeTypeRequest { ChequeType,
Commissions, AttachedProducts }` with only `{ Id }` per selected
commission/product — confirmed directly against
`ChequeTypeAppService.UpdateCommissions`/`UpdateAttachedProducts` that only
`.Id` is ever read off each entry, nothing else needs to be sent.

## Editing commissions/attached products (done, 2026-08-08)

`PickerList` moved out of `create.jsx` into its own `PickerList.jsx` so
both screens share one implementation. `EditChequeTypeDrawer` (`index.jsx`)
now also fetches `GET /{id}/commissions` and `GET /{id}/attached-products`
(§5.6/§5.7) alongside the three full picker lists when it opens, to
pre-check whatever's currently linked, and on save issues all three
requests in parallel: `PUT /{id}` (own fields), `PUT /{id}/commissions`,
`PUT /{id}/attached-products`. Both sub-resource endpoints are **full
replace** server-side (`ChequeTypeAppService.UpdateCommissions`/
`UpdateAttachedProducts` delete every existing link for the cheque type
before re-adding what's sent) — the drawer always submits the complete
current selection, not a diff, same as the backend expects.

The drawer got tall enough (base fields + 3 picker sections) to hit the
same "submit button scrolls out of view" issue fixed earlier in
`SavingsReceiptsPayments.jsx` — built with the scrolling-body +
`shrink-0` footer split from the start this time rather than after the
fact. Verified end-to-end (list → edit → pre-checked selections → visible
Save button) against mocked API responses in a live browser session, since
the real backend isn't reachable in this sandbox.

## Known gaps, not yet built

- Investment products have no `PaddedCode`/`Code`-style secondary field
  shown in the picker (only `Description`) — `InvestmentProductDTO` wasn't
  checked for an equivalent field; add one if it exists and picking from a
  long list turns out to need it.
