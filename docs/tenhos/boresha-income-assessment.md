# Boresha income assessment

Implemented in local development on 24 September 2026. Boresha remains locked.

## Product configuration

Boresha Elimu has `RequireIncomeAssessment=true`, independently of its BOSA section. Its existing TakeHome fields are set to Percentage, `100 / 3` percent of verified monthly gross income, as explicitly chosen by the user for local testing. The protected amount rounds upward to cents. The rate, principal ceiling, 11-month term, four-guarantor requirement and ledger/deposit mappings are preserved.

A nullable product/case setting retains legacy behavior when unset (FOSA non-microcredit income assessment). Explicit true opts into the new enforced assessment; false disables the controller's income requirement. New applications snapshot the setting and take-home policy from the product in the canonical AppService. Existing cases are not retroactively rewritten.

## Assessment behavior

- Appraisal asks for verified monthly gross income, including regular allowances, and a payslip/evidence reference identifying the documents and pay periods reviewed.
- Enabled adjustments must be positive deductions. Include statutory deductions and existing repayment commitments; avoid counting the same commitment twice. Adjustment definitions are resolved by the AppService rather than trusting caller-provided types. Gross income must already include allowances.
- The AppService calculates net income and the repayment schedule using persisted loan terms and the proposed principal. It uses the highest monthly payment, not the client-submitted repayment figures. It overwrites net income, repayment capacity and repayment totals with calculated values.
- Remaining income after deductions and that instalment must meet the configured minimum. For gross 60,000 and deductions 15,000, protected take-home is 20,000, leaving maximum monthly repayment capacity of 25,000.
- Evidence, positive verified income, a positive take-home policy and monthly repayments are required. An empty/missing threshold cannot silently pass.
- Assessment records are bound to the principal, rates, term, repayment settings, protected-income policy, gross/net income, member/product IDs and evidence reference. Approval, verification and marking disbursed reject missing or changed assessment data. A changed approved amount requires deferral and reassessment, including a decrease.
- Generic editing of assessed cases is blocked; Registered/Deferred cases can be edited and assessed again. Assessment guards cover synchronous and asynchronous appraisal/approval/verification services.

The appraisal form shows income fields for BOSA when required and uses a debounced server repayment preview. Product editors expose Required / Not required / Use section default. Fees and existing product locks were not changed.

## Validation and limits

31 isolated checks passed through the real LoanCaseAppService with the actual financial calculator and in-memory persistence: threshold boundaries/rounding, missing evidence, unaffordable principal, spoofed totals/net income, duplicate deductions, allowance inflation, changed principal/rate/term/income, generic edits, sync/async behavior, approval and later-stage guards. The API regression suite passed, including HTTP 409 `LOAN_INCOME_ASSESSMENT_REQUIRED`. All 37 BOSA qualification checks still pass. Debug API/importer and development-mode frontend builds passed (existing compiler/CSS/bundle warnings remain).

This verifies officer-entered income against the configured rule; it does not connect to an employer/payroll system or automatically authenticate uploaded payslips. The evidence reference does not enforce two document attachments. The local test minimum is not asserted to be Tenhos's approved policy. Restructuring of already-disbursed loans is a separate workflow and was not changed. No full application/disbursement was performed by these tests.

Migration: backend `tools/sql/2026-09-24-loan-income-assessment.sql` was applied to local development only. It adds nullable columns; it does not rewrite existing loans. Evidence: `income-assessment-result.json`, `income-assessment-tests.json`, `before-income-assessment.json`. The product is still locked pending the controlled end-to-end test.
