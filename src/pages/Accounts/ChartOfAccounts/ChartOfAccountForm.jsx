import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { CHART_OF_ACCOUNT_TYPE_OPTIONS, CHART_OF_ACCOUNT_CATEGORY_OPTIONS } from "./enums";

function FieldGroup({ label, children }) {
  return (
    <div>
      <Label>{label}</Label>
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
      <FieldGroup label="Parent Account">
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
        <FieldGroup label="Account Type">
          <p className="text-sm text-gray-600 border rounded-md px-3 py-2 bg-gray-50">
            Inherits: {selectedParent?.TypeDescription || "—"}
          </p>
        </FieldGroup>
      ) : (
        <FieldGroup label="Account Type">
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

      <FieldGroup label="Account Category">
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
        <FieldGroup label="Account Code">
          <Input type="number" value={form.AccountCode} onChange={(e) => onChange("AccountCode", e.target.value)} required placeholder="e.g. 1001" />
        </FieldGroup>
        <FieldGroup label="Account Name">
          <Input value={form.AccountName} onChange={(e) => onChange("AccountName", e.target.value)} required placeholder="e.g. Vault Cash" />
        </FieldGroup>
      </div>

      <FieldGroup label={loadingData ? "Loading..." : "Cost Center"}>
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
        <label className="flex items-center gap-2 cursor-pointer text-sm font-medium text-gray-700">
          <input
            type="checkbox"
            checked={form.IsControlAccount}
            onChange={(e) => {
              const checked = e.target.checked;
              onChange("IsControlAccount", checked);
              // Server forces CostCenterId to null whenever IsControlAccount
              // is true regardless of what's sent — clear it here too so the
              // form doesn't imply a value that won't actually be saved.
              if (checked) onChange("CostCenterId", "");
            }}
            className="w-4 h-4 accent-indigo-600"
          />
          Control Account
        </label>
        <label className="flex items-center gap-2 cursor-pointer text-sm font-medium text-gray-700">
          <input
            type="checkbox"
            checked={form.IsReconciliationAccount}
            onChange={(e) => onChange("IsReconciliationAccount", e.target.checked)}
            className="w-4 h-4 accent-indigo-600"
          />
          Reconciliation Account
        </label>
        <label className="flex items-center gap-2 cursor-pointer text-sm font-medium text-gray-700">
          <input
            type="checkbox"
            checked={form.PostAutomaticallyOnly}
            onChange={(e) => onChange("PostAutomaticallyOnly", e.target.checked)}
            className="w-4 h-4 accent-indigo-600"
          />
          Post Automatically Only
        </label>
        <label className="flex items-center gap-2 cursor-pointer text-sm font-medium text-gray-700">
          <input
            type="checkbox"
            checked={form.IsLocked}
            onChange={(e) => onChange("IsLocked", e.target.checked)}
            className="w-4 h-4 accent-indigo-600"
          />
          Is Locked?
        </label>
      </div>

      <Button type="submit" disabled={loading || loadingData} className="w-full bg-indigo-600 hover:bg-indigo-700">
        {loading ? "Saving..." : submitLabel}
      </Button>
    </form>
  );
}
