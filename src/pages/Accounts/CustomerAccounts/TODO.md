# Accounts/CustomerAccounts module — remaining work

First pass covers the org-wide paged/search list plus creating accounts
(single, and bulk-by-branch), against `/api/accounts/customer-accounts`, per
`SwiftFinancialz/docs/api/customer-accounts-api-spec.md`.

**Backend history note, resolved, nothing to change here:** this controller
used to hit a buggy raw-SQL path (corrupted string fields on `GET /{id}`,
`InvalidCastException` on newly-created accounts with no transaction history)
that has since been deleted in favor of the proper domain-layer service.
Checked this codebase for client-side workarounds for either bug — found
none (there was never a `GET /{id}` single-account call anywhere in this
app, and `CustomerAccountDrawer.jsx`'s create handlers never parsed
per-field values out of the response), so nothing to remove.

**Bulk-create (`POST /customer/{id}/branch/{id}`) response shape:** `data`
is the customer's full current account list (re-fetched after the
operation), not just what this call created — `CustomerAccountDrawer.jsx`
never parses `data` from that response at all (just shows the server's
`message` and refreshes the list), so this was already correct; added a
comment there plus a status-code-based icon (`201` = something created,
`200` = success but nothing new needed) so the info/success distinction the
spec calls out is visible in the UI, not just the message text.

The "Manage" (gear) icon on each list row opens `CustomerAccountDetailDrawer.jsx`
— covers `CustomerAccountManagementController` (`managementApi.js`,
Activate/Freeze/Close/Remark/Signing-Instructions actions + history) and
`CustomerAccountSignatoryController` (`signatoryApi.js`, list/add/bulk-remove
signatories), per
`SwiftFinancialz/docs/api/customer-account-management-api-spec.md` and
`customer-account-signatory-api-spec.md`. The Overview tab reuses the row
object already in memory from the list fetch rather than calling `GET
{id}` — this is deliberate, not just unbuilt: `GET /{id}` is documented as
excluding balance fields entirely (`bookBalance`/`availableBalance` come
back `0`/default, by design, to avoid the now-deleted raw balance-fetch
bug), so switching Overview to it would lose the Book Balance display the
list row already has. Net effect: Overview can go stale on non-balance
fields (status, etc.) until the drawer is reopened after an Activate/
Freeze/Close, since `onSuccess` refreshes the underlying list but not the
drawer's own copy of `account` — a real gap, but not one `GET /{id}` alone
would fix without also re-adding a second balance-fetch call.

Not yet done:
- **Per-customer account history** (`GET customer/{customerId}` paged, or
  `GET {customerId}/accounts` unpaginated) — would make sense surfaced
  inside `Registry/Customers` (e.g. an "Accounts" tab on a customer detail
  view) rather than here, once that customer-detail view exists.
- **Account-number lookup** (`GET account-number/{accountNumber}`) — no
  dedicated search-by-account-number screen.
- **No edit/delete on the account itself** — no such endpoints were given
  for customer accounts (signatories have their own add/remove, see above).
- **No signatory edit** — the domain layer only has Add and bulk-Remove per
  the spec, so "editing" a signatory in the UI would mean remove + re-add;
  not built as a single flow, just the two separate actions.
