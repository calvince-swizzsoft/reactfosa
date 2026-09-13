# Form 4 prerequisite audit — five disbursed loans

Audit performed 13 September 2026. Closing position uses journal ValueDate, falling back to CreatedDate, before 14 September 2026. Source: the database configured for the local API. Read-only inspection; no financial postings, settings, schedules or mappings changed. No regulatory classifications were assigned.

## Verified balances

Five loan cases map by customer and loan product to four distinct customer loan accounts. Cases 1 and 8 share one account; they must not be summed twice. All five cases have principal disbursement postings matching their DisbursedAmount (total KSh 400,000).

| Case(s) | Product | Disbursed principal | Principal reductions | Subsequent principal increase | Closing principal |
|---|---|---:|---:|---:|---:|
| 1 and 8, shared account | Salary Advance | 185,000.00 | 16,000.00 | 2,000.00 | 171,000.00 |
| 5 | Salary Advance | 65,000.00 | 65,000.00 | 0.00 | 0.00 |
| 6 | Supa Saver Loan | 70,000.00 | 46,666.66 | 0.00 | 23,333.34 |
| 9 | Education Loan | 80,000.00 | 13,333.32 | 0.00 | 66,666.68 |
| Total | | 400,000.00 | 141,999.98 | 2,000.00 | 261,000.02 |

The independently queried full Loan Principal G/L (1004) equals KSh 261,000.02; no unlinked principal balance was found. The four accounts include three positive balances and one zero balance. These are account counts, not an assertion about the number of separately outstanding loan contracts. Interest Receivable G/L (1003) is zero; this does not establish that all contractual interest has been charged correctly.

### Cases 1 and 8

- Case 1: KSh 100,000 disbursed 1 September; case 8: KSh 85,000 disbursed 2 September. Both are one-month loans with monthly frequency, no grace period, APR 0.4%, and upfront interest charge/recovery in their saved terms.
- KSh 1,000 principal recovered by standing order on 1 September, then credits of KSh 10,000 and KSh 5,000 with test narrations on 9 and 10 September. A KSh 2,000 Refund journal increases principal on 11 September. The latter credits/refund require provenance and allocation review before treating them as instalment settlements for a specific case.
- The main standing order, originally created on 1 September, now carries LoanAmount/Principal KSh 85,000, start 2 September, end 30 September. Expected/actual run dates remain 1 September, before its current start date. It does not preserve a separate current schedule for the earlier KSh 100,000 advance.
- A second unlocked order carries principal KSh 1,000 and LoanAmount zero. Its single execution-history record shows ExpectedRunDate and ActualRunDate of **0002-02-01**, despite creation on 1 September 2026. Current order dates have since advanced to 1 October; this does not repair the historical record.
- Posted upfront interest: KSh 33.33 and KSh 28.33 charged and recovered, net receivable zero.

### Case 5

KSh 65,000 disbursed 2 September and repaid through check-off on 9 September; principal and interest receivable are zero. Saved terms: one month, monthly frequency, no grace period, APR 0.4%, upfront charge/recovery. Upfront interest KSh 21.66 was charged and recovered. The standing order remains unlocked with principal KSh 65,000 and duration 2–30 September, despite the zero principal balance. Disbursed status by itself therefore cannot determine inclusion in an outstanding portfolio.

### Case 6

KSh 70,000 disbursed 2 September; two check-off principal credits of KSh 23,333.33 dated 9 and 10 September leave KSh 23,333.34. The second was created on 11 September with a 10 September value date: historical reporting must consistently use the chosen effective-date policy. These are separate journals, not automatically duplicate errors. Saved terms: three months, monthly, no grace, APR 1%, upfront charge/recovery. KSh 116.66 interest was charged and recovered upfront. Standing order principal is KSh 23,333.33, interest zero, start 2 September/end 2 November; PaymentPerPeriod includes interest (KSh 23,391.66). Do not count that displayed gross instalment as remaining interest due again. No standing-order execution history exists for the two check-off repayments.

### Case 9

KSh 80,000 disbursed 8 September (KSh 100,000 was applied for, not disbursed). Two check-off principal credits of KSh 6,666.66 dated 9 and 10 September leave KSh 66,666.68. Saved terms: 12 months, monthly, no grace, APR 12%, **periodic charging but upfront recovery**. Standing order principal is KSh 6,666.66, interest zero, PaymentPerPeriod KSh 7,466.66, duration 8 September 2026–8 August 2027. No interest-receivable postings were found for this account. This combination needs a confirmed interest-treatment policy before ageing interest; the zero posted balance alone does not prove no interest obligation. No execution history exists for its check-off repayments.

## Cross-cutting findings

1. Arrears tracking is false on all five saved loan cases and all their current products. The database has only two arrearage records, both zero, attached to the shared Salary Advance account. They are not evidence that the portfolio has no arrears.
2. There are five distinct standing orders associated with the four loan accounts, but only one distinct execution-history record. Joining cases directly would duplicate the shared account's orders/history and balances.
3. Repayments are attached to CustomerAccountId; JournalEntries have no LoanCaseId or instalment allocation. Disbursement references identify case numbers, while subsequent repayments/refunds do not reliably identify a case. A case-level split cannot be asserted from the existing direct links.
4. Current schedule generation starts at DateTime.Today plus grace period. Re-running it on the reporting day would move historical due dates. Original contractual first-payment dates need to be resolved rather than inferred solely from a current standing order or loan term.
5. No Restructured-status cases were found in this dataset. The restructuring path therefore cannot be validated against a real example in these five cases. Existing code creates a new case and updates an existing standing order; historical schedule versions need explicit support.

## Relevant implementation evidence

- `Application.MainBoundedContext/BackOfficeModule/Services/LoanDisbursementBatchAppService.cs:661`: finds existing standing orders by savings/loan account pair and updates the first; sets the loan amount and dates to the new disbursement's schedule. This explains why a shared account does not retain independent current schedules per case.
- `Application.MainBoundedContext/Services/FinancialsService.cs:160`: schedule entry point has no original disbursement/first-due-date parameter; its generators use today's date.
- `Domain.MainBoundedContext/AccountsModule/Aggregates/CustomerAccountArrearageAgg/CustomerAccountArrearage.cs`: account, category, amount and reference, without instalment/due-date linkage.
- `CustomerAccountArrearageSpecifications.cs`: historical filter uses CreatedDate, not the contractual due date.
- `Application.MainBoundedContext/BackOfficeModule/Services/LoanCaseAppService.cs:1846`: restructuring creates a new loan case and replaces standing-order terms.

## Next implementation decisions

Before Form 4 classification, establish the contractual schedule and repayment-allocation policy for shared accounts, validate the Salary Advance history dates, and resolve Education Loan interest treatment. Build an as-at schedule calculation using original effective dates and all repayment channels, with explicit handling for reversals/refunds and cents rounding. Preserve schedule revisions and case/instalment allocations through domain entities and normal EF migrations where required. Do not silently rewrite existing postings, infer performing status from empty arrears, or use the five Disbursed case records as five independently aged account balances.
