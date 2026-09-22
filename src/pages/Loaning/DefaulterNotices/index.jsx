import { useEffect, useRef, useState } from 'react';
import RecoveryDrawer from './RecoveryDrawer';
import { FaEnvelope } from 'react-icons/fa';
import Swal from 'sweetalert2';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { apiFetch, apiJson, readApiResponse } from '@/lib/api';
import FieldLabel from '@/pages/Accounts/BatchProcedures/lib/BatchFieldLabel';

const base = `${import.meta.env.VITE_APP_FIN_URL}/api/backoffice/loan-notices`;
const normalize = v => Array.isArray(v) ? v.map(normalize) : v && typeof v === 'object' ? Object.fromEntries(Object.entries(v).map(([k,x])=>[k[0].toLowerCase()+k.slice(1),normalize(x)])) : v;
async function request(path,options={}) {const r=await apiJson(base+path,{cache:'no-store',...options});return normalize(r.data??r.Data);}
const today=()=>new Date().toISOString().slice(0,10);
const money=n=>Number(n??0).toLocaleString('en-KE',{minimumFractionDigits:2,maximumFractionDigits:2});
const tabs=[['FirstNotice','First notice'],['SecondNotice','Second notice'],['FinalDemand','Third notice'],['Recovery','Recovery']];
const grid='grid grid-cols-[2fr_1fr_1fr_0.7fr_1.4fr_1.5fr_2fr] gap-3';

export default function DefaulterNotices(){
 const [tab,setTab]=useState('FirstNotice'),[asAt,setAsAt]=useState(today),[query,setQuery]=useState(today),[page,setPage]=useState(0),[refresh,setRefresh]=useState(0);
 const [data,setData]=useState(null),[loading,setLoading]=useState(true),[busy,setBusy]=useState(false),[error,setError]=useState('');
 const [recoveryRow,setRecoveryRow]=useState(null);
 const operation=useRef(false);
 useEffect(()=>{
  let active=true;setLoading(true);
  request(`/loans?asAt=${query}&stage=${tab}&pageIndex=${page}&pageSize=20`).then(r=>{if(active)setData(r);}).catch(e=>{if(active){setData(null);setError(e.message);}}).finally(()=>{if(active)setLoading(false);});
  return()=>{active=false;};
 },[tab,query,page,refresh]);
 const queued=data?.items?.some(r=>r.queuedCount>0);
 useEffect(()=>{if(!queued||busy)return;const timer=setInterval(()=>setRefresh(n=>n+1),5000);return()=>clearInterval(timer);},[queued,busy]);
 const stale=asAt!==query;
 const pages=Math.max(1,Math.ceil((data?.total??0)/20));
 async function perform(row,action,extra={}){
  if(operation.current)return;operation.current=true;setBusy(true);setError('');
  try{await request('/loans/action',{method:'POST',body:JSON.stringify({loanCaseId:row.loanCaseId,stage:tab,asAt:query,basisHash:row.basisHash,action,...extra})});}
  catch(e){setError(e.message);}
  finally{operation.current=false;setBusy(false);setRefresh(n=>n+1);}
 }
 async function send(row){
  const count=row.recipientCount-row.sentCount-row.queuedCount;
  const result=await Swal.fire({icon:'question',title:`${row.failedCount?'Retry':'Send'} ${tabs.find(t=>t[0]===tab)[1]}?`,text:`Loan ${row.caseNumber}: ${count} ${row.channel} message(s).`,showCancelButton:true,confirmButtonText:row.failedCount?'Retry':'Send',confirmButtonColor:'#4f46e5'});
  if(result.isConfirmed)perform(row,'send',{retry:row.failedCount>0});
 }
 async function recordSent(row){
  const result=await Swal.fire({icon:'question',title:'Record printed notices as sent?',text:`Loan ${row.caseNumber}: confirm delivery to all ${row.recipientCount-row.sentCount} remaining recipients.`,input:'text',inputLabel:'Dispatch reference',inputAttributes:{maxlength:500},inputValidator:v=>!v?.trim()?'Enter a dispatch reference.':undefined,showCancelButton:true,confirmButtonText:'Record as sent',confirmButtonColor:'#4f46e5'});
  if(result.isConfirmed)perform(row,'record-sent',{dispatchReference:result.value.trim()});
 }
 async function reset(row){
  const result=await Swal.fire({icon:'warning',title:'Reset unsent notices?',text:`Loan ${row.caseNumber}`,showCancelButton:true,confirmButtonText:'Reset',confirmButtonColor:'#dc2626'});
  if(result.isConfirmed)perform(row,'reset');
 }
 async function download(row){
  if(operation.current)return;operation.current=true;setBusy(true);setError('');
  try{await request('/loans/action',{method:'POST',body:JSON.stringify({loanCaseId:row.loanCaseId,stage:tab,asAt:query,basisHash:row.basisHash,action:'prepare'})});const response=await apiFetch(`${base}/loans/${row.loanCaseId}/print?stage=${tab}`,{cache:'no-store'});if(!response.ok){await readApiResponse(response);return;}const url=URL.createObjectURL(await response.blob());const link=document.createElement('a');link.href=url;link.download=`loan-${row.caseNumber}-${tab}.html`;document.body.appendChild(link);link.click();link.remove();setTimeout(()=>URL.revokeObjectURL(url),1000);}
  catch(e){setError(e.message);}finally{operation.current=false;setBusy(false);setRefresh(n=>n+1);}
 }
 return <main className="bg-white m-8 px-8 py-8 shadow-2xl rounded-lg relative">
  <header className="bg-indigo-800 px-6 py-3 rounded-2xl mb-5"><h1 className="text-xl font-bold text-white flex gap-2 items-center"><FaEnvelope/>Defaulter Notices</h1></header>
  <div className="flex flex-wrap gap-2 mb-4" role="group" aria-label="Notice stages">{tabs.map(([value,label])=><Button key={value} disabled={busy} aria-pressed={tab===value} className={tab===value?'bg-indigo-600 hover:bg-indigo-700':''} variant={tab===value?'default':'outline'} onClick={()=>{setTab(value);setPage(0);setData(null);setError('');}}>{label}</Button>)}</div>
  <form className="flex flex-wrap gap-3 items-end mb-4" onSubmit={e=>{e.preventDefault();setQuery(asAt);setPage(0);setError('');setRefresh(n=>n+1);}}>
   <div><FieldLabel label="Arrears as at" htmlFor="notice-as-at" help="Overdue principal and interest at the selected date."/><Input id="notice-as-at" type="date" required min="1753-01-01" max={today()} disabled={busy||loading} value={asAt} onChange={e=>setAsAt(e.target.value)}/></div>
   <Button type="submit" disabled={busy||loading} className="bg-indigo-600 hover:bg-indigo-700">{loading?'Loading…':'Refresh list'}</Button>
  </form>
  {error&&<p role="alert" className="p-3 mb-3 rounded-lg bg-red-50 text-red-700">{error}</p>}
  {data?.issues?.length>0&&<details className="mb-3 rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800"><summary className="cursor-pointer">Loans requiring review</summary><ul className="list-disc pl-5 mt-2 max-h-52 overflow-y-auto">{data.issues.map((issue,i)=><li key={i}>{issue}</li>)}</ul></details>}
  <div className="bg-gray-200 p-4 rounded-sm overflow-x-auto" aria-busy={loading}>
   <div className="min-w-[1150px]">
    <div className={`${grid} bg-gray-700 text-gray-100 font-semibold p-3 rounded-lg mb-4 text-sm`}>{['Loan / borrower','Principal overdue','Interest overdue','Days overdue','Delivery','Status','Actions'].map(label=><span key={label}>{label}</span>)}</div>
    <div className="space-y-2">{loading?[1,2,3].map(n=><div key={n} className={`${grid} bg-gray-50 p-3 rounded-lg animate-pulse`}>{Array.from({length:7},(_,i)=><span key={i} className="bg-gray-200 h-6 rounded"/>)}</div>):!stale&&data?.items.map(row=>{
     const disabled=busy||loading||stale;
     return <div key={row.loanCaseId} className={`${grid} items-center p-3 bg-white rounded-lg shadow-lg hover:shadow-xl transition-all border text-sm text-gray-700`}>
      <span className="font-semibold">Loan {row.caseNumber}<span className="block font-normal text-gray-500">{row.borrowerName}</span></span>
      <span className="tabular-nums">{money(row.principalOverdue)}</span><span className="tabular-nums">{money(row.interestOverdue)}</span><span>{row.daysPastDue}</span>
      <span>{tab==='Recovery'?'—':<>{row.channel}<span className="block text-xs text-gray-500">{row.recipientCount} recipient(s){row.sentCount>0?` · ${row.sentCount} sent`:''}{row.queuedCount>0?` · ${row.queuedCount} queued`:''}</span></>}</span>
      <span><span className={`px-2 py-1 rounded text-xs font-semibold ${row.canGenerate?'bg-green-100 text-green-600':'bg-amber-100 text-amber-700'}`}>{row.status}</span>{row.blockingReason&&<span className="block text-xs text-gray-500 mt-2">{row.blockingReason}</span>}</span>
      <span className="flex flex-wrap gap-2">{tab==='Recovery'?<Button size="sm" className="bg-indigo-600 hover:bg-indigo-700" disabled={disabled||!row.canGenerate} onClick={()=>setRecoveryRow(row)}>Recover</Button>:<>
       {row.needsPreparation&&(row.requireApproval||row.channel==='Print')&&<Button size="sm" disabled={disabled||!row.canGenerate} onClick={()=>perform(row,'prepare')}>Prepare</Button>}
       {row.status==='Awaiting approval'&&!row.needsPreparation&&<Button size="sm" disabled={disabled||!row.canApprove||!row.canGenerate} onClick={()=>perform(row,'approve')}>Approve</Button>}
       {row.channel!=='Print'&&<Button size="sm" className="bg-indigo-600 hover:bg-indigo-700" disabled={disabled||!row.canSend||row.queuedCount===row.recipientCount-row.sentCount} onClick={()=>send(row)}>{row.failedCount?'Retry':'Send'} {row.channel}</Button>}
       {row.channel==='Print'&&row.hasPrepared&&!row.needsPreparation&&<><Button size="sm" variant="outline" disabled={disabled} onClick={()=>download(row)}>Download</Button><Button size="sm" disabled={disabled||!row.canSend} onClick={()=>recordSent(row)}>Record sent</Button></>}
       {row.canReset&&<Button size="sm" variant="outline" disabled={disabled} onClick={()=>reset(row)}>Reset</Button>}
      </>}</span>
     </div>;
    })}</div>
   </div>
   {!loading&&(stale||!data?.items?.length)&&<div className="text-center py-6"><img src="/assets/scopefinding.png" className="w-32 mx-auto" alt=""/><p className="text-gray-400">{stale?'Refresh the list for the selected date.':'No defaulted loans in this stage.'}</p></div>}
  </div>
  {data&&!stale&&<><p className="text-center text-sm text-gray-500 mt-3">{data.total} loan(s)</p><div className="flex justify-center items-center gap-3 mt-3"><Button disabled={busy||loading||page===0} onClick={()=>setPage(p=>p-1)}>Prev</Button><span>Page {page+1} of {pages}</span><Button disabled={busy||loading||page+1>=pages} onClick={()=>setPage(p=>p+1)}>Next</Button></div></>}
  {recoveryRow&&<RecoveryDrawer row={recoveryRow} request={request} onClose={()=>setRecoveryRow(null)} onRecovered={()=>{setRecoveryRow(null);setRefresh(n=>n+1);}}/>}
 </main>;
}
