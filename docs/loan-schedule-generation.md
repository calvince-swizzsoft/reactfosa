# Historical repayment schedule generation

Navigation: **Back Office → Operations → Loaning** has separate **Loan Ageing** (`70023`, `/Loaning/LoanAgeing`) and **Repayment Schedules** (`70024`, `/Loaning/RepaymentSchedules`) items, both under parent `70012`. Each page loads only its own data, and the former combined-screen tabs are removed. The SASRA Reports and Loan Reports shortcuts have been removed. Run the rebuilt Utility's normal navigation sync to install these items in the database; its standard Administrator-role seeding grants access. Other roles use the existing module-permission administration.

Repayment Schedules now provides a read-only, server-paged list with **Loan**, **Loanee** and **Disbursed amount**. Each row has a **View schedule** button that opens its latest saved schedule as a non-editable table. If no instalments are saved, the page requests a calculated schedule from the existing proposal endpoint. A compact basis label and info popover distinguish calculated/unconfirmed terms and explain interest exceptions. Viewing does not save or confirm schedules, change ageing eligibility or post transactions. Schedule rows are paginated. For a calculated fallback only, **Save schedule** persists and confirms the proposal through the existing generated-schedules endpoint. It is disabled with an explanation when generation issues prevent confirmation. Existing saved schedules have no save action. The server rechecks the proposal hash and revision to reject stale previews and duplicate saves. No editable schedule inputs are added.

The paged loan-case response includes `loaneeName`, drawn from the customer's individual first/last names or organisation description. This is a DTO/query change only, with no database-schema migration.

The AppService reads the terms stored on the loan case and identifies its original posted disbursement. Current product rates do not replace historical loan rates. Original principal includes the linked capitalized charges and is not reduced by subsequent repayments.

Historical loans saved with periodic charging and upfront recovery are reproduced with periodic interest due on each instalment date. The interpretation is recorded in the proposal terms and saved evidence; the loan's original settings are preserved. This combination never entered the upfront-interest deduction block at disbursement. Product create/edit now rejects it in the client and AppService validation. Upfront charging with periodic recovery remains a separate supported product setting. Other schedule warnings and posting-reconciliation checks still apply.

Periodic schedules apply the loan case's saved minimum interest as a floor for each repayment period (`max(calculated interest, minimum interest)`), followed by its saved rounding rule and currency rounding. The minimum is not added to interest or multiplied by the term for each instalment. Principal allocations and original due dates remain intact. A positive minimum no longer blocks confirmation on its own; the proposal terms and saved evidence record the rule used.

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

## Form 4 Excel adjustments

Form 4 now uses system classifications without requiring dated UI credit reviews. The account list is read-only; adjustments are made in the downloaded workbook.

It exports system classifications and principal exposure as a labelled working copy, including every account and any unresolved exceptions. Blue Excel category, exposure-adjustment, account-inclusion and explanation cells feed the return formulas. Blank categories remain unclassified; exceptions and reconciliation differences remain visible. Excel edits do not update the database.

Regression tests cover removal of the review prerequisite and recalculation after Excel category, exposure and inclusion changes.
