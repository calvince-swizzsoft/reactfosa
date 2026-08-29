import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { apiErrorMessage, apiJson, normalizeList } from "@/lib/api";
import Swal from "sweetalert2";
import { listAllBanks } from "../../Administration/Banks/api";
import { listChartOfAccounts } from "../ChartOfAccounts/api";
import FieldHelp from "../SavingsProducts/FieldHelp";

const FIN_BASE = `${import.meta.env.VITE_APP_FIN_URL}`;
const COST_CENTERS_BASE = `${FIN_BASE}/api/accounts/costcenters`;

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

// bankName/branchDescription/chartOfAccountAccount* are plain denormalized
// display copies the CALLER sets — this controller does not look them up
// or validate them against the FK's current value
// (bank-linkage-api-spec.md §4). Auto-fill them from the picker's
// selection so they start in sync, but they're not re-derived server-side.
export default function BankLinkageForm({ form, setForm, loading, submitLabel, onSubmit }) {
  const [banks, setBanks] = useState([]);
  const [branches, setBranches] = useState([]);
  const [chartOfAccounts, setChartOfAccounts] = useState([]);
  const [costCenters, setCostCenters] = useState([]);
  const [loadingData, setLoadingData] = useState(true);

  useEffect(() => {
    setLoadingData(true);
    Promise.all([
      listAllBanks(),
      apiJson(`${FIN_BASE}/api/administration/branches`),
      listChartOfAccounts({ pageSize: 1000 }),
      apiJson(`${COST_CENTERS_BASE}?pageSize=1000`),
    ]).then(([bankData, branchData, coaPage, costCenterData]) => {
      setBanks(normalizeList(bankData));
      setBranches(normalizeList(branchData));
      setChartOfAccounts(coaPage?.pageCollection || coaPage?.PageCollection || []);
      setCostCenters(normalizeList(costCenterData));
    }).catch((error) => {
      setBanks([]);
      setBranches([]);
      setChartOfAccounts([]);
      setCostCenters([]);
      Swal.fire("Error", apiErrorMessage(error, "Unable to load bank-linkage options."), "error");
    }).finally(() => setLoadingData(false));
  }, []);

  const handleChange = (field, value) => setForm((p) => ({ ...p, [field]: value }));

  const handleBankChange = (bankId) => {
    const bank = banks.find((b) => b.Id === bankId);
    setForm((p) => ({ ...p, BankId: bankId, BankName: bank?.Description || "" }));
  };

  const handleBranchChange = (branchId) => {
    const branch = branches.find((b) => b.Id === branchId);
    setForm((p) => ({ ...p, BranchId: branchId, BranchDescription: branch?.Description || "" }));
  };

  const handleChartOfAccountChange = (chartOfAccountId) => {
    const coa = chartOfAccounts.find((c) => c.Id === chartOfAccountId);
    setForm((p) => ({
      ...p,
      ChartOfAccountId: chartOfAccountId,
      ChartOfAccountAccountType: coa?.AccountType ?? p.ChartOfAccountAccountType,
      ChartOfAccountAccountCode: coa?.AccountCode ?? p.ChartOfAccountAccountCode,
      ChartOfAccountAccountName: coa?.AccountName || "",
    }));
  };

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <FieldGroup label="Bank" help="The financial institution that owns the external bank account represented by this linkage.">
        <Select value={form.BankId} onValueChange={handleBankChange} disabled={loadingData}>
          <SelectTrigger><SelectValue placeholder={loadingData ? "Loading..." : "Select bank"} /></SelectTrigger>
          <SelectContent className="max-h-60 overflow-y-auto">
            {banks.map((b) => <SelectItem key={b.Id} value={b.Id}>{b.Description}</SelectItem>)}
          </SelectContent>
        </Select>
      </FieldGroup>

      <div className="grid grid-cols-2 gap-4">
        <FieldGroup label="Bank Account Number" help="The external account number held at the selected bank. It identifies the real bank account being linked.">
          <Input value={form.BankAccountNumber} onChange={(e) => handleChange("BankAccountNumber", e.target.value)} required />
        </FieldGroup>
        <FieldGroup label="Bank's Branch Name" help="The external bank's own branch name, such as Westlands. This is not one of your organisation's branches.">
          {/* The external bank's own branch — not one of our own branches. */}
          <Input value={form.BankBranchName} onChange={(e) => handleChange("BankBranchName", e.target.value)} required placeholder="e.g. Westlands" />
        </FieldGroup>
      </div>

      <FieldGroup label="Our Branch" help="The organisation branch that owns and operates this bank linkage. Transactions use this branch for operational context.">
        <Select value={form.BranchId} onValueChange={handleBranchChange} disabled={loadingData}>
          <SelectTrigger><SelectValue placeholder={loadingData ? "Loading..." : "Select branch"} /></SelectTrigger>
          <SelectContent className="max-h-60 overflow-y-auto">
            {branches.map((b) => <SelectItem key={b.Id} value={b.Id}>{b.Description}</SelectItem>)}
          </SelectContent>
        </Select>
      </FieldGroup>

      <FieldGroup label="Chart of Account" help="The postable G/L control account against which deposits, withdrawals, reconciliation, and other bank movements are recorded.">
        <Select value={form.ChartOfAccountId} onValueChange={handleChartOfAccountChange} disabled={loadingData}>
          <SelectTrigger><SelectValue placeholder={loadingData ? "Loading..." : "Select account"} /></SelectTrigger>
          <SelectContent className="max-h-60 overflow-y-auto">
            {chartOfAccounts.map((c) => (
              <SelectItem key={c.Id} value={c.Id}>{c.AccountCode} — {c.AccountName}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </FieldGroup>

      <FieldGroup label="Cost Center (optional)" help="Optional reporting and allocation dimension associated with the linkage's G/L account.">
        <Select value={form.ChartOfAccountCostCenterId || ""} onValueChange={(v) => handleChange("ChartOfAccountCostCenterId", v)} disabled={loadingData}>
          <SelectTrigger><SelectValue placeholder={loadingData ? "Loading..." : "None"} /></SelectTrigger>
          <SelectContent className="max-h-60 overflow-y-auto">
            {costCenters.map((c) => <SelectItem key={c.Id} value={c.Id}>{c.Description}</SelectItem>)}
          </SelectContent>
        </Select>
      </FieldGroup>

      <FieldGroup label="Remarks" help="Optional internal description or operational note for identifying this linkage.">
        <Input value={form.Remarks} onChange={(e) => handleChange("Remarks", e.target.value)} placeholder="Optional" />
      </FieldGroup>

      <div className="flex items-center gap-1">
        <label htmlFor="banklinkage-locked" className="flex items-center gap-2 cursor-pointer text-sm font-medium text-gray-700">
          <input
            type="checkbox"
            id="banklinkage-locked"
            checked={form.IsLocked}
            onChange={(e) => handleChange("IsLocked", e.target.checked)}
            className="w-4 h-4 accent-indigo-600"
          />
          Is Locked?
        </label>
        <FieldHelp label="Is Locked">Marks the linkage inactive so it should not be available for new operational bank transactions.</FieldHelp>
      </div>

      <Button type="submit" disabled={loading || loadingData} className="w-full bg-indigo-600 hover:bg-indigo-700">
        {loading ? "Saving..." : submitLabel}
      </Button>
    </form>
  );
}
