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

function TextInput({ label, value, onChange, placeholder = "", type = "text", required = false, min, step, maxLength }) {
  return (
    <Field label={label}>
      <Input type={type} value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} required={required} min={min} step={step} maxLength={maxLength} />
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

function tellerToForm(teller) {
  if (!teller) return defaultForm;
  return {
    TellerType: String(teller.Type ?? ""),
    Description: teller.Description ?? "",
    RangeLowerLimit: String(teller.RangeLowerLimit ?? ""),
    RangeUpperLimit: String(teller.RangeUpperLimit ?? ""),
    EmployeeId: teller.EmployeeId ?? "",
    EmployeeCustomerId: teller.EmployeeCustomerId ?? "",
    ChartOfAccountId: teller.ChartOfAccountId ?? "",
    ShortageChartOfAccountId: teller.ShortageChartOfAccountId ?? "",
    ExcessChartOfAccountId: teller.ExcessChartOfAccountId ?? "",
    Reference: teller.Reference ?? "",
    IsLocked: Boolean(teller.IsLocked),
  };
}

export default function AddTellerDrawer({ open, onClose, onSuccess, teller = null }) {
  const [form, setForm] = useState(defaultForm);
  const [employees, setEmployees] = useState([]);
  const [accounts, setAccounts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loadingData, setLoadingData] = useState(false);
  const isEditing = Boolean(teller?.Id);

  const set = (field, value) => setForm((prev) => ({ ...prev, [field]: value }));

  useEffect(() => {
    if (!open) return;
    setForm(tellerToForm(teller));
    setLoadingData(true);
    Promise.all([
      apiFetch(`${BASE}/api/humanresource/employees`).then((r) => r.json()),
      listAllChartOfAccounts(),
    ]).then(([empData, accounts]) => {
      const employeePayload = empData?.data ?? empData?.Data ?? empData;
      setEmployees(Array.isArray(employeePayload) ? employeePayload : []);
      setAccounts(accounts);
    }).catch(() => { }).finally(() => setLoadingData(false));
  }, [open, teller]);

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

    if (form.TellerType === "") {
      Swal.fire("Check Teller Details", "Please select a teller type.", "warning");
      return;
    }

    const tellerType = Number(form.TellerType);
    const description = form.Description.trim();
    if (!description) {
      Swal.fire("Check Teller Details", "Description is required.", "warning");
      return;
    }
    if (description.length > 256) {
      Swal.fire("Check Teller Details", "Description cannot exceed 256 characters.", "warning");
      return;
    }
    if (tellerType === 0 && !form.EmployeeId) {
      Swal.fire("Check Teller Details", "Please select the employee assigned to this teller.", "warning");
      return;
    }
    if (!form.ChartOfAccountId) {
      Swal.fire("Check Teller Details", "Please select the teller's chart of account.", "warning");
      return;
    }
    if (!form.ShortageChartOfAccountId) {
      Swal.fire("Check Teller Details", "Please select the shortage chart of account.", "warning");
      return;
    }
    if (tellerType === 0 && !form.ExcessChartOfAccountId) {
      Swal.fire("Check Teller Details", "Please select the excess chart of account used during teller balancing.", "warning");
      return;
    }
    if (form.Reference.trim().length > 256) {
      Swal.fire("Check Teller Details", "Reference cannot exceed 256 characters.", "warning");
      return;
    }

    if (form.RangeLowerLimit === "" || form.RangeUpperLimit === "") {
      Swal.fire("Check Teller Details", "Both range limits are required.", "warning");
      return;
    }

    const lowerLimit = Number(form.RangeLowerLimit);
    const upperLimit = Number(form.RangeUpperLimit);
    if (!Number.isFinite(lowerLimit) || !Number.isFinite(upperLimit)) {
      Swal.fire("Check Teller Details", "Range limits must be valid numbers.", "warning");
      return;
    }
    if (lowerLimit < 0 || upperLimit < 0) {
      Swal.fire("Check Teller Details", "Range limits cannot be negative.", "warning");
      return;
    }
    if (upperLimit <= lowerLimit) {
      Swal.fire("Check Teller Details", "The upper limit must be greater than the lower limit.", "warning");
      return;
    }

    setLoading(true);
    try {
      const payload = {
        Type: tellerType,
        Description: description,
        RangeLowerLimit: lowerLimit,
        RangeUpperLimit: upperLimit,
        EmployeeId: form.EmployeeId,
        EmployeeCustomerId: form.EmployeeCustomerId,
        ChartOfAccountId: form.ChartOfAccountId,
        ShortageChartOfAccountId: form.ShortageChartOfAccountId,
        ExcessChartOfAccountId: form.ExcessChartOfAccountId,
        Reference: form.Reference.trim(),
        IsLocked: form.IsLocked,
      };

      const res = await apiFetch(
        isEditing
          ? `${BASE}/api/frontoffice/tellers/${teller.Id}`
          : `${BASE}/api/frontoffice/tellers`, {
        method: isEditing ? "PUT" : "POST",
        body: JSON.stringify(payload),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok || data.success === false || !data.data) throw new Error(data.message || `Failed to ${isEditing ? "update" : "create"} teller`);

      Swal.fire("Success", `Teller ${isEditing ? "updated" : "created"} successfully`, "success");
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
              <h2 className="font-bold text-lg text-white">{isEditing ? "Edit Teller" : "Add Teller"}</h2>
              <Button variant="outline" size="sm" onClick={onClose}>Close</Button>
            </div>

            <div className="p-4 flex-1 overflow-y-auto">
              <form onSubmit={handleSubmit} className="space-y-4">

                {/* Teller Type */}
                <Field label="Teller Type">
                  <Select value={String(form.TellerType)} onValueChange={(v) => set("TellerType", v)} disabled={isEditing}>
                    <SelectTrigger><SelectValue placeholder="Select Teller Type" /></SelectTrigger>
                    <SelectContent>
                      {tellerTypeOptions.map((o) => (
                        <SelectItem key={o.value} value={String(o.value)}>{o.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </Field>

                {/* Description */}
                <TextInput label="Description" value={form.Description} onChange={(v) => set("Description", v)} placeholder="e.g. Main Teller" required maxLength={256} />

                {/* Employee */}
                <Field label="Employee">
                  <Select value={form.EmployeeId} onValueChange={handleEmployeeChange} disabled={loadingData || isEditing}>
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
                    <TextInput label="Lower Limit" type="number" min="0" step="0.01" required value={form.RangeLowerLimit} onChange={(v) => set("RangeLowerLimit", v)} placeholder="e.g. 50000" />
                  </div>
                  <div className="flex-1">
                    <TextInput label="Upper Limit" type="number" min="0" step="0.01" required value={form.RangeUpperLimit} onChange={(v) => set("RangeUpperLimit", v)} placeholder="e.g. 100000" />
                  </div>
                </div>

                {/* Chart of Accounts */}
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider pt-1">Chart of Accounts</p>
                <CoaSelect label="Chart of Account" value={form.ChartOfAccountId} onChange={(v) => set("ChartOfAccountId", v)} accounts={accounts} disabled={loadingData} />
                <CoaSelect label="Shortage Chart of Account" value={form.ShortageChartOfAccountId} onChange={(v) => set("ShortageChartOfAccountId", v)} accounts={accounts} disabled={loadingData} />
                <CoaSelect label="Excess Chart of Account" value={form.ExcessChartOfAccountId} onChange={(v) => set("ExcessChartOfAccountId", v)} accounts={accounts} disabled={loadingData} />

                {/* Reference */}
                <TextInput label="Reference" value={form.Reference} onChange={(v) => set("Reference", v)} placeholder="e.g. New Teller" maxLength={256} />

                {/* Is Locked */}
                <div className="flex items-center gap-2">
                  <input type="checkbox" id="teller-locked" checked={form.IsLocked} onChange={(e) => set("IsLocked", e.target.checked)} className="w-4 h-4 accent-indigo-600" />
                  <Label htmlFor="teller-locked">Is Locked?</Label>
                </div>

                <Button type="submit" disabled={loading} className="w-full bg-indigo-600 hover:bg-indigo-700">
                  {loading ? "Saving..." : isEditing ? "Update Teller" : "Create Teller"}
                </Button>
              </form>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
