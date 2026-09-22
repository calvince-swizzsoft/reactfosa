import assert from "node:assert/strict";
import fs from "node:fs";
import vm from "node:vm";
import { transformSync } from "esbuild";
import { getBranchIdFromToken } from "../src/lib/auth.js";

const branchId = "11111111-1111-1111-1111-111111111111";
let token;
globalThis.localStorage = { getItem: () => token };
for (const value of [undefined, "invalid", "", "00000000-0000-0000-0000-000000000000"]) {
  token = `header.${Buffer.from(JSON.stringify({ BranchId: value })).toString("base64url")}.signature`;
  assert.equal(getBranchIdFromToken(), null);
}
token = `header.${Buffer.from(JSON.stringify({ BranchId: branchId })).toString("base64url")}.signature`;
assert.equal(getBranchIdFromToken(), branchId);
token = "bad-token";
assert.equal(getBranchIdFromToken(), null);

const code = transformSync(fs.readFileSync("src/pages/Loaning/LoanCases/RegistrationScreen.jsx", "utf8"), { loader: "jsx", format: "cjs", jsx: "automatic", define: { "import.meta.env": "{}" } }).code;
async function scenario({ claim = branchId, locked = false, failure = false } = {}) {
  const slots = [];
  let cursor = 0, rendering = false;
  let effects = [], submitted, requests = 0;
  const react = {
    useState(initial) { assert.ok(rendering); const i = cursor++; if (!(i in slots)) slots[i] = initial; return [slots[i], (next) => { slots[i] = typeof next === "function" ? next(slots[i]) : next; }]; },
    useEffect(effect, deps) { assert.ok(rendering); const i = cursor++; const prev = slots[i]; if (!prev || deps.some((v, j) => !Object.is(v, prev.deps[j]))) effects.push(() => { prev?.cleanup?.(); slots[i] = { deps, cleanup: effect() }; }); },
  };
  const module = { exports: {} };
  const jsx = (type, props) => ({ type, props });
  vm.runInNewContext(code, {
    module, exports: module.exports, AbortController,
    require(name) {
      if (name === "react") return react;
      if (name === "react/jsx-runtime") return { jsx, jsxs: jsx };
      if (name === "react-router-dom") return { useNavigate: () => () => {} };
      if (name === "@/lib/auth") return { getBranchIdFromToken: () => claim };
      if (name === "@/lib/api") return { apiJson: async (url) => { requests++; assert.ok(url.endsWith(claim)); if (failure) throw new Error("Offline"); return { data: { Id: branchId, Description: "Operator branch", IsLocked: locked } }; } };
      if (name.endsWith("loanCaseEnums")) return { RecordStatus: { Approved: 2 }, LoanCaseStatus: {} };
      if (name.endsWith("guarantorValidation")) return { validateRegistrationGuarantors: () => null };
      if (name.endsWith("loanCaseApi")) return {
        getRegistrationContext: async () => ({ customer: { BranchId: "customer-branch", BranchDescription: "Customer branch" } }),
        createLoanCase: async (body) => { submitted = body; },
      };
      if (name === "sweetalert2") return { __esModule: true, default: { fire: async () => ({ isConfirmed: false }) } };
      if (name === "framer-motion") return { motion: { div: "div" }, AnimatePresence: "AnimatePresence" };
      return new Proxy({ __esModule: true, default: name }, { get: (target, key) => target[key] ?? String(key) });
    },
  });
  let tree;
  function render() { cursor = 0; rendering = true; tree = module.exports.CreateLoanCaseDrawer({ open: true, onClose() {} }); rendering = false; const pending = effects; effects = []; pending.forEach((effect) => effect()); }
  function nodes(node = tree) { if (!node || typeof node !== "object") return []; if (Array.isArray(node)) return node.flatMap(nodes); return [node, ...nodes(node.props?.children ?? null)]; }
  const tick = async () => { await new Promise((resolve) => setImmediate(resolve)); render(); };
  render();
  await tick();
  // Fill the required inputs as though selected by the operator.
  slots[0] = { ...slots[0], CustomerId: "customer", CustomerLabel: "Member", CustomerRecordStatus: 2, LoanProductId: "product", loanProduct: {}, SavingsProductId: "savings", LoanPurposeId: "purpose", RegistrationRemarkId: "remark", AmountApplied: "1000" };
  render();
  await tick();
  render();
  const input = nodes().find((node) => node.props?.id === "loan-registration-branch");
  assert.equal(input.props.readOnly, true);
  assert.ok(!nodes().some((node) => node.props?.label === "Branch" && node.props?.onClick), "Branch cannot be picked");
  const submit = nodes().find((node) => node.type === "Button" && node.props.children === "Register Loan Case");
  if (!claim || locked || failure) {
    assert.ok(submit.props.disabled);
    await submit.props.onClick({ preventDefault() {} });
    assert.equal(submitted, undefined, "Submission is blocked without a valid user branch");
  } else {
    assert.equal(input.props.value, "Operator branch", "Customer context does not overwrite the operator branch");
    assert.equal(submit.props.disabled, false);
    await submit.props.onClick({ preventDefault() {} });
    assert.equal(submitted.LoanCase.BranchId, branchId);
  }
  assert.equal(requests, claim ? 1 : 0);
}
await scenario();
await scenario({ claim: null });
await scenario({ locked: true });
await scenario({ failure: true });
console.log("Loan registration branch passed: token validation, read-only operator branch, customer isolation, submitted branch, missing/locked/failed branch blocking and hook placement.");
