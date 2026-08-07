# Accounts/ChartOfAccounts — remaining work

Covers `Areas/Accounts/Controllers/ChartOfAccountController.cs`
(`api/accounts/chartofaccounts`) against
`docs/api/chartofaccount-api-spec.md`. Verified line-for-line against the
real controller source, not just the doc — no drift found.

**Two DTO shapes are deliberately in play, not a mistake.** `GET /tree`
returns `GeneralLedgerAccount` (Id/ParentId/Category/Type/Code/Description
+ a correctly-populated `Depth`) — used for the default indented browse
view and for the Parent-Account picker in the create/edit form. `GET /` and
`GET /{id}` return the full `ChartOfAccountDTO` (all the editable fields,
but `Depth`/`Children` always come back `0`/`[]`) — used for the text-search
result view and to hydrate the edit drawer's form. Don't try to unify these
into one shape; the API itself doesn't.

**Legacy screens under `Finance/` were left alone, not deleted** —
`Finance/COA/ChartsOfAccount.jsx` and
`Finance/Setup/AccountConfiguration/AccountConfiguration.jsx` hit unrelated
legacy endpoints (`api/values/GetGeneralLedgers`,
`api/values/getSystemMappings`) and were out of scope for this pass. Module
codes `23005`/`23006` (which used to point at those two legacy screens)
were repointed to this folder's `index.jsx`/`Mappings.jsx` in
`moduleRouteMap.js` since they're now the correct target per
`NavigationMenu.cs`.

Not done / known gaps:
- **No self-parenting guard in the UI.** The create/edit form excludes the
  account being edited from its own Parent picker (`index.jsx`'s
  `EditChartOfAccountDrawer` filters `parentOptions` on `Id !== accountId`),
  but doesn't check for picking one of the account's own *descendants* as
  its new parent (which would create a cycle). Neither the spec nor the
  controller source documents server-side protection against this either —
  not guessed at; flag to backend if it turns out to be reachable.
- **Parent picker is sourced from the full tree, unfiltered by
  `AccountCategory`.** A `DetailAccount` (postable, meant to be a leaf) can
  currently be picked as another account's parent just as easily as a
  `HeaderAccount` — the spec doesn't document a category restriction on
  `ParentId`, so none was added; worth confirming with product whether that
  should be blocked.
- **`Mappings.jsx` saves on every dropdown change** (no separate "Save"
  step) — matches the endpoint's own idempotent-upsert semantics
  (`PUT /systemgeneralledgermappings/{code}` always creates-or-replaces),
  but means there's no "cancel" once a new chart of account is picked from
  the dropdown.
