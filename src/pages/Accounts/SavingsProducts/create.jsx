import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { FaPiggyBank } from "react-icons/fa";
import Swal from "sweetalert2";
import { listAllChartOfAccounts } from "@/pages/Accounts/ChartOfAccounts/api";
import { apiErrorMessage, apiJson } from "@/lib/api";
import { savingsProductPayload, savingsProductValidationAlert, validateSavingsProduct } from "./validation";
import FieldHelp from "./FieldHelp";

const BASE = `${import.meta.env.VITE_APP_FIN_URL}`;

const emptyForm = {
  Description: "",
  MaximumAllowedWithdrawal: "",
  MaximumAllowedDeposit: "",
  MinimumBalance: "",
  OperatingBalance: "",
  WithdrawalNoticeAmount: "",
  WithdrawalNoticePeriod: "",
  WithdrawalInterval: "",
  AnnualPercentageYield: "",
  Priority: 0,
  ChartOfAccountId: "",
  IsMandatory: false,
  IsDefault: false,
};

function FieldGroup({ label, help, children }) {
  return (
    <div>
      <div className="flex items-center gap-1">
        <Label className="text-sm font-semibold text-gray-700">{label}</Label>
        <FieldHelp label={label}>{help}</FieldHelp>
      </div>
      {children}
    </div>
  );
}

function NumInput({ field, value, onChange, placeholder }) {
  return (
    <Input
      type="number"
      min="0"
      step="any"
      required
      value={value}
      onChange={(e) => onChange(field, e.target.value)}
      placeholder={placeholder || ""}
    />
  );
}

export default function CreateSavingsProduct() {
  const [form, setForm] = useState(emptyForm);
  const [loading, setLoading] = useState(false);
  const [coaList, setCoaList] = useState([]);
  const [loadingData, setLoadingData] = useState(false);

  useEffect(() => {
    setLoadingData(true);
    listAllChartOfAccounts()
      .then(setCoaList)
      .catch(() => setCoaList([]))
      .finally(() => setLoadingData(false));
  }, []);

  const handleChange = (field, value) => setForm((p) => ({ ...p, [field]: value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    const validationErrors = validateSavingsProduct(form);
    if (validationErrors.length) {
      Swal.fire(savingsProductValidationAlert(validationErrors));
      return;
    }
    setLoading(true);
    try {
      const payload = savingsProductPayload(form);
      await apiJson(`${BASE}/api/accounts/savingsproducts`, {
        method: "POST",
        body: JSON.stringify(payload),
      }, { fallbackMessage: "Unable to create the savings product." });
      Swal.fire("Success", "Savings product created successfully", "success");
      setForm(emptyForm);
    } catch (err) {
      Swal.fire("Error", apiErrorMessage(err, "Unable to create the savings product."), "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white m-8 px-8 py-8 shadow-2xl rounded-lg relative">
      <div className="flex items-center justify-between gap-3 mb-6 bg-indigo-700 px-6 py-3 rounded-2xl">
        <div className="flex items-center gap-3">
          <FaPiggyBank className="text-white text-xl" />
          <h2 className="text-xl font-bold text-white">Create Savings Product</h2>
        </div>
        <Link to="/Accounts/SavingsProducts" className="text-sm text-white/80 hover:text-white">
          &larr; Back to Savings Products
        </Link>
      </div>

      <form onSubmit={handleSubmit} className="max-w-2xl space-y-4">
        <FieldGroup label="Description" help="The name shown on member accounts, transaction screens, and reports.">
          <Input value={form.Description} onChange={(e) => handleChange("Description", e.target.value)} required placeholder="e.g. ORDINARY SAVINGS" />
        </FieldGroup>

        <div className="grid grid-cols-2 gap-3">
          <FieldGroup label="Max Allowed Withdrawal" help="Largest permitted single withdrawal. Must be greater than zero.">
            <NumInput field="MaximumAllowedWithdrawal" value={form.MaximumAllowedWithdrawal} onChange={handleChange} />
          </FieldGroup>
          <FieldGroup label="Max Allowed Deposit" help="Largest permitted single deposit. Must be greater than zero.">
            <NumInput field="MaximumAllowedDeposit" value={form.MaximumAllowedDeposit} onChange={handleChange} />
          </FieldGroup>
          <FieldGroup label="Minimum Balance" help="Protected balance expected to remain after withdrawals.">
            <NumInput field="MinimumBalance" value={form.MinimumBalance} onChange={handleChange} />
          </FieldGroup>
          <FieldGroup label="Operating Balance" help="Normal operating target; cannot be below the minimum balance. Currently stored but not transaction-enforced.">
            <NumInput field="OperatingBalance" value={form.OperatingBalance} onChange={handleChange} />
          </FieldGroup>
          <FieldGroup label="Withdrawal Notice Amount" help="Withdrawals above this amount require notice or may attract a without-notice charge.">
            <NumInput field="WithdrawalNoticeAmount" value={form.WithdrawalNoticeAmount} onChange={handleChange} />
          </FieldGroup>
          <FieldGroup label="Withdrawal Notice Period (days)" help="Business days before a future withdrawal notice matures.">
            <NumInput field="WithdrawalNoticePeriod" value={form.WithdrawalNoticePeriod} onChange={handleChange} />
          </FieldGroup>
          <FieldGroup label="Withdrawal Interval (days)" help="Minimum days between withdrawals; early withdrawal may attract a charge.">
            <NumInput field="WithdrawalInterval" value={form.WithdrawalInterval} onChange={handleChange} />
          </FieldGroup>
          <FieldGroup label="Annual Percentage Yield (%)" help="Displayed annual return rate, from 0% to 100%. Interest accrual is not currently automated from this value.">
            <NumInput field="AnnualPercentageYield" value={form.AnnualPercentageYield} onChange={handleChange} />
          </FieldGroup>
          <FieldGroup label="Recovery Priority" help="Recovery category: 0 Loans, 1 Investments, 2 Savings, or 3 Direct Debits.">
            <NumInput field="Priority" value={form.Priority} onChange={handleChange} />
          </FieldGroup>
        </div>

        <FieldGroup label="Chart of Account" help="Required G/L control account used for this product's financial postings.">
          <Select value={form.ChartOfAccountId} onValueChange={(v) => handleChange("ChartOfAccountId", v)} disabled={loadingData}>
            <SelectTrigger><SelectValue placeholder={loadingData ? "Loading..." : "Select Chart of Account"} /></SelectTrigger>
            <SelectContent className="max-h-60 overflow-y-auto">
              {coaList.map((c) => (
                <SelectItem key={c.Id} value={c.Id}>
                  {c.AccountCode} — {c.AccountName}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </FieldGroup>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <div className="flex items-center gap-1">
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={form.IsMandatory} onChange={(e) => handleChange("IsMandatory", e.target.checked)} className="w-4 h-4 accent-indigo-600" />
                <span className="text-sm font-medium">Is Mandatory</span>
              </label>
              <FieldHelp label="Is Mandatory">Marks this product for automatic member-account attachment.</FieldHelp>
            </div>
          </div>
          <div>
            <div className="flex items-center gap-1">
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={form.IsDefault} onChange={(e) => handleChange("IsDefault", e.target.checked)} className="w-4 h-4 accent-indigo-600" />
                <span className="text-sm font-medium">Is Default</span>
              </label>
              <FieldHelp label="Is Default">Primary fallback savings product. Only one product should be default.</FieldHelp>
            </div>
          </div>
        </div>

        <Button type="submit" disabled={loading || loadingData} className="bg-indigo-600 hover:bg-indigo-700">
          {loading ? "Saving..." : "Create Savings Product"}
        </Button>
      </form>
    </div>
  );
}
