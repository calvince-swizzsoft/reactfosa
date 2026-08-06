import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import Swal from "sweetalert2";
import { FaMoneyCheckAlt } from "react-icons/fa";
import { apiFetch, normalizeList } from "@/lib/api";
import { createTransaction } from "./requestsApi";
import { FrontOfficeTransactionType } from "../lib/frontOfficeEnums";
import ReceiptModal from "../lib/ReceiptModal";

const FIN_BASE = `${import.meta.env.VITE_APP_FIN_URL}`;

// Cheque deposits are NOT a queue like Cash Deposit/Withdrawal — confirmed
// against the real CashDepositController: the ChequeDeposit branch in
// ProcessCustomerTransactionAsync never checks a limit or creates a
// pending CashDepositRequest, it always creates the ExternalCheque +
// posts the journal in the same call (WORKFLOW.md §5: "Cheque deposit —
// Always posts directly"). GET / also only ever returns rows for
// type=1/2, so there's no request queue to list here even if we wanted
// one. This is a single-shot form; the resulting cheque then lives in the
// cheque lifecycle (Catalogue/BankCheques/ClearCheques — §1E), not here.

function FieldGroup({ label, children }) {
  return (
    <div>
      <Label className="text-sm font-semibold text-gray-700">{label}</Label>
      {children}
    </div>
  );
}

const emptyForm = {
  BranchId: "",
  CreditCustomerAccountId: "",
  TotalValue: "",
  Drawer: "",
  DrawerBank: "",
  DrawerBankBranch: "",
  ChequeType: "",
  WriteDate: "",
  Remarks: "",
};

export default function ChequeDeposit() {
  const [form, setForm] = useState(emptyForm);
  const [loading, setLoading] = useState(false);
  const [loadingData, setLoadingData] = useState(false);
  const [customers, setCustomers] = useState([]);
  const [branches, setBranches] = useState([]);
  const [selectedCustomerId, setSelectedCustomerId] = useState("");
  const [accounts, setAccounts] = useState([]);
  const [loadingAccounts, setLoadingAccounts] = useState(false);
  const [receiptJournal, setReceiptJournal] = useState(null);

  useEffect(() => {
    setLoadingData(true);
    Promise.all([
      apiFetch(`${FIN_BASE}/api/registry/customers`).then((r) => r.json()),
      apiFetch(`${FIN_BASE}/api/administration/branches`).then((r) => r.json()),
    ]).then(([customerData, branchData]) => {
      setCustomers(normalizeList(customerData));
      setBranches(normalizeList(branchData));
    }).catch(() => { }).finally(() => setLoadingData(false));
  }, []);

  const handleCustomerChange = (customerId) => {
    setSelectedCustomerId(customerId);
    setAccounts([]);
    setForm((p) => ({ ...p, CreditCustomerAccountId: "" }));
    if (!customerId) return;
    setLoadingAccounts(true);
    apiFetch(`${FIN_BASE}/api/accounts/customer-accounts/${customerId}/accounts`)
      .then((r) => r.json())
      .then((d) => setAccounts(normalizeList(d)))
      .catch(() => setAccounts([]))
      .finally(() => setLoadingAccounts(false));
  };

  const handleChange = (field, value) => setForm((p) => ({ ...p, [field]: value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.BranchId || !form.CreditCustomerAccountId || !form.TotalValue) {
      Swal.fire("Missing Fields", "Branch, account, and amount are required.", "warning");
      return;
    }
    if (!form.Drawer || !form.DrawerBank || !form.DrawerBankBranch) {
      Swal.fire("Missing Fields", "Drawer, drawer bank, and drawer bank branch are required.", "warning");
      return;
    }
    setLoading(true);
    try {
      const data = await createTransaction({
        Type: FrontOfficeTransactionType.ChequeDeposit,
        BranchId: form.BranchId,
        CreditCustomerAccountId: form.CreditCustomerAccountId,
        TotalValue: Number(form.TotalValue),
        Remarks: form.Remarks,
        Drawer: form.Drawer,
        DrawerBank: form.DrawerBank,
        DrawerBankBranch: form.DrawerBankBranch,
        ChequeType: form.ChequeType,
        WriteDate: form.WriteDate ? new Date(form.WriteDate).toISOString() : null,
      });

      if (data.success) {
        setReceiptJournal(data.data);
        setForm(emptyForm);
        setSelectedCustomerId("");
        setAccounts([]);
      } else {
        Swal.fire("Error", data.message || "Failed to create cheque deposit", "error");
      }
    } catch (err) {
      Swal.fire("Error", err.message, "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white m-8 px-8 py-8 shadow-2xl rounded-lg relative max-w-2xl mx-auto">
      <div className="flex justify-between items-center mb-6 bg-indigo-800 px-6 py-3 rounded-2xl">
        <h2 className="text-xl font-bold text-white flex items-center gap-2">
          <FaMoneyCheckAlt /> Cheque Deposit
        </h2>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <FieldGroup label="Customer">
          <Select value={selectedCustomerId ? String(selectedCustomerId) : ""} onValueChange={handleCustomerChange} disabled={loadingData}>
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
          <Select value={form.CreditCustomerAccountId ? String(form.CreditCustomerAccountId) : ""} onValueChange={(v) => handleChange("CreditCustomerAccountId", v)} disabled={loadingAccounts || !selectedCustomerId}>
            <SelectTrigger><SelectValue placeholder={loadingAccounts ? "Loading..." : !selectedCustomerId ? "Select a customer first" : "Select account"} /></SelectTrigger>
            <SelectContent className="max-h-60 overflow-y-auto">
              {accounts.map((a) => (
                <SelectItem key={String(a.Id)} value={String(a.Id)}>{a.CustomerAccountTypeTargetProductDescription || a.FullAccountNumber || a.Id}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </FieldGroup>

        <FieldGroup label="Branch">
          <Select value={form.BranchId ? String(form.BranchId) : ""} onValueChange={(v) => handleChange("BranchId", v)} disabled={loadingData}>
            <SelectTrigger><SelectValue placeholder={loadingData ? "Loading..." : "Select Branch"} /></SelectTrigger>
            <SelectContent className="max-h-60 overflow-y-auto">
              {branches.map((b) => <SelectItem key={String(b.Id)} value={String(b.Id)}>{b.Description}</SelectItem>)}
            </SelectContent>
          </Select>
        </FieldGroup>

        <div className="grid grid-cols-2 gap-4">
          <FieldGroup label="Amount">
            <Input type="number" value={form.TotalValue} onChange={(e) => handleChange("TotalValue", e.target.value)} required placeholder="1000" />
          </FieldGroup>
          <FieldGroup label="Write Date">
            <Input type="date" value={form.WriteDate} onChange={(e) => handleChange("WriteDate", e.target.value)} />
          </FieldGroup>
          <FieldGroup label="Drawer (Cheque Owner)">
            <Input value={form.Drawer} onChange={(e) => handleChange("Drawer", e.target.value)} required placeholder="e.g. John Doe" />
          </FieldGroup>
          <FieldGroup label="Drawer Bank">
            <Input value={form.DrawerBank} onChange={(e) => handleChange("DrawerBank", e.target.value)} required placeholder="e.g. KCB" />
          </FieldGroup>
          <FieldGroup label="Drawer Bank Branch">
            <Input value={form.DrawerBankBranch} onChange={(e) => handleChange("DrawerBankBranch", e.target.value)} required placeholder="e.g. Moi Avenue" />
          </FieldGroup>
          <FieldGroup label="Cheque Type Id">
            {/* No cheque-type lookup endpoint exists anywhere in this app
                yet — plain GUID input until one is confirmed (see TODO.md). */}
            <Input value={form.ChequeType} onChange={(e) => handleChange("ChequeType", e.target.value)} placeholder="Cheque type GUID" />
          </FieldGroup>
        </div>

        <FieldGroup label="Remarks">
          <Input value={form.Remarks} onChange={(e) => handleChange("Remarks", e.target.value)} placeholder="Optional" />
        </FieldGroup>

        <Button type="submit" disabled={loading || loadingData} className="w-full bg-indigo-600 hover:bg-indigo-700">
          {loading ? "Submitting..." : "Submit Cheque Deposit"}
        </Button>
      </form>

      <ReceiptModal open={!!receiptJournal} onClose={() => setReceiptJournal(null)} journal={receiptJournal} title="Cheque Deposit Receipt" />
    </div>
  );
}
