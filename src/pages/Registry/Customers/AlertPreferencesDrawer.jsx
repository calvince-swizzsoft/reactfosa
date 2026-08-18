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

const BASE = `${import.meta.env.VITE_APP_FIN_URL}`;
// Singular — api/registry/customer (CustomerController.cs), backed by
// ICustomerAppService. NOT api/registry/customers (plural,
// CustomersController.cs) — that one depends on a raw-SQL, non-AppService
// class and turned out to be dead for real customer-creation traffic; its
// duplicate copy of these same two actions has been removed.
const CUSTOMERS_BASE = `${BASE}/api/registry/customer`;

const QUEUE_PRIORITY_LABEL = { 0: "Lowest", 1: "Very Low", 2: "Low", 3: "Normal", 4: "Above Normal", 5: "High", 6: "Very High", 7: "Highest" };

async function unwrapJson(responsePromise) {
  const res = await responsePromise;
  const body = await res.json().catch(() => ({}));
  if (!res.ok || body?.success === false) {
    throw new Error(body?.message || body?.Message || `Request failed (${res.status})`);
  }
  return body?.data ?? body;
}

function FieldGroup({ label, children }) {
  return (
    <div>
      <Label className="text-sm font-semibold text-gray-700">{label}</Label>
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
      apiFetch(`${CUSTOMERS_BASE}/transaction-codes`).then((r) => r.json()).then((body) => body?.data ?? []),
      unwrapJson(apiFetch(`${CUSTOMERS_BASE}/${customerId}/account-alerts`)),
    ])
      .then(([codes, preferences]) => {
        setTransactionCodes(codes || []);
        setRows((preferences || []).map((p) => ({
          Type: p.Type, Threshold: p.Threshold, Priority: p.Priority,
          MaskTransactionValue: p.MaskTransactionValue, ReceiveTextAlert: p.ReceiveTextAlert, ReceiveEmailAlert: p.ReceiveEmailAlert,
        })));
      })
      .catch((err) => Swal.fire("Error", err.message, "error"))
      .finally(() => setLoading(false));
  }, [open, customerId]);

  const configuredTypes = new Set(rows.map((r) => r.Type));
  const availableCodes = transactionCodes.filter((c) => !configuredTypes.has(c.Value));

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
    setSaving(true);
    try {
      const saved = await unwrapJson(apiFetch(`${CUSTOMERS_BASE}/${customerId}/account-alerts`, {
        method: "PUT",
        body: JSON.stringify(rows),
      }));
      setRows((saved || []).map((p) => ({
        Type: p.Type, Threshold: p.Threshold, Priority: p.Priority,
        MaskTransactionValue: p.MaskTransactionValue, ReceiveTextAlert: p.ReceiveTextAlert, ReceiveEmailAlert: p.ReceiveEmailAlert,
      })));
      Swal.fire("Success", "Alert preferences saved.", "success");
    } catch (err) {
      Swal.fire("Error", err.message, "error");
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
                    const code = transactionCodes.find((c) => c.Value === row.Type);
                    return (
                      <div key={index} className="border rounded-lg p-3 space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-semibold text-indigo-700">{code?.Description || `Type ${row.Type}`}</span>
                          <Button size="sm" variant="outline" onClick={() => handleRemove(index)}><FaTrash className="text-red-600" /></Button>
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                          <FieldGroup label="Threshold">
                            <Input type="number" min="0" step="0.01" value={row.Threshold} onChange={(e) => updateRow(index, "Threshold", Number(e.target.value))} />
                          </FieldGroup>
                          <FieldGroup label="Priority">
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
                          </label>
                          <label className="flex items-center gap-1">
                            <input type="checkbox" className="w-4 h-4 accent-indigo-600" checked={row.ReceiveEmailAlert} onChange={(e) => updateRow(index, "ReceiveEmailAlert", e.target.checked)} /> Email
                          </label>
                          <label className="flex items-center gap-1">
                            <input type="checkbox" className="w-4 h-4 accent-indigo-600" checked={row.MaskTransactionValue} onChange={(e) => updateRow(index, "MaskTransactionValue", e.target.checked)} /> Mask Amount
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
                <Select value={addForm.Type === "" ? "" : String(addForm.Type)} onValueChange={(v) => setAddForm((p) => ({ ...p, Type: v }))}>
                  <SelectTrigger><SelectValue placeholder="Select Transaction Type" /></SelectTrigger>
                  <SelectContent className="max-h-60 overflow-y-auto">
                    {availableCodes.map((c) => (
                      <SelectItem key={c.Value} value={String(c.Value)}>{c.Description}</SelectItem>
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
