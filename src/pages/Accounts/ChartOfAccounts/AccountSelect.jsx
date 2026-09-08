import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { FaPlus } from "react-icons/fa";
import QuickCreateDrawer from "./QuickCreateDrawer";

export default function AccountSelect({ accounts, value, nameFallback, onChange, disabled, label = "Chart of Account" }) {
  const [creating, setCreating] = useState(false);
  const [createdAccounts, setCreatedAccounts] = useState([]);
  const options = [...accounts, ...createdAccounts.filter((item) => !accounts.some((account) => account.Id === item.Id))];
  const selected = options.find((account) => account.Id === value);
  const selectedLabel = selected ? `${selected.AccountCode} — ${selected.AccountName}` : nameFallback;

  return (
    <>
      <div className="flex items-start gap-2">
        <div className="min-w-0 flex-1">
          <Select value={value || ""} onValueChange={(id) => onChange(id, options.find((account) => account.Id === id))} disabled={disabled}>
            <SelectTrigger aria-label={label}>
              <SelectValue placeholder={disabled ? "Loading..." : `Select ${label}`}>
                {selectedLabel || (disabled ? "Loading..." : `Select ${label}`)}
              </SelectValue>
            </SelectTrigger>
            <SelectContent className="max-h-60 overflow-y-auto">
              {options.map((account) => <SelectItem key={account.Id} value={account.Id}>{account.AccountCode} — {account.AccountName}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <Button type="button" variant="outline" onClick={() => setCreating(true)} aria-label={`Add ${label}`} className="shrink-0 text-indigo-700">
          <FaPlus className="mr-1" /> Add
        </Button>
      </div>
      <QuickCreateDrawer open={creating} onClose={() => setCreating(false)} onCreated={(account) => {
        setCreatedAccounts((current) => [...current.filter((item) => item.Id !== account.Id), account]);
        onChange(account.Id, account);
      }} />
    </>
  );
}
