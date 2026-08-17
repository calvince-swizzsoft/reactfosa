import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { FaBook } from "react-icons/fa";
import Swal from "sweetalert2";
import { apiFetch, normalizeList } from "@/lib/api";
import { createChequeBook } from "./api";
import { ChequeBookType } from "../lib/chequeBookEnums";

// Areas/Accounts/Controllers/ChequeBookController.cs — docs/api/chequebook-api-spec.md §6.4.
// Customer -> account picker mirrors FOSA/TellerTransactions/SavingsReceiptsPayments.jsx's
// same two-step lookup (api/registry/customers, then
// api/accounts/customer-accounts/{customerId}/accounts) — there's no
// savings-specific filter on that endpoint, so the account picker shows the
// customer's full account list; issuing against a non-savings account isn't
// blocked client-side (matches what the endpoint itself validates: only
// CustomerAccountId is required to be a valid guid, not a specific product type).
const BASE = `${import.meta.env.VITE_APP_FIN_URL}`;

// This screen's own NavigationMenu Code (0x000059D8 + 47 = 23047,
// "Cheque Books" under Accounts > Customer Accounts) — sent as
// moduleNavigationItemCode, matching the "send your own screen's code"
// convention already used by Registry/Customers/create.jsx.
const MODULE_NAVIGATION_ITEM_CODE = 23047;

const TYPE_OPTIONS = [
  { value: ChequeBookType.InHouse, label: "In-House" },
  { value: ChequeBookType.External, label: "External" },
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
  CustomerAccountId: "",
  Type: ChequeBookType.External,
  NumberOfVouchers: "",
  InitialVoucherNumber: "",
  Reference: "",
  Remarks: "",
};

export default function CreateChequeBook() {
  const [form, setForm] = useState(emptyForm);
  const [loading, setLoading] = useState(false);
  const [loadingData, setLoadingData] = useState(true);
  const [customers, setCustomers] = useState([]);
  const [selectedCustomerId, setSelectedCustomerId] = useState("");
  const [accounts, setAccounts] = useState([]);
  const [loadingAccounts, setLoadingAccounts] = useState(false);

  useEffect(() => {
    setLoadingData(true);
    apiFetch(`${BASE}/api/registry/customers`)
      .then((r) => r.json())
      .then((d) => setCustomers(normalizeList(d)))
      .catch(() => setCustomers([]))
      .finally(() => setLoadingData(false));
  }, []);

  const handleCustomerChange = (customerId) => {
    setSelectedCustomerId(customerId);
    setAccounts([]);
    setForm((p) => ({ ...p, CustomerAccountId: "" }));
    if (!customerId) return;
    setLoadingAccounts(true);
    apiFetch(`${BASE}/api/accounts/customer-accounts/${customerId}/accounts`)
      .then((r) => r.json())
      .then((d) => setAccounts(normalizeList(d)))
      .catch(() => setAccounts([]))
      .finally(() => setLoadingAccounts(false));
  };

  const handleChange = (field, value) => setForm((p) => ({ ...p, [field]: value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.CustomerAccountId) {
      Swal.fire("Missing Field", "Select a customer account.", "warning");
      return;
    }
    if (!(Number(form.NumberOfVouchers) > 0) || !(Number(form.InitialVoucherNumber) > 0)) {
      Swal.fire("Missing Fields", "Number of vouchers and initial voucher number must both be greater than zero.", "warning");
      return;
    }

    setLoading(true);
    try {
      const payload = {
        ChequeBook: {
          CustomerAccountId: form.CustomerAccountId,
          Type: form.Type,
          NumberOfVouchers: Number(form.NumberOfVouchers),
          InitialVoucherNumber: Number(form.InitialVoucherNumber),
          Reference: form.Reference,
          Remarks: form.Remarks,
        },
        ModuleNavigationItemCode: MODULE_NAVIGATION_ITEM_CODE,
      };

      await createChequeBook(payload);
      Swal.fire("Success", "Cheque book created successfully", "success");
      setForm(emptyForm);
      setSelectedCustomerId("");
      setAccounts([]);
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
          <FaBook className="text-white text-xl" />
          <h2 className="text-xl font-bold text-white">Issue Cheque Book</h2>
        </div>
        <Link to="/Accounts/ChequeBooks" className="text-sm text-white/80 hover:text-white">
          &larr; Back to Cheque Books
        </Link>
      </div>

      <form onSubmit={handleSubmit} className="max-w-2xl space-y-4">
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
          <Select value={form.CustomerAccountId ? String(form.CustomerAccountId) : ""} onValueChange={(v) => handleChange("CustomerAccountId", v)} disabled={loadingAccounts || !selectedCustomerId}>
            <SelectTrigger><SelectValue placeholder={loadingAccounts ? "Loading..." : !selectedCustomerId ? "Select a customer first" : "Select account"} /></SelectTrigger>
            <SelectContent className="max-h-60 overflow-y-auto">
              {accounts.map((a) => (
                <SelectItem key={String(a.Id)} value={String(a.Id)}>{a.CustomerAccountTypeTargetProductDescription || a.FullAccountNumber || a.Id}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </FieldGroup>

        <div className="grid grid-cols-3 gap-4">
          <FieldGroup label="Type">
            <Select value={String(form.Type)} onValueChange={(v) => handleChange("Type", Number(v))}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {TYPE_OPTIONS.map((o) => <SelectItem key={o.value} value={String(o.value)}>{o.label}</SelectItem>)}
              </SelectContent>
            </Select>
          </FieldGroup>
          <FieldGroup label="Number of Vouchers">
            <Input type="number" min="1" value={form.NumberOfVouchers} onChange={(e) => handleChange("NumberOfVouchers", e.target.value)} required placeholder="e.g. 50" />
          </FieldGroup>
          <FieldGroup label="Initial Voucher Number">
            <Input type="number" min="1" value={form.InitialVoucherNumber} onChange={(e) => handleChange("InitialVoucherNumber", e.target.value)} required placeholder="e.g. 1" />
          </FieldGroup>
        </div>

        <FieldGroup label="Reference">
          <Input value={form.Reference} onChange={(e) => handleChange("Reference", e.target.value)} placeholder="e.g. CBK-2026-0042" />
        </FieldGroup>

        <FieldGroup label="Remarks">
          <Input value={form.Remarks} onChange={(e) => handleChange("Remarks", e.target.value)} placeholder="Optional" />
        </FieldGroup>

        <Button type="submit" disabled={loading || loadingData} className="w-full bg-indigo-600 hover:bg-indigo-700">
          {loading ? "Issuing..." : "Issue Cheque Book"}
        </Button>
      </form>
    </div>
  );
}
