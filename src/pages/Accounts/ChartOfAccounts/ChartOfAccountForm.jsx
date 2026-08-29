import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { CHART_OF_ACCOUNT_TYPE_OPTIONS, CHART_OF_ACCOUNT_CATEGORY_OPTIONS } from "./enums";
import FieldHelp from "../SavingsProducts/FieldHelp";

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

// Shared by create.jsx and index.jsx's edit drawer — one form for the
// full ChartOfAccountDTO shape (docs/api/chartofaccount-api-spec.md §2).
// `parentOptions` is the flattened GET /tree result: [{ Id, Description,
// Depth, TypeDescription }], used both for the Parent picker and to look
// up the inherited Account Type once a parent is selected.
export default function ChartOfAccountForm({
  form, onChange, parentOptions, costCenters, loading, loadingData, submitLabel, onSubmit,
}) {
  const selectedParent = parentOptions.find((p) => p.Id === form.ParentId);

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <FieldGroup label="Parent Account" help="Places this account in the G/L hierarchy. Child accounts inherit the parent's Account Type; choose No Parent only for a root account.">
        <Select
          value={form.ParentId || "__root__"}
          onValueChange={(v) => onChange("ParentId", v === "__root__" ? "" : v)}
          disabled={loadingData}
        >
          <SelectTrigger><SelectValue placeholder={loadingData ? "Loading..." : "Select parent"} /></SelectTrigger>
          <SelectContent className="max-h-60 overflow-y-auto">
            <SelectItem value="__root__">No Parent (Root Account)</SelectItem>
            {parentOptions.map((p) => (
              <SelectItem key={p.Id} value={p.Id}>
                {"— ".repeat(p.Depth || 0)}{p.Code} — {p.Description}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </FieldGroup>

      {/* Account Type is only meaningful/editable on a root account — a
          child always inherits its parent's type server-side regardless
          of what's sent, per chartofaccount-api-spec.md §2/§4. */}
      {form.ParentId ? (
        <FieldGroup label="Account Type" help="Classifies the root account as Asset, Liability, Equity, Income, or Expense. A child account always inherits this from its parent.">
          <p className="text-sm text-gray-600 border rounded-md px-3 py-2 bg-gray-50">
            Inherits: {selectedParent?.TypeDescription || "—"}
          </p>
        </FieldGroup>
      ) : (
        <FieldGroup label="Account Type" help="Controls the account's major financial-statement classification. This is selected only for root accounts; descendants inherit it.">
          <Select value={String(form.AccountType)} onValueChange={(v) => onChange("AccountType", Number(v))}>
            <SelectTrigger><SelectValue placeholder="Select account type" /></SelectTrigger>
            <SelectContent>
              {CHART_OF_ACCOUNT_TYPE_OPTIONS.map((o) => (
                <SelectItem key={o.value} value={String(o.value)}>{o.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </FieldGroup>
      )}

      <FieldGroup label="Account Category" help="Header accounts organize the hierarchy and are non-postable. Detail accounts are the posting-level ledger accounts used by transactions.">
        <Select value={String(form.AccountCategory)} onValueChange={(v) => onChange("AccountCategory", Number(v))}>
          <SelectTrigger><SelectValue placeholder="Select category" /></SelectTrigger>
          <SelectContent>
            {CHART_OF_ACCOUNT_CATEGORY_OPTIONS.map((o) => (
              <SelectItem key={o.value} value={String(o.value)}>{o.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </FieldGroup>

      <div className="grid grid-cols-2 gap-3">
        <FieldGroup label="Account Code" help="Unique numeric identifier for this G/L account. The API rejects a code already assigned to another account.">
          <Input type="number" value={form.AccountCode} onChange={(e) => onChange("AccountCode", e.target.value)} required placeholder="e.g. 1001" />
        </FieldGroup>
        <FieldGroup label="Account Name" help="Human-readable ledger name shown in account pickers, journals, statements, and reports.">
          <Input value={form.AccountName} onChange={(e) => onChange("AccountName", e.target.value)} required placeholder="e.g. Vault Cash" />
        </FieldGroup>
      </div>

      <FieldGroup label={loadingData ? "Loading..." : "Cost Center"} help="Optional reporting and allocation dimension for a non-control account. Control accounts cannot retain a Cost Center.">
        <Select
          value={form.CostCenterId || "__none__"}
          onValueChange={(v) => onChange("CostCenterId", v === "__none__" ? "" : v)}
          disabled={loadingData || form.IsControlAccount}
        >
          <SelectTrigger>
            <SelectValue placeholder={form.IsControlAccount ? "Not applicable (control account)" : "None"} />
          </SelectTrigger>
          <SelectContent className="max-h-60 overflow-y-auto">
            <SelectItem value="__none__">None</SelectItem>
            {costCenters.map((c) => (
              <SelectItem key={c.Id} value={c.Id}>{c.Description}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </FieldGroup>

      <div className="grid grid-cols-2 gap-3">
        <div className="flex items-center gap-1">
          <label className="flex items-center gap-2 cursor-pointer text-sm font-medium text-gray-700"><input type="checkbox" checked={form.IsControlAccount} onChange={(e) => { const checked = e.target.checked; onChange("IsControlAccount", checked); if (checked) onChange("CostCenterId", ""); }} className="w-4 h-4 accent-indigo-600" />Control Account</label>
          <FieldHelp label="Control Account">Marks an aggregate or supervisory G/L account. The business layer automatically removes any Cost Center assignment from control accounts.</FieldHelp>
        </div>
        <div className="flex items-center gap-1">
          <label className="flex items-center gap-2 cursor-pointer text-sm font-medium text-gray-700"><input type="checkbox" checked={form.IsReconciliationAccount} onChange={(e) => onChange("IsReconciliationAccount", e.target.checked)} className="w-4 h-4 accent-indigo-600" />Reconciliation Account</label>
          <FieldHelp label="Reconciliation Account">Identifies a G/L account intended to be matched against an external or supporting balance during reconciliation.</FieldHelp>
        </div>
        <div className="flex items-center gap-1">
          <label className="flex items-center gap-2 cursor-pointer text-sm font-medium text-gray-700"><input type="checkbox" checked={form.PostAutomaticallyOnly} onChange={(e) => onChange("PostAutomaticallyOnly", e.target.checked)} className="w-4 h-4 accent-indigo-600" />Post Automatically Only</label>
          <FieldHelp label="Post Automatically Only">Marks the account for system-generated postings rather than ordinary manual journal selection.</FieldHelp>
        </div>
        <div className="flex items-center gap-1">
          <label className="flex items-center gap-2 cursor-pointer text-sm font-medium text-gray-700"><input type="checkbox" checked={form.IsLocked} onChange={(e) => onChange("IsLocked", e.target.checked)} className="w-4 h-4 accent-indigo-600" />Is Locked?</label>
          <FieldHelp label="Is Locked">Marks the account inactive so it should not be used for new operational postings.</FieldHelp>
        </div>
      </div>

      <Button type="submit" disabled={loading || loadingData} className="w-full bg-indigo-600 hover:bg-indigo-700">
        {loading ? "Saving..." : submitLabel}
      </Button>
    </form>
  );
}
