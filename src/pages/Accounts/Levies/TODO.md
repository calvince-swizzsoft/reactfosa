# Accounts/Levies — remaining work

Covers `Areas/Accounts/Controllers/LevyController.cs` (`api/accounts/levies`)
against `docs/api/levy-api-spec.md` (new, 2026-08-09). `moduleRouteMap.js`
code `23008` — real match, `NavigationMenu.cs`'s "Levies" leaf
(`AreaCode 0x000059D8+7`, `ControllerName: Levy`) under Accounts > Setup >
Levies & Charges, was unmapped entirely before this.

**List (§4.2 paged), create (§4.4), and edit (§4.5 + splits sub-resource
§4.6) are all done**, Operational pattern matching `Commissions`/
`ChequeTypes`.

## Shape

- Basic fields only ever go through `PUT /{id}` — this is the *fix* for a
  real reference-app bug (its `Edit` action wiped `LevySplits` on every
  single save by calling the update with a freshly-empty collection,
  unconditionally). Splits have their own sub-resource here and are never
  touched by the main update.
- `ChargeValue` is a convenience field the backend maps into
  `ChargePercentage`/`ChargeFixedAmount` based on `ChargeType` — the
  create form sends `ChargeValue` alone (labeled "Percentage" or "Fixed
  Amount" depending on the selected `ChargeType`); the edit drawer reads
  whichever of `ChargePercentage`/`ChargeFixedAmount` is populated on load
  (since `GET` doesn't return `ChargeValue` back) and writes through the
  same `ChargeValue` field on save.
- `LevySplitsTotalPercentage` is never set by the frontend — the backend
  computes it from the real submitted splits on create and fixes it at
  `100` on every update (see the spec's history note: this field only
  exists to drive `LevyDTO`'s own validation attribute, and the reference
  app's `Create` action hardcoded it to a permanent no-op; this API
  doesn't repeat that).
- **G/L Splits** — `SplitRows` (`Accounts/lib/SplitRows.jsx`), the exact
  same component `Commissions` uses for its own splits, just rendered with
  `showLeviable={false}` (Levy splits have no `Leviable` concept).

## Known gaps

- None currently known — `LevyController`'s full surface (list/create/
  edit/splits) is covered.
