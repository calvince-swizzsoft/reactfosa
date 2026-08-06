import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import Swal from "sweetalert2";
import { FaFileInvoiceDollar } from "react-icons/fa";
import { apiFetch, normalizeList } from "@/lib/api";
import { createTransaction } from "./requestsApi";
import { FrontOfficeTransactionType } from "../lib/frontOfficeEnums";
import ReceiptModal from "../lib/ReceiptModal";

const FIN_BASE = `${import.meta.env.VITE_APP_FIN_URL}`;

// A payment voucher is a cash-withdrawal sub-flow (WORKFLOW.md §5:
// "a distinct posting path... used when the withdrawal is settled by
// issuing a voucher instead of physical cash"), not its own request type
// server-side. Confirmed against the real CashDepositController: an
// above-limit voucher is stored as a plain CashWithdrawalRequestDTO
// (TransactionType hardcoded back to CashWithdrawal), so there's no way to
// filter "just the pending vouchers" out of GET /?type=1 — that field
// doesn't survive the round trip. This is create-only; once a voucher
// needs authorization, it shows up in the ordinary Cash Withdrawal queue
// like any other pending withdrawal, not a separate one here.
//
// CustomerTransactionModel.PaymentVoucher is NOT initialized in the
// model's own constructor (unlike CustomerAccount/CashDepositRequest/
// Teller, which are) — ProcessCustomerTransactionAsync's voucher branch
// dereferences transactionModel.PaymentVoucher.Reference/.Payee directly,
// so omitting this object entirely would NPE server-side. Always send it.

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
  Payee: "",
  Reference: "",
  WriteDate: "",
  Remarks: "",
};

export default function PaymentVoucher() {
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
    if (!form.Payee || !form.Reference) {
      Swal.fire("Missing Fields", "Payee and reference are required.", "warning");
      return;
    }
    setLoading(true);
    try {
      const data = await createTransaction({
        Type: FrontOfficeTransactionType.CashWithdrawalPaymentVoucher,
        BranchId: form.BranchId,
        CreditCustomerAccountId: form.CreditCustomerAccountId,
        TotalValue: Number(form.TotalValue),
        Remarks: form.Remarks,
        PaymentVoucher: {
          Payee: form.Payee,
          Reference: form.Reference,
          Amount: Number(form.TotalValue),
          WriteDate: form.WriteDate ? new Date(form.WriteDate).toISOString() : null,
        },
      });

      if (data.success) {
        setReceiptJournal(data.data);
        setForm(emptyForm);
        setSelectedCustomerId("");
        setAccounts([]);
      } else if (data.data?.dialog) {
        Swal.fire(
          "Authorization Required",
          `${data.message} — once a checker approves it, post it from the Cash Withdrawal queue's Authorized tab, not here.`,
          "info"
        );
        setForm(emptyForm);
        setSelectedCustomerId("");
        setAccounts([]);
      } else {
        Swal.fire("Error", data.message || "Failed to create payment voucher", "error");
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
          <FaFileInvoiceDollar /> Payment Voucher
        </h2>
        <Link to="/FrontOffice/CashWithdrawal">
          <Button variant="outline" className="bg-white text-sm">View Withdrawal Queue</Button>
        </Link>
      </div>

      <p className="text-xs text-gray-500 mb-4 -mt-2">
        Submits as a cash withdrawal settled by voucher instead of physical cash. If it needs
        authorization, it'll appear in the Cash Withdrawal queue's Authorized tab once a checker approves it.
      </p>

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
          <FieldGroup label="Payee">
            <Input value={form.Payee} onChange={(e) => handleChange("Payee", e.target.value)} required placeholder="e.g. Jane Doe" />
          </FieldGroup>
          <FieldGroup label="Reference">
            <Input value={form.Reference} onChange={(e) => handleChange("Reference", e.target.value)} required placeholder="Voucher reference" />
          </FieldGroup>
        </div>

        <FieldGroup label="Remarks">
          <Input value={form.Remarks} onChange={(e) => handleChange("Remarks", e.target.value)} placeholder="Optional" />
        </FieldGroup>

        <Button type="submit" disabled={loading || loadingData} className="w-full bg-indigo-600 hover:bg-indigo-700">
          {loading ? "Submitting..." : "Submit Payment Voucher"}
        </Button>
      </form>

      <ReceiptModal open={!!receiptJournal} onClose={() => setReceiptJournal(null)} journal={receiptJournal} title="Payment Voucher Receipt" />
    </div>
  );
}
