# Form 3 — Statement of Deposit Return

Implemented 13 September 2026 for DT SACCOs using the [official SASRA workbook](https://www.sasra.go.ke/download/form3-statement-of-deposit-return/).

- Workbook version: `WORKBOOK-25B1834496BC`; SHA-256 `25b1834496bce1d3f88956fb6e32f86bdb7c2a5383f05b47ccbc18c599071eea`.
- Worksheet `Deposits`: counts in D and amounts in E, in **KSh thousands**. Five decimal places preserve whole-KSh cents. Original labels and `D26`/`E26` sum formulas are retained. The count heading is wrapped to avoid clipping; the sheet is editable.
- Open **SASRA Reports → FORM 3**. The three category mappings apply to all five balance bands. Save creates an immutable revision through existing SASRA/report-template domain entities. No additional tables, custom schema scripts, startup seeding or automatic mapping replacement.

## Saved initial mappings

| Category | G/L | Form 6 source |
|---|---|---|
| Non-withdrawable | 2009 — BOSA DEPOSITS | C44 |
| Savings | 2001 — ORDINARY SAVINGS | C42 |
| Term | 2007 — Fixed Deposit Payable | C43 |

The latest compatible Form 6 supplies suggested mappings when Form 3 has no saved revision. A saved Form 3 revision subsequently remains independent. The existing DT institution registration is used for the workbook heading; it is not requested again in the mapping screen.

## Calculation

One consistent read transaction obtains full closing G/L balances and customer-account-linked deposit postings across all branches. The effective journal date is `COALESCE(ValueDate, CreatedDate)` before midnight after the selected as-at day, matching the existing SASRA ledger query. The financial-year start is a heading, not a lower bound for closing balances.

The SQL aggregates by G/L and customer account. The AppService combines each category's mapped principal and posted-interest balances for the same customer account before allocating a band. Credit balances become positive deposits. Counts represent positive-balance **customer accounts within a deposit category**, not unique members or individual fixed-deposit contracts. A customer account with savings and term deposits counts separately in those categories. Current account status does not remove historical balances. Zero balances are excluded.

The source's printed ranges share endpoints. The implementation explicitly uses: below 50,000; 50,000–100,000 inclusive; above 100,000 through 300,000; above 300,000 through 1,000,000; above 1,000,000. Banding uses whole KSh before conversion to thousands. This policy is disclosed in the screen and preview warnings.

Export is withheld for nonzero balances with missing/orphan customer links, debit deposit balances, unmapped nonzero Form 6 deposit G/Ls, or differences over KSh 0.01 in the full ledger, Form 6 deposit mapping comparison, or customer/G/L reconciliation. Offsetting allocation issues still block export. Mapping saves require existing liability posting accounts without children and prevent duplicate G/L mappings across categories. Server errors use the existing field-aware sanitized envelope; dates and unsaved mappings are also checked in the client.

Mapped posted interest is included only where customer-account links exist. Unposted accrued interest is not inferred from product rates or maturity schedules; review it using supporting schedules and adjust the editable workbook. Excel changes are not saved back into the application.

## Verification

Debug API compilation and SASRA tests pass: 101 Form 3 assertions cover boundaries, principal/interest aggregation, account counts, missing links, debit balances, reconciliations, invalid dates/mappings, workbook cells, source labels, formula preservation and Excel recalculation. A generated workbook was reopened and visually checked through a rendered representation.

Against the current database at 13 September 2026, saved revision 1 contains three mappings. Preview returns 8 non-withdrawable accounts / KSh 41,600; 1 savings account / KSh 4,000; no positive term balances. Total: 9 accounts / KSh 45,600. All three reconciliation differences are zero and Excel generation succeeds. Saved mappings were read back in a fresh scope. No financial postings were created.
