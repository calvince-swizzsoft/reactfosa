# Customers module — remaining work

First pass covers Individual customer registration only (list + create), against
`POST /api/registry/customer` (`CustomerController.cs:464`). Not yet done:

- **Partnership customer registration.** Same drawer shell, but the "particulars"
  tab uses `nonIndividualDescription`, `nonIndividualRegistrationNumber`,
  `nonIndividualRegistrationSerialNumber`, `nonIndividualDateEstablished`
  instead of the `individual*` fields. `Type: 1`.
- **MicroCredit customer registration.** Same non-individual fields as
  Partnership, different `Type` value (`3`).
- **Wire up the remaining stub tabs** in `create.jsx`: Credit Types, Debit
  Types, Specimen, Capture Specimen. (Investment Products and Savings
  Products are done — checklist tabs populated from
  `/api/accounts/investmentsproducts` / `/api/accounts/savingsproducts`,
  feeding `additionalInvestmentProducts` / `additionalSavingsProducts` as
  `{ id }` per the current `CreateCustomerRequest` — company-mandatory
  products now auto-attach server-side, so these arrays are opt-in extras
  only.) Debit Types still maps to `additionalDebitTypes` but has no picker
  UI yet (no credit-type equivalent field exists on `CreateCustomerRequest`
  — confirm with backend if one is needed).
- **Edit / Delete / View actions** on the Customers list — no update or delete
  endpoint was available yet when this was built.
- **`individualNationality`** is a bare numeric input right now (no enum or
  lookup endpoint was known). Replace with a proper `Select` once the real
  value list (or a lookup API) is confirmed.
- **`durationStartDate`/`durationEndDate`** are silently sent as today's date
  and not exposed in the UI. Revisit if they turn out to need to be
  user-editable (e.g. a membership validity period).
- **Station dropdown now uses `GET /api/registry/station`** (paged,
  `pageIndex=0&pageSize=1000` to approximate "all" since no `/all` variant
  was confirmed for this controller). Revisit if station counts ever
  exceed 1000, or once/if an unpaged `all` route is confirmed to exist —
  swap to that instead of the large-pageSize workaround.
