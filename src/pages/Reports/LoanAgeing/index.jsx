import { useEffect, useState } from 'react';
import { FaCalendarAlt } from 'react-icons/fa';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import FieldLabel, { BatchFieldHelp } from '@/pages/Accounts/BatchProcedures/lib/BatchFieldLabel';
import { apiJson } from '@/lib/api';

const base = `${import.meta.env.VITE_APP_FIN_URL}/api/backoffice/loan-ageing`;
const normalize = v => Array.isArray(v) ? v.map(normalize) : v && typeof v === 'object' ? Object.fromEntries(Object.entries(v).map(([k,x])=>[k[0].toLowerCase()+k.slice(1),normalize(x)])) : v;
const money = x => Number(x).toLocaleString('en-KE',{minimumFractionDigits:2,maximumFractionDigits:2});
const date = x => x && Number(x.slice(0,4))>1753 ? x.slice(0,10) : '—';
const today = () => {const d=new Date();return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;};
const columns = [
 ['Loan / product','One row per loan case, including applications and posted loans.'],
 ['Loanee','The individual or organisation borrowing the loan.'],
 ['Loan stage','Current processing status. This is not a historical status audit.'],
 ['Applied / disbursed','Application received date and recorded disbursement date.'],
 ['Applied / approved','Amounts requested and approved in the loan case.'],
 ['Disbursed / term','Recorded disbursed amount and contractual term in months.'],
 ['Principal remaining','Outstanding principal, including overdue and future instalments. Shared-account repayments are allocated oldest due first.'],
 ['Interest remaining','Unpaid confirmed contractual interest, including future interest not yet charged. This can differ from accrued interest in the ledger.'],
 ['Total remaining','Remaining principal plus remaining contractual interest; excludes fees and penalties. Unknown if either component is unresolved.'],
 ['Principal overdue','Unpaid principal due before the selected date.'],
 ['Interest overdue','Unpaid contractual interest due before the selected date.'],
 ['Days overdue','The greater of principal and interest days overdue.'],
 ['Risk status','Existing classification rules: Performing (0 days), Watch (1–30), Substandard (31–180), Doubtful (181–360), Loss (over 360). Missed instalments can increase the category; restructuring retains its prior risk floor. Unresolved records need review.'],
];
const grid='grid grid-cols-[170px_190px_115px_130px_140px_140px_140px_140px_145px_140px_140px_100px_145px] gap-3';
const colors={Performing:'bg-green-100 text-green-600',Watch:'bg-amber-100 text-amber-600',Substandard:'bg-orange-100 text-orange-600',Doubtful:'bg-red-100 text-red-600',Loss:'bg-red-100 text-red-600'};
export default function LoanAgeing() {
 const [asAt,setAsAt]=useState(today),[query,setQuery]=useState(()=>({asAt:today(),pageIndex:0}));
 const [report,setReport]=useState(null),[loading,setLoading]=useState(true),[error,setError]=useState('');
 useEffect(()=>{
  let active=true;setLoading(true);setReport(null);setError('');
  apiJson(`${base}/loans?asAt=${encodeURIComponent(query.asAt)}&pageIndex=${query.pageIndex}&pageSize=20`,{cache:'no-store'})
   .then(r=>{if(active)setReport(normalize(r.data??r.Data));})
   .catch(e=>{if(active)setError(e.message);}).finally(()=>{if(active)setLoading(false);});
  return()=>{active=false;};
 },[query]);
 const current=asAt===query.asAt?report:null;
 const pages=Math.max(1,Math.ceil((current?.totalLoans??0)/20));
 const balance=(a,key)=>!a.isDisbursed?'—':a[key]==null?'Unknown':money(a[key]);
 return <main className="bg-white m-8 px-8 py-8 shadow-2xl rounded-lg relative">
  <header className="bg-indigo-800 px-6 py-3 rounded-2xl mb-5"><h1 className="text-xl font-bold text-white flex gap-2 items-center"><FaCalendarAlt/>Loan Register &amp; Ageing</h1></header>
  <form className="flex flex-wrap gap-3 items-end mb-4" onSubmit={e=>{e.preventDefault();setQuery({asAt,pageIndex:0});}}>
   <div><FieldLabel label="As at" htmlFor="loan-ageing-date" help="Cases created and postings made through this date. An instalment becomes overdue the day after its due date. Processing stages reflect current records; confirmed schedule corrections also apply to historical calculations."/><Input id="loan-ageing-date" type="date" required min="1753-01-01" max="9998-12-31" disabled={loading} value={asAt} onChange={e=>{setAsAt(e.target.value);setError('');}}/></div>
   <Button className="bg-indigo-600 hover:bg-indigo-700" disabled={loading} type="submit">{loading?'Calculating…':'Refresh register'}</Button>
  </form>
  {error&&<p role="alert" className="p-3 mb-3 rounded-lg bg-red-50 text-red-700">{error}</p>}
  {current?.issues?.length>0&&<p role="alert" className="p-3 mb-3 rounded-lg bg-amber-50 text-amber-800">{current.issues.join(' ')}</p>}
  <div className="bg-gray-200 p-4 rounded-sm overflow-x-auto" aria-label="Loan register" tabIndex={0} aria-busy={loading}>
   <div className="min-w-[2010px]">
    <div className={`${grid} bg-gray-700 text-gray-100 font-semibold p-3 rounded-lg mb-4`}>{columns.map(([label,help])=><span key={label} className="inline-flex items-center gap-1"><span>{label}</span><BatchFieldHelp label={label}>{help}</BatchFieldHelp></span>)}</div>
    <div className="space-y-2">
     {loading?[1,2,3].map(n=><div key={n} className={`${grid} animate-pulse bg-gray-50 p-3 rounded-lg`}>{columns.map(([label])=><span key={label} className="h-5 bg-gray-200 rounded"/>)}</div>):current?.loans.map(a=><div key={a.loanCaseId} className={`${grid} items-center p-3 bg-white rounded-lg shadow-lg hover:shadow-xl transition-all border text-sm text-gray-700`}>
      <span className="font-semibold">{a.caseNumber}<span className="block text-xs font-normal text-gray-500">{a.product}</span></span>
      <span>{a.loaneeName||'Name unavailable'}</span>
      <span>{a.loanStatus}</span>
      <span>{date(a.appliedDate)}<span className="block text-xs text-gray-500">{date(a.disbursedDate)}</span></span>
      <span className="tabular-nums">{money(a.amountApplied)}<span className="block text-xs text-gray-500">{money(a.approvedAmount)}</span></span>
      <span className="tabular-nums">{a.isDisbursed?money(a.disbursedAmount):'—'}<span className="block text-xs text-gray-500">{a.termMonths} months</span></span>
      {['outstandingPrincipal','outstandingInterest','totalOutstanding','overduePrincipal','overdueInterest'].map(key=><span key={key} className="tabular-nums text-right">{balance(a,key)}</span>)}
      <span className="text-right">{a.isDisbursed?(a.daysPastDue??'Unknown'):'—'}</span>
      <span className="flex items-center gap-1"><span className={`px-2 py-1 rounded text-xs font-semibold ${colors[a.riskClassification]??'bg-gray-100 text-gray-600'}`}>{a.riskClassification}</span>{a.issues?.length>0&&<BatchFieldHelp label={`Loan ${a.caseNumber} status`}>{a.issues.join(' ')}</BatchFieldHelp>}</span>
     </div>)}
    </div>
   </div>
   {!loading&&!error&&(!current||!current.loans.length)&&<div className="text-center py-6">{current&&<img src="/assets/scopefinding.png" className="w-32 mx-auto" alt=""/>}<p className="text-gray-400">{current?'No loans in this reporting scope.':'Refresh the register to view the selected date.'}</p></div>}
  </div>
  {current&&<><p className="text-center text-sm text-gray-500 mt-3">{current.totalLoans} loan cases · Balances as at {query.asAt} · Scroll horizontally for all fields</p><div className="flex justify-center gap-3 items-center mt-3"><Button disabled={loading||query.pageIndex===0} onClick={()=>setQuery(q=>({...q,pageIndex:q.pageIndex-1}))}>Prev</Button><span>Page {query.pageIndex+1} of {pages}</span><Button disabled={loading||query.pageIndex+1>=pages} onClick={()=>setQuery(q=>({...q,pageIndex:q.pageIndex+1}))}>Next</Button></div></>}
 </main>;
}
