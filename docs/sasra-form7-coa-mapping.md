# Form 7 — Comprehensive Income

The official [SASRA Form 7 workbook](https://www.sasra.go.ke/download/form-7-statement-of-comprehensive-income/) was downloaded on 12 September 2026 and implemented as `WORKBOOK-A4D3F3D375EE`. This is the application's workbook identifier, not an official SASRA version number.

Open **SASRA Reports → Open Form 7 · Comprehensive Income**. The dedicated screen loads the latest saved revision. Its 23 input lines have searchable, paged G/L mapping controls; 12 subtotal/total lines are calculated by the original workbook formulas. Each successful mapping save creates an immutable revision in the existing SASRA domain tables. No schema change was introduced.

## Saved revision 1

| Cell | Report line | Account | Basis |
|---|---|---|---|
| C12 | Interest on Loan Portfolio | 4003 Interest Receieved | This is the loan-interest income account used by loan products. |
| C19 | Other Operating Income | 4002 Income from Commissions | Generic commission income is assigned to operating fees. If the account mixes loan-origination fees and other transaction fees, separate the G/L accounts so loan-specific fees can map to C13. |
| C46 | Non-Operating Income | 4001 Teller Excess Chart of Account | Teller cash excess is treated as incidental income rather than loan or investment income. |

The revision was saved and read back through the application service. No G/L account type or journal entry was changed.

## Review required

**5001 Teller Shortage Account** is configured as income (type 4000) and has a credit balance of KSh 5,000 at the verification date. Its name suggests a shortage, but the classification and balance suggest income. It is left unmapped until the intended treatment is established. Do not simply map it to an expense line or force its sign.

**5002 Motor Vehicle Expense** remains an asset account with zero balance. It is not a valid Form 7 expense mapping until its purpose and classification are corrected. The current COA contains no accounts classified as expenses (type 5000); unused expense lines therefore remain unassigned. Asset depreciation account 1008 belongs in Form 6 alongside asset cost, not in Form 7 depreciation expense.

## Preview and checks

Preview requires the actual financial-year start and an as-at date within that year. It uses journal value dates with created-date fallback and includes the complete as-at day. System fiscal-period closing journals (transaction code 15), including reversals retaining that code, are excluded from income/expense activity and presented separately as a closing adjustment. Manually posted closing transfers without that code cannot be identified automatically.

Income is credit-positive; expenses are debit-positive. Loan-loss recoveries reduce the provision expense. Donations show their net contribution. Figures are divided by 1,000 once for the workbook's KSh-thousands units. Negative balances retain their signs.

The report compares final net income to the independent income/expense ledger total. A separate control checks that all journal entries in the selected period balance. The closing adjustment bridges unclosed surplus, using Form 6's date/type basis, to Form 7 net income. It is not a comparison to a stored Form 6 run.

Verification used 1 January through 12 September 2026; these are test dates, not a saved financial-year setting:

- Three G/L mappings saved in revision 1.
- Underlying period ledger difference: KSh 0.00.
- Form 7 net income less ledger net income: KSh -5,000.00.
- The only non-zero unmapped income account is 5001 Teller Shortage Account, explaining the difference.
- Excel download remains blocked until the classification/mapping issue is resolved.

Download uses the same generated workbook bytes as preview. The original `.xls` format, formulas, labels, merges, print settings and authorization area are retained. Only the two long income-description rows receive extra height to avoid clipping. Registration number and typed financial dates are populated. This does not submit or sign a regulatory return.

Validation completed: backend Debug build, frontend development build, 234 Form 7 checks plus 325 existing SASRA checks, and execution of the actual report SQL against read-only fixtures covering date boundaries, created-date fallback, reversals and closing transfers. Generated workbook values and formulas were checked after reopening, and its output was visually inspected using a rendered representation. Live browser/native Excel interaction was not available.
