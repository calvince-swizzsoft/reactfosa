import assert from 'node:assert/strict';
import { moduleRouteMap } from '../src/lib/moduleRouteMap.js';
import { buildModuleTree, findActiveRoot, findFirstBuiltPath, isModuleControlledPath, isPathGranted } from '../src/lib/moduleTree.js';
const tree = buildModuleTree([
  { Id: 'hub', Code: 26000, AreaCode: 0, Description: 'Command Hub' },
  { Id: 'operations', Code: 26002, AreaCode: 26000, Description: 'Operations' },
  { Id: 'utilities', Code: 26011, AreaCode: 26002, Description: 'Utilities' },
  { Id: 'sasra', Code: 26016, AreaCode: 26011, Description: 'SASRA Reports' },
]);
const path = '/Reports/GenerateSasraForm';
assert.equal(moduleRouteMap[26016], path);
assert.equal(findFirstBuiltPath(tree[0], moduleRouteMap), path);
for (const url of [path, path + '/Setup']) {
  assert.equal(findActiveRoot(tree, url, moduleRouteMap).Code, 26000);
  assert.equal(isModuleControlledPath(url, moduleRouteMap), true);
  assert.equal(isPathGranted(tree, url, moduleRouteMap), true);
  assert.equal(isPathGranted([], url, moduleRouteMap), false);
}
console.log('PASS: SASRA sidebar nesting, landing route and nested-page permission coverage.');
