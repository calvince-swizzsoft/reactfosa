# Capital Adequacy mappings — 12 September 2026

Saved Form 1 `WORKBOOK-65571F0718AF`, revision 1, with twelve account mappings through SasraSetupAppService. The mappings follow the compatible categories in the current Form 6 revision 2. They retain the ten mappings in the surviving older Capital Adequacy template and incorporate the two subsequently established SOFP classifications: Mandatory Share Capital as equity, and Teller Shortage as Other Assets.

| Cell | Line | Accounts |
|---|---|---|
| D10 | Share capital | 2002 Mandatory Share Capital |
| D12 | Retained earnings / accumulated losses | 3001 Profit and Loss |
| D26 | Cash | 1002 Teller Chart of Account; 1011 Petty Cash |
| D28 | Deposits and balances at other institutions | 1001 EQUITY CURRENT ACCOUNT |
| D29 | Loans and advances | 1004 Loan Principal |
| D31 | Property and equipment, net | 1007 Motor Vehicle Purchase; 1008 Motor Vehicle Depreciation |
| D32 | Other assets | 1003 Interest Receivable; 1005 Interest Charged; 1006 External Cheques in Hand; 2011 Teller Shortage Account |

The normal service validated account types, posting status and duplicates. Every saved line/account pair was read back and compared. A separate SQL read confirmed revision 1 and twelve persisted entries. No source templates, institution settings, G/L accounts or journals were changed; no migrations were run.

Diagnostic preview used 1 January–12 September 2026 and Form 6 revision 2. The ledger difference and Form 1-to-SOFP asset difference were both zero. Total assets were negative KSh 537,300; capital-to-assets ratios were therefore unavailable. Deposit liabilities were KSh 43,600.

Manual surplus adjustments, capital deductions and off-balance-sheet exposures were set to zero only for this diagnostic preview, with CapitalEligibilityReviewed=false. These zeros were not saved or asserted as confirmed amounts. Excel remains blocked until eligibility and supporting schedules are reviewed and the negative asset denominator is resolved. Mapping completion does not establish regulatory compliance.
