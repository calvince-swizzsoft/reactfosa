import assert from 'node:assert/strict';
import { emptyLine, emptyVersion, validateDefinition } from '../src/pages/Reports/GenerateSasraForm/setupModel.js';
const model = () => ({ ...emptyVersion('DT'), reportCode: 'F6', title: 'Financial position', version: 'test', lines: [{ ...emptyLine(), code: '1', description: 'Cash', sheet: 'Form 6', cell: 'D10' }] });
assert.equal(validateDefinition(model()), '');
for (const mutate of [d => d.profile = '', d => d.title = '', d => d.lines = [], d => d.lines[0].sign = 0, d => d.lines[0].cell = 'XFE1', d => d.lines[0].cell = 'A1048577', d => d.lines[0].sheet = 'bad/name', d => d.lines.push(d.lines[0]), d => d.sourceUrl = 'https://sasra.go.ke.evil.test', d => d.workbookSha256 = 'bad', d => d.lines[0].accountIds = ['AAA', 'aaa']]) {
  const d = model(); mutate(d); assert.notEqual(validateDefinition(d), '');
}
const big = model(); big.profile = 'NWDT'; big.lines = Array.from({ length: 500 }, (_, i) => ({ ...emptyLine(), code: String(i), description: 'Line ' + i, sheet: 'Form', cell: `D${i + 1}` }));
assert.equal(validateDefinition(big), '');
big.lines.push({ ...emptyLine() }); assert.notEqual(validateDefinition(big), '');
console.log('PASS: SASRA client validation, duplicate mappings, Excel limits and 500-line definition.');
