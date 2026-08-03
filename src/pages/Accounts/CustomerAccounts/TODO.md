# Accounts/CustomerAccounts module — remaining work

First pass covers the org-wide paged/search list plus creating accounts
(single, and bulk-by-branch), against `/api/accounts/customer-accounts`.
Not yet done:

- **Single-account detail view** (`GET {id}`) — no drawer/page shows a full
  account's detail yet, only the list row summary.
- **Per-customer account history** (`GET customer/{customerId}` paged, or
  `GET {customerId}/accounts` unpaginated) — would make sense surfaced
  inside `Registry/Customers` (e.g. an "Accounts" tab on a customer detail
  view) rather than here, once that customer-detail view exists.
- **Account-number lookup** (`GET account-number/{accountNumber}`) — no
  dedicated search-by-account-number screen.
- **No edit/delete** — no such endpoints were given for customer accounts.
