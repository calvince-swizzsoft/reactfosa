# Front Office E2E Results

Campaign date: 2026-08-17  
Target: `http://localhost:58240` (disposable local test database)

| Stage | Result | Evidence |
| --- | --- | --- |
| Preflight | PASS | Authentication and required teller, request, treasury, and bank-linkage routes responded. |
| Fixtures | PASS | Approved customer account, branch, bank linkage, and unlocked teller G/L configuration resolved. |
| Bind teller | PASS | Dedicated E2E teller resolved from the operator JWT `EmployeeId`. |
| Start of day | PASS | Bank-to-treasury and treasury-to-teller float journals posted. |
| Cash deposit | PASS | Above-limit deposit created a two-stage workflow, was approved by separate users, matched, and posted. |
| Cash withdrawal | PASS | Within-limit withdrawal posted and returned a journal. |
| Cheque deposit | PASS | External cheque and deposit journal persisted. |
| Payment voucher | PASS | Voucher withdrawal created its two-stage workflow, was approved, matched, and posted. |
| Cheque transfer | PASS | Deposited cheque appeared in the paged cheque collection and persisted as transferred. |
| Cash transfer | PASS | Transfer request and companion denomination fiscal count persisted; list retrieval passed. |
| End of day | PASS after fix | Fiscal count and teller-to-treasury journal committed. The erroneous balanced-till failure response was fixed and the backend rebuilt. |
| Final assertions | PASS | Customer account remained readable and the transferred-cheque state was verified after close. |

## Defects found and corrected

- Canonical customer-account projection failed on nullable/non-nullable and numeric mappings; explicit mappings were added.
- Deposit/withdrawal authorization responses omitted their request IDs, preventing workflow continuation.
- Payment-voucher ledger setup left the debit G/L empty and overwrote the product account; withdrawals now debit the product control and credit teller cash.
- Payment-voucher authorization had no configured roles in the test setup; the harness deterministically ensures the two required mappings.
- Cash-transfer controller returned/used un-awaited tasks, causing list and create requests to hang; both operations are now awaited.
- Balanced End of Day posted successfully but returned failure because it expected an excess/shortage journal; it now returns the base close journal as success.
- The harness originally treated the transfer summary as a cheque list and redundantly called workflow matching; both contracts were corrected.

The generated `front-office.state.json` is ignored by Git. It retains local IDs
so a failed campaign can resume without replaying already-posted transactions.
