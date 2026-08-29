import assert from "node:assert/strict";
import { savingsProductPayload, validateSavingsProduct } from "../src/pages/Accounts/SavingsProducts/validation.js";

const valid = {
  Description: "Ordinary Savings",
  MaximumAllowedWithdrawal: "50000",
  MaximumAllowedDeposit: "100000",
  MinimumBalance: "500",
  OperatingBalance: "1000",
  WithdrawalNoticeAmount: "25000",
  WithdrawalNoticePeriod: "7",
  WithdrawalInterval: "1",
  AnnualPercentageYield: "6.5",
  Priority: "1",
  ChartOfAccountId: "00000000-0000-0000-0000-000000000001",
};

assert.deepEqual(validateSavingsProduct(valid), []);
assert.equal(savingsProductPayload(valid).AnnualPercentageYield, 6.5);
assert.equal(savingsProductPayload({ ...valid, Description: "  Ordinary Savings  " }).Description, "Ordinary Savings");

const invalid = validateSavingsProduct({
  ...valid,
  MaximumAllowedWithdrawal: "0",
  MinimumBalance: "2000",
  OperatingBalance: "1000",
  WithdrawalNoticeAmount: "60000",
  WithdrawalNoticePeriod: "1.5",
  AnnualPercentageYield: "101",
  Priority: "4",
});
assert(invalid.some((message) => message.includes("Maximum allowed withdrawal must be greater than zero")));
assert(invalid.some((message) => message.includes("Operating balance cannot be lower")));
assert(invalid.some((message) => message.includes("notice amount cannot exceed")));
assert(invalid.some((message) => message.includes("notice period must be a whole number")));
assert(invalid.some((message) => message.includes("yield cannot exceed 100%")));
assert(invalid.some((message) => message.includes("priority must be between 0 and 3")));

console.log("All savings-product validation tests passed.");
