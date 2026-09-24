# SASRA Form 9: field mapping and implementation gaps

Audit date: 23 September 2026.

## Finding

Form 9 can reuse existing customers, directors, employees, loan cases, repayment plans, ledger balances and loan-ageing calculations. It cannot yet be generated reliably from the current data model without additional insider-history and board-approval evidence, defined BOSA deposit mappings, and decisions on several reporting semantics.

This is an implementation specification, not an implemented report. Source code and the actual development database schema were inspected. No customer-level records, balances or data-completeness counts were queried. No application code or database data was changed.

## Official workbook verified

Source: https://www.sasra.go.ke/download/form-9-insider-lending-and-performance-report/

Downloaded from the public download link on that page, package ID 814. Server filename: `form9-insider-lending-and-performance-report.xlsx`. Size: 24,358 bytes. SHA-256: `07AA18B8F484C4A1939B3A453E80FB1AD297B6A27D660B78FFF0B16F59019186`.

An unchanged copy is retained at [official workbook](references/sasra/form9-insider-lending-and-performance-report.xlsx). Inspection used the original XLSX XML, including sheet names, cell values, formulas and merged ranges. No Excel rendering, recalculation or workbook alteration was performed. The download-page date is not treated as a regulatory effective date.

The workbook contains two worksheets: `Insider return` and `Notes`.

Verified instructions, paraphrased from Notes!B5:B16:

- This template covers DT SACCO loans to directors and employees. A broader related-party population is not specified in these notes and must not be silently substituted.
- Board approval or ratification is required, applicants must be absent from the relevant meeting, and supporting records must be retained.
- Submission is monthly, by the fifteenth, with the return sheet specifying the following month. This corrects the earlier conversation's suggestion that DT Form 9 might only be event-driven. Confirm any later circular before implementation; this audit does not establish the current consolidated wording of Regulation 36.
- Report each granted or outstanding loan separately by its loan type/product at reporting month-end.
- Certification is by the CEO, deputy CEO or another authorised senior manager.

## Workbook layout

`Insider return` has institution labels at B3:B4 and reporting-period labels at B5:B6. The exact writable header cells need visual confirmation because the cells adjacent to these labels are blank and unlabelled in the XML.

Section A: headers C10:N10; five supplied detail rows 11:15. Granted-amount total H17 is `SUM(H11:H15)`.

Section B: headers C20:O20; five supplied detail rows 21:25. Outstanding total N27 is `SUM(N21:N25)`.

Certification and signature labels occupy C33:C39. Existing merged ranges are D17:G17 and D27:M27. No worksheet data-validation element was found in either sheet.

The exporter must support more than five loans per section, extend totals, shift the following section and certification area, preserve the Notes sheet and maintain an accurate print layout. Do not truncate to the supplied rows. The source is XLSX, whereas several existing reports use HSSF/XLS templates: use an XLSX-capable writer and preserve this workbook's format.

## Field-to-database mapping

Database metadata verified through `sys.tables` and `sys.columns` using the configured SwiftFin_Dev connection. Table prefix below is `swiftFin_`. A present column is not proof that historical values are populated or correct.

| Official field / location | Existing source | Status and required work |
|---|---|---|
| Institution name / B3 label | SasraInstitutionProfiles.InstitutionName | Available. Use configured DT profile; enforce institution scope. |
| CS number / B4 label | SasraInstitutionProfiles.RegistrationNumber | Available. Validate it is the SACCO's CS registration identifier. |
| Start and end dates / B5:B6 labels | Report request | Add explicit monthly period validation and retain the chosen period with the run. |
| Borrower / C11:C15 and C21:C25 | LoanCases.CustomerId -> Customers.Individual_FirstName, Individual_LastName | Available; retain customer ID for joins, not name matching. |
| Member identifier / D detail columns | Customers.Reference2 | Existing enum descriptions identify Reference2 as membership number. Check population/uniqueness. Do not silently replace with SerialNumber, Reference1 account number or Reference3 personal-file number. |
| Position / E detail columns | Employees.DesignationId -> Designations; Directors.CustomerId | Partial. Staff designation exists, but historical designation and director office are not represented by an effective-dated insider register. Director DivisionId is not a board position. |
| Loan product / F detail columns | LoanCases.LoanProductId -> LoanProducts.Description | Available. Preserve LoanCaseId separately so two loans of the same product are not collapsed. |
| Requested amount / G detail columns | LoanCases.AmountApplied | Available; use the case value. |
| Granted amount / H detail columns | LoanCases.ApprovedAmount | Candidate mapping. Do not substitute DisbursedAmount automatically. Verify what to report for staged or partly drawn approvals and ratifications. |
| Approval or ratification date / I detail columns | LoanCases.ApprovedDate, ApprovedBy, ApprovalRemarks | Partial. Generic system approval does not prove board approval/ratification, meeting reference or applicant recusal. No dedicated board/insider table was returned by the schema inventory. |
| BOSA deposits / J detail columns | CustomerAccounts + JournalEntries/Journals, with explicitly mapped eligible products/accounts | Partial. Reuse the Form 3 customer-balance query approach. Define eligible BOSA deposits and valuation date. LoanCases.LoanProductInvestmentsBalance is an appraisal-related snapshot, not automatically a valid reporting-date BOSA balance. |
| Security description / K detail columns | LoanCollaterals.LoanCaseId -> CustomerDocuments.Type/FileTitle/FileDescription; LoanGuarantors.LoanCaseId and guarantee amounts | Partial. Create a reviewed security description. Product SecurityRequired is only a policy flag. Distinguish confirmed unsecured loans from missing security information; review legacy guarantors without LoanCaseId. |
| First repayment/due date / L detail columns | LoanRepaymentPlans -> LoanRepaymentInstalments.DueDate | Available when a confirmed schedule exists. Use the first contractual due date of the relevant plan, not the oldest overdue date or today's generated schedule. Define how restructures affect the reported date. |
| Repayment term / M detail columns | LoanCases.LoanRegistration_TermInMonths | Available as a case-level term. Confirm output units and revised-term treatment. |
| Remarks / N11:N15 | LoanCases.Remarks, ApprovalRemarks, other reviewed evidence | Available as candidates. Provide a report-specific reviewed note instead of exporting all internal free text. |
| Outstanding / N21:N25 | LoanAgeingLoanResult.OutstandingPrincipal and OutstandingInterest, based on dated ledger postings and confirmed schedules | Partial. The template does not define whether the reported amount includes interest. Confirm the basis and reconcile per-loan totals to the selected account balances. Never repeat an entire shared account balance on every case. |
| Performance / O21:O25 | LoanAgeingEngine.ByLoan and existing SASRA classification logic | Reusable calculation foundation. Missing/ambiguous schedules must remain unresolved, not be reported as Performing. Confirm consistency with the institution's Form 4 policy and treatment of restructures. |
| Section totals / H17 and N27 | Sum of exported detail rows | Derive from the actual rows and independent server totals. Expand formulas when adding rows. Do not aggregate the repeated borrower-level BOSA balance as a loan total. |
| Authorisation / C33:C39 area | No dedicated Form 9 certification/run record identified | Add authorised preparer/reviewer names, dates and evidence workflow. Generating an export must not fabricate a signature or imply regulatory submission. |

## Confirmed schema and code gaps

1. Directors has CustomerId, DivisionId, Remarks and IsLocked, but no appointment/cessation dates or office history. CreatedDate and IsLocked are not substitutes for regulatory tenure.
2. Employees has CustomerId, DesignationId and EmploymentStartDate. EmployeeExits contains workflow audit/authorisation dates but no explicit effective exit date in the inspected table. Historical employment and designation reconstruction needs review/backfill.
3. LoanCases has ordinary approval fields but no dedicated board decision, ratification date, meeting/minute reference or recusal evidence fields.
4. SASRA template/profile/version tables exist. No Form 9 preview/export implementation was found; its entry in SasraStandardDefinitions is only a catalogue definition. No dedicated insider or Form 9 report-run table appeared in the schema inventory.
5. Existing ageing supports per-loan results. Shared repayments are allocated oldest-due-first and exposed as reporting allocations. Do not describe them as independently posted loan-case balances. Preserve exceptions and validate allocation policy before reuse.
6. Existing Form 4 is explicitly a system working copy and permits Excel adjustments. A Form 9 calculation cannot assume that a downloaded/adjusted Form 4 has been imported or reconciled back into the database.

## Decisions the template does not fully resolve

These are implementation questions, not facts inferred from a blank template:

- Does Section A inclusion use board approval, ratification, disbursement, or another agreed grant event when these dates differ?
- Does Section B include loans granted during the current reporting month as well as earlier outstanding loans?
- For former staff/directors, which event/date determines continuing report inclusion? Preserve both status-at-grant and status-at-period-end until policy is confirmed.
- For BOSA deposits, is the required value at approval or report end, and which configured products qualify?
- Is outstanding principal only or principal plus specified interest/charges?
- How should approved-but-undrawn facilities, reschedules, refinances and settled loans be displayed?
- What is the required nil-return treatment? Do not assume an empty result means no filing obligation.

Record the agreed rules with the template version and have the responsible reporting officer confirm them against the applicable instructions/circulars before a submission-ready export is enabled.

## Proposed implementation sequence

1. Verify header/signature placement visually; retain the original workbook hash and Notes sheet. Confirm the unresolved reporting rules above.
2. Run aggregate-only data-quality checks for missing/duplicate Reference2 values, director/staff overlap, missing tenure information, approval gaps, incomplete schedules and orphaned security links. Review exceptions with the responsible officer; do not invent historical dates.
3. Add effective-dated insider appointments/roles and board lending decision evidence, linking existing customer/employee/director and loan IDs. Preserve an audit trail and enforce edit permissions.
4. Add versioned BOSA product/account mapping and a reviewed security description where current data is incomplete.
5. Implement a canonical AppService that reads a consistent institution-wide snapshot, selects the insider population, builds both sections, and returns field-specific exceptions and reconciliations. Controllers should delegate to it.
6. Add Form 9 beside existing DT reports: month selector, both section previews, borrower/loan drill-down, exceptions, review and XLSX export. Keep a distinction between working draft, approved export and actual external submission.
7. Persist report-run inputs/results, template hash, policy version, approval evidence and export hash so later changes do not rewrite previously reviewed returns.

## Acceptance checks

- Each required workbook field has an explicit source or reviewed exception; no silent default dates, zero balances or substituted identifiers.
- One report row per required loan; dual director/employee roles do not duplicate it.
- Grants around month boundaries, late ratifications, partial drawings and settled facilities follow documented rules.
- Two loans sharing one account reconcile without duplicated principal or interest.
- Reversals, backdated postings, overpayments and restructures produce correct as-at figures or actionable exceptions.
- Missing schedules or historical insider evidence block a submission-ready result; any working draft is clearly marked.
- BOSA balances use the approved product mapping and date basis, with reconciliation to the deposit ledger.
- Export tests cover zero, one, five and more-than-five rows in both sections, shifted formulas/merges, both sheets, signature space and print output.
- Reopening the generated XLSX preserves numeric/date types and correct formulas. Reviewer sign-off is real, separate from file generation.

## Code references

Paths below are relative to the sibling `SwiftFinancialz2` backend repository unless stated otherwise.

- `Domain.MainBoundedContext/RegistryModule/Aggregates/DirectorAgg/Director.cs`
- `Domain.MainBoundedContext/HumanResourcesModule/Aggregates/EmployeeAgg/Employee.cs`
- `Domain.MainBoundedContext/HumanResourcesModule/Aggregates/EmployeeExitAgg/EmployeeExit.cs`
- `Domain.MainBoundedContext/BackOfficeModule/Aggregates/LoanCaseAgg/LoanCase.cs`
- `Domain.MainBoundedContext/BackOfficeModule/Aggregates/LoanCollateralAgg/LoanCollateral.cs`
- `Domain.MainBoundedContext/BackOfficeModule/Aggregates/LoanGuarantorAgg/LoanGuarantor.cs`
- `Infrastructure.Crosscutting.Framework/Utils/Enumerations.cs`: Reference2 membership-number labels.
- `Application.MainBoundedContext.DTO/BackOfficeModule/LoanAgeingDTO.cs`
- `Application.MainBoundedContext/BackOfficeModule/Services/LoanAgeingAppService.cs`: dated postings, plans and case/account resolution.
- `Application.MainBoundedContext/BackOfficeModule/Services/LoanAgeingEngine.cs`: ByLoan allocation and performance.
- `Application.MainBoundedContext/AccountsModule/Services/SasraForm4.cs`: working-copy classification/export boundary.
- `Application.MainBoundedContext/AccountsModule/Services/SasraSetupAppService.Form3.cs`: customer deposit-balance query pattern.
- `Application.MainBoundedContext/AccountsModule/Services/SasraStandardDefinitions.cs`: Form 9 catalogue entry only.

No application build or transactional test was required for this documentation-only audit. Live data completeness, official workbook visual layout and disputed reporting semantics remain explicit pre-implementation checks.
