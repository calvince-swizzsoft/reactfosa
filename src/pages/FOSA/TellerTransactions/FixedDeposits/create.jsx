import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { FaPiggyBank } from "react-icons/fa";
import Swal from "sweetalert2";
import { apiErrorMessage, apiJson, normalizeList } from "@/lib/api";
import { createFixedDeposit } from "../fixedDepositsApi";
import { listAllFixedDepositTypes, listFixedDepositTypeGraduatedScales } from "../../../Accounts/FixedDepositTypes/api";
import { FixedDepositCategory, FixedDepositMaturityAction } from "../../lib/frontOfficeEnums";
import FieldHelp from "../../../Accounts/SavingsProducts/FieldHelp";
import CustomerLookupModal from "@/pages/Registry/Customers/Documents/CustomerLookupModal";

// Origination — opened at the counter against an existing customer
// account, matching the customer -> account picker pattern used by
// SavingsReceiptsPayments.jsx. FixedDepositTypeId is optional (Guid?) —
// sourced from Accounts/FixedDepositTypes/api.js now that a real lookup
// endpoint exists (previously omitted entirely, see fixedDepositsApi.js).
const FIN_BASE = `${import.meta.env.VITE_APP_FIN_URL}`;
const MODULE_NAVIGATION_ITEM_CODE = 25012;
const NORMAL_ACCOUNT_STATUS = 0;
const ELIGIBLE_FUNDING_PRODUCT_CODES = new Set([1, 3]); // Savings, Investment

const CATEGORY_OPTIONS = [
  { value: FixedDepositCategory.TermDeposit, label: "Term Deposit" },
  { value: FixedDepositCategory.CallDeposit, label: "Call Deposit" },
];

const MATURITY_ACTION_OPTIONS = [
  { value: FixedDepositMaturityAction.PayPrincipalAndInterestDue, label: "Pay Principal & Interest Due" },
  { value: FixedDepositMaturityAction.PayInterestDueAndRollOverPrincipal, label: "Pay Interest Due & Roll-over Principal" },
  { value: FixedDepositMaturityAction.RollOverPrincipalAndInterestDue, label: "Roll-over Principal & Interest Due" },
];

const FIELD_HELP = {
  Customer: "The customer who owns the funding account and fixed-deposit placement.",
  "Customer Account": "The account that funds the placement. On verification, the system checks its current available balance before moving the principal to the fixed-deposit control account.",
  Branch: "The branch under which the placement and its accounting journal are recorded.",
  "Fixed Deposit Type (Optional)": "Applies a configured fixed-deposit product, including its bands, levies and attached recovery products. Leaving it blank creates an untyped placement and may prevent product-based charges from applying.",
  Category: "A term deposit has a maturity date based on its term. A call deposit calculates its effective term when it is liquidated.",
  "Maturity Action": "Controls whether maturity pays principal and interest, rolls over principal only, or rolls over both principal and interest.",
  Value: "The principal to fix. Creation records the request; verification succeeds only when the funding account still has enough available balance.",
  "Term (Months)": "The placement duration used to calculate the maturity date and expected interest for a term deposit.",
  "Annual Percentage Rate": "The annual rate used to estimate interest: principal × annual rate × term months ÷ 12 ÷ 100.",
  Remarks: "A meaningful reference carried on the fixed-deposit record and its accounting journal.",
};

function FieldGroup({ label, help, children }) {
  return (
    <div>
      <div className="flex items-center gap-1">
        <Label className="text-sm font-semibold text-gray-700">{label}</Label>
        {(help || FIELD_HELP[label]) && <FieldHelp label={label}>{help || FIELD_HELP[label]}</FieldHelp>}
      </div>
      {children}
    </div>
  );
}

const emptyForm = {
  FixedDepositTypeId: "", BranchId: "", CustomerAccountId: "", Category: FixedDepositCategory.TermDeposit,
  MaturityAction: FixedDepositMaturityAction.PayPrincipalAndInterestDue,
  Value: "", Term: "", Rate: "", Remarks: "",
};

export default function CreateFixedDeposit() {
  const navigate = useNavigate();
  const [form, setForm] = useState(emptyForm);
  const [branches, setBranches] = useState([]);
  const [fixedDepositTypes, setFixedDepositTypes] = useState([]);
  const [selectedCustomerId, setSelectedCustomerId] = useState("");
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [customerPickerOpen, setCustomerPickerOpen] = useState(false);
  const [accounts, setAccounts] = useState([]);
  const [loadingAccounts, setLoadingAccounts] = useState(false);
  const [loadingData, setLoadingData] = useState(true);
  const [loading, setLoading] = useState(false);
  const [graduatedScales, setGraduatedScales] = useState([]);
  const [loadingScales, setLoadingScales] = useState(false);

  useEffect(() => {
    setLoadingData(true);
    Promise.all([
      apiJson(`${FIN_BASE}/api/administration/branches`),
      listAllFixedDepositTypes(),
    ]).then(([branchData, fixedDepositTypeData]) => {
      setBranches(normalizeList(branchData));
      setFixedDepositTypes(normalizeList(fixedDepositTypeData));
    }).catch((error) => {
      setBranches([]);
      setFixedDepositTypes([]);
      Swal.fire("Error", apiErrorMessage(error, "Unable to load fixed-deposit options."), "error");
    }).finally(() => setLoadingData(false));
  }, []);

  const handleCustomerChange = (customer) => {
    const customerId = customer?.Id;
    setSelectedCustomer(customer || null);
    setSelectedCustomerId(customerId);
    setCustomerPickerOpen(false);
    setAccounts([]);
    setForm((p) => ({ ...p, CustomerAccountId: "" }));
    if (!customerId) return;
    setLoadingAccounts(true);
    apiJson(`${FIN_BASE}/api/accounts/customer-accounts/${customerId}/accounts`)
      .then((d) => setAccounts(normalizeList(d)))
      .catch((error) => {
        setAccounts([]);
        Swal.fire("Error", apiErrorMessage(error, "Unable to load customer accounts."), "error");
      })
      .finally(() => setLoadingAccounts(false));
  };

  const handleChange = (field, value) => setForm((p) => ({ ...p, [field]: value }));

  const handleTypeChange = (typeId) => {
    const selectedType = fixedDepositTypes.find((item) => String(item.Id) === String(typeId));
    setForm((previous) => ({
      ...previous,
      FixedDepositTypeId: typeId,
      Term: selectedType?.Months > 0 ? String(selectedType.Months) : previous.Term,
    }));
    setGraduatedScales([]);
    if (!typeId) return;
    setLoadingScales(true);
    listFixedDepositTypeGraduatedScales(typeId)
      .then((rows) => setGraduatedScales(normalizeList(rows)))
      .catch((error) => Swal.fire("Error", apiErrorMessage(error, "Unable to load the fixed-deposit interest bands."), "error"))
      .finally(() => setLoadingScales(false));
  };

  useEffect(() => {
    if (!graduatedScales.length || !(Number(form.Value) > 0)) return;
    const matches = graduatedScales.filter((row) => Number(form.Value) >= Number(row.RangeLowerLimit) && Number(form.Value) <= Number(row.RangeUpperLimit));
    setForm((previous) => ({ ...previous, Rate: matches.length === 1 ? String(matches[0].Percentage) : "" }));
  }, [form.Value, graduatedScales]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errors = [];
    const value = Number(form.Value);
    const term = Number(form.Term);
    const rate = Number(form.Rate);
    const selectedAccount = accounts.find((item) => String(item.Id) === String(form.CustomerAccountId));
    const selectedType = fixedDepositTypes.find((item) => String(item.Id) === String(form.FixedDepositTypeId));
    const accountStatus = Number(selectedAccount?.Status ?? selectedAccount?.CustomerAccountStatus);
    const productCode = Number(selectedAccount?.CustomerAccountTypeProductCode);
    const availableBalanceValue = selectedAccount?.AvailableBalance;
    const availableBalance = Number(availableBalanceValue);

    if (!form.BranchId) errors.push("Branch is required.");
    if (!selectedAccount) errors.push("Select a valid customer funding account.");
    if (selectedAccount && accountStatus !== NORMAL_ACCOUNT_STATUS) errors.push("The funding account must be normal and active.");
    if (selectedAccount && !ELIGIBLE_FUNDING_PRODUCT_CODES.has(productCode)) errors.push("Only a savings or investment account can fund a fixed deposit.");
    if (!Number.isFinite(value) || value <= 0) errors.push("Value must be greater than zero.");
    if (availableBalanceValue != null && Number.isFinite(availableBalance) && value > availableBalance) errors.push("Value cannot exceed the funding account's available balance.");
    if (!Number.isInteger(term) || term <= 0) errors.push("Term must be a whole number greater than zero.");
    if (!Number.isFinite(rate) || rate <= 0 || rate > 100) errors.push("Annual rate must be greater than 0% and no more than 100%.");
    if (!Object.values(FixedDepositCategory).includes(form.Category)) errors.push("Select a valid category.");
    if (!Object.values(FixedDepositMaturityAction).includes(form.MaturityAction)) errors.push("Select a valid maturity action.");
    if (!form.Remarks.trim() || form.Remarks.trim().length > 250) errors.push("Remarks are required and cannot exceed 250 characters.");
    if (form.FixedDepositTypeId && !selectedType) errors.push("Select a valid fixed-deposit type.");
    if (selectedType?.IsLocked) errors.push("The selected fixed-deposit type is locked.");
    if (selectedType && form.Category === FixedDepositCategory.TermDeposit && term !== Number(selectedType.Months)) errors.push(`The selected type requires a term of ${selectedType.Months} month(s).`);
    if (graduatedScales.length) {
      const matchingScales = graduatedScales.filter((row) => value >= Number(row.RangeLowerLimit) && value <= Number(row.RangeUpperLimit));
      if (matchingScales.length !== 1) errors.push("The value must fall within exactly one configured interest band.");
      else if (Math.abs(rate - Number(matchingScales[0].Percentage)) > 0.0001) errors.push(`The annual rate must be ${matchingScales[0].Percentage}% for this value.`);
    }
    if (errors.length) {
      Swal.fire({ icon: "warning", title: "Review Fixed Deposit", html: `<div style="text-align:left">${errors.map((message) => `<div>• ${message}</div>`).join("")}</div>` });
      return;
    }
    setLoading(true);
    try {
      await createFixedDeposit({
        FixedDepositTypeId: form.FixedDepositTypeId || null,
        BranchId: form.BranchId,
        CustomerAccountId: form.CustomerAccountId,
        Category: form.Category,
        MaturityAction: form.MaturityAction,
        Value: value,
        Term: term,
        Rate: rate,
        Remarks: form.Remarks.trim(),
        ModuleNavigationItemCode: MODULE_NAVIGATION_ITEM_CODE,
      });
      Swal.fire("Success", "Fixed deposit created — pending verification", "success");
      navigate("/FrontOffice/FixedDeposits");
    } catch (err) {
      Swal.fire("Error", apiErrorMessage(err, "Unable to create the fixed deposit."), "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white m-8 px-8 py-8 shadow-2xl rounded-lg relative">
      <div className="flex items-center justify-between gap-3 mb-6 bg-indigo-800 px-6 py-3 rounded-2xl">
        <div className="flex items-center gap-3">
          <FaPiggyBank className="text-white text-xl" />
          <h2 className="text-xl font-bold text-white">New Fixed Deposit</h2>
        </div>
        <Link to="/FrontOffice/FixedDeposits" className="text-sm text-white/80 hover:text-white">
          &larr; Back to Fixed Deposits
        </Link>
      </div>

      <form onSubmit={handleSubmit} className="max-w-2xl space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <FieldGroup label="Customer">
            <Button type="button" variant="outline" onClick={() => setCustomerPickerOpen(true)} className="w-full justify-start font-normal">
              {selectedCustomer ? ([selectedCustomer.IndividualFirstName, selectedCustomer.IndividualLastName].filter(Boolean).join(" ") || selectedCustomer.NonIndividualDescription || selectedCustomer.Description) : "Search & select customer"}
            </Button>
          </FieldGroup>
          <FieldGroup label={loadingAccounts ? "Loading accounts..." : "Customer Account"} help={FIELD_HELP["Customer Account"]}>
            <Select value={form.CustomerAccountId} onValueChange={(v) => handleChange("CustomerAccountId", v)} disabled={loadingAccounts || !selectedCustomerId}>
              <SelectTrigger><SelectValue placeholder={!selectedCustomerId ? "Select a customer first" : "Select account"} /></SelectTrigger>
              <SelectContent className="max-h-60 overflow-y-auto">
                {accounts.map((a) => (
                  <SelectItem key={String(a.Id)} value={String(a.Id)}>{a.CustomerAccountTypeTargetProductDescription || a.FullAccountNumber || a.Id}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </FieldGroup>
          <FieldGroup label="Branch">
            <Select value={form.BranchId} onValueChange={(v) => handleChange("BranchId", v)} disabled={loadingData}>
              <SelectTrigger><SelectValue placeholder="Select branch" /></SelectTrigger>
              <SelectContent className="max-h-60 overflow-y-auto">
                {branches.map((b) => <SelectItem key={String(b.Id)} value={String(b.Id)}>{b.Description}</SelectItem>)}
              </SelectContent>
            </Select>
          </FieldGroup>
          <FieldGroup label="Fixed Deposit Type (Optional)">
            <Select value={form.FixedDepositTypeId} onValueChange={handleTypeChange} disabled={loadingData}>
              <SelectTrigger><SelectValue placeholder={loadingData ? "Loading..." : "Select type"} /></SelectTrigger>
              <SelectContent className="max-h-60 overflow-y-auto">
                {fixedDepositTypes.filter((t) => !t.IsLocked).map((t) => (
                  <SelectItem key={String(t.Id)} value={String(t.Id)}>{t.Description} ({t.Months} mo)</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </FieldGroup>
          <FieldGroup label="Category">
            <Select value={String(form.Category)} onValueChange={(v) => handleChange("Category", Number(v))}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {CATEGORY_OPTIONS.map((o) => <SelectItem key={o.value} value={String(o.value)}>{o.label}</SelectItem>)}
              </SelectContent>
            </Select>
          </FieldGroup>
          <FieldGroup label="Maturity Action">
            <Select value={String(form.MaturityAction)} onValueChange={(v) => handleChange("MaturityAction", Number(v))}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {MATURITY_ACTION_OPTIONS.map((o) => <SelectItem key={o.value} value={String(o.value)}>{o.label}</SelectItem>)}
              </SelectContent>
            </Select>
          </FieldGroup>
          <FieldGroup label="Value">
            <Input type="number" min="0.01" step="0.01" value={form.Value} onChange={(e) => handleChange("Value", e.target.value)} required placeholder="e.g. 100000" />
          </FieldGroup>
          <FieldGroup label="Term (Months)">
            <Input type="number" min="1" step="1" value={form.Term} onChange={(e) => handleChange("Term", e.target.value)} required readOnly={Boolean(form.FixedDepositTypeId && form.Category === FixedDepositCategory.TermDeposit)} placeholder="e.g. 12" />
          </FieldGroup>
          <FieldGroup label="Annual Percentage Rate">
            <Input type="number" min="0.01" max="100" step="0.01" value={form.Rate} onChange={(e) => handleChange("Rate", e.target.value)} required readOnly={graduatedScales.length > 0} disabled={loadingScales} placeholder={loadingScales ? "Loading band..." : "e.g. 8.5"} />
          </FieldGroup>
        </div>

        <FieldGroup label="Remarks">
          <Input value={form.Remarks} onChange={(e) => handleChange("Remarks", e.target.value)} required maxLength={250} placeholder="Required" />
        </FieldGroup>

        <Button type="submit" disabled={loading || loadingData || loadingScales} className="w-full bg-indigo-600 hover:bg-indigo-700">
          {loading ? "Creating..." : "Create Fixed Deposit"}
        </Button>
      </form>
      {customerPickerOpen && <CustomerLookupModal onSelect={handleCustomerChange} onClose={() => setCustomerPickerOpen(false)} />}
    </div>
  );
}
