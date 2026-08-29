import assert from "node:assert/strict";
import { investmentProductPayload, validateInvestmentProduct } from "../src/pages/Accounts/InvestmentProducts/validation.js";

const valid = { Description: "Fixed Deposit", MinimumBalance: "1000", MaximumBalance: "100000", PoolAmount: "0", MaturityPeriod: "90", AnnualPercentageYield: "8.5", Priority: "1", ChartOfAccountId: "id", PoolChartOfAccountId: "", IsPooled: false, TrackArrears: false, ThrottleScheduledArrearsRecovery: false };
assert.deepEqual(validateInvestmentProduct(valid), []);
assert.equal(investmentProductPayload(valid).MinimumBalance, 1000);
assert.equal(investmentProductPayload({ ...valid, Description: " Fixed Deposit " }).Description, "Fixed Deposit");

const invalid = validateInvestmentProduct({ ...valid, MinimumBalance: "2000", MaximumBalance: "1000", MaturityPeriod: "2.5", AnnualPercentageYield: "101", Priority: "4", IsPooled: true, PoolAmount: "0" });
assert(invalid.some((x) => x.includes("Maximum balance cannot be lower")));
assert(invalid.some((x) => x.includes("Maturity period must be a whole")));
assert(invalid.some((x) => x.includes("yield cannot exceed 100")));
assert(invalid.some((x) => x.includes("priority must be a whole number between 0 and 3")));
assert(invalid.some((x) => x.includes("Pool G/L Account is required")));

const nonPooledWithPool = validateInvestmentProduct({ ...valid, PoolAmount: "500", IsPooled: false });
assert(nonPooledWithPool.some((x) => x.includes("Pool amount must be zero")));

const sameGl = validateInvestmentProduct({ ...valid, IsPooled: true, PoolAmount: "500", PoolChartOfAccountId: valid.ChartOfAccountId });
assert(sameGl.some((x) => x.includes("Pool G/L Account must be different")));

assert(validateInvestmentProduct({ ...valid, Description: "x".repeat(257) }).some((x) => x.includes("cannot exceed 256")));

console.log("All investment-product validation tests passed.");
