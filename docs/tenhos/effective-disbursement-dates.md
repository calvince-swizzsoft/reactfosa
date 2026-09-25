# Effective disbursement dates — local development

Implemented 25 September 2026. Create a new loan disbursement batch and select Effective Disbursement Date (25 August 2026 for the historical test). The date is visible in verification/authorization and can be edited by the creator in the Pending batch drawer using Save Date. Saving revalidates all attached loans. It is locked after verification.

The AppService validates open/unlocked posting periods, future dates, application date and approval evidence before posting. An Approved insider board decision supplies its business approval date; otherwise ApprovedDate applies. This does not rewrite processing/audit timestamps.

The selected date drives loan DisbursedDate, all disbursement/charge/offset journal value dates, posting-period selection, repayment plan and standing-order dates. DisbursementProcessedDate stores actual processing time. Form 9 no longer excludes historical business events merely because their loan record was created later. Existing disbursed loans were not changed.

Local EF migration applied: nullable LoanDisbursementBatches.EffectiveDisbursementDate and LoanCases.DisbursementProcessedDate. FY2026 was verified open and unlocked, covering 25 August 2026. No historical customer, loan or journal dates were modified.

Verification: Debug builds; effective-date boundary tests; AppService rejects invalid historical approval before posting mutations; 175 Form 9 checks including later record creation; full SASRA regression suite; actionable HTTP 409 error test; changed JSX parsed successfully. No end-to-end browser disbursement was performed.

The existing worker posting pipeline uses multiple independent transactions. This change validates dates before that pipeline; it does not claim atomicity for the whole disbursement process. A separate controlled correction is needed for already-posted loans.

Restart the API and background service after rebuilding Debug, then refresh the frontend. A confirmed reporting repayment schedule and valid August insider appointment/board evidence are still required for complete Form 9 reporting.
