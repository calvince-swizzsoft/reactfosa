import NoticeTemplateEditor from './NoticeTemplateEditor';
import {Button} from '@/components/ui/button';
import {Input} from '@/components/ui/input';
import FieldLabel from '@/pages/Accounts/BatchProcedures/lib/BatchFieldLabel';
import {noticeTypes,parseNoticePolicy,validateNoticePolicy} from './noticePolicy';

export default function DefaulterNoticeSettings({form,update}) {
 let policy;
 try {policy=parseNoticePolicy(form.defaulterNoticePolicyJson);if(!policy || !Array.isArray(policy.stages) || policy.stages.some(s=>!s))throw new Error();}catch{return <p role="alert" className="text-red-700">The saved notice settings could not be read. Reopen the company before saving.</p>;}
 const save=p=>update('defaulterNoticePolicyJson',JSON.stringify(p));
 const setStage=(i,key,value)=>save({...policy,stages:policy.stages.map((s,n)=>n===i?{...s,[key]:value}:s)});
 const add=()=>{const type=noticeTypes.find(([key])=>!policy.stages.some(s=>s.noticeType===key))?.[0];if(type)save({...policy,stages:[...policy.stages,{noticeType:type,daysOverdue:1,minimumArrears:0,recipient:type.startsWith('Guarantor')?'Guarantors':'Borrower',responseDays:7,channel:'Print',requireApproval:true,template:''}]});};
 const select=(i,key,options)=><select aria-label={`${key} for stage ${i+1}`} className="border rounded-md p-2 w-full bg-white" value={policy.stages[i][key]} onChange={e=>setStage(i,key,e.target.value)}>{options.map(([value,label])=><option key={value} value={value}>{label}</option>)}</select>;
 return <section className="space-y-4 text-gray-700">
  <h3 className="font-semibold text-lg">Defaulter Notice Settings</h3>
  <FieldLabel label={`Company policy · Revision ${form.defaulterNoticePolicyRevision??0}`} help="Loaning resolves this policy through Loan case → Branch → Company. A missing company link stops policy resolution. Settings are saved with this company; saving does not send notices."/>
  <label className="flex items-center gap-2"><input type="checkbox" className="accent-indigo-600" checked={policy.enabled} onChange={e=>save({...policy,enabled:e.target.checked})}/>Enable defaulter notice policy</label>
  <div className="flex justify-end"><Button type="button" disabled={policy.stages.length>=6} className="bg-indigo-600 hover:bg-indigo-700" onClick={add}>Add notice stage</Button></div>
  {policy.stages.map((s,i)=><article key={i} className="border rounded-lg p-4 bg-white shadow space-y-3">
   <div className="flex justify-between items-center"><strong>Stage {i+1}</strong><Button type="button" variant="outline" onClick={()=>save({...policy,stages:policy.stages.filter((_,n)=>n!==i)})}>Remove</Button></div>
   <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
    <div><FieldLabel label="Notice type" help="Ordinary borrower and guarantor collection notices. Statutory enforcement and CRB notices require separate legally validated workflows."/>{select(i,'noticeType',noticeTypes)}</div>
    <div><FieldLabel label="Days overdue" help="Minimum days overdue before this stage is eligible. This is a company policy threshold, not a universal statutory deadline."/><Input aria-label={`Days overdue for stage ${i+1}`} type="number" min="1" max="3650" value={s.daysOverdue??''} onChange={e=>setStage(i,'daysOverdue',e.target.value===''?null:Number(e.target.value))}/></div>
    <div><FieldLabel label="Minimum arrears (KSh)" help="Minimum overdue principal plus overdue interest. Zero means any positive arrears may qualify."/><Input aria-label={`Minimum arrears for stage ${i+1}`} type="number" min="0" step="0.01" value={s.minimumArrears??''} onChange={e=>setStage(i,'minimumArrears',e.target.value===''?null:Number(e.target.value))}/></div>
    <div><FieldLabel label="Recipient" help="Borrower, guarantors, or both. Guarantor notices must include guarantors."/>{select(i,'recipient',[['Borrower','Borrower'],['Guarantors','Guarantors'],['Both','Both']])}</div>
    <div><FieldLabel label="Response period (days)" help="Calendar days allowed to respond after the notice is issued. This does not authorize recovery automatically."/><Input aria-label={`Response days for stage ${i+1}`} type="number" min="1" max="365" value={s.responseDays??''} onChange={e=>setStage(i,'responseDays',e.target.value===''?null:Number(e.target.value))}/></div>
    <div><FieldLabel label="Delivery channel" help="Preferred delivery method for future notice processing. Configuring email or SMS does not send messages."/>{select(i,'channel',[['Print','Print / letter'],['Email','Email'],['SMS','SMS']])}</div>
   </div>
   <label className="flex gap-2 items-center"><input type="checkbox" className="accent-indigo-600" checked={s.requireApproval} onChange={e=>setStage(i,'requireApproval',e.target.checked)}/>Require approval before sending</label>
   <NoticeTemplateEditor stage={s} index={i} onChange={value=>setStage(i,'template',value)}/>
  </article>)}
  {!policy.stages.length&&<p className="text-gray-500 text-center py-5">No notice stages configured.</p>}
  {validateNoticePolicy(form.defaulterNoticePolicyJson).map(message=><p key={message} role="alert" className="text-sm text-red-700">{message}</p>)}
 </section>;
}
