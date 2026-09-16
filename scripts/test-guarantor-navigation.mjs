import assert from 'node:assert/strict';
import {buildModuleTree, consolidateGuarantorNavigation, isPathGranted} from '../src/lib/moduleTree.js';

const path='/Loaning/Guarantors';
const routes={70014:path,70015:path,70016:path,70017:path};
for(const codes of [[],[70014],[70015],[70016],[70017],[70014,70015],[70015,70016],[70014,70015,70016,70017]]) {
 const source=buildModuleTree([{Code:70012,AreaCode:0,Description:'Loaning'},...codes.map(Code=>({Code,AreaCode:70012,Description:'Legacy'}))]);
 const snapshot=JSON.stringify(source);
 const tree=consolidateGuarantorNavigation(source);
 const services=tree[0].Children.filter(n=>n.Description==='Guarantor Management');
 assert.equal(services.length,codes.length?1:0);
 if(codes.length)assert.ok(codes.includes(services[0].Code),'retains an actually granted code');
 assert.equal(isPathGranted(tree,path,routes),codes.length>0);
 assert.equal(tree[0].Children.length,codes.length?1:0,'one combined entry');
 assert.equal(JSON.stringify(source),snapshot,'does not mutate source grants');
 assert.deepEqual(consolidateGuarantorNavigation(tree),tree,'cached consolidated trees are stable');
}
console.log('PASS: guarantor navigation consolidation preserves granted access, single-action roles, management and cached trees.');
