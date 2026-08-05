# Administration/Company module — remaining work

Rewritten against `SwiftFinancialz/docs/api/company-api-spec.md`
(`CompanyController` at `/api/administration/companies`). Field config
(`companyFormConfig.js`) and the shared step renderer
(`CompanyFormFields.jsx`) are sourced directly from the real
`CompanyDTO.cs` (60+ fields) rather than the old hand-typed field lists,
which had already drifted from each other and from the DTO (a
`enforceFileTracking` toggle that matched no real field — the actual name
is `isFileTrackingEnforced` — and `enforceCustomerMakerChecker` missing
from both forms entirely, alongside ~24 other DTO booleans that existed in
form state but had no input anywhere to set them).

Fixed against the spec:
- **List (`index.jsx`)**: switched to `apiFetch` (was unauthenticated plain
  `fetch`); fixed the paging envelope (`GET /` returns
  `PageCollectionInfo<CompanyDTO>`, not a bare array — the old code did
  `json.data || []` which would have set `companies` to the page-info
  object itself, not its `pageCollection`); added real Prev/Next using
  `itemsCount`.
- **Removed the Delete action** — no delete endpoint exists on this
  controller per the spec (the doc's own audience line only says
  "list, create, or edit"); the old UI called
  `DELETE /api/administration/companies/{id}` which almost certainly 404s
  against the rewritten controller now.
- **`AddCompanies.jsx`**: fixed the create body — was posting the flat
  `CompanyDTO` directly; the spec's `POST /` body is
  `{ company: CompanyDTO, mandatoryDebitTypes?, mandatoryProducts? }`.
  Added a functional **Mandatory Products** step (savings + investment,
  same picker pattern as `Registry/Customers/create.jsx`) feeding
  `mandatoryProducts`.
- **`EditCompanies.jsx`**: `PUT /{id}` body was already correctly flat
  (matches the spec, unlike POST) — kept as-is. Added a **Mandatory
  Products** tab that `GET`s the company's currently-attached products on
  open and `PUT`s a full replace only if the user touched the tab this
  session (dirty-flag guard, same pattern as `Registry/Employer`'s
  Divisions tab — the replace endpoint deletes and re-inserts from
  whatever's sent, so firing it from an untouched copy would silently wipe
  attached products that were never loaded).
- **`isLocked`** now has an explicit toggle with a note that checking it
  locks the company as part of the same `PUT` — there's no separate
  lock/unlock endpoint, confirmed by the spec.
- **`recoveryPriority`**: the old raw-MVC controller unconditionally forced
  this to `"DirectDebits"` on create; the new endpoint saves whatever's
  sent, including blank. Defaulted `emptyCompanyForm.recoveryPriority` to
  `"DirectDebits"` to preserve the old behavior by default while leaving it
  editable — this was explicitly left as a frontend decision by the spec,
  flagging it here in case that default isn't actually wanted.

Not done / known gaps:
- **No Debit Types picker.** `POST /` and no other endpoint in this app's
  docs exposes a list of available `DebitTypeDTO`s to build a checklist
  against — same gap already flagged in `Registry/Customers/TODO.md` for
  the identical reason. Stub tab left in place (`companyFormConfig.js`'s
  `TABS`, `stub: true`) so it isn't silently forgotten.
- **`GET /count` and `GET /all`** — not used anywhere; `GET /count` has no
  obvious UI need yet, `GET /all` is explicitly "fine for a dropdown, not a
  primary listing" per the spec and this list already uses the paged `GET /`.
- **Time fields** (`timeDurationStartTime`/`EndTime`) are edited as
  `<input type="time">` (HH:mm) and converted to `"HH:mm:00"` on submit,
  and parsed back from whatever `TimeSpan` JSON shape the server returns
  by taking the last 5 characters after any `.` (handles both `"HH:mm:ss"`
  and `"d.HH:mm:ss"`) — not verified against a live response.
- **Company list's expanded row** still shows a fixed hand-picked subset of
  fields (address + a few system settings) rather than everything now
  editable in the drawers — fine for a quick glance, but 60+ fields means
  the expanded view and the edit drawer show very different amounts of
  detail.
