# Loan pipeline E2E results

Latest complete run: 2026-08-17 against the disposable local IIS/test database.

Command:

```powershell
npm run test:loan-e2e -- all
```

Result: all 11 stages passed.

| Stage | Result | Evidence |
|---|---|---|
| Preflight | PASS | Required authentication, loan-case, file-register, and disbursement routes responded |
| Provision users | PASS | Registrar, appraiser, approver, and verifier identities available with FOSA workflow mappings |
| Authenticate | PASS | JWT login and initial-password-change flow validated |
| Catalogues | PASS | Customer, loan product, purpose, and remark endpoints responded |
| Register | PASS | Loan case `0000707` created |
| File tracking | PASS | File register dispatched and received |
| Appraise | PASS | Appraisal completed through the assigned appraisal workflow item |
| Approve | PASS | Approval completed by a distinct operator through its workflow item |
| Verify | PASS | Verification completed by a distinct operator through its workflow item |
| Disburse | PASS | Batch `3` authorized and entry posted |
| Assertions | PASS | Case is Disbursed; loan account `001-0001012-002-016` and savings account `001-0001012-001-001` exist; all three workflows are Approved/Matched |

## Iterations and defects found

1. FOSA registration initially returned 403 because only `Teller` was mapped to `FrontOfficeLoanRegistration`. The test setup now verifies/adds the required `Credit Admin` mappings for all FOSA stages.
2. The appraisal row committed and then returned 500 when the optional alert broker failed, leaving its workflow item pending. Alert dispatch is now best-effort after commit, and the appraisal endpoint can recover an already-committed appraisal by completing its still-pending workflow.
3. A single operator cannot progress the whole chain because maker/checker correctly rejects the workflow item's creator. The suite now uses distinct registrar, appraiser, approver, and verifier identities.
4. The serialized verification state is described as `Verified`, while several API comments/frontend notes call it `Audited`. The runner accepts both descriptions; the naming should be normalized separately.
5. Authorization can post an entry asynchronously before the runner's deterministic POST. The runner treats the resulting 409 as success only when the persisted entry is already `Posted`.

The elaborate take-home and repayment formulas found only in commented legacy
code remain non-authoritative and were not restored or asserted by this suite.
