import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { FaFileInvoiceDollar } from "react-icons/fa";
import Swal from "sweetalert2";
import { apiFetch, normalizeList } from "@/lib/api";
import { createExpensePayable } from "../expensePayablesApi";
import { ExpensePayableType } from "../../lib/frontOfficeEnums";

// Header create only (Pending) — entry lines are added afterward from the
// list page's detail drawer, matching the real sequence
// (ExpensePayableController.cs: Create -> Pending; add entries; Verify).
const FIN_BASE = `${import.meta.env.VITE_APP_FIN_URL}`;
const MODULE_NAVIGATION_ITEM_CODE = 25013;

const TYPE_OPTIONS = [
  { value: ExpensePayableType.DebitGLAccount, label: "Debit G/L Account" },
  { value: ExpensePayableType.CreditGLAccount, label: "Credit G/L Account" },
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
  BranchId: "", ChartOfAccountId: "", Type: ExpensePayableType.DebitGLAccount,
  TotalValue: "", ValueDate: new Date().toISOString().slice(0, 10), Remarks: "",
};

export default function CreateExpensePayable() {
  const navigate = useNavigate();
  const [form, setForm] = useState(emptyForm);
  const [branches, setBranches] = useState([]);
  const [chartOfAccounts, setChartOfAccounts] = useState([]);
  const [loadingData, setLoadingData] = useState(true);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setLoadingData(true);
    Promise.all([
      apiFetch(`${FIN_BASE}/api/administration/branches`).then((r) => r.json()),
      apiFetch(`${FIN_BASE}/api/accounts/chartofaccounts?pageSize=1000`).then((r) => r.json()),
    ]).then(([branchData, coaData]) => {
      setBranches(normalizeList(branchData));
      setChartOfAccounts(normalizeList(coaData));
    }).catch(() => { }).finally(() => setLoadingData(false));
  }, []);

  const handleChange = (field, value) => setForm((p) => ({ ...p, [field]: value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.BranchId || !form.ChartOfAccountId || !form.ValueDate || !(Number(form.TotalValue) > 0)) {
      Swal.fire("Missing Fields", "Branch, G/L account, value date, and a positive total value are required.", "warning");
      return;
    }
    setLoading(true);
    try {
      await createExpensePayable({
        BranchId: form.BranchId,
        ChartOfAccountId: form.ChartOfAccountId,
        Type: form.Type,
        TotalValue: Number(form.TotalValue),
        ValueDate: new Date(form.ValueDate).toISOString(),
        Remarks: form.Remarks,
        ModuleNavigationItemCode: MODULE_NAVIGATION_ITEM_CODE,
      });
      Swal.fire("Success", "Expense payable created — add entry lines from the list before verifying.", "success");
      navigate("/FrontOffice/ExpensePayables");
    } catch (err) {
      Swal.fire("Error", err.message, "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white m-8 px-8 py-8 shadow-2xl rounded-lg relative">
      <div className="flex items-center justify-between gap-3 mb-6 bg-indigo-800 px-6 py-3 rounded-2xl">
        <div className="flex items-center gap-3">
          <FaFileInvoiceDollar className="text-white text-xl" />
          <h2 className="text-xl font-bold text-white">New Expense Payable</h2>
        </div>
        <Link to="/FrontOffice/ExpensePayables" className="text-sm text-white/80 hover:text-white">
          &larr; Back to Expense Payables
        </Link>
      </div>

      <form onSubmit={handleSubmit} className="max-w-2xl space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <FieldGroup label={loadingData ? "Loading..." : "Branch"}>
            <Select value={form.BranchId} onValueChange={(v) => handleChange("BranchId", v)} disabled={loadingData}>
              <SelectTrigger><SelectValue placeholder="Select branch" /></SelectTrigger>
              <SelectContent className="max-h-60 overflow-y-auto">
                {branches.map((b) => <SelectItem key={String(b.Id)} value={String(b.Id)}>{b.Description}</SelectItem>)}
              </SelectContent>
            </Select>
          </FieldGroup>
          <FieldGroup label={loadingData ? "Loading..." : "G/L Account"}>
            <Select value={form.ChartOfAccountId} onValueChange={(v) => handleChange("ChartOfAccountId", v)} disabled={loadingData}>
              <SelectTrigger><SelectValue placeholder="Select account" /></SelectTrigger>
              <SelectContent className="max-h-60 overflow-y-auto">
                {chartOfAccounts.map((a) => <SelectItem key={String(a.Id)} value={String(a.Id)}>{a.AccountCode} — {a.AccountName}</SelectItem>)}
              </SelectContent>
            </Select>
          </FieldGroup>
          <FieldGroup label="Type">
            <Select value={String(form.Type)} onValueChange={(v) => handleChange("Type", Number(v))}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {TYPE_OPTIONS.map((o) => <SelectItem key={o.value} value={String(o.value)}>{o.label}</SelectItem>)}
              </SelectContent>
            </Select>
          </FieldGroup>
          <FieldGroup label="Total Value">
            <Input type="number" min="0" value={form.TotalValue} onChange={(e) => handleChange("TotalValue", e.target.value)} required placeholder="e.g. 25000" />
          </FieldGroup>
          <FieldGroup label="Value Date">
            <Input type="date" value={form.ValueDate} onChange={(e) => handleChange("ValueDate", e.target.value)} required />
          </FieldGroup>
        </div>

        <FieldGroup label="Remarks">
          <Input value={form.Remarks} onChange={(e) => handleChange("Remarks", e.target.value)} placeholder="Optional" />
        </FieldGroup>

        <Button type="submit" disabled={loading || loadingData} className="w-full bg-indigo-600 hover:bg-indigo-700">
          {loading ? "Creating..." : "Create Expense Payable"}
        </Button>
      </form>
    </div>
  );
}
