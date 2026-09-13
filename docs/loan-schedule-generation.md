# Historical repayment schedule generation

Implemented in Loan Ageing: generate proposals for unconfirmed cases on the current server-paged list, inspect their saved terms and instalments, then confirm selected schedules together. Individual loan drawers also have **Generate from saved loan terms**.

The AppService reads the terms stored on the loan case and identifies its original posted disbursement. Current product rates do not replace historical loan rates. Original principal includes the linked capitalized charges and is not reduced by subsequent repayments.

Dates use the original disbursement plus saved grace days. End-of-period payments start one interval later; beginning-of-period payments start at that anchor. Calendar-month intervals retain the anchor day, capped at month end. Numeric payment frequency determines the interval (four payments per year means three months). The legacy generator's Today-based dates are discarded without changing other existing callers.

Principal rounding residuals go to the final instalment, within a bounded cents tolerance. Upfront interest is entered once on the disbursement date using the linked original interest charge. The generator flags missing or inconsistent charge/recovery settings, incomplete interest accounts, unsupported terms, and restructurings. It does not infer interest-free terms from a zero receivable balance.

## API

- `GET /api/backoffice/loan-ageing/cases/{id}/schedule-proposal`: read-only `plan`, `terms`, `warnings`, `canConfirm`, and `proposalHash`.
- `POST /api/backoffice/loan-ageing/generated-schedules/confirm`: array of `{ loanCaseId, revision, proposalHash }`, limited to 100 distinct cases. The server regenerates each proposal, rejects changed or unsafe proposals, then saves confirmed revisions in one transaction. A retry after success is rejected as stale rather than creating duplicate revisions.

These operations use the existing repayment-plan entities and repositories. No schema migration or financial posting is introduced. Proposed schedules are not stored until confirmation.

## Read-only verification on 13 September 2026

| Case | Instalments | First due | Last due | Principal KSh | Interest KSh | Bulk confirmation |
| --- | ---: | --- | --- | ---: | ---: | --- |
| 1 | 1 | 2026-10-01 | 2026-10-01 | 100,000.00 | 33.33 | Available |
| 5 | 1 | 2026-10-02 | 2026-10-02 | 65,000.00 | 21.66 | Available |
| 6 | 3 | 2026-10-02 | 2026-12-02 | 70,000.00 | 116.66 | Available |
| 8 | 1 | 2026-10-02 | 2026-10-02 | 85,000.00 | 28.33 | Available |
| 9 | 12 | 2026-10-08 | 2027-09-08 | 80,000.00 | 5,200.00 proposed | Exception |

Case 9 combines periodic interest charging with upfront recovery and has no matching original upfront charge. The proposal does not claim the calculated interest was paid. No live schedules were confirmed by the verification.

## Pending Form 4 integration

The requested Excel-only adjustment workflow is prepared and tested, but **not applied**: the backend filesystem write permission was declined. The current Form 4 export gate and UI therefore still remain in place.

The prepared change removes UI credit-review and adjustment prerequisites. It exports system classifications and principal exposure as a labelled working copy, including every account and any unresolved exceptions. Blue Excel category, exposure-adjustment, account-inclusion and explanation cells feed the return formulas. Blank categories remain unclassified; exceptions and reconciliation differences remain visible. Excel edits do not update the database.

The prepared patch and matching UI are under `tmp/implement-form4-working-copy.py` and `tmp/form4-working-copy-stage`. Generation/API Debug build, frontend development build, client checks, and 25 generation/staged-workbook assertions passed. Native Excel visual verification has not been performed.
