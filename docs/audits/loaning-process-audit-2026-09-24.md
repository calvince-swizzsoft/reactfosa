# Loaning process audit

Date: 24 September 2026. Scope: the current local frontend (`Swizzfinancial-FOSA2`) and backend (`SwiftFinancialz2`), including uncommitted changes.

## Assessment

The main loan lifecycle is implemented, but it is not consistently protected at its backend boundaries. Resolve the critical authorization and transaction-ordering findings before relying on the workflow as a financial control. A hidden menu or a disabled button does not prevent a caller with a valid login from reaching an API.

This audit identified **2 critical, 6 high, and 1 medium findings**. Seven isolated probes reproduced specific control failures. Existing regression tests also passed; these test results are compatible because the existing suite covers different behaviors.

This is a source and isolated-test audit, not a certification of the deployed system, its financial balances, or regulatory compliance. No customer records, permissions, or balances were changed. Application fixes are outside this audit deliverable. Only the report and diagnostic probe project were added.

## Process reviewed

| Stage | Implementation reviewed | Assessment |
|---|---|---|
| Intake and registration | Loan requests, loan-case creation, customer/product checks, guarantors, collateral, frontend registration | Meaningful validation exists; registration and supporting records/workflow are committed in separate operations. |
| Appraisal | Worksheet, appraisal action, assigned workflow | Case status checks exist; workflow failure can occur after the case transition. |
| Approval | Approval action, repayment calculation, workflow completion | Assigned-role checks exist when a workflow exists; missing workflows and late maker-checker checks undermine enforcement. |
| Verification | Audit action, accounts and standing-order preparation | State transition exists; shares the workflow ordering problem. |
| Disbursement | Batch creation, audit, authorization, single/bulk entry APIs, posting and retry | Highest concentration of control gaps. |
| Repayment and arrears | Plan capture/confirmation, ageing, recovery code and regression tests | Stronger revision and recovery controls exist, but plan/risk mutations lack specific permission checks. |
| Restructuring | API, AppService transaction, UI account lookup, regression tests | Atomic restructuring tests pass; permission mapping fails open when empty, and account lookup loads the full population. |
| Reporting | Existing schedule/risk/reporting tests and preceding Form 9 fixes | Calculation tests pass; this does not establish completeness or accuracy against real balances. |

## Findings

Backend source paths below are relative to `../SwiftFinancialz2`. Line numbers describe the audited working tree.

### L01 — Critical: disbursement actions do not enforce financial roles or separation of duties

**Evidence:** `WebApplication1/Areas/Accounts/Controllers/LoanDisbursementBatchController.cs:66`, `:200`, `:210`, `:459`, `:481`; `Application.MainBoundedContext/BackOfficeModule/Services/LoanDisbursementBatchAppService.cs:184`, `:223`, `:526`, `:1933`.

The controller requires authentication, but audit, authorization, and direct entry posting have no specific role checks. The AppService does not supply these checks either. Audit and authorization record actor names without rejecting the creator or previous approver. The direct posting path marks a pending entry Posted without checking that its parent batch has been authorized.

**Reproduced:** the real AppService accepted a header with an empty role list, allowed the creator to audit and then authorize the same batch, and reached the broker dispatch call. A separate probe moved an entry to Posted while its parent batch remained Pending. These are isolated service/control reproductions, not actual money movements.

**Impact:** a logged-in caller can reach disbursement operations outside the intended financial roles and bypass the batch approval sequence. Downstream posting still depends on valid accounts, periods, and loan data; those are not substitutes for authorization.

**Fix:** enforce explicit origination, audit, authorization, and posting permissions in the business layer; validate branch scope and distinct actors; require the persisted parent batch to be authorized before posting. Revalidate these rules for every single, bulk, and retry path.

### L02 — Critical: loan transitions commit before maker-checker/workflow completion

**Evidence:** `WebApplication1/Areas/BackOffice/Controllers/LoanCaseController.cs:992`, `:1063`, `:1070`, `:1151`, `:1660`; `Application.MainBoundedContext/BackOfficeModule/Services/LoanCaseAppService.cs:359`; `Application.MainBoundedContext/AdministrationModule/Services/WorkflowAppService.cs:420`.

Appraisal, approval, and verification save their case transition before calling `CompleteLoanStageWorkflow`. The workflow service then performs its maker-checker validation and may throw. The controller does not wrap both operations in one AppService-owned transaction.

**Trigger:** a caller holds the assigned final-stage role but fails the workflow's creator/latest-approver check. The preliminary loan-stage check does not perform that check. The case can already be advanced when workflow completion rejects the caller. A persistence failure during completion has the same partial-success shape.

**Impact:** an error response can accompany a saved financial decision; the case and its workflow can disagree, and the maker-checker rejection comes too late to prevent the state change.

**Fix:** move the complete stage operation into an AppService transaction. Validate actor eligibility and required approval counts before mutation; commit the loan transition, workflow completion, and next-stage origination together. Test that a maker-checker violation or workflow-save failure leaves every record unchanged.

**Validation:** confirmed by source and save ordering; no live transaction was attempted.

### L03 — High: the generic loan edit route permits changes after approval/disbursement

**Evidence:** `WebApplication1/Areas/BackOffice/Controllers/LoanCaseController.cs:668`; `Application.MainBoundedContext/BackOfficeModule/Services/LoanCaseAppService.cs:1027`; `Infrastructure.Data.MainBoundedContext/Repositories/Repository.cs`, `Merge`.

`PUT /api/backoffice/loancases/{id}` accepts a full `LoanCaseDTO` and calls `UpdateLoanCaseAsync` without a stage permission or editable-state check. The service recreates the entity from caller-supplied customer, product, branch, amount, interest, term, security and audit-bypass fields, merges it, then restores only selected identity/status fields. The original lifecycle status therefore survives changes to the basis on which that status was approved. Other scalar decision values can also be overwritten by the newly created entity's defaults.

**Impact:** an approved or disbursed case can be changed without reappraisal, potentially disagreeing with its accounts, schedule, security, and approval evidence.

**Fix:** replace the full DTO update with an allowlisted draft-edit command; enforce permission and Registered/Deferred state in the AppService. Use explicit amendment/restructuring operations for later changes, preserving decision history. Add optimistic concurrency checks.

### L04 — High: absent workflows or permission mappings allow processing

**Evidence:** `WebApplication1/Areas/BackOffice/Controllers/LoanCaseController.cs:1536`, `:1561`, `:1639`; `WebApplication1/Areas/BackOffice/Controllers/LoanRestructuringController.cs:96`.

`ValidateFinalLoanStageItem` returns success when no workflow is found, before testing caller roles. `ValidateMappedPermission` also returns success for an empty mapping. Restructuring rejects an unauthorized role only when mappings exist. Registration now requires configured appraisal approvers, but that does not protect imported/older cases, later stages without mappings, or a case left without a workflow after an earlier failure.

**Reproduced:** the actual loan-stage helper accepted an approval call with no workflow, no workflow item ID, and an empty role list.

**Fix:** deny sensitive mutations when configuration or workflow is missing. Provide a controlled repair process for older cases; do not turn missing configuration into unrestricted access. Test absent, empty, unrelated, and valid role mappings.

### L05 — High: bulk batch attachment bypasses the single-entry eligibility checks

**Evidence:** `WebApplication1/Areas/Accounts/Controllers/LoanDisbursementBatchController.cs:375`; `Application.MainBoundedContext/BackOfficeModule/Services/LoanDisbursementBatchAppService.cs:291`, `:390`, `:495`, `:519`.

Single-entry attachment checks Pending batch, Audited loan, unbatched status, branch equality, and product category against persisted entities. Bulk attachment omits these checks. Its existing-entry branch compares category with a value supplied in the DTO; its empty-batch branch omits even that category check. It also commits the loan's `IsBatched` flag before a separate bulk insert creates the entries.

**Impact:** the bulk route can attach ineligible loans or modify a batch after review. A bulk-insert failure can leave loans marked batched without the corresponding entries. Successful single-entry validation does not protect this route.

**Fix:** share one eligibility validator across single and bulk commands; resolve all eligibility data from persisted records. Insert entries and set loan batching flags in the same transaction. Add database-backed uniqueness and concurrent attachment tests.

### L06 — High: posted entries can be deleted and arbitrary numeric statuses accepted

**Evidence:** `WebApplication1/Areas/Accounts/Controllers/LoanDisbursementBatchController.cs:401`, `:432`; `Application.MainBoundedContext/BackOfficeModule/Services/LoanDisbursementBatchAppService.cs:338`, `:371`.

Entry removal does not restrict batch/entry state. It deletes the entry and clears the loan batching flags, including for posted work. The generic status update tests numeric ordering and casts to a byte rather than validating a legal transition.

**Reproduced:** the service removed an entry from a Posted batch and cleared `IsBatched` on a Disbursed loan; another probe successfully set an entry status to `255`.

**Impact:** posting evidence can be removed or rendered inconsistent with the ledger and case. Invalid statuses can make entries disappear from operational queues.

**Fix:** allow removal only from editable Pending batches with unposted entries. Replace generic status writes with named, authorized transitions. Retain posted evidence and use linked reversal/correction records when needed.

### L07 — High: the complete batch-disbursement operation is not atomic

**Evidence:** `Application.MainBoundedContext/BackOfficeModule/Services/LoanDisbursementBatchAppService.cs:526`, `:645`, `:1145`, `:1933`; `Application.MainBoundedContext/BackOfficeModule/Services/LoanCaseAppService.cs:2047`; `Application.MainBoundedContext/Services/JournalEntryPostingService.cs:162`.

The entry's Posted status is saved first. The code then calls `MarkLoanCaseDisbursed`, which saves the case and can activate its standing order. Only later does it save the funding journals and captured plan. The direct API entry-post call has no outer transaction enclosing those operations. A failure after case marking can leave the case Disbursed without the funding journal; its retry guard then refuses re-entry because the case is no longer Audited.

The batch authorization operation separately saves the batch as Posted before dispatching its entries to the broker. A dispatch failure can therefore leave a Posted batch without successful dispatch.

**Reproduced:** the posting guard accepts a second call while the first entry is Posted but its loan is still Audited. This confirms the guard is not an exclusive claim; it does **not** by itself prove duplicate committed journals under a real concurrent database workload. Duplicate disbursement remains a concurrency risk requiring a dedicated database test.

**Fix:** commit funding, schedule, case state, entry state, and standing-order activation as one business transaction; use a stable posting idempotency key and an atomic worker claim. Use a transactional outbox for broker dispatch and explicit processing/failed/completed states.

**Existing protection:** `BulkSaveLoanDisbursement` saves the journals and plan together and its tests pass. That narrower transaction does not include the earlier case/entry mutations.

### L08 — High: repayment schedule and risk-review changes lack specific authorization

**Evidence:** `WebApplication1/Areas/BackOffice/Controllers/LoanAgeingController.cs:13`, `:27`, `:37`, `:40`; `Application.MainBoundedContext/BackOfficeModule/Services/LoanAgeingAppService.cs:55`; `LoanAgeingAppService.Generation.cs:61`; `LoanAgeingAppService.Form4.cs:20` (same service directory).

The plan-save, generated-schedule confirmation, and risk-review endpoints have class-level authentication but no operation-specific role checks. Their services validate dates, financial consistency, evidence, revisions and risk constraints, but not caller authorization.

**Impact:** an authenticated caller who supplies otherwise valid data can revise contractual schedule dates or submit risk-review inputs without holding the intended reporting/credit role. These changes influence ageing and reporting even though validation prevents certain invalid values.

**Fix:** enforce schedule-maintenance, schedule-confirmation and risk-review permissions plus branch scope in the AppService; apply an independent approval where institution policy requires it. Test valid data with unauthorized callers, not only invalid data.

### L09 — Medium: restructuring account search downloads the full account population

**Evidence:** frontend `src/pages/Loaning/Restructuring/index.jsx:128`; `src/pages/Accounts/BatchProcedures/lib/EntryPickerModal.jsx:17`, `:62`, `:69`.

The restructuring picker uses the generic component that fetches successive pages before filtering locally. Typing a name does not issue a server search. This avoids a first-page-only bug but makes a large loan-account population slow and costly to load; a configured maximum-page cap can still exclude later results.

**Fix:** use a debounced server-backed loan-account picker with explicit pagination and cancellation. Validate behavior against datasets larger than a page and larger than the current maximum-page cap.

## Controls that already work in the reviewed implementation

- Appraisal, approval and verification AppServices check the expected prior lifecycle status.
- Single-entry disbursement attachment checks the persisted loan status, batch state, branch and product category.
- Workflow approval verifies the persisted assigned role and lock state, and contains a maker-checker check. L02 concerns when that check runs relative to the loan commit.
- Approval builds repayment amounts from the server-generated schedule rather than silently accepting caller repayment overrides.
- Schedule maintenance validates the original account/principal/journal link, revisions and supporting evidence. Generated confirmations verify proposal hashes.
- Recovery uses a request ID, a unique database key, serializable processing, a preview basis hash, and case-level serialization. Its allocation/posting tests passed.
- Restructuring uses a serializable transaction; existing tests cover rollback on schedule capture failure, prior classification handling, and loan/schedule consistency.
- Form 9 module-source and blank-search defects fixed earlier in this session are not counted as outstanding findings here.

## Verification and limits

Built the new probe project and its referenced backend projects in **Debug**. Ran seven probes successfully against real control methods with in-memory repositories, scopes and broker dependencies. The probes assert the current undesirable behavior, so their success means the defect was reproduced. A correct repair should require changing these into prevention tests.

Re-ran `Sasra.Tests.exe`; the suite completed successfully. Loan-related output included 80 ageing, 253 notice, 959 recovery, 28 interest-ageing, 40 restructuring/Form 4 and 25 historical-generation assertions, plus atomic restructuring and journal/plan checks. These counts are the suite's own reported assertions, not independent coverage percentages.

No authenticated live-user walkthrough, real disbursement, database mutation, broker failure injection, or concurrent database posting test was performed. Deployed binaries, actual role/branch mappings, balance reconciliation, external payouts, and historical data quality remain unverified. This audit sampled the principal and supporting loan paths; it is not an exhaustive review of every legacy/WCF method or every loan product formula. Existing documentation was used for orientation and checked against current code, because some workflow notes describe older behavior.

## Recommended remediation order

1. **Block unauthorized financial actions:** L01, L02, L03 and L04. Add negative-permission and maker-checker rollback tests at the HTTP and AppService boundaries.
2. **Make disbursement recoverable and consistent:** L05, L06 and L07. Test failures at each save/dispatch boundary, duplicate delivery, concurrent workers, and retries after failure.
3. **Restrict schedule/risk maintenance:** L08, with permission and branch tests alongside the existing financial validation tests.
4. **Improve lookup scale:** L09; then perform a controlled end-to-end run with distinct real test roles and reconcile case status, entries, journals, balances, plans and standing orders.

Probe source: `scripts/audits/LoaningAudit.Probes/Program.cs`. Build `LoaningAudit.Probes.csproj` with MSBuild `/p:Configuration=Debug`, then run `bin/Debug/LoaningAudit.Probes.exe`. The project expects the backend in the sibling `SwiftFinancialz2` folder; override `BackendRoot` if needed.
