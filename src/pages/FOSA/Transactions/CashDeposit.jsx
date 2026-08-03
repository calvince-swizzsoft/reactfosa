import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import Swal from "sweetalert2";
import NotFoundImage from "/assets/scopefinding.png";
import { FaMoneyBillWave, FaPlus, FaPaperPlane } from "react-icons/fa";
import { apiFetch } from "@/lib/api";

//const BASE = "https://rubani.ngrok.io";
const BASE = `${import.meta.env.VITE_APP_FIN_URL}`

const statusColors = {
  Pending: "bg-yellow-100 text-yellow-700",
  Authorized: "bg-green-100 text-green-700",
  Posted: "bg-blue-100 text-blue-700",
  Rejected: "bg-red-100 text-red-700",
};

function statusBadge(description) {
  const colorClass = statusColors[description] || "bg-gray-100 text-gray-600";
  return (
    <span className={`px-2 py-1 rounded text-xs font-semibold ${colorClass}`}>
      {description || "Unknown"}
    </span>
  );
}

function FieldGroup({ label, children }) {
  return (
    <div>
      <Label className="text-sm font-semibold text-gray-700">{label}</Label>
      {children}
    </div>
  );
}



function CustomerSelect({ customers, value, onChange, disabled }) {
  return (
    <Select value={value ? String(value) : ""} onValueChange={onChange} disabled={disabled}>
      <SelectTrigger><SelectValue placeholder={disabled ? "Loading..." : "Search & select customer"} /></SelectTrigger>
      <SelectContent>
        {customers.map((c) => {
          const customerName = [c.IndividualFirstName, c.IndividualLastName]
            .filter(Boolean)
            .join(" ") || c.Name || c.FullName || c.CustomerName || c.Description || `Customer ${c.Id}`;

          return (
            <SelectItem key={String(c.Id)} value={String(c.Id)}>
              {customerName}
            </SelectItem>
          );
        })}
      </SelectContent>
    </Select>
  );
}

function AccountSelect({ accounts, value, onChange, disabled, placeholder }) {
  const selectedAccount = accounts.find((a) => a.Id === value);
  const selectedLabel = selectedAccount
    ? (selectedAccount.CustomerAccountTypeTargetProductDescription
        || selectedAccount.FullAccountNumber
        || `${selectedAccount.AccountNumber || selectedAccount.Id}`)
    : "";

  return (
    <Select value={value} onValueChange={onChange} disabled={disabled}>
      <SelectTrigger>
        <SelectValue placeholder={placeholder || "Select account"}>
          {selectedLabel || placeholder || "Select account"}
        </SelectValue>
      </SelectTrigger>
      <SelectContent>
        {accounts.map((a) => {
          const label = a.CustomerAccountTypeTargetProductDescription
            || a.FullAccountNumber
            || `${a.AccountNumber || a.Id}`;

          return (
            <SelectItem key={a.Id} value={a.Id}>
              {label}
            </SelectItem>
          );
        })}
      </SelectContent>
    </Select>
  );
}

function BranchSelect({ branches, value, onChange, disabled }) {
  return (
    <Select value={value ? String(value) : ""} onValueChange={(v) => onChange("BranchId", v)} disabled={disabled}>
      <SelectTrigger><SelectValue placeholder={disabled ? "Loading..." : "Select Branch"} /></SelectTrigger>
      <SelectContent>
        {branches.map((b) => (
          <SelectItem key={String(b.Id)} value={String(b.Id)}>{b.Description}</SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

const emptyForm = {
  BranchId: "",
  CreditCustomerAccountId: "",
  CustomerAccountBranchId: "",
  CustomerAccountCustomerAccountTypeTargetProductId: "",
  CustomerAccountCustomerAccountTypeTargetProductCode: 1,
  CustomerAccountStatus: 0,
  CustomerAccountCustomerId: "",
  TotalValue: "",
  Remarks: "",
  Type: 2,
};

function AddCashDepositDrawer({ open, onClose, onSuccess }) {
  const [form, setForm] = useState(emptyForm);
  const [loading, setLoading] = useState(false);
  const [loadingData, setLoadingData] = useState(false);
  const [customers, setCustomers] = useState([]);
  const [accounts, setAccounts] = useState([]);
  const [branches, setBranches] = useState([]);
  const [selectedCustomerId, setSelectedCustomerId] = useState("");
  const [loadingAccounts, setLoadingAccounts] = useState(false);

  const normalizeList = (response) => {
    if (Array.isArray(response)) return response;
    if (Array.isArray(response?.data)) return response.data;
    if (Array.isArray(response?.Data)) return response.Data;
    return [];
  };

  useEffect(() => {
    if (!open) return;
    setLoadingData(true);
    Promise.all([
      apiFetch(`${BASE}/api/registry/customers`).then((r) => r.json()),
      apiFetch(`${BASE}/api/administration/branches`).then((r) => r.json()),
    ]).then(([customerData, branchData]) => {
      setCustomers(customerData.success ? normalizeList(customerData) : normalizeList(customerData));
      setBranches(normalizeList(branchData));
    }).catch(() => { }).finally(() => setLoadingData(false));
  }, [open]);

  const handleCustomerChange = (customerId) => {
    setSelectedCustomerId(customerId);
    setAccounts([]);
    setForm((p) => ({
      ...p,
      CreditCustomerAccountId: "",
      CustomerAccountBranchId: "",
      CustomerAccountCustomerAccountTypeTargetProductId: "",
      CustomerAccountCustomerAccountTypeTargetProductCode: 1,
      CustomerAccountStatus: 0,
      CustomerAccountCustomerId: customerId,
    }));
    if (!customerId) return;
    setLoadingAccounts(true);
    apiFetch(`${BASE}/api/accounts/customer-accounts/${customerId}/accounts`)
      .then((r) => r.json())
      .then((d) => {
        const normalizedAccounts = Array.isArray(d)
          ? d
          : Array.isArray(d?.data)
            ? d.data
            : [];
          console.log(normalizedAccounts)  
        setAccounts(normalizedAccounts);
      })
      .catch(() => setAccounts([]))
      .finally(() => setLoadingAccounts(false));
  };

  console.log("Selected Customer ID:", selectedCustomerId, accounts);
  const handleAccountChange = (accountId) => {
    const acct = accounts.find((a) => a.Id === accountId);
    if (!acct) return;
    setForm((p) => ({
      ...p,
      CreditCustomerAccountId: acct.Id,
      CustomerAccountBranchId: acct.BranchId || acct.CustomerAccountBranchId || "",
      CustomerAccountCustomerAccountTypeTargetProductId: acct.CustomerAccountTypeTargetProductId || acct.ProductId || "",
      CustomerAccountCustomerAccountTypeTargetProductCode: acct.CustomerAccountTypeTargetProductCode || acct.ProductCode || 1,
      CustomerAccountStatus: acct.Status ?? acct.CustomerAccountStatus ?? 0,
      CustomerAccountCustomerId: acct.CustomerId || selectedCustomerId,
    }));
  };

  const handleChange = (field, value) => setForm((p) => ({ ...p, [field]: value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const payload = {
        ...form,
        Amount: Number(form.TotalValue),
      };
      const res = await apiFetch(`${BASE}/api/frontoffice/requests`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json().catch(() => ({}));

      console.log("Cash Deposit Response:", data);
      console.log("Cash Deposit Payload:", payload);

      if (!res.ok) throw new Error(data.message || "Failed to create cash deposit request");
      data.success === false
        ? Swal.fire("Error", data.message || "Cash deposit request Failed", "error") :
        Swal.fire("Success", data.message || "Cash deposit request created successfully", "success");

      setForm(emptyForm);
      setSelectedCustomerId("");
      setAccounts([]);
      onSuccess();
      onClose();
    } catch (err) {
      Swal.fire("Error", err.message, "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div className="fixed inset-0 bg-black z-40" initial={{ opacity: 0 }} animate={{ opacity: 0.4 }} exit={{ opacity: 0 }} onClick={onClose} />
          <motion.div className="fixed top-5 right-3 w-[480px] bg-white shadow-xl z-50 flex flex-col rounded-2xl p-3 max-h-[95vh] overflow-y-auto" initial={{ x: "100%" }} animate={{ x: 0 }} exit={{ x: "100%" }} transition={{ type: "spring", stiffness: 300, damping: 30 }}>
            <div className="p-4 flex justify-between items-center bg-indigo-600 rounded-2xl m-2">
              <h2 className="font-bold text-lg text-white">New Cash Deposit</h2>
              <Button variant="outline" size="sm" onClick={onClose}>Close</Button>
            </div>
            <form onSubmit={handleSubmit} className="p-4 space-y-4">
              <FieldGroup label="Customer">
                <CustomerSelect customers={customers} value={selectedCustomerId} onChange={handleCustomerChange} disabled={loadingData} />
              </FieldGroup>
              <FieldGroup label={loadingAccounts ? "Loading accounts..." : "Customer Account"}>
                <AccountSelect
                  accounts={accounts}
                  //value={form.CustomerAccountId}
                  value={form.CreditCustomerAccountId}
                  onChange={handleAccountChange}
                  disabled={loadingAccounts || !selectedCustomerId}
                  placeholder={loadingAccounts ? "Loading..." : !selectedCustomerId ? "Select a customer first" : "Select account"}
                />
              </FieldGroup>
              <FieldGroup label="Branch">
                <BranchSelect branches={branches} value={form.BranchId} onChange={handleChange} disabled={loadingData} />
              </FieldGroup>
              <FieldGroup label="Amount">
                <Input type="number" value={form.TotalValue} onChange={(e) => handleChange("TotalValue", e.target.value)} required placeholder="1000" />
              </FieldGroup>
              <FieldGroup label="Remarks">
                <Input value={form.Remarks} onChange={(e) => handleChange("Remarks", e.target.value)} placeholder="Enter remarks" />
              </FieldGroup>
              <Button type="submit" disabled={loading} className="w-full bg-indigo-600 hover:bg-indigo-700">
                {loading ? "Saving..." : "Submit Cash Deposit"}
              </Button>
            </form>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

const STATUS_TABS = [
  { id: "Pending", label: "Pending", color: "text-yellow-600" },
  { id: "Authorized", label: "Authorized", color: "text-green-600" },
  { id: "Posted", label: "Posted", color: "text-blue-600" },
  { id: "Rejected", label: "Rejected", color: "text-red-600" },
];

export default function CashDeposit() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [addOpen, setAddOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("Pending");

  const matchesTransactionType = (item, expectedType) => {
    const typeValue = Number(
      item.TransactionType ?? item.Type ?? item.TransactionTypeId ?? item.TypeId ?? item.TransactionTypeCode ?? item.TypeCode ?? 0
    );

    return typeValue === expectedType;
  };

  const fetchItems = () => {
    setLoading(true);
    apiFetch(`${BASE}/api/frontoffice/requests?type=2`)
      .then((r) => r.json())
      .then((d) => {
        const allItems = Array.isArray(d) ? d : [];
        console.log("[CashDeposit] raw item sample:", allItems[0]);
        setItems(allItems.filter((item) => matchesTransactionType(item, 2)));
      })
      .catch(() => setItems([]))
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchItems(); }, []);

  const handlePost = async (id) => {
    const confirm = await Swal.fire({ title: "Post Authorized Deposit?", icon: "question", showCancelButton: true, confirmButtonColor: "#4f46e5", confirmButtonText: "Post" });
    if (!confirm.isConfirmed) return;
    try {
      const res = await apiFetch(`${BASE}/api/frontoffice/requests/post?id=${id}`, { method: "POST" });
      if (!res.ok) throw new Error("Posting failed");
      Swal.fire("Posted!", "Authorized deposit posted successfully.", "success");
      setActiveTab("Posted");
      fetchItems();
    } catch (err) {
      Swal.fire("Error", err.message, "error");
    }
  };

  const filteredItems = items.filter(
    (item) => (item.StatusDescription || "Pending") === activeTab
  );

  const countFor = (status) =>
    items.filter((item) => (item.StatusDescription || "Pending") === status).length;


  console.log("Cash Deposit Items:", items);

  return (
    <div className="bg-white m-8 px-8 py-8 shadow-2xl rounded-lg relative">
      <div className="flex justify-between items-center mb-6 bg-indigo-800 px-6 py-3 rounded-2xl">
        <h2 className="text-xl font-bold text-white flex items-center gap-2">
          <FaMoneyBillWave /> Cash Deposits
        </h2>
        <Button onClick={() => setAddOpen(true)} className="bg-indigo-600 hover:bg-indigo-700 flex items-center gap-2">
          <FaPlus /> New Cash Deposit
        </Button>
      </div>

      {/* Status tabs */}
      <div className="flex gap-1 border-b border-gray-200 mb-3">
        {STATUS_TABS.map((tab) => {
          const count = countFor(tab.id);
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-1.5 px-4 py-2 text-sm font-semibold rounded-t-lg transition-all ${activeTab === tab.id
                ? "bg-indigo-600 text-white border-b-2 border-indigo-600"
                : `text-gray-500 hover:${tab.color} hover:bg-indigo-50`
                }`}
            >
              {tab.label}
              <span
                className={`text-xs px-1.5 py-0.5 rounded-full font-bold ${activeTab === tab.id
                  ? "bg-white text-indigo-600"
                  : "bg-gray-200 text-gray-600"
                  }`}
              >
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Workflow hint */}
      <div className="flex items-center gap-2 text-xs text-gray-400 mb-4 px-1">
        <span className="font-medium text-yellow-600">Pending</span>
        <span>→</span>
        <span className="font-medium text-green-600">Authorized</span>
        <span>→</span>
        <span className="font-medium text-blue-600">Posted</span>
        <span className="mx-1 text-gray-300">|</span>
        <span className="font-medium text-red-500">Rejected</span>
      </div>

      <div className="bg-gray-200 p-4 rounded-sm">
        {/* Table header */}
        <div className="grid grid-cols-9 gap-4 bg-gray-700 text-gray-100 font-semibold p-3 rounded-lg mb-4">
          <span className="col-span-2">Amount</span>
          <span className="col-span-3">Customer Name</span>
          <span className="col-span-3">Date</span>
          <span className="col-span-1 text-right">{activeTab === "Authorized" ? "Actions" : ""}</span>
        </div>

        {loading ? (
          <div className="space-y-2 animate-pulse">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="grid grid-cols-9 gap-2 bg-gray-50 p-6 rounded">
                {Array.from({ length: 9 }).map((_, j) => (
                  <div key={j} className="h-4 bg-gray-200 rounded"></div>
                ))}
              </div>
            ))}
          </div>
        ) : filteredItems.length > 0 ? (
          <div className="space-y-2">
            {filteredItems.map((item) => (
              <div key={item.Id} className="bg-white rounded-lg shadow-lg border">
                <div className="grid grid-cols-9 gap-2 items-center py-4 px-6 hover:shadow-xl transition-all">
                  <span className="col-span-2 font-medium text-indigo-700">{item.Amount?.toLocaleString() ?? "—"}</span>
                  <span className="col-span-3 text-sm text-gray-700">{item.CustomerName || item.CustomerFullName || "—"}</span>
                  <span className="col-span-3 text-xs text-gray-400">{item.CreatedDate ? new Date(item.CreatedDate).toLocaleDateString() : "—"}</span>
                  <div className="col-span-1 flex justify-end">
                    {activeTab === "Authorized" && (
                      <Button size="sm" onClick={() => handlePost(item.Id)} className="bg-indigo-600 hover:bg-indigo-700 flex items-center gap-1">
                        <FaPaperPlane /> Post
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-gray-500 text-center mt-4">
            <img src={NotFoundImage} alt="Not Found" className="mx-auto w-42" />
            <p className="font-medium text-gray-400">No {activeTab.toLowerCase()} deposit requests found.</p>
          </div>
        )}
      </div>

      <AddCashDepositDrawer open={addOpen} onClose={() => setAddOpen(false)} onSuccess={fetchItems} />
    </div>
  );
}
