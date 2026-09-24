import { useEffect, useState } from "react";
import { FaFileExcel, FaUsers, FaPlus } from "react-icons/fa";
import Swal from "sweetalert2";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import FieldHelp from "@/pages/Accounts/SavingsProducts/FieldHelp";
import CustomerLookupModal from "@/pages/Registry/Customers/Documents/CustomerLookupModal";
import BoardDecision from "./BoardDecision";
import { request, downloadRun, day, money } from "./form9Api";
const primary="bg-indigo-600 hover:bg-indigo-700";
function Field({label,help,children}){return <div><div className="flex items-center gap-1"><Label className="text-sm font-semibold text-gray-700">{label}</Label><FieldHelp label={label}>{help}</FieldHelp></div>{children}</div>;}
function Pager({page,setPage,total}){const pages=Math.max(1,Math.ceil(total/20));return <div className="flex justify-center gap-3 items-center mt-4"><Button type="button" disabled={page===0} onClick={()=>setPage(page-1)}>Prev</Button><span>Page {page+1} of {pages}</span><Button type="button" disabled={page+1>=pages} onClick={()=>setPage(page+1)}>Next</Button></div>;}
function Empty(){return <div className="text-center p-6"><img src="/assets/scopefinding.png" alt="" className="mx-auto w-32"/><p className="text-gray-400">No matching records.</p></div>;}
function Rows({headers,loading,empty,children}){return <div className="bg-gray-200 p-4 rounded-sm"><div className="grid grid-cols-12 gap-3 bg-gray-700 text-gray-100 font-semibold p-3 rounded-lg mb-4">{headers.map(([label,span])=><span key={label} style={{gridColumn:`span ${span}`}}>{label}</span>)}</div>{loading?<div className="space-y-2">{[1,2,3].map(n=><div key={n} className="grid grid-cols-12 gap-3 animate-pulse bg-gray-50 p-4 rounded-lg">{headers.map(([label,span])=><div key={label} style={{gridColumn:`span ${span}`}} className="h-5 bg-gray-200 rounded"/>)}</div>)}</div>:empty?<Empty/>:<div className="space-y-2">{children}</div>}</div>;}
const card="grid grid-cols-12 gap-3 items-center bg-white rounded-lg shadow-lg border hover:shadow-xl transition-all p-3 text-left w-full text-sm";
function usePage(endpoint,reload=0){
  const [text,setText]=useState(""),[query,setQuery]=useState(""),[page,setPage]=useState(0),[data,setData]=useState({items:[],total:0}),[loading,setLoading]=useState(true),[error,setError]=useState("");
  useEffect(()=>{const t=setTimeout(()=>{setQuery(text);setPage(0);},300);return()=>clearTimeout(t);},[text]);
  useEffect(()=>{let active=true;setLoading(true);setError("");request(`${endpoint}?text=${encodeURIComponent(query)}&page=${page}&size=20`).then(x=>{if(active)setData(x);}).catch(e=>{if(active)setError(e.message);}).finally(()=>{if(active)setLoading(false);});return()=>{active=false;};},[endpoint,query,page,reload]);
  return {text,setText,page,setPage,data,loading,error};
}
const emptyAppointment={revision:0,customerId:"",customerName:"",kind:"",position:"",startsAt:"",endsAt:"",evidence:"",isVoided:false};
function Register(){
  const [mode,setMode]=useState("appointments"),[reload,setReload]=useState(0),[draft,setDraft]=useState(null),[picker,setPicker]=useState(false),[busy,setBusy]=useState(false),[error,setError]=useState(""),[history,setHistory]=useState(null);
  const p=usePage("/"+mode,reload);
  const edit=x=>{setDraft({...emptyAppointment,...x,customerName:x.customerName||x.name,startsAt:day(x.startsAt||x.suggestedStart),endsAt:day(x.endsAt)});setError("");setHistory(null);};
  async function save(e){e.preventDefault();setBusy(true);setError("");try{await request("/appointments","POST",{...draft,startsAt:day(draft.startsAt),endsAt:day(draft.endsAt)||null});setDraft(null);setReload(x=>x+1);await Swal.fire("Saved","Appointment history saved.","success");}catch(e){setError(e.message);}finally{setBusy(false);}}
  return <div className="space-y-4">
    <div className="flex flex-wrap gap-3"><Button onClick={()=>{setMode("appointments");p.setPage(0);}}>Insider register</Button><Button onClick={()=>{setMode("candidates");p.setPage(0);}}>Staff / director candidates</Button><Button className={primary} onClick={()=>edit(emptyAppointment)}><FaPlus/>Add appointment</Button></div>
    <Input aria-label="Search insiders" placeholder="Search name or membership number" value={p.text} onChange={e=>p.setText(e.target.value)}/>
    {(p.error||error)&&<p role="alert" className="text-red-700">{p.error||error} <Button onClick={()=>setReload(x=>x+1)}>Retry</Button></p>}
    {draft&&<form onSubmit={save} className="rounded-lg border bg-white p-4 space-y-4">
      <h3 className="font-semibold">Appointment details</h3>
      <fieldset disabled={busy} className="grid md:grid-cols-2 gap-4">
        <Field label="Customer"><Button type="button" disabled={Boolean(draft.id)} onClick={()=>setPicker(true)}>{draft.customerName||"Select existing individual customer"}</Button></Field>
        <Field label="Role"><select required aria-label="Insider role" className="w-full border rounded-md p-2" value={draft.kind} onChange={e=>setDraft({...draft,kind:e.target.value})}><option value="">Select role</option><option>Director</option><option>Employee</option></select></Field>
        <Field label="Position held"><Input required maxLength={150} value={draft.position} onChange={e=>setDraft({...draft,position:e.target.value})}/></Field>
        <Field label="Appointment start" help="Use the actual effective date supported by appointment or employment records."><Input required type="date" value={day(draft.startsAt)} onChange={e=>setDraft({...draft,startsAt:e.target.value})}/></Field>
        <Field label="Appointment end" help="Leave blank for a continuing appointment. Both start and end dates are included."><Input type="date" value={day(draft.endsAt)} onChange={e=>setDraft({...draft,endsAt:e.target.value})}/></Field>
        <Field label="Supporting evidence"><Input required maxLength={2000} value={draft.evidence} onChange={e=>setDraft({...draft,evidence:e.target.value})}/></Field>
        {draft.id&&<label className="flex gap-2"><input type="checkbox" className="accent-indigo-600 w-4 h-4" checked={draft.isVoided} onChange={e=>setDraft({...draft,isVoided:e.target.checked})}/>Void an incorrect appointment (history retained)</label>}
      </fieldset>
      <div className="flex gap-3"><Button disabled={busy||!draft.customerId} className={primary}>Save appointment</Button><Button type="button" disabled={busy} onClick={()=>setDraft(null)}>Cancel</Button>{draft.id&&<Button type="button" onClick={async()=>{try{setHistory(await request(`/history/appointment/${draft.id}`));}catch(e){setError(e.message);}}}>History</Button>}</div>
      {history?.map(x=><details key={x.revision}><summary>Revision {x.revision} · {x.createdBy} · {day(x.createdDate)}</summary><pre className="text-xs whitespace-pre-wrap">{JSON.stringify(JSON.parse(x.payload),null,2)}</pre></details>)}
    </form>}
    <Rows loading={p.loading} empty={!p.data.items.length} headers={[["Customer",4],["Role / position",4],["History",4]]}>{p.data.items.map((x,i)=><button key={x.id||x.customerId+x.kind+i} className={card} onClick={()=>edit(x)}><span className="col-span-4">{x.customerName||x.name}<small className="block text-gray-500">{x.memberNumber||"Membership number missing"}</small></span><span className="col-span-4">{x.kind} · {x.position}</span><span className="col-span-4">{mode==="candidates"?(x.hasHistory?"History captured":"Needs appointment history"):(x.isVoided?"Voided":day(x.startsAt)+" – "+(day(x.endsAt)||"Continuing"))}</span></button>)}</Rows>
    <Pager {...p} total={p.data.total}/>
    {picker&&<CustomerLookupModal onClose={()=>setPicker(false)} onSelect={c=>{if(Number(c.Type??c.type)!==0){Swal.fire("Individual customer required","Select the director or employee's individual customer record.","warning");return;}setDraft(d=>({...d,customerId:c.Id??c.id,customerName:c.FullName||[c.IndividualFirstName,c.IndividualLastName].filter(Boolean).join(" ")}));setPicker(false);}}/>}
  </div>;
}
function Board(){
  const [selected,setSelected]=useState(null),[reload,setReload]=useState(0);const p=usePage("/loans",reload);
  return <div className="space-y-4"><Input aria-label="Search loan cases" value={p.text} onChange={e=>p.setText(e.target.value)} placeholder="Search borrower, member number or case number"/>
    {p.error&&<p role="alert" className="text-red-700">{p.error}<Button onClick={()=>setReload(x=>x+1)}>Retry</Button></p>}
    {selected&&<div className="space-y-2"><div className="flex justify-between"><h3 className="font-semibold">Case {selected.caseNumber} · {selected.borrower} · {selected.product}</h3><Button onClick={()=>setSelected(null)}>Close</Button></div><BoardDecision key={selected.loanCaseId} loanCaseId={selected.loanCaseId}/></div>}
    <Rows loading={p.loading} empty={!p.data.items.length} headers={[["Case",2],["Borrower",4],["Product",4],["Approved",2]]}>{p.data.items.map(x=><button key={x.loanCaseId} className={card} onClick={()=>setSelected(x)}><span className="col-span-2">{x.caseNumber}</span><span className="col-span-4">{x.borrower}</span><span className="col-span-4">{x.product}</span><span className="col-span-2">{money(x.approvedAmount)}</span></button>)}</Rows><Pager {...p} total={p.data.total}/>
  </div>;
}
const policyChoices=[
 ["grantBasis","New-loan selection",[["BoardDecision","Board decision date"],["Disbursement","Disbursement date"]]],
 ["populationBasis","Insider status date",[["AtGrant","At grant"],["AtPeriodEnd","At period end"],["AtGrantOrPeriodEnd","At grant or period end"]]],
 ["outstandingBasis","Outstanding amount",[["Principal","Principal only"],["PrincipalAndInterest","Principal and interest"]]],
 ["depositBasis","BOSA balance date",[["AtPeriodEnd","Period end"],["AtBoardDecision","Board decision date"]]],
 ["sectionBBasis","Outstanding-loan section",[["AllOutstanding","All outstanding, including new grants"],["PriorMonthsOnly","Grants from earlier months only"]]],
 ["sharedAllocation","Shared-account repayments",[["Block","Flag for review"],["OldestDueFirst","Accept oldest-due-first reporting allocation"]]],
 ["nilReturn","No reportable loans",[["ReviewRequired","Require nil-return review"],["ExportNil","Allow nil working draft"]]],
];
function Policy(){
  const [form,setForm]=useState(null),[products,setProducts]=useState([]),[busy,setBusy]=useState(true),[error,setError]=useState(""),[retry,setRetry]=useState(0);
  useEffect(()=>{let active=true;setBusy(true);setError("");Promise.all([request("/policy"),request("/products")]).then(([f,p])=>{if(active){setForm(f);setProducts(p);}}).catch(e=>{if(active)setError(e.message);}).finally(()=>{if(active)setBusy(false);});return()=>{active=false;};},[retry]);
  async function save(e){e.preventDefault();setBusy(true);setError("");try{setForm(await request("/policy","PUT",form));await Swal.fire("Saved","Reporting rules saved as a new revision.","success");}catch(e){setError(e.message);}finally{setBusy(false);}}
  return <form onSubmit={save} className="space-y-4">
    {error&&<p role="alert" className="text-red-700">{error}<Button type="button" onClick={()=>setRetry(x=>x+1)}>Reload</Button></p>}
    {!form?<p>Loading reporting setup…</p>:<fieldset disabled={busy} className="space-y-4">
      <div className="grid md:grid-cols-2 gap-4">{policyChoices.map(([key,label,choices])=><Field key={key} label={label} help="Choose the interpretation confirmed by the responsible reporting officer. The selected rule is preserved with each saved draft."><select aria-label={label} required className="w-full border rounded-md p-2" value={form[key]||""} onChange={e=>setForm({...form,[key]:e.target.value,rulesConfirmed:false})}><option value="">Select confirmed rule</option>{choices.map(([value,text])=><option key={value} value={value}>{text}</option>)}</select></Field>)}</div>
      <Field label="BOSA deposit products" help="Include the products that represent BOSA deposits. Share capital and withdrawable savings must not be included merely because they are available here. Locked products already mapped remain visible."><div className="grid md:grid-cols-2 gap-2 border rounded-lg p-3 max-h-72 overflow-y-auto">{products.map(p=><label key={p.id} className="flex gap-2 text-sm"><input type="checkbox" className="accent-indigo-600 w-4 h-4" disabled={p.isLocked&&!form.bosaProductIds?.includes(p.id)} checked={form.bosaProductIds?.includes(p.id)||false} onChange={e=>setForm({...form,rulesConfirmed:false,bosaProductIds:e.target.checked?[...(form.bosaProductIds||[]),p.id]:form.bosaProductIds.filter(id=>id!==p.id)})}/>{p.description} · {p.kind}{p.isLocked?" (locked)":""}</label>)}</div></Field>
      <Field label="Reporting policy evidence"><Input required maxLength={2000} placeholder="Officer confirmation / circular / internal policy reference" value={form.evidence||""} onChange={e=>setForm({...form,evidence:e.target.value})}/></Field>
      <label className="flex gap-2 text-sm"><input type="checkbox" required className="accent-indigo-600 w-4 h-4" checked={form.rulesConfirmed||false} onChange={e=>setForm({...form,rulesConfirmed:e.target.checked})}/>These rules and mappings have been confirmed with the reporting officer</label>
      <Button className={primary} disabled={busy}>{busy?"Saving…":"Save reporting setup"}</Button><span className="ml-3 text-sm text-gray-500">Revision {form.revision}</span>
    </fieldset>}
  </form>;
}
function ReportRows({title,rows,outstanding}){
  return <section className="space-y-3"><h3 className="font-semibold text-gray-800">{title}</h3><Rows empty={!rows.length} headers={[["Loan / borrower",5],["Product",3],[outstanding?"Outstanding":"Granted",2],["Validation",2]]}>{rows.map(x=><details key={x.loanCaseId} className="bg-white rounded-lg shadow-lg border p-3"><summary className="grid grid-cols-12 gap-3 cursor-pointer text-sm"><span className="col-span-5">#{x.caseNumber} · {x.borrower}</span><span className="col-span-3">{x.product}</span><span className="col-span-2">{money(outstanding?x.outstanding:x.granted)}</span><span className={`col-span-2 ${x.issues.length?"text-red-700":"text-green-700"}`}>{x.issues.length?x.issues.length+" issues":"Complete"}</span></summary><dl className="grid md:grid-cols-3 gap-3 mt-4 text-sm">{[["Member",x.memberNumber],["Position",x.position],["Applied",money(x.applied)],["Decision date",day(x.decisionDate)],["BOSA deposits",money(x.bosaDeposits)],["Security",x.security],["First repayment",day(x.firstDueDate)],["Term (months)",x.termMonths],["Performance",x.performance],["Remarks",x.remarks]].map(([label,value])=><div key={label}><dt className="text-gray-500">{label}</dt><dd>{value||"—"}</dd></div>)}</dl>{x.issues.map((issue,i)=><p key={i} className="text-sm text-red-700 mt-2">{issue}</p>)}<details className="mt-3"><summary className="text-indigo-700 cursor-pointer">Board decision evidence</summary><BoardDecision loanCaseId={x.loanCaseId}/></details></details>)}</Rows></section>;
}
function Report(){
  const today=new Date();const previous=new Date(today.getFullYear(),today.getMonth()-1,1);const defaultMonth=`${previous.getFullYear()}-${String(previous.getMonth()+1).padStart(2,"0")}`;
  const [month,setMonth]=useState(defaultMonth),[result,setResult]=useState(null),[busy,setBusy]=useState(false),[error,setError]=useState("");
  async function run(save){setBusy(true);setError("");try{const r=await request(save?"/runs":"/preview","POST",{month:month+"-01"});setResult(r);}catch(e){setResult(null);setError(e.message);}finally{setBusy(false);}}
  return <div className="space-y-5"><div className="flex flex-wrap items-end gap-3"><Field label="Reporting month"><Input aria-label="Reporting month" type="month" value={month} onChange={e=>{setMonth(e.target.value);setResult(null);}}/></Field><Button disabled={busy||!month} onClick={()=>run(false)}>Preview</Button><Button className={primary} disabled={busy||!month} onClick={()=>run(true)}>Generate and save draft</Button><Button disabled={busy||!result?.id||result.id==="00000000-0000-0000-0000-000000000000"} onClick={async()=>{setBusy(true);setError("");try{await downloadRun(result.id);}catch(e){setError(e.message);}finally{setBusy(false);}}}><FaFileExcel/>Download working draft</Button></div>
    {error&&<p role="alert" className="text-red-700">{error}</p>}{busy&&<p className="animate-pulse text-gray-500">Preparing report…</p>}
    {result&&<><div className="rounded-lg border bg-gray-50 p-4 text-sm"><p className="font-semibold">{result.institutionName} · {result.registrationNumber}</p><p>{day(result.month)} – {day(result.asAt)} · Working draft</p><p>Granted: {money(result.totalGranted)} · Known outstanding: {money(result.knownOutstanding)}</p><p className={result.isComplete?"text-green-700":"text-amber-700"}>{result.isComplete?"Data checks complete. Formal approval is not configured.":"Review the exceptions before relying on totals."}</p>{result.id&&result.id!=="00000000-0000-0000-0000-000000000000"&&<p>Saved by {result.createdBy} · {day(result.createdAt)}</p>}</div>
    {!!result.issues.length&&<div role="alert" className="rounded-lg border border-red-200 bg-red-50 p-4 text-red-700 space-y-2">{result.issues.map((x,i)=><p key={i}>{x}</p>)}</div>}
    <ReportRows title="A · New loans granted" rows={result.newLoans}/><ReportRows title="B · Outstanding insider loans" rows={result.outstandingLoans} outstanding/>
    {!!result.warnings.length&&<details><summary>Reporting allocation notes ({result.warnings.length})</summary>{result.warnings.map((x,i)=><p key={i} className="text-sm text-gray-600">{x}</p>)}</details>}
    <p className="text-sm text-gray-500">Changes to supporting records do not alter this preview or saved draft. Generate a new draft to include them.</p></>}
  </div>;
}
export default function Form9({onClose}){
  const [tab,setTab]=useState("report");
  return <main className="bg-white m-8 px-8 py-8 shadow-2xl rounded-lg relative"><header className="bg-indigo-800 px-6 py-3 rounded-2xl flex justify-between items-center gap-3"><h1 className="text-xl font-bold text-white flex gap-2 items-center"><FaUsers/>Form 9 · Insider Lending</h1><Button variant="outline" onClick={onClose}>Back to SASRA reports</Button></header>
    <div className="flex flex-wrap gap-2 my-5">{[["report","Report"],["register","Insider register"],["board","Board decisions"],["policy","Reporting setup"]].map(([key,label])=><Button key={key} className={tab===key?primary:""} onClick={()=>setTab(key)}>{label}</Button>)}</div>
    {tab==="report"&&<Report/>}
    {tab==="register"&&<Register/>}{tab==="board"&&<Board/>}{tab==="policy"&&<Policy/>}
  </main>;
}
