import { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FaEnvelope } from 'react-icons/fa';
import Swal from 'sweetalert2';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { apiFetch, apiJson, readApiResponse } from '@/lib/api';
import { getUserName } from '@/lib/auth';
import FieldLabel, { BatchFieldHelp } from '@/pages/Accounts/BatchProcedures/lib/BatchFieldLabel';
import { noticeTypes } from '@/pages/Administration/Company/noticePolicy';

const base = `${import.meta.env.VITE_APP_FIN_URL}/api/backoffice/loan-notices`;
const normalize = v => Array.isArray(v) ? v.map(normalize) : v && typeof v === 'object' ? Object.fromEntries(Object.entries(v).map(([k,x]) => [k[0].toLowerCase()+k.slice(1),normalize(x)])) : v;
const date = v => v?.slice(0,10) || '—';
const money = n => Number(n ?? 0).toLocaleString('en-KE',{minimumFractionDigits:2,maximumFractionDigits:2});
const typeLabel = type => noticeTypes.find(([key]) => key===type)?.[1] || type;
async function request(path, options={}) { const r=await apiJson(base+path,{cache:'no-store',...options});return normalize(r.data??r.Data); }
const initialDate = () => new Date().toISOString().slice(0,10);
function HeaderHelp({label,children}) {return <span className="inline-flex items-center gap-1">{label}<BatchFieldHelp label={label}>{children}</BatchFieldHelp></span>;}

export default function DefaulterNotices() {
 const [tab,setTab]=useState('eligible'),[asAt,setAsAt]=useState(initialDate),[query,setQuery]=useState(null),[page,setPage]=useState(0),[refresh,setRefresh]=useState(0);
 const [data,setData]=useState(null),[loading,setLoading]=useState(false),[error,setError]=useState('');
 const [selected,setSelected]=useState(null),[busy,setBusy]=useState(false),[detailError,setDetailError]=useState('');
 const operation=useRef(false);
 useEffect(()=>{
  let active=true;setData(null);setError('');
  if(tab==='eligible'&&!query){setLoading(false);return;}
  setLoading(true);
  request(tab==='eligible'?`/eligible?asAt=${query}&pageIndex=${page}&pageSize=20`:`?pageIndex=${page}&pageSize=20`)
   .then(r=>{if(active)setData(r);}).catch(e=>{if(active)setError(e.message);}).finally(()=>{if(active)setLoading(false);});
  return()=>{active=false;};
 },[tab,query,page,refresh]);
 async function act(action) {
  if(operation.current)return;operation.current=true;setBusy(true);setDetailError('');setError('');
  try{await action();}catch(e){if(selected)setDetailError(e.message);else setError(e.message);}finally{operation.current=false;setBusy(false);}
 }
 function show(row){act(async()=>{setSelected(await request(`/${row.id||row.existingNoticeId}`));});}
 function generate(row){act(async()=>{
  const saved=await request('/generate',{method:'POST',body:JSON.stringify({loanCaseId:row.loanCaseId,recipientCustomerId:row.recipientCustomerId,asAt:row.asAt,noticeType:row.noticeType,basisHash:row.basisHash})});
  setSelected(saved);setRefresh(n=>n+1);
 });}
 function approve(){act(async()=>{setSelected(await request(`/${selected.id}/approve`,{method:'POST'}));setRefresh(n=>n+1);});}
 async function cancel(){
  const response=await Swal.fire({icon:'warning',title:'Cancel this notice?',text:'The notice will remain in history as cancelled.',showCancelButton:true,confirmButtonText:'Cancel notice',cancelButtonText:'Keep notice',confirmButtonColor:'#dc2626'});
  if(response.isConfirmed)act(async()=>{setSelected(await request(`/${selected.id}/cancel`,{method:'POST'}));setRefresh(n=>n+1);});
 }
 function download(){act(async()=>{
  const r=await apiFetch(`${base}/${selected.id}/print`,{cache:'no-store'});
  if(!r.ok){await readApiResponse(r);return;}
  const url=URL.createObjectURL(await r.blob());const link=document.createElement('a');link.href=url;link.download=`loan-notice-${selected.caseNumber}-${selected.id}.html`;document.body.appendChild(link);link.click();link.remove();setTimeout(()=>URL.revokeObjectURL(url),1000);
 });}
 const stale=tab==='eligible'&&asAt!==query;
 const current=stale?null:data;
 const pages=Math.max(1,Math.ceil((current?.total??0)/20));
 const ownNotice=selected?.createdBy?.toLowerCase()===getUserName()?.toLowerCase();
 return <main className="bg-white m-8 px-8 py-8 shadow-2xl rounded-lg relative">
  <header className="bg-indigo-800 px-6 py-3 rounded-2xl mb-5"><h1 className="text-xl font-bold text-white flex gap-2 items-center"><FaEnvelope/>Defaulter Notices</h1></header>
  <div className="flex gap-2 mb-4" role="group" aria-label="Notice lists">
   {['eligible','history'].map(value=><Button key={value} disabled={busy} aria-pressed={tab===value} className={tab===value?'bg-indigo-600 hover:bg-indigo-700':''} variant={tab===value?'default':'outline'} onClick={()=>{setTab(value);setPage(0);}}>{value==='eligible'?'Eligible notices':'Saved notices'}</Button>)}
  </div>
  {tab==='eligible'?<form className="flex flex-wrap gap-3 items-end mb-4" onSubmit={e=>{e.preventDefault();setQuery(asAt);setPage(0);setRefresh(n=>n+1);}}>
   <div><FieldLabel label="Arrears as at" htmlFor="notice-as-at" help="Uses the saved repayment schedules and allocated repayments to calculate overdue principal and interest. Only loans with resolved ageing qualify. Current company settings and currently attached guarantors are used."/><Input id="notice-as-at" type="date" required min="1753-01-01" max={initialDate()} value={asAt} disabled={busy||loading} onChange={e=>setAsAt(e.target.value)}/></div>
   <Button type="submit" disabled={busy||loading} className="bg-indigo-600 hover:bg-indigo-700">{loading?'Finding notices…':'Find eligible notices'}</Button>
   <BatchFieldHelp label="Eligible notices">Each configured stage that meets its days-overdue and minimum-arrears thresholds appears here. Review the stage before generating. An existing active notice for the same loan, stage and recipient is reused. Generating a draft does not send it.</BatchFieldHelp>
  </form>:<Button variant="outline" disabled={busy||loading} className="mb-4" onClick={()=>setRefresh(n=>n+1)}>Refresh saved notices</Button>}
  {error&&<p role="alert" className="p-3 mb-3 rounded-lg bg-red-50 text-red-700">{error}</p>}
  {current?.issues?.length>0&&<details className="mb-3 rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800"><summary className="cursor-pointer">{current.issues.length} review message(s)</summary><ul className="list-disc pl-5 mt-2 max-h-52 overflow-y-auto">{current.issues.map((issue,i)=><li key={i}>{issue}</li>)}</ul></details>}
  {tab==='eligible'&&current&&<p className="text-sm text-gray-500 mb-3">{current.total} matching notice(s) · {current.reviewCount} loan(s) need review · {current.disabledCount} overdue loan(s) have no enabled company policy</p>}
  <div className="bg-gray-200 p-4 rounded-sm overflow-x-auto" aria-busy={loading}>
   <div className="min-w-[1100px]">
    <div className="grid grid-cols-12 gap-3 bg-gray-700 text-gray-100 font-semibold p-3 rounded-lg mb-4 text-sm">
     <span className="col-span-2">Loan / borrower</span><span className="col-span-2">Notice / recipient</span><span className="col-span-2"><HeaderHelp label="Arrears (KSh)">Overdue principal plus overdue contractual interest at the selected date.</HeaderHelp></span><span>Days overdue</span><span>Channel</span><span className="col-span-2">{tab==='eligible'?'Company':'Status / as at'}</span><span className="col-span-2 text-right">Action</span>
    </div>
    <div className="space-y-2">
     {loading?[1,2,3].map(n=><div key={n} className="grid grid-cols-12 gap-3 bg-gray-50 p-4 rounded-lg animate-pulse">{[1,2,3,4,5,6].map(c=><span key={c} className="col-span-2 bg-gray-200 h-6 rounded"/>)}</div>):current?.items.map(row=><div key={row.id||`${row.loanCaseId}-${row.noticeType}-${row.recipientCustomerId}`} className="grid grid-cols-12 gap-3 items-center p-3 bg-white rounded-lg shadow-lg hover:shadow-xl transition-all border text-sm text-gray-700">
      <span className="col-span-2">Loan {row.caseNumber}<span className="block text-xs text-gray-500">{row.borrowerName}</span></span>
      <span className="col-span-2">{typeLabel(row.noticeType)}<span className="block text-xs text-gray-500">{row.recipientName}</span></span>
      <span className="col-span-2 tabular-nums">{money(row.principalOverdue+row.interestOverdue)}</span><span>{row.daysOverdue}</span><span>{row.channel}</span>
      <span className="col-span-2">{tab==='eligible'?row.companyName:<><span className={`px-2 py-1 rounded text-xs font-semibold ${row.status==='Draft'?'bg-amber-100 text-amber-700':row.status==='Cancelled'?'bg-gray-100 text-gray-600':'bg-green-100 text-green-700'}`}>{row.status}</span><span className="block text-xs text-gray-500 mt-1">{date(row.asAt)}</span></>}</span>
      <span className="col-span-2 text-right"><Button variant="outline" disabled={busy} onClick={()=>tab==='history'||row.existingNoticeId?show(row):generate(row)}>{tab==='history'?'View notice':row.existingNoticeId?'View existing':'Generate draft'}</Button></span>
     </div>)}
    </div>
   </div>
   {!loading&&!current?.items?.length&&<div className="text-center py-6"><img src="/assets/scopefinding.png" className="w-32 mx-auto" alt=""/><p className="text-gray-400">{tab==='eligible'&&(!query||stale)?'Choose a date and find eligible notices.':'No notices found.'}</p></div>}
  </div>
  {current&&<div className="flex justify-center items-center gap-3 mt-4"><Button disabled={busy||loading||page===0} onClick={()=>setPage(p=>p-1)}>Prev</Button><span>Page {page+1} of {pages}</span><Button disabled={busy||loading||page+1>=pages} onClick={()=>setPage(p=>p+1)}>Next</Button></div>}
  <AnimatePresence>{selected&&<>
   <motion.div initial={{opacity:0}} animate={{opacity:0.4}} exit={{opacity:0}} className="fixed inset-0 bg-black z-40" onClick={()=>{if(!busy)setSelected(null);}}/>
   <motion.section role="dialog" aria-modal="true" aria-label="Saved loan notice" initial={{x:'100%'}} animate={{x:0}} exit={{x:'100%'}} transition={{type:'spring',stiffness:300,damping:30}} className="fixed inset-y-0 right-0 z-50 w-full max-w-2xl bg-white shadow-2xl rounded-2xl flex flex-col">
    <header className="bg-indigo-600 text-white m-2 p-4 rounded-2xl flex justify-between items-center shrink-0"><h2 className="font-semibold text-lg">Loan {selected.caseNumber} · {typeLabel(selected.noticeType)}</h2><Button variant="outline" disabled={busy} onClick={()=>setSelected(null)}>Close</Button></header>
    <div className="flex-1 overflow-y-auto p-5 space-y-4">
     {detailError&&<p role="alert" className="text-sm text-red-700 bg-red-50 p-3 rounded-lg">{detailError}</p>}
     <div className="grid grid-cols-2 gap-3 text-sm text-gray-700"><span>To: <strong>{selected.recipientName}</strong></span><span>Status: <strong>{selected.status}</strong></span><span>Company: {selected.companyName}</span><span>Policy revision: {selected.policyRevision}</span><span>Arrears as at: {date(selected.asAt)}</span><span>Arrears: KSh {money(selected.principalOverdue+selected.interestOverdue)}</span><span>Channel: {selected.channel}</span><span>Response deadline: {date(selected.responseDeadline)}</span></div>
     <FieldLabel label="Saved message" help="This message and its arrears snapshot are saved unchanged. The response deadline is calculated from the draft preparation date, not the historical arrears date. Downloads do not record delivery. Cancel an outdated notice before preparing a new one for a later as-at date."/>
     <div className="border rounded-lg bg-gray-50 p-4 whitespace-pre-wrap break-words text-sm text-gray-700">{selected.body}</div>
     <div className="text-xs text-gray-500 space-y-1"><p>Prepared by {selected.createdBy} on {date(selected.createdDate)}.</p>{selected.approvedBy&&<p>Approved by {selected.approvedBy} on {date(selected.approvedAtUtc)}.</p>}{selected.cancelledBy&&<p>Cancelled by {selected.cancelledBy} on {date(selected.cancelledAtUtc)}.</p>}<p>Reference: {selected.id}</p></div>
     {selected.status==='Draft'&&<p className="text-sm text-amber-700">Approval by another user is required. Downloaded drafts are marked “Not approved”.</p>}
     <p className="text-sm text-gray-500">The download is a printable HTML file. Open it in your browser and use Print or Save as PDF. Email and SMS delivery are not connected yet.</p>
    </div>
    <footer className="shrink-0 border-t p-4 flex flex-wrap justify-end gap-2">
     {selected.status!=='Cancelled'&&<Button variant="outline" disabled={busy} onClick={cancel}>Cancel notice</Button>}
     {selected.status==='Draft'&&<Button className="bg-indigo-600 hover:bg-indigo-700" disabled={busy||ownNotice} onClick={approve}>Approve notice</Button>}
     <Button className="bg-indigo-600 hover:bg-indigo-700" disabled={busy} onClick={download}>{busy?'Working…':selected.status==='Draft'?'Download draft':'Download printable copy'}</Button>
    </footer>
   </motion.section>
  </>}</AnimatePresence>
 </main>;
}
