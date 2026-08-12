import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Swal from "sweetalert2";
import { motion, AnimatePresence } from "framer-motion";
import { FaPlus, FaChevronDown, FaTrash, FaClipboardCheck } from "react-icons/fa";
import NotFoundImage from "/assets/scopefinding.png";
import { listLoanCases, getAppraisalWorksheet, appraiseLoanCase } from "./lib/loanCaseApi";
import { LoanCaseStatus, LoanAppraisalOption } from "./lib/loanCaseEnums";
import LoanCaseStatusBadge from "./lib/LoanCaseStatusBadge";
import LoanCaseSummary from "./lib/LoanCaseSummary";
import EntryPickerModal from "../../Accounts/BatchProcedures/lib/EntryPickerModal";

const FIN_BASE = `${import.meta.env.VITE_APP_FIN_URL}`;
const MODULE_NAVIGATION_ITEM_CODE = 70008; // Appraisal (ControllerName: AppraiseLoan)

function FieldGroup({ label, children }) {
  return (
    <div>
      <Label className="text-sm font-semibold text-gray-700">{label}</Label>
      {children}
    </div>
  );
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

function AppraisalDrawer({ loanCaseId, onClose, onChanged }) {
  const [worksheet, setWorksheet] = useState(null);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState(emptyDecisionForm);
  const [incomeAdjustments, setIncomeAdjustments] = useState([]);
  const [picker, setPicker] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!loanCaseId) return;
    setLoading(true);
    getAppraisalWorksheet(loanCaseId)
      .then((data) => {
        setWorksheet(data);
        setForm({
          LoanProductLatestIncome: "",
          AppraisedNetIncome: "",
          AppraisedAbility: "",
          SystemAppraisedAmount: data.maximumEntitled ?? "",
          SystemAppraisalRemarks: "",
          AppraisedAmount: data.loanCase?.AmountApplied ?? "",
          AppraisedAmountRemarks: "",
          AppraisalRemarks: "",
          MonthlyPaybackAmount: data.paymentPerPeriod ?? "",
          TotalPaybackAmount: data.loanPlusInterest ?? "",
          TotalLoansBalance: data.outstandingLoansBalance ?? "",
        });
        setIncomeAdjustments([]);
      })
      .catch((err) => Swal.fire("Error", err.message, "error"))
      .finally(() => setLoading(false));
  }, [loanCaseId]);

  if (!loanCaseId) return null;

  const addIncomeAdjustment = (item) => {
    if (incomeAdjustments.some((r) => r.IncomeAdjustmentId === item.Id)) return;
    setIncomeAdjustments((p) => [...p, { IncomeAdjustmentId: item.Id, label: item.Description, CustomerAccountId: "", Amount: "", IsEnabled: true }]);
  };
  const updateIncomeAdjustment = (index, patch) => setIncomeAdjustments((p) => p.map((r, i) => (i === index ? { ...r, ...patch } : r)));
  const removeIncomeAdjustment = (index) => setIncomeAdjustments((p) => p.filter((_, i) => i !== index));

  const submit = async (option) => {
    if (!form.AppraisalRemarks) {
      Swal.fire("Missing Fields", "Appraisal remarks are required.", "warning");
      return;
    }
    setSubmitting(true);
    try {
      const result = await appraiseLoanCase(loanCaseId, {
        Option: option,
        ModuleNavigationItemCode: MODULE_NAVIGATION_ITEM_CODE,
        LoanProductLatestIncome: Number(form.LoanProductLatestIncome) || 0,
        AppraisedNetIncome: Number(form.AppraisedNetIncome) || 0,
        AppraisedAbility: Number(form.AppraisedAbility) || 0,
        SystemAppraisedAmount: Number(form.SystemAppraisedAmount) || 0,
        SystemAppraisalRemarks: form.SystemAppraisalRemarks,
        AppraisedAmount: Number(form.AppraisedAmount) || 0,
        AppraisedAmountRemarks: form.AppraisedAmountRemarks,
        AppraisalRemarks: form.AppraisalRemarks,
        MonthlyPaybackAmount: Number(form.MonthlyPaybackAmount) || 0,
        TotalPaybackAmount: Number(form.TotalPaybackAmount) || 0,
        TotalLoansBalance: Number(form.TotalLoansBalance) || 0,
        IncomeAdjustments: option === LoanAppraisalOption.Appraise
          ? incomeAdjustments.map((r) => ({ IncomeAdjustmentId: r.IncomeAdjustmentId, CustomerAccountId: r.CustomerAccountId || null, Amount: Number(r.Amount) || 0, IsEnabled: r.IsEnabled }))
          : [],
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
      <motion.div className="fixed top-0 right-0 h-full w-[600px] bg-white shadow-2xl z-50 flex flex-col" initial={{ x: "100%" }} animate={{ x: 0 }} exit={{ x: "100%" }} transition={{ type: "spring", stiffness: 300, damping: 30 }}>
        <div className="m-2 flex justify-between items-center bg-indigo-600 rounded-2xl px-4 py-3">
          <h2 className="font-bold text-white">Appraise Loan Case</h2>
          <Button variant="outline" size="sm" onClick={onClose}>Close</Button>
        </div>

        <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
          {loading ? (
            <div className="space-y-2 animate-pulse">{[1, 2, 3].map((i) => <div key={i} className="h-10 bg-gray-100 rounded-lg" />)}</div>
          ) : worksheet ? (
            <>
              <LoanCaseSummary loanCase={worksheet.loanCase} guarantors={worksheet.guarantors} collaterals={worksheet.collaterals} />

              <div className="bg-gray-50 rounded-lg p-3 text-xs text-gray-600 space-y-1">
                <p className="font-semibold text-gray-700 uppercase tracking-wider text-[11px] mb-1">System-computed (starting point — every field below is still editable)</p>
                <p>Total shares: {worksheet.totalShares?.toLocaleString()} · Max loan: {worksheet.maximumLoan?.toLocaleString()} · Max entitled: {worksheet.maximumEntitled?.toLocaleString()}</p>
                <p>Outstanding balance: {worksheet.outstandingLoansBalance?.toLocaleString()} · Loan+interest estimate: {worksheet.loanPlusInterest?.toLocaleString()} · Payment/period: {worksheet.paymentPerPeriod?.toLocaleString()}</p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <FieldGroup label="Loan Product Latest Income">
                  <Input type="number" value={form.LoanProductLatestIncome} onChange={(e) => setForm((p) => ({ ...p, LoanProductLatestIncome: e.target.value }))} />
                </FieldGroup>
                <FieldGroup label="Appraised Net Income">
                  <Input type="number" value={form.AppraisedNetIncome} onChange={(e) => setForm((p) => ({ ...p, AppraisedNetIncome: e.target.value }))} />
                </FieldGroup>
                <FieldGroup label="Appraised Ability">
                  <Input type="number" value={form.AppraisedAbility} onChange={(e) => setForm((p) => ({ ...p, AppraisedAbility: e.target.value }))} />
                </FieldGroup>
                <FieldGroup label="System Appraised Amount">
                  <Input type="number" value={form.SystemAppraisedAmount} onChange={(e) => setForm((p) => ({ ...p, SystemAppraisedAmount: e.target.value }))} />
                </FieldGroup>
                <FieldGroup label="Appraised Amount">
                  <Input type="number" value={form.AppraisedAmount} onChange={(e) => setForm((p) => ({ ...p, AppraisedAmount: e.target.value }))} />
                </FieldGroup>
                <FieldGroup label="Total Loans Balance">
                  <Input type="number" value={form.TotalLoansBalance} onChange={(e) => setForm((p) => ({ ...p, TotalLoansBalance: e.target.value }))} />
                </FieldGroup>
                <FieldGroup label="Monthly Payback Amount">
                  <Input type="number" value={form.MonthlyPaybackAmount} onChange={(e) => setForm((p) => ({ ...p, MonthlyPaybackAmount: e.target.value }))} />
                </FieldGroup>
                <FieldGroup label="Total Payback Amount">
                  <Input type="number" value={form.TotalPaybackAmount} onChange={(e) => setForm((p) => ({ ...p, TotalPaybackAmount: e.target.value }))} />
                </FieldGroup>
              </div>

              <FieldGroup label="System Appraisal Remarks">
                <Input value={form.SystemAppraisalRemarks} onChange={(e) => setForm((p) => ({ ...p, SystemAppraisalRemarks: e.target.value }))} />
              </FieldGroup>
              <FieldGroup label="Appraised Amount Remarks">
                <Input value={form.AppraisedAmountRemarks} onChange={(e) => setForm((p) => ({ ...p, AppraisedAmountRemarks: e.target.value }))} />
              </FieldGroup>
              <FieldGroup label="Appraisal Remarks">
                <Input value={form.AppraisalRemarks} onChange={(e) => setForm((p) => ({ ...p, AppraisalRemarks: e.target.value }))} required />
              </FieldGroup>

              <div className="border-t pt-4">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-xs font-semibold uppercase tracking-wider text-gray-400">Income Adjustments</p>
                  <Button type="button" size="sm" variant="outline" onClick={() => setPicker(true)} className="flex items-center gap-1">
                    <FaPlus className="text-xs" /> Add
                  </Button>
                </div>
                <div className="space-y-2">
                  {incomeAdjustments.map((row, i) => (
                    <div key={i} className="bg-gray-50 rounded-lg p-2 flex items-center gap-2">
                      <span className="text-sm text-gray-700 flex-1 truncate">{row.label}</span>
                      <Input type="number" placeholder="Amount" className="w-28" value={row.Amount} onChange={(e) => updateIncomeAdjustment(i, { Amount: e.target.value })} />
                      <button type="button" onClick={() => removeIncomeAdjustment(i)} className="text-red-400 hover:text-red-600">
                        <FaTrash className="text-xs" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </>
          ) : (
            <p className="text-sm text-gray-400 text-center py-8">Not found.</p>
          )}
        </div>

        <div className="shrink-0 px-4 py-3 border-t flex gap-2">
          <Button disabled={submitting} onClick={() => submit(LoanAppraisalOption.Appraise)} className="flex-1 bg-indigo-600 hover:bg-indigo-700">
            {submitting ? "Working..." : "Appraise"}
          </Button>
          <Button disabled={submitting} onClick={() => submit(LoanAppraisalOption.Reject)} variant="outline" className="flex-1 border-red-300 text-red-600 hover:bg-red-50">
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
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedId, setSelectedId] = useState(null);

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

      <AppraisalDrawer loanCaseId={selectedId} onClose={() => setSelectedId(null)} onChanged={fetchList} />
    </div>
  );
}
