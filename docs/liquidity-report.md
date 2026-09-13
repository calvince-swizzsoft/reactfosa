# Form 2 — Liquidity Statement

## Current workflow — 13 September 2026

Form 2 now follows Capital Adequacy: generate from saved G/L mappings and reporting dates, then complete additional adjustments in Excel. The screen no longer asks for maturity amounts, exclusions, supporting explanation or a review checkbox. Existing mappings are unchanged. The API opts into this workflow with `mappingBased: true`; the manual-input API remains available to older callers.

In worksheet `Liquidity`, review D15 (long-term bank deposits), D16 (bank obligations), D24 (matured non-bank borrowings), D37–D39 (deposit deductions), and D44–D45 (other liability maturities). D16 already includes mapped bank overdrafts: add only additional obligations. Reduce the relevant mapped input balances for applicable uncleared or restricted funds without duplicating deductions. Keep subtotal and ratio formulas intact; retain supporting schedules with the completed workbook. Excel edits are not imported into the application.

Additional schedule amounts start at zero because no adjustments were supplied, not because their absence has been confirmed. Ledger, mapping, deposit reconciliation and positive-denominator checks remain in place before download. The original manual-input workflow and diagnostic preview below describe the initial implementation; its review gate no longer applies to the current mapping-based screen.

Available under **Reporting → SASRA Reports → FORM 2** alongside Forms 1, 6 and 7. The list shows the latest compatible saved revision and offers the initial definition when no mapping exists. Reading the list and definitions does not require institution setup; generation uses the existing DT institution profile.

## Workbook and calculation

- Source: [SASRA Form 2 workbook](https://www.sasra.go.ke/download/form-2-liquidity-statement/).
- SHA-256: `b71442b70b5eed0867078026911763ec6742fc24c2e46581b1167bee98c0a7b1`.
- Internal workbook identity: `WORKBOOK-B71442B70B5E`; sheet `Liquidity`, column D, **whole KSh** as labelled in the downloaded workbook.
- Closing balances include the entire as-at day, across all branches, using `COALESCE(ValueDate, CreatedDate)`. The financial-year start supplies the heading; this is not a movement-only report.
- Positive commercial-bank balances enter D13. Credit balances are split per mapped account and automatically deducted in D16. Additional bank obligations entered manually must not repeat those amounts.
- The ratio retains the source formula `D49 / D50`, with `D50 = D35 + D46`: gross deposits plus other short-term liabilities. D41 discloses net deposits but is not the ratio denominator. Non-withdrawable member deposits remain within gross deposits; share capital does not.
- Source correction: D43 contains `SUM(D44:D46)`, which includes both component amounts and their subtotal. The export changes only this redundant section total to `SUM(D44:D45)`. The ratio already uses D46, so this correction does not change it. Other source formulas, labels and formats are retained.
- The workbook labels bank time deposits **over 90 days** and other liabilities **within 91 days**. The [2010 completion instructions, pp. 52–54](https://kenyalaw.org/kl/fileadmin/pdfdownloads/LegalNotices/2010/LN95_2010.pdf) differ at those boundaries. The UI discloses that discrepancy; users must establish their reporting policy for boundary cases. There is no automatic maturity classification pretending to resolve it.

## Initial database mappings

Saved through `SasraSetupAppService.SaveVersion`, then fetched back and compared; Form 2 revision 1 has six account mappings:

| Workbook line | Posting accounts |
|---|---|
| D9 Local notes and coins | 1002 Teller Chart of Account; 1011 Petty Cash |
| D13 Commercial-bank balances | 1001 EQUITY CURRENT ACCOUNT |
| D33 Member deposits including interest | 2001 ORDINARY SAVINGS; 2007 Fixed Deposit Payable; 2009 BOSA DEPOSITS |

New definitions suggest corresponding existing SOFP classifications. These are editable suggestions: users must distinguish local/foreign cash and member/other deposits for their institution. Loan principal, fixed assets, receivables, external cheques and share capital are not liquidity assets or deposits merely because they appear on the balance sheet. Government securities need separate bills/bonds mappings if present. Accrued-interest accounts belong with the related balance where applicable.

Definitions, lines and account links use the existing SASRA version/line and ReportTemplate/ReportTemplateEntry domain entities. **No schema change or migration is needed.** Manual schedule amounts, exclusions and review notes belong to the preview request and are not saved with mapping revisions or as a report-run record.

## Validation and user workflow

1. Review and save account mappings.
2. Enter dates, explicit schedule amounts and exclusions, and identify supporting schedules. All amounts use KSh. Exclusions cannot exceed the mapped balances. Long-term bank deposits belong in D15 and must not also be excluded from D13.
3. Review maturity and availability, bank reconciliation, accrued interest, encumbrances, and other liabilities, then check the review confirmation.
4. Preview and download the returned `.xls` when blocking issues are resolved.

Client and server validate dates, required amounts, non-negative values and notes. The server additionally enforces canonical workbook definitions, posting-account categories and uniqueness, stale-revision conflicts, ledger balance, deposit reconciliation to the selected SOFP revision, and unmapped non-zero cash/bank/government-security/deposit accounts identified by that SOFP. Other G/L balances do not automatically establish a liability's maturity; the supporting-schedule review remains necessary. Nonpositive ratio denominators or inconsistent inputs block Excel. A correctly calculated liquidity deficit is a warning and remains reportable.

## Verification on 12 September 2026

The diagnostic database preview used Form 6 revision 2 and **unconfirmed zeros** for manual amounts, with review confirmation false. Those diagnostic inputs were not persisted:

- Local cash: KSh 53,000.
- Automatic bank overdraft: KSh 838,300.02.
- Net liquid assets: KSh −785,300.02.
- Gross member deposits: KSh 45,600.
- Ledger and gross-deposit reconciliation differences: KSh 0.
- Diagnostic ratio: approximately −1,722.15%, before confirming maturity and exclusion schedules. Excel correctly remained blocked pending review.

Do not treat this diagnostic ratio as an approved return or change schedule values solely to improve it. Review the bank ledger and actual supporting schedules.

Backend Debug build and 1,435 SASRA assertions passed (326 for Form 2); frontend input/list tests and development build passed. The production `.xls` was reopened and recalculated with NPOI. Its rendered representation was visually inspected against the original; Microsoft Excel itself was not automated. Existing unrelated build warnings remain.
