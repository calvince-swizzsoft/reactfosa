# Defaulter notice database fixtures — 17 September 2026

User confirmed `(local)` / `SwiftFinancialsDB_Live` is the test database and required existing customers, accounts and products.

Prepared existing loans rather than inserting extra cases onto accounts that already hold a loan. The current notice eligibility logic excludes multiple-case accounts as requiring review. No customer, account or product was created.

| Loan | Customer | Product | Arrears as at 2026-09-17 | Days overdue |
|---|---|---|---:|---:|
| 6 | Seline Kimeli | SUPA SAVER LOAN | 23,333.34 | 45 |
| 9 | NAFTALI ODALO | Education Loan | 13,333.36 | 90 |
| 10 | SAMWEL WARUHIU | SALARY ADVANCE | 50,000.00 | 90 |

All amounts are KSh. Each qualifies for the existing company Reminder policy (30 days, Print, approval not required).

## Changes

- Added revision 2 repayment plans and their instalments, tagged `NOTICE-SEED-20260917`. Revision 1 remains intact.
- Backdated the three loan disbursement dates and their original disbursement/child journal value dates, including corresponding journal-entry value dates.
- Shifted principal due dates into the past. Education-loan interest dates stay unchanged, making that fixture a principal-arrears scenario without invented interest accruals.
- Confirmed principal and interest terms. Loan 10's upfront interest uses the actual ledger charge of 16.66 rather than the unconfirmed draft's rounded 16.67.
- Existing payments, journal amounts, account links and customer/product records remain unchanged. Journal creation timestamps retain their actual creation dates.

Before-change database snapshot: `tmp/notice-seed/before.xml` (gitignored). Do not rerun the seed: it checks its marker and refuses duplicate application. It is specific to this confirmed database and these exact case numbers.

## Verification

The real `LoanAgeingAppService.GetNoticeLoanReport` and `LoanNoticeAppService.Eligible` ran against the database after the seed. Exactly these three target loans qualify, each with an empty ageing Issues list. All 18 original journal entries retained their amounts and account links (see executed check output for definitive count).

Open Loaning → Defaulter Notices, set Arrears as at to `2026-09-17`, and click Find eligible notices. All three are available for generation. No notice has been generated or sent by this seed.