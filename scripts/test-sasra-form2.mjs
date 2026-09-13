import assert from 'node:assert/strict';
import { newLiquidityInputs, validateLiquidityInputs, liquidityPayload, exclusionCells } from '../src/pages/Reports/GenerateSasraForm/form2Model.js';
const i = newLiquidityInputs();
assert.match(validateLiquidityInputs(i, '2026-01-01', '2026-09-12'), /D15/);
for (const group of ['manualAmounts', 'exclusions']) for (const k of Object.keys(i[group])) i[group][k] = '0';
i.reviewNotes = 'Reviewed bank, maturity and deposit schedules';
assert.equal(validateLiquidityInputs(i, '2026-01-01', '2026-09-12'), '');
assert.equal(liquidityPayload(i).manualAmounts.D16, 0);
assert.equal(liquidityPayload(i).liquidityReviewed, false);
for (const value of ['', ' ', '-1', 'Infinity', 'abc', '1e16', null]) { const t = structuredClone(i); t.exclusions.D13 = value; assert.match(validateLiquidityInputs(t, '2026-01-01', '2026-09-12'), /D13/); }
assert.match(validateLiquidityInputs(i, '2026-01-01', '2027-01-01'), /date/);
assert.match(validateLiquidityInputs({ ...i, reviewNotes: '' }, '2026-01-01', '2026-09-12'), /supporting/);
assert.equal(exclusionCells.length, 11);
console.log('PASS Form 2: explicit zeros, schedule validation, dates and numeric payload.');
