import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import Swal from "sweetalert2";
import { apiFetch } from "@/lib/api";
import CustomerLookupModal from "@/pages/Registry/Customers/Documents/CustomerLookupModal";
import FieldHelp from "@/pages/Accounts/SavingsProducts/FieldHelp";
import {
  StandingOrderTrigger,
  ScheduleFrequency,
  ChargeType,
  RoundingType,
  createStandingOrder,
  updateStandingOrder,
  getStandingOrder,
} from "./api";

const FIN_BASE = `${import.meta.env.VITE_APP_FIN_URL}`;

const TRIGGER_OPTIONS = [
  { value: StandingOrderTrigger.Payout, label: "Payout" },
  { value: StandingOrderTrigger.CheckOff, label: "Check-Off" },
  { value: StandingOrderTrigger.Schedule, label: "Schedule" },
  { value: StandingOrderTrigger.Sweep, label: "Sweep" },
  { value: StandingOrderTrigger.Microloan, label: "Microloan" },
];

const FREQUENCY_OPTIONS = [
  { value: ScheduleFrequency.Annual, label: "Annual" },
  { value: ScheduleFrequency.SemiAnnual, label: "Semi-Annual" },
  { value: ScheduleFrequency.Quarterly, label: "Quarterly" },
  { value: ScheduleFrequency.TriAnnual, label: "Tri-Annual" },
  { value: ScheduleFrequency.BiMonthly, label: "Bi-Monthly" },
  { value: ScheduleFrequency.Monthly, label: "Monthly" },
  { value: ScheduleFrequency.SemiMonthly, label: "Semi-Monthly" },
  { value: ScheduleFrequency.BiWeekly, label: "Bi-Weekly" },
  { value: ScheduleFrequency.Weekly, label: "Weekly" },
  { value: ScheduleFrequency.Daily, label: "Daily" },
];

const CHARGE_TYPE_OPTIONS = [
  { value: ChargeType.Percentage, label: "Percentage" },
  { value: ChargeType.FixedAmount, label: "Fixed Amount" },
];

const ROUNDING_TYPE_OPTIONS = [
  { value: RoundingType.NoRounding, label: "No Rounding" },
  { value: RoundingType.ToEven, label: "To Even" },
  { value: RoundingType.AwayFromZero, label: "Away From Zero" },
  { value: RoundingType.Ceiling, label: "Ceiling" },
  { value: RoundingType.Floor, label: "Floor" },
];

const roundLoanPayment = (value, roundingType) => {
  if (!Number.isFinite(value)) return 0;

  switch (Number(roundingType)) {
    case RoundingType.ToEven: {
      const lower = Math.floor(value);
      const fraction = value - lower;
      if (Math.abs(fraction - 0.5) < Number.EPSILON) return lower % 2 === 0 ? lower : lower + 1;
      return Math.round(value);
    }
    case RoundingType.AwayFromZero:
      return Math.sign(value) * Math.floor(Math.abs(value) + 0.5);
    case RoundingType.Ceiling:
      return Math.ceil(value);
    case RoundingType.Floor:
      return Math.floor(value);
    default:
      return value;
  }
};

const TABS = [
  { id: "parties", label: "Parties" },
  { id: "schedule", label: "Schedule & Charges" },
  { id: "loanTerms", label: "Loan Terms" },
];

const emptyForm = {
  benefactorCustomerAccountId: "",
  beneficiaryCustomerAccountId: "",
  trigger: StandingOrderTrigger.Schedule,
  scheduleFrequency: ScheduleFrequency.Monthly,
  durationStartDate: "",
  durationEndDate: "",
  scheduleForceExecute: false,
  chargeType: ChargeType.FixedAmount,
  chargePercentage: 0,
  chargeFixedAmount: 0,
  chargeable: true,
  remarks: "",
  isLocked: false,
  loanAmount: 0,
  paymentPerPeriod: 0,
  principal: 0,
  interest: 0,
  capitalizedInterest: 0,
  beneficiaryProductRoundingType: RoundingType.NoRounding,
};

function FieldGroup({ label, help, error, children }) {
  return (
    <div>
      <div className="mb-1 flex items-center gap-1">
        <Label className="text-sm font-semibold text-gray-700">{label}</Label>
        <FieldHelp label={label}>{help}</FieldHelp>
      </div>
      {children}
      {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
    </div>
  );
}

function EnumSelect({ value, options, onChange }) {
  return (
    <Select value={String(value)} onValueChange={(v) => onChange(Number(v))}>
      <SelectTrigger><SelectValue /></SelectTrigger>
      <SelectContent>
        {options.map((o) => (
          <SelectItem key={o.value} value={String(o.value)}>{o.label}</SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

// Same two-step customer -> account picker used in FOSA/Transactions
// (CashDeposit.jsx etc.): pick a customer first, then one of their accounts,
// rather than a single flat dropdown over every account in the system.
function PartyPicker({ label, help, customer, onChooseCustomer, accounts, loadingAccounts, accountId, onAccountChange, error }) {
  return (
    <div className="space-y-3 rounded-lg border p-4">
      <div className="flex items-center gap-1"><p className="text-sm font-semibold text-gray-700">{label}</p><FieldHelp label={label}>{help}</FieldHelp></div>
      <FieldGroup label="Customer" help="Searches the complete customer registry on the server; selecting a customer loads only that customer's accounts.">
        <Button type="button" variant="outline" className="w-full justify-start font-normal" onClick={onChooseCustomer}>
          {customer?.name || "Search and select customer"}
        </Button>
      </FieldGroup>
      <FieldGroup label="Account" error={error} help="The specific customer account used on this side of the standing order.">
        <Select value={accountId ? String(accountId) : ""} onValueChange={onAccountChange} disabled={!customer?.id || loadingAccounts}>
          <SelectTrigger>
            <SelectValue placeholder={loadingAccounts ? "Loading..." : !customer?.id ? "Select a customer first" : "Select account"} />
          </SelectTrigger>
          <SelectContent className="max-h-60 overflow-y-auto">
            {accounts.map((a) => (
              <SelectItem key={String(a.Id)} value={String(a.Id)}>
                {a.CustomerAccountTypeTargetProductDescription || a.FullAccountNumber || a.Id}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </FieldGroup>
    </div>
  );
}

export default function StandingOrderDrawer({ open, onClose, onSuccess, standingOrder }) {
  const isEdit = Boolean(standingOrder);
  const [activeTab, setActiveTab] = useState("parties");
  const [form, setForm] = useState(emptyForm);
  const [loading, setLoading] = useState(false);
  const [loadingData, setLoadingData] = useState(false);
  const [errors, setErrors] = useState({});
  const [customerPickerSide, setCustomerPickerSide] = useState(null);
  const [benefactorCustomer, setBenefactorCustomer] = useState(null);
  const [benefactorAccounts, setBenefactorAccounts] = useState([]);
  const [loadingBenefactorAccounts, setLoadingBenefactorAccounts] = useState(false);

  const [beneficiaryCustomer, setBeneficiaryCustomer] = useState(null);
  const [beneficiaryAccounts, setBeneficiaryAccounts] = useState([]);
  const [loadingBeneficiaryAccounts, setLoadingBeneficiaryAccounts] = useState(false);

  const normalizeList = (d) => {
    const payload = d?.data ?? d?.Data ?? d;
    if (Array.isArray(payload)) return payload;
    if (Array.isArray(payload?.PageCollection)) return payload.PageCollection;
    if (Array.isArray(payload?.pageCollection)) return payload.pageCollection;
    return [];
  };

  const fetchAccountsForCustomer = (customerId, setAccounts, setLoadingAccounts) => {
    if (!customerId) {
      setAccounts([]);
      return;
    }
    setLoadingAccounts(true);
    apiFetch(`${FIN_BASE}/api/accounts/customer-accounts/${customerId}/accounts`)
      .then((r) => r.json())
      .then((d) => setAccounts(normalizeList(d)))
      .catch(() => setAccounts([]))
      .finally(() => setLoadingAccounts(false));
  };

  const toDateInput = (iso) => (iso ? String(iso).slice(0, 10) : "");
  const toIsoOrNull = (dateStr) => (dateStr ? new Date(dateStr).toISOString() : null);

  useEffect(() => {
    if (!open) return;
    setActiveTab("parties");
    setErrors({});

    if (isEdit) {
      setLoadingData(true);
      getStandingOrder(standingOrder.id)
        .then((detail) => {
          setForm({
            benefactorCustomerAccountId: detail.benefactorCustomerAccountId || "",
            beneficiaryCustomerAccountId: detail.beneficiaryCustomerAccountId || "",
            trigger: detail.trigger ?? StandingOrderTrigger.Schedule,
            scheduleFrequency: detail.scheduleFrequency ?? ScheduleFrequency.Monthly,
            durationStartDate: toDateInput(detail.durationStartDate),
            durationEndDate: toDateInput(detail.durationEndDate),
            scheduleForceExecute: detail.scheduleForceExecute || false,
            chargeType: detail.chargeType ?? ChargeType.FixedAmount,
            chargePercentage: detail.chargePercentage ?? 0,
            chargeFixedAmount: detail.chargeFixedAmount ?? 0,
            chargeable: detail.chargeable ?? true,
            remarks: detail.remarks || "",
            isLocked: detail.isLocked || false,
            loanAmount: detail.loanAmount ?? 0,
            paymentPerPeriod: detail.paymentPerPeriod ?? 0,
            principal: detail.principal ?? 0,
            interest: detail.interest ?? 0,
            capitalizedInterest: detail.capitalizedInterest ?? 0,
            beneficiaryProductRoundingType: detail.beneficiaryProductRoundingType ?? RoundingType.NoRounding,
          });
          const benefactorCid = detail.benefactorCustomerAccountCustomerId || "";
          const beneficiaryCid = detail.beneficiaryCustomerAccountCustomerId || "";
          setBenefactorCustomer({ id: benefactorCid, name: detail.benefactorCustomerAccountCustomerFullName || "Selected customer" });
          setBeneficiaryCustomer({ id: beneficiaryCid, name: detail.beneficiaryCustomerAccountCustomerFullName || "Selected customer" });
          fetchAccountsForCustomer(benefactorCid, setBenefactorAccounts, setLoadingBenefactorAccounts);
          fetchAccountsForCustomer(beneficiaryCid, setBeneficiaryAccounts, setLoadingBeneficiaryAccounts);
        })
        .catch(() => Swal.fire("Error", "Failed to load standing order details", "error"))
        .finally(() => setLoadingData(false));
    } else {
      setForm(emptyForm);
      setBenefactorCustomer(null);
      setBeneficiaryCustomer(null);
      setBenefactorAccounts([]);
      setBeneficiaryAccounts([]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, isEdit, standingOrder]);

  const handleChange = (field, value) => setForm((p) => ({ ...p, [field]: value }));

  const customerSummary = (customer) => ({
    id: customer.Id ?? customer.id,
    name: [customer.IndividualFirstName, customer.IndividualLastName].filter(Boolean).join(" ") || customer.NonIndividualDescription || customer.Description || "Selected customer",
  });

  const handleCustomerSelected = (customer) => {
    const selected = customerSummary(customer);
    if (customerPickerSide === "benefactor") {
      setBenefactorCustomer(selected);
      handleChange("benefactorCustomerAccountId", "");
      fetchAccountsForCustomer(selected.id, setBenefactorAccounts, setLoadingBenefactorAccounts);
    } else {
      setBeneficiaryCustomer(selected);
      handleChange("beneficiaryCustomerAccountId", "");
      fetchAccountsForCustomer(selected.id, setBeneficiaryAccounts, setLoadingBeneficiaryAccounts);
    }
    setCustomerPickerSide(null);
  };

  const selectedBeneficiaryAccount = beneficiaryAccounts.find((account) => String(account.Id ?? account.id) === String(form.beneficiaryCustomerAccountId));
  const beneficiaryProductCode = Number(selectedBeneficiaryAccount?.CustomerAccountTypeProductCode ?? selectedBeneficiaryAccount?.customerAccountTypeProductCode ?? 0);
  const isLoanBeneficiary = beneficiaryProductCode === 2;

  useEffect(() => {
    if (!selectedBeneficiaryAccount || !isLoanBeneficiary) return;

    const productRoundingType = selectedBeneficiaryAccount.CustomerAccountTypeTargetProductRoundingType
      ?? selectedBeneficiaryAccount.customerAccountTypeTargetProductRoundingType;

    if (productRoundingType !== null && productRoundingType !== undefined) {
      setForm((previous) => ({
        ...previous,
        beneficiaryProductRoundingType: Number(productRoundingType),
      }));
    }
  }, [isLoanBeneficiary, selectedBeneficiaryAccount]);

  useEffect(() => {
    if (!isLoanBeneficiary) return;

    const principal = Number(form.principal) || 0;
    const interest = Number(form.interest) || 0;
    const paymentPerPeriod = roundLoanPayment(principal, form.beneficiaryProductRoundingType)
      + roundLoanPayment(interest, form.beneficiaryProductRoundingType);

    setForm((previous) => previous.paymentPerPeriod === paymentPerPeriod
      ? previous
      : { ...previous, paymentPerPeriod });
  }, [form.principal, form.interest, form.beneficiaryProductRoundingType, isLoanBeneficiary]);

  useEffect(() => {
    if (!isLoanBeneficiary && activeTab === "loanTerms") setActiveTab("parties");
  }, [activeTab, isLoanBeneficiary]);

  const validate = () => {
    const next = {};
    const amount = Number(form.chargeType === ChargeType.Percentage ? form.chargePercentage : form.chargeFixedAmount);
    if (!form.benefactorCustomerAccountId) next.benefactorCustomerAccountId = "Select the paying account.";
    if (!form.beneficiaryCustomerAccountId) next.beneficiaryCustomerAccountId = "Select the receiving account.";
    if (form.benefactorCustomerAccountId && form.benefactorCustomerAccountId === form.beneficiaryCustomerAccountId) next.beneficiaryCustomerAccountId = "Paying and receiving accounts must be different.";
    if (!form.durationStartDate) next.durationStartDate = "Start date is required.";
    if (!form.durationEndDate) next.durationEndDate = "End date is required.";
    if (form.durationStartDate && form.durationEndDate && form.durationEndDate < form.durationStartDate) next.durationEndDate = "End date cannot be before the start date.";
    if (isLoanBeneficiary) {
      if (Number(form.principal) < 0 || Number(form.interest) < 0) next.loanPayment = "Principal and interest cannot be negative.";
      if (Number(form.principal) + Number(form.interest) <= 0) next.loanPayment = "Enter a principal or interest recovery amount.";
    } else if (form.trigger !== StandingOrderTrigger.Sweep) {
      if (!Number.isFinite(amount) || amount <= 0) next.transferAmount = "Enter a transfer amount greater than zero.";
      if (form.chargeType === ChargeType.Percentage && amount > 100) next.transferAmount = "Percentage cannot exceed 100%.";
    }
    setErrors(next);
    return next;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const validationErrors = validate();
    if (Object.keys(validationErrors).length > 0) {
      setActiveTab(validationErrors.benefactorCustomerAccountId || validationErrors.beneficiaryCustomerAccountId ? "parties" : validationErrors.loanPayment ? "loanTerms" : "schedule");
      Swal.fire("Check Standing Order", "Please correct the highlighted fields before saving.", "warning");
      return;
    }

    const payload = {
      ...(isEdit ? { id: standingOrder.id } : {}),
      benefactorCustomerAccountId: form.benefactorCustomerAccountId,
      beneficiaryCustomerAccountId: form.beneficiaryCustomerAccountId,
      trigger: Number(form.trigger),
      scheduleFrequency: Number(form.scheduleFrequency),
      durationStartDate: toIsoOrNull(form.durationStartDate),
      durationEndDate: toIsoOrNull(form.durationEndDate),
      scheduleForceExecute: form.scheduleForceExecute,
      chargeType: Number(form.chargeType),
      chargePercentage: Number(form.chargePercentage) || 0,
      chargeFixedAmount: Number(form.chargeFixedAmount) || 0,
      chargeable: form.chargeable,
      remarks: form.remarks,
      isLocked: form.isLocked,
      loanAmount: Number(form.loanAmount) || 0,
      paymentPerPeriod: Number(form.paymentPerPeriod) || 0,
      principal: Number(form.principal) || 0,
      interest: Number(form.interest) || 0,
      capitalizedInterest: Number(form.capitalizedInterest) || 0,
      beneficiaryProductRoundingType: Number(form.beneficiaryProductRoundingType) || 0,
    };

    setLoading(true);
    try {
      if (isEdit) {
        await updateStandingOrder(standingOrder.id, payload);
        Swal.fire("Success", "Standing order updated successfully", "success");
      } else {
        await createStandingOrder(payload);
        Swal.fire("Success", "Standing order created successfully", "success");
      }
      onSuccess();
      onClose();
    } catch (err) {
      if (!isEdit && err.status === 409) {
        Swal.fire("Duplicate Standing Order", err.message, "warning");
      } else {
        Swal.fire("Error", err.message, "error");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            className="fixed inset-0 bg-black z-40"
            initial={{ opacity: 0 }} animate={{ opacity: 0.4 }} exit={{ opacity: 0 }}
            onClick={onClose}
          />
          <motion.div
            className="fixed top-3 right-3 w-[85vw] max-w-[1000px] h-[92vh] max-h-[92vh] bg-white shadow-2xl z-50 flex flex-col rounded-2xl overflow-hidden"
            initial={{ x: "100%" }} animate={{ x: 0 }} exit={{ x: "100%" }}
            transition={{ type: "spring", stiffness: 280, damping: 28 }}
          >
            <div className="p-4 flex justify-between items-center bg-indigo-700 rounded-2xl m-2 shrink-0">
              <h2 className="font-bold text-lg text-white">{isEdit ? "Edit Standing Order" : "New Standing Order"}</h2>
              <Button variant="outline" size="sm" onClick={onClose}>Close</Button>
            </div>

            <form onSubmit={handleSubmit} className="flex flex-col flex-1 overflow-hidden">
              <div className="grid grid-cols-12 gap-3 px-3 pt-2 pb-3 flex-1 overflow-hidden">
                <aside className="col-span-3 bg-gray-200 p-3 rounded-lg overflow-y-auto">
                  {TABS.filter((tab) => tab.id !== "loanTerms" || isLoanBeneficiary).map((tab) => (
                    <div
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={`p-3 mb-2 rounded-md cursor-pointer border text-sm font-medium transition-colors ${activeTab === tab.id
                        ? "bg-indigo-700 border-indigo-500 text-white"
                        : "bg-white border-transparent hover:bg-gray-100 text-gray-700"
                        }`}
                    >
                      {tab.label}
                    </div>
                  ))}
                </aside>

                <main className="col-span-9 overflow-y-auto pr-1">
                  {loadingData ? (
                    <p className="text-sm text-gray-400">Loading standing order...</p>
                  ) : (
                    <>
                      {activeTab === "parties" && (
                        <section className="space-y-4">
                          <PartyPicker
                            label="Benefactor (paying side)"
                            help="The source account that will be debited when the order executes."
                            customer={benefactorCustomer}
                            onChooseCustomer={() => setCustomerPickerSide("benefactor")}
                            accounts={benefactorAccounts}
                            loadingAccounts={loadingBenefactorAccounts}
                            accountId={form.benefactorCustomerAccountId}
                            onAccountChange={(v) => handleChange("benefactorCustomerAccountId", v)}
                            error={errors.benefactorCustomerAccountId}
                          />
                          <PartyPicker
                            label="Beneficiary (receiving side)"
                            help="The savings, investment, or loan account that receives the transfer or loan recovery."
                            customer={beneficiaryCustomer}
                            onChooseCustomer={() => setCustomerPickerSide("beneficiary")}
                            accounts={beneficiaryAccounts}
                            loadingAccounts={loadingBeneficiaryAccounts}
                            accountId={form.beneficiaryCustomerAccountId}
                            onAccountChange={(v) => handleChange("beneficiaryCustomerAccountId", v)}
                            error={errors.beneficiaryCustomerAccountId}
                          />
                        </section>
                      )}

                      {activeTab === "schedule" && (
                        <section className="space-y-4">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <FieldGroup label="Trigger" help="Schedule runs by date. Sweep moves the available source balance. Payout, Check-Off, and Microloan are used by their corresponding automated processes.">
                              <EnumSelect value={form.trigger} options={TRIGGER_OPTIONS} onChange={(v) => handleChange("trigger", v)} />
                            </FieldGroup>
                            <FieldGroup label="Frequency" help="How often the order becomes due. Execution is adjusted to a valid business day.">
                              <EnumSelect value={form.scheduleFrequency} options={FREQUENCY_OPTIONS} onChange={(v) => handleChange("scheduleFrequency", v)} />
                            </FieldGroup>
                            <FieldGroup label="Start Date" error={errors.durationStartDate} help="The first date on which the standing order can become due.">
                              <Input type="date" required value={form.durationStartDate} onChange={(e) => handleChange("durationStartDate", e.target.value)} />
                            </FieldGroup>
                            <FieldGroup label="End Date" error={errors.durationEndDate} help="The order will no longer be selected after this date.">
                              <Input type="date" required min={form.durationStartDate || undefined} value={form.durationEndDate} onChange={(e) => handleChange("durationEndDate", e.target.value)} />
                            </FieldGroup>
                            {!isLoanBeneficiary && form.trigger !== StandingOrderTrigger.Sweep && <FieldGroup label="Transfer Amount Type" help="Determines the amount transferred: either a fixed amount or a percentage of the source account's available balance.">
                              <EnumSelect value={form.chargeType} options={CHARGE_TYPE_OPTIONS} onChange={(v) => handleChange("chargeType", v)} />
                            </FieldGroup>}
                            {!isLoanBeneficiary && form.trigger !== StandingOrderTrigger.Sweep && (form.chargeType === ChargeType.Percentage ? (
                              <FieldGroup label="Transfer Percentage" error={errors.transferAmount} help="Percentage of the source account's available balance to transfer on each execution.">
                                <Input type="number" min="0.01" max="100" step="0.01" value={form.chargePercentage} onChange={(e) => handleChange("chargePercentage", e.target.value)} />
                              </FieldGroup>
                            ) : (
                              <FieldGroup label="Fixed Transfer Amount" error={errors.transferAmount} help="Exact amount to transfer on each execution, subject to available funds.">
                                <Input type="number" min="0.01" step="0.01" value={form.chargeFixedAmount} onChange={(e) => handleChange("chargeFixedAmount", e.target.value)} />
                              </FieldGroup>
                            ))}
                          </div>
                          <FieldGroup label="Remarks" help="An optional meaningful reference carried into execution batches and used during audit and reconciliation.">
                            <Input maxLength={250} value={form.remarks} onChange={(e) => handleChange("remarks", e.target.value)} placeholder="Purpose or reference for this order" />
                          </FieldGroup>
                          <div className="flex items-center gap-4 pt-2">
                            <label className="flex items-center gap-2 cursor-pointer">
                              <input type="checkbox" checked={form.chargeable} onChange={(e) => handleChange("chargeable", e.target.checked)} className="w-4 h-4 accent-indigo-600" />
                              <span className="text-sm font-medium">Recover standing-order fee</span>
                              <FieldHelp label="Standing-order fee">Uses the source savings product's configured Standing Order Fee. This is separate from the transfer amount above and is capped to remaining available funds.</FieldHelp>
                            </label>
                            <label className="flex items-center gap-2 cursor-pointer">
                              <input type="checkbox" checked={form.scheduleForceExecute} onChange={(e) => handleChange("scheduleForceExecute", e.target.checked)} className="w-4 h-4 accent-indigo-600" />
                              <span className="text-sm font-medium">Force Execute</span>
                              <FieldHelp label="Force Execute">Requests execution on the next run and resets the normal attempt counter. It does not create funds or permit an overdraft.</FieldHelp>
                            </label>
                            <label className="flex items-center gap-2 cursor-pointer">
                              <input type="checkbox" checked={form.isLocked} onChange={(e) => handleChange("isLocked", e.target.checked)} className="w-4 h-4 accent-indigo-600" />
                              <span className="text-sm font-medium">Is Locked</span>
                              <FieldHelp label="Locked standing order">Locked orders are excluded from automated execution until unlocked.</FieldHelp>
                            </label>
                          </div>
                        </section>
                      )}

                      {activeTab === "loanTerms" && (
                        <section className="space-y-4">
                          <p className="text-sm text-gray-500">
                            Set the principal and interest to recover on each execution. Payment per period is calculated automatically, and actual recovery is capped by the outstanding loan and available funds.
                          </p>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <FieldGroup label="Principal" error={errors.loanPayment} help="Principal requested on each execution, capped by the outstanding loan principal and available funds.">
                              <Input type="number" min="0" step="0.01" value={form.principal} onChange={(e) => handleChange("principal", e.target.value)} />
                            </FieldGroup>
                            <FieldGroup label="Interest" help="Interest requested on each execution. Available funds are applied to interest before principal.">
                              <Input type="number" min="0" step="0.01" value={form.interest} onChange={(e) => handleChange("interest", e.target.value)} />
                            </FieldGroup>
                            <FieldGroup label="Payment Per Period" help="Automatically calculated as principal plus interest using the beneficiary loan product's rounding rule.">
                              <Input type="number" value={form.paymentPerPeriod} readOnly className="bg-gray-100" />
                            </FieldGroup>
                            <FieldGroup label="Rounding" help="Taken automatically from the selected beneficiary loan product and applied again by the API when the standing order is saved.">
                              <Input
                                value={ROUNDING_TYPE_OPTIONS.find((option) => option.value === Number(form.beneficiaryProductRoundingType))?.label || "No Rounding"}
                                readOnly
                                className="bg-gray-100"
                              />
                            </FieldGroup>
                          </div>
                        </section>
                      )}
                    </>
                  )}
                </main>
              </div>

              <div className="px-5 py-3 border-t bg-gray-50 flex justify-end rounded-b-2xl shrink-0">
                <Button type="submit" disabled={loading || loadingData} className="bg-indigo-600 hover:bg-indigo-700">
                  {loading ? "Saving..." : isEdit ? "Save Changes" : "Create Standing Order"}
                </Button>
              </div>
            </form>
          </motion.div>
        </>
      )}
      {customerPickerSide && <CustomerLookupModal onSelect={handleCustomerSelected} onClose={() => setCustomerPickerSide(null)} />}
    </AnimatePresence>
  );
}
