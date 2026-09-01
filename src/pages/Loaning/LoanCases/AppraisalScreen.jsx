import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Swal from "sweetalert2";
import { motion, AnimatePresence } from "framer-motion";
import { FaPlus, FaChevronDown, FaTrash, FaClipboardCheck, FaUser, FaChartLine, FaWallet, FaShieldAlt, FaCalculator, FaCalendarAlt, FaGavel } from "react-icons/fa";
import NotFoundImage from "/assets/scopefinding.png";
import { listLoanCases, getAppraisalWorksheet, appraiseLoanCase } from "./lib/loanCaseApi";
import { LoanCaseStatus, LoanAppraisalOption } from "./lib/loanCaseEnums";
import LoanCaseStatusBadge from "./lib/LoanCaseStatusBadge";
import LoanCaseSummary from "./lib/LoanCaseSummary";
import EntryPickerModal from "../../Accounts/BatchProcedures/lib/EntryPickerModal";
import FieldHelp from "../../Accounts/SavingsProducts/FieldHelp";

const FIN_BASE = `${import.meta.env.VITE_APP_FIN_URL}`;
const MODULE_NAVIGATION_ITEM_CODE = 70008; // Appraisal (ControllerName: AppraiseLoan)
const INCOME_ADJUSTMENT_DEDUCTION = 0xFADE + 1;
const money = (value) => Number(value || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });

function FieldGroup({ label, help, required, children }) {
  return (
    <div>
      <div className="mb-1 flex items-center gap-1">
        <Label className="text-sm font-semibold text-gray-700">
          {label}{required && <span className="ml-1 text-red-500">*</span>}
        </Label>
        <FieldHelp label={label}>{help}</FieldHelp>
      </div>
      {children}
    </div>
  );
}

function Metric({ label, value, help }) {
  return <div className="rounded-lg border border-indigo-100 border-l-4 border-l-indigo-500 bg-white p-3 shadow-sm"><div className="flex items-center gap-1"><p className="text-xs uppercase tracking-wider text-gray-400">{label}</p>{help && <FieldHelp label={label}>{help}</FieldHelp>}</div><p className="mt-1 text-lg font-bold text-indigo-800">{money(value)}</p></div>;
}

const APPRAISAL_TABS = [
  { key: "overview", label: "Overview", icon: FaUser },
  { key: "history", label: "Financial History", icon: FaChartLine },
  { key: "loans", label: "Existing Loans", icon: FaWallet },
  { key: "security", label: "Security", icon: FaShieldAlt },
  { key: "qualification", label: "Qualification", icon: FaCalculator },
  { key: "schedule", label: "Repayment Schedule", icon: FaCalendarAlt },
  { key: "decision", label: "Decision", icon: FaGavel },
];

function ContextList({ title, items = [], render, empty }) {
  return <div><p className="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-2">{title}</p><div className="space-y-2">{items.length ? items.map((item, index) => <div key={item.Id || index} className="rounded-lg border bg-gray-50 p-3 text-sm text-gray-700">{render(item)}</div>) : <p className="text-sm text-gray-400">{empty}</p>}</div></div>;
}

function PickerField({ label, value, placeholder, onClick }) {
  return (
    <div>
      <Label className="text-sm font-semibold text-gray-700 mb-1 block">{label}</Label>
      <button
        type="button"
        onClick={onClick}
        className="w-full flex items-center justify-between px-3 py-2 border border-gray-300 rounded-md bg-white text-sm hover:border-indigo-400 transition-colors text-left"
      >
        <span className={value ? "text-gray-800 truncate" : "text-gray-400"}>{value || placeholder}</span>
        <FaChevronDown className="text-gray-400 text-xs flex-shrink-0 ml-2" />
      </button>
    </div>
  );
}

const emptyDecisionForm = {
  LoanProductLatestIncome: "", AppraisedNetIncome: "", AppraisedAbility: "",
  SystemAppraisedAmount: "", SystemAppraisalRemarks: "",
  AppraisedAmount: "", AppraisedAmountRemarks: "", AppraisalRemarks: "",
  MonthlyPaybackAmount: "", TotalPaybackAmount: "", TotalLoansBalance: "",
};

function AppraisalDrawer({ loanCaseId, workflowItemId, onClose, onChanged }) {
  const navigate = useNavigate();
  const [worksheet, setWorksheet] = useState(null);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState(emptyDecisionForm);
  const [incomeAdjustments, setIncomeAdjustments] = useState([]);
  const [picker, setPicker] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [usedBiometrics, setUsedBiometrics] = useState(false);
  const [activeTab, setActiveTab] = useState("overview");
  const [attachedLoanIds, setAttachedLoanIds] = useState([]);

  useEffect(() => {
    if (!loanCaseId) return;
    setLoading(true);
    setUsedBiometrics(false);
    getAppraisalWorksheet(loanCaseId)
      .then((data) => {
        setWorksheet(data);
        setForm({
          LoanProductLatestIncome: "",
          AppraisedNetIncome: "",
          AppraisedAbility: "",
          SystemAppraisedAmount: data.systemAppraisedAmount ?? "",
          SystemAppraisalRemarks: "",
          AppraisedAmount: data.loanCase?.AmountApplied ?? "",
          AppraisedAmountRemarks: "",
          AppraisalRemarks: "",
          MonthlyPaybackAmount: data.paymentPerPeriod ?? "",
          TotalPaybackAmount: data.loanPlusInterest ?? "",
          TotalLoansBalance: data.outstandingLoansBalance ?? "",
        });
        setIncomeAdjustments([]);
        setAttachedLoanIds((data.attachedLoans || []).map((item) => item.CustomerAccountId));
        setActiveTab("overview");
      })
      .catch((err) => Swal.fire("Error", err.message, "error"))
      .finally(() => setLoading(false));
  }, [loanCaseId]);

  if (!loanCaseId) return null;

  const addIncomeAdjustment = (item) => {
    if (incomeAdjustments.some((r) => r.IncomeAdjustmentId === item.Id)) return;
    setIncomeAdjustments((p) => [...p, { IncomeAdjustmentId: item.Id, label: item.Description, Type: item.Type, TypeDescription: item.TypeDescription, CustomerAccountId: "", Amount: "", IsEnabled: true }]);
  };
  const updateIncomeAdjustment = (index, patch) => setIncomeAdjustments((p) => p.map((r, i) => (i === index ? { ...r, ...patch } : r)));
  const removeIncomeAdjustment = (index) => setIncomeAdjustments((p) => p.filter((_, i) => i !== index));
  const requiresIncomeAppraisal = worksheet?.requiresIncomeAppraisal !== false;
  const adjustedNetIncome = incomeAdjustments.reduce((netIncome, row) => {
    if (!row.IsEnabled) return netIncome;
    const amount = Number(row.Amount) || 0;
    return row.Type === INCOME_ADJUSTMENT_DEDUCTION ? netIncome - amount : netIncome + amount;
  }, Number(form.LoanProductLatestIncome) || 0);

  const submit = async (option) => {
    const remarks = form.AppraisalRemarks.trim();
    if (!remarks) {
      Swal.fire("Missing Fields", "Appraisal remarks are required.", "warning");
      return;
    }
    if (option === LoanAppraisalOption.Appraise) {
      if (!worksheet?.fileReadyForAppraisal) {
        Swal.fire(
          "Physical File Required",
          worksheet?.fileRegister?.LoanAppraisalReadinessMessage || "The physical file must be received by the loan appraisal department before appraisal.",
          "warning",
        );
        return;
      }
      const positiveFields = [
        ["Appraised amount", form.AppraisedAmount],
        ["Monthly payback amount", form.MonthlyPaybackAmount],
        ["Total payback amount", form.TotalPaybackAmount],
      ];
      const invalid = positiveFields.find(([, value]) => !Number.isFinite(Number(value)) || Number(value) <= 0);
      if (invalid) {
        Swal.fire("Invalid Appraisal", `${invalid[0]} must be greater than zero.`, "warning");
        return;
      }
      if (requiresIncomeAppraisal && (adjustedNetIncome < 0 || Number(form.AppraisedAbility) < 0)) {
        Swal.fire("Invalid Appraisal", "Net income and appraised ability cannot be negative.", "warning");
        return;
      }
      if (Number(form.AppraisedAmount) !== Number(form.SystemAppraisedAmount) && !form.AppraisedAmountRemarks.trim()) {
        Swal.fire("Missing Fields", "Give a reason for overriding the system-appraised amount.", "warning");
        return;
      }
      const invalidAdjustment = incomeAdjustments.find((row) => !Number.isFinite(Number(row.Amount)) || Number(row.Amount) <= 0);
      if (invalidAdjustment) {
        Swal.fire("Invalid Adjustment", `Enter an amount greater than zero for ${invalidAdjustment.label}.`, "warning");
        return;
      }
    }
    setSubmitting(true);
    try {
      const result = await appraiseLoanCase(loanCaseId, {
        WorkflowItemId: workflowItemId || undefined,
        UsedBiometrics: usedBiometrics,
        Option: option,
        ModuleNavigationItemCode: MODULE_NAVIGATION_ITEM_CODE,
        LoanProductLatestIncome: requiresIncomeAppraisal ? Number(form.LoanProductLatestIncome) || 0 : 0,
        AppraisedNetIncome: requiresIncomeAppraisal ? adjustedNetIncome : 0,
        AppraisedAbility: requiresIncomeAppraisal ? Number(form.AppraisedAbility) || 0 : 0,
        SystemAppraisedAmount: Number(form.SystemAppraisedAmount) || 0,
        SystemAppraisalRemarks: form.SystemAppraisalRemarks,
        AppraisedAmount: Number(form.AppraisedAmount) || 0,
        AppraisedAmountRemarks: form.AppraisedAmountRemarks,
        AppraisalRemarks: remarks,
        MonthlyPaybackAmount: Number(form.MonthlyPaybackAmount) || 0,
        TotalPaybackAmount: Number(form.TotalPaybackAmount) || 0,
        TotalLoansBalance: Number(form.TotalLoansBalance) || 0,
        IncomeAdjustments: option === LoanAppraisalOption.Appraise && requiresIncomeAppraisal
          ? incomeAdjustments.map((r) => ({ IncomeAdjustmentId: r.IncomeAdjustmentId, CustomerAccountId: r.CustomerAccountId || null, Amount: Number(r.Amount) || 0, IsEnabled: r.IsEnabled }))
          : [],
        AttachedLoanAccountIds: option === LoanAppraisalOption.Appraise ? attachedLoanIds : [],
      });
      Swal.fire("Success", option === LoanAppraisalOption.Appraise ? "Loan case appraised." : "Loan case rejected.", "success");
      onChanged();
      onClose();
      return result;
    } catch (err) {
      Swal.fire("Error", err.message, "error");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AnimatePresence>
      <motion.div className="fixed inset-0 bg-black z-40" initial={{ opacity: 0 }} animate={{ opacity: 0.4 }} exit={{ opacity: 0 }} onClick={onClose} />
      <motion.div className="fixed top-0 right-0 h-full w-[94vw] max-w-[1280px] overflow-hidden rounded-l-2xl bg-white shadow-2xl z-50 flex flex-col" initial={{ x: "100%" }} animate={{ x: 0 }} exit={{ x: "100%" }} transition={{ type: "spring", stiffness: 300, damping: 30 }}>
        <div className="m-2 flex justify-between items-center bg-indigo-600 rounded-2xl px-4 py-3">
          <h2 className="flex items-center gap-2 font-bold text-white"><FaClipboardCheck /> Appraise Loan Case {worksheet?.loanCase?.PaddedCaseNumber && <span className="font-normal text-indigo-100">· {worksheet.loanCase.PaddedCaseNumber}</span>}</h2>
          <Button variant="outline" size="sm" onClick={onClose}>Close</Button>
        </div>

        <div className="flex-1 overflow-y-auto bg-gray-50 px-4 py-4 space-y-4">
          {loading ? (
            <div className="space-y-2 animate-pulse">{[1, 2, 3].map((i) => <div key={i} className="h-10 bg-gray-100 rounded-lg" />)}</div>
          ) : worksheet ? (
            <>
              <div className="flex gap-1 overflow-x-auto border-b border-gray-200">
                {APPRAISAL_TABS.map(({ key, label, icon: Icon }) => (
                  <button key={key} type="button" onClick={() => setActiveTab(key)} className={`flex items-center gap-2 whitespace-nowrap rounded-t-lg px-4 py-2 text-sm font-semibold transition-all ${activeTab === key ? "bg-indigo-600 text-white shadow" : "text-gray-500 hover:bg-indigo-50 hover:text-indigo-700"}`}>
                    <Icon className="text-xs" /> {label}
                  </button>
                ))}
              </div>

              {activeTab === "overview" && <>
                <LoanCaseSummary loanCase={worksheet.loanCase} guarantors={worksheet.guarantors} collaterals={worksheet.collaterals} />
                <div className="grid grid-cols-2 gap-3 rounded-lg border border-indigo-100 bg-white p-4 text-sm shadow-sm md:grid-cols-4">
                  <div><span className="block text-xs text-gray-400">Employer</span><strong>{worksheet.customer?.StationZoneDivisionEmployerDescription || worksheet.loanCase.CustomerStationZoneDivisionEmployerDescription || "—"}</strong></div>
                  <div><span className="block text-xs text-gray-400">Station</span><strong>{worksheet.customer?.StationDescription || worksheet.loanCase.CustomerStation || "—"}</strong></div>
                  <div><span className="block text-xs text-gray-400">Membership number</span><strong>{worksheet.customer?.PaddedSerialNumber || worksheet.customer?.SerialNumber || "—"}</strong></div>
                  <div><span className="block text-xs text-gray-400">Identification</span><strong>{worksheet.customer?.IdentificationNumber || worksheet.customer?.IndividualIdentificationNumber || "—"}</strong></div>
                  <div><span className="block text-xs text-gray-400">Section</span><strong>{worksheet.loanCase.LoanRegistrationLoanProductSectionDescription || "—"}</strong></div>
                  <div><span className="block text-xs text-gray-400">Term</span><strong>{worksheet.loanCase.LoanRegistrationTermInMonths || 0} months</strong></div>
                  <div><span className="block text-xs text-gray-400">Annual interest</span><strong>{worksheet.loanCase.LoanInterestAnnualPercentageRate || 0}%</strong></div>
                  <div><span className="block text-xs text-gray-400">Interest calculation</span><strong>{worksheet.loanCase.LoanInterestCalculationModeDescription || worksheet.loanCase.InterestCalculationModeDescription || "—"}</strong></div>
                  <div><span className="block text-xs text-gray-400">Payment frequency</span><strong>{worksheet.loanCase.LoanRegistrationPaymentFrequencyPerYearDescription || "—"}</strong></div>
                  <div><span className="block text-xs text-gray-400">Savings product</span><strong>{worksheet.loanCase.SavingsProductDescription || "—"}</strong></div>
                </div>
                {worksheet.fileRegister?.IsLoanAppraisalFileTrackingEnforced && (
                  <div className={`rounded-lg border p-3 text-sm ${worksheet.fileReadyForAppraisal ? "border-green-200 bg-green-50 text-green-700" : "border-amber-200 bg-amber-50 text-amber-700"}`}>
                    <p className="font-semibold">Physical file: {worksheet.fileRegister?.FileRegister?.StatusDescription || "Not registered"}</p>
                    <p className="text-xs mt-1">Current department: {worksheet.fileRegister?.LastDepartment?.Description || "Not available"}</p>
                    {!worksheet.fileReadyForAppraisal && (
                      <p className="text-xs mt-1 font-medium">{worksheet.fileRegister?.LoanAppraisalReadinessMessage || "Receive the file in the loan appraisal department to continue."}</p>
                    )}
                  </div>
                )}
              </>}

              {activeTab === "history" && <ContextList title="Standing Orders" items={worksheet.standingOrders} render={(item) => `${item.Description || "Standing order"} · ${Number(item.Amount || 0).toLocaleString()}`} empty="No standing orders found." />}

              {activeTab === "loans" && <div className="space-y-4">
                <ContextList title="Loan applications in process" items={worksheet.loanApplications} render={(item) => `${item.PaddedCaseNumber || "Loan case"} · ${item.LoanProductDescription || ""} · ${Number(item.AmountApplied || 0).toLocaleString()}`} empty="No other applications in process." />
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-2">Loan accounts to clear from proceeds</p>
                  <div className="space-y-2">
                    {(worksheet.loanAccounts || []).map((account) => <label key={account.Id} className="flex items-center gap-3 rounded-lg border bg-gray-50 p-3 text-sm">
                      <input type="checkbox" className="w-4 h-4 accent-indigo-600" checked={attachedLoanIds.includes(account.Id)} onChange={(e) => setAttachedLoanIds((old) => e.target.checked ? [...old, account.Id] : old.filter((id) => id !== account.Id))} />
                      <span className="flex-1"><span className="font-semibold text-gray-700">{account.FullAccountNumber}</span><span className="block text-xs text-gray-500">{account.CustomerAccountTypeTargetProductDescription}</span></span>
                      <span className="font-semibold text-gray-800">{Number((account.BookBalance || 0) + (account.CarryForwardsBalance || 0)).toLocaleString()}</span>
                    </label>)}
                    {!(worksheet.loanAccounts || []).length && <p className="text-sm text-gray-400">No loan accounts found.</p>}
                  </div>
                </div>
              </div>}

              {activeTab === "security" && <LoanCaseSummary loanCase={worksheet.loanCase} guarantors={worksheet.guarantors} collaterals={worksheet.collaterals} />}

              {activeTab === "qualification" && <>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  <Metric label="Appraisal balance" value={worksheet.appraisalBaseBalance} help={`${money(worksheet.qualification?.InvestmentsBalance)} investments${worksheet.qualification?.SavingsIncluded ? ` + ${money(worksheet.qualification?.SavingsBalance)} savings` : ""}. ${worksheet.qualification?.SavingsIncluded ? "This product includes savings." : "This product uses investments only."}`} />
                  <Metric label="Maximum loan" value={worksheet.maximumLoan} help={`${money(worksheet.appraisalBaseBalance)} × ${Number(worksheet.qualification?.EffectiveMultiplier || 0).toLocaleString()} = ${money(worksheet.qualification?.BalanceBasedMaximum)}, capped at the product maximum of ${money(worksheet.qualification?.ProductMaximumAmount)}.`} />
                  <Metric label="Existing balance" value={worksheet.outstandingLoansBalance} help="The absolute book and carry-forward balance of this customer's existing accounts for the selected loan product." />
                  <Metric label="Maximum entitled" value={worksheet.maximumEntitled} help={worksheet.qualification?.ExistingBalanceExcluded ? `${money(worksheet.maximumLoan)}. The product is configured not to deduct existing balances from maximum entitlement.` : `${money(worksheet.maximumLoan)} − ${money(worksheet.outstandingLoansBalance)}, never below zero.`} />
                </div>
              </>}

              {activeTab === "schedule" && (
                <div className="overflow-x-auto rounded-lg border">
                  <div className="grid min-w-[900px] grid-cols-7 gap-2 bg-gray-700 p-3 text-xs font-semibold text-gray-100">
                    <span>Period</span><span>Due Date</span><span className="text-right">Starting</span><span className="text-right">Payment</span><span className="text-right">Interest</span><span className="text-right">Principal</span><span className="text-right">Ending</span>
                  </div>
                  {(worksheet.repaymentSchedule || []).map((row) => (
                    <div key={row.Period} className="grid min-w-[900px] grid-cols-7 gap-2 border-t p-3 text-xs text-gray-700">
                      <span>{row.Period}</span>
                      <span>{new Date(row.DueDate).toLocaleDateString()}</span>
                      <span className="text-right">{Number(row.StartingBalance || 0).toLocaleString()}</span>
                      <span className="text-right font-semibold">{Number(row.Payment || 0).toLocaleString()}</span>
                      <span className="text-right">{Number(row.InterestPayment || 0).toLocaleString()}</span>
                      <span className="text-right">{Number(row.PrincipalPayment || 0).toLocaleString()}</span>
                      <span className="text-right">{Number(row.EndingBalance || 0).toLocaleString()}</span>
                    </div>
                  ))}
                  {!(worksheet.repaymentSchedule || []).length && <p className="py-8 text-center text-sm text-gray-400">No repayment schedule available.</p>}
                </div>
              )}

              {activeTab === "decision" && <div className="space-y-4 rounded-lg border bg-white p-4 shadow-sm">

              <div className="bg-gray-50 rounded-lg p-3 text-xs text-gray-600 space-y-1">
                <p className="font-semibold text-gray-700 uppercase tracking-wider text-[11px] mb-1">System recommendation</p>
                <p>Appraisal balance: {money(worksheet.appraisalBaseBalance)} · Max loan: {money(worksheet.maximumLoan)} · Max entitled: {money(worksheet.maximumEntitled)}</p>
                <p>Outstanding balance: {money(worksheet.outstandingLoansBalance)} · Loan + interest: {money(worksheet.loanPlusInterest)} · Payment/period: {money(worksheet.paymentPerPeriod)}</p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                {requiresIncomeAppraisal && <>
                  <FieldGroup label="Latest Verified Income" help="The latest verified income amount associated with this loan product.">
                    <Input type="number" min="0" step="0.01" value={form.LoanProductLatestIncome} onChange={(e) => setForm((p) => ({ ...p, LoanProductLatestIncome: e.target.value }))} />
                  </FieldGroup>
                  <FieldGroup label="Net Income After Adjustments" help="Verified income remaining after the selected allowances and deductions.">
                    <Input type="number" value={adjustedNetIncome} disabled />
                  </FieldGroup>
                  <FieldGroup label="Assessed Repayment Capacity" help="The amount the officer assesses that the customer can repay per period.">
                    <Input type="number" min="0" step="0.01" value={form.AppraisedAbility} onChange={(e) => setForm((p) => ({ ...p, AppraisedAbility: e.target.value }))} />
                  </FieldGroup>
                </>}
                <FieldGroup label="System Recommended Principal" help="The principal amount calculated by the server from the product's appraisal rules.">
                  <Input type="number" value={form.SystemAppraisedAmount} disabled />
                </FieldGroup>
                <FieldGroup label="Officer Recommended Principal" help="The principal amount recommended by the appraising officer. An override requires a reason." required>
                  <Input type="number" min="0" step="0.01" value={form.AppraisedAmount} onChange={(e) => setForm((p) => ({ ...p, AppraisedAmount: e.target.value }))} />
                </FieldGroup>
                <FieldGroup label="Outstanding Loan Balance" help="The customer's current outstanding loan exposure used during assessment.">
                  <Input type="number" min="0" step="0.01" value={form.TotalLoansBalance} onChange={(e) => setForm((p) => ({ ...p, TotalLoansBalance: e.target.value }))} />
                </FieldGroup>
                <FieldGroup label="Proposed Monthly Instalment" help="The proposed monthly repayment amount; the server checks the product's take-home rule." required>
                  <Input type="number" min="0" step="0.01" value={form.MonthlyPaybackAmount} onChange={(e) => setForm((p) => ({ ...p, MonthlyPaybackAmount: e.target.value }))} />
                </FieldGroup>
                <FieldGroup label="Estimated Total Repayment" help="The estimated principal and interest payable over the full loan term." required>
                  <Input type="number" min="0" step="0.01" value={form.TotalPaybackAmount} onChange={(e) => setForm((p) => ({ ...p, TotalPaybackAmount: e.target.value }))} />
                </FieldGroup>
              </div>

              <FieldGroup label="System Appraisal Remarks" help="Generated and saved by the server when the decision is submitted.">
                <Input value={form.SystemAppraisalRemarks} disabled placeholder="Generated by the server when submitted" />
              </FieldGroup>
              <FieldGroup label="Appraised Amount Remarks" help="Required only when the officer's amount differs from the system amount.">
                <Input value={form.AppraisedAmountRemarks} onChange={(e) => setForm((p) => ({ ...p, AppraisedAmountRemarks: e.target.value }))} />
              </FieldGroup>
              <FieldGroup label="Appraisal Remarks" help="Concise reason supporting the appraisal or rejection decision." required>
                <Input value={form.AppraisalRemarks} onChange={(e) => setForm((p) => ({ ...p, AppraisalRemarks: e.target.value }))} required />
              </FieldGroup>

              {workflowItemId && (
                <label className="flex items-center gap-2 text-sm text-gray-700">
                  <input type="checkbox" className="w-4 h-4 accent-indigo-600" checked={usedBiometrics} onChange={(e) => setUsedBiometrics(e.target.checked)} />
                  Verified with biometrics
                </label>
              )}

              {requiresIncomeAppraisal && <div className="border-t pt-4">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-1">
                    <p className="text-xs font-semibold uppercase tracking-wider text-gray-400">Income Adjustments</p>
                    <FieldHelp label="Income Adjustments">Add verified allowances or deductions used to assess net income.</FieldHelp>
                  </div>
                  <Button type="button" size="sm" variant="outline" onClick={() => setPicker(true)} className="flex items-center gap-1">
                    <FaPlus className="text-xs" /> Add
                  </Button>
                </div>
                <div className="space-y-2">
                  {incomeAdjustments.map((row, i) => (
                    <div key={i} className="bg-gray-50 rounded-lg p-2 flex items-center gap-2">
                      <span className="text-sm text-gray-700 flex-1 truncate">
                        <span className={`mr-2 rounded px-1.5 py-0.5 text-[10px] font-semibold ${row.Type === INCOME_ADJUSTMENT_DEDUCTION ? "bg-red-100 text-red-600" : "bg-green-100 text-green-600"}`}>
                          {row.Type === INCOME_ADJUSTMENT_DEDUCTION ? "− Deduction" : "+ Allowance"}
                        </span>
                        {row.label}
                      </span>
                      <Input type="number" placeholder="Amount" className="w-28" value={row.Amount} onChange={(e) => updateIncomeAdjustment(i, { Amount: e.target.value })} />
                      <button type="button" onClick={() => removeIncomeAdjustment(i)} className="text-red-400 hover:text-red-600">
                        <FaTrash className="text-xs" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>}
              </div>}
            </>
          ) : (
            <p className="text-sm text-gray-400 text-center py-8">Not found.</p>
          )}
        </div>

        <div className="shrink-0 px-4 py-3 border-t flex gap-2">
          {!workflowItemId && (
            <Button type="button" variant="outline" onClick={() => navigate("/CommandHub/ApprovalRequests")} className="flex-1">
              Open Assigned Task
            </Button>
          )}
          <Button title={!worksheet?.fileReadyForAppraisal ? worksheet?.fileRegister?.LoanAppraisalReadinessMessage : undefined} disabled={submitting || !worksheet?.fileReadyForAppraisal || !workflowItemId} onClick={() => submit(LoanAppraisalOption.Appraise)} className="flex-1 bg-indigo-600 hover:bg-indigo-700">
            {submitting ? "Working..." : "Appraise"}
          </Button>
          <Button disabled={submitting || !workflowItemId} onClick={() => submit(LoanAppraisalOption.Reject)} variant="outline" className="flex-1 border-red-300 text-red-600 hover:bg-red-50">
            Reject
          </Button>
        </div>
      </motion.div>

      {picker && (
        <EntryPickerModal
          title="Select Income Adjustment"
          fetchUrl={`${FIN_BASE}/api/backoffice/incomeadjustments`}
          getLabel={(i) => i.Description}
          onSelect={addIncomeAdjustment}
          onClose={() => setPicker(false)}
        />
      )}
    </AnimatePresence>
  );
}

export default function AppraisalScreen() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const routedLoanCaseId = searchParams.get("loanCaseId");
  const routedWorkflowItemId = searchParams.get("workflowItemId");
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedId, setSelectedId] = useState(routedLoanCaseId);

  const fetchList = () => {
    setLoading(true);
    listLoanCases({ status: LoanCaseStatus.Registered, pageSize: 100 })
      .then((page) => setItems(page?.pageCollection || page?.PageCollection || []))
      .catch(() => setItems([]))
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchList(); }, []);

  return (
    <div className="bg-white m-8 px-8 py-8 shadow-2xl rounded-lg relative">
      <div className="flex justify-between items-center mb-6 bg-indigo-800 px-6 py-3 rounded-2xl">
        <h2 className="text-xl font-bold text-white flex items-center gap-2">
          <FaClipboardCheck /> Loan Case Appraisal
        </h2>
        <Button type="button" onClick={() => navigate("/CommandHub/ApprovalRequests")} className="bg-indigo-600 hover:bg-indigo-700">
          Open Approval Requests
        </Button>
      </div>

      <div className="bg-gray-200 p-4 rounded-sm">
        <div className="grid grid-cols-12 gap-4 bg-gray-700 text-gray-100 font-semibold p-3 rounded-lg mb-4 text-sm">
          <span className="col-span-2">Case No</span>
          <span className="col-span-4">Customer</span>
          <span className="col-span-2">Amount Applied</span>
          <span className="col-span-2">Product</span>
          <span className="col-span-2">Status</span>
        </div>

        {loading ? (
          <div className="space-y-2 animate-pulse">
            {[1, 2, 3].map((i) => <div key={i} className="h-12 bg-gray-100 rounded-lg" />)}
          </div>
        ) : items.length > 0 ? (
          <div className="space-y-2">
            {items.map((loanCase) => (
              <button
                key={loanCase.Id}
                type="button"
                onClick={() => setSelectedId(loanCase.Id)}
                className="w-full text-left bg-white rounded-lg shadow-lg border hover:shadow-xl transition-all"
              >
                <div className="grid grid-cols-12 gap-2 items-center py-3 px-6 text-sm">
                  <span className="col-span-2 font-medium text-indigo-700">{loanCase.PaddedCaseNumber}</span>
                  <span className="col-span-4 text-gray-700 truncate">{loanCase.CustomerFullName}</span>
                  <span className="col-span-2 font-semibold text-gray-800">{loanCase.AmountApplied?.toLocaleString()}</span>
                  <span className="col-span-2 text-gray-700 truncate">{loanCase.LoanProductDescription}</span>
                  <span className="col-span-2"><LoanCaseStatusBadge status={loanCase.Status} /></span>
                </div>
              </button>
            ))}
          </div>
        ) : (
          <div className="text-center py-6">
            <img src={NotFoundImage} alt="Not Found" className="mx-auto w-42" />
            <p className="text-gray-400 font-medium">No loan cases waiting for appraisal.</p>
          </div>
        )}
      </div>

      <AppraisalDrawer
        loanCaseId={selectedId}
        workflowItemId={selectedId === routedLoanCaseId ? routedWorkflowItemId : null}
        onClose={() => setSelectedId(null)}
        onChanged={fetchList}
      />
    </div>
  );
}
