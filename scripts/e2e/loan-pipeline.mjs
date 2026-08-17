import process from "node:process";
import http from "node:http";
import https from "node:https";

const baseUrl = (process.env.LOAN_E2E_BASE_URL || "http://localhost:58240").replace(/\/$/, "");
const requestedStage = process.argv[2] || "all";
const state = { token: process.env.LOAN_E2E_TOKEN || "", results: [], testUser: null, stageUsers: {}, loanCase: null };

const stages = [
  "preflight", "provision-user", "authenticate", "catalogues", "register", "file-tracking",
  "appraise", "approve", "verify", "disburse", "assertions",
];

function fail(message, detail = "") {
  const error = new Error(message);
  error.detail = detail;
  throw error;
}

async function call(path, { method = "GET", body, authenticated = true } = {}) {
  const headers = { Accept: "application/json" };
  if (body !== undefined) headers["Content-Type"] = "application/json";
  if (authenticated && state.token) headers.Authorization = `Bearer ${state.token}`;
  let response;
  try {
    const target = new URL(`${baseUrl}${path}`);
    const serialized = body === undefined ? undefined : JSON.stringify(body);
    response = await new Promise((resolve, reject) => {
      const client = target.protocol === "https:" ? https : http;
      const request = client.request({
        protocol: target.protocol,
        hostname: target.hostname === "localhost" ? "127.0.0.1" : target.hostname,
        port: target.port,
        path: `${target.pathname}${target.search}`,
        method,
        headers: { ...headers, Host: target.host },
        family: 4,
        timeout: 30000,
      }, (incoming) => {
        let text = "";
        incoming.setEncoding("utf8");
        incoming.on("data", (chunk) => { text += chunk; });
        incoming.on("end", () => resolve({ status: incoming.statusCode, ok: incoming.statusCode >= 200 && incoming.statusCode < 300, text: async () => text }));
      });
      request.on("timeout", () => request.destroy(new Error("request timed out")));
      request.on("error", reject);
      if (serialized !== undefined) request.write(serialized);
      request.end();
    });
  } catch (error) {
    fail(`Cannot reach ${method} ${baseUrl}${path}`, error.message);
  }
  const text = await response.text();
  let payload = {};
  try { payload = text ? JSON.parse(text) : {}; } catch { payload = { message: text }; }
  return { response, payload };
}

async function expectRoute(path, method = "GET") {
  process.stdout.write(`  probing ${method} ${path}\n`);
  const { response, payload } = await call(path, { method, body: method === "POST" ? {} : undefined, authenticated: false });
  if (response.status === 404) fail(`Required route is missing: ${method} ${path}`, "Rebuild and restart WebApplication1; IIS Express is serving a stale backend binary.");
  return { response, payload };
}

function payloadData(payload) { return payload?.data ?? payload?.Data ?? payload; }

async function requireOk(path, options) {
  const result = await call(path, options);
  if (!result.response.ok) fail(`${options?.method || "GET"} ${path} failed (${result.response.status})`, result.payload.message || result.payload.Message || JSON.stringify(result.payload));
  return payloadData(result.payload);
}

async function loginAs(user) {
  const { response, payload } = await call("/api/auth/login", { method: "POST", body: { UserName: user.username, Password: user.password }, authenticated: false });
  if (!response.ok) fail(`Login failed for ${user.username} (${response.status})`, payload.message || payload.Message || "No server message");
  state.token = payload.token || payload.Token;
  if (!state.token) fail(`Login for ${user.username} returned no bearer token`);
}

const handlers = {
  async preflight() {
    await expectRoute("/api/auth/login", "POST");
    await expectRoute("/api/administration/users");
    await expectRoute("/api/backoffice/loancases?pageIndex=0&pageSize=1");
    await expectRoute("/api/registry/fileregisters?pageIndex=0&pageSize=1");
    await expectRoute("/api/registry/fileregisters/dispatch", "POST");
    await expectRoute("/api/accounts/loandisbursementbatches?pageIndex=0&pageSize=1");
  },
  async "provision-user"() {
    const username = process.env.LOAN_E2E_USERNAME || "e2e.loan.operator";
    const temporaryPassword = process.env.LOAN_E2E_TEMP_PASSWORD || "SwiftE2E!Temp2026";
    const password = process.env.LOAN_E2E_PASSWORD || "SwiftE2E!Run2026";
    const users = await requireOk("/api/administration/users", { authenticated: false });
    const existing = (Array.isArray(users) ? users : []).find((user) => (user.UserName || user.userName || "").toLowerCase() === username.toLowerCase());

    if (!existing) {
      const employees = await requireOk("/api/humanresource/employees", { authenticated: false });
      const usedEmployeeIds = new Set((Array.isArray(users) ? users : []).map((user) => user.EmployeeId || user.employeeId).filter(Boolean));
      const employee = (Array.isArray(employees) ? employees : []).find((item) => {
        const id = item.Id || item.id;
        const branchId = item.BranchId || item.branchId;
        return id && branchId && branchId !== "00000000-0000-0000-0000-000000000000" && !usedEmployeeIds.has(id);
      });
      if (!employee) fail("No unassigned employee with a valid branch is available for the E2E user");
      const employeeId = employee.Id || employee.id;
      const branchId = employee.BranchId || employee.branchId;
      const customerId = employee.CustomerId || employee.customerId || null;
      const created = await requireOk("/api/administration/users", { method: "POST", authenticated: false, body: { FirstName: "E2E", OtherNames: "Loan Operator", Email: "e2e.loan.operator@example.test", UserName: username, EmployeeId: employeeId, CustomerId: customerId, BranchId: branchId, Password: temporaryPassword, TwoFactorEnabled: false, LockoutEnabled: false } });
      if (created !== true && created?.success === false) fail("User creation endpoint did not confirm success", JSON.stringify(created));
      await requireOk("/api/administration/roles/add", { method: "POST", authenticated: false, body: { UserName: username, Roles: [process.env.LOAN_E2E_ROLE || "Credit Admin"] } });
      const changed = await requireOk("/api/auth/change-initial-password", { method: "POST", authenticated: false, body: { UserName: username, CurrentPassword: temporaryPassword, NewPassword: password, ConfirmPassword: password } });
      state.token = changed.token || changed.Token;
    }
    state.testUser = { username, password };
    const stageNames = ["appraiser", "approver", "verifier"];
    for (const stageName of stageNames) {
      const stageUsername = process.env[`LOAN_E2E_${stageName.toUpperCase()}_USERNAME`] || `e2e.loan.${stageName}`;
      const stagePassword = process.env[`LOAN_E2E_${stageName.toUpperCase()}_PASSWORD`] || "SwiftE2E!Run2026";
      state.stageUsers[stageName] = { username: stageUsername, password: stagePassword };
      const stageExists = (Array.isArray(users) ? users : []).some((user) => (user.UserName || user.userName || "").toLowerCase() === stageUsername.toLowerCase());
      if (!stageExists) {
        const temporaryStagePassword = "SwiftE2E!Stage2026";
        await requireOk("/api/administration/users", { method: "POST", authenticated: false, body: { FirstName: "E2E", OtherNames: stageName, Email: `${stageUsername}@example.test`, UserName: stageUsername, BranchId: process.env.LOAN_E2E_BRANCH_ID || "d6537be3-0f2b-4569-9db1-25b580143c76", Password: temporaryStagePassword, TwoFactorEnabled: false, LockoutEnabled: false } });
        await requireOk("/api/administration/roles/add", { method: "POST", authenticated: false, body: { UserName: stageUsername, Roles: [process.env.LOAN_E2E_ROLE || "Credit Admin"] } });
        await requireOk("/api/auth/change-initial-password", { method: "POST", authenticated: false, body: { UserName: stageUsername, CurrentPassword: temporaryStagePassword, NewPassword: stagePassword, ConfirmPassword: stagePassword } });
      }
    }
    const workflowPermissions = ["FrontOfficeLoanRegistration", "FrontOfficeLoanAppraisal", "FrontOfficeLoanApproval", "FrontOfficeLoanAudit"];
    for (const permission of workflowPermissions) {
      const mappings = await requireOk(`/api/administration/roles/GetRolesForPermissionType?permissionType=${permission}`, { authenticated: false });
      const role = process.env.LOAN_E2E_ROLE || "Credit Admin";
      if (!(Array.isArray(mappings) ? mappings : []).some((item) => (item.RoleName || item.roleName) === role)) {
        await requireOk("/api/administration/roles/addPermissionTypeToRoles", { method: "POST", authenticated: false, body: { SystemPermissionType: permission, permissionTypeinRoles: [{ RoleName: role, BranchId: process.env.LOAN_E2E_BRANCH_ID || "d6537be3-0f2b-4569-9db1-25b580143c76", RequiredApprovers: 1, ApprovalPriority: 1 }] } });
      }
    }
  },
  async authenticate() {
    if (state.token) return;
    const UserName = state.testUser?.username || process.env.LOAN_E2E_USERNAME;
    const Password = state.testUser?.password || process.env.LOAN_E2E_PASSWORD;
    if (!UserName || !Password) fail("Authentication credentials are required", "Set LOAN_E2E_USERNAME and LOAN_E2E_PASSWORD, or LOAN_E2E_TOKEN.");
    const { response, payload } = await call("/api/auth/login", { method: "POST", body: { UserName, Password }, authenticated: false });
    if (!response.ok) fail(`Login failed (${response.status})`, payload.message || payload.Message || "No server message");
    state.token = payload.token || payload.Token;
    if (!state.token) fail("Login succeeded without returning a bearer token");
    if (payload.requiresPasswordChange || payload.RequiresPasswordChange) fail("The E2E user must change its initial password before the pipeline can run");
  },
  async catalogues() {
    const endpoints = [
      "/api/registry/customers?pageIndex=0&pageSize=1",
      "/api/accounts/loanproducts?pageIndex=0&pageSize=1",
      "/api/backoffice/loanpurposes?pageIndex=0&pageSize=1",
      "/api/backoffice/loaningremarks?pageIndex=0&pageSize=1",
    ];
    for (const endpoint of endpoints) {
      const { response, payload } = await call(endpoint);
      if (!response.ok) fail(`Catalogue request failed (${response.status}): ${endpoint}`, payload.message || payload.Message || "");
    }
  },
  async register() {
    const fixture = {
      customerId: process.env.LOAN_E2E_CUSTOMER_ID || "42c096a9-199a-f111-b585-c8e2651ef92d",
      loanProductId: process.env.LOAN_E2E_LOAN_PRODUCT_ID || "770db6ac-e098-f111-b584-c8e2651ef92d",
      savingsProductId: process.env.LOAN_E2E_SAVINGS_PRODUCT_ID || "9ad2a1d3-3333-4a17-b1e7-4c3a3a8e7e99",
      loanPurposeId: process.env.LOAN_E2E_LOAN_PURPOSE_ID || "aa37e3d9-019a-f111-b585-c8e2651ef92d",
      registrationRemarkId: process.env.LOAN_E2E_REGISTRATION_REMARK_ID || "04eb2447-029a-f111-b585-c8e2651ef92d",
      branchId: process.env.LOAN_E2E_BRANCH_ID || "d6537be3-0f2b-4569-9db1-25b580143c76",
    };
    const amountApplied = Number(process.env.LOAN_E2E_AMOUNT || 100000);
    const receivedDate = new Date().toISOString().slice(0, 10);
    const inProcess = await requireOk(`/api/backoffice/loancases/customers/${fixture.customerId}/in-process`);
    const resumable = (Array.isArray(inProcess) ? inProcess : []).find((item) =>
      (item.LoanProductId || item.loanProductId) === fixture.loanProductId
    );
    if (resumable) {
      state.loanCase = resumable;
      process.stdout.write(`  resumed loan case ${resumable.PaddedCaseNumber || resumable.CaseNumber || resumable.Id}\n`);
      return;
    }
    state.loanCase = await requireOk("/api/backoffice/loancases", {
      method: "POST",
      body: {
        LoanCase: {
          CustomerId: fixture.customerId,
          LoanProductId: fixture.loanProductId,
          SavingsProductId: fixture.savingsProductId,
          LoanPurposeId: fixture.loanPurposeId,
          RegistrationRemarkId: fixture.registrationRemarkId,
          BranchId: fixture.branchId,
          AmountApplied: amountApplied,
          ReceivedDate: receivedDate,
        },
        Guarantors: [],
        CollateralDocumentIds: [],
      },
    });
    const id = state.loanCase?.Id || state.loanCase?.id;
    if (!id) fail("Registration succeeded without returning a loan-case ID", JSON.stringify(state.loanCase));
    process.stdout.write(`  created loan case ${state.loanCase.PaddedCaseNumber || state.loanCase.CaseNumber || id}\n`);
  },
  async "file-tracking"() {
    const customerId = state.loanCase?.CustomerId || state.loanCase?.customerId;
    if (!customerId) fail("The registration stage did not retain a customer ID");
    let file = null;
    const lookup = await call(`/api/registry/fileregisters/customers/${customerId}`);
    if (lookup.response.ok) file = payloadData(lookup.payload);
    if (lookup.response.status !== 404 && !lookup.response.ok) {
      fail(`File-register lookup failed (${lookup.response.status})`, lookup.payload.message || lookup.payload.Message || "");
    }
    const current = file?.FileRegister || file?.fileRegister;
    if (!current) {
      const departments = await requireOk("/api/humanresource/departments?pageIndex=0&pageSize=1000");
      if (!Array.isArray(departments) || departments.length < 2) fail("At least two departments are required to dispatch a physical file");
      const sourceId = process.env.LOAN_E2E_SOURCE_DEPARTMENT_ID || departments[0].Id || departments[0].id;
      const destinationId = process.env.LOAN_E2E_DESTINATION_DEPARTMENT_ID || departments.find((item) => (item.Id || item.id) !== sourceId)?.Id;
      await requireOk("/api/registry/fileregisters/dispatch", {
        method: "POST",
        body: { CustomerIds: [customerId], SourceDepartmentId: sourceId, DestinationDepartmentId: destinationId, Carrier: "E2E loan operator", Remarks: "Automated loan pipeline test" },
      });
      file = await requireOk(`/api/registry/fileregisters/customers/${customerId}`);
    }
    const register = file?.FileRegister || file?.fileRegister;
    if (!register?.Id && !register?.id) fail("Dispatch did not create a file register", JSON.stringify(file));
    if ((register.StatusDescription || register.statusDescription) !== "Received") {
      await requireOk("/api/registry/fileregisters/receive", {
        method: "POST",
        body: { FileRegisterIds: [register.Id || register.id] },
      });
      file = await requireOk(`/api/registry/fileregisters/customers/${customerId}`);
    }
    const received = file?.FileRegister || file?.fileRegister;
    if ((received?.StatusDescription || received?.statusDescription) !== "Received") fail("Physical file did not reach Received status", JSON.stringify(received));
    process.stdout.write(`  received file register ${received.Id || received.id}\n`);
  },
  async appraise() {
    await loginAs(state.stageUsers.appraiser);
    const loanCaseId = state.loanCase?.Id || state.loanCase?.id;
    if (!loanCaseId) fail("The registration stage did not retain a loan-case ID");
    const worksheet = await requireOk(`/api/backoffice/loancases/${loanCaseId}/appraisal-worksheet`);
    const loan = worksheet.loanCase || worksheet.LoanCase;
    if (!["Registered", "Deferred"].includes(loan?.StatusDescription || loan?.statusDescription)) {
      state.loanCase = loan;
      process.stdout.write(`  resumed already-${(loan?.StatusDescription || "processed").toLowerCase()} loan case\n`);
      return;
    }
    if (!(worksheet.fileReadyForAppraisal ?? worksheet.FileReadyForAppraisal)) fail("Appraisal worksheet reports that the physical file is not ready");
    const tasksPage = await requireOk("/api/administration/workflows/items/mine?status=0&text=&startDate=1900-01-01&endDate=9999-12-31&pageIndex=0&pageSize=1000");
    const tasks = tasksPage?.PageCollection || tasksPage?.pageCollection || [];
    const task = tasks.find((item) => (item.WorkflowRecordId || item.workflowRecordId) === loanCaseId && (item.WorkflowSystemPermissionTypeDescription || "").includes("Loan Appraisal"));
    if (!task) fail("No pending appraisal workflow task was routed to the authenticated user");
    const amount = Number(loan?.AmountApplied || loan?.amountApplied || 0);
    const result = await requireOk(`/api/backoffice/loancases/${loanCaseId}/appraise`, {
      method: "POST",
      body: {
        WorkflowItemId: task.Id || task.id,
        UsedBiometrics: false,
        Option: 1,
        ModuleNavigationItemCode: 70008,
        LoanProductLatestIncome: amount,
        AppraisedNetIncome: amount,
        AppraisedAbility: amount,
        SystemAppraisedAmount: amount,
        SystemAppraisalRemarks: "E2E system appraisal",
        AppraisedAmount: amount,
        AppraisedAmountRemarks: "E2E amount confirmed",
        AppraisalRemarks: "Automated E2E appraisal",
        MonthlyPaybackAmount: Number(worksheet.paymentPerPeriod || 0),
        TotalPaybackAmount: Number(worksheet.loanPlusInterest || amount),
        TotalLoansBalance: Number(worksheet.outstandingLoansBalance || 0),
        IncomeAdjustments: [],
        AttachedLoanAccountIds: [],
      },
    });
    state.loanCase = result?.loanCase || result?.LoanCase || result || state.loanCase;
    process.stdout.write(`  appraised loan case ${loan.PaddedCaseNumber || loan.CaseNumber || loanCaseId}\n`);
  },
  async approve() {
    await loginAs(state.stageUsers.approver);
    const loanCaseId = state.loanCase?.Id || state.loanCase?.id;
    if (!loanCaseId) fail("The appraisal stage did not retain a loan-case ID");
    const details = await requireOk(`/api/backoffice/loancases/${loanCaseId}`);
    let loan = details.loanCase || details.LoanCase;
    if ((loan?.StatusDescription || loan?.statusDescription) !== "Appraised") {
      state.loanCase = loan;
      process.stdout.write(`  resumed already-${(loan?.StatusDescription || "processed").toLowerCase()} loan case\n`);
      return;
    }
    const worksheet = await requireOk(`/api/backoffice/loancases/${loanCaseId}/approval-worksheet`);
    loan = worksheet.loanCase || worksheet.LoanCase;
    const tasksPage = await requireOk("/api/administration/workflows/items/mine?status=0&text=&startDate=1900-01-01&endDate=9999-12-31&pageIndex=0&pageSize=1000");
    const tasks = tasksPage?.PageCollection || tasksPage?.pageCollection || [];
    const task = tasks.find((item) => (item.WorkflowRecordId || item.workflowRecordId) === loanCaseId && (item.WorkflowSystemPermissionTypeDescription || "").includes("Loan Approval"));
    if (!task) fail("No pending approval workflow task was routed to the authenticated user");
    const amount = Number(loan.AppraisedAmount || loan.AmountApplied || 0);
    const schedule = worksheet.repaymentSchedule || worksheet.RepaymentSchedule || [];
    const firstPayment = schedule[0] || {};
    const result = await requireOk(`/api/backoffice/loancases/${loanCaseId}/approve`, {
      method: "POST",
      body: {
        WorkflowItemId: task.Id || task.id,
        UsedBiometrics: false,
        Option: 1,
        ApprovedAmount: amount,
        ApprovedAmountRemarks: "E2E amount confirmed",
        ApprovedPrincipalPayment: Number(firstPayment.Principal || firstPayment.principal || 0),
        ApprovedInterestPayment: Number(firstPayment.Interest || firstPayment.interest || 0),
        MonthlyPaybackAmount: Number(firstPayment.Payment || firstPayment.payment || loan.MonthlyPaybackAmount || 0),
        TotalPaybackAmount: schedule.reduce((sum, item) => sum + Number(item.Payment || item.payment || 0), 0) || Number(loan.TotalPaybackAmount || amount),
        ApprovalRemarks: "Automated E2E approval",
      },
    });
    state.loanCase = result?.loanCase || result?.LoanCase || result || state.loanCase;
    process.stdout.write(`  approved loan case ${loan.PaddedCaseNumber || loan.CaseNumber || loanCaseId}\n`);
  },
  async verify() {
    await loginAs(state.stageUsers.verifier);
    const loanCaseId = state.loanCase?.Id || state.loanCase?.id;
    if (!loanCaseId) fail("The approval stage did not retain a loan-case ID");
    const details = await requireOk(`/api/backoffice/loancases/${loanCaseId}`);
    let loan = details.loanCase || details.LoanCase;
    if ((loan?.StatusDescription || loan?.statusDescription) !== "Approved") {
      state.loanCase = loan;
      process.stdout.write(`  resumed already-${(loan?.StatusDescription || "processed").toLowerCase()} loan case\n`);
      return;
    }
    const worksheet = await requireOk(`/api/backoffice/loancases/${loanCaseId}/verification-worksheet`);
    loan = worksheet.loanCase || worksheet.LoanCase;
    const tasksPage = await requireOk("/api/administration/workflows/items/mine?status=0&text=&startDate=1900-01-01&endDate=9999-12-31&pageIndex=0&pageSize=1000");
    const tasks = tasksPage?.PageCollection || tasksPage?.pageCollection || [];
    const task = tasks.find((item) => (item.WorkflowRecordId || item.workflowRecordId) === loanCaseId && (item.WorkflowSystemPermissionTypeDescription || "").includes("Loan Verification"));
    if (!task) fail("No pending verification workflow task was routed to the authenticated user");
    const result = await requireOk(`/api/backoffice/loancases/${loanCaseId}/audit`, {
      method: "POST",
      body: {
        WorkflowItemId: task.Id || task.id,
        UsedBiometrics: false,
        Option: 1,
        Reference: `E2E-${loan.PaddedCaseNumber || loan.CaseNumber || loanCaseId}`,
        AuditRemarks: "Automated E2E verification",
      },
    });
    state.loanCase = result?.loanCase || result?.LoanCase || result || state.loanCase;
    process.stdout.write(`  verified loan case ${loan.PaddedCaseNumber || loan.CaseNumber || loanCaseId}\n`);
  },
  async disburse() {
    const loanCaseId = state.loanCase?.Id || state.loanCase?.id;
    if (!loanCaseId) fail("The verification stage did not retain a loan-case ID");
    await loginAs(state.stageUsers.verifier);
    const details = await requireOk(`/api/backoffice/loancases/${loanCaseId}`);
    const loan = details.loanCase || details.LoanCase;
    if ((loan?.StatusDescription || loan?.statusDescription) === "Disbursed") {
      state.loanCase = loan;
      process.stdout.write("  resumed already-disbursed loan case\n");
      return;
    }
    if (!["Audited", "Verified"].includes(loan?.StatusDescription || loan?.statusDescription)) fail("Only a verified/audited loan case can enter disbursement", loan?.StatusDescription || "Unknown status");
    const batch = await requireOk("/api/accounts/loandisbursementbatches", {
      method: "POST",
      body: {
        BranchId: loan.BranchId,
        Type: 1,
        LoanProductCategory: Number(loan.LoanRegistrationLoanProductCategory || 0),
        Reference: `E2E-${loan.PaddedCaseNumber || loan.CaseNumber}`,
        Priority: 3,
      },
    });
    const batchId = batch.Id || batch.id;
    if (!batchId) fail("Disbursement batch creation returned no ID", JSON.stringify(batch));
    const entry = await requireOk(`/api/accounts/loandisbursementbatches/${batchId}/entries`, {
      method: "POST",
      body: { LoanCaseId: loanCaseId, Reference: `E2E-${loan.PaddedCaseNumber || loan.CaseNumber}` },
    });
    await loginAs(state.stageUsers.appraiser);
    await requireOk(`/api/accounts/loandisbursementbatches/${batchId}/audit`, {
      method: "POST",
      body: { Option: 1, Remarks: "Automated E2E batch verification", ModuleNavigationItemCode: 23079 },
    });
    await loginAs(state.stageUsers.approver);
    await requireOk(`/api/accounts/loandisbursementbatches/${batchId}/authorize`, {
      method: "POST",
      body: { Option: 1, Remarks: "Automated E2E batch authorization", ModuleNavigationItemCode: 23089 },
    });
    const entryId = entry.Id || entry.id;
    if (!entryId) fail("Disbursement entry creation returned no ID", JSON.stringify(entry));
    await loginAs(state.testUser);
    const postResult = await call(`/api/accounts/loandisbursementbatches/entries/${entryId}/post`, {
      method: "POST",
      body: { ModuleNavigationItemCode: 23089 },
    });
    if (!postResult.response.ok) {
      // Authorization queues entries for posting. The dispatcher can win
      // the race with this deterministic fallback, in which case POST
      // correctly returns 409 because the entry is already Posted.
      const persistedEntry = await requireOk(`/api/accounts/loandisbursementbatches/entries/${entryId}`);
      if ((persistedEntry.StatusDescription || persistedEntry.statusDescription) !== "Posted") {
        fail(`POST /api/accounts/loandisbursementbatches/entries/${entryId}/post failed (${postResult.response.status})`, postResult.payload.message || postResult.payload.Message || JSON.stringify(postResult.payload));
      }
    }
    const refreshed = await requireOk(`/api/backoffice/loancases/${loanCaseId}`);
    state.loanCase = refreshed.loanCase || refreshed.LoanCase;
    if ((state.loanCase?.StatusDescription || state.loanCase?.statusDescription) !== "Disbursed") fail("Entry posting did not move the loan case to Disbursed", JSON.stringify(state.loanCase));
    process.stdout.write(`  disbursed loan case ${loan.PaddedCaseNumber || loan.CaseNumber || loanCaseId} in batch ${batch.BatchNumber || batchId}\n`);
  },
  async assertions() {
    await loginAs(state.testUser);
    const loanCaseId = state.loanCase?.Id || state.loanCase?.id;
    const details = await requireOk(`/api/backoffice/loancases/${loanCaseId}`);
    const loan = details.loanCase || details.LoanCase;
    if ((loan?.StatusDescription || loan?.statusDescription) !== "Disbursed") fail("Final loan-case status is not Disbursed", loan?.StatusDescription || "Unknown status");
    if (!(Number(loan.DisbursedAmount || loan.disbursedAmount) > 0)) fail("Final loan case has no positive disbursed amount");
    const accounts = await requireOk(`/api/accounts/customer-accounts/${loan.CustomerId || loan.customerId}/accounts`);
    const list = Array.isArray(accounts) ? accounts : [];
    const loanAccount = list.find((item) => Number(item.CustomerAccountTypeProductCode || item.customerAccountTypeProductCode) === 2 && (item.CustomerAccountTypeTargetProductId || item.customerAccountTypeTargetProductId) === (loan.LoanProductId || loan.loanProductId));
    const savingsAccount = list.find((item) => Number(item.CustomerAccountTypeProductCode || item.customerAccountTypeProductCode) === 1 && (item.CustomerAccountTypeTargetProductId || item.customerAccountTypeTargetProductId) === (loan.SavingsProductId || loan.savingsProductId));
    if (!loanAccount) fail("Disbursement did not create the expected loan account");
    if (!savingsAccount) fail("Disbursement did not create the expected destination savings account");
    for (const permissionType of [45008, 45009, 45007]) {
      const workflow = await requireOk(`/api/administration/workflows/by-record?recordId=${loanCaseId}&systemPermissionType=${permissionType}`);
      if (!workflow || Number(workflow.Status || workflow.status) !== 2 || Number(workflow.MatchedStatus || workflow.matchedStatus) !== 1) fail(`Workflow ${permissionType} is not approved and matched`, JSON.stringify(workflow));
    }
    process.stdout.write(`  asserted loan account ${loanAccount.FullAccountNumber || loanAccount.Id}\n`);
    process.stdout.write(`  asserted savings account ${savingsAccount.FullAccountNumber || savingsAccount.Id}\n`);
  },
};

for (const stage of stages.slice(11)) handlers[stage] = async () => {
  fail(`Stage '${stage}' needs a configured test fixture`, "The non-destructive preflight must pass first; then provide the dedicated E2E user and fixture IDs in scripts/e2e/loan-pipeline.env.example.");
};

async function runStage(stage) {
  const started = Date.now();
  process.stdout.write(`→ ${stage}\n`);
  try {
    await handlers[stage]();
    const durationMs = Date.now() - started;
    state.results.push({ stage, result: "PASS", durationMs });
    process.stdout.write(`✓ ${stage} (${durationMs} ms)\n`);
  } catch (error) {
    state.results.push({ stage, result: "FAIL", durationMs: Date.now() - started, message: error.message, detail: error.detail || "" });
    throw error;
  }
}

try {
  if (!stages.includes(requestedStage) && requestedStage !== "all") fail(`Unknown stage '${requestedStage}'`, `Choose one of: ${stages.join(", ")}, all`);
  const selected = requestedStage === "all" ? stages : stages.slice(0, stages.indexOf(requestedStage) + 1);
  for (const stage of selected) await runStage(stage);
  process.stdout.write("Loan pipeline E2E completed successfully.\n");
} catch (error) {
  process.stderr.write(`✗ ${error.message}\n`);
  if (error.detail) process.stderr.write(`  ${error.detail}\n`);
  process.exitCode = 1;
} finally {
  process.stdout.write(`\nRESULTS\n${state.results.map(item => `${item.result.padEnd(4)} ${item.stage}${item.message ? ` — ${item.message}` : ""}`).join("\n")}\n`);
}
