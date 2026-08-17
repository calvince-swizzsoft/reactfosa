# Loan pipeline E2E

This suite exercises the same REST contracts used by the React loan screens,
in small restartable stages:

1. `preflight` — backend reachability and required route registration
2. `provision-user` — create the registrar plus separate appraisal, approval, and verification operators; assign the required FOSA permission mappings
3. `authenticate` — first-password-change/login/token contract
4. `catalogues` — customer and loan setup dependencies
5. `register`
6. `file-tracking` — dispatch and receive the customer's physical file
7. `appraise`
8. `approve`
9. `verify`
10. `disburse` — create, verify/authorize as configured, and post a batch entry
11. `assertions` — final case status, generated loan/savings accounts, and approved/matched stage workflows

Run the safe route check first:

```powershell
npm run test:loan-e2e:preflight
```

The checked-in defaults target the disposable local test database described in
`loan-pipeline.env.example`. Override them through environment variables for a
different test fixture. Never run this suite against production: it creates
users, permission mappings, workflows, loan cases, file movements, accounts,
batch headers, entries, and financial postings.

Each named stage runs its prerequisites first, while `all` runs the complete
sequence. Mutating stages are resumable while a case remains in process. Once a
case is disbursed, a later `all` run intentionally creates the next test case.

```powershell
npm run test:loan-e2e -- register
npm run test:loan-e2e -- file-tracking
npm run test:loan-e2e -- appraise
npm run test:loan-e2e -- approve
npm run test:loan-e2e -- verify
npm run test:loan-e2e -- disburse
npm run test:loan-e2e -- assertions
npm run test:loan-e2e -- all
```

The disbursement authorization queues its entries for background posting. The
runner also invokes the synchronous posting endpoint as a deterministic
fallback. A 409 from that fallback is accepted only after a GET proves that the
dispatcher already moved the entry to `Posted`.

See [RESULTS.md](./RESULTS.md) for the latest executed run and defects found.
