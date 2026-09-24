# Tenhos credit-product configuration

Reviewed 24 September 2026. Target: local development, alias `SwiftFin_Dev`, server `(local)`, physical database `SwiftFinancialsDB_Live`. The physical name contains Live, but this is the inspected local development connection selected by the user.

The user authorized **locked drafts pending rates**. These are catalogue preparation records, not complete lending configurations. Existing Education Loan, SALARY ADVANCE and SUPA SAVER LOAN are preserved; the new records have a TENHOS prefix and [DRAFT] suffix.

## Published catalogue

The [official credit catalogue](https://tenhossacco.co.ke/credit-products/) lists 14 products. Details below came from indexed content of official product pages; direct opens repeatedly timed out. Bonus Advance was verified only at catalogue level. Numeric rates and fees were not verified. Sources describe public marketing terms, not an approved internal credit policy.

| Product / source | Term (months) | Qualification basis | Guarantors | Clarification or implementation gap |
|---|---:|---|---:|---|
| [Boresha Elimu (School Fees Loan)](https://tenhossacco.co.ke/service/boresha-elimu/) | 11 | 4× BOSA deposits | 4 | Reducing basis published; exact method/rate missing |
| [Emergency Loan](https://tenhossacco.co.ke/service/emergency-loan/) | 11 | 4× BOSA deposits | 4 | Conditional guarantor waiver unsupported by fixed minimum |
| [Asset Financing Loan](https://tenhossacco.co.ke/service/asset-financing-loan/) | 60 | 4× BOSA deposits | 5 | Confirm two-thirds income basis; no collateral ratio published |
| [Development Loan](https://tenhossacco.co.ke/service/development-loan/) | 60 | 4× BOSA deposits | 4 | Confirm two-thirds income basis |
| [Advances](https://tenhossacco.co.ke/service/advances/) | 1 | 50% of net pay | 1 | Principal limit is not a take-home percentage |
| [Start-Up Loan](https://tenhossacco.co.ke/service/start-up-loan/) | 12 | Salary and repayment ability | 3 | Salary multiplier/principal cap missing |
| [Bonus Advance](https://tenhossacco.co.ke/credit-products/) | Not fixed / unavailable | Tea proceeds | Unconfirmed | Only catalogue description verified; detail page unavailable |
| [Hospital Check-Off Advance](https://tenhossacco.co.ke/service/hospital-check-off-advance/) | 1 | 50% of net pay | Unconfirmed | Same-calendar-month versus one-month term; unstated guarantor count is not zero |
| [Special Advance](https://tenhossacco.co.ke/service/special-advance/) | 3 | 50% of net pay | 2 | Explicit income-based principal cap needed |
| [Overdraft Facility](https://tenhossacco.co.ke/service/overdraft-facility/) | 6 | 50% of net pay | 4 | Confirm instalment advance versus revolving facility |
| [Loan Item Facility](https://tenhossacco.co.ke/service/loan-item-facility/) | 10 | 50% of net pay | 3 | First-instalment interest is not upfront-at-disbursement interest; supplier workflow needed |
| [Vijana Loan](https://tenhossacco.co.ke/service/vijana-loan/) | Not fixed / unavailable | Savings | Unconfirmed | Level-dependent terms; 100,000 general cap conflicts with level V; business eligibility wording needs confirmation |
| [Dairy Loan](https://tenhossacco.co.ke/service/dairy-loan/) | 12 | 2× Ukulima savings | Unconfirmed | Two guarantors plus witness versus three guarantors conflict |
| [Ukulima Loan](https://tenhossacco.co.ke/service/ukulima-loan/) | 12 | 2× Ukulima savings | Unconfirmed | Two guarantors plus witness versus three guarantors conflict |

### Vijana levels

The [Vijana page](https://tenhossacco.co.ke/service/vijana-loan/) describes five levels: I up to KES 10,000 / 3 months / 5× savings; II up to 20,000 / 6 months / 4×; III up to 50,000 / 11 months / 3×; IV up to 100,000 / 18 months / 3×; V above 100,000 / 36 months / 3×. Lower boundaries and the level-V upper cap need confirmation. The general 10,000–100,000 wording conflicts with level V. One locked Vijana catalogue draft is created; the five levels are retained in the research JSON, not falsely represented by one active term or cap.

## Saved versus unresolved

Published fixed terms, deposit multipliers, explicit guarantor counts, the four advance products' three-month income-history requirement, and Development's three-month membership requirement can be entered. This does not prove each runtime path fully enforces those settings.

All four BOSA-backed products are provisionally classified BOSA; the others provisionally FOSA. This is a proposed mapping, not a verified official section classification. In the current system section selection changes appraisal behavior, so this must be reviewed before activation. Deposit-backed BOSA products with a payslip/two-thirds requirement need explicit income checking as well.

The local catalogue confirms DEPOSIT CONTRIBUTION maps to ledger 2009 BOSA DEPOSITS, with posted contribution evidence. The four BOSA-backed loans now select this investment product for qualification; borrower appraisal filters to selected investment IDs and excludes ordinary savings for BOSA. See [BOSA qualification verification](bosa-qualification.md). Mandatory Share Capital remains excluded. There is still no identified Ukulima savings product.

The initial import reused four existing ledger mappings. On 24 September 2026, the user authorized dedicated accounts: 56 product-specific ledger accounts were created and mapped to the 14 locked drafts. See [verified account mappings](account-mappings.md) and accounts-result.json for current IDs and codes. The three original products and all pre-existing ledger accounts remain unchanged; no financial transactions or opening balances were posted.

### Required non-operational placeholders

The existing loan-product schema has no nullable/unknown state for several required values. Every draft therefore has `IsLocked=true` and an explicit [DRAFT] name:

- Initial zero-rate placeholders were replaced on 24 September 2026 by user-authorized nominal annual test rates (12%, 15%, 18% or 24%). See [current provisional rates](provisional-rates.md). These are not approved Tenhos rates; products remain locked.
- The initial KES 1 maximum was replaced on 24 September 2026 by user-authorized provisional test ceilings. See [current maximums](provisional-maximums.md). Minimum principal remains 0 pending policy.
- Unknown term (Bonus/Vijana) uses **1 month** solely to satisfy validation.
- Unknown minimum guarantor count uses 0; its required maximum field uses 1. Known published counts are used as both minimum and provisional maximum; the true maximum is still unconfirmed.
- Periodic charging/recovery, monthly frequency, reducing-balance mode, section/category/security mode, payment-date, rounding and other enum defaults are draft choices. For products whose page says reducing balance, the exact amortization variant still needs confirmation.
- Unpublished percentage/amount fields remain zero, including take-home; audit bypass is disabled. No charges, commissions or lending-cycle rules are fabricated. The four confirmed BOSA appraisal-product mappings were added separately, as documented above.

**Do not simply unlock these records after entering an APR.** Complete the policy and implementation checklist first. The registration API rejects locked products, but this is not a substitute for completing or testing the lending rules.

## Rules requiring explicit implementation or confirmation

1. **Deposit basis:** use the designated BOSA/Ukulima products; distinguish eligibility calculations from a pledge or withdrawal block.
2. **Income limits:** a cap of 50% of net pay limits principal. It is not equivalent to the existing take-home percentage field, which tests remaining income after an instalment.
3. **Emergency waiver:** no guarantors below own deposits is conditional; fixed minimum counts cannot express it. Confirm equality and how deposits are measured.
4. **Affordability:** specify the two-thirds rule's income basis, other deductions, salary verification and its application to BOSA products. Do not silently convert it into an assumed legal rule.
5. **Hospital advance:** enforce employer eligibility and clarify same-month payroll cutoff versus one month after disbursement.
6. **Dairy/Ukulima:** resolve two guarantors plus witness versus three guarantors; create/map the correct savings product through the approved configuration flow.
7. **Vijana:** choose distinct product variants or implement level rules; confirm age, group membership, business eligibility, security alternatives and progression criteria. Existing microcredit amount bands do not by themselves encode all five terms/multipliers.
8. **Loan Item:** support approved suppliers and item selection, and clarify interest in first instalments. That is not the same as deducting full-term interest at disbursement.
9. **Overdraft:** establish whether the marketed facility is a fixed instalment advance or genuinely revolving credit.
10. **Rates and fees:** provide approved rate values, periodicity, calculation method, recovery timing, processing/insurance/other fees, caps, grace periods, repayment dates and approval-role mappings.

## Import and verification

The importer uses `ILoanProductAppService.AddNewLoanProductConfiguration`, first validates all 14 definitions, and writes inside an outer serializable scope. It disables EF database initialization/migrations in its isolated runtime configuration and retains the normal audit queues. It refuses any target other than the inspected local connection, refuses to overwrite an unlocked matching product, and skips matching locked drafts on rerun.

Artifacts:

- [Published facts and unknowns](credit-products-research.json)
- [Exact proposed DTOs and placeholder explanation](import-plan.json)
- `before-products.json`: pre-import catalogue snapshot, created only during apply.
- `import-result.json`: created IDs and read-back DTOs, created after apply and verification.
- [Importer source](../../scripts/tenhos/Tenhos.Import/Program.cs)

Build in Debug. Run `scripts/tenhos/prepare-runtime-config.ps1` after building, then invoke the importer with `plan|apply <backend-Web.config> <research.json> <output-directory>`. Generated runtime configuration stays in ignored `bin/` because it contains environment settings; do not commit it.






## Boresha income assessment update

Boresha now explicitly requires monthly gross-income assessment independently of its BOSA section. The user selected a local-test minimum take-home of one-third of gross income after deductions and the server-calculated instalment. The product remains locked. See [implementation and verification](boresha-income-assessment.md). This does not configure the other products' income policies or certify the full lending cycle.
