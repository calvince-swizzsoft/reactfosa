# BOSA qualification mapping

Implemented and verified on 24 September 2026 in local development.

The investment product **DEPOSIT CONTRIBUTION** (`301de436-4aab-f111-b324-c8e2651ef92d`) maps to liability ledger **2009 - BOSA DEPOSITS**. Mandatory Share Capital is a separate investment product and maps to ledger 2002. Aggregate posting verification found 10 deposit customer accounts and 23 journal entries on the designated BOSA ledger (43 total entries referencing those accounts, including other ledger legs). No member details were exported.

The following locked loan products now select only DEPOSIT CONTRIBUTION in their InvestmentsQualification appraisal-products collection:

- Boresha Elimu
- Emergency
- Asset Financing
- Development

Borrower worksheet, appraisal submission and customer preview now delegate account selection to LoanProductAppService.CalculateLoanQualificationFromAccounts. It filters by both Investment product type and selected target product ID. BOSA excludes ordinary savings even if the legacy include-savings flag is true. The existing multiplier/tier, product ceiling and outstanding-loan calculation then applies. Server-loaded book balances retain the existing investment maturity and designated-ledger filtering.

BOSA products and products with a positive investment multiplier require a nonempty investment selection. Missing selections, or selected locked investments, raise LoanAppraisalConfigurationException; the API returns HTTP 409 with code LOAN_APPRAISAL_SETUP_REQUIRED. A member without a selected deposit account receives zero entitlement, not a fallback to other balances. Existing products outside these four were not remapped; deposit-based products missing their own selection will now require configuration.

Validation: Debug API and importer builds passed. 37 read-only checks through the real AppService and local configuration passed, using synthetic balances. The 100,000 BOSA + 20,000 share capital + 30,000 savings example returns 400,000 at 4x. Tests cover exclusion despite the savings flag, outstanding-loan treatment, product caps, multiple deposit accounts, no eligible accounts, wrong product type and missing mappings. The API regression suite passed, including the configuration-error response.

All four loan products retain their locked state, test rates, maximums and ledger mappings. Other appraisal-purpose selections were preserved. No loans, customer balances or financial transactions were created by this work. This completes the BOSA balance-source change; it is not an end-to-end lending certification or activation.

Evidence: bosa-mapping-result.json, bosa-posting-evidence.json, bosa-verification.json and before-bosa-mapping.json. Importer modes bosa-apply and bosa-test configure/verify and read-only verify respectively. The original import snapshots describe the configuration at their creation time.
