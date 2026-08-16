import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import Swal from "sweetalert2";
import { apiFetch } from "@/lib/api";

const FIN_BASE = `${import.meta.env.VITE_APP_FIN_URL}`;
const CUSTOMER_ACCOUNT_BASE = `${FIN_BASE}/api/accounts/customer-accounts`;

const MODES = [
  { id: "single", label: "Single Account" },
  { id: "bulk", label: "Bulk by Branch" },
];

function FieldGroup({ label, children }) {
  return (
    <div>
      <Label className="text-sm font-semibold text-gray-700">{label}</Label>
      {children}
    </div>
  );
}

export default function CustomerAccountDrawer({ open, onClose, onSuccess }) {
  const [mode, setMode] = useState("single");
  const [customerId, setCustomerId] = useState("");
  const [branchId, setBranchId] = useState("");
  const [productId, setProductId] = useState("");
  const [customers, setCustomers] = useState([]);
  const [branches, setBranches] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loadingData, setLoadingData] = useState(false);

  const normalizeList = (d) => {
    const payload = d?.data ?? d?.Data ?? d;
    if (Array.isArray(payload)) return payload;
    if (Array.isArray(payload?.PageCollection)) return payload.PageCollection;
    if (Array.isArray(payload?.pageCollection)) return payload.pageCollection;
    return [];
  };

  useEffect(() => {
    if (!open) return;
    setMode("single");
    setCustomerId("");
    setBranchId("");
    setProductId("");
    setLoadingData(true);
    // Deliberately Savings/Investment only — no api/accounts/loanproducts
    // fetch here. The backend's AddNewCustomerAccount *will* create a Loan-
    // product customer account through this same generic endpoint (and
    // auto-approves it immediately, same as Investment), but doing that
    // bypasses the whole Loan Origination pipeline (Registration/Appraisal/
    // Approval/Audit) that's supposed to govern approved amount/guarantors/
    // etc. Confirmed with product owner 2026-08-16: loan accounts should
    // only ever come from that pipeline (disbursement), not this drawer.
    Promise.all([
      apiFetch(`${FIN_BASE}/api/registry/customers`).then((r) => r.json()),
      apiFetch(`${FIN_BASE}/api/administration/branches`).then((r) => r.json()),
      apiFetch(`${FIN_BASE}/api/accounts/savingsproducts`).then((r) => r.json()),
      apiFetch(`${FIN_BASE}/api/accounts/investmentsproducts`).then((r) => r.json()),
    ]).then(([customerData, branchData, savingsData, investmentData]) => {
      setCustomers(normalizeList(customerData));
      setBranches(normalizeList(branchData));
      const savings = normalizeList(savingsData).map((p) => ({ ...p, ProductType: "Savings" }));
      const investments = normalizeList(investmentData).map((p) => ({ ...p, ProductType: "Investment" }));
      setProducts([...savings, ...investments]);
    }).catch(() => { }).finally(() => setLoadingData(false));
  }, [open]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!customerId || !branchId) {
      Swal.fire("Missing Fields", "Customer and Branch are required.", "warning");
      return;
    }
    if (mode === "single" && !productId) {
      Swal.fire("Missing Field", "Product is required for a single account.", "warning");
      return;
    }

    setLoading(true);
    try {
      let res;
      if (mode === "single") {
        res = await apiFetch(CUSTOMER_ACCOUNT_BASE, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            CustomerId: customerId,
            BranchId: branchId,
            CustomerAccountTypeTargetProductId: productId,
          }),
        });
      } else {
        res = await apiFetch(`${CUSTOMER_ACCOUNT_BASE}/customer/${customerId}/branch/${branchId}`, {
          method: "POST",
        });
      }

      const data = await res.json().catch(() => ({}));
      if (!res.ok || data.success === false) {
        throw new Error(data.message || "Failed to create account(s)");
      }
      // Bulk-create's `data` is the customer's full current account list
      // (not just what this call created) — deliberately unused here rather
      // than shown as "created accounts". 201 means something new was
      // actually created; a 200 here means the call succeeded but nothing
      // new was needed (customer already had every attached product), so
      // the icon reflects that instead of always showing a plain success.
      Swal.fire("Success", data.message || "Account(s) created successfully", res.status === 201 ? "success" : "info");
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
          <motion.div
            className="fixed inset-0 bg-black z-40"
            initial={{ opacity: 0 }} animate={{ opacity: 0.4 }} exit={{ opacity: 0 }}
            onClick={onClose}
          />
          <motion.div
            className="fixed top-3 right-3 w-[80vw] max-w-[600px] bg-white shadow-2xl z-50 flex flex-col rounded-2xl"
            initial={{ x: "100%" }} animate={{ x: 0 }} exit={{ x: "100%" }}
            transition={{ type: "spring", stiffness: 280, damping: 28 }}
          >
            <div className="p-4 flex justify-between items-center bg-indigo-700 rounded-2xl m-2">
              <h2 className="font-bold text-lg text-white">New Customer Account</h2>
              <Button variant="outline" size="sm" onClick={onClose}>Close</Button>
            </div>

            <form onSubmit={handleSubmit} className="p-5 space-y-4 overflow-y-auto">
              <div className="flex gap-2">
                {MODES.map((m) => (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => setMode(m.id)}
                    className={`flex-1 rounded-md px-3 py-2 text-sm font-semibold transition-colors ${mode === m.id
                      ? "bg-indigo-600 text-white"
                      : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                      }`}
                  >
                    {m.label}
                  </button>
                ))}
              </div>

              <FieldGroup label="Customer">
                <Select value={customerId ? String(customerId) : ""} onValueChange={setCustomerId} disabled={loadingData}>
                  <SelectTrigger><SelectValue placeholder={loadingData ? "Loading..." : "Search & select customer"} /></SelectTrigger>
                  <SelectContent className="max-h-60 overflow-y-auto">
                    {customers.map((c) => {
                      const customerName = [c.IndividualFirstName, c.IndividualLastName]
                        .filter(Boolean)
                        .join(" ") || c.NonIndividualDescription || c.Description || `Customer ${c.Id}`;
                      return (
                        <SelectItem key={String(c.Id)} value={String(c.Id)}>{customerName}</SelectItem>
                      );
                    })}
                  </SelectContent>
                </Select>
              </FieldGroup>

              <FieldGroup label="Branch">
                <Select value={branchId ? String(branchId) : ""} onValueChange={setBranchId} disabled={loadingData}>
                  <SelectTrigger><SelectValue placeholder={loadingData ? "Loading..." : "Select Branch"} /></SelectTrigger>
                  <SelectContent className="max-h-60 overflow-y-auto">
                    {branches.map((b) => (
                      <SelectItem key={String(b.Id)} value={String(b.Id)}>{b.Description}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </FieldGroup>

              {mode === "single" && (
                <FieldGroup label="Product">
                  <Select value={productId ? String(productId) : ""} onValueChange={setProductId} disabled={loadingData}>
                    <SelectTrigger><SelectValue placeholder={loadingData ? "Loading..." : "Select Product"} /></SelectTrigger>
                    <SelectContent className="max-h-60 overflow-y-auto">
                      {products.map((p) => (
                        <SelectItem key={String(p.Id)} value={String(p.Id)}>
                          {p.ProductType} — {p.Description}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </FieldGroup>
              )}

              {mode === "bulk" && (
                <p className="text-xs text-gray-400">
                  Creates one account for every product on the selected branch that this customer doesn't already have.
                </p>
              )}

              <Button type="submit" disabled={loading || loadingData} className="w-full bg-indigo-600 hover:bg-indigo-700">
                {loading ? "Saving..." : mode === "single" ? "Create Account" : "Create Accounts"}
              </Button>
            </form>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
