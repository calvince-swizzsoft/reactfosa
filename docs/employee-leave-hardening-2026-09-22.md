# Employee leave fixes — 22 September 2026

This records the implementation following [the leave audit](employee-leave-audit-2026-09-22.md). The audit describes the earlier state, not the current setup.

## Changes delivered

| Audit finding | Implemented behavior |
| --- | --- |
| Recall refunded completed days | Recall requires an effective return date within the remaining approved period. Dates before return remain charged; completed leave cannot be recalled. Future-effective recall remains active until return. |
| Cross-cycle allocation | Chargeable dates are allocated to their own weekly/monthly/yearly cycle. Each affected cycle must have enough balance. |
| Accrual from record creation | Employees now have Employment Start Date. Accrued types require it and earn whole completed service periods; record creation no longer determines accrual. Non-accrued types retain their calendar-cycle allowance. |
| Application permission allowed policy edits | Leave Setup has its own permission, 22028. Existing Administrator and HR Admin roles received it; application permission alone cannot edit setup. |
| Concurrent decisions | Writes run in serializable transactions and take a transaction-owned exclusive lock per employee before validating and changing balances/status. |
| Approval controls | The submitting user and the employee cannot approve/reject their own application. Approval rechecks locking, eligibility, overlap and balance. Submission requires another active authorized employee-linked approver. |
| Historical recalculation | Each application stores its charged dates. Calendar changes do not reprice existing requests. Entitlement/cycle/accrual changes are blocked once a type has history; use a new type/version. |
| Holiday overlap | Holiday queries use overlapping intervals, including a holiday spanning beyond the requested dates. |
| Missing date-aware preview | Create, edit and approval review show requested days and per-cycle entitlement, used, reserved, available and remaining days. Old preview responses cannot overwrite newer selections. List errors are shown as errors. |
| Notifications after commit | A notification-pending flag is saved with submission/decision. Queue failures do not turn a saved operation into a failed operation. A separate retry action retries notification without resubmitting/approving leave. |

Pending leave can now be withdrawn by its employee or submitting user, releasing its reservation. Employee history returns all statuses. Recall/approval responses return refreshed records.

## Applied setup and migration

- Annual Leave remains **30 days per calendar year**, non-accrued, excluding weekends. Public holidays are now excluded, as requested.
- Twelve national public holiday dates for FY2026 were added: 1 January, 20 March, 3 and 6 April, 1 and 27 May, 1 June, 10 and 20 October, 12, 25 and 26 December. Weekend exclusions already cover holidays falling on Saturdays. Maintain future-year and subsequently gazetted holidays in Holiday setup.
- Backend migration: `tools/sql/2026-09-22-leave-calendar.sql`. Apply before running the new API against another database. It adds EmploymentStartDate, ChargedDates, EffectiveReturnDate and NotificationPending.
- Existing charged-date snapshots were backfilled using the policy/calendar present before this setup change. Original policy versions cannot be reconstructed from data that was never stored.
- The existing recalled application retains its prior cancellation treatment; no return date was invented. Employment start dates remain blank until entered from employee records. No leave application was created, approved or recalled during this work.
- Notification retry records queue acceptance, not delivery/read confirmation. It is an explicit retry, not a scheduled outbox worker. A retry after an ambiguous queue failure can send a duplicate notification.

Holiday sources: [Public Holidays Act](https://kenyalaw.org/kl/fileadmin/pdfdownloads/Acts/PublicHolidaysActCap110.pdf), [Mazingira name change](https://www.president.go.ke/president-ruto-signs-into-law-the-statute-law-bill-2024/), [20 March Gazette](https://new.kenyalaw.org/akn/ke/officialGazette/2026-03-18/50/eng%402026-03-18/source.pdf), [Parliament's Easter dates](https://www.parliament.go.ke/sites/default/files/2026-02/The%20Hansard%20-%20Wednesday%2C%2011%20February%202026%20%28P%29.pdf), [Parliament's 27 May holiday listing](https://parliament.go.ke/sites/default/files/2026-05/ORDER%20PAPER%20FOR%20TUESDAY%2C%2026TH%20MAY%202026%20%281%29.pdf).

## Verification and remaining scope

Debug backend and development frontend builds passed. All 42 leave regression assertions and the existing payroll, notice, recovery and SASRA test suite passed. Tests cover holiday intervals, service accrual, cross-year usage, partial/future recall, separate-user approval, locked records, notification outages/retry, withdrawal and transaction/lock use.

The configured SQL login was also checked with competing transaction-owned application locks, without business-record writes. This checks database locking support; it is not a full simultaneous HTTP load test. Browser automation was unavailable, so no interactive screen verification is claimed.

Additional policy features identified by the audit remain separate work: fractional accrual/proration, opening balances and audited adjustments, carry-forward/expiry, partial days, retrospective emergency/sick-leave entry, supporting-document upload and additional leave types. Existing access remains an HR employee-selection workflow, not a new restricted employee self-service portal.

## EF startup migration follow-up

The initial SQL backfill created the four leave columns before EF automatic migration history was updated. Startup therefore attempted duplicate ADD COLUMN operations. The migration SQL generator now reconciles only these four exact columns, checks existing SQL types/nullability, adds missing columns normally, and lets EF record its model through its own migration. No columns are dropped or migration history fabricated. Debug build, seven targeted migration checks and the existing suite passed. The configured database was reconciled; EF model compatibility passes and a second migration performs no work.

