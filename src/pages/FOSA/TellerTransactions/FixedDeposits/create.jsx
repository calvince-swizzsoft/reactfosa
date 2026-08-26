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
import { listAllFixedDepositTypes } from "../../../Accounts/FixedDepositTypes/api";
import { FixedDepositCategory, FixedDepositMaturityAction } from "../../lib/frontOfficeEnums";

// Origination — opened at the counter against an existing customer
// account, matching the customer -> account picker pattern used by
// SavingsReceiptsPayments.jsx. FixedDepositTypeId is optional (Guid?) —
// sourced from Accounts/FixedDepositTypes/api.js now that a real lookup
// endpoint exists (previously omitted entirely, see fixedDepositsApi.js).
const FIN_BASE = `${import.meta.env.VITE_APP_FIN_URL}`;
const MODULE_NAVIGATION_ITEM_CODE = 25012;

const CATEGORY_OPTIONS = [
  { value: FixedDepositCategory.TermDeposit, label: "Term Deposit" },
  { value: FixedDepositCategory.CallDeposit, label: "Call Deposit" },
];

const MATURITY_ACTION_OPTIONS = [
  { value: FixedDepositMaturityAction.PayPrincipalAndInterestDue, label: "Pay Principal & Interest Due" },
  { value: FixedDepositMaturityAction.PayInterestDueAndRollOverPrincipal, label: "Pay Interest Due & Roll-over Principal" },
  { value: FixedDepositMaturityAction.RollOverPrincipalAndInterestDue, label: "Roll-over Principal & Interest Due" },
];

function FieldGroup({ label, children }) {
  return (
    <div>
      <Label className="text-sm font-semibold text-gray-700">{label}</Label>
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
  const [customers, setCustomers] = useState([]);
  const [fixedDepositTypes, setFixedDepositTypes] = useState([]);
  const [selectedCustomerId, setSelectedCustomerId] = useState("");
  const [accounts, setAccounts] = useState([]);
  const [loadingAccounts, setLoadingAccounts] = useState(false);
  const [loadingData, setLoadingData] = useState(true);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setLoadingData(true);
    Promise.all([
      apiJson(`${FIN_BASE}/api/administration/branches`),
      apiJson(`${FIN_BASE}/api/registry/customers`),
      listAllFixedDepositTypes(),
    ]).then(([branchData, customerData, fixedDepositTypeData]) => {
      setBranches(normalizeList(branchData));
      setCustomers(normalizeList(customerData));
      setFixedDepositTypes(normalizeList(fixedDepositTypeData));
    }).catch((error) => {
      setBranches([]);
      setCustomers([]);
      setFixedDepositTypes([]);
      Swal.fire("Error", apiErrorMessage(error, "Unable to load fixed-deposit options."), "error");
    }).finally(() => setLoadingData(false));
  }, []);

  const handleCustomerChange = (customerId) => {
    setSelectedCustomerId(customerId);
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

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.BranchId || !form.CustomerAccountId || !form.Remarks.trim()
      || !(Number(form.Value) > 0) || !(Number(form.Term) > 0) || !(Number(form.Rate) > 0)) {
      Swal.fire("Missing Fields", "Branch, account, value, term, rate, and remarks are all required.", "warning");
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
        Value: Number(form.Value),
        Term: Number(form.Term),
        Rate: Number(form.Rate),
        Remarks: form.Remarks,
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
            <Select value={selectedCustomerId} onValueChange={handleCustomerChange} disabled={loadingData}>
              <SelectTrigger><SelectValue placeholder={loadingData ? "Loading..." : "Search & select customer"} /></SelectTrigger>
              <SelectContent className="max-h-60 overflow-y-auto">
                {customers.map((c) => {
                  const name = [c.IndividualFirstName, c.IndividualLastName].filter(Boolean).join(" ")
                    || c.NonIndividualDescription || c.Description || `Customer ${c.Id}`;
                  return <SelectItem key={String(c.Id)} value={String(c.Id)}>{name}</SelectItem>;
                })}
              </SelectContent>
            </Select>
          </FieldGroup>
          <FieldGroup label={loadingAccounts ? "Loading accounts..." : "Customer Account"}>
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
            <Select value={form.FixedDepositTypeId} onValueChange={(v) => handleChange("FixedDepositTypeId", v)} disabled={loadingData}>
              <SelectTrigger><SelectValue placeholder={loadingData ? "Loading..." : "Select type"} /></SelectTrigger>
              <SelectContent className="max-h-60 overflow-y-auto">
                {fixedDepositTypes.map((t) => (
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
            <Input type="number" min="0" value={form.Value} onChange={(e) => handleChange("Value", e.target.value)} required placeholder="e.g. 100000" />
          </FieldGroup>
          <FieldGroup label="Term (Months)">
            <Input type="number" min="1" value={form.Term} onChange={(e) => handleChange("Term", e.target.value)} required placeholder="e.g. 12" />
          </FieldGroup>
          <FieldGroup label="Annual Percentage Rate">
            <Input type="number" min="0" step="0.01" value={form.Rate} onChange={(e) => handleChange("Rate", e.target.value)} required placeholder="e.g. 8.5" />
          </FieldGroup>
        </div>

        <FieldGroup label="Remarks">
          <Input value={form.Remarks} onChange={(e) => handleChange("Remarks", e.target.value)} required placeholder="Required" />
        </FieldGroup>

        <Button type="submit" disabled={loading || loadingData} className="w-full bg-indigo-600 hover:bg-indigo-700">
          {loading ? "Creating..." : "Create Fixed Deposit"}
        </Button>
      </form>
    </div>
  );
}
