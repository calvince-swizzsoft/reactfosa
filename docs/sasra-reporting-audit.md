# SASRA reporting audit and implementation specification

Audit date: 12 September 2026. Status: initial code/database audit completed; implementation and official workbook verification outstanding.

Implementation update: the versioned setup foundation is now implemented in the domain/EF model, application service, API and `/Reports/GenerateSasraForm/Setup` UI. It supports institution profiles and immutable draft revisions with direct G/L mappings. Database migration, official workbook verification, derived formulas, report runs and exports remain outstanding. The findings and completion boundary below describe the original audit; see the backend `docs/api/sasra-setup-api-spec.md` for the implemented contract and migration notes.

## Scope and evidence

Target both deposit-taking (DT) and specified non-deposit-taking (NW-DT) reporting profiles. Do not infer a SACCO's regulatory category from use of FOSA, its name, or its products. Allow an unconfigured/not-applicable profile; do not silently assign DT forms to every institution.

Inspected the React repository, sibling SwiftFinancialz2 backend, and the database selected by its SwiftFin_Dev connection. Database inspection was read-only. The separate server hard-coded in the old report page was not queried or verified.

Official sources checked:

- [DT return catalogue](https://www.sasra.go.ke/dts-regulatory-return-forms/)
- [Additional DT returns](https://www.sasra.go.ke/download-category/regulatory-reporting-forms/page/2/)
- [NW-DT return catalogue](https://www.sasra.go.ke/nw-dts-regulatory-returns-forms/)
- [Additional NW-DT resources](https://www.sasra.go.ke/download-category/nwdts-resources/page/2/)
- [DT financial position Form 6](https://www.sasra.go.ke/download/form-6-statement-of-financial-position/)
- [NW-DT Form 2F download page](https://www.sasra.go.ke/download/form-2f/)

These establish catalogue entries, not verified workbook contents. The Form 6 download link returned its HTML landing page through the web tool; the Form 2F page did not expose a usable download link there. Workbook cells, instructions, formula definitions, effective versions and reporting frequencies still require direct verification. Do not invent them or use the landing-page publication date as a regulatory effective date.

## Existing capability

| Component | Evidence | Decision |
|---|---|---|
| React SASRA page | `src/pages/Reports/GenerateSasraForm/index.jsx`; route in `src/App.jsx` | Reuse route, replace hard-coded external API and fixed default dates |
| Four legacy PDF implementations | Commented code in backend `WebApplication1/Controllers/ValuesController.cs` | Reference only; not active API support |
| Domain report hierarchy | `Domain.MainBoundedContext/AccountsModule/Aggregates/ReportTemplateAgg/ReportTemplate.cs` | Reuse and extend through the domain layer |
| G/L account attachments | `ReportTemplateEntryAgg`, corresponding DTO and EF mappings | Reuse; add validation and version/scope semantics |
| AppService | `Application.MainBoundedContext/AccountsModule/Services/ReportTemplateAppService.cs` | Reuse architecture; repair calculation/export limitations before exposing |
| Dependency registration | `WebApplication1/App_Start/UnityConfig.cs` registers IReportTemplateAppService | Already available to the new API |
| Current API and mapping UI | No matching current controller or mapping screen found | Implement |
| Existing SQL objects | `fnReportTemplate`, `fnReportTemplateSummary` | Do not adopt unmodified |

Database findings:

- `swiftFin_ReportTemplates`: **0 rows**.
- `swiftFin_ReportTemplateEntries`: **0 rows**.
- Both tables and their parent/account foreign keys exist.
- No SASRA-named objects appeared in `sys.objects`; the four legacy PDF procedure names are therefore not present in the inspected database.
- `fnReportTemplate` traverses the template hierarchy and joins attached accounts; its RowNumber derives from the final characters of a GUID, not explicit report order.
- `fnReportTemplateSummary` sums journal-entry Amount using entry CreatedDate BETWEEN start and end. It does not join journal headers or use their ValueDate. An end date at midnight excludes later transactions on that day.

## Calculation/export defects and gaps

1. PopulateReportTemplate converts every negative balance to a positive number. This can hide debit/credit exceptions and turn deductions into additions. Use explicit line sign rules and preserve signed contributions.
2. FindReportTemplateBalances obtains cumulative balances per attached account. It has no start-date argument for income/expense period movements and makes repeated account queries. Use a grouped query over the correct date basis for each return.
3. Spreadsheet export uses HSSFWorkbook (legacy .xls), first sheet only, and silently skips missing rows/cells. Required targets must validate; support the actual official workbook format and all required sheets.
4. Spreadsheet file name and buffer are DTO fields, not a persisted template-version registry on the ReportTemplate entity.
5. No explicit regulatory profile, source workbook hash, effective version, mapping revision or immutable report-run snapshot was found on these entities.
6. Legacy Form 6 PDF calls itself a capital adequacy report; the official DT catalogue identifies Form 6 as financial position. Do not copy its labelling or calculations as authoritative.
7. No dedicated SASRA loan-classification/provisioning engine was found in the inspected domain/service searches. General customer classification must not be treated as regulatory loan risk classification.

## Report inventory

| Family | Verified DT catalogue entry | Source/implementation needed |
|---|---|---|
| Financial position | Form 6 | Cumulative signed G/L balances, deductions, current earnings reconciliation, institution total |
| Comprehensive income | Form 7 | Period-specific income/expense movements and comparable columns required by workbook |
| Capital adequacy | Form 1 | Capital eligibility, deductions and ratios from versioned definitions |
| Liquidity | Form 2; additional daily liquidity Form 2B listed separately | Eligible assets/liabilities, maturity/availability restrictions and ratios |
| Deposits | Form 3 | Product/customer account classifications, counts and balances |
| Asset classification/provisioning | Form 4 | Historical repayment schedules, arrears, restructures, recoveries and provision rules |
| Investments | Form 5 | Investment categories and exposures; G/L totals alone may be insufficient |
| Insider lending | Form 9 | Effective-dated related-party identification, loans and performance |
| Additional returns | Sectoral Form 4B, agency returns, complaints Forms 11/12 listed | Separate source-data and applicability audit |

NW-DT has its own catalogue, including Form 2A capital adequacy and Forms 2B through 2H among its resources. Do not equate identical-looking form numbers across profiles. Bind each downloaded workbook to its verified title and instructions before assigning functional equivalents. Additional operational returns are not covered merely by implementing the financial forms.

## Implementation sequence

### 1. Versioned foundation

Extend the domain/EF model using the repository's migration workflow. Persist institution reporting settings, template version metadata, explicit line order/type/source, sign rules and mapping revision. Keep reusable ReportTemplate/ReportTemplateEntry relationships. All business operations belong in AppServices; controllers provide authenticated contracts and standardized errors.

Use stable profile + report + version identifiers. Persist source URL, workbook checksum, worksheet/cell targets and verification status. Separate institution totals from optional branch investigation. Resolve institution scope from authenticated configuration, never arbitrary client-controlled cross-institution identifiers.

### 2. First end-to-end return: financial position

Use DT Form 6 as the first verified workbook; add the NW-DT equivalent once its workbook identity and content are verified. Shared calculation infrastructure must support both without relabelling one form as the other.

Acceptance criteria:

- Institution profile and verified applicable template selected.
- Mapping editor loads existing account data through server-backed lookups.
- Required lines, duplicate source mappings, invalid/missing accounts and unsupported cell targets produce actionable validation.
- Explicitly intentional reuse of an account in ratios/subtotals is distinguishable from accidental duplicate mapping.
- As-at balances include the complete reporting day; date basis and current-earnings treatment are documented and tested against existing financial statements.
- Every calculated line exposes signed account contributions and reconciliation differences.
- Unmapped accounts with material balances are visible; missing data is never silently converted into a valid zero.
- Preview and Excel export use the same saved calculation snapshot.
- Export preserves the official workbook's labels, sheets, formulas and number formats; required formula results are checked independently.
- Reloading a saved run reproduces the original values even after new postings or mapping changes. A new run is required to incorporate them.
- Client/server errors identify the affected field or line and provide the standard support reference.

### 3. Remaining returns

Add comprehensive income, capital adequacy, liquidity and investments after their individual workbook/rule verification. Then implement operational returns after auditing their source data. Save and expose preparation/review status without claiming submission or approval by SASRA. Portal submission is a separate integration.

## Verification plan

- Date boundaries: opening balance, final-day transaction, next-day exclusion, ValueDate/CreatedDate differences.
- Signs: normal debit/credit balances, contra-assets, abnormal balances, refunds and reversals.
- Scope: full institution, authorized branch investigation, no cross-institution leakage.
- Mappings: missing, duplicated, intentionally reused, inactive/deleted targets and historical revisions.
- Reconciliation: assets less liabilities/equity; current-period earnings; report-to-ledger totals.
- Export: actual official template, all sheets, correct cells, numeric values, formulas, no silent omissions.
- Scale: bulk grouped balances and paginated account breakdowns, rather than one SQL call per mapping.
- API: unauthenticated, malformed dates, unknown profile/version, invalid mappings and concurrent edits.
- Build Debug/development only. Read-only DB checks do not constitute successful report generation or submission validation.

## Current completion boundary

Completed: code audit, read-only database inventory, official catalogue discovery, defect identification and first-return acceptance criteria.

Outstanding: downloading/verifying official workbooks, schema extensions, API/UI implementation, migration, report generation, Excel verification and operational-return source audit. No reporting code or database records were changed during this audit.
