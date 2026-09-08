import assert from "node:assert/strict";
import { validateRegistrationGuarantors as validate } from "../src/pages/Loaning/LoanCases/lib/guarantorValidation.js";
const product = { LoanRegistrationMinimumGuarantors: 1, LoanRegistrationMaximumGuarantees: 2, LoanRegistrationGuarantorSecurityMode: 0 };
const row = { GuarantorId: "member", AmountGuaranteed: "1000", lookup: { securityMode: 0, availableToGuarantee: null } };
assert.equal(validate(product, "borrower", 1000, [row]), null, "Income guarantees must not be limited by zero shares");
for (const flags of [{}, { LoanRegistrationMicrocredit: true }, { LoanRegistrationSecurityRequired: false }]) {
  assert.match(validate({ ...product, ...flags }, "borrower", 1000, []), /at least/);
}
for (const value of [0, -1, "Infinity", "NaN", "1.001"]) assert.match(validate(product, "borrower", 1000, [{ ...row, AmountGuaranteed: value }]), /positive/);
assert.match(validate(product, "borrower", 1000, [row, row]), /only once/);
assert.match(validate(product, "borrower", 1000, [{ ...row, GuarantorId: "" }]), /Select a member/);
assert.match(validate(product, "borrower", 1000, [{ ...row, lookup: null }]), /eligibility/);
assert.match(validate(product, "member", 1000, [row]), /self-guarantee/);
assert.match(validate({ ...product, LoanRegistrationAllowSelfGuarantee: true, LoanRegistrationMaximumSelfGuaranteeEligiblePercentage: 50 }, "member", 1000, [row]), /percentage/);
const investment = { ...product, LoanRegistrationGuarantorSecurityMode: 1, LoanRegistrationSecurityRequired: true, LoanRegistrationMicrocredit: true };
const secured = { ...row, lookup: { securityMode: 1, availableToGuarantee: 1000 } };
assert.equal(validate(investment, "borrower", 1000, [secured]), null);
assert.match(validate(investment, "borrower", 1000, [{ ...secured, AmountGuaranteed: 1001 }]), /capacity/);
assert.match(validate(investment, "borrower", 1500, [secured]), /fully secure/);
assert.equal(validate(investment, "borrower", 1500, [secured], 500), null);
assert.match(validate(investment, "borrower", 1000, [row]), /refresh/);
assert.match(validate({ ...product, LoanRegistrationMaximumGuarantees: 0 }, "borrower", 1000, [row]), /configuration/);
console.log("All guarantor registration UI validation scenarios passed.");
