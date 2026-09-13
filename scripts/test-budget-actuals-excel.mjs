import assert from "node:assert/strict";
import * as XLSX from "xlsx";
import { buildBudgetActualsWorkbook } from "../src/pages/Accounts/BudgetManagement/budgetActualsExcel.js";

const report = {
  Budget: { Description: "Test budget", BranchDescription: "Test branch", PostingPeriodDescription: "2026", PostingPeriodDurationStartDate: "2026-01-01", PostingPeriodDurationEndDate: "2026-12-31" },
  AsAt: "2026-09-12",
  Lines: Array.from({ length: 205 }, (_, i) => ({ Section: "Expenses", Code: String(i), Description: i === 0 ? "=NotAFormula" : "Expense", Budget: i === 0 ? 0 : 100, Actual: 20, Difference: i === 0 ? -20 : 80, Percentage: i === 0 ? null : 0.2, Unbudgeted: i === 0 })),
  Totals: [{ Section: "Expenses", Budget: 20400, Actual: 4100, Difference: 16300, Percentage: 4100 / 20400 }],
};
const original = buildBudgetActualsWorkbook(report);
const data = XLSX.write(original, { type: "buffer", bookType: "xlsx" });
const read = XLSX.read(data, { type: "buffer", cellFormula: true, cellNF: true }).Sheets["Budget vs Actual"];
assert.equal(read.B2.v, "Test budget");
assert.equal(read.D3.v, "2026-09-12");
assert.equal(read.B9.t, "s");
assert.equal(read.E9.v, -20);
assert.equal(read.E9.f, "C9-D9");
assert.equal(read.F9.v, "");
assert.equal(read.F10.f, "D10/C10");
assert.equal(read.F10.v, 0.2);
assert.equal(read.C213.v, 100); // Last of 205 rows.
assert.equal(read["!autofilter"].ref, "A8:G213");
assert.equal(read.C217.v, 20400);
assert.equal(read.D217.v, 4100);
assert.equal(read.E217.v, 16300);
assert.equal(read.C217.f, "SUMIF(A9:A213,A217,C9:C213)");
assert.doesNotThrow(() => buildBudgetActualsWorkbook({ ...report, Lines: [], Totals: [] }));
console.log("PASS: Excel round-trip preserves all 205 rows, report filters, totals, formulas, zero-budget percentages and text cells.");
