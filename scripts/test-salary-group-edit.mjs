import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { build } from 'esbuild';

// Real React/Radix form in an isolated browser; all HTTP responses are fixtures.
const dir = path.resolve('tmp/salary-group-edit-test');
fs.mkdirSync(dir, { recursive: true });
await build({
  stdin: { resolveDir: process.cwd(), loader: 'jsx', contents: `
import React from 'react';
import { createRoot } from 'react-dom/client';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import SalaryGroupDetail from './src/pages/HumanResource/SalaryGroups/Detail.jsx';
let entries=[
 {Id:'entry-basic',SalaryHeadId:'basic',SalaryHeadDescription:'Basic Salary',ChargeType:2,ChargeFixedAmount:100000,ChargePercentage:0,MinimumValue:0,RoundingType:0},
 {Id:'entry-nssf',SalaryHeadId:'nssf',SalaryHeadDescription:'NSSF',ChargeType:2,ChargeFixedAmount:0,ChargePercentage:0,MinimumValue:0,RoundingType:0},
];
let saved=null;
window.mockApi=async(url,options={})=>{
 if(url.includes('salaryheads'))return {PageCollection:[{Id:'basic',Description:'Basic Salary'},{Id:'nssf',Description:'NSSF'}]};
 if(url.endsWith('/entries')){
   if(options.method==='PUT'){saved=JSON.parse(options.body);entries=saved.map((e,i)=>({...e,Id:e.Id||'new-'+i}));}
   return entries;
 }
 return {Id:'group-1',Description:'Test group'};
};
const delay=ms=>new Promise(resolve=>setTimeout(resolve,ms));
const waitFor=async(fn,label)=>{for(let i=0;i<120;i++){if(fn())return;await delay(25);}throw Error(label);};
const check=(ok,label)=>{if(!ok)throw Error(label);};
const button=text=>[...document.querySelectorAll('button')].find(x=>x.textContent.trim()===text);
const edit=name=>document.querySelector('button[aria-label="Edit '+name+'"]');
const amount=()=>[...document.querySelectorAll('label')].find(x=>x.textContent==='Fixed Value').parentElement.querySelector('input');
createRoot(document.getElementById('root')).render(<MemoryRouter initialEntries={['/groups/group-1']}><Routes><Route path='/groups/:id' element={<SalaryGroupDetail/>}/></Routes></MemoryRouter>);
(async()=>{try{
 await waitFor(()=>edit('Basic Salary'),'Group did not load');
 edit('Basic Salary').click();await delay(100);
 check(edit('Basic Salary')&&edit('NSSF'),'Editing removed a salary head from the list');
 check(button('Update Entry')&&button('Cancel'),'Explicit edit actions missing');
 check(amount().value==='100000','Editor did not load saved amount');
 check(button('Save Entries').disabled,'Saving an unfinished edit must be blocked');
 button('Cancel').click();await delay(100);
 check(edit('Basic Salary')&&button('Save Entries').disabled&&!saved,'Cancel must leave the original row and clean state');
 edit('Basic Salary').click();await delay(100);button('Update Entry').click();await delay(100);
 check(button('Save Entries').disabled,'Unchanged edits must not replace persisted entries');
 edit('Basic Salary').click();await delay(100);
 Object.getOwnPropertyDescriptor(HTMLInputElement.prototype,'value').set.call(amount(),'120000');
 amount().dispatchEvent(new Event('input',{bubbles:true}));await delay(100);
 button('Update Entry').click();await delay(100);
 check(edit('Basic Salary')&&edit('NSSF')&&!button('Save Entries').disabled&&!saved,'Apply must retain both rows and stage changes locally');
 edit('NSSF').click();await delay(100);button('Cancel').click();await delay(100);
 check(!button('Save Entries').disabled,'Cancelling another edit must retain earlier applied changes');
 button('Save Entries').click();await waitFor(()=>saved,'Changes not submitted');
 check(saved.length===2&&saved[0].SalaryHeadId==='basic'&&!('Id' in saved[0])&&saved[0].ChargeFixedAmount===120000&&saved[1].Id==='entry-nssf','Save must replace only the edited entry and preserve every other row');
 document.getElementById('result').textContent='PASS: edit retains rows, prefill, cancel, unchanged edit, unfinished-edit guard, staged update and complete save payload.';
}catch(e){document.getElementById('result').textContent='FAIL: '+e.message;}})();

` },
  outfile: path.join(dir, 'test.js'), bundle: true, format: 'iife', jsx: 'automatic',
  alias: { '@': path.resolve('src') }, loader: { '.png': 'dataurl' },
  define: { 'import.meta.env.VITE_APP_FIN_URL': '"http://fixture"', 'process.env.NODE_ENV': '"development"' },
  plugins: [{ name: 'fixture-api', setup(b) {
    b.onResolve({filter:/^@\/lib\/api$/},()=>({path:'api',namespace:'fixture'}));
    b.onResolve({filter:/^sweetalert2$/},()=>({path:'swal',namespace:'fixture'}));
    b.onResolve({filter:/^\/assets\//},args=>({path:args.path,namespace:'asset-fixture'}));
    b.onLoad({filter:/.*/,namespace:'asset-fixture'},()=>({loader:'js',contents:'export default "fixture.png";'}));
    b.onLoad({filter:/.*/,namespace:'fixture'},args=>({loader:'js',resolveDir:process.cwd(),contents:args.path==='swal'?'export default {fire:()=>Promise.resolve({})};':
      'export {normalizeList} from '+JSON.stringify(path.resolve('src/lib/api.js'))+'; export const apiJson=(...args)=>window.mockApi(...args);'}));
  }}],
});
fs.writeFileSync(path.join(dir,'index.html'),'<html><body><pre id="result">RUNNING</pre><div id="root"></div><script src="test.js"></script></body></html>');
const browser='C:/Program Files/Google/Chrome/Application/chrome.exe';
const result=spawnSync(browser,['--headless','--disable-gpu','--no-first-run','--no-default-browser-check','--allow-file-access-from-files','--user-data-dir='+path.join(dir,'profile'),'--virtual-time-budget=12000','--dump-dom','file:///'+path.join(dir,'index.html').replaceAll('\\','/')],{encoding:'utf8',timeout:60000,windowsHide:true,maxBuffer:10*1024*1024});
const outcome=result.stdout?.match(/<pre id="result">([\s\S]*?)<\/pre>/)?.[1];
console.log(outcome||result.error?.message||'Browser test produced no result');
if(!outcome?.startsWith('PASS:'))process.exitCode=1;
