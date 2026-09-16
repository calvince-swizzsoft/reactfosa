import {useEffect,useState} from 'react';
import {FaFileExcel} from 'react-icons/fa';
import {Button} from '@/components/ui/button';
import {Input} from '@/components/ui/input';
import FieldLabel from '@/pages/Accounts/BatchProcedures/lib/BatchFieldLabel';
import {apiJson} from '@/lib/api';
const base=`${import.meta.env.VITE_APP_FIN_URL}/api/backoffice/loan-ageing`;
const normalize=v=>Array.isArray(v)?v.map(normalize):v&&typeof v==='object'?Object.fromEntries(Object.entries(v).map(([k,x])=>[k[0].toLowerCase()+k.slice(1),normalize(x)])):v;
const categories=['Performing','Watch','Substandard','Doubtful','Loss'];
const money=n=>Number(n??0).toLocaleString('en-KE',{minimumFractionDigits:2,maximumFractionDigits:2});
async function post(path,body){const r=await apiJson(base+path,{method:'POST',body:JSON.stringify(body)});return normalize(r.data??r.Data);}
const primary='bg-indigo-600 hover:bg-indigo-700';
export default function Form4({onClose}){
 const [input,setInput]=useState({yearStart:'',asAt:'',institutionName:'',registrationNumber:''}),[result,setResult]=useState(null),[busy,setBusy]=useState(false),[error,setError]=useState(''),[page,setPage]=useState(0);
 useEffect(()=>{let active=true;apiJson(`${import.meta.env.VITE_APP_FIN_URL}/api/accounts/sasra/setup/profile`,{cache:'no-store'}).then(r=>{const p=normalize(r.data??r.Data);if(active&&p)setInput(v=>({...v,institutionName:v.institutionName||p.institutionName||'',registrationNumber:v.registrationNumber||p.registrationNumber||''}));}).catch(()=>{/* Institution details can be entered without a profile. */});return()=>{active=false;};},[]);
 function change(k,value){setInput(v=>({...v,[k]:value}));setResult(null);setError('');setPage(0);}
 async function run(action){setBusy(true);setError('');try{await action();}catch(e){setError(e.message);}finally{setBusy(false);}}
 async function preview(){setResult(await post('/form4',input));}
 return <main className="bg-white m-8 px-8 py-8 shadow-2xl rounded-lg relative">
  <header className="bg-indigo-800 px-6 py-3 rounded-2xl flex items-center justify-between gap-3"><h1 className="text-xl font-bold text-white flex gap-2 items-center"><FaFileExcel/>Form 4 · Risk Classification</h1><Button variant="outline" disabled={busy} onClick={onClose}>Back</Button></header>
  <div className="my-4"><FieldLabel label="DT SACCO · System working copy · KSh" help="Form 4 calculates categories from loan-account ageing and retained restructuring risk. Download the system working copy and make any category, exposure or other report adjustments in Excel. Unresolved accounts are listed in the workbook and remain unclassified until supported corrections are entered. Excel changes do not update the database."/></div>
  {error&&<p role="alert" className="p-3 rounded-lg bg-red-50 text-red-700 mb-3">{error}</p>}
  <form onSubmit={e=>{e.preventDefault();run(preview);}} className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3 mb-5">
   {[
    ['institutionName','Institution name','text','The DT SACCO name included in the workbook notes.'],
    ['registrationNumber','C/S number','text','Registration number printed in the official workbook.'],
    ['yearStart','Financial year starts','date','Start of the financial year containing the reporting date.'],
    ['asAt','As at','date','Closing position for the selected day. The statutory return is quarterly; other dates support internal review. All system balances and ageing use this date.']
   ].map(([key,label,type,help])=><div key={key}><FieldLabel label={label} help={help}/><Input required disabled={busy} aria-label={label} type={type} value={input[key]} onChange={e=>change(key,e.target.value)}/></div>)}
   <Button type="submit" disabled={busy} className={primary}>Preview classification</Button>
  </form>
  {result&&<>
   <div className="border rounded-lg p-4 mb-4 text-sm space-y-2"><p>Principal G/L: {money(result.ledgerPrincipal)} · Difference: {money(result.principalDifference)} · Unclassified accounts: {result.unresolvedAccounts}</p><p>Unclassified principal: {money(result.unclassifiedPrincipal)}</p><p>Classified exposure: {money(result.totalExposure)} · Required provision: {money(result.totalProvision)}</p>{result.issues.map(x=><p key={x} className="text-amber-700">{x}</p>)}<FieldLabel label={result.version} help="The original Form 4 template is retained. The Loan detail sheet contains blue editable category and adjustment cells which update the return formulas. System figures are regenerated on every download; keep a separate copy of Excel adjustments."/></div>
   <div className="bg-gray-200 p-4 rounded-sm mb-5"><div className="grid grid-cols-12 gap-3 bg-gray-700 text-white font-semibold p-3 rounded-lg mb-3"><span className="col-span-4">Classification</span><span className="col-span-2 text-right">Accounts</span><span className="col-span-3 text-right">Exposure</span><span className="col-span-3 text-right">Provision</span></div><div className="space-y-2">{result.rows.map(r=><div key={`${r.isRestructured}:${r.category}`} className="grid grid-cols-12 gap-3 p-3 bg-white rounded-lg shadow-lg border text-sm"><span className="col-span-4">{r.isRestructured?'Restructured · ':''}{r.name} ({r.rate*100}%)</span><span className="col-span-2 text-right">{r.accounts}</span><span className="col-span-3 text-right">{money(r.exposure)}</span><span className="col-span-3 text-right">{money(r.provision)}</span></div>)}</div></div>
   <h2 className="font-semibold mb-3">Calculated account classifications</h2><div className="bg-gray-200 p-4 rounded-sm"><div className="grid grid-cols-12 gap-3 bg-gray-700 text-white p-3 rounded-lg font-semibold mb-3"><span className="col-span-2">Cases</span><span className="col-span-3">Principal</span><span className="col-span-3">System category</span><span className="col-span-4">Status</span></div><div className="space-y-2">{result.accounts.slice(page*20,page*20+20).map(a=><div key={a.customerAccountId} className="w-full text-left grid grid-cols-12 gap-3 p-3 bg-white rounded-lg shadow-lg border hover:shadow-xl transition-all text-sm text-gray-700"><span className="col-span-2">{a.cases}</span><span className="col-span-3">{money(a.principal)}</span><span className="col-span-3">{a.isSettled?'Settled':a.category==null?'Unclassified':categories[a.category]}</span><span className="col-span-4">{a.issues.length?a.issues.join(' '):a.isSettled?'Settled · Excluded':'Calculated · Adjust in Excel'}</span></div>)}</div></div>
   <div className="flex justify-center gap-3 items-center my-4"><Button disabled={busy||page===0} onClick={()=>setPage(n=>n-1)}>Prev</Button><span>Page {page+1} of {Math.max(1,Math.ceil(result.accounts.length/20))}</span><Button disabled={busy||(page+1)*20>=result.accounts.length} onClick={()=>setPage(n=>n+1)}>Next</Button></div>
   <Button disabled={busy||!result.workbookBase64} className={primary} onClick={()=>run(async()=>{const fresh=await post('/form4',input);setResult(fresh);if(!fresh.workbookBase64)throw new Error('Enter the institution details and reporting dates before downloading.');const bytes=Uint8Array.from(atob(fresh.workbookBase64),c=>c.charCodeAt(0));const url=URL.createObjectURL(new Blob([bytes],{type:'application/vnd.ms-excel'}));const link=document.createElement('a');link.href=url;link.download=`SASRA-Form4-Working-${input.asAt}.xls`;link.click();setTimeout(()=>URL.revokeObjectURL(url),1000);})}>Download working Excel</Button>
  </>}

 </main>;
}
