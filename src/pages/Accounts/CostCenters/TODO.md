# Accounts/CostCenters — remaining work

Covers `Areas/Accounts/Controllers/CostCenterController.cs`
(`api/accounts/costcenters`) against `docs/api/costcenter-api-spec.md`.
Verified line-for-line against the real controller source — no drift
found. Module code `23004` ("Cost Centers", `NavigationMenu.cs:74`) was
previously unmapped in `moduleRouteMap.js`; now points here.

Not done / known gaps:
- **No duplicate-description guard on edit** — matches the server exactly
  (`UpdateCostCenter` doesn't re-check uniqueness, only `Create` does, per
  the spec's own §4 callout), not a bug to fix client-side.
- **No delete UI** — `CostCenterController` has no `DELETE` route at all
  (confirmed against source, same as Treasury/Teller/ChartOfAccount).
