import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Swal from "sweetalert2";
import { motion, AnimatePresence } from "framer-motion";
import { FaPlus, FaChevronDown, FaTrash, FaMoneyBillWave, FaUser, FaFileInvoiceDollar, FaExchangeAlt, FaChartLine, FaFolderOpen, FaShieldAlt, FaUsers } from "react-icons/fa";
import NotFoundImage from "/assets/scopefinding.png";
import { listLoanCases, createLoanCase, checkInProcess, ensureAppraisalWorkflow, getRegistrationContext, lookupGuarantorEligibility, normalizeList } from "./lib/loanCaseApi";
import { LoanCaseStatus, RecordStatus } from "./lib/loanCaseEnums";
import LoanCaseStatusBadge from "./lib/LoanCaseStatusBadge";
import LoanCaseSummary from "./lib/LoanCaseSummary";
import StandingOrderSummary from "./lib/StandingOrderSummary";
import PayoutSummary from "./lib/PayoutSummary";
import CustomerPickerModal from "./lib/CustomerPickerModal";
import EntryPickerModal from "../../Accounts/BatchProcedures/lib/EntryPickerModal";
import QuickCreateModal from "../lib/QuickCreateModal";
import { createLoanPurpose, createLoaningRemark } from "../lib/loanMastersApi";
import { apiFetch } from "@/lib/api";

const FIN_BASE = `${import.meta.env.VITE_APP_FIN_URL}`;

const localDateInputValue = (date = new Date()) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

function FieldGroup({ label, children }) {
  return (
    <div>
      <Label className="text-sm font-semibold text-gray-700">{label}</Label>
      {children}
    </div>
  );
}

function RegistrationRows({ items = [], empty, render }) {
  return <div className="space-y-2 rounded-lg border bg-white p-3 shadow-sm">{items.length ? items.map((item, index) => <div key={item.Id || index} className="rounded-lg border bg-gray-50 p-3 text-sm text-gray-700 transition-shadow hover:shadow">{render(item)}</div>) : <p className="py-6 text-center text-sm text-gray-400">{empty}</p>}</div>;
}

const REGISTRATION_TABS = [
  { key: "loanDetails", label: "Loan Details", icon: FaFileInvoiceDollar },
  { key: "standingOrders", label: "Standing Orders", icon: FaExchangeAlt },
  { key: "income", label: "Income History", icon: FaChartLine },
  { key: "applications", label: "Loan Applications", icon: FaFolderOpen },
  { key: "collaterals", label: "Collaterals", icon: FaShieldAlt },
  { key: "guarantors", label: "Guarantors", icon: FaUsers },
];

function PickerField({ label, value, placeholder, onClick, disabled }) {
  return (
    <div>
      <Label className="text-sm font-semibold text-gray-700 mb-1 block">{label}</Label>
      <button
        type="button"
        disabled={disabled}
        onClick={onClick}
        className="w-full flex items-center justify-between px-3 py-2 border border-gray-300 rounded-md bg-white text-sm hover:border-indigo-400 transition-colors text-left disabled:opacity-50 disabled:cursor-not-allowed"
      >
        <span className={value ? "text-gray-800 truncate" : "text-gray-400"}>{value || placeholder}</span>
        <FaChevronDown className="text-gray-400 text-xs flex-shrink-0 ml-2" />
      </button>
    </div>
  );
}

function PickerFieldWithCreate({ label, value, placeholder, onClick, onCreateNew }) {
  return (
    <div>
      <Label className="text-sm font-semibold text-gray-700 mb-1 block">{label}</Label>
      <div className="flex gap-2">
        <button
          type="button"
          onClick={onClick}
          className="flex-1 flex items-center justify-between px-3 py-2 border border-gray-300 rounded-md bg-white text-sm hover:border-indigo-400 transition-colors text-left"
        >
          <span className={value ? "text-gray-800 truncate" : "text-gray-400"}>{value || placeholder}</span>
          <FaChevronDown className="text-gray-400 text-xs flex-shrink-0 ml-2" />
        </button>
        <Button type="button" variant="outline" onClick={onCreateNew} title={`New ${label}`} className="shrink-0 gap-1.5">
          <FaPlus className="text-xs" /> New
        </Button>
      </div>
    </div>
  );
}

const emptyForm = {
  CustomerId: "", CustomerLabel: "", CustomerRecordStatus: null, customer: null,
  LoanProductId: "", LoanProductLabel: "", loanProduct: null,
  SavingsProductId: "", SavingsProductLabel: "", savingsProduct: null,
  LoanPurposeId: "", LoanPurposeLabel: "", loanPurpose: null,
  RegistrationRemarkId: "", RegistrationRemarkLabel: "", registrationRemark: null,
  BranchId: "", BranchLabel: "", branch: null,
  AmountApplied: "", ReceivedDate: localDateInputValue(),
};

function GuarantorRow({ row, index, loanProductId, onChange, onRemove }) {
  const [picker, setPicker] = useState(false);
  const [loadingLookup, setLoadingLookup] = useState(false);

  const handlePick = async (customer) => {
    onChange(index, { ...row, GuarantorId: customer.Id, label: customer.FullName, customer, lookup: null });
    setLoadingLookup(true);
    try {
      const lookup = await lookupGuarantorEligibility(customer.Id, loanProductId);
      onChange(index, { ...row, GuarantorId: customer.Id, label: customer.FullName, customer, lookup });
    } catch (err) {
      Swal.fire("Error", err.message, "error");
    } finally {
      setLoadingLookup(false);
    }
  };

  return (
    <div className="bg-white rounded-lg border p-3 space-y-2">
      <div className="flex items-center justify-between">
        <PickerField label={`Guarantor ${index + 1}`} value={row.label} placeholder="Pick a customer..." onClick={() => setPicker(true)} />
        <button type="button" onClick={() => onRemove(index)} className="text-red-400 hover:text-red-600 ml-2 mt-6">
          <FaTrash className="text-xs" />
        </button>
      </div>
      {loadingLookup && <p className="text-xs text-gray-400">Checking eligibility...</p>}
      {row.lookup && (
        <div className="grid grid-cols-2 gap-2 rounded-lg bg-gray-50 p-2 text-xs md:grid-cols-4">
          <div><span className="block text-gray-400">Identification</span><strong className="text-gray-700">{row.lookup.identificationNumber || row.customer?.IdentificationNumber || row.customer?.IndividualIdentificationNumber || "—"}</strong></div>
          <div><span className="block text-gray-400">Appraisal factor</span><strong className="text-gray-700">{row.lookup.appraisalFactor ?? 0}</strong></div>
          <div><span className="block text-gray-400">Total shares</span><strong className="text-gray-700">{Number(row.lookup.totalShares || 0).toLocaleString()}</strong></div>
          <div><span className="block text-gray-400">Committed shares</span><strong className="text-gray-700">{Number(row.lookup.committedShares || 0).toLocaleString()}</strong></div>
          <div><span className="block text-gray-400">Available</span><strong className="text-gray-700">{Number(row.lookup.availableToGuarantee || 0).toLocaleString()}</strong></div>
        </div>
      )}
      <FieldGroup label="Amount Guaranteed">
        <Input type="number" min="0" value={row.AmountGuaranteed} onChange={(e) => onChange(index, { ...row, AmountGuaranteed: e.target.value })} />
      </FieldGroup>
      {picker && (
        <CustomerPickerModal title="Select Guarantor" onSelect={handlePick} onClose={() => setPicker(false)} />
      )}
    </div>
  );
}

export function CreateLoanCaseDrawer({ open, onClose, onSuccess, title = "Register Loan Case" }) {
  const navigate = useNavigate();
  const [form, setForm] = useState(emptyForm);
  const [guarantors, setGuarantors] = useState([]);
  const [collaterals, setCollaterals] = useState([]);
  const [picker, setPicker] = useState(null);
  const [creating, setCreating] = useState(null);
  const [loading, setLoading] = useState(false);
  const [context, setContext] = useState(null);
  const [activeTab, setActiveTab] = useState("loanDetails");
  const [contextLoading, setContextLoading] = useState(false);

  useEffect(() => {
    if (open) {
      setForm(emptyForm);
      setGuarantors([]);
      setCollaterals([]);
      setContext(null);
      setActiveTab("loanDetails");
    }
  }, [open]);

  const needsGuarantors = form.loanProduct && !form.loanProduct.LoanRegistrationMicrocredit && form.loanProduct.LoanRegistrationSecurityRequired;

  useEffect(() => {
    if (!form.CustomerId) return;
    setContext(null);
    setContextLoading(true);
    getRegistrationContext(form.CustomerId, form.LoanProductId || undefined)
      .then(setContext)
      .catch(() => setContext(null))
      .finally(() => setContextLoading(false));
  }, [form.CustomerId, form.LoanProductId]);

  useEffect(() => {
    if (!context) return;
    setForm((current) => ({
      ...current,
      customer: context.customer || current.customer,
      loanProduct: context.loanProduct || current.loanProduct,
      LoanProductLabel: context.loanProduct?.Description || current.LoanProductLabel,
      BranchId: current.BranchId || context.customer?.BranchId || "",
      BranchLabel: current.BranchLabel || context.customer?.BranchDescription || "",
    }));
  }, [context]);

  const handlePickCustomer = async (customer) => {
    setForm((p) => ({ ...p, CustomerId: customer.Id, CustomerLabel: customer.FullName, CustomerRecordStatus: customer.RecordStatus, customer }));
    setGuarantors([]);
    setCollaterals([]);
    setActiveTab("loanDetails");
    if (customer.RecordStatus !== RecordStatus.Approved) {
      Swal.fire("Heads Up", "This customer has not yet been approved — registration will be rejected on submit unless that changes.", "warning");
    }
    try {
      const inProcess = await checkInProcess(customer.Id);
      const list = normalizeList(inProcess) || inProcess;
      if (Array.isArray(list) && list.length > 0) {
        Swal.fire("Heads Up", "This customer already has an in-process loan application. You can still submit, but the server will reject a duplicate for the same product.", "warning");
      }
    } catch {
      // non-blocking — just a courtesy check
    }
  };

  const addGuarantorRow = () => setGuarantors((p) => [...p, { GuarantorId: "", label: "", AmountGuaranteed: "", lookup: null }]);
  const updateGuarantorRow = (index, next) => setGuarantors((p) => p.map((r, i) => (i === index ? next : r)));
  const removeGuarantorRow = (index) => setGuarantors((p) => p.filter((_, i) => i !== index));

  const addCollateral = (doc) => {
    if (collaterals.some((c) => c.Id === doc.Id)) return;
    setCollaterals((p) => [...p, doc]);
  };
  const removeCollateral = (id) => setCollaterals((p) => p.filter((c) => c.Id !== id));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.CustomerId || !form.LoanProductId || !form.SavingsProductId || !form.LoanPurposeId || !form.RegistrationRemarkId || !form.BranchId || !(Number(form.AmountApplied) > 0)) {
      setActiveTab("loanDetails");
      Swal.fire("Missing Fields", "Customer, loan product, savings product, loan purpose, registration remark, branch and a positive amount applied are all required.", "warning");
      return;
    }
    if (form.CustomerRecordStatus !== RecordStatus.Approved) {
      Swal.fire("Customer Not Approved", "The selected customer must be approved before a loan can be registered.", "warning");
      return;
    }
    if (form.loanProduct?.IsLocked) {
      Swal.fire("Loan Product Locked", "The selected loan product cannot accept new applications.", "warning");
      return;
    }
    if (form.savingsProduct?.IsLocked || form.loanPurpose?.IsLocked || form.registrationRemark?.IsLocked || form.branch?.IsLocked) {
      Swal.fire("Locked Selection", "The selected savings product, purpose, remark, or branch is locked. Choose an active option.", "warning");
      return;
    }
    const amountApplied = Number(form.AmountApplied);
    const minimumAmount = Number(form.loanProduct?.LoanRegistrationMinimumAmount || 0);
    const maximumAmount = Number(form.loanProduct?.LoanRegistrationMaximumAmount || 0);
    if (!form.loanProduct?.LoanRegistrationMicrocredit && ((minimumAmount > 0 && amountApplied < minimumAmount) || (maximumAmount > 0 && amountApplied > maximumAmount))) {
      Swal.fire("Amount Outside Product Limits", `Enter an amount between ${minimumAmount.toLocaleString()} and ${maximumAmount.toLocaleString()}.`, "warning");
      return;
    }
    if (form.ReceivedDate > localDateInputValue()) {
      Swal.fire("Invalid Received Date", "Received date cannot be in the future.", "warning");
      return;
    }
    const selectedGuarantors = guarantors.filter((guarantor) => guarantor.GuarantorId);
    const minimumGuarantors = Number(form.loanProduct?.LoanRegistrationMinimumGuarantors || 0);
    const maximumGuarantors = Number(form.loanProduct?.LoanRegistrationMaximumGuarantees || 0);
    if (needsGuarantors && selectedGuarantors.length < minimumGuarantors) {
      setActiveTab("guarantors");
      Swal.fire("Missing Guarantors", `This loan product requires at least ${minimumGuarantors} guarantor(s).`, "warning");
      return;
    }
    if (needsGuarantors && maximumGuarantors > 0 && selectedGuarantors.length > maximumGuarantors) {
      setActiveTab("guarantors");
      Swal.fire("Too Many Guarantors", `This loan product allows at most ${maximumGuarantors} guarantor(s).`, "warning");
      return;
    }
    if (new Set(selectedGuarantors.map((guarantor) => guarantor.GuarantorId)).size !== selectedGuarantors.length) {
      Swal.fire("Duplicate Guarantor", "Each guarantor may be added only once.", "warning");
      return;
    }
    if (selectedGuarantors.some((guarantor) => !(Number(guarantor.AmountGuaranteed) > 0))) {
      setActiveTab("guarantors");
      Swal.fire("Invalid Guarantee", "Every selected guarantor requires a positive amount guaranteed.", "warning");
      return;
    }
    if (selectedGuarantors.some((guarantor) => !guarantor.lookup)) {
      Swal.fire("Guarantor Not Verified", "Wait for every guarantor eligibility check to finish, or select the guarantor again.", "warning");
      return;
    }
    if (selectedGuarantors.some((guarantor) => guarantor.lookup && Number(guarantor.AmountGuaranteed) > Number(guarantor.lookup.availableToGuarantee || 0))) {
      Swal.fire("Guarantee Exceeds Shares", "A guarantor cannot pledge more than their available amount to guarantee.", "warning");
      return;
    }
    const selfGuarantee = selectedGuarantors.find((guarantor) => guarantor.GuarantorId === form.CustomerId);
    if (selfGuarantee && !form.loanProduct?.LoanRegistrationAllowSelfGuarantee) {
      Swal.fire("Self-guarantee Not Allowed", "The selected loan product does not allow the applicant to guarantee their own loan.", "warning");
      return;
    }
    if (selfGuarantee) {
      const maximumSelfGuarantee = amountApplied * Number(form.loanProduct?.LoanRegistrationMaximumSelfGuaranteeEligiblePercentage || 0) / 100;
      if (Number(selfGuarantee.AmountGuaranteed) > maximumSelfGuarantee) {
        Swal.fire("Self-guarantee Limit", `Self-guarantee cannot exceed ${maximumSelfGuarantee.toLocaleString()}.`, "warning");
        return;
      }
    }
    const collateralTotal = collaterals.reduce((sum, collateral) => sum + Number(collateral.CollateralValue || 0), 0);
    const guaranteedTotal = selectedGuarantors.reduce((sum, guarantor) => sum + Number(guarantor.AmountGuaranteed || 0), 0);
    if (needsGuarantors && Number(form.loanProduct?.LoanRegistrationGuarantorSecurityMode) === 1 && guaranteedTotal + collateralTotal < amountApplied) {
      setActiveTab("guarantors");
      Swal.fire("Insufficient Security", "Guaranteed shares and collateral must fully secure the amount applied.", "warning");
      return;
    }
    setLoading(true);
    try {
      await createLoanCase({
        LoanCase: {
          CustomerId: form.CustomerId,
          LoanProductId: form.LoanProductId,
          SavingsProductId: form.SavingsProductId,
          LoanPurposeId: form.LoanPurposeId,
          RegistrationRemarkId: form.RegistrationRemarkId,
          BranchId: form.BranchId,
          AmountApplied: Number(form.AmountApplied),
          ReceivedDate: form.ReceivedDate,
        },
        Guarantors: selectedGuarantors.map((g) => ({ GuarantorId: g.GuarantorId, AmountGuaranteed: Number(g.AmountGuaranteed) })),
        CollateralDocumentIds: collaterals.map((c) => c.Id),
      });
      const nextStep = await Swal.fire({
        title: "Loan Case Registered",
        text: "The appraisal workflow was created. The assigned appraiser must continue from Approval Requests.",
        icon: "success",
        showCancelButton: true,
        confirmButtonText: "Open Approval Requests",
        cancelButtonText: "Stay Here",
        confirmButtonColor: "#4f46e5",
      });
      onSuccess?.();
      onClose();
      if (nextStep.isConfirmed) navigate("/CommandHub/ApprovalRequests");
    } catch (err) {
      Swal.fire("Error", err.message, "error");
    } finally {
      setLoading(false);
    }
  };

  const selectedAccount = context?.accounts?.[0];
  const selectedCustomer = context?.customer || form.customer || {};

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div className="fixed inset-0 bg-black z-40" initial={{ opacity: 0 }} animate={{ opacity: 0.4 }} exit={{ opacity: 0 }} onClick={onClose} />
          <motion.div className="fixed top-0 right-0 h-full w-[92vw] max-w-[960px] overflow-hidden rounded-l-2xl bg-white shadow-2xl z-50 flex flex-col" initial={{ x: "100%" }} animate={{ x: 0 }} exit={{ x: "100%" }} transition={{ type: "spring", stiffness: 300, damping: 30 }}>
            <div className="m-2 flex justify-between items-center bg-indigo-600 rounded-2xl px-4 py-3">
              <h2 className="flex items-center gap-2 font-bold text-white"><FaFileInvoiceDollar /> {title}</h2>
              <Button variant="outline" size="sm" onClick={onClose}>Close</Button>
            </div>

            <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto bg-gray-50 px-4 py-4 space-y-4">
              <PickerField label="Loanee" value={form.CustomerLabel} placeholder="Search & select customer..." onClick={() => setPicker("customer")} />
              {form.CustomerId && (
                <div className="grid grid-cols-2 gap-3 rounded-lg border border-indigo-100 bg-white p-4 text-sm shadow-sm md:grid-cols-4">
                  <div className="col-span-2 flex items-center gap-2 text-indigo-700 md:col-span-4"><FaUser /><strong>{form.CustomerLabel}</strong></div>
                  <div><span className="block text-xs text-gray-400">Employer</span><strong>{selectedCustomer.EmployerDescription || selectedCustomer.CustomerEmployerDescription || "—"}</strong></div>
                  <div><span className="block text-xs text-gray-400">Station</span><strong>{selectedCustomer.StationDescription || selectedCustomer.CustomerStationDescription || "—"}</strong></div>
                  <div><span className="block text-xs text-gray-400">Account number</span><strong>{selectedAccount?.FullAccountNumber || "—"}</strong></div>
                  <div><span className="block text-xs text-gray-400">Membership number</span><strong>{selectedCustomer.PaddedSerialNumber || selectedCustomer.SerialNumber || "—"}</strong></div>
                  <div><span className="block text-xs text-gray-400">Identification</span><strong>{selectedCustomer.IdentificationNumber || selectedCustomer.IndividualIdentificationNumber || "—"}</strong></div>
                  <div><span className="block text-xs text-gray-400">Personal file number</span><strong>{selectedCustomer.PersonalFileNumber || selectedCustomer.Reference2 || "—"}</strong></div>
                </div>
              )}
              {form.CustomerId && (
                <div className="flex gap-1 overflow-x-auto border-b border-gray-200">
                  {REGISTRATION_TABS.map(({ key, label, icon: Icon }) => (
                    <button key={key} type="button" onClick={() => setActiveTab(key)} className={`flex items-center gap-2 whitespace-nowrap rounded-t-lg px-4 py-2 text-sm font-semibold transition-all ${activeTab === key ? "bg-indigo-600 text-white shadow" : "text-gray-500 hover:bg-indigo-50 hover:text-indigo-700"}`}>
                      <Icon className="text-xs" /> {label}
                    </button>
                  ))}
                </div>
              )}

              {form.CustomerId && activeTab === "loanDetails" && <div className="space-y-4 rounded-lg border bg-white p-4 shadow-sm">
                <PickerField label="Loan Product" value={form.LoanProductLabel} placeholder="Select loan product..." onClick={() => setPicker("loanProduct")} />
                <PickerField label="Savings Product" value={form.SavingsProductLabel} placeholder="Select savings product..." onClick={() => setPicker("savingsProduct")} />
                <PickerFieldWithCreate label="Loan Purpose" value={form.LoanPurposeLabel} placeholder="Select loan purpose..." onClick={() => setPicker("loanPurpose")} onCreateNew={() => setCreating("loanPurpose")} />
                <PickerFieldWithCreate label="Loan Remark" value={form.RegistrationRemarkLabel} placeholder="Select loan remark..." onClick={() => setPicker("registrationRemark")} onCreateNew={() => setCreating("registrationRemark")} />
                <PickerField label="Branch" value={form.BranchLabel} placeholder="Select branch..." onClick={() => setPicker("branch")} />
                <div className="grid grid-cols-2 gap-3">
                  <FieldGroup label="Amount Applied"><Input type="number" min={form.loanProduct?.LoanRegistrationMicrocredit ? 0 : form.loanProduct?.LoanRegistrationMinimumAmount || 0} max={form.loanProduct?.LoanRegistrationMicrocredit ? undefined : form.loanProduct?.LoanRegistrationMaximumAmount || undefined} value={form.AmountApplied} onChange={(e) => setForm((p) => ({ ...p, AmountApplied: e.target.value }))} required /></FieldGroup>
                  <FieldGroup label="Received Date"><Input type="date" max={localDateInputValue()} value={form.ReceivedDate} onChange={(e) => setForm((p) => ({ ...p, ReceivedDate: e.target.value }))} required /></FieldGroup>
                </div>
                {form.loanProduct && <div className="grid grid-cols-2 gap-3 rounded-lg border border-indigo-100 bg-indigo-50/40 p-4 text-sm md:grid-cols-3">
                  <div><span className="block text-xs text-gray-400">Section</span><strong>{form.loanProduct.LoanRegistrationLoanProductSectionDescription || form.loanProduct.ProductSectionDescription || "—"}</strong></div>
                  <div><span className="block text-xs text-gray-400">Term</span><strong>{form.loanProduct.LoanRegistrationTermInMonths || 0} months</strong></div>
                  <div><span className="block text-xs text-gray-400">Annual interest</span><strong>{form.loanProduct.LoanInterestAnnualPercentageRate || 0}%</strong></div>
                  <div><span className="block text-xs text-gray-400">Interest calculation</span><strong>{form.loanProduct.LoanInterestCalculationModeDescription || "—"}</strong></div>
                  <div><span className="block text-xs text-gray-400">Payment frequency</span><strong>{form.loanProduct.LoanRegistrationPaymentFrequencyPerYearDescription || form.loanProduct.LoanRegistrationPaymentFrequencyPerYear || "—"}</strong></div>
                  <div><span className="block text-xs text-gray-400">Payment due</span><strong>{form.loanProduct.LoanRegistrationPaymentDueDateDescription || "—"}</strong></div>
                  <div><span className="block text-xs text-gray-400">Amount range</span><strong>{Number(form.loanProduct.LoanRegistrationMinimumAmount || 0).toLocaleString()} – {Number(form.loanProduct.LoanRegistrationMaximumAmount || 0).toLocaleString()}</strong></div>
                  <div><span className="block text-xs text-gray-400">Same-product balance</span><strong>{Number(context?.selectedProductLoanBalance || 0).toLocaleString()}</strong></div>
                  <div><span className="block text-xs text-gray-400">Investment balance</span><strong>{Number(context?.investmentBalance || 0).toLocaleString()}</strong></div>
                  <div><span className="block text-xs text-gray-400">Appraisal balance</span><strong>{Number(context?.appraisalBaseBalance || 0).toLocaleString()}</strong></div>
                  <div><span className="block text-xs text-gray-400">Maximum loan</span><strong>{Number(context?.maximumLoan || 0).toLocaleString()}</strong></div>
                  <div><span className="block text-xs text-gray-400">Maximum entitled</span><strong className="text-indigo-700">{Number(context?.maximumEntitled || 0).toLocaleString()}</strong></div>
                </div>}
              </div>}

              {form.CustomerId && contextLoading && activeTab !== "loanDetails" && <div className="space-y-2 animate-pulse">{[1, 2, 3].map((i) => <div key={i} className="h-12 rounded-lg bg-gray-100" />)}</div>}
              {form.CustomerId && !contextLoading && activeTab === "standingOrders" && <RegistrationRows items={context?.standingOrders} empty="No standing orders found." render={(item) => <StandingOrderSummary item={item} accounts={context?.accounts} />} />}
              {form.CustomerId && !contextLoading && activeTab === "income" && <RegistrationRows items={context?.payouts} empty="No income history found." render={(item) => <PayoutSummary item={item} accounts={context?.accounts} />} />}
              {form.CustomerId && !contextLoading && activeTab === "applications" && <RegistrationRows items={context?.applications} empty="No loan applications in process." render={(item) => `${item.PaddedCaseNumber || "Loan case"} · ${item.LoanProductDescription || ""} · ${Number(item.AmountApplied || 0).toLocaleString()}`} />}

              {form.CustomerId && activeTab === "guarantors" && (
                <div className="rounded-lg border bg-white p-4 shadow-sm">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-xs font-semibold uppercase tracking-wider text-gray-400">
                      Guarantors {form.loanProduct && needsGuarantors ? "(required)" : ""}
                    </p>
                    <Button type="button" size="sm" variant="outline" onClick={addGuarantorRow} disabled={!form.LoanProductId} className="flex items-center gap-1">
                      <FaPlus className="text-xs" /> Add
                    </Button>
                  </div>
                  <div className="space-y-2">
                    {guarantors.map((row, i) => (
                      <GuarantorRow key={i} row={row} index={i} loanProductId={form.LoanProductId} onChange={updateGuarantorRow} onRemove={removeGuarantorRow} />
                    ))}
                  </div>
                </div>
              )}

              {form.CustomerId && activeTab === "collaterals" && (
                <div className="rounded-lg border bg-white p-4 shadow-sm">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-xs font-semibold uppercase tracking-wider text-gray-400">Customer Collateral</p>
                    <Button type="button" size="sm" variant="outline" onClick={() => setPicker("collateral")} className="flex items-center gap-1">
                      <FaPlus className="text-xs" /> Select
                    </Button>
                  </div>
                  <div className="space-y-1.5">
                    {collaterals.map((c) => (
                      <div key={c.Id} className="flex items-center justify-between bg-gray-50 rounded-lg px-3 py-2 text-sm">
                        <span className="text-gray-700 truncate">{c.FileTitle}</span>
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-gray-800">{c.CollateralValue?.toLocaleString()}</span>
                          <button type="button" onClick={() => removeCollateral(c.Id)} className="text-red-400 hover:text-red-600">
                            <FaTrash className="text-xs" />
                          </button>
                        </div>
                      </div>
                    ))}
                    {!collaterals.length && <p className="py-6 text-center text-sm text-gray-400">No collateral selected.</p>}
                  </div>
                </div>
              )}
            </form>

            <div className="shrink-0 px-4 py-3 border-t">
              <Button onClick={handleSubmit} disabled={loading} className="w-full bg-indigo-600 hover:bg-indigo-700">
                {loading ? "Registering..." : "Register Loan Case"}
              </Button>
            </div>
          </motion.div>
        </>
      )}

      {picker === "customer" && (
        <CustomerPickerModal title="Select Loanee" onSelect={handlePickCustomer} onClose={() => setPicker(null)} />
      )}
      {picker === "loanProduct" && (
        <EntryPickerModal
          title="Select Loan Product"
          fetchUrl={`${FIN_BASE}/api/accounts/loanproducts`}
          getLabel={(i) => i.Description}
          onSelect={(i) => {
            if (i.IsLocked) return Swal.fire("Loan Product Locked", "Choose an active loan product.", "warning");
            setForm((p) => ({ ...p, LoanProductId: i.Id, LoanProductLabel: i.Description, loanProduct: i }));
            setGuarantors([]);
          }}
          onClose={() => setPicker(null)}
        />
      )}
      {picker === "savingsProduct" && (
        <EntryPickerModal
          title="Select Savings Product"
          fetchUrl={`${FIN_BASE}/api/accounts/savingsproducts`}
          getLabel={(i) => i.Description}
          onSelect={(i) => i.IsLocked ? Swal.fire("Savings Product Locked", "Choose an active savings product.", "warning") : setForm((p) => ({ ...p, SavingsProductId: i.Id, SavingsProductLabel: i.Description, savingsProduct: i }))}
          onClose={() => setPicker(null)}
        />
      )}
      {picker === "loanPurpose" && (
        <EntryPickerModal
          title="Select Loan Purpose"
          fetchUrl={`${FIN_BASE}/api/backoffice/loanpurposes`}
          getLabel={(i) => i.Description}
          onSelect={(i) => i.IsLocked ? Swal.fire("Loan Purpose Locked", "Choose an active loan purpose.", "warning") : setForm((p) => ({ ...p, LoanPurposeId: i.Id, LoanPurposeLabel: i.Description, loanPurpose: i }))}
          onClose={() => setPicker(null)}
        />
      )}
      {picker === "registrationRemark" && (
        <EntryPickerModal
          title="Select Loan Remark"
          fetchUrl={`${FIN_BASE}/api/backoffice/loaningremarks`}
          getLabel={(i) => i.Description}
          onSelect={(i) => i.IsLocked ? Swal.fire("Loan Remark Locked", "Choose an active registration remark.", "warning") : setForm((p) => ({ ...p, RegistrationRemarkId: i.Id, RegistrationRemarkLabel: i.Description, registrationRemark: i }))}
          onClose={() => setPicker(null)}
        />
      )}
      {picker === "branch" && (
        <EntryPickerModal
          title="Select Branch"
          fetchUrl={`${FIN_BASE}/api/administration/branches/all`}
          getLabel={(i) => i.Description}
          onSelect={(i) => i.IsLocked ? Swal.fire("Branch Locked", "Choose an active branch.", "warning") : setForm((p) => ({ ...p, BranchId: i.Id, BranchLabel: i.Description, branch: i }))}
          onClose={() => setPicker(null)}
        />
      )}
      {picker === "collateral" && (
        <EntryPickerModal
          title="Select Collateral Document"
          fetchUrl={`${FIN_BASE}/api/registry/customerdocuments?customerId=${form.CustomerId}&type=1`}
          getLabel={(i) => i.FileTitle}
          getSublabel={(i) => i.CollateralValue?.toLocaleString()}
          onSelect={addCollateral}
          onClose={() => setPicker(null)}
        />
      )}

      {creating === "loanPurpose" && (
        <QuickCreateModal
          title="New Loan Purpose"
          onCreate={createLoanPurpose}
          onCreated={(created) => setForm((p) => ({ ...p, LoanPurposeId: created.Id, LoanPurposeLabel: created.Description, loanPurpose: created }))}
          onClose={() => setCreating(null)}
        />
      )}
      {creating === "registrationRemark" && (
        <QuickCreateModal
          title="New Loan Remark"
          onCreate={createLoaningRemark}
          onCreated={(created) => setForm((p) => ({ ...p, RegistrationRemarkId: created.Id, RegistrationRemarkLabel: created.Description, registrationRemark: created }))}
          onClose={() => setCreating(null)}
        />
      )}
    </AnimatePresence>
  );
}

function LoanCaseDetailDrawer({ loanCaseId, onClose, onPrepareAppraisal }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchDetail = () => {
    if (!loanCaseId) return;
    setLoading(true);
    apiFetch(`${FIN_BASE}/api/backoffice/loancases/${loanCaseId}`)
      .then((r) => r.json())
      .then((body) => setData(body?.data ?? body))
      .catch(() => setData(null))
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchDetail(); }, [loanCaseId]);

  if (!loanCaseId) return null;

  return (
    <AnimatePresence>
      <motion.div className="fixed inset-0 bg-black z-40" initial={{ opacity: 0 }} animate={{ opacity: 0.4 }} exit={{ opacity: 0 }} onClick={onClose} />
      <motion.div className="fixed top-0 right-0 h-full w-[520px] bg-white shadow-2xl z-50 flex flex-col" initial={{ x: "100%" }} animate={{ x: 0 }} exit={{ x: "100%" }} transition={{ type: "spring", stiffness: 300, damping: 30 }}>
        <div className="m-2 flex justify-between items-center bg-indigo-600 rounded-2xl px-4 py-3">
          <h2 className="font-bold text-white">Loan Case Detail</h2>
          <div className="flex gap-2"><Button type="button" size="sm" onClick={() => onPrepareAppraisal(loanCaseId)} className="bg-white text-indigo-700 hover:bg-indigo-50">Prepare Appraisal</Button><Button variant="outline" size="sm" onClick={onClose}>Close</Button></div>
        </div>
        <div className="flex-1 overflow-y-auto px-4 py-4">
          {loading ? (
            <div className="space-y-2 animate-pulse">{[1, 2, 3].map((i) => <div key={i} className="h-10 bg-gray-100 rounded-lg" />)}</div>
          ) : data ? (
            <LoanCaseSummary loanCase={data.loanCase} guarantors={data.guarantors} collaterals={data.collaterals} editableCollaterals onCollateralsSaved={fetchDetail} />
          ) : (
            <p className="text-sm text-gray-400 text-center py-8">Not found.</p>
          )}
        </div>
      </motion.div>
    </AnimatePresence>
  );
}

export default function RegistrationScreen() {
  const navigate = useNavigate();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [createOpen, setCreateOpen] = useState(false);
  const [selectedId, setSelectedId] = useState(null);

  const prepareAppraisal = async (loanCaseId) => {
    try {
      await ensureAppraisalWorkflow(loanCaseId);
      await Swal.fire("Appraisal Ready", "The assigned appraiser can now continue from Approval Requests.", "success");
      setSelectedId(null);
      navigate("/CommandHub/ApprovalRequests");
    } catch (error) {
      Swal.fire("Cannot Prepare Appraisal", error.message, "error");
    }
  };

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
          <FaMoneyBillWave /> Loan Case Registration
        </h2>
        <Button onClick={() => setCreateOpen(true)} className="bg-indigo-600 hover:bg-indigo-700 flex items-center gap-2">
          <FaPlus /> New Loan Case
        </Button>
      </div>

      <div className="mb-4 flex items-center justify-between rounded-lg border border-indigo-100 bg-indigo-50 px-4 py-3 text-sm text-indigo-800">
        <span>Registered cases advance through their assigned appraisal workflow.</span>
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
            <p className="text-gray-400 font-medium">No loan cases in the Registered queue.</p>
          </div>
        )}
      </div>

      <CreateLoanCaseDrawer open={createOpen} onClose={() => setCreateOpen(false)} onSuccess={fetchList} />
      <LoanCaseDetailDrawer loanCaseId={selectedId} onClose={() => setSelectedId(null)} onPrepareAppraisal={prepareAppraisal} />
    </div>
  );
}
