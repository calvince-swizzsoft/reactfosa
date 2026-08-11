import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import Swal from "sweetalert2";
import { FaReceipt, FaPaperPlane } from "react-icons/fa";
import { apiFetch, normalizeList } from "@/lib/api";
import { createCustomerReceipt } from "./customerReceiptsApi";
import ReceiptModal from "../lib/ReceiptModal";

// api/frontoffice/customerreceipts — docs/api/frontoffice-api-spec.md §13.
// No list endpoint exists — receipt-only form, same shape as
// SundryPayments.jsx minus the transaction-type field (this controller
// only ever posts a Cash Receipt-shaped journal, no direction choice).
const FIN_BASE = `${import.meta.env.VITE_APP_FIN_URL}`;

// This screen's own NavigationMenu Code ("Customer Receipts").
const MODULE_NAVIGATION_ITEM_CODE = 25008;

function FieldGroup({ label, children }) {
  return (
    <div>
      <Label className="text-sm font-semibold text-gray-700">{label}</Label>
      {children}
    </div>
  );
}

const emptyForm = { ChartOfAccountId: "", TotalValue: "", Reference: "", PrimaryDescription: "" };

export default function CustomerReceipts() {
  const [form, setForm] = useState(emptyForm);
  const [chartOfAccounts, setChartOfAccounts] = useState([]);
  const [loadingData, setLoadingData] = useState(true);
  const [loading, setLoading] = useState(false);
  const [receiptJournal, setReceiptJournal] = useState(null);

  useEffect(() => {
    setLoadingData(true);
    apiFetch(`${FIN_BASE}/api/accounts/chartofaccounts?pageSize=1000`)
      .then((r) => r.json())
      .then((d) => setChartOfAccounts(normalizeList(d)))
      .catch(() => setChartOfAccounts([]))
      .finally(() => setLoadingData(false));
  }, []);

  const handleChange = (field, value) => setForm((p) => ({ ...p, [field]: value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.ChartOfAccountId || !(Number(form.TotalValue) > 0)) {
      Swal.fire("Missing Fields", "G/L account and a positive amount are required.", "warning");
      return;
    }
    setLoading(true);
    try {
      const journal = await createCustomerReceipt({
        ChartOfAccountId: form.ChartOfAccountId,
        TotalValue: Number(form.TotalValue),
        Reference: form.Reference,
        PrimaryDescription: form.PrimaryDescription,
        ModuleNavigationItemCode: MODULE_NAVIGATION_ITEM_CODE,
      });
      setReceiptJournal(journal);
      setForm(emptyForm);
    } catch (err) {
      Swal.fire("Error", err.message, "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white m-8 px-8 py-8 shadow-2xl rounded-lg relative">
      <div className="flex justify-between items-center mb-6 bg-indigo-800 px-6 py-3 rounded-2xl">
        <h2 className="text-xl font-bold text-white flex items-center gap-2">
          <FaReceipt /> Customer Receipts
        </h2>
      </div>

      <form onSubmit={handleSubmit} className="max-w-2xl space-y-4">
        <FieldGroup label={loadingData ? "Loading accounts..." : "G/L Account"}>
          <Select value={form.ChartOfAccountId ? String(form.ChartOfAccountId) : ""} onValueChange={(v) => handleChange("ChartOfAccountId", v)} disabled={loadingData}>
            <SelectTrigger><SelectValue placeholder={loadingData ? "Loading..." : "Select account"} /></SelectTrigger>
            <SelectContent className="max-h-60 overflow-y-auto">
              {chartOfAccounts.map((a) => (
                <SelectItem key={String(a.Id)} value={String(a.Id)}>{a.AccountCode} — {a.AccountName}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </FieldGroup>

        <FieldGroup label="Amount">
          <Input type="number" min="0" value={form.TotalValue} onChange={(e) => handleChange("TotalValue", e.target.value)} required placeholder="e.g. 5000" />
        </FieldGroup>

        <FieldGroup label="Reference">
          <Input value={form.Reference} onChange={(e) => handleChange("Reference", e.target.value)} placeholder="Optional" />
        </FieldGroup>

        <FieldGroup label="Description">
          <Input value={form.PrimaryDescription} onChange={(e) => handleChange("PrimaryDescription", e.target.value)} placeholder="Optional" />
        </FieldGroup>

        <Button type="submit" disabled={loading || loadingData} className="w-full bg-indigo-600 hover:bg-indigo-700 flex items-center gap-2">
          <FaPaperPlane /> {loading ? "Posting..." : "Post"}
        </Button>
      </form>

      <ReceiptModal open={!!receiptJournal} onClose={() => setReceiptJournal(null)} journal={receiptJournal} title="Customer Receipt" />
    </div>
  );
}
