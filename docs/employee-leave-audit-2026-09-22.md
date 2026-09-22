# Employee leave audit — 22 September 2026

## Scope and evidence

Reviewed leave types, holidays, application creation/editing, approval/rejection, recall, entitlement calculation, API permissions, notifications and the corresponding React screens. Inspected the configured database read-only. Executed six isolated scenarios against the compiled `LeaveApplicationAppService` and holiday specification, using in-memory dependencies. No live leave records were created, edited, approved or recalled; no notifications were sent. No implementation fixes were made as part of this audit.

This is a functional and configuration audit, not a determination of statutory compliance. Browser interaction and concurrent database requests were not exercised. Findings explicitly identified as code-review risks have not been reproduced against live data.

## Current configuration

- One leave type: **Annual Leave**, unlocked, 30 days, yearly, non-accrued, all genders.
- Weekends excluded; public holidays **not** excluded.
- **Zero active holiday records.** Enabling holiday exclusion alone will therefore not change current results until a calendar is populated.
- One recorded leave application, status **Recalled**; no pending or approved applications in the inspected data.
- Employee records have `CreatedDate`, but no dedicated employment commencement date. Accrual currently uses the record creation date.

## Findings

### 1. High — recall refunds days already taken

`LeaveApplicationAppService.cs:166` accepts any Approved application, including completed leave. It changes the whole application to Recalled; the balance calculation at line 360 counts only Pending and Approved applications. There is no effective return date or retained consumed portion.

**Reproduced:** recalling a completed five-day application changed the remaining balance from 25 to 30.

**Fix:** distinguish cancellation before leave begins from recall after it begins. Record a return date, retain days already taken, and return only unused chargeable days. Restrict retrospective corrections to an explicit adjustment operation.

### 2. High — leave spanning entitlement cycles is allocated entirely to the starting cycle

`LeaveApplicationAppService.cs:360` selects consumption by application start date, then counts the entire application at line 365.

**Reproduced:** a calendar-day application from 30 December 2026 to 4 January 2027 leaves the January 2027 balance at the full 30, despite covering four January days. The same selection problem applies to weekly and monthly cycles and to working-day policies.

**Fix:** allocate chargeable dates to each entitlement cycle, and validate each affected cycle separately. Define carry-forward rules independently.

### 3. High — accrued entitlement uses record creation and credits full periods in advance

`LeaveApplicationAppService.cs:337` uses `Employee.CreatedDate`; `GetAccruedPeriodCount` at line 398 adds one full period immediately and counts calendar boundaries rather than completed service periods.

**Reproduced:** a synthetic employee created on 31 December with 30 accrued days per year receives 30 days immediately and 60 on 1 January. This is not gradual accrual. Current Annual Leave has accrual disabled, so this defect is latent in the current setup.

**Fix:** add employment commencement/opening-balance data and explicitly choose earned accrual versus entitlement granted at the start of a cycle. Implement proration, carry-forward and expiry as separate policy settings.

### 4. High — application permission also allows leave policy changes

`LeaveTypeAppService.cs:22,136` and `LeaveTypesController` use module **22016 (Leave Application)** for both reading and writing leave types. A user granted application access also has API permission to change entitlement and calendar rules. There is no separate configuration permission here.

**Evidence:** controller and service review; no unauthorized requests were made.

**Fix:** give leave setup its own administrative permission. Retain application access only for reading eligible types and submitting permitted applications. Define whether application access is HR-wide or employee self-service: current endpoints permit acting on any selected employee and do not enforce ownership.

### 5. High — concurrent requests can bypass balance and overlap checks

Creation/editing read existing applications and calculate a balance before saving under a normal scope (`LeaveApplicationAppService.cs:74,100`). Approval and recall also use a normal read-then-write scope. The entity mapping has no row-version/concurrency token or conditional status update.

**Code-review risk, not load-tested:** two simultaneous applications can both see the same available balance or no overlap and both save. Two decisions can both read Pending and overwrite each other.

**Fix:** serialize balance/overlap decisions per employee across relevant leave types, and enforce expected-status transitions atomically. Add concurrency regression tests.

### 6. High — approval does not revalidate eligibility or separate applicant and approver

`LeaveApplicationAppService.cs:131` checks caller role, existence and Pending status, then authorizes. It does not recheck employee/type locking, current balance, overlap, or the identity of the applicant/submitting user.

**Reproduced:** the submitting user approved an application after both its employee and leave type were locked. Same-user approval is currently allowed; whether it should be prohibited requires an explicit organizational policy.

**Fix:** revalidate eligibility at approval, define separate-user approval rules and appropriate exceptions, and use the employee/user relationship rather than `CreatedBy` alone to identify an employee approving their own request.

### 7. Medium — changing configuration rewrites historical consumption

`LeaveApplicationAppService.cs:365` recalculates old requests with today's leave-type settings and holiday records. Applications persist dates and a balance snapshot, but not a policy version or immutable charged-day breakdown.

**Reproduced:** changing weekend exclusion changed a previously approved seven-calendar-day request from five charged days to seven; remaining balance moved from 25 to 23 without an adjustment entry.

**Fix:** retain charged-day allocations and the policy applied when approved. Make subsequent corrections explicit and auditable.

### 8. Medium — overlapping holiday ranges can be missed

`HolidaySpecifications.cs:40` finds only holidays wholly contained within the requested leave interval, rather than every overlapping holiday. The application service clips returned ranges correctly, but the query can exclude them first.

**Reproduced:** a holiday covering 24–26 December was not selected for a leave request on 25 December.

**Fix:** use interval-overlap matching. Populate and maintain the holiday calendar; current Annual Leave also requires an intentional decision on whether public holidays should count.

### 9. Medium — the screens do not expose the information needed to review balances

`Leave/Application/create.jsx:63` fetches balance only for employee/type. The endpoint calculates it as of today, whereas submission validates against the requested start date. The screen shows neither chargeable days nor the resulting balance and does not refresh its preview when dates change. Responses are not guarded against out-of-order completion after switching employees/types.

The edit drawer has no balance preview. The Approval screen shows employee/type/date range/reason, but no entitlement, charged days, remaining balance or detailed history. Approval and Recall list failures are converted into empty lists, hiding permission/server failures.

**Fix:** provide one server-calculated preview for the exact requested dates and excluded application ID when editing. Show available/reserved/used/requested/remaining amounts to applicants and approvers. Display errors distinctly from empty results.

### 10. Medium — notification failure can make a saved operation appear unsuccessful

`LeaveApplicationsController.cs:162,167` commits the application before queuing approver emails. Notification exceptions can then return an error even though the request exists. Approval similarly commits at `LeaveApplicationAppService.cs:153` before invoking the broker. A retry encounters an overlapping application or an already-decided request.

**Code-review finding; no notification failure was injected into the live system.**

**Fix:** persist notification work with the state change and retry dispatch independently; return the saved operation's actual outcome to the caller.

## Additional operational gaps

- No employee withdrawal/cancel action for a Pending request; rejection is the only available release path.
- No effective recall/return date, partial-day request, employee balance ledger, opening balance, carry-forward cap/expiry or administrative adjustment workflow in the reviewed implementation.
- Backdated applications are rejected for every leave type. Decide how HR should record emergency/sick leave reported after it begins.
- Supporting-document fields exist in the model, but the leave form provides no attachment workflow.
- `FindLeaveApplicationsByEmployeeId` uses the active-today specification, so consumers expecting complete employee leave history receive only currently active approved leave (`LeaveApplicationAppService.cs:208`).
- Recall returns the previously fetched DTO without refreshing status/audit fields (`LeaveApplicationsController.cs:293`); the current screen hides this by reloading the list.
- Several controller comments describe older balance/status behavior and no longer match the service.

## Controls already present

- Role checks for application, approval and recall, with write checks repeated in the AppService.
- Pending-only edits/decisions and Approved-only recall.
- Server-side checks for employee/type existence and locking, gender eligibility, positive entitlement, valid cycles, date ordering, nonzero chargeable days, overlap and balance at submission.
- Pending applications reserve balance, reducing ordinary sequential overbooking.
- Type names are checked for duplication and locked types are filtered out of the new-application picker.
- Create checks that an active employee-linked user has approval permission before accepting a new application.
- Authorization/recall actor, date and remarks are stored; notifications are wired but delivery was not tested in this audit.

## Recommended implementation order

1. Correct recall and per-cycle consumption; preserve historical charged days.
2. Separate setup permissions; enforce atomic application/decision checks and agreed approval separation.
3. Define commencement dates, accrual, opening balances and carry-forward policy.
4. Populate holidays and complete the organization's required leave types after policy confirmation.
5. Add date-aware application previews, approver details, withdrawal and balance history; make notifications retryable independently.
