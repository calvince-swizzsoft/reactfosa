# Tenhos provisional maximums

Saved and read-back verified on 24 September 2026 in the local development database. These are user-authorized test ceilings, not verified Tenhos policy. All 14 products remain locked. Rates, ledger mappings and other product settings were preserved.

| Product | Maximum (KES) |
|---|---:|
| TENHOS - Boresha Elimu (School Fees Loan) [DRAFT] | 500,000 |
| TENHOS - Emergency Loan [DRAFT] | 500,000 |
| TENHOS - Asset Financing Loan [DRAFT] | 3,000,000 |
| TENHOS - Development Loan [DRAFT] | 3,000,000 |
| TENHOS - Advances [DRAFT] | 100,000 |
| TENHOS - Start-Up Loan [DRAFT] | 300,000 |
| TENHOS - Bonus Advance [DRAFT] | 200,000 |
| TENHOS - Hospital Check-Off Advance [DRAFT] | 100,000 |
| TENHOS - Special Advance [DRAFT] | 200,000 |
| TENHOS - Overdraft Facility [DRAFT] | 300,000 |
| TENHOS - Loan Item Facility [DRAFT] | 300,000 |
| TENHOS - Vijana Loan [DRAFT] | 300,000 |
| TENHOS - Dairy Loan [DRAFT] | 500,000 |
| TENHOS - Ukulima Loan [DRAFT] | 500,000 |

This update changes only LoanRegistrationMaximumAmount. Deposit multipliers, salary limits, affordability and security checks must still constrain each application. Vijana lower-level caps remain documented in the research; this update does not implement the missing level rules.

Evidence: maximums-result.json contains current product read-backs; before-maximums.json preserves the prior configuration. Historical import and account-mapping snapshots retain the values at their creation time.

Importer modes: maximums-plan validates without writing; maximums-apply updates only differing caps through ILoanProductAppService, within a serializable scope, and verifies all other product fields remain unchanged.
