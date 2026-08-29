import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import Swal from "sweetalert2";
import { FaPlus, FaTrash, FaBell } from "react-icons/fa";
import { apiFetch } from "@/lib/api";
import { apiErrorMessage, readApiResponse } from "@/lib/api-errors";
import FieldHelp from "@/pages/Accounts/SavingsProducts/FieldHelp";

const BASE = `${import.meta.env.VITE_APP_FIN_URL}`;
// Singular — api/registry/customer (CustomerController.cs), backed by
// ICustomerAppService. NOT api/registry/customers (plural,
// CustomersController.cs) — that one depends on a raw-SQL, non-AppService
// class and turned out to be dead for real customer-creation traffic; its
// duplicate copy of these same two actions has been removed.
const CUSTOMERS_BASE = `${BASE}/api/registry/customer`;

const QUEUE_PRIORITY_LABEL = { 0: "Lowest", 1: "Very Low", 2: "Low", 3: "Normal", 4: "Above Normal", 5: "High", 6: "Very High", 7: "Highest" };

const valueOf = (item) => Number(item?.Value ?? item?.value);
const descriptionOf = (item) => item?.Description ?? item?.description ?? "";
const normalizePreference = (item = {}) => ({
  Type: Number(item.Type ?? item.type),
  Threshold: Number(item.Threshold ?? item.threshold ?? 0),
  Priority: Number(item.Priority ?? item.priority ?? 3),
  MaskTransactionValue: Boolean(item.MaskTransactionValue ?? item.maskTransactionValue),
  ReceiveTextAlert: Boolean(item.ReceiveTextAlert ?? item.receiveTextAlert),
  ReceiveEmailAlert: Boolean(item.ReceiveEmailAlert ?? item.receiveEmailAlert),
});

async function unwrapJson(responsePromise) {
  const res = await responsePromise;
  const body = await readApiResponse(res, { fallbackMessage: "Account alert request failed." });
  return body?.data ?? body;
}

function FieldGroup({ label, help, children }) {
  return (
    <div>
      <div className="flex items-center gap-1"><Label className="text-sm font-semibold text-gray-700">{label}</Label><FieldHelp label={label}>{help}</FieldHelp></div>
      {children}
    </div>
  );
}

const emptyRow = { Type: "", Threshold: 0, Priority: 3, MaskTransactionValue: false, ReceiveTextAlert: true, ReceiveEmailAlert: true };

// Per-customer, per-transaction-type notification opt-in/threshold — the
// actual lever behind "why isn't this customer getting SMS/email alerts
// for their transactions" (see api/registry/customer/{id}/account-alerts,
// WebApplication1/Areas/Registry/Controllers/CustomersController.cs). Full
// replace on save: the backend deletes every existing row for this
// customer and re-inserts exactly what's submitted here, so there's no
// per-row Id to track — rows are plain local objects.
export default function AlertPreferencesDrawer({ open, onClose, customerId, customerName }) {
  const [rows, setRows] = useState([]);
  const [transactionCodes, setTransactionCodes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [addForm, setAddForm] = useState(emptyRow);

  useEffect(() => {
    if (!open || !customerId) return;
    setLoading(true);
    Promise.all([
      unwrapJson(apiFetch(`${CUSTOMERS_BASE}/transaction-codes`)),
      unwrapJson(apiFetch(`${CUSTOMERS_BASE}/${customerId}/account-alerts`)),
    ])
      .then(([codes, preferences]) => {
        setTransactionCodes(codes || []);
        setRows((preferences || []).map(normalizePreference));
      })
      .catch((err) => Swal.fire("Unable to load alert preferences", apiErrorMessage(err), "error"))
      .finally(() => setLoading(false));
  }, [open, customerId]);

  const configuredTypes = new Set(rows.map((r) => Number(r.Type)));
  const availableCodes = transactionCodes.filter((c) => !configuredTypes.has(valueOf(c)));

  const handleAdd = () => {
    if (addForm.Type === "") {
      Swal.fire("Missing Field", "Select a transaction type.", "warning");
      return;
    }
    setRows((prev) => [...prev, { ...addForm, Type: Number(addForm.Type) }]);
    setAddForm(emptyRow);
  };

  const handleRemove = (index) => setRows((prev) => prev.filter((_, i) => i !== index));

  const updateRow = (index, field, value) => setRows((prev) => prev.map((r, i) => (i === index ? { ...r, [field]: value } : r)));

  const handleSave = async () => {
    const validTypes = new Set(transactionCodes.map(valueOf).filter(Number.isInteger));
    const invalidType = rows.findIndex((row) => !Number.isInteger(Number(row.Type)) || !validTypes.has(Number(row.Type)));
    if (invalidType >= 0) return Swal.fire("Invalid transaction type", `Alert ${invalidType + 1} references a transaction type that is no longer available. Remove it and add the correct transaction type again.`, "warning");
    const invalidThreshold = rows.findIndex((row) => !Number.isFinite(Number(row.Threshold)) || Number(row.Threshold) < 0);
    if (invalidThreshold >= 0) return Swal.fire("Invalid threshold", `Alert ${invalidThreshold + 1} needs a threshold of zero or more.`, "warning");
    const invalidPriority = rows.findIndex((row) => !Number.isInteger(Number(row.Priority)) || Number(row.Priority) < 0 || Number(row.Priority) > 7);
    if (invalidPriority >= 0) return Swal.fire("Invalid priority", `Alert ${invalidPriority + 1} needs a priority from Lowest to Highest.`, "warning");
    const missingChannel = rows.findIndex((row) => !row.ReceiveTextAlert && !row.ReceiveEmailAlert);
    if (missingChannel >= 0) return Swal.fire("Delivery channel required", `Alert ${missingChannel + 1} must use SMS, email, or both.`, "warning");
    setSaving(true);
    try {
      const saved = await unwrapJson(apiFetch(`${CUSTOMERS_BASE}/${customerId}/account-alerts`, {
        method: "PUT",
        body: JSON.stringify(rows),
      }));
      setRows((saved || []).map(normalizePreference));
      Swal.fire("Success", "Alert preferences saved.", "success");
    } catch (err) {
      Swal.fire("Unable to save alert preferences", apiErrorMessage(err, "The alert preferences could not be saved."), "error");
    } finally {
      setSaving(false);
    }
  };

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div className="fixed inset-0 bg-black z-40" initial={{ opacity: 0 }} animate={{ opacity: 0.4 }} exit={{ opacity: 0 }} onClick={onClose} />
          <motion.div className="fixed top-5 right-3 w-[480px] bg-white shadow-xl z-50 flex flex-col rounded-2xl p-3 max-h-[95vh]" initial={{ x: "100%" }} animate={{ x: 0 }} exit={{ x: "100%" }} transition={{ type: "spring", stiffness: 300, damping: 30 }}>
            <div className="p-4 flex justify-between items-center bg-indigo-600 rounded-2xl m-2 shrink-0">
              <h2 className="font-bold text-lg text-white flex items-center gap-2"><FaBell /> Alert Preferences</h2>
              <Button variant="outline" size="sm" onClick={onClose}>Close</Button>
            </div>

            <div className="p-4 space-y-4 overflow-y-auto flex-1 min-h-0">
              <p className="text-xs text-gray-400">{customerName}</p>

              {loading ? (
                <div className="space-y-2 animate-pulse">
                  {[1, 2].map((i) => <div key={i} className="h-10 bg-gray-100 rounded-lg" />)}
                </div>
              ) : rows.length > 0 ? (
                <div className="space-y-3">
                  {rows.map((row, index) => {
                    const code = transactionCodes.find((c) => valueOf(c) === Number(row.Type));
                    return (
                      <div key={index} className="border rounded-lg p-3 space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-semibold text-indigo-700">{descriptionOf(code) || `Type ${row.Type}`}</span>
                          <Button size="sm" variant="outline" onClick={() => handleRemove(index)}><FaTrash className="text-red-600" /></Button>
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                          <FieldGroup label="Threshold" help="The minimum transaction amount that triggers this alert. Set it to 0 to notify the customer for every transaction of this type.">
                            <Input type="number" min="0" step="0.01" value={row.Threshold} onChange={(e) => updateRow(index, "Threshold", Number(e.target.value))} />
                          </FieldGroup>
                          <FieldGroup label="Priority" help="Controls how urgently the notification enters the outbound processing queue. Normal is suitable for routine alerts.">
                            <Select value={String(row.Priority)} onValueChange={(v) => updateRow(index, "Priority", Number(v))}>
                              <SelectTrigger><SelectValue /></SelectTrigger>
                              <SelectContent>
                                {Object.entries(QUEUE_PRIORITY_LABEL).map(([value, label]) => (
                                  <SelectItem key={value} value={value}>{label}</SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </FieldGroup>
                        </div>
                        <div className="flex flex-wrap gap-3 text-sm text-gray-700">
                          <label className="flex items-center gap-1">
                            <input type="checkbox" className="w-4 h-4 accent-indigo-600" checked={row.ReceiveTextAlert} onChange={(e) => updateRow(index, "ReceiveTextAlert", e.target.checked)} /> SMS
                            <FieldHelp label="SMS alerts">Send qualifying alerts to the customer's registered mobile number.</FieldHelp>
                          </label>
                          <label className="flex items-center gap-1">
                            <input type="checkbox" className="w-4 h-4 accent-indigo-600" checked={row.ReceiveEmailAlert} onChange={(e) => updateRow(index, "ReceiveEmailAlert", e.target.checked)} /> Email
                            <FieldHelp label="Email alerts">Send qualifying alerts to the customer's registered email address.</FieldHelp>
                          </label>
                          <label className="flex items-center gap-1">
                            <input type="checkbox" className="w-4 h-4 accent-indigo-600" checked={row.MaskTransactionValue} onChange={(e) => updateRow(index, "MaskTransactionValue", e.target.checked)} /> Mask Amount
                            <FieldHelp label="Mask transaction amount">Exclude the transaction value from the notification for privacy.</FieldHelp>
                          </label>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <p className="text-sm text-gray-400 text-center py-2">No alert preferences configured — this customer receives no transaction notifications.</p>
              )}

              <div className="bg-gray-100 rounded-lg p-3 space-y-2">
                <p className="text-xs font-semibold uppercase tracking-wider text-gray-400">Add Preference</p>
                <div className="flex items-center gap-1 text-sm font-semibold text-gray-700">Transaction Type <FieldHelp label="Transaction Type">The operational event this preference watches. Only one alert preference can be configured per transaction type.</FieldHelp></div>
                <Select value={addForm.Type === "" ? "" : String(addForm.Type)} onValueChange={(v) => setAddForm((p) => ({ ...p, Type: v }))}>
                  <SelectTrigger><SelectValue placeholder="Select Transaction Type" /></SelectTrigger>
                  <SelectContent className="max-h-60 overflow-y-auto">
                    {availableCodes.map((c) => (
                      <SelectItem key={valueOf(c)} value={String(valueOf(c))}>{descriptionOf(c)}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button type="button" size="sm" onClick={handleAdd} className="bg-indigo-600 hover:bg-indigo-700 flex items-center gap-1">
                  <FaPlus /> Add
                </Button>
              </div>
            </div>

            <div className="p-4 pt-3 border-t shrink-0">
              <Button onClick={handleSave} disabled={saving || loading} className="w-full bg-indigo-600 hover:bg-indigo-700">
                {saving ? "Saving..." : "Save Preferences"}
              </Button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
