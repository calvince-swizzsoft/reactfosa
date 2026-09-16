export const noticeTypes = [['Reminder','Payment reminder'],['FirstNotice','First defaulter notice'],['SecondNotice','Second defaulter notice'],['FinalDemand','Final demand'],['GuarantorNotification','Guarantor notification'],['GuarantorDemand','Guarantor payment demand']];
export const noticeTokens = ['companyName','borrowerName','recipientName','loanNumber','arrears','principalOverdue','interestOverdue','daysOverdue','asAt','responseDeadline'];
export function parseNoticePolicy(json) { return json == null ? {enabled:false,stages:[]} : JSON.parse(json); }
export function validateNoticePolicy(json) {
 try {
  const p=parseNoticePolicy(json), errors=[];
  if(!p||!Array.isArray(p.stages)||p.stages.length>6||p.enabled&&!p.stages.length)return ['Defaulter notices: provide one to six stages when enabled.'];
  const seen=new Set();
  for(const s of p.stages){
   if(!s||!noticeTypes.some(([k])=>k===s.noticeType))return ['Defaulter notices: select a supported notice type.'];
   if(seen.has(s.noticeType))errors.push('Defaulter notices: each notice type may appear only once.');
   seen.add(s.noticeType);
   if(!Number.isInteger(s.daysOverdue)||s.daysOverdue<1||s.daysOverdue>3650||!Number.isInteger(s.responseDays)||s.responseDays<1||s.responseDays>365)errors.push('Defaulter notices: overdue days must be 1–3650 and response days 1–365.');
   if(!Number.isFinite(s.minimumArrears)||s.minimumArrears<0||s.minimumArrears>1e15||Math.abs(s.minimumArrears*100-Math.round(s.minimumArrears*100))>0.001)errors.push('Defaulter notices: minimum arrears must be non-negative with at most two decimal places.');
   if(!['Borrower','Guarantors','Both'].includes(s.recipient)||!['Print','Email','SMS'].includes(s.channel))errors.push('Defaulter notices: select a recipient and delivery channel.');
   if(s.noticeType.startsWith('Guarantor')&&s.recipient==='Borrower')errors.push('Defaulter notices: guarantor notices must include guarantors.');
   if(!s.template?.trim()||s.template.length>8000)errors.push('Defaulter notices: each stage needs a template of 1–8000 characters.');
   if([...String(s.template??'').matchAll(/\{\{(.*?)\}\}/g)].some(m=>!noticeTokens.includes(m[1])))errors.push('Defaulter notices: use only the supported template placeholders.');
   const remainder=String(s.template??'').replace(/\{\{(.*?)\}\}/g,'');
   if(remainder.includes('{{')||remainder.includes('}}'))errors.push('Defaulter notices: close every template placeholder with double braces.');
  }
  return [...new Set(errors)];
 } catch {return ['Defaulter notices: the saved settings could not be read. Reopen the company before saving.'];}
}
