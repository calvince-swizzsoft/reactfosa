# Capital Adequacy: generate from mappings, adjust in Excel

The Form 1 screen now asks for the reporting dates and saved account mappings only. It generates a report using ledger balances and the selected Form 6 revision. Additional adjustment amounts, supporting explanation and an eligibility-review checkbox are no longer required on this screen.

The downloaded workbook is editable. In the `Capital Adequacy` worksheet, column D uses whole KSh:

| Cell | What to review or adjust |
|---|---|
| D13 | Final eligible surplus contribution. The initial report includes 50% of positive ledger surplus or the full loss. Enter the final contribution, not the raw adjustment, and do not halve it again. |
| D19 | Subsidiary/equity investment deductions |
| D20 | Other capital deductions |
| D37 | Reportable off-balance-sheet exposures |

Deductions and exposures initially contain zero because no additional adjustments were supplied. That does not confirm their absence. Keep total and ratio formulas intact. The asset total D41 now uses `SUM(D26:D32)` so edits to asset components update the denominator as well. Retain supporting explanations with the completed workbook or associated schedules.

Mapping, ledger, source Form 6, reconciliation and positive-denominator checks still apply before download. Excel edits are not sent back to the application; downloading again produces a fresh report from the mappings and ledger.

The API uses `mappingBased: true` for this workflow. Existing callers that explicitly submit manual adjustments without this flag retain their previous validation behavior. No database or mapping revisions are changed by this UI simplification.
