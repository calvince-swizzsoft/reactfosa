import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import FieldHelp from "@/pages/Accounts/SavingsProducts/FieldHelp";
import Swal from "sweetalert2";
import { request, day } from "./form9Api";
const empty={revision:0,decision:"",decisionDate:"",minuteReference:"",evidence:"",applicantAbsent:false,securityDescription:"",securityConfirmed:false,remarks:""};
export default function BoardDecision({loanCaseId}) {
  const [form,setForm]=useState(empty),[busy,setBusy]=useState(false),[error,setError]=useState(""),[retry,setRetry]=useState(0),[loaded,setLoaded]=useState(false);
  const [history,setHistory]=useState(null);
  useEffect(()=>{let active=true;setBusy(true);setLoaded(false);setError("");setHistory(null);
    request(`/board/${loanCaseId}`).then(x=>{if(active){setForm({...empty,...x});setLoaded(true);}}).catch(e=>{if(active)setError(e.message);}).finally(()=>{if(active)setBusy(false);});
    return()=>{active=false;};
  },[loanCaseId,retry]);
  const change=(key,value)=>setForm(p=>({...p,[key]:value}));
  async function save(){setBusy(true);setError("");try{
    const saved=await request(`/board/${loanCaseId}`,"PUT",{...form,loanCaseId,decisionDate:day(form.decisionDate)});
    setForm(saved);setHistory(null);await Swal.fire("Saved","Board decision evidence saved as a new revision.","success");
  }catch(e){setError(e.message);}finally{setBusy(false);}}
  return <section className="rounded-lg border bg-white p-4 space-y-4">
    <div className="flex items-center gap-2"><h3 className="font-semibold text-gray-800">Insider loan: board decision</h3><FieldHelp label="Board decision">Record a decision already made by the board for a director or employee loan. Ordinary system loan approval does not establish board approval. Keep the minute reference and supporting evidence.</FieldHelp></div>
    {error&&<div role="alert" className="text-red-700">{error} <Button type="button" onClick={()=>setRetry(n=>n+1)}>Reload</Button></div>}
    {busy&&!loaded?<p className="animate-pulse text-gray-500">Loading decision…</p>:<fieldset disabled={busy||!loaded} className="space-y-4">
      <div className="grid md:grid-cols-2 gap-4">
        <div><Label>Decision</Label><select aria-label="Board decision" className="w-full border rounded-md p-2" value={form.decision} onChange={e=>change("decision",e.target.value)}><option value="">Select decision</option><option>Approved</option><option>Ratified</option></select></div>
        <div><Label>Board decision date</Label><Input aria-label="Board decision date" type="date" value={day(form.decisionDate)} onChange={e=>change("decisionDate",e.target.value)}/></div>
        {[["minuteReference","Minute reference",200],["evidence","Evidence reference / document location",2000],["securityDescription","Nature of security (or explicitly unsecured)",1000],["remarks","Report remarks",1000]].map(([key,label,max])=><div key={key}><Label>{label}</Label><Input aria-label={label} maxLength={max} value={form[key]||""} onChange={e=>change(key,e.target.value)}/></div>)}
      </div>
      <label className="flex gap-2 text-sm"><input type="checkbox" className="accent-indigo-600 w-4 h-4" checked={form.applicantAbsent} onChange={e=>change("applicantAbsent",e.target.checked)}/>Applicant was absent from the board decision</label>
      <label className="flex gap-2 text-sm"><input type="checkbox" className="accent-indigo-600 w-4 h-4" checked={form.securityConfirmed} onChange={e=>change("securityConfirmed",e.target.checked)}/>I checked the security description against the loan evidence</label>
      <div className="flex gap-3"><Button type="button" className="bg-indigo-600 hover:bg-indigo-700" onClick={save}>{busy?"Saving…":"Save board decision"}</Button><Button type="button" onClick={async()=>{try{setHistory(await request(`/history/board/${loanCaseId}`));}catch(e){setError(e.message);}}}>Revision history</Button><span className="text-sm text-gray-500 self-center">Revision {form.revision}</span></div>
    </fieldset>}
    {history&&<div className="space-y-2">{history.map(x=><details key={x.revision} className="border rounded-lg p-2"><summary>Revision {x.revision} · {x.createdBy} · {day(x.createdDate)}</summary><pre className="text-xs whitespace-pre-wrap">{JSON.stringify(JSON.parse(x.payload),null,2)}</pre></details>)}</div>}
  </section>;
}
