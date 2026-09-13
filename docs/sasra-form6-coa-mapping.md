# Form 6 G/L mappings

Saved through `SasraSetupAppService.SaveVersion` on 12 September 2026 as revision 1 of `WORKBOOK-CD81FC5DAAD8`. The application read back and verified 18 mappings. No G/L classifications or journal entries were changed.

The report lines follow the user-supplied DT [SASRA Form 6 workbook](https://www.sasra.go.ke/download/form-6-statement-of-financial-position/). These assignments reflect the inspected account names, types and relevant posting code, rather than a generic mapping by account-number prefix.

| Form 6 line | Cell | G/L accounts |
|---|---|---|
| Cash in hand | C11 | 1002 Teller Chart of Account; 1011 Petty Cash |
| Cash at bank | C12 | 1001 EQUITY CURRENT ACCOUNT |
| Prepayments & Sundry Receivables | C14 | 1003 Interest Receivable; 1005 Interest Charged; 1006 External Cheques in Hand |
| Gross Loan Portfolio | C23 | 1004 Loan Principal |
| Property & Equipment | C33 | 1007 Motor Vehicle Purchase; 1008 Motor Vehicle Depreciation |
| Withdrawable savings deposits | C42 | 2001 ORDINARY SAVINGS |
| Short-term deposits | C43 | 2007 Fixed Deposit Payable |
| Non-withdrawable deposits | C44 | 2009 BOSA DEPOSITS |
| Other Liabilities | C52 | 2004 Swizz Payroll Control; 2005 Statutory Fees; 2006 External Cheques Control; 2008 Accrued Payables; 2010 Wire Transfer Clearing Acc |
| Prior Years' Retained Earnings | C61 | 3001 Profit and Loss |

The depreciation account nets against vehicle cost. The existing loan-interest adjustment logic debits Interest Receivable and credits Interest Charged; both asset accounts are mapped to the same receivable line so their signed balances net consistently with the current ledger design. This retains the application's existing interest-recognition treatment. External cheques awaiting clearance are included as receivables, rather than notes and coins. Statutory Fees is mapped to other liabilities because its name does not establish a specific tax payable.

The four accounts currently configured as income are included automatically in surplus: 4001 Teller Excess Chart of Account, 4002 Income from Commissions, 4003 Interest Receieved, and 5001 Teller Shortage Account. They must not also be manually mapped to balance-sheet lines. Review whether the Teller Shortage Account's income classification is intentional.

## Unresolved classifications

| Account | Database type | Reason left unmapped |
|---|---|---|
| 2002 Mandatory Share Capital | Liability | The named Share Capital report line requires equity accounts. Confirm the product represents member share capital and correct its G/L classification before mapping to C57. Do not treat it as BOSA deposits solely to satisfy the current type. |
| 5002 Motor Vehicle Expense | Asset | The name suggests an expense but the database classifies it as an asset. Confirm its purpose and correct the classification if needed. Zero balance at inspection. |
| 1009 TEST ASSETS | Asset | The name does not establish its economic purpose. Zero balance at inspection. |

Other report lines have no matching identified G/L accounts and remain without manual mappings. Totals and current-year surplus are calculated automatically.

## Verification

Using 1 January 2026 as the verification year start and 12 September 2026 as the as-at date:

- Underlying ledger difference: KSh 0.00.
- Report assets minus liabilities and equity: KSh 28,400.00.
- Only non-zero unmapped account: 2002 Mandatory Share Capital, credit balance KSh 28,400.00.
- Excel download is blocked by the unmapped balance and reconciliation difference.

The dates above were used only to test the mappings and do not configure the institution's financial year. Select its actual financial-year start when generating a return.

The inspected ledger also has a credit balance in the bank asset account and a debit balance in payroll control. Their signs were preserved. Review the underlying postings and any required presentation reclassifications before using the return for submission; mapping alone does not resolve these balances.
