# Accounts/Commissions — remaining work

Covers `Areas/Accounts/Controllers/CommissionController.cs`
(`api/accounts/commissions`) against `docs/api/commission-api-spec.md`
(full rewrite, 2026-08-09 — was a single unpaged `GET /` added just to
unblock `ChequeTypeController`'s picker, see [[project_design_language_audit]]).
`moduleRouteMap.js` code `23009` — `NavigationMenu.cs`'s "Charges" leaf
(`ControllerName: Charges`), which historically pointed at a *different*,
deliberately-not-ported reference controller (see the spec's History
note). Repointed to `/Accounts/Commissions` per user decision
(2026-08-09): "Charges" is the business-facing nav slot for this function
regardless of which controller implements it, and `CommissionController`
is what actually does now.

**List (§5.2 paged), create (§5.4), and edit (§5.5 + sub-resources
§5.6-§5.8) are all done**, Operational pattern (bare `<div>` list,
`gray-700` grid header, row cards, separate `/create` route, indigo-700
header) matching `ChequeTypes`/`CostCenters`.

## Shape

- Basic fields (Description/MaximumCharge/RoundingType/IsLocked) only ever
  go through `PUT /{id}` — matches the reference app's `Edit`, which never
  touched graduated scales/splits/levies either (made explicit here per the
  spec, not silently inconsistent).
- **Graduated Scales** (`GraduatedScaleRows`, shared lib component) — rate
  brackets by transaction amount, optional, full-replace via
  `PUT /{id}/graduated-scales`. Only `ChargePercentage` or
  `ChargeFixedAmount` is used server-side depending on the row's own
  `ChargeType` (`Domain.MainBoundedContext.ValueObjects.Charge`'s
  constructor zeroes the other) — both fields are kept on the row object
  so switching `ChargeType` back and forth in the UI doesn't lose data.
- **G/L Splits** (`SplitRows`, shared with Levies — see below) — how the
  computed commission amount divides across G/L accounts, optional, must
  sum to 100% when non-empty (client-side running-total preview + the
  real server-side `400`), full-replace via `PUT /{id}/splits`. Each split
  has a `Leviable` checkbox (Commission-only — feeds the Levy calculation,
  `COMMISSION-LEVY-CHARGE-CONCEPTS.md` §2).
- **Linked Levies** (`PickerList`, shared with ChequeTypes) — checkbox list
  against `GET /api/accounts/levies` (unpaged), full-replace via
  `PUT /{id}/levies`. This only *links* existing `Levy` records (only
  `.Id` is read) — does not create/edit levies, use `Accounts/Levies` for
  that.

Both create and edit fetch the G/L account list
(`GET /api/accounts/chartofaccounts?pageSize=1000`) and — edit only — the
commission's current graduated scales/splits/levies, in parallel with the
rest of the drawer's data, same pattern as `ChequeTypes`' edit drawer.

## Known gaps

- No inline "Create Levy" shortcut from the Linked Levies picker — if none
  exist yet, the empty-state text just says to create one under
  Accounts > Levies first.
