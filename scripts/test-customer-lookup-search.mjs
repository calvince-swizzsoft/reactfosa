import assert from "node:assert/strict";
import fs from "node:fs";
import vm from "node:vm";
import { transformSync } from "esbuild";

// Exercise the actual component with controlled hooks, timers and API responses.
// No network, customer records or browser session is needed.
const slots = [];
let cursor = 0;
let rendering = false;
let effects = [];
const timers = new Map();
let timerId = 0;
const requests = [];
let picked;
let closed = false;
const react = {
  useState(initial) {
    assert.ok(rendering, "Hooks must only run during component rendering");
    const index = cursor++;
    if (!(index in slots)) slots[index] = initial;
    return [slots[index], (next) => { slots[index] = typeof next === "function" ? next(slots[index]) : next; }];
  },
  useRef(initial) {
    assert.ok(rendering, "Hooks must only run during component rendering");
    const index = cursor++;
    if (!(index in slots)) slots[index] = { current: initial };
    return slots[index];
  },
  useId: () => "lookup",
  useEffect(effect, deps) {
    assert.ok(rendering, "Hooks must only run during component rendering");
    const index = cursor++;
    const previous = slots[index];
    if (!previous || deps.some((dep, i) => !Object.is(dep, previous.deps[i]))) {
      effects.push(() => { previous?.cleanup?.(); slots[index] = { deps, cleanup: effect() }; });
    }
  },
};
const jsx = (type, props) => ({ type, props });
const module = { exports: {} };
const code = transformSync(fs.readFileSync("src/pages/Registry/Customers/Documents/CustomerLookupModal.jsx", "utf8"), { loader: "jsx", format: "cjs", jsx: "automatic" }).code;
vm.runInNewContext(code, {
  module, exports: module.exports, AbortController,
  setTimeout(callback, delay) { assert.equal(delay, 300); timers.set(++timerId, callback); return timerId; },
  clearTimeout(id) { timers.delete(id); },
  require(name) {
    if (name === "react") return react;
    if (name === "react/jsx-runtime") return { jsx, jsxs: jsx };
    if (name === "./customerBranches") return { loadCustomerBranches: async () => {} };
    if (name === "./api") return { searchCustomers: (params) => new Promise((resolve, reject) => requests.push({ params, resolve, reject })) };
    if (name.startsWith("/assets/")) return "empty.png";
    return new Proxy({}, { get: (_, key) => key === "__esModule" ? false : String(key) });
  },
});
const Component = module.exports.default;
let tree;
function render() {
  cursor = 0;
  rendering = true;
  tree = Component({ title: "Select Loanee", onSelect: (item) => { picked = item; }, onClose: () => { closed = true; } });
  rendering = false;
  const pending = effects;
  effects = [];
  pending.forEach((effect) => effect());
}
function nodes(node = tree) {
  if (!node || typeof node !== "object") return [];
  if (Array.isArray(node)) return node.flatMap(nodes);
  return [node, ...nodes(node.props?.children ?? null)];
}
function find(predicate) { const node = nodes().find(predicate); assert.ok(node, "Expected UI element"); return node; }
function changeSearch(value) { find((n) => n.type === "Input").props.onChange({ target: { value } }); render(); }
function fireTimers() { const callbacks = [...timers.values()]; timers.clear(); callbacks.forEach((callback) => callback()); }
async function settle() { await new Promise((resolve) => setImmediate(resolve)); render(); }
const row = { Id: "customer-21", NonIndividualDescription: "Acme Limited", PaddedSerialNumber: "000021", RecordStatus: 2, StationZoneDivisionEmployerDescription: "Employer A" };

render();
changeSearch("Ac");
changeSearch("Acme");
assert.equal(requests.length, 0, "Typing does not fetch before the debounce");
fireTimers();
assert.equal(requests.length, 1, "Typing is combined into one request");
assert.equal(requests[0].params.text, "Acme");
assert.equal(requests[0].params.pageSize, 20);
assert.equal(requests[0].params.pageIndex, 0);
requests[0].resolve({ items: [row], totalPages: 21 });
await settle();
assert.equal(requests.length, 1, "Does not automatically fetch remaining pages");
find((n) => n.type === "Button" && n.props.children === "Next").props.onClick();
render();
assert.ok(!nodes().some((n) => n.props?.["aria-label"]?.startsWith("Select Acme")), "Old results cannot be selected while loading");
fireTimers();
assert.equal(requests[1].params.pageIndex, 1);
find((n) => n.type === "Select").props.onValueChange("6");
render();
assert.ok(requests[1].params.signal.aborted, "Changing the filter cancels the previous request");
fireTimers();
assert.equal(requests[2].params.pageIndex, 0, "Filter change resets pagination");
assert.equal(requests[2].params.customerFilter, 6);
requests[1].resolve({ items: [{ ...row, Id: "stale", NonIndividualDescription: "Stale company" }], totalPages: 21 });
await settle();
assert.ok(!nodes().some((n) => n.props?.["aria-label"]?.includes("Stale company")), "Late response is ignored");
requests[2].reject(new Error("Offline"));
await settle();
find((n) => n.props?.role === "alert");
find((n) => n.type === "Button" && n.props.children === "Try again").props.onClick();
render();
fireTimers();
requests[3].resolve({ items: [row], totalPages: 1 });
await settle();
find((n) => n.props?.["aria-label"]?.startsWith("Select Acme Limited")).props.onClick();
assert.equal(picked, row, "Selection returns the complete customer object");
assert.ok(closed);
changeSearch("Missing");
fireTimers();
requests[4].resolve({ items: [], totalPages: 1 });
await settle();
assert.ok(nodes().some((n) => typeof n.props?.children === "string" && n.props.children.startsWith("No customers found for")), "Empty search has an explicit message");
assert.ok(find((n) => n.type === "Button" && n.props.children === "Next").props.disabled);
console.log("Customer lookup search passed: debounce, bounded paging, filters, cancellation, stale responses, retry, organisation selection and empty results.");
