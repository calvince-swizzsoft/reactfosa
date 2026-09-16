# SASRA Form 5 Investment Return

The DT SASRA report list includes **FORM 5 - Investment Return**, including when no mappings have been saved. Open it to map accounts, save a revision, preview and download Excel.

The workbook uses KSh. Core capital comes from the selected Form 1 revision (D22); total assets and deposits come from SOFP through Form 1 (D34/D44). These source values are already in KSh, so no second thousand-unit conversion is applied.

The three editable mappings are:

- **C11:** non-earning assets other than land/buildings, following the official workbook label.
- **C12:** qualifying non-government financial investments. Starter mappings reuse SOFP other securities and investments in companies (C18/C20).
- **C13:** land/buildings at net carrying value. Starter mappings reuse SOFP investment property (C32). Split detailed SOFP property/equipment accounts (C33) between C11 and C13, including related accumulated depreciation.

Review other assets and investment eligibility against supporting schedules. A G/L account category alone does not establish regulatory eligibility. Government securities and member loans are not automatically classified as financial investments here.

Save Form 5 mappings and have saved Form 1 and SOFP revisions before previewing. Missing/unclassified non-zero investment/property/equipment accounts, inconsistent source reports, invalid account types and an unbalanced ledger block export. Ratio excesses are warnings and remain reportable. Non-positive denominators display n.a. rather than formula errors. The official template calls for quarterly returns; interim dates remain available with a warning.

Adjustments are made in **Excel C8:C13**, not in the UI. Changes made to a separately downloaded Form 1 workbook do not flow back into the system or into Form 5. The output is a mapping-based working copy requiring review.

The pinned official source has missing land/buildings calculation cells and a fixed -5% excess. The export supplies C15=C13/C9, C16=5%, and C17=C15-C16, with positive-denominator guards. Existing investment and non-earning-asset ratios receive the same guard. The preview discloses these changes.

Source: https://www.sasra.go.ke/download/form-5-investment-return/
SHA-256: c1a7ced517a55824467f615d4be666db4e20129f17d09e453e3a404c2f9d4bc5
Workbook identifier: WORKBOOK-C1A7CED517A5 (content version, not a regulatory effective date).

The feature uses the existing report-template revision tables. No new domain table, SQL script or separate sidebar module is required. Restart the updated API and refresh SASRA Reports.

Form 5 defaults to the latest completed calendar quarter in a single **Reporting quarter** selector. The as-at date appears as text, and financial-year start is derived from the configured posting period containing that date (including closed historical periods). Only a missing or ambiguous match reveals a financial-year-start input. Period-load failures have a Retry action and block preview until resolved. Quarter choices include recent years and configured historical periods. The backend rejects non-quarter-end dates for quarterly requests. **Use an interim date** switches to a date picker; the preview, filename, workbook title and print header identify it as interim. Changing reporting inputs clears the previous preview/download.

Validation: 107 Form 5 assertions; reporting-period and report-list tests; development frontend/API builds; native Microsoft Excel formula/error scan and input-change recalculation; visual review of exported workbook. Other spreadsheet applications have not been directly tested. The output uses legacy .xls and ordinary IF/ISNUMBER/arithmetic formulas.
