import assert from 'node:assert/strict';
import {validateNoticePolicy,parseNoticePolicy} from '../src/pages/Administration/Company/noticePolicy.js';
const stage={noticeType:'Reminder',daysOverdue:7,minimumArrears:100,recipient:'Borrower',responseDays:14,channel:'Print',requireApproval:true,template:'Dear {{borrowerName}}, arrears {{arrears}} as at {{asAt}}.'};
const check=p=>validateNoticePolicy(JSON.stringify(p));
assert.deepEqual(parseNoticePolicy(null),{enabled:false,stages:[]});
assert.deepEqual(check({enabled:true,stages:[stage]}),[]);
for(const changes of [{daysOverdue:0},{daysOverdue:null},{responseDays:1.5},{minimumArrears:-1},{minimumArrears:1.001},{template:''},{template:'{{badToken}}'},{noticeType:'GuarantorDemand',recipient:'Borrower'}])assert.ok(check({enabled:true,stages:[{...stage,...changes}]}).length);
assert.ok(check({enabled:true,stages:[]}).length);
assert.ok(check({enabled:true,stages:[stage,stage]}).length);
assert.ok(validateNoticePolicy('{invalid').length);
console.log('Company notice policy validation: passed.');
import {noticeTypes} from '../src/pages/Administration/Company/noticePolicy.js';
import {starterMessage,sampleMessage,templateDetails} from '../src/pages/Administration/Company/noticeTemplates.js';
for(const [noticeType] of noticeTypes)for(const channel of ['Print','Email','SMS']) {
 const recipient=noticeType.startsWith('Guarantor')?'Guarantors':'Borrower';
 const template=starterMessage(noticeType,channel,recipient);
 const configured={...stage,noticeType,channel,recipient,template};
 assert.deepEqual(check({enabled:true,stages:[configured]}),[],`${noticeType}/${channel}`);
 const rendered=sampleMessage(template,configured);
 assert.ok(!rendered.includes('{{'),`${noticeType}/${channel} leaves unresolved details`);
 assert.ok(rendered.includes('12,500.00'));
 assert.ok(rendered.includes('30 Sept 2026')||rendered.includes('30 Sep 2026'));
}
assert.ok(sampleMessage('{{recipientName}}',{recipient:'Guarantors'}).includes('Pat Wanjiru'));
assert.equal(sampleMessage('{{unknown}}',stage),'{{unknown}}');
assert.ok(!sampleMessage(templateDetails.map(([key])=>'{{'+key+'}}').join(' '),stage).includes('{{'));
console.log('All 18 starter/channel combinations and sample substitutions: passed.');
