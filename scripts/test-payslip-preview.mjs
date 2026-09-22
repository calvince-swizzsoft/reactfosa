import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { build } from 'esbuild';

// Real React/Radix form in an isolated browser; all HTTP responses are fixtures.
const dir = path.resolve('tmp/payslip-preview-test');
fs.mkdirSync(dir, { recursive: true });
await build({
  stdin: { resolveDir: process.cwd(), loader: 'jsx', contents: `
import React from 'react';
import {createRoot} from 'react-dom/client';
import {MemoryRouter,Routes,Route} from 'react-router-dom';
import SalaryPeriodDetail from './src/pages/HumanResource/SalaryPeriods/Detail.jsx';
let failEntries=false,failList=false,writes=0;
const slip={Id:'slip1',SalaryPeriodMonth:9,SalaryPeriodPostingPeriodDescription:'FY2026',SalaryCardEmployeeCustomerIndividualFirstName:'Samwel',SalaryCardEmployeeCustomerIndividualLastName:'Kimeu',SalaryCardSalaryGroupDescription:'Test 100000',Status:1,NetPay:70221.65};
const entries=[['Basic Salary',1,100000,0],['NSSF',2,6000,0],['SHIF',2,2750,0],['Housing Levy',2,1500,0],['PAYE',2,19308.35,0],['Loan repayment',2,200,20]].map(([Description,SalaryHeadCategory,Principal,Interest],i)=>({Id:'e'+i,Description,SalaryHeadCategory,Principal,Interest}));
window.mockApi=async(url,options={})=>{
 if(options.method&&options.method!=='GET'){writes++;throw Error('Preview must be read-only');}
 if(url.endsWith('/slip1/entries')){if(failEntries)throw Error('Entry load failed');return entries;}
 if(url.endsWith('/slip1'))return {...slip};
 if(url.includes('/payslips/summary'))return {Total:1,Pending:1,Posted:0};
 if(url.includes('/payslips?')){if(failList)throw Error('Payslip list unavailable');return {PageCollection:[{...slip}],ItemsCount:1};}
 if(url.includes('/salarygroups'))return {PageCollection:[]};
 if(url.includes('/branches')||url.includes('/departments'))return [];
 return {Id:'period1',Month:9,Status:1,PostingPeriodDescription:'FY2026',EmployeeCategory:1};
};
const delay=ms=>new Promise(r=>setTimeout(r,ms));
const wait=async(f,label)=>{for(let i=0;i<120;i++){if(f())return;await delay(25);}throw Error(label);};
const check=(ok,label)=>{if(!ok)throw Error(label);};
const btn=text=>[...document.querySelectorAll('button')].find(x=>x.textContent.trim()===text);
const dialog=()=>document.querySelector('[role="dialog"]');
createRoot(document.getElementById('root')).render(<MemoryRouter initialEntries={['/periods/period1']}><Routes><Route path='/periods/:id' element={<SalaryPeriodDetail/>}/></Routes></MemoryRouter>);
(async()=>{try{
 await wait(()=>btn('View Payslip'),'View action not rendered');
 btn('View Payslip').focus();btn('View Payslip').click();
 await wait(()=>dialog()?.textContent.includes('Total deductions'),'Pending preview failed');
 const text=dialog().textContent;
 check(text.includes('Pending')&&text.includes('Samwel Kimeu')&&text.includes('September'),'Employee, month or status missing');
 check(text.includes('100,000.00')&&text.includes('29,778.35')&&text.includes('70,221.65'),'Totals omitted or incorrect');
 check(text.includes('Interest 20.00')&&text.includes('220.00'),'Loan interest must be included in deductions');
 check(writes===0&&!dialog().textContent.includes('Post payslip'),'Preview must not post payroll');
 document.dispatchEvent(new KeyboardEvent('keydown',{key:'Escape',bubbles:true}));await wait(()=>!dialog(),'Escape did not close');
 check(document.activeElement===btn('View Payslip'),'Focus not returned to view action');
 failEntries=true;btn('View Payslip').click();await wait(()=>btn('Retry'),'Failure not displayed');
 check(!dialog().textContent.includes('Net pay'),'Failed preview displayed misleading totals');
 failEntries=false;slip.Status=2;btn('Retry').click();await wait(()=>dialog()?.textContent.includes('Total deductions'),'Retry failed');
 check(dialog().textContent.includes('Posted'),'Posted payslip not available');
 btn('Close').click();await wait(()=>!dialog(),'Close failed');
 check(writes===0,'Preview made financial mutation');
 document.getElementById('result').textContent='PASS: pending and posted payslip preview, saved totals including loan interest, load failure/retry, focus restoration and no posting requests.';
}catch(e){document.getElementById('result').textContent='FAIL: '+e.message;}})();

` },
  outfile: path.join(dir, 'test.js'), bundle: true, format: 'iife', jsx: 'automatic',
  alias: { '@': path.resolve('src') }, loader: { '.png': 'dataurl' },
  define: { 'import.meta.env.VITE_APP_FIN_URL': '"http://fixture"', 'import.meta.env.VITE_APP_MEMBERSHIP_URL': '"http://fixture"', 'process.env.NODE_ENV': '"development"' },
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
const browser='C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe';
const result=spawnSync(browser,['--headless','--disable-gpu','--no-first-run','--no-default-browser-check','--allow-file-access-from-files','--user-data-dir='+path.join(dir,'profile-'+Date.now()),'--virtual-time-budget=12000','--dump-dom','file:///'+path.join(dir,'index.html').replaceAll('\\','/')],{encoding:'utf8',timeout:60000,windowsHide:true,maxBuffer:10*1024*1024});
const outcome=result.stdout?.match(/<pre id="result">([\s\S]*?)<\/pre>/)?.[1];
if(!outcome)console.log({status:result.status,signal:result.signal,stdout:result.stdout?.slice(0,1000)});
console.log(outcome||result.error?.message||result.stderr||'Browser test produced no result');
if(!outcome?.startsWith('PASS:'))process.exitCode=1;
