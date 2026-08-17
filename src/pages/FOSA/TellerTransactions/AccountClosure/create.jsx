import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { FaUserSlash } from "react-icons/fa";
import Swal from "sweetalert2";
import { apiFetch, normalizeList } from "@/lib/api";
import { createAccountClosure } from "../accountClosuresApi";

// Create -> Registered (AccountClosureController.cs). 409 if the account
// already has a request in Registered/Approved/Audited/Deferred.
const FIN_BASE = `${import.meta.env.VITE_APP_FIN_URL}`;
const MODULE_NAVIGATION_ITEM_CODE = 25014;

function FieldGroup({ label, children }) {
  return (
    <div>
      <Label className="text-sm font-semibold text-gray-700">{label}</Label>
      {children}
    </div>
  );
}

export default function CreateAccountClosure() {
  const navigate = useNavigate();
  const [branchId, setBranchId] = useState("");
  const [branches, setBranches] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [selectedCustomerId, setSelectedCustomerId] = useState("");
  const [customerAccountId, setCustomerAccountId] = useState("");
  const [accounts, setAccounts] = useState([]);
  const [loadingAccounts, setLoadingAccounts] = useState(false);
  const [reason, setReason] = useState("");
  const [loadingData, setLoadingData] = useState(true);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setLoadingData(true);
    Promise.all([
      apiFetch(`${FIN_BASE}/api/administration/branches`).then((r) => r.json()),
      apiFetch(`${FIN_BASE}/api/registry/customers`).then((r) => r.json()),
    ]).then(([branchData, customerData]) => {
      setBranches(normalizeList(branchData));
      setCustomers(normalizeList(customerData));
    }).catch(() => { }).finally(() => setLoadingData(false));
  }, []);

  const handleCustomerChange = (customerId) => {
    setSelectedCustomerId(customerId);
    setAccounts([]);
    setCustomerAccountId("");
    if (!customerId) return;
    setLoadingAccounts(true);
    apiFetch(`${FIN_BASE}/api/accounts/customer-accounts/${customerId}/accounts`)
      .then((r) => r.json())
      .then((d) => setAccounts(normalizeList(d)))
      .catch(() => setAccounts([]))
      .finally(() => setLoadingAccounts(false));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!branchId || !customerAccountId || !reason.trim()) {
      Swal.fire("Missing Fields", "Branch, account, and reason are required.", "warning");
      return;
    }
    setLoading(true);
    try {
      await createAccountClosure({
        BranchId: branchId,
        CustomerAccountId: customerAccountId,
        Reason: reason,
        ModuleNavigationItemCode: MODULE_NAVIGATION_ITEM_CODE,
      });
      Swal.fire("Success", "Account closure request created — pending approval", "success");
      navigate("/FrontOffice/AccountClosure");
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
          <FaUserSlash className="text-white text-xl" />
          <h2 className="text-xl font-bold text-white">New Account Closure Request</h2>
        </div>
        <Link to="/FrontOffice/AccountClosure" className="text-sm text-white/80 hover:text-white">
          &larr; Back to Account Closure
        </Link>
      </div>

      <form onSubmit={handleSubmit} className="max-w-2xl space-y-4">
        <FieldGroup label="Customer">
          <Select value={selectedCustomerId} onValueChange={handleCustomerChange} disabled={loadingData}>
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
          <Select value={customerAccountId} onValueChange={setCustomerAccountId} disabled={loadingAccounts || !selectedCustomerId}>
            <SelectTrigger><SelectValue placeholder={!selectedCustomerId ? "Select a customer first" : "Select account"} /></SelectTrigger>
            <SelectContent className="max-h-60 overflow-y-auto">
              {accounts.map((a) => (
                <SelectItem key={String(a.Id)} value={String(a.Id)}>{a.CustomerAccountTypeTargetProductDescription || a.FullAccountNumber || a.Id}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </FieldGroup>

        <FieldGroup label="Branch">
          <Select value={branchId} onValueChange={setBranchId} disabled={loadingData}>
            <SelectTrigger><SelectValue placeholder="Select branch" /></SelectTrigger>
            <SelectContent className="max-h-60 overflow-y-auto">
              {branches.map((b) => <SelectItem key={String(b.Id)} value={String(b.Id)}>{b.Description}</SelectItem>)}
            </SelectContent>
          </Select>
        </FieldGroup>

        <FieldGroup label="Reason">
          <Input value={reason} onChange={(e) => setReason(e.target.value)} required placeholder="Required" />
        </FieldGroup>

        <Button type="submit" disabled={loading || loadingData} className="w-full bg-indigo-600 hover:bg-indigo-700">
          {loading ? "Creating..." : "Create Closure Request"}
        </Button>
      </form>
    </div>
  );
}
