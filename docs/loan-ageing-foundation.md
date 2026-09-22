# Loan-ageing foundation

The subsequent [restructuring and Form 4 implementation](form4-restructuring.md) supersedes the original deferrals of restructuring and classification below. Historical notes are retained to explain the staged implementation.

Implemented 13 September 2026, extended with contractual interest ageing. This is a reusable subsystem; it does not store a one-off classification of the five audited loans.

## Access and workflow

Open **Reports → Loan Reports → Loan ageing**, or **SASRA Reports → Loan ageing and repayment schedules**.

1. Search the server-paged loan-case list. New original disbursements through `PostLoanDisbursementBatchEntry` automatically capture a draft principal schedule.
2. Open a case and review the original contractual due dates and principal instalments. Existing cases without a schedule resolve their source disbursement and show a blank schedule requiring supporting terms. No historical dates are fabricated.
3. Use the optional equal-principal generator only when appropriate to the agreement. It preserves month-end dates, supports monthly intervals and puts the cents residual in the final instalment. Individual dates/amounts can be edited for other schedules. Captured amortized schedules retain their generated principal amounts.
4. Enter contractual interest amounts and their separate due dates. For upfront interest, enter the total once at disbursement and explicit zeros in the remaining rows. Confirm interest terms separately; leaving them unconfirmed preserves principal-only operation. The generator does not infer an approved interest contract.
5. Describe the source terms and confirm the schedule. Saving appends an immutable revision; earlier versions remain visible. Original account/funding/principal identifiers cannot be changed through a schedule correction.
6. Select an as-at date in the ageing report. Open an account row to inspect separate principal and interest allocations or the issues preventing calculation. Combined days overdue requires both components to be resolved.

## Persistence and future lending

Domain entities `LoanRepaymentPlan` and `LoanRepaymentInstalment` map to `swiftFin_LoanRepaymentPlans` and `swiftFin_LoanRepaymentInstalments`. The tables are registered through normal EF entity configurations and automatic migration; no manual table-creation SQL or custom startup seeding was introduced. Automatic data-loss migrations remain disabled.

Each plan belongs to a loan case and customer account and pins its principal G/L, source disbursement journal, original disbursement date, principal amount, allocation-policy version and evidence. Unique indexes prevent duplicate case/revision and plan/instalment numbers. Saving confirmed corrections uses a Serializable write scope and rejects stale revision numbers.

The standard batch-disbursement path saves its draft plan and journal graph in one `JournalEntryPostingService` unit of work. Failure to add the schedule prevents that journal save. The prior lending workflow contains other existing status/schedule writes; this change does not claim to make the entire pre-existing disbursement workflow a single transaction.

Capture is automatic for original loan-case batch disbursements. Other lending paths, such as microloans without a loan case, are detected through principal ledger balances but require onboarding support before they can be aged. The calculation never treats missing schedules as current. Future loans are not limited to audited case numbers or dates.

## Calculation policy

`PRINCIPAL-FIFO-V1`: net principal reductions settle the oldest due principal instalments first across confirmed schedules sharing the account. Same-date ties use case number then instalment number. Prepayments settle future instalments. Refunds and supported repayment reversals reduce the settlement pool, reopening the most recently settled principal. This is a reproducible reporting allocation and creates no financial postings.

Every run uses journal ValueDate, falling back to CreatedDate, strictly before midnight following the as-at date. Due-day principal is not yet overdue; days overdue start the next day. Partial payment leaves the remaining amount tied to the original due date. The result reports oldest unpaid principal date, days past due and generic age bands: Current, 1–30, 31–90, 91–180, 181–360 and over 360 days. These are **not SASRA risk classifications**.

Principal balances use all posted principal movements, including check-off, standing-order and transfer repayments, rather than only the legacy optional arrearage tracker. Original funding is reconciled with each schedule's source journal and child disbursement charges. Additional advances without schedules, unmatched principal increases, ambiguous account links, credit balances and restructuring movements require review.

The portfolio deduplicates shared customer accounts. The all-branch total is reconciled to all current/snapshotted principal G/Ls, including unlinked balances so they cannot disappear from the control total. Optional branch scoping follows customer account ownership and includes its cross-branch postings; its total is an account-ownership total rather than the branch journal trial balance. Portfolio pages return 20 rows by default (maximum 100); account detail and the UI schedule grid are separately paged in the interface.

## Historical reporting and limits

- Schedule corrections apply the latest confirmed/captured revision to historical reports. Prior revisions are retained for review; generated ageing reports are not stored as immutable report runs. Backdated postings may also change historical results.
- The system assesses principal and confirmed contractual interest separately. Restructured schedule/opening-allocation support, qualitative risk assessment and SASRA Form 4/provisioning remain separate steps. The screen and API explicitly disclose this scope.
- Original-schedule correction cannot be used to hide a restructuring. Accounts with restructuring cases or postings remain Needs review.
- The current general journal-reversal workflow does not retain a parent/source journal link. An unlinked reversal that increases principal is therefore flagged as an unmatched increase. Linked-reversal calculation tests cover the engine's supported data shape; they do not imply that this older posting workflow supplies that link.
- The optional legacy arrearage tracker is not a prerequisite. No legacy arrears, repayments or customer loan settings were changed during this implementation.
- Portfolio calculation is set-based for data loading and uses in-memory grouped lookups. Large installations may require further database-side aggregation and benchmarking of the historical posting read; no production-scale performance claim is made.

## Verification

- 37 synthetic calculation assertions cover original schedules, due-day boundaries, partial repayments, prepayments, shared accounts, refunds, linked reversals, credit balances, missing/unconfirmed schedules, funding mismatches, restructuring guards, age-band boundaries and cents rounding.
- Posting-service tests verify that journal and plan additions precede one save, a schedule failure prevents commit, and a missing source journal rejects the request before mutation.
- Existing SASRA tests and real EF model discovery pass, including both new tables.
- Frontend month-end/leap-year/cents validation tests and development build pass.
- Normal EF automatic migration was applied. API, Utility and Windows Service Debug builds were refreshed and their domain/infrastructure assembly hashes verified identical. No background posting service was launched by the agent.
- Live read-only validation resolves the five loan cases independently, retains four unique loan accounts and reconciles KSh 261,000.02 to the principal G/L. The three positive-balance accounts require schedule review; the zero-balance account is Settled. No fabricated schedules were confirmed or financial postings created for the five existing loans.

## Contractual interest extension

The existing plan aggregate now saves nullable interest-receivable and interest-charged G/L references plus `InterestTermsConfirmed`. Instalment rows save nullable `Interest` and `InterestDueDate`. These are additive EF domain/mapping changes. Old rows remain unconfirmed for interest, even when principal is confirmed or settled. New standard disbursements capture generated interest as a draft, with product G/L references; minimum charges, rounding, upfront recovery and changed interest terms require review against the agreement.

The separate interest calculation reads interest-receivable postings through the report cutoff. Debits against the pinned interest-charged G/L are charges, not receipts. Credits against other contra accounts are ledger settlements; this is not a cash-receipts certification. Refunds and explicitly linked settlement reversals reduce the settlement pool. Net settlements allocate oldest contractual interest first across cases sharing an account. Principal payments never settle interest, or vice versa.

The report keeps the booked receivable separate from future contractual interest. `UnaccruedDueInterest` compares cumulative contractual interest due through the date with cumulative charges. Uncharged due interest, charges above agreed total, charge reductions/waivers, ambiguous increases, credit balances and unsupported mappings produce a review result with unknown interest ageing. A zero receivable without confirmed terms/accrual coverage cannot be labelled paid or interest-free. Interest-free terms require explicit zeros. This phase does not create accrual journals, infer variable-rate changes, or authorize waivers; those require their own contractual/posting workflows.

The UI exposes separate principal and interest overdue totals and G/L differences. Combined days overdue is the maximum of the two resolved component ages; it is null if either needs review. The generic combined age band is not a SASRA classification. Interest detail and schedule rows are paged, with compact information popovers and field-aware client/server validation.

28 additional synthetic assertions cover interest due-day boundaries, independent interest dates, upfront recovery, partial payments, prepayments, shared accounts, refunds, linked/unlinked reversals, missing accruals, missing terms, explicit interest-free terms, invalid amounts/dates and restructuring guards.

The additive interest migration and live read-only verification passed: four accounts, principal KSh 261,000.02, booked interest receivable KSh 0.00, and zero differences for both G/L controls. All four accounts require interest confirmation. API, Utility and Windows Service Debug builds contain matching updated models; the frontend development build and regression tests pass. No schedules were fabricated or loan postings changed.


## Loan register expansion

The existing Loan Ageing route now displays Loan Register & Ageing. The loans endpoint includes all cases created through the reporting date, including applications. Current processing stage is separate from risk classification. Added received/application and disbursement dates, applied/approved/disbursed amounts, term, remaining contractual interest and total remaining principal plus interest (excluding fees/penalties). Future uncharged contractual interest is included in remaining interest, not overdue interest. Unknown amounts are never treated as zero.

RiskClassification uses the existing LoanRestructureAgeing category rules: Performing, Watch, Substandard, Doubtful, Loss, including missed-instalment escalation and retained restructuring risk. Not disbursed and Needs review are explicit non-risk states. The original Status ageing-band field remains compatible with notice consumers; notice report scope is unchanged. Register branch filtering follows the loan case branch. Processing stages are current, not historical snapshots.
