import process from "node:process";
import http from "node:http";
import fs from "node:fs";

const base = (process.env.FRONT_OFFICE_E2E_BASE_URL || "http://localhost:58240").replace(/\/$/, "");
const requested = process.argv[2] || "all";
const stateFile = new URL("./front-office.state.json", import.meta.url);
const resultsFile = new URL("./FRONT-OFFICE-LATEST.md", import.meta.url);
const state = fs.existsSync(stateFile) ? JSON.parse(fs.readFileSync(stateFile, "utf8")) : {};
let token = "";
const results = [];
const stages = ["preflight", "fixtures", "bind-teller", "start-day", "cash-deposit", "cash-withdrawal", "cheque-deposit", "payment-voucher", "cheque-transfer", "cheque-bank", "cheque-clear", "cash-transfer", "end-of-day", "assertions"];
const env = {
  username: process.env.FRONT_OFFICE_E2E_USERNAME || "e2e.loan.operator",
  password: process.env.FRONT_OFFICE_E2E_PASSWORD || "SwiftE2E!Run2026",
  employeeId: process.env.FRONT_OFFICE_E2E_EMPLOYEE_ID || "f002647b-5071-f111-b56e-c8e2651ef92d",
  branchId: process.env.FRONT_OFFICE_E2E_BRANCH_ID || "d6537be3-0f2b-4569-9db1-25b580143c76",
  customerAccountId: process.env.FRONT_OFFICE_E2E_CUSTOMER_ACCOUNT_ID || "c4a9797e-3122-4bc6-95e6-ab58cdc48e3c",
};

function save() { fs.writeFileSync(stateFile, JSON.stringify(state, null, 2)); }
function data(payload) { if (payload && Object.prototype.hasOwnProperty.call(payload, "data")) return payload.data; if (payload && Object.prototype.hasOwnProperty.call(payload, "Data")) return payload.Data; return payload; }
function list(payload) { const d = data(payload); return Array.isArray(d) ? d : d?.PageCollection || d?.pageCollection || []; }
function id(item) { return item?.Id || item?.id; }
function fail(message, detail = "") { const e = new Error(message); e.detail = detail; throw e; }

async function call(path, { method = "GET", body, auth = true, timeout = 60000 } = {}) {
  const url = new URL(base + path); const serialized = body === undefined ? null : JSON.stringify(body);
  const headers = { Accept: "application/json", Host: url.host };
  if (serialized) headers["Content-Type"] = "application/json";
  if (auth && token) headers.Authorization = `Bearer ${token}`;
  return new Promise((resolve, reject) => {
    const req = http.request({ hostname: url.hostname === "localhost" ? "127.0.0.1" : url.hostname, port: url.port, path: url.pathname + url.search, method, headers, family: 4, timeout }, (res) => {
      let text = ""; res.setEncoding("utf8"); res.on("data", (chunk) => { text += chunk; }); res.on("end", () => { let payload = {}; try { payload = text ? JSON.parse(text) : {}; } catch { payload = { message: text }; } resolve({ status: res.statusCode, ok: res.statusCode >= 200 && res.statusCode < 300, payload }); });
    }); req.on("timeout", () => req.destroy(new Error("request timed out"))); req.on("error", reject); if (serialized) req.write(serialized); req.end();
  });
}
async function login() { const r = await call("/api/auth/login", { method: "POST", body: { UserName: env.username, Password: env.password }, auth: false }); if (!r.ok || !(r.payload.token || r.payload.Token)) fail("Authentication failed", JSON.stringify(r.payload)); token = r.payload.token || r.payload.Token; }
async function loginAs(username, password) { const r = await call("/api/auth/login", { method: "POST", body: { UserName: username, Password: password }, auth: false }); if (!r.ok) fail(`Authentication failed for ${username}`, JSON.stringify(r.payload)); token = r.payload.token || r.payload.Token; }
async function ok(path, options) { const r = await call(path, options); const message = r.payload?.message || r.payload?.Message || ""; if (!r.ok || r.payload?.success === false) fail(`${options?.method || "GET"} ${path} failed`, `${r.status}: ${message || JSON.stringify(r.payload)}`); return data(r.payload); }
const denomination = (amount) => ({ DenominationOneThousandValue: amount, DenominationFiveHundredValue: 0, DenominationTwoHundredValue: 0, DenominationOneHundredValue: 0, DenominationFiftyValue: 0, DenominationFourtyValue: 0, DenominationTwentyValue: 0, DenominationTenValue: 0, DenominationFiveValue: 0, DenominationOneValue: 0, DenominationFiftyCentValue: 0 });

async function currentTeller() { return ok(`/api/frontoffice/tellers/teller?employeeId=${env.employeeId}`); }
async function ensureWorkflowRoles(permissionType, roles) {
  const mappings = await ok(`/api/administration/roles/GetRolesForPermissionType?permissionType=${permissionType}`);
  const existing = Array.isArray(mappings) ? mappings : [];
  if (roles.every((role) => existing.some((item) => (item.RoleName || item.roleName) === role.RoleName))) return;
  await ok("/api/administration/roles/addPermissionTypeToRoles", {
    method: "POST",
    body: { SystemPermissionType: permissionType, permissionTypeinRoles: roles },
  });
}
async function approveAndPost(requestId, permissionType) {
  await loginAs(process.env.FRONT_OFFICE_E2E_APPROVER_USERNAME || "e2e.loan.approver", process.env.FRONT_OFFICE_E2E_APPROVER_PASSWORD || "SwiftE2E!Run2026");
  const workflow = await ok(`/api/administration/workflows/by-record?recordId=${requestId}&systemPermissionType=${permissionType}`);
  if (!workflow || !id(workflow)) fail("Authorization request produced no workflow", requestId);
  for (let step = 0; step < 10; step += 1) {
    const items = await ok(`/api/administration/workflows/${id(workflow)}/items`); const item = (Array.isArray(items) ? items : []).find((x) => Number(x.Status ?? x.status) === 0 && !(x.IsLocked ?? x.isLocked));
    if (!item) break;
    if ((item.RoleName || item.roleName) === "Branch Manager") await loginAs(process.env.FRONT_OFFICE_E2E_SECOND_APPROVER_USERNAME || "e2e.loan.verifier", process.env.FRONT_OFFICE_E2E_SECOND_APPROVER_PASSWORD || "SwiftE2E!Run2026");
    else await loginAs(process.env.FRONT_OFFICE_E2E_APPROVER_USERNAME || "e2e.loan.approver", process.env.FRONT_OFFICE_E2E_APPROVER_PASSWORD || "SwiftE2E!Run2026");
    await ok("/api/administration/workflows/items/approve", { method: "POST", body: { WorkflowItem: { ...item, Status: 2, Remarks: "Front Office automated E2E approval" }, UsedBiometrics: false } });
  }
  const refreshed = await ok(`/api/administration/workflows/${id(workflow)}`);
  if (Number(refreshed?.MatchedStatus ?? refreshed?.matchedStatus) !== 1)
    fail("Authorization workflow did not match after all approvals", JSON.stringify(refreshed));
  await login(); return ok(`/api/frontoffice/requests/post?id=${requestId}`, { method: "POST", body: {} });
}
const handlers = {
  async preflight() {
    await login();
    for (const path of ["/api/frontoffice/tellers?tellerType=0&text=&pageIndex=0&pageSize=1", "/api/frontoffice/requests?type=2&status=1&text=&pageIndex=0&pageSize=1", "/api/accounts/treasurys?pageIndex=0&pageSize=1", "/api/values/getBankWithLinkages"]) await ok(path);
  },
  async fixtures() {
    const account = await ok(`/api/accounts/customer-accounts/${env.customerAccountId}`);
    if (!account || Number(account.RecordStatus ?? account.recordStatus) !== 2) fail("Fixture customer account is not approved", env.customerAccountId);
    state.accountBefore = { book: Number(account.BookBalance || 0), available: Number(account.AvailableBalance || 0) };
    const tellers = list(await ok("/api/frontoffice/tellers?tellerType=0&text=&pageIndex=0&pageSize=100"));
    state.teller = tellers.find((x) => !x.IsLocked && id(x)) || null;
    if (!state.teller) fail("No unlocked teller fixture exists");
    const banks = list(await ok("/api/values/getBankWithLinkages")); state.bankId = banks[0]?.BankId || banks[0]?.bankId;
    if (!state.bankId) fail("No bank linkage fixture exists"); save();
    const linkages = list(await ok("/api/accounts/banklinkages/all")); state.bankLinkageId = id(linkages[0]);
    if (!state.bankLinkageId) fail("No bank linkage fixture exists for cheque banking");
    const chequeTypes = list(await ok("/api/accounts/chequetypes/all")); state.chequeTypeId = id(chequeTypes[0]);
    if (!state.chequeTypeId) fail("No cheque type fixture exists"); save();
  },
  async "bind-teller"() {
    let mine = await currentTeller(); if (mine) { state.teller = mine; save(); return; }
    const teller = state.teller; if (!teller) fail("Fixture stage must run first");
    // TellerAppService intentionally preserves EmployeeId on update, so an E2E
    // identity needs its own teller rather than hijacking an existing assignment.
    const payload = { Type: teller.Type, EmployeeId: env.employeeId, ChartOfAccountId: teller.ChartOfAccountId, ShortageChartOfAccountId: teller.ShortageChartOfAccountId, ExcessChartOfAccountId: teller.ExcessChartOfAccountId, Description: `E2E Teller ${Date.now()}`, Reference: `E2E-${Date.now()}`, RangeLowerLimit: 0, RangeUpperLimit: 1000000, MiniStatementItemsCap: 10 };
    state.teller = await ok("/api/frontoffice/tellers", { method: "POST", body: payload }); save();
    mine = await currentTeller(); if (!mine) fail("Teller binding did not resolve through the JWT EmployeeId claim");
  },
  async "start-day"() {
    const teller = await currentTeller(); if (!teller) fail("Current user has no teller");
    const amount = Number(process.env.FRONT_OFFICE_E2E_FLOAT || 10000); const ref = `FO-E2E-${Date.now()}`;
    await ok("/api/frontoffice/cashmanagement", { method: "POST", body: { Id: state.bankId, BranchId: env.branchId, TransactionType: 4, TotalValue: amount, Reference: `${ref}-BANK`, ...denomination(amount) } });
    await ok("/api/frontoffice/cashmanagement", { method: "POST", body: { TellerId: id(teller), BranchId: env.branchId, TransactionType: 8, TotalValue: amount, Reference: `${ref}-TELLER`, ...denomination(amount) } });
    state.floatAmount = amount; save();
  },
  async "cash-deposit"() {
    const amount = 5000; const response = await call("/api/frontoffice/requests", { method: "POST", body: { Type: 2, BranchId: env.branchId, CreditCustomerAccountId: env.customerAccountId, TotalValue: amount, Remarks: "Front Office E2E cash deposit", Teller: {} } }); let journal = data(response.payload);
    if (response.payload?.success === false && journal?.dialog) journal = await approveAndPost(journal.cashTransactionRequestId, 45092); else if (!response.ok || response.payload?.success === false) fail("Cash deposit failed", JSON.stringify(response.payload));
    if (!id(journal)) fail("Cash deposit returned no journal", JSON.stringify(journal)); state.deposit = { amount, journalId: id(journal) }; save();
  },
  async "cash-withdrawal"() {
    const amount = 100; const journal = await ok("/api/frontoffice/requests", { method: "POST", body: { Type: 1, BranchId: env.branchId, CreditCustomerAccountId: env.customerAccountId, TotalValue: amount, Remarks: "Front Office E2E cash withdrawal", Teller: {} } });
    if (!id(journal)) fail("Cash withdrawal returned no journal", JSON.stringify(journal)); state.withdrawal = { amount, journalId: id(journal) }; save();
  },
  async "cheque-deposit"() {
    const amount = 200; const number = String(Date.now()).slice(-6); const writeDate = new Date().toISOString(); const journal = await ok("/api/frontoffice/requests", { method: "POST", body: { Type: 3, BranchId: env.branchId, CreditCustomerAccountId: env.customerAccountId, TotalValue: amount, Reference: number, Drawer: "E2E Drawer", DrawerBank: "E2E Bank", DrawerBankBranch: "E2E Branch", ChequeType: state.chequeTypeId, WriteDate: writeDate, Remarks: "Front Office E2E cheque deposit", Teller: {} } });
    if (!id(journal)) fail("Cheque deposit returned no journal", JSON.stringify(journal)); state.cheque = { amount, number, journalId: id(journal) }; save();
  },
  async "payment-voucher"() {
    const amount = 50; const reference = `PV-E2E-${Date.now()}`;
    await ensureWorkflowRoles("CashWithdrawalRequestAuthorization", [
      { RoleName: "Super Administrator", BranchId: env.branchId, RequiredApprovers: 1, ApprovalPriority: 1 },
      { RoleName: "Branch Manager", BranchId: env.branchId, RequiredApprovers: 1, ApprovalPriority: 2 },
    ]);
    const r = await call("/api/frontoffice/requests", { method: "POST", body: { Type: 4, BranchId: env.branchId, CreditCustomerAccountId: env.customerAccountId, TotalValue: amount, Remarks: "Front Office E2E payment voucher", Teller: {}, PaymentVoucher: { Payee: "E2E Payee", Reference: reference, Amount: amount, WriteDate: new Date(Date.now() - 30 * 86400000).toISOString() } } });
    const d = data(r.payload); if (!r.ok || r.payload?.success !== false || !d?.dialog || !d?.cashTransactionRequestId) fail("Payment voucher was not routed to authorization", JSON.stringify(r.payload));
    const journal = await approveAndPost(d.cashTransactionRequestId, 44992);
    state.paymentVoucher = { amount, reference, requestId: d.cashTransactionRequestId, journalId: id(journal), status: "Paid" }; save();
  },
  async "cheque-transfer"() {
    const teller = await currentTeller();
    const summary = await ok(`/api/frontoffice/transfers/cheques?TellerId=${id(teller)}`);
    const cheques = list(await ok("/api/frontoffice/cheques?text=&pageIndex=0&pageSize=1000"));
    let selected = cheques.filter((x) => (x.Number || x.number) === state.cheque?.number && !(x.IsTransferred ?? x.isTransferred));
    if (!selected.length) fail("Deposited cheque was not available for transfer", JSON.stringify({ summary, number: state.cheque?.number }));
    await ok("/api/frontoffice/transfers/cheques", { method: "POST", body: selected.map((cheque) => ({ Id: id(cheque) })) }); state.cheque.transferred = true; save();
  },
  async "cheque-bank"() {
    const cheques = list(await ok("/api/frontoffice/cheques?text=&pageIndex=0&pageSize=1000")); const cheque = cheques.find((x) => (x.Number || x.number) === state.cheque?.number);
    if (!cheque || !(cheque.IsTransferred ?? cheque.isTransferred)) fail("Cheque is not ready for banking");
    await ok("/api/frontoffice/cheques/bank", { method: "POST", body: { selectedChequeIds: [id(cheque)], bankLinkageDTO: { Id: state.bankLinkageId }, ModuleNavigationItemCode: 25011 } }); state.cheque.banked = true; save();
  },
  async "cheque-clear"() {
    const cheques = list(await ok("/api/frontoffice/cheques?text=&pageIndex=0&pageSize=1000")); const cheque = cheques.find((x) => (x.Number || x.number) === state.cheque?.number);
    if (!cheque || !(cheque.IsBanked ?? cheque.isBanked)) fail("Cheque is not ready for clearance");
    await ok("/api/frontoffice/cheques/clear", { method: "POST", body: { selectedChequeIds: [id(cheque)], clearingOption: 1, ModuleNavigationItemCode: 25011 } }); state.cheque.cleared = true; save();
  },
  async "cash-transfer"() {
    const amount = 100; await ok("/api/frontoffice/transfers/cash", { method: "POST", body: { Amount: amount, OpeningBalance: "0", TotalDebits: 0, TotalCredits: 0, TellerCashBalanceStatusValue: 20480, Reference: `CT-E2E-${Date.now()}`, ...denomination(amount) } });
    const requests = await ok("/api/frontoffice/transfers/cash"); if (!Array.isArray(requests)) fail("Cash transfer list did not return a collection"); state.cashTransferCreated = true; save();
  },
  async "end-of-day"() {
    const teller = await currentTeller(); const closing = Math.abs(Number(teller.BookBalance || teller.bookBalance || 0)); if (closing <= 0) fail("Teller closing balance is not positive", JSON.stringify(teller));
    const result = await ok("/api/frontoffice/endofday", { method: "POST", body: { ClosingBalance: closing, OpeningBalance: Number(teller.OpeningBalance || 0), TotalDebits: Number(teller.TotalDebits || 0), TotalCredits: Number(teller.TotalCredits || 0), TellerCashBalanceStatusValue: 20480, ...denomination(closing) } }); state.endOfDay = result || true; save();
  },
  async assertions() {
    const account = await ok(`/api/accounts/customer-accounts/${env.customerAccountId}`); const book = Number(account.BookBalance || 0);
    if (!Number.isFinite(book)) fail("Final customer account balance is invalid");
    const chequePage = list(await ok("/api/frontoffice/cheques?text=&pageIndex=0&pageSize=1000")); const cheque = chequePage.find((x) => (x.Number || x.number) === state.cheque?.number);
    if (!cheque || !(cheque.IsTransferred ?? cheque.isTransferred) || !(cheque.IsBanked ?? cheque.isBanked) || !(cheque.IsCleared ?? cheque.isCleared)) fail("Full cheque lifecycle was not persisted"); state.accountAfter = { book, available: Number(account.AvailableBalance || 0) }; save();
  },
};

async function run() {
  const selected = requested === "all" ? stages : stages.includes(requested) ? [requested] : [];
  if (!selected.length) fail(`Unknown stage '${requested}'`);
  for (const stage of selected) { process.stdout.write(`→ ${stage}\n`); const started = Date.now(); try { if (!token) await login(); await handlers[stage](); results.push({ stage, status: "PASS", detail: `${Date.now()-started} ms` }); } catch (e) { results.push({ stage, status: "FAIL", detail: `${e.message}${e.detail ? ` — ${e.detail}` : ""}` }); throw e; } }
}
function report() { const lines = ["# Front Office E2E Results", "", `Run: ${new Date().toISOString()}`, `Target: ${base}`, "", "| Stage | Result | Detail |", "| --- | --- | --- |", ...results.map((r) => `| ${r.stage} | ${r.status} | ${String(r.detail).replace(/\|/g,"\\|")} |`), "", "State is retained in `front-office.state.json` so a failed campaign can resume deterministically.", ""]; fs.writeFileSync(resultsFile, lines.join("\n")); process.stdout.write(`\n${lines.slice(5,-2).join("\n")}\n`); }
run().catch((e) => { process.stderr.write(`✗ ${e.message}${e.detail ? `\n  ${e.detail}` : ""}\n`); process.exitCode=1; }).finally(report);
