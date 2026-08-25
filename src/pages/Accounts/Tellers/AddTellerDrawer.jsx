import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import Swal from "sweetalert2";
import { apiFetch } from "@/lib/api";
import { listAllChartOfAccounts } from "@/pages/Accounts/ChartOfAccounts/api";

//const BASE = "https://rubani.ngrok.io";
const BASE = `${import.meta.env.VITE_APP_FIN_URL}`

const tellerTypeOptions = [
  { value: 0, label: "Employee" },
  { value: 1, label: "ATM Terminal" },
  { value: 2, label: "POS Terminal (In-house)" },
  { value: 3, label: "POS Terminal (Agent)" }
];

const defaultForm = {
  TellerType: "",
  Description: "",
  RangeLowerLimit: "",
  RangeUpperLimit: "",
  EmployeeId: "",
  EmployeeCustomerId: "",
  ChartOfAccountId: "",
  ShortageChartOfAccountId: "",
  ExcessChartOfAccountId: "",
  Reference: "",
  IsLocked: false,
};

function Field({ label, children }) {
  return (
    <div>
      <Label>{label}</Label>
      {children}
    </div>
  );
}

function TextInput({ label, value, onChange, placeholder = "", type = "text", required = false }) {
  return (
    <Field label={label}>
      <Input type={type} value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} required={required} />
    </Field>
  );
}

function CoaSelect({ label, value, onChange, accounts, disabled }) {
  return (
    <Field label={label}>
      <Select value={value} onValueChange={onChange} disabled={disabled}>
        <SelectTrigger><SelectValue placeholder={disabled ? "Loading..." : "Select Account"} /></SelectTrigger>
        <SelectContent className="max-h-60 overflow-y-auto">
          {accounts.map((a) => (
            <SelectItem key={a.Id} value={a.Id}>
              {a.AccountCode} — {a.AccountName}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </Field>
  );
}

export default function AddTellerDrawer({ open, onClose, onSuccess }) {
  const [form, setForm] = useState(defaultForm);
  const [employees, setEmployees] = useState([]);
  const [accounts, setAccounts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loadingData, setLoadingData] = useState(false);

  const set = (field, value) => setForm((prev) => ({ ...prev, [field]: value }));

  useEffect(() => {
    if (!open) return;
    setLoadingData(true);
    Promise.all([
      apiFetch(`${BASE}/api/humanresource/employees`).then((r) => r.json()),
      listAllChartOfAccounts(),
    ]).then(([empData, accounts]) => {
      setEmployees(Array.isArray(empData) ? empData : []);
      setAccounts(accounts);
    }).catch(() => { }).finally(() => setLoadingData(false));
  }, [open]);

  const handleEmployeeChange = (employeeId) => {
    const emp = employees.find((e) => e.Id === employeeId);
    setForm((prev) => ({
      ...prev,
      EmployeeId: employeeId,
      EmployeeCustomerId: emp?.CustomerId ?? "",
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const payload = {
        TellerType: parseInt(form.TellerType) || 0,
        Description: form.Description,
        RangeLowerLimit: parseFloat(form.RangeLowerLimit) || 0,
        RangeUpperLimit: parseFloat(form.RangeUpperLimit) || 0,
        EmployeeId: form.EmployeeId,
        EmployeeCustomerId: form.EmployeeCustomerId,
        ChartOfAccountId: form.ChartOfAccountId,
        ShortageChartOfAccountId: form.ShortageChartOfAccountId,
        ExcessChartOfAccountId: form.ExcessChartOfAccountId,
        Reference: form.Reference,
        IsLocked: form.IsLocked,
      };

      const res = await apiFetch(`${BASE}/api/frontoffice/tellers`, {
        method: "POST",
        body: JSON.stringify(payload),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.message || "Failed to create teller");

      Swal.fire("Success", "Teller created successfully", "success");
      setForm(defaultForm);
      if (onSuccess) onSuccess();
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
            className="fixed top-5 right-3 bottom-5 w-[480px] bg-white shadow-xl z-50 flex flex-col rounded-2xl p-3"
            initial={{ x: "100%" }} animate={{ x: 0 }} exit={{ x: "100%" }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
          >
            <div className="p-4 flex justify-between items-center bg-indigo-600 rounded-2xl m-2">
              <h2 className="font-bold text-lg text-white">Add Teller</h2>
              <Button variant="outline" size="sm" onClick={onClose}>Close</Button>
            </div>

            <div className="p-4 flex-1 overflow-y-auto">
              <form onSubmit={handleSubmit} className="space-y-4">

                {/* Teller Type */}
                <Field label="Teller Type">
                  <Select value={String(form.TellerType)} onValueChange={(v) => set("TellerType", v)}>
                    <SelectTrigger><SelectValue placeholder="Select Teller Type" /></SelectTrigger>
                    <SelectContent>
                      {tellerTypeOptions.map((o) => (
                        <SelectItem key={o.value} value={String(o.value)}>{o.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </Field>

                {/* Description */}
                <TextInput label="Description" value={form.Description} onChange={(v) => set("Description", v)} placeholder="e.g. Main Teller" required />

                {/* Employee */}
                <Field label="Employee">
                  <Select value={form.EmployeeId} onValueChange={handleEmployeeChange} disabled={loadingData}>
                    <SelectTrigger><SelectValue placeholder={loadingData ? "Loading..." : "Select Employee"} /></SelectTrigger>
                    <SelectContent className="max-h-60 overflow-y-auto">
                      {employees.map((emp) => (
                        <SelectItem key={emp.Id} value={emp.Id}>
                          {`${emp.CustomerIndividualFirstName ?? ""} ${emp.CustomerIndividualLastName ?? ""}`.trim() || emp.Id}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </Field>

                {/* Range limits */}
                <div className="flex gap-3">
                  <div className="flex-1">
                    <TextInput label="Lower Limit" type="number" value={form.RangeLowerLimit} onChange={(v) => set("RangeLowerLimit", v)} placeholder="e.g. 50000" />
                  </div>
                  <div className="flex-1">
                    <TextInput label="Upper Limit" type="number" value={form.RangeUpperLimit} onChange={(v) => set("RangeUpperLimit", v)} placeholder="e.g. 100000" />
                  </div>
                </div>

                {/* Chart of Accounts */}
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider pt-1">Chart of Accounts</p>
                <CoaSelect label="Chart of Account" value={form.ChartOfAccountId} onChange={(v) => set("ChartOfAccountId", v)} accounts={accounts} disabled={loadingData} />
                <CoaSelect label="Shortage Chart of Account" value={form.ShortageChartOfAccountId} onChange={(v) => set("ShortageChartOfAccountId", v)} accounts={accounts} disabled={loadingData} />
                <CoaSelect label="Excess Chart of Account" value={form.ExcessChartOfAccountId} onChange={(v) => set("ExcessChartOfAccountId", v)} accounts={accounts} disabled={loadingData} />

                {/* Reference */}
                <TextInput label="Reference" value={form.Reference} onChange={(v) => set("Reference", v)} placeholder="e.g. New Teller" />

                {/* Is Locked */}
                <div className="flex items-center gap-2">
                  <input type="checkbox" id="teller-locked" checked={form.IsLocked} onChange={(e) => set("IsLocked", e.target.checked)} className="w-4 h-4 accent-indigo-600" />
                  <Label htmlFor="teller-locked">Is Locked?</Label>
                </div>

                <Button type="submit" disabled={loading} className="w-full bg-indigo-600 hover:bg-indigo-700">
                  {loading ? "Saving..." : "Create Teller"}
                </Button>
              </form>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
