import assert from "node:assert/strict";
import { validateForm6Dates } from "../src/pages/Reports/GenerateSasraForm/form6Model.js";
assert.equal(validateForm6Dates("2026-01-01", "2026-12-31"), "");
assert.equal(validateForm6Dates("2025-07-01", "2026-06-30"), "");
assert.equal(validateForm6Dates("2024-02-29", "2025-02-27"), "");
for (const pair of [["", ""], ["2026-02-30", "2026-03-01"], ["2026-01-01", "2027-01-01"], ["2026-01-01", "2025-12-31"], ["2024-02-29", "2025-02-28"], ["0001-01-01", "0001-02-01"]]) assert.ok(validateForm6Dates(...pair));
console.log("Form 6 fiscal-year date validation passed.");
