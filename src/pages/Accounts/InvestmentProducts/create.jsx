import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { FaChartLine } from "react-icons/fa";
import Swal from "sweetalert2";
import { listAllChartOfAccounts } from "@/pages/Accounts/ChartOfAccounts/api";
import { apiErrorMessage, apiJson } from "@/lib/api";
import FieldHelp from "../SavingsProducts/FieldHelp";
import { investmentProductPayload, investmentProductValidationAlert, validateInvestmentProduct } from "./validation";

const BASE = `${import.meta.env.VITE_APP_FIN_URL}`;

const emptyForm = {
  Description: "",
  MinimumBalance: "",
  MaximumBalance: "",
  PoolAmount: "0",
  MaturityPeriod: "",
  AnnualPercentageYield: "",
  Priority: "1",
  ChartOfAccountId: "",
  PoolChartOfAccountId: "",
  IsRefundable: false,
  IsPooled: false,
  IsSuperSaver: false,
  IsMandatory: false,
  TrackArrears: false,
  ThrottleScheduledArrearsRecovery: false,
  IsLocked: false,
};

function FieldGroup({ label, help, children }) {
  return (
    <div>
      <div className="flex items-center gap-1"><Label className="text-sm font-semibold text-gray-700">{label}</Label><FieldHelp label={label}>{help}</FieldHelp></div>
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

export default function CreateInvestmentProduct() {
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
    const validationErrors = validateInvestmentProduct(form);
    if (validationErrors.length) { Swal.fire(investmentProductValidationAlert(validationErrors)); return; }
    setLoading(true);
    try {
      const payload = investmentProductPayload(form);
      await apiJson(`${BASE}/api/accounts/investmentsproducts`, {
        method: "POST",
        body: JSON.stringify(payload),
      }, { fallbackMessage: "Unable to create the investment product." });
      Swal.fire("Success", "Investment product created successfully", "success");
      setForm(emptyForm);
    } catch (err) {
      Swal.fire("Error", apiErrorMessage(err, "Unable to create the investment product."), "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white m-8 px-8 py-8 shadow-2xl rounded-lg relative">
      <div className="flex items-center justify-between gap-3 mb-6 bg-indigo-700 px-6 py-3 rounded-2xl">
        <div className="flex items-center gap-3">
          <FaChartLine className="text-white text-xl" />
          <h2 className="text-xl font-bold text-white">Create Investment Product</h2>
        </div>
        <Link to="/Accounts/InvestmentProducts" className="text-sm text-white/80 hover:text-white">
          &larr; Back to Investment Products
        </Link>
      </div>

      <form onSubmit={handleSubmit} className="max-w-2xl space-y-4">
        <FieldGroup label="Description" help="Name shown on member investment accounts and reports.">
          <Input value={form.Description} onChange={(e) => handleChange("Description", e.target.value)} required maxLength={256} placeholder="e.g. FIXED DEPOSIT" />
        </FieldGroup>

        <div className="grid grid-cols-2 gap-3">
          <FieldGroup label="Minimum Balance" help="Target minimum balance used by product balancing and recovery processes.">
            <NumInput field="MinimumBalance" value={form.MinimumBalance} onChange={handleChange} />
          </FieldGroup>
          <FieldGroup label="Maximum Balance" help="Maximum balance this investment account should hold.">
            <NumInput field="MaximumBalance" value={form.MaximumBalance} onChange={handleChange} />
          </FieldGroup>
          <FieldGroup label="Maturity Period (days)" help="Number of days before invested funds are treated as mature.">
            <NumInput field="MaturityPeriod" value={form.MaturityPeriod} onChange={handleChange} />
          </FieldGroup>
          <FieldGroup label="Annual Percentage Yield (%)" help="Annual return rate, between 0% and 100%.">
            <NumInput field="AnnualPercentageYield" value={form.AnnualPercentageYield} onChange={handleChange} />
          </FieldGroup>
          <FieldGroup label="Recovery Priority" help="Recovery category: 0 Loans, 1 Investments, 2 Savings, or 3 Direct Debits.">
            <NumInput field="Priority" value={form.Priority} onChange={handleChange} />
          </FieldGroup>
          <FieldGroup label="Pool Amount" help="Target amount assigned to the pool; required above zero for pooled products.">
            <NumInput field="PoolAmount" value={form.PoolAmount} onChange={handleChange} />
          </FieldGroup>
        </div>

        <FieldGroup label="Chart of Account" help="Required G/L control account for this investment product.">
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

        {form.IsPooled && <FieldGroup label="Pool G/L Account" help="G/L account used for pooled-fund movements."><Select value={form.PoolChartOfAccountId} onValueChange={(v) => handleChange("PoolChartOfAccountId", v)} disabled={loadingData}><SelectTrigger><SelectValue placeholder="Select Pool G/L Account" /></SelectTrigger><SelectContent className="max-h-60 overflow-y-auto">{coaList.map((c) => <SelectItem key={c.Id} value={c.Id}>{c.AccountCode} — {c.AccountName}</SelectItem>)}</SelectContent></Select></FieldGroup>}

        <div className="grid grid-cols-2 gap-3">{[["IsRefundable","Refundable","Allows the investment balance to be refunded."],["IsPooled","Pooled","Uses a separate pooled-funds G/L account."],["IsSuperSaver","Super Saver","Marks the product for Super Saver processing."],["IsMandatory","Mandatory","Automatically attaches this product to eligible members."],["TrackArrears","Track Arrears","Tracks missed scheduled investment contributions."],["ThrottleScheduledArrearsRecovery","Throttle Recovery","Limits scheduled arrears recovery; requires Track Arrears."],["IsLocked","Locked","Prevents the product from normal active use."]].map(([field,label,help]) => <div key={field} className="flex items-center gap-1"><label className="flex items-center gap-2 cursor-pointer"><input type="checkbox" checked={form[field]} onChange={(e) => handleChange(field,e.target.checked)} className="w-4 h-4 accent-indigo-600"/><span className="text-sm font-medium">{label}</span></label><FieldHelp label={label}>{help}</FieldHelp></div>)}</div>

        <Button type="submit" disabled={loading || loadingData} className="bg-indigo-600 hover:bg-indigo-700">
          {loading ? "Saving..." : "Create Investment Product"}
        </Button>
      </form>
    </div>
  );
}
