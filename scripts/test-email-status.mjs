import assert from 'node:assert/strict';
import { emailStatusLabel } from '../src/pages/Messaging/EmailAlerts/statusModel.js';
assert.equal(emailStatusLabel({ MailMessageDLRStatus: 8, MailMessageDLRStatusDescription: 'Delivered' }), 'Sent');
assert.equal(emailStatusLabel({ mailMessageDLRStatus: 2 }), 'Failed');
assert.equal(emailStatusLabel({ mailMessageDLRStatusDescription: 'Delivered' }), 'Sent');
assert.equal(emailStatusLabel({ mailMessageDLRStatus: 32 }), 'Submitted (legacy)');
console.log('PASS email status labels and API casing compatibility');
