# Home / Dashboard — known issues

`index.jsx` used to be `pages/Home.jsx`, a bare redirect to the user's
first granted module (`findFirstLeaf`). 2026-08-17: replaced with a real
static dashboard (KPI tile strip + a quick-link grid over the module
tree) so there's a stable "back to home" destination instead of always
bouncing into whichever leaf happened to sort first. `findFirstLeaf` in
`src/lib/moduleTree.js` is now unused by this page (kept — may still be
useful elsewhere) now that Home no longer auto-redirects.

Deliberately generic/v1, not built out further per explicit scope
decision:

- **Not role-tailored.** Every tile a user's role grants the underlying
  route to is shown, in the same fixed order, to every user. A teller and
  a branch manager see the identical layout as long as both have access
  to the same set of pages — there's no per-role curation of which tiles
  matter most for a given job function, no reordering, no role-specific
  tiles (e.g. a teller might want their own till balance front and
  center; an approver might want the approvals tile to be the whole
  page). Worth a real pass once there's a clearer picture of what each
  role actually wants to see first.
- **Not user-configurable.** No way to add/remove/reorder tiles, resize
  them, or save a personal layout — everyone gets the one hardcoded
  `buildTiles()` array in `index.jsx`. A real version would need
  server-side persistence for the layout (per-user or per-role default),
  plus an edit-mode UI (drag-to-reorder, a tile picker). No backend
  concept for this exists yet — would need a new endpoint/table, this
  isn't just a frontend change.
- **Tile set is intentionally small and hand-picked**, not derived from
  the module tree: Customers, Pending Approvals, Trial Balance
  Difference, Text Alerts, Email Alerts (Delivered only — see below),
  Loans Registered, Loans Disbursed, Front Office Transactions
  (Posted/Paid only). Chosen because each has a real, working count-
  capable endpoint; **explicitly avoids anything backed by the legacy
  `ValuesController.cs` god-class** (e.g. `get-pending-payouts`) per
  direction — don't add a tile sourced from that controller without
  revisiting that decision first.
- **Email Alerts tile is "Delivered" only, not a true total.**
  `listEmailAlerts()` (`Messaging/EmailAlerts/api.js`) has no "omit the
  filter" option the way `listTextAlerts()` does — it always defaults to
  `DLRStatus.Delivered` when no status is passed. Getting a real
  all-statuses total would mean summing multiple calls (one per
  `DLRStatus` value) or a backend change to support an unfiltered list,
  same as `TextAlertController` already does.
- **Loans Disbursed tile links to the Registration screen** — there is no
  dedicated "disbursed loan cases" list page. `LoanCaseController.Index`
  accepts any `LoanCaseStatus` as a plain int with no server-side
  whitelist, so the count itself is real (`status=LoanCaseStatus.Disbursed`),
  but clicking through lands on `RegistrationScreen.jsx`, which defaults
  to `status: LoanCaseStatus.Registered` — the tile's own count and what
  you see after clicking it won't match. Needs either a status-aware
  variant of that screen or a dedicated disbursed-cases list.
- **Trial Balance Difference re-derives the same client-side sum**
  `Reports/FinanceReports/index.jsx` already computes over the same
  `getFinancialStatement("trial-balance", endDate)` call — duplicated
  here rather than shared because it's a two-line reduce, not because
  sharing was rejected; worth factoring out if a third caller shows up.
- **No caching/polling.** Every tile fetches once on mount (gated by
  `isPathGranted` per tile) and never refreshes — a teller sitting on the
  dashboard past midnight won't see "Front Office Transactions" grow,
  they'd need to reload the page.
- **Financial Position and Front Office tiles read from a single
  `pageSize: 1` list call**, not a dedicated `/count` endpoint (none
  exists) — cheap enough since `PageCollectionInfo.ItemsCount` is
  computed server-side regardless of page size, but keep in mind if the
  underlying query itself is ever slow to run.
