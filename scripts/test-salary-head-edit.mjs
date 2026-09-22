import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { build } from 'esbuild';

// Real React/Radix form in an isolated browser; all HTTP responses are fixtures.
const dir = path.resolve('tmp/salary-head-edit-test');
fs.mkdirSync(dir, { recursive: true });
await build({
  stdin: { resolveDir: process.cwd(), loader: 'jsx', contents: `
import React from 'react';
import { createRoot } from 'react-dom/client';
import { MemoryRouter } from 'react-router-dom';
import SalaryHeads from './src/pages/HumanResource/SalaryHeads/index.jsx';
const head={Id:'head-1',Description:'Basic Salary',Type:61680,TypeDescription:'Basic Pay Earning (Full-Time)',CategoryDescription:'Earning',ChartOfAccountId:'gl-1',ChartOfAccountAccountCode:5001,ChartOfAccountAccountName:'Basic Salaries Expense',CustomerAccountTypeProductCode:1,CustomerAccountTypeTargetProductId:'product-1',CustomerAccountTypeTargetProductCode:2,ProductDescription:'TEST SAVINGS',IsOneOff:false};
const delay=ms=>new Promise(resolve=>setTimeout(resolve,ms));
let saved;
window.mockApi=async(url,options={})=>{
 if(options.method==='PUT'){saved=JSON.parse(options.body);return saved;}
 if(url.includes('salaryheads'))return {PageCollection:[head],ItemsCount:1};
 if(url.includes('chartofaccounts')){await delay(180);return {data:{PageCollection:[{Id:'gl-1',AccountCode:5001,AccountName:'Basic Salaries Expense'},{Id:'gl-2',AccountCode:5003,AccountName:'House Allowance Expense'}]}};}
 if(url.includes('savingsproducts')){await delay(280);return {data:{PageCollection:[{Id:'product-1',Code:2,Description:'TEST SAVINGS'}]}};}
 if(url.includes('loanproducts')){await delay(40);return {data:{PageCollection:[{Id:'loan-1',Code:3,Description:'Staff Loan'}]}};}
 throw Error('Unexpected test request '+url);
};
const waitFor=async(fn,label)=>{for(let i=0;i<120;i++){if(fn())return;await delay(25);}throw Error(label);};
const check=(ok,label)=>{if(!ok)throw Error(label);};
const button=text=>[...document.querySelectorAll('button')].find(x=>x.textContent.trim()===text);
const value=id=>document.getElementById(id)?.textContent.trim();
async function choose(id,label){
 const trigger=document.getElementById(id);trigger.focus();trigger.dispatchEvent(new KeyboardEvent('keydown',{key:'ArrowDown',bubbles:true}));
 await waitFor(()=>document.querySelector('[role=option]'),'options did not open');
 const option=[...document.querySelectorAll('[role=option]')].find(x=>x.textContent.trim()===label);
 check(option,'Missing option '+label);option.focus();option.dispatchEvent(new KeyboardEvent('keydown',{key:'Enter',bubbles:true}));await delay(80);
}
createRoot(document.getElementById('root')).render(<MemoryRouter><SalaryHeads/></MemoryRouter>);
(async()=>{try{
 await waitFor(()=>button('Edit'),'list did not load');button('Edit').click();
 await delay(650);
 const selections=['salaryhead-type','salaryhead-product-type','salaryhead-product','salaryhead-gl'].map(value);
 check(selections[0]==='Basic Pay Earning (Full-Time)'&&selections[1]==='Savings'&&selections[2]==='TEST SAVINGS'&&selections[3]==='5001 — Basic Salaries Expense','Saved dropdown selections lost: '+JSON.stringify(selections));
 button('Close').click();await delay(150);button('Edit').click();await delay(500);
 check(value('salaryhead-product')==='TEST SAVINGS','Reopening lost saved product');
 await choose('salaryhead-type','Other Earning');
 await choose('salaryhead-gl','5003 — House Allowance Expense');
 button('Update Salary Head').click();await waitFor(()=>saved,'update not submitted');
 check(saved.Type===61688&&saved.ChartOfAccountId==='gl-2'&&saved.CustomerAccountTypeProductCode===1&&saved.CustomerAccountTypeTargetProductId==='product-1'&&saved.CustomerAccountTypeTargetProductCode===2,'Update silently changed linked product: '+JSON.stringify(saved));
 await delay(150);button('Edit').click();await delay(500);
 await choose('salaryhead-product-type','Loan');await delay(150);
 check(value('salaryhead-product')==='Select Product','Changing product type must clear old product');
 await choose('salaryhead-product','Staff Loan');
 check(value('salaryhead-product')==='Staff Loan','New product selection missing');
 document.getElementById('result').textContent='PASS: saved edit selections, delayed lookup responses, paged products, reopen, real selection changes and preserved update payload.';
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
