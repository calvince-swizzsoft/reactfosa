# Administration/Banks — remaining work

Covers `Areas/Admin/Controllers/BankController.cs` (`api/administration/banks`)
against `docs/api/bank-api-spec.md`. Module code `20005` now points here.

**Supersedes, but doesn't replace, the legacy combined screen.**
`src/pages/Administration/Bank/BankLinkages.jsx` +
`AddBankWithLinkagesDrawer.jsx` still exist — they're still imported by
`src/pages/Finance/Setup/Setup.jsx` (an unrelated legacy tab-switcher), so
they couldn't be deleted outright. Their write path
(`api/values/AddBankWithLinkages`) was patched to the new `{ Bank,
BankLinkage }` request shape so it doesn't silently misfire, but no other
cleanup was done there — treat this folder as the real Banks screen going
forward, not that one.

Not done / known gaps:
- **No delete action** — `IBankAppService` has no delete operation
  (bank-api-spec.md's history note: the old raw-SQL branch-delete was
  deliberately not ported, and it deleted a *branch*, not a bank, despite
  its name).
- **`Code` is a plain required number input, not validated for
  uniqueness client-side** — the spec confirms it's not server-assigned
  and picking a unique one is the caller's responsibility; a duplicate
  will presumably fail somewhere in the domain factory, surfaced as
  whatever `message` the server returns. Not pre-checked here.
- **Branches are edited as a full-replace array**, matching
  `PUT /{id}`'s real behavior — `EditBankDrawer` always sends the current
  in-memory branch list on save (never omits `Branches` entirely), so
  there's no "leave branches untouched" affordance in this UI even though
  the API technically supports it. Acceptable since the edit drawer always
  loads the existing branches first via `GET /{id}/branches`.
