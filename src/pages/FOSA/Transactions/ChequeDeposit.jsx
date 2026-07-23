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
import { FaEllipsisV, FaCheckCircle, FaTimesCircle, FaPaperPlane } from "react-icons/fa";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const BASE = `${import.meta.env.VITE_APP_FIN_URL}`;

const statusColors = {
  Pending: "bg-yellow-100 text-yellow-700",
  Authorized: "bg-green-100 text-green-700",
  Posted: "bg-blue-100 text-blue-700",
  Rejected: "bg-red-100 text-red-700",
};

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
    <Select value={value} onValueChange={onChange} disabled={disabled}>
      <SelectTrigger><SelectValue placeholder={disabled ? "Loading..." : "Search & select customer"} /></SelectTrigger>
      <SelectContent>
        {customers.map((c) => (
          <SelectItem key={c.Id} value={c.Id}>
            {c.IndividualFirstName} {c.IndividualLastName}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

function AccountSelect({ accounts, value, onChange, disabled, placeholder }) {
  return (
    <Select value={value} onValueChange={onChange} disabled={disabled}>
      <SelectTrigger><SelectValue placeholder={placeholder || "Select account"} /></SelectTrigger>
      <SelectContent>
        {accounts.map((a) => (
          <SelectItem key={a.Id} value={a.Id}>
            {a.CustomerAccountTypeTargetProductDescription
              || a.FullAccountNumber || `${a.AccountNumber || a.Id}`}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

const transactionTypes = [
  { value: 1, label: "Cash Withdrawal" },
  { value: 2, label: "Cash Deposit" },
  { value: 3, label: "Cheque Deposit" },
  { value: 4, label: "Payment Voucher" },
];

function BranchSelect({ branches, value, onChange, disabled }) {
  return (
    <Select value={value} onValueChange={(v) => onChange("BranchId", v)} disabled={disabled}>
      <SelectTrigger><SelectValue placeholder={disabled ? "Loading..." : "Select Branch"} /></SelectTrigger>
      <SelectContent>
        {branches.map((b) => (
          <SelectItem key={b.Id} value={b.Id}>{b.Description}</SelectItem>
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
  Amount: "",
  Remarks: "",
  Type: 3,
  Drawer: "Sospeter Ochieng",
  DrawerBank: "KCB",
  DrawerBankBranch: "Muindi Mbingu Street, Nairobi",
  ChequeType: "3825244A-AA55-F111-9B89-C8E2651EF92D",
  WriteDate: "",
};

function AddChequeDepositDrawer({ open, onClose, onSuccess }) {
  const [form, setForm] = useState(emptyForm);
  const [loading, setLoading] = useState(false);
  const [loadingData, setLoadingData] = useState(false);
  const [customers, setCustomers] = useState([]);
  const [accounts, setAccounts] = useState([]);
  const [branches, setBranches] = useState([]);
  const [selectedCustomerId, setSelectedCustomerId] = useState("");
  const [loadingAccounts, setLoadingAccounts] = useState(false);

  useEffect(() => {
    if (!open) return;
    setLoadingData(true);
    Promise.all([
      fetch(`${BASE}/api/customers`).then((r) => r.json()),
      fetch(`${BASE}/api/branches`).then((r) => r.json()),
    ]).then(([custData, branchData]) => {
      setCustomers(custData.success ? (Array.isArray(custData.data) ? custData.data : []) : []);
      setBranches(Array.isArray(branchData.data) ? branchData.data : []);
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
    fetch(`${BASE}/api/values/CustomerAccount/by-customer?customerId=${customerId}`)
      .then((r) => r.json())
      .then((d) => setAccounts(Array.isArray(d) ? d : []))
      .catch(() => setAccounts([]))
      .finally(() => setLoadingAccounts(false));
  };

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
      const payload = { ...form, TotalValue: Number(form.Amount) };
      //const res = await fetch(`${BASE}api/chequedeposit`, {
      console.log("Submitting payload:", payload);
      const res = await fetch(`${BASE}/api/deposit`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json().catch(() => ({}));
      console.log("Create response:", data);
      if (!res.ok) throw new Error(data.message || "Failed to create cheque deposit request");
      data.success === false
        ? Swal.fire("Error", data.message || "Cheque deposit request failed", "error")
        : Swal.fire("Success", data.message || "Cheque deposit request created successfully", "success");
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
              <h2 className="font-bold text-lg text-white">New Cheque Deposit</h2>
              <Button variant="outline" size="sm" onClick={onClose}>Close</Button>
            </div>
            <form onSubmit={handleSubmit} className="p-4 space-y-4">
              <FieldGroup label="Customer">
                <CustomerSelect customers={customers} value={selectedCustomerId} onChange={handleCustomerChange} disabled={loadingData} />
              </FieldGroup>
              <FieldGroup label={loadingAccounts ? "Loading accounts..." : "Customer Account"}>
                <AccountSelect
                  accounts={accounts}
                  value={form.CreditCustomerAccountId}
                  onChange={handleAccountChange}
                  disabled={loadingAccounts || !selectedCustomerId}
                  placeholder={loadingAccounts ? "Loading..." : !selectedCustomerId ? "Select a customer first" : "Select account"}
                />
              </FieldGroup>
              <FieldGroup label="Branch">
                <BranchSelect branches={branches} value={form.BranchId} onChange={handleChange} disabled={loadingData} />
              </FieldGroup>
              <FieldGroup label="Transaction Type">
                <Select value={String(form.Type)} onValueChange={(value) => handleChange("Type", Number(value))}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select transaction type" />
                  </SelectTrigger>
                  <SelectContent>
                    {transactionTypes.map((type) => (
                      <SelectItem key={type.value} value={String(type.value)}>
                        {type.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </FieldGroup>
              <FieldGroup label="Amount">
                <Input type="number" value={form.Amount} onChange={(e) => handleChange("Amount", e.target.value)} required placeholder="1000" />
              </FieldGroup>
              <FieldGroup label="Drawer (Cheque Owner)">
                <Input value={form.Drawer} onChange={(e) => handleChange("Drawer", e.target.value)} required placeholder="e.g. John Doe" />
              </FieldGroup>
              <FieldGroup label="Drawer Bank">
                <Input value={form.DrawerBank} onChange={(e) => handleChange("DrawerBank", e.target.value)} required placeholder="e.g. KCB" />
              </FieldGroup>
              <FieldGroup label="Drawer Bank Branch">
                <Input value={form.DrawerBankBranch} onChange={(e) => handleChange("DrawerBankBranch", e.target.value)} required placeholder="e.g. Muindi Mbingu Street, Nairobi" />
              </FieldGroup>
              <FieldGroup label="Cheque Type">
                <Input value={form.ChequeType} onChange={(e) => handleChange("ChequeType", e.target.value)} required placeholder="Enter cheque type" />
              </FieldGroup>
              <FieldGroup label="Write Date">
                <Input type="date" value={form.WriteDate} onChange={(e) => handleChange("WriteDate", e.target.value)} required />
              </FieldGroup>
              <FieldGroup label="Remarks">
                <Input value={form.Remarks} onChange={(e) => handleChange("Remarks", e.target.value)} placeholder="Enter remarks" />
              </FieldGroup>
              <Button type="submit" disabled={loading} className="w-full bg-indigo-600 hover:bg-indigo-700">
                {loading ? "Saving..." : "Submit Cheque Deposit"}
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

export default function ChequeDeposit() {
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
    fetch(`${BASE}/api/deposit`)
      .then((r) => r.json())
      .then((d) => {
        const allItems = Array.isArray(d) ? d : [];
        setItems(allItems.filter((item) => matchesTransactionType(item, 3)));
      })
      .catch(() => setItems([]))
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchItems(); }, []);

  const handleAuthorize = async (id) => {
    const confirm = await Swal.fire({ title: "Authorize Cheque Deposit?", icon: "question", showCancelButton: true, confirmButtonColor: "#4f46e5", confirmButtonText: "Authorize" });
    if (!confirm.isConfirmed) return;
    try {
      const res = await fetch(`${BASE}/api/chequedeposit/authorize?chequeDepositRequestId=${id}&customerTransactionAuthOption=1`, { method: "POST" });
      if (!res.ok) throw new Error("Authorization failed");
      Swal.fire("Authorized!", "Cheque deposit request authorized.", "success");
      fetchItems();
    } catch (err) {
      Swal.fire("Error", err.message, "error");
    }
  };

  const handleReject = async (id) => {
    const confirm = await Swal.fire({ title: "Reject Cheque Deposit?", icon: "warning", showCancelButton: true, confirmButtonColor: "#dc2626", confirmButtonText: "Reject" });
    if (!confirm.isConfirmed) return;
    try {
      const res = await fetch(`${BASE}/api/chequedeposit/authorize?chequeDepositRequestId=${id}&customerTransactionAuthOption=2`, { method: "POST" });
      if (!res.ok) throw new Error("Rejection failed");
      Swal.fire("Rejected!", "Cheque deposit request rejected.", "success");
      fetchItems();
    } catch (err) {
      Swal.fire("Error", err.message, "error");
    }
  };

  const handlePost = async (id) => {
    const confirm = await Swal.fire({ title: "Post Cheque Deposit?", icon: "question", showCancelButton: true, confirmButtonColor: "#4f46e5", confirmButtonText: "Post" });
    if (!confirm.isConfirmed) return;
    try {
      const res = await fetch(`${BASE}/api/chequedeposit/post?chequeDepositRequestId=${id}`, { method: "POST" });
      if (!res.ok) throw new Error("Posting failed");
      Swal.fire("Posted!", "Cheque deposit request posted successfully.", "success");
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

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <div className="flex gap-1 border-b border-gray-200">
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
        <Button onClick={() => setAddOpen(true)} className="bg-indigo-600 hover:bg-indigo-700">
          + New Cheque Deposit
        </Button>
      </div>

      <div className="flex items-center gap-2 text-xs text-gray-400 mb-3 px-1">
        <span className="font-medium text-yellow-600">Pending</span>
        <span>→</span>
        <span className="font-medium text-green-600">Authorized</span>
        <span>→</span>
        <span className="font-medium text-blue-600">Posted</span>
        <span className="mx-1 text-gray-300">|</span>
        <span className="font-medium text-red-500">Rejected</span>
      </div>

      <div className="grid grid-cols-9 gap-2 bg-gray-700 text-gray-100 font-semibold p-3 rounded-lg mb-3">
        <span className="col-span-2">Amount</span>
        <span className="col-span-3">Customer Name</span>
        <span className="col-span-3">Date</span>
        <span className="col-span-1 text-right">
          {activeTab === "Pending" || activeTab === "Authorized" ? "Actions" : ""}
        </span>
      </div>

      {loading ? (
        <div className="space-y-2 animate-pulse">
          {[1, 2, 3].map((i) => <div key={i} className="h-12 bg-gray-100 rounded-lg" />)}
        </div>
      ) : filteredItems.length > 0 ? (
        <div className="space-y-2">
          {filteredItems.map((item) => (
            <div key={item.Id} className="grid grid-cols-9 gap-2 items-center bg-white px-4 py-3 rounded-lg shadow border">
              <span className="col-span-2 font-medium text-indigo-700">{item.Amount?.toLocaleString() ?? "—"}</span>
              <span className="col-span-3 text-sm text-gray-700">{item.CustomerName || item.CustomerFullName || "—"}</span>
              <span className="col-span-3 text-xs text-gray-400">{item.CreatedDate ? new Date(item.CreatedDate).toLocaleDateString() : "—"}</span>
              <div className="col-span-1 flex justify-end">
                {activeTab === "Pending" && (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8"><FaEllipsisV className="text-gray-500" /></Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => handleAuthorize(item.Id)}>
                        <FaCheckCircle className="mr-2 text-green-600" /> Authorize
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleReject(item.Id)}>
                        <FaTimesCircle className="mr-2 text-red-600" /> Reject
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                )}
                {activeTab === "Authorized" && (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8"><FaEllipsisV className="text-gray-500" /></Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => handlePost(item.Id)}>
                        <FaPaperPlane className="mr-2 text-blue-600" /> Post
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                )}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center mt-6">
          <img src={NotFoundImage} alt="Not Found" className="mx-auto w-32 h-auto" />
          <p className="text-gray-400 mt-2">No <span className="font-medium">{activeTab.toLowerCase()}</span> cheque deposit requests found.</p>
        </div>
      )}

      <AddChequeDepositDrawer open={addOpen} onClose={() => setAddOpen(false)} onSuccess={fetchItems} />
    </div>
  );
}
