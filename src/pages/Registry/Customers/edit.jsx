import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import Swal from "sweetalert2";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { apiFetch } from "@/lib/api";

const BASE = `${import.meta.env.VITE_APP_FIN_URL}/api/registry/customer`;
const read = (value, name) => value?.[name] ?? value?.[name[0].toLowerCase() + name.slice(1)] ?? "";
const dateValue = (value) => value ? String(value).slice(0, 10) : "";

function Field({ label, children }) {
  return <div><Label className="text-sm font-semibold text-gray-700">{label}</Label>{children}</div>;
}

export default function EditCustomerDrawer({ customerId, open, onClose, onSuccess }) {
  const [customer, setCustomer] = useState(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open || !customerId) return;
    setLoading(true);
    apiFetch(`${BASE}/${customerId}`).then(async (response) => {
      const body = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(body.message || "Could not load customer");
      setCustomer(body?.data?.customer ?? body?.Data?.Customer ?? body?.data?.Customer ?? null);
    }).catch((error) => Swal.fire("Error", error.message, "error")).finally(() => setLoading(false));
  }, [open, customerId]);

  const change = (name, value) => setCustomer((current) => {
    const camelName = name[0].toLowerCase() + name.slice(1);
    const key = Object.prototype.hasOwnProperty.call(current, name) ? name : camelName;
    return { ...current, [key]: value };
  });
  const submit = async (event) => {
    event.preventDefault();
    setSaving(true);
    try {
      const payload = { ...customer };
      delete payload.RecordStatus;
      delete payload.recordStatus;
      const response = await apiFetch(`${BASE}/${customerId}`, {
        method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload),
      });
      const body = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(body.message || "Could not submit customer edit");
      await Swal.fire("Submitted", body.message || "Customer edit submitted successfully", "success");
      onSuccess(); onClose();
    } catch (error) { Swal.fire("Error", error.message, "error"); }
    finally { setSaving(false); }
  };

  return <AnimatePresence>{open && <>
    <motion.div className="fixed inset-0 bg-black z-40" initial={{ opacity: 0 }} animate={{ opacity: 0.4 }} exit={{ opacity: 0 }} onClick={onClose} />
    <motion.div className="fixed top-3 right-3 z-50 h-[94vh] w-[82vw] max-w-4xl rounded-2xl bg-white shadow-2xl flex flex-col overflow-hidden" initial={{ x: "100%" }} animate={{ x: 0 }} exit={{ x: "100%" }} transition={{ type: "spring", stiffness: 300, damping: 30 }}>
      <div className="m-2 shrink-0 rounded-2xl bg-indigo-600 p-4 flex items-center justify-between">
        <div><h2 className="text-lg font-bold text-white">Edit Customer</h2><p className="text-xs text-indigo-100">Changes may be routed for verification.</p></div>
        <Button type="button" variant="outline" size="sm" onClick={onClose}>Close</Button>
      </div>
      {loading || !customer ? <div className="flex-1 grid place-items-center text-gray-500">Loading customer…</div> :
      <form onSubmit={submit} className="flex flex-1 min-h-0 flex-col">
        <div className="flex-1 overflow-y-auto p-6 grid grid-cols-1 md:grid-cols-2 gap-4">
          <Field label="First Name"><Input value={read(customer, "IndividualFirstName")} onChange={(e) => change("IndividualFirstName", e.target.value)} /></Field>
          <Field label="Last Name"><Input value={read(customer, "IndividualLastName")} onChange={(e) => change("IndividualLastName", e.target.value)} /></Field>
          <Field label="Identity Card Number"><Input value={read(customer, "IndividualIdentityCardNumber")} onChange={(e) => change("IndividualIdentityCardNumber", e.target.value)} /></Field>
          <Field label="Payroll Numbers"><Input value={read(customer, "IndividualPayrollNumbers")} onChange={(e) => change("IndividualPayrollNumbers", e.target.value)} /></Field>
          <Field label="Birth Date"><Input type="date" value={dateValue(read(customer, "IndividualBirthDate"))} onChange={(e) => change("IndividualBirthDate", e.target.value || null)} /></Field>
          <Field label="Employment Designation"><Input value={read(customer, "IndividualEmploymentDesignation")} onChange={(e) => change("IndividualEmploymentDesignation", e.target.value)} /></Field>
          <Field label="Email"><Input type="email" value={read(customer, "AddressEmail")} onChange={(e) => change("AddressEmail", e.target.value)} /></Field>
          <Field label="Mobile"><Input value={read(customer, "AddressMobileLine")} onChange={(e) => change("AddressMobileLine", e.target.value)} /></Field>
          <Field label="Address Line 1"><Input value={read(customer, "AddressAddressLine1")} onChange={(e) => change("AddressAddressLine1", e.target.value)} /></Field>
          <Field label="City"><Input value={read(customer, "AddressCity")} onChange={(e) => change("AddressCity", e.target.value)} /></Field>
          <Field label="Reference 1"><Input value={read(customer, "Reference1")} onChange={(e) => change("Reference1", e.target.value)} /></Field>
          <Field label="Remarks"><Input value={read(customer, "Remarks")} onChange={(e) => change("Remarks", e.target.value)} /></Field>
          <label className="flex items-center gap-2 text-sm text-gray-700"><input type="checkbox" className="w-4 h-4 accent-indigo-600" checked={Boolean(read(customer, "IsLocked"))} onChange={(e) => change("IsLocked", e.target.checked)} /> Locked</label>
          <label className="flex items-center gap-2 text-sm text-gray-700"><input type="checkbox" className="w-4 h-4 accent-indigo-600" checked={Boolean(read(customer, "InhibitGuaranteeing"))} onChange={(e) => change("InhibitGuaranteeing", e.target.checked)} /> Inhibit guaranteeing</label>
        </div>
        <div className="shrink-0 border-t p-4 flex justify-end"><Button disabled={saving} className="bg-indigo-600 hover:bg-indigo-700">{saving ? "Submitting…" : "Submit Changes"}</Button></div>
      </form>}
    </motion.div>
  </>}</AnimatePresence>;
}
