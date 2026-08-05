# Administration/Branches module — remaining work

Moved from `Membership/branches` and rewritten against
`SwiftFinancialz/docs/api/branch-api-spec.md` (`BranchController` at
`/api/administration/branches`). Field names taken from the real
`BranchDTO.cs` — the writable surface is small (`companyId`, `description`
+ 8 address fields, `isLocked` via a separate endpoint, everything else is
a read-only denormalization of the parent company).

Fixed against the spec's "History note" (old controller was
`[AllowAnonymous]` + wildcard CORS over a raw-SQL service, both deleted):
- **Auth**: switched every call from plain `fetch` to `apiFetch` (was
  unauthenticated, matching the old controller's exemption that the spec
  says is now gone).
- **Paging envelope**: `GET /` returns `PageCollectionInfo<BranchDTO>`, not
  a bare array — `index.jsx`'s old `json.data || []` would have set state
  to the page-info object itself. Fixed, with real Prev/Next via
  `itemsCount`.
- **Removed the Delete action.** `DELETE /{id}` "no longer exists" per the
  spec — branches follow the same soft-lock convention as `Company` now.
  Replaced with a lock/unlock icon on each row calling
  `PATCH /{id}/toggle-lock` (no body, flips `isLocked` server-side).
- **`AddBranch.jsx`**: dropped the `code` input — the spec says it's
  server-assigned (`MAX(Code)+1`) and any value sent is ignored; removed a
  stray `ngrok-skip-browser-warning` header left over from an unrelated
  tunnel config; fixed the companies dropdown to fetch
  `/api/administration/companies/all` (was reading `data.data` from the
  *paged* companies endpoint directly as an array, which silently broke
  once `company-api-spec.md`'s paging envelope landed there too).
- **`EditBranch.jsx`**: was fetching companies from `/api/companies` — a
  typo'd path that 404s — so the company dropdown was always empty in Edit
  mode; fixed to the same `/all` endpoint as Add. Form keys switched from
  PascalCase to camelCase to match the rest of this API's confirmed
  convention (the old PUT body's casing was never actually verified
  against a live response). `Code` is now shown read-only instead of
  editable, matching the "server-assigned" note.
- **`isLocked` removed from the PUT body.** Unlike `Company` (where the
  spec explicitly says `PUT` handles `isLocked` transitions), this spec
  frames locking entirely around the dedicated `PATCH /{id}/toggle-lock`
  endpoint and never says the regular update body also touches it — so the
  old inline "Is Locked?" checkbox in both forms (which did nothing
  reliable either way) was replaced with the row-level lock/unlock action
  instead of guessing it also works through `PUT`.

Not done / known gaps:
- **`GET /by-code/{code}`, `GET /by-company/{companyId}`** — not used
  anywhere in this app yet; no current screen needs a code- or
  company-scoped branch lookup.
- **Company filter/sort in the list** still operates client-side on
  whatever page is currently loaded (same limitation the Companies list
  has) — there's no server-side "branches for company X" filter param on
  `GET /`, only the dedicated `by-company` endpoint above, which returns an
  unpaged array rather than fitting the paged list's shape.
