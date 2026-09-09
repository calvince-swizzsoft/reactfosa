import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import EntryPickerModal from "./EntryPickerModal";
import TransferAccountLookup from "./TransferAccountLookup";
import { getTransferAccountBalances } from "../types/interAccountTransferApi";

export default function LedgerAccountSide({ label, onChange, disabled, initialValue }) {
  const [kind, setKind] = useState(initialValue?.customerAccountId ? "customer" : "gl");
  const [picker, setPicker] = useState(false);
  const [account, setAccount] = useState(null);
  const [ledgerLabel, setLedgerLabel] = useState(initialValue?.ledgerLabel || "");
  const [part, setPart] = useState("principal");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  useEffect(() => {
    if (!initialValue?.customerAccountId) return;
    let active = true;
    setLoading(true);
    getTransferAccountBalances(initialValue.customerAccountId).then((item) => {
      if (!active) return;
      setAccount(item);
      setPart(item.CustomerAccountTypeTargetProductInterestReceivableChartOfAccountId === initialValue.ledgerId ? "interest" : "principal");
    }).catch((err) => { if (active) setError(err.message); }).finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, []);
  const applyAccount = (item, component) => {
    const prefix = component === "interest" ? "CustomerAccountTypeTargetProductInterestReceivableChartOfAccount" : "CustomerAccountTypeTargetProductChartOfAccount";
    const ledgerId = item[`${prefix}Id`];
    if (!ledgerId || ledgerId === "00000000-0000-0000-0000-000000000000") {
      setError("This product does not have the required ledger configured.");
      setLedgerLabel(""); onChange(null); return;
    }
    setError("");
    const name = [item[`${prefix}Code`], item[`${prefix}Name`]].filter(Boolean).join(" — ");
    setLedgerLabel(name);
    onChange({ ledgerId, ledgerLabel: name, customerAccountId: item.Id, customerLabel: [item.CustomerFullName, item.FullAccountNumber].filter(Boolean).join(" — ") });
  };
  return <section className="border rounded-lg p-3 space-y-3">
    <h3 className="text-sm font-semibold text-gray-700">{label}</h3>
    <label className="block text-sm text-gray-700">Account type
      <select className="w-full border border-gray-300 rounded-md p-2 bg-white" value={kind} disabled={disabled || loading} onChange={(e) => { setKind(e.target.value); setAccount(null); setLedgerLabel(""); setPart("principal"); setError(""); onChange(null); }}>
        <option value="gl">G/L Account</option><option value="customer">Customer Account</option>
      </select>
    </label>
    <Button type="button" variant="outline" disabled={disabled || loading} onClick={() => setPicker(true)} className="w-full justify-start whitespace-normal text-left h-auto py-2">
      {loading ? "Loading account..." : account ? [account.CustomerFullName, account.FullAccountNumber, account.CustomerAccountTypeTargetProductDescription].filter(Boolean).join(" — ") : ledgerLabel || `Select ${kind === "gl" ? "G/L" : "customer"} account`}
    </Button>
    {account && Number(account.CustomerAccountTypeProductCode) === 2 && <label className="block text-sm text-gray-700">Loan component
      <select className="w-full border border-gray-300 rounded-md p-2 bg-white" value={part} disabled={disabled || loading} onChange={(e) => { setPart(e.target.value); applyAccount(account, e.target.value); }}><option value="principal">Principal</option><option value="interest">Interest</option></select>
    </label>}
    {account && ledgerLabel && <p className="text-xs text-gray-500">Ledger: {ledgerLabel}</p>}
    {error && <p role="alert" className="text-sm text-red-600">{error}</p>}
    {picker && kind === "gl" && <EntryPickerModal title={`Select ${label} G/L Account`} fetchUrl={`${import.meta.env.VITE_APP_FIN_URL}/api/accounts/chartofaccounts?pageSize=100`} getLabel={(item) => `${item.AccountCode} — ${item.AccountName}`} onClose={() => setPicker(false)} onSelect={(item) => { const name = `${item.AccountCode} — ${item.AccountName}`; setLedgerLabel(name); onChange({ ledgerId: item.Id, ledgerLabel: name, customerAccountId: null, customerLabel: "" }); }} />}
    {picker && kind === "customer" && <TransferAccountLookup onClose={() => setPicker(false)} onSelect={async (item) => {
      setPicker(false); setLoading(true); setError(""); setAccount(null); setLedgerLabel(""); onChange(null);
      try { const details = await getTransferAccountBalances(item.Id); setAccount(details); setPart("principal"); applyAccount(details, "principal"); }
      catch (err) { setError(err.message); }
      finally { setLoading(false); }
    }} />}
  </section>;
}
