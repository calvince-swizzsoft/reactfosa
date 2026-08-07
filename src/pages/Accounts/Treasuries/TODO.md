# Accounts/Treasuries — remaining work

Covers `Areas/Accounts/Controllers/TreasurysController.cs`
(`api/accounts/treasurys`) against `docs/api/treasury-api-spec.md`.

**Controller moved.** This used to be
`Areas/FrontOffice/Controllers/TreasurysController.cs`
(`api/frontoffice/treasurys`) — that controller no longer exists on disk;
it was removed/merged into the Accounts one (treasury-api-spec.md §5: the
reference app had two controllers managing the same entity, this API
exposes one for both). Every call site (`index.jsx`, `create.jsx`, and
`FOSA/Transactions/CashManagement.jsx`'s destination-treasury picker) was
still pointed at the old dead path and has been repointed here.

Not done / known gaps:
- **No client-side guard against picking a branch that already has a
  treasury** — the spec notes "one treasury per branch" is enforced
  server-side only (surfaces as a `409` on create), and there's no
  "branches without a treasury" endpoint to filter the picker against.
  Would need to cross-reference the treasury list client-side if wanted;
  not built — the 409 message from the server is shown as-is instead.
- **No client-side range validation on Lower/Upper limit** — the DTO has no
  server-side check either (spec §4: "not server-validated at all, no
  `[Required]`, no lower ≤ upper check"). The form doesn't stop a user from
  submitting `0`/`0` or an inverted range; not enforced, matching the
  server's own permissiveness rather than guessing a rule.
- **Description uniqueness is create-only** (spec §4) — `EditTreasuryDrawer`
  doesn't special-case a duplicate-description conflict differently from
  any other update error; the server's `message` is shown as-is either way,
  which is sufficient since update simply doesn't check this rule at all.
