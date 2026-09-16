import assert from 'node:assert/strict';
import { reportRows, latestReportRows, availableReportRows } from '../src/pages/Reports/GenerateSasraForm/reportListModel.js';
const rows = reportRows('DT', [{reportCode:'FORM 6',title:'SOFP'},{reportCode:'FORM 2',title:'Liquidity'}], {
  form6: { definition: { revision: 7, lines: [{accountIds:['a','b']}] } },
  form7: { definition: { revision: 0, lines: [] } },
  form1: { error: 'Network unavailable' },
});
assert.equal(rows.filter(r=>r.reportCode==='FORM 6').length,1);
assert.equal(rows.find(r=>r.reportCode==='FORM 6').revision,7);
assert.equal(rows.find(r=>r.reportCode==='FORM 6').mappedAccounts,2);
assert.equal(rows.find(r=>r.reportCode==='FORM 7').revision,0);
assert.equal(rows.find(r=>r.reportCode==='FORM 7').loaded,true);
assert.equal(rows.find(r=>r.reportCode==='FORM 1').error,'Network unavailable');
assert.equal(rows.find(r=>r.reportCode==='FORM 2').endpoint,'form2');
assert.equal(reportRows('DT').length,7);
assert.equal(reportRows('NWDT').length,0);
assert.equal(reportRows('NotApplicable').length,0);
console.log('PASS: one row per report, current revision, unsaved reports, load failures and profile separation.');
const history = [
  {id:'current',profile:'DT',reportCode:'FORM 6',version:'WORKBOOK-current',revision:2},
  {id:'previous',profile:'DT',reportCode:'FORM 6',version:'WORKBOOK-current',revision:1},
  {id:'older-workbook',profile:'DT',reportCode:'FORM 6',version:'WORKBOOK-old',revision:99},
  {id:'other-category',profile:'NWDT',reportCode:'FORM 6',version:'custom',revision:1},
];
assert.equal(latestReportRows(history).length,2);
assert.equal(latestReportRows(history).find(r=>r.profile==='DT').id,'current');
assert.equal(latestReportRows([]).length,0);
console.log('PASS: existing reports deduplicated without institution settings; older workbook revision numbers cannot override the current workbook.');
assert.deepEqual(availableReportRows([]).map(r=>r.reportCode),['FORM 1','FORM 2','FORM 3','FORM 4','FORM 5','FORM 6','FORM 7']);
assert.ok(availableReportRows([]).every(r=>r.revision===0 && !r.id && r.endpoint));
const available = availableReportRows([
  {id:'catalogue',profile:'DT',reportCode:'FORM 6',version:'CATALOGUE-2026',revision:100},
  {id:'old',profile:'DT',reportCode:'FORM 6',version:'WORKBOOK-CD81FC5DAAD8',revision:1},
  {id:'latest',profile:'DT',reportCode:'FORM 6',version:'WORKBOOK-CD81FC5DAAD8',revision:3},
]);
assert.equal(available.length,7);
assert.equal(available.find(r=>r.reportCode==='FORM 6').id,'latest');
assert.equal(available.find(r=>r.reportCode==='FORM 1').revision,0);
console.log('PASS: empty database still lists seven implemented reports; saved workbook mappings override placeholders without catalogue duplicates.');

assert.equal(availableReportRows([], 'DT').length, 7);
assert.deepEqual(availableReportRows([], 'NWDT'), []);
const mixed = [{ id: 'nwdt', profile: 'NWDT', reportCode: 'FORM 2G', version: 'custom', revision: 1 }];
assert.ok(availableReportRows(mixed, 'DT').every(row => row.profile === 'DT'));
assert.deepEqual(availableReportRows(mixed, 'NWDT').map(row => row.id), ['nwdt']);
assert.ok(availableReportRows(mixed, 'NWDT').every(row => !row.endpoint));
console.log('PASS: DT and NWDT pages isolate reports and preserve saved category definitions.');

assert.equal(availableReportRows([]).find(r=>r.reportCode==='FORM 4').derived,true);

assert.equal(availableReportRows([]).find(r=>r.reportCode==='FORM 5').endpoint,'form5');
