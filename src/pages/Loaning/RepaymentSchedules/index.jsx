import {useEffect,useRef,useState} from 'react';
import {FaCalendarAlt} from 'react-icons/fa';
import {Button} from '@/components/ui/button';
import {BatchFieldHelp} from '@/pages/Accounts/BatchProcedures/lib/BatchFieldLabel';
import {apiJson} from '@/lib/api';
import Swal from 'sweetalert2';

const base=`${import.meta.env.VITE_APP_FIN_URL}/api/backoffice/loan-ageing`;
const normalize=v=>Array.isArray(v)?v.map(normalize):v&&typeof v==='object'?Object.fromEntries(Object.entries(v).map(([k,x])=>[k[0].toLowerCase()+k.slice(1),normalize(x)])):v;
async function get(path){const r=await apiJson(base+path,{cache:'no-store'});return normalize(r.data??r.Data);}
const money=n=>Number(n??0).toLocaleString('en-KE',{minimumFractionDigits:2,maximumFractionDigits:2});
const date=v=>v?.slice(0,10)||'—';
function Pager({page,total,onChange,disabled=false}){const pages=Math.max(1,Math.ceil(total/20));return <div className="flex justify-center items-center gap-3 mt-4"><Button disabled={disabled||page===0} onClick={()=>onChange(page-1)}>Prev</Button><span>Page {page+1} of {pages}</span><Button disabled={disabled||page+1>=pages} onClick={()=>onChange(page+1)}>Next</Button></div>;}

export default function RepaymentSchedules(){
 const [page,setPage]=useState(0),[cases,setCases]=useState({items:[],total:0}),[loading,setLoading]=useState(true),[error,setError]=useState(''),[reload,setReload]=useState(0);
 const [loan,setLoan]=useState(null),[schedule,setSchedule]=useState(null),[scheduleLoading,setScheduleLoading]=useState(false),[scheduleError,setScheduleError]=useState(''),[linePage,setLinePage]=useState(0),[basis,setBasis]=useState(''),[warnings,setWarnings]=useState([]);
 const requestId=useRef(0);
 const [proposal,setProposal]=useState(null),[saving,setSaving]=useState(false);
 const saveInFlight=useRef(false);
 useEffect(()=>{let active=true;setLoading(true);setError('');get(`/cases?pageIndex=${page}&pageSize=20`).then(r=>{if(active)setCases(r);}).catch(e=>{if(active){setCases({items:[],total:0});setError(e.message);}}).finally(()=>{if(active)setLoading(false);});return()=>{active=false;};},[page,reload]);
 useEffect(()=>()=>{requestId.current++;},[]);
 function close(){if(saveInFlight.current)return;requestId.current++;setLoan(null);setSchedule(null);setProposal(null);setScheduleLoading(false);}
 async function open(selected){
  if(saveInFlight.current)return;
  const id=++requestId.current;setLoan(selected);setSchedule(null);setProposal(null);setScheduleError('');setLinePage(0);setBasis('');setWarnings([]);setScheduleLoading(true);
  try{
   let plan=await get(`/cases/${selected.id}/plan`),source=plan.isConfirmed&&plan.interestTermsConfirmed?'Saved repayment schedule':'Saved schedule · unconfirmed terms',issues=[],generated=null;
   if(!plan.instalments?.length){generated=await get(`/cases/${selected.id}/schedule-proposal`);plan=generated.plan;source='Calculated from saved loan terms';issues=generated.warnings||[];}
   if(id!==requestId.current)return;
   setSchedule(plan);setProposal(generated);setBasis(source);setWarnings(issues);
  }catch(e){if(id===requestId.current)setScheduleError(e.message);}finally{if(id===requestId.current)setScheduleLoading(false);}
 }
 async function save(){
  if(saveInFlight.current||!proposal?.canConfirm||!proposal.proposalHash||!schedule?.instalments?.length)return;
  const id=requestId.current;saveInFlight.current=true;setSaving(true);setScheduleError('');
  try{
   const response=await apiJson(base+'/generated-schedules/confirm',{method:'POST',body:JSON.stringify([{loanCaseId:loan.id,revision:proposal.plan.revision,proposalHash:proposal.proposalHash}])});
   const saved=normalize(response.data??response.Data)?.[0];
   if(id!==requestId.current)return;
   if(!saved?.instalments?.length)throw new Error('The save response was incomplete. Close and reopen this loan to check its saved schedule.');
   setSchedule(saved);setProposal(null);setWarnings([]);setBasis('Saved repayment schedule');setReload(n=>n+1);
   Swal.fire({icon:'success',title:'Schedule saved',text:'The repayment schedule is saved and confirmed for ageing.'});
  }catch(e){if(id===requestId.current)setScheduleError(e.message);}
  finally{saveInFlight.current=false;if(id===requestId.current)setSaving(false);}
 }
 return <main className="bg-white m-8 px-8 py-8 shadow-2xl rounded-lg relative">
  <header className="bg-indigo-800 px-6 py-3 rounded-2xl flex justify-between items-center gap-3 mb-5"><h1 className="text-xl font-bold text-white flex items-center gap-2"><FaCalendarAlt/>Repayment Schedules</h1><Button variant="outline" disabled={loading} onClick={()=>setReload(n=>n+1)}>Refresh</Button></header>
  {error&&<p role="alert" className="p-3 mb-3 rounded-lg bg-red-50 text-red-700">{error}</p>}
  <div className="bg-gray-200 p-4 rounded-sm overflow-x-auto"><div className="min-w-[850px]"><div className="grid grid-cols-12 gap-4 bg-gray-700 text-gray-100 font-semibold p-3 rounded-lg mb-4"><span className="col-span-3">Loan</span><span className="col-span-4">Loanee</span><span className="col-span-3 text-right">Disbursed amount (KSh)</span><span className="col-span-2 text-right">Schedule</span></div><div className="space-y-2">
   {loading?[1,2,3].map(n=><div key={n} className="grid grid-cols-12 gap-4 animate-pulse bg-gray-50 p-4 rounded-lg"><span className="col-span-3 h-5 bg-gray-200 rounded"/><span className="col-span-4 h-5 bg-gray-200 rounded"/><span className="col-span-3 h-5 bg-gray-200 rounded"/><span className="col-span-2 h-5 bg-gray-200 rounded"/></div>):cases.items.map(c=><div key={c.id} className="w-full text-left grid grid-cols-12 gap-4 p-3 bg-white rounded-lg shadow-lg border hover:shadow-xl transition-all text-sm text-gray-700 focus-visible:outline-indigo-600"><span className="col-span-3"><strong>Loan {c.caseNumber}</strong><span className="block text-gray-500">{c.product}</span></span><span className="col-span-4 self-center">{c.loaneeName?.trim()||'Name unavailable'}</span><span className="col-span-3 self-center text-right tabular-nums">{money(c.disbursedAmount)}</span><span className="col-span-2 self-center text-right"><Button className="bg-indigo-600 hover:bg-indigo-700" aria-label={`View schedule for loan ${c.caseNumber}`} onClick={()=>open(c)}>View schedule</Button></span></div>)}
  </div>{!loading&&!cases.items.length&&!error&&<div className="text-center py-6"><img src="/assets/scopefinding.png" alt="" className="w-32 mx-auto"/><p className="text-gray-400">No disbursed loans found.</p></div>}</div></div>
  <Pager page={page} total={cases.total} disabled={loading} onChange={setPage}/>
  {loan&&<div className="fixed inset-0 z-50 flex justify-end bg-black/40"><section role="dialog" aria-modal="true" aria-labelledby="repayment-schedule-title" className="m-2 w-full max-w-4xl bg-white rounded-2xl flex flex-col shadow-2xl">
   <header className="m-2 bg-indigo-600 text-white rounded-2xl p-4 flex justify-between items-center shrink-0"><h2 id="repayment-schedule-title" className="font-bold">Loan {loan.caseNumber} · Repayment Schedule</h2><Button variant="outline" disabled={saving} onClick={close}>Close</Button></header>
   <div className="flex-1 overflow-y-auto px-5 py-4"><div className="flex flex-wrap justify-between gap-2 text-sm text-gray-700 mb-4"><span>{loan.loaneeName?.trim()||'Name unavailable'} · {loan.product}</span><span>Disbursed: KSh {money(loan.disbursedAmount)}</span></div>
    {scheduleError&&<p role="alert" className="p-3 rounded-lg bg-red-50 text-red-700">{scheduleError}</p>}
    {scheduleLoading?<p role="status" className="animate-pulse text-gray-500 py-6">Loading repayment schedule…</p>:schedule&&<>
     <div className="flex items-center gap-1 text-xs text-gray-500 mb-3"><span>{warnings.length?'Calculated schedule · interest terms need review':basis}</span><BatchFieldHelp label="Schedule basis">{warnings.length?warnings.join(' '):basis==='Calculated from saved loan terms'?'Calculated using the original disbursement and the loan’s saved terms. Use Save schedule to persist and confirm these terms for ageing. Viewing alone does not save anything.':'Shows the latest saved repayment schedule. Amounts are the scheduled payments, not the remaining balance after repayments.'}</BatchFieldHelp></div>
     <div className="overflow-x-auto bg-gray-200 p-3 rounded-sm" role="table" aria-label="Repayment schedule"><div className="min-w-[640px]"><div role="row" className="grid grid-cols-12 gap-3 bg-gray-700 text-gray-100 font-semibold text-sm p-3 rounded-lg mb-2"><span role="columnheader">No.</span><span role="columnheader" className="col-span-3">Principal due</span><span role="columnheader" className="col-span-3 text-right">Principal (KSh)</span><span role="columnheader" className="col-span-3">Interest due</span><span role="columnheader" className="col-span-2 text-right">Interest (KSh)</span></div><div role="rowgroup" className="space-y-1">{schedule.instalments.slice(linePage*20,linePage*20+20).map(r=><div role="row" key={r.number} className="grid grid-cols-12 gap-3 bg-white border rounded-lg px-3 py-2 text-sm text-gray-700 tabular-nums"><span role="cell">{r.number}</span><span role="cell" className="col-span-3">{date(r.dueDate)}</span><span role="cell" className="col-span-3 text-right">{money(r.principal)}</span><span role="cell" className="col-span-3">{date(r.interestDueDate)}</span><span role="cell" className="col-span-2 text-right">{r.interest==null?'Unspecified':money(r.interest)}</span></div>)}</div></div></div>
     {!schedule.instalments.length&&<p className="py-4 text-gray-500">No repayment instalments are available.</p>}
    </>}
   </div>{schedule&&<footer className="shrink-0 border-t p-4">
     {proposal&&<div className="flex flex-wrap items-center justify-end gap-2">
      {!proposal.canConfirm&&<p className="text-sm text-amber-700 mr-auto" role="status">Saving is unavailable until the schedule issues are resolved. {warnings.join(' ')}</p>}
      <BatchFieldHelp label="Save schedule">Saves this calculated schedule and confirms its principal and interest terms for loan ageing. The server checks that the loan terms have not changed since this preview.</BatchFieldHelp>
      <Button className="bg-indigo-600 hover:bg-indigo-700" disabled={saving||!proposal.canConfirm||!proposal.proposalHash||!schedule.instalments.length} onClick={save}>{saving?'Saving…':'Save schedule'}</Button>
     </div>}
     <Pager page={linePage} total={schedule.instalments.length} onChange={setLinePage}/></footer>}
  </section></div>}
 </main>;
}
