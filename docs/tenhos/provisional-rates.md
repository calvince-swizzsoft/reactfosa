# Tenhos provisional test rates

Saved and read-back verified on 24 September 2026 in the authorized local development database. User-authorized test assumptions, not approved Tenhos pricing. All products remain locked. Annual rates use reducing-balance calculation; fees and other settings are unchanged.

| Product | Nominal annual rate | Monthly equivalent |
|---|---:|---:|
| TENHOS - Boresha Elimu (School Fees Loan) [DRAFT] | 12% | 1% |
| TENHOS - Emergency Loan [DRAFT] | 12% | 1% |
| TENHOS - Asset Financing Loan [DRAFT] | 15% | 1.25% |
| TENHOS - Development Loan [DRAFT] | 12% | 1% |
| TENHOS - Advances [DRAFT] | 24% | 2% |
| TENHOS - Start-Up Loan [DRAFT] | 18% | 1.5% |
| TENHOS - Bonus Advance [DRAFT] | 24% | 2% |
| TENHOS - Hospital Check-Off Advance [DRAFT] | 18% | 1.5% |
| TENHOS - Special Advance [DRAFT] | 24% | 2% |
| TENHOS - Overdraft Facility [DRAFT] | 24% | 2% |
| TENHOS - Loan Item Facility [DRAFT] | 18% | 1.5% |
| TENHOS - Vijana Loan [DRAFT] | 18% | 1.5% |
| TENHOS - Dairy Loan [DRAFT] | 15% | 1.25% |
| TENHOS - Ukulima Loan [DRAFT] | 15% | 1.25% |

These nominal rates exclude fees and are not effective annual borrowing costs. Special Loan Item recovery timing and Overdraft structure remain unresolved. Saving rates does not complete the product qualification rules or activate lending.

Evidence: rates-result.json contains verified product read-backs; before-rates.json preserves the previous settings. The update changed only LoanInterestAnnualPercentageRate through ILoanProductAppService, in one serializable transaction. All other product fields and unrelated products were verified unchanged.
