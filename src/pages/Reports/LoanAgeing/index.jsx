import { useEffect, useState } from 'react';
import { FaCalendarAlt } from 'react-icons/fa';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import FieldLabel, { BatchFieldHelp } from '@/pages/Accounts/BatchProcedures/lib/BatchFieldLabel';
import { apiJson } from '@/lib/api';

const base = `${import.meta.env.VITE_APP_FIN_URL}/api/backoffice/loan-ageing`;
const normalize = v => Array.isArray(v) ? v.map(normalize) : v && typeof v === 'object' ? Object.fromEntries(Object.entries(v).map(([k,x])=>[k[0].toLowerCase()+k.slice(1),normalize(x)])) : v;
const money = x => Number(x ?? 0).toLocaleString('en-KE',{minimumFractionDigits:2,maximumFractionDigits:2});
const today = () => {const d=new Date();return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;};
function ColumnHelp({label,help}) {return <span className="inline-flex items-center gap-1"><span>{label}</span><BatchFieldHelp label={label}>{help}</BatchFieldHelp></span>;}

export default function LoanAgeing() {
 const [asAt,setAsAt]=useState(today),[query,setQuery]=useState(()=>({asAt:today(),pageIndex:0}));
 const [report,setReport]=useState(null),[loading,setLoading]=useState(true),[error,setError]=useState('');
 useEffect(()=>{
  let active=true;setLoading(true);setReport(null);setError('');
  apiJson(`${base}/loans?asAt=${encodeURIComponent(query.asAt)}&pageIndex=${query.pageIndex}&pageSize=20`,{cache:'no-store'})
   .then(r=>{if(active)setReport(normalize(r.data??r.Data));})
   .catch(e=>{if(active)setError(e.message);})
   .finally(()=>{if(active)setLoading(false);});
  return()=>{active=false;};
 },[query]);
 const current=asAt===query.asAt?report:null;
 const pages=Math.max(1,Math.ceil((current?.totalLoans??0)/20));
 return <main className="bg-white m-8 px-8 py-8 shadow-2xl rounded-lg relative">
  <header className="bg-indigo-800 px-6 py-3 rounded-2xl mb-5"><h1 className="text-xl font-bold text-white flex gap-2 items-center"><FaCalendarAlt/>Loan Ageing</h1></header>
  <form className="flex flex-wrap gap-3 items-end mb-4" onSubmit={e=>{e.preventDefault();setQuery({asAt,pageIndex:0});}}>
   <div><FieldLabel label="As at" htmlFor="loan-ageing-date" help="Includes postings for the entire selected day. An instalment becomes overdue the day after its due date."/><Input id="loan-ageing-date" type="date" required min="1753-01-01" max="9998-12-31" disabled={loading} value={asAt} onChange={e=>{setAsAt(e.target.value);setError('');}}/></div>
   <Button className="bg-indigo-600 hover:bg-indigo-700" disabled={loading} type="submit">{loading?'Calculating…':'Calculate ageing'}</Button>
  </form>
  {error&&<p role="alert" className="p-3 mb-3 rounded-lg bg-red-50 text-red-700">{error}</p>}
  {current?.issues?.length>0&&<p role="alert" className="p-3 mb-3 rounded-lg bg-amber-50 text-amber-800">{current.issues.join(' ')}</p>}
  <div className="bg-gray-200 p-4 rounded-sm overflow-x-auto" aria-busy={loading}>
   <div className="min-w-[1000px]">
    <div className="grid grid-cols-[repeat(14,minmax(0,1fr))] gap-3 bg-gray-700 text-gray-100 font-semibold p-3 rounded-lg mb-4"><span className="col-span-2"><ColumnHelp label="Loan" help="One row per loan case. For loans sharing an account, repayments settle the oldest due instalments first across those loans."/></span><span className="col-span-2"><ColumnHelp label="Loanee" help="The individual or organisation that borrowed this loan."/></span><span className="col-span-2 text-right"><ColumnHelp label="Principal" help="Outstanding loan principal at the selected reporting date, including both overdue and future instalments. Interest is shown separately."/></span><span className="col-span-2 text-right"><ColumnHelp label="Principal overdue" help="Unpaid principal from instalments due before the reporting date. An instalment becomes overdue the day after its due date. Unknown means the schedule or transaction history needs review."/></span><span className="col-span-2 text-right"><ColumnHelp label="Interest overdue" help="Unpaid contractual interest due before the reporting date, after allocating interest settlements. This can differ from the interest-receivable G/L balance. Unknown means interest terms or postings need review."/></span><span className="col-span-2 text-right"><ColumnHelp label="Days Overdue" help="The greater of principal days overdue and interest days overdue, not their sum. For example, principal 10 days overdue and interest 25 days overdue gives 25 days overdue. Unknown means either component cannot be established reliably."/></span><span className="col-span-2"><ColumnHelp label="Status" help="The ageing band for Days Overdue: Current (0), 1–30, 31–90, 91–180, 181–360, or Over 360 days. Needs review means principal or interest ageing is unresolved. SASRA risk classification is calculated separately in Form 4."/></span></div>
    <div className="space-y-2">
     {loading?[1,2,3].map(n=><div key={n} className="grid grid-cols-[repeat(14,minmax(0,1fr))] gap-3 animate-pulse bg-gray-50 p-4 rounded-lg">{[0,1,2,3,4,5,6].map(c=><span key={c} className="col-span-2 h-5 bg-gray-200 rounded"/>)}</div>):current?.loans.map(a=>{
      const issues=a.issues??[];
      return <div key={a.loanCaseId} className="grid grid-cols-[repeat(14,minmax(0,1fr))] gap-3 items-center p-3 bg-white rounded-lg shadow-lg border text-sm text-gray-700">
       <span className="col-span-2">{a.caseNumber}<span className="block text-xs text-gray-500">{a.product}</span></span>
       <span className="col-span-2">{a.loaneeName||'Name unavailable'}</span>
       <span className="col-span-2 text-right tabular-nums">{a.outstandingPrincipal==null?'Unknown':money(a.outstandingPrincipal)}</span>
       <span className="col-span-2 text-right tabular-nums">{a.overduePrincipal==null?'Unknown':money(a.overduePrincipal)}</span>
       <span className="col-span-2 text-right tabular-nums">{a.overdueInterest==null?'Unknown':money(a.overdueInterest)}</span>
       <span className="col-span-2 text-right">{a.daysPastDue??'Unknown'}</span>
       <span className={`col-span-2 flex items-center gap-1 ${a.daysPastDue==null?'text-amber-700':'text-gray-700'}`}>{a.status}{issues.length>0&&<BatchFieldHelp label={`Loan ${a.caseNumber} status`}>{issues.join(' ')}</BatchFieldHelp>}</span>
      </div>;
     })}
    </div>
   </div>
   {!loading&&!error&&(!current||!current.loans.length)&&<div className="text-center py-6">{current&&<img src="/assets/scopefinding.png" className="w-32 mx-auto" alt=""/>}<p className="text-gray-400">{current?'No loans in this reporting scope.':'Calculate ageing to view the selected date.'}</p></div>}
  </div>
  {current&&<div className="flex justify-center gap-3 items-center mt-4"><Button disabled={loading||query.pageIndex===0} onClick={()=>setQuery(q=>({...q,pageIndex:q.pageIndex-1}))}>Prev</Button><span>Page {query.pageIndex+1} of {pages}</span><Button disabled={loading||query.pageIndex+1>=pages} onClick={()=>setQuery(q=>({...q,pageIndex:q.pageIndex+1}))}>Next</Button></div>}
 </main>;
}
