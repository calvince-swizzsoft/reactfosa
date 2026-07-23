
import { useState, useEffect, useMemo, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectTrigger,
  SelectContent,
  SelectItem,
  SelectValue,
} from "@/components/ui/select";
import Swal from "sweetalert2";

const TYPE_COLORS = {
  Asset: "bg-blue-100 text-blue-700",
  Liability: "bg-orange-100 text-orange-700",
  "Equity/Capital": "bg-purple-100 text-purple-700",
  "Income/Revenue": "bg-green-100 text-green-700",
  Expense: "bg-red-100 text-red-700",
};

function AccountPreviewCard({ account }) {
  const typeColor = TYPE_COLORS[account.AccountTypeDescription] ?? "bg-gray-100 text-gray-700";
  return (
    <div className="border rounded-lg p-3 bg-white shadow-sm hover:shadow-md transition-shadow text-xs space-y-1">
      <div className="flex flex-col items-start justify-between gap-2 mb-1.5">
        <span className="font-mono font-bold text-indigo-800 text-sm">
          Account Code: {account.AccountCode}
        </span>
        <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${typeColor}`}>
          Account Type: {account.AccountTypeDescription}
        </span>
      </div>
      <p className="font-semibold text-gray-800 truncate mb-1.5" title={account.AccountName}>
        Account Name: {account.AccountName}
      </p>
      <div className="flex flex-wrap gap-x-3 gap-y-0.5 text-gray-500">
        <span>Category: {account.AccountCategoryDescription}</span>
        {account.Parent && (
          <span className="truncate">
            Parent: <span className="text-gray-700">{account.Parent.AccountName}</span>
          </span>
        )}
      </div>
    </div>
  );
}

// ── Parent Account Picker Modal ──────────────────────────────────────────────
function ParentAccountModal({ open, accounts, onSelect, onClose }) {
  const [query, setQuery] = useState("");
  const inputRef = useRef(null);

  useEffect(() => {
    if (open) {
      setQuery("");
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [open]);

  const filtered = useMemo(() => {
    const rootAccounts = accounts.filter(
      (acc) => acc.ParentId === null || acc.ParentId === ""
    );
    const q = query.trim().toLowerCase();
    if (!q) return rootAccounts;
    return rootAccounts.filter(
      (acc) =>
        String(acc.AccountCode).includes(q) ||
        acc.AccountName.toLowerCase().includes(q)
    );
  }, [query, accounts]);

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Modal backdrop — sits above drawer (z-60) */}
          <motion.div
            className="fixed inset-0 bg-black z-60"
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.45 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={onClose}
          />

          {/* Modal panel */}
          <motion.div
            className="fixed z-70 inset-0 flex items-center justify-end pointer-events-none mr-7"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.2 }}
          >
            <div
              className="pointer-events-auto bg-white rounded-2xl shadow-2xl flex flex-col overflow-hidden"
              style={{ width: 480, maxHeight: "70vh" }}
              onClick={(e) => e.stopPropagation()}
            >
              {/* Modal header */}
              <div className="bg-indigo-800 text-white px-5 py-3 flex items-center justify-between shrink-0">
                <span className="font-semibold text-sm">Select Group Account</span>
                <button
                  onClick={onClose}
                  className="text-white/80 hover:text-white text-lg leading-none"
                >
                  ✕
                </button>
              </div>

              {/* Search */}
              <div className="px-4 py-3 border-b bg-gray-50 shrink-0">
                <Input
                  ref={inputRef}
                  placeholder="Search by account code or name…"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  className="bg-white"
                />
                <p className="text-[11px] text-gray-400 mt-1">
                  {filtered.length} {/*of {accounts.length}*/} accounts
                </p>
              </div>

              {/* Account list */}
              <div className="flex-1 overflow-y-auto divide-y">
                {filtered.length === 0 ? (
                  <p className="text-center text-gray-400 text-sm py-10">No accounts found.</p>
                ) : (
                  filtered.map((acc) => {
                    const badge = TYPE_COLORS[acc.AccountTypeDescription] ?? "bg-gray-100 text-gray-600";
                    return (
                      <button
                        key={acc.Id}
                        onClick={() => onSelect(acc)}
                        className="w-full text-left px-4 py-3 hover:bg-indigo-50 transition-colors flex items-start gap-3 group"
                      >
                        <span className="font-mono text-indigo-700 font-bold text-xs mt-0.5 w-20 shrink-0">
                          {acc.AccountCode}
                        </span>
                        <span className="flex-1 min-w-0">
                          <span className="block text-sm font-medium text-gray-800 group-hover:text-indigo-800 truncate">
                            {acc.AccountName}
                          </span>
                          <span className={`inline-block mt-0.5 px-2 py-0.5 rounded-full text-[10px] font-semibold ${badge}`}>
                            {acc.AccountTypeDescription}
                          </span>
                        </span>
                        <span className="text-indigo-400 text-xs shrink-0 opacity-0 group-hover:opacity-100 transition-opacity self-center">
                          Select →
                        </span>
                      </button>
                    );
                  })
                )}
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

// ── Main Drawer ──────────────────────────────────────────────────────────────
export default function AddAccountDrawer({ open, onClose, onSuccess }) {
  const [form, setForm] = useState({
    parentId: "",
    accountType: "",
    accountCategory: "",
    accountCode: "",
    accountName: "",
    depth: "1",
  });
  const [selectedParent, setSelectedParent] = useState(null);
  const [loading, setLoading] = useState(false);
  const [allAccounts, setAllAccounts] = useState([]);
  const [searchCode, setSearchCode] = useState("");
  const [parentModalOpen, setParentModalOpen] = useState(false);

  const accountTypes = [
    { value: "1000", label: "Assets" },
    { value: "2000", label: "Liabilities" },
    { value: "3000", label: "Equity" },
    { value: "4000", label: "Revenue" },
    { value: "5000", label: "Expenses" },
  ];

  const accountCategories = [
    { value: "4096", label: "Header Account (Non-Postable)" },
    { value: "4097", label: "Detail Account (Postable)" },
  ];

  useEffect(() => {
    const fetchAccounts = async () => {
      try {
        const res = await fetch(
          `${import.meta.env.VITE_APP_FIN_URL}/api/values/GetChartOfAccount`
        );
        if (!res.ok) throw new Error("Failed to fetch accounts");
        const data = await res.json();
        if (data?.Success) setAllAccounts(data.Data);
      } catch (err) {
        console.error(err);
      }
    };

    if (open) fetchAccounts();
  }, [open]);

  const filteredPreview = useMemo(() => {
    const q = searchCode.trim();
    if (!q) return allAccounts.slice(0, 20);
    return allAccounts.filter((acc) => String(acc.AccountCode).includes(q));
  }, [searchCode, allAccounts]);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });
  const handleSelectChange = (field, value) => setForm({ ...form, [field]: value });

  const handleParentSelect = (acc) => {
    setSelectedParent(acc);
    setForm((f) => ({ ...f, parentId: acc.Id }));
    setParentModalOpen(false);
  };

  const handleClearParent = () => {
    setSelectedParent(null);
    setForm((f) => ({ ...f, parentId: "" }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch(
        `${import.meta.env.VITE_APP_FIN_URL}/api/values/chartofaccount`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(form),
        }
      );
      if (!res.ok) throw new Error("Failed to create account");
      const data = await res.json();

      Swal.fire({
        icon: "success",
        title: "Success",
        text: "Account created successfully!",
        confirmButtonColor: "#2563eb",
      });

      setForm({ parentId: "", accountType: "", accountCategory: "", accountCode: "", accountName: "", depth: "1" });
      setSelectedParent(null);
      if (onSuccess) onSuccess(data);
      onClose();
    } catch (err) {
      console.error(err);
      Swal.fire({
        icon: "error",
        title: "Error",
        text: "Failed to create account. Please try again.",
        confirmButtonColor: "#dc2626",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <AnimatePresence>
        {open && (
          <>
            {/* Backdrop */}
            <motion.div
              className="fixed inset-0 bg-black z-40"
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.4 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
              onClick={onClose}
            />

            {/* Drawer */}
            <motion.div
              className="fixed top-5 right-3 rounded-2xl bg-white shadow-xl z-50 flex flex-col overflow-hidden"
              style={{ width: "880px", maxHeight: "calc(100vh - 2.5rem)" }}
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
            >
              {/* Header */}
              <div className="bg-indigo-800 text-white px-6 py-4 flex justify-between items-center shrink-0 rounded-t-2xl">
                <h2 className="font-bold text-lg">Create Chart of Account</h2>
                <Button variant="outline" size="sm" className="text-gray-800" onClick={onClose}>
                  Close
                </Button>
              </div>

              {/* Body */}
              <div className="flex flex-1 overflow-hidden">

                {/* LEFT: Search & Preview */}
                <div className="w-[380px] shrink-0 border-r flex flex-col bg-gray-50">
                  <div className="p-4 border-b bg-white">
                    <Label className="text-xs text-gray-500 uppercase tracking-wide mb-1 block">
                      Search by Account Code
                    </Label>
                    <Input
                      placeholder="e.g. 31200000"
                      value={searchCode}
                      onChange={(e) => setSearchCode(e.target.value)}
                      className="bg-white"
                    />
                    <p className="text-[11px] text-gray-400 mt-1">
                      {searchCode.trim()
                        ? `${filteredPreview.length} result(s)`
                        : `Showing first 20 of ${allAccounts.length} accounts`}
                    </p>
                  </div>

                  <div className="flex-1 overflow-y-auto p-3 space-y-2">
                    {filteredPreview.length === 0 ? (
                      <p className="text-center text-gray-400 text-sm mt-8">No accounts found.</p>
                    ) : (
                      filteredPreview.map((acc) => (
                        <AccountPreviewCard key={acc.Id} account={acc} />
                      ))
                    )}
                  </div>
                </div>

                {/* RIGHT: Form */}
                <div className="flex-1 overflow-y-auto p-5">
                  <form className="space-y-4" onSubmit={handleSubmit}>

                    <div>
                      <Label htmlFor="accountName">Account Name</Label>
                      <Input
                        id="accountName"
                        name="accountName"
                        value={form.accountName}
                        onChange={handleChange}
                        placeholder="Fixed Assets"
                        className="bg-white"
                        required
                      />
                    </div>

                    <div>
                      <Label htmlFor="accountCode">Account Code</Label>
                      <Input
                        id="accountCode"
                        name="accountCode"
                        value={form.accountCode}
                        onChange={handleChange}
                        placeholder="1067"
                        className="bg-white"
                        required
                      />
                    </div>

                    <div>
                      <Label>Account Type</Label>
                      <Select
                        value={form.accountType}
                        onValueChange={(val) => handleSelectChange("accountType", val)}
                      >
                        <SelectTrigger className="bg-white">
                          <SelectValue placeholder="Select type" />
                        </SelectTrigger>
                        <SelectContent>
                          {accountTypes.map((t) => (
                            <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label>Account Category</Label>
                      <Select
                        value={form.accountCategory}
                        onValueChange={(val) => handleSelectChange("accountCategory", val)}
                      >
                        <SelectTrigger className="bg-white">
                          <SelectValue placeholder="Select category" />
                        </SelectTrigger>
                        <SelectContent>
                          {accountCategories.map((c) => (
                            <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Parent Account — modal picker */}
                    <div>
                      <Label>Group Account</Label>
                      {selectedParent ? (
                        <div className="flex items-center gap-2 mt-1 p-2 rounded-lg border bg-indigo-50 border-indigo-200">
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-mono text-indigo-700 font-bold">
                              {selectedParent.AccountCode}
                            </p>
                            <p className="text-sm font-medium text-gray-800 truncate">
                              {selectedParent.AccountName}
                            </p>
                          </div>
                          <button
                            type="button"
                            onClick={() => setParentModalOpen(true)}
                            className="text-xs text-indigo-600 hover:underline shrink-0"
                          >
                            Change
                          </button>
                          <button
                            type="button"
                            onClick={handleClearParent}
                            className="text-xs text-red-500 hover:underline shrink-0"
                          >
                            Clear
                          </button>
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={() => setParentModalOpen(true)}
                          className="mt-1 w-full flex items-center justify-between px-3 py-2 rounded-lg border border-gray-300 bg-white text-sm text-gray-400 hover:border-indigo-400 hover:text-gray-700 transition-colors"
                        >
                          <span>Select parent account (optional)</span>
                          <span className="text-gray-400">⌕</span>
                        </button>
                      )}
                    </div>

                    <div>
                      <Label htmlFor="depth">Depth</Label>
                      <Input
                        id="depth"
                        name="depth"
                        value={form.depth}
                        onChange={handleChange}
                        placeholder="1"
                        className="bg-white"
                      />
                    </div>

                    <Button type="submit" className="w-full bg-indigo-800" disabled={loading}>
                      {loading ? "Creating..." : "Create Account"}
                    </Button>
                  </form>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Parent picker modal — rendered outside drawer so z-index stacks correctly */}
      <ParentAccountModal
        open={parentModalOpen}
        accounts={allAccounts}
        onSelect={handleParentSelect}
        onClose={() => setParentModalOpen(false)}
      />
    </>
  );
}
