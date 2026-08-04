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

function FieldGroup({ label, children }) {
  return (
    <div>
      <Label className="text-sm font-semibold text-gray-700">{label}</Label>
      {children}
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
function PartyPicker({ label, customers, loadingCustomers, customerId, onCustomerChange, accounts, loadingAccounts, accountId, onAccountChange }) {
  return (
    <div className="space-y-3 rounded-lg border p-4">
      <p className="text-sm font-semibold text-gray-700">{label}</p>
      <FieldGroup label="Customer">
        <Select value={customerId ? String(customerId) : ""} onValueChange={onCustomerChange} disabled={loadingCustomers}>
          <SelectTrigger><SelectValue placeholder={loadingCustomers ? "Loading..." : "Search & select customer"} /></SelectTrigger>
          <SelectContent className="max-h-60 overflow-y-auto">
            {customers.map((c) => {
              const name = [c.IndividualFirstName, c.IndividualLastName]
                .filter(Boolean)
                .join(" ") || c.NonIndividualDescription || c.Description || `Customer ${c.Id}`;
              return (
                <SelectItem key={String(c.Id)} value={String(c.Id)}>{name}</SelectItem>
              );
            })}
          </SelectContent>
        </Select>
      </FieldGroup>
      <FieldGroup label="Account">
        <Select value={accountId ? String(accountId) : ""} onValueChange={onAccountChange} disabled={!customerId || loadingAccounts}>
          <SelectTrigger>
            <SelectValue placeholder={loadingAccounts ? "Loading..." : !customerId ? "Select a customer first" : "Select account"} />
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

  const [customers, setCustomers] = useState([]);
  const [loadingCustomers, setLoadingCustomers] = useState(false);

  const [benefactorCustomerId, setBenefactorCustomerId] = useState("");
  const [benefactorAccounts, setBenefactorAccounts] = useState([]);
  const [loadingBenefactorAccounts, setLoadingBenefactorAccounts] = useState(false);

  const [beneficiaryCustomerId, setBeneficiaryCustomerId] = useState("");
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
    setLoadingCustomers(true);
    apiFetch(`${FIN_BASE}/api/registry/customers`)
      .then((r) => r.json())
      .then((d) => setCustomers(normalizeList(d)))
      .catch(() => setCustomers([]))
      .finally(() => setLoadingCustomers(false));

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
          setBenefactorCustomerId(benefactorCid);
          setBeneficiaryCustomerId(beneficiaryCid);
          fetchAccountsForCustomer(benefactorCid, setBenefactorAccounts, setLoadingBenefactorAccounts);
          fetchAccountsForCustomer(beneficiaryCid, setBeneficiaryAccounts, setLoadingBeneficiaryAccounts);
        })
        .catch(() => Swal.fire("Error", "Failed to load standing order details", "error"))
        .finally(() => setLoadingData(false));
    } else {
      setForm(emptyForm);
      setBenefactorCustomerId("");
      setBeneficiaryCustomerId("");
      setBenefactorAccounts([]);
      setBeneficiaryAccounts([]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, isEdit, standingOrder]);

  const handleChange = (field, value) => setForm((p) => ({ ...p, [field]: value }));

  const handleBenefactorCustomerChange = (customerId) => {
    setBenefactorCustomerId(customerId);
    handleChange("benefactorCustomerAccountId", "");
    fetchAccountsForCustomer(customerId, setBenefactorAccounts, setLoadingBenefactorAccounts);
  };

  const handleBeneficiaryCustomerChange = (customerId) => {
    setBeneficiaryCustomerId(customerId);
    handleChange("beneficiaryCustomerAccountId", "");
    fetchAccountsForCustomer(customerId, setBeneficiaryAccounts, setLoadingBeneficiaryAccounts);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.benefactorCustomerAccountId || !form.beneficiaryCustomerAccountId) {
      Swal.fire("Missing Fields", "Benefactor and beneficiary accounts are required.", "warning");
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
        // Created, but the server flagged a duplicate benefactor/beneficiary/
        // trigger combination — not a hard failure, per the spec.
        Swal.fire("Created with a Warning", err.message, "warning");
        onSuccess();
        onClose();
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
                  {TABS.map((tab) => (
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
                            customers={customers}
                            loadingCustomers={loadingCustomers}
                            customerId={benefactorCustomerId}
                            onCustomerChange={handleBenefactorCustomerChange}
                            accounts={benefactorAccounts}
                            loadingAccounts={loadingBenefactorAccounts}
                            accountId={form.benefactorCustomerAccountId}
                            onAccountChange={(v) => handleChange("benefactorCustomerAccountId", v)}
                          />
                          <PartyPicker
                            label="Beneficiary (receiving side)"
                            customers={customers}
                            loadingCustomers={loadingCustomers}
                            customerId={beneficiaryCustomerId}
                            onCustomerChange={handleBeneficiaryCustomerChange}
                            accounts={beneficiaryAccounts}
                            loadingAccounts={loadingBeneficiaryAccounts}
                            accountId={form.beneficiaryCustomerAccountId}
                            onAccountChange={(v) => handleChange("beneficiaryCustomerAccountId", v)}
                          />
                        </section>
                      )}

                      {activeTab === "schedule" && (
                        <section className="space-y-4">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <FieldGroup label="Trigger">
                              <EnumSelect value={form.trigger} options={TRIGGER_OPTIONS} onChange={(v) => handleChange("trigger", v)} />
                            </FieldGroup>
                            <FieldGroup label="Frequency">
                              <EnumSelect value={form.scheduleFrequency} options={FREQUENCY_OPTIONS} onChange={(v) => handleChange("scheduleFrequency", v)} />
                            </FieldGroup>
                            <FieldGroup label="Start Date">
                              <Input type="date" value={form.durationStartDate} onChange={(e) => handleChange("durationStartDate", e.target.value)} />
                            </FieldGroup>
                            <FieldGroup label="End Date">
                              <Input type="date" value={form.durationEndDate} onChange={(e) => handleChange("durationEndDate", e.target.value)} />
                            </FieldGroup>
                            <FieldGroup label="Charge Type">
                              <EnumSelect value={form.chargeType} options={CHARGE_TYPE_OPTIONS} onChange={(v) => handleChange("chargeType", v)} />
                            </FieldGroup>
                            {form.chargeType === ChargeType.Percentage ? (
                              <FieldGroup label="Charge Percentage">
                                <Input type="number" step="0.01" value={form.chargePercentage} onChange={(e) => handleChange("chargePercentage", e.target.value)} />
                              </FieldGroup>
                            ) : (
                              <FieldGroup label="Charge Fixed Amount">
                                <Input type="number" step="0.01" value={form.chargeFixedAmount} onChange={(e) => handleChange("chargeFixedAmount", e.target.value)} />
                              </FieldGroup>
                            )}
                          </div>
                          <FieldGroup label="Remarks">
                            <Input value={form.remarks} onChange={(e) => handleChange("remarks", e.target.value)} placeholder="Enter remarks" />
                          </FieldGroup>
                          <div className="flex items-center gap-4 pt-2">
                            <label className="flex items-center gap-2 cursor-pointer">
                              <input type="checkbox" checked={form.chargeable} onChange={(e) => handleChange("chargeable", e.target.checked)} className="w-4 h-4 accent-indigo-600" />
                              <span className="text-sm font-medium">Chargeable</span>
                            </label>
                            <label className="flex items-center gap-2 cursor-pointer">
                              <input type="checkbox" checked={form.scheduleForceExecute} onChange={(e) => handleChange("scheduleForceExecute", e.target.checked)} className="w-4 h-4 accent-indigo-600" />
                              <span className="text-sm font-medium">Force Execute</span>
                            </label>
                            <label className="flex items-center gap-2 cursor-pointer">
                              <input type="checkbox" checked={form.isLocked} onChange={(e) => handleChange("isLocked", e.target.checked)} className="w-4 h-4 accent-indigo-600" />
                              <span className="text-sm font-medium">Is Locked</span>
                            </label>
                          </div>
                        </section>
                      )}

                      {activeTab === "loanTerms" && (
                        <section className="space-y-4">
                          <p className="text-sm text-gray-500">
                            Only relevant for Check-Off/Microloan triggers and loan-product beneficiaries — leave at 0/No Rounding otherwise.
                          </p>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <FieldGroup label="Loan Amount">
                              <Input type="number" step="0.01" value={form.loanAmount} onChange={(e) => handleChange("loanAmount", e.target.value)} />
                            </FieldGroup>
                            <FieldGroup label="Payment Per Period">
                              <Input type="number" step="0.01" value={form.paymentPerPeriod} onChange={(e) => handleChange("paymentPerPeriod", e.target.value)} />
                            </FieldGroup>
                            <FieldGroup label="Principal">
                              <Input type="number" step="0.01" value={form.principal} onChange={(e) => handleChange("principal", e.target.value)} />
                            </FieldGroup>
                            <FieldGroup label="Interest">
                              <Input type="number" step="0.01" value={form.interest} onChange={(e) => handleChange("interest", e.target.value)} />
                            </FieldGroup>
                            <FieldGroup label="Capitalized Interest">
                              <Input type="number" step="0.01" value={form.capitalizedInterest} onChange={(e) => handleChange("capitalizedInterest", e.target.value)} />
                            </FieldGroup>
                            <FieldGroup label="Beneficiary Product Rounding">
                              <EnumSelect value={form.beneficiaryProductRoundingType} options={ROUNDING_TYPE_OPTIONS} onChange={(v) => handleChange("beneficiaryProductRoundingType", v)} />
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
    </AnimatePresence>
  );
}
