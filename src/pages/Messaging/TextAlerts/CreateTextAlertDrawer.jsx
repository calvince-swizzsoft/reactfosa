import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import Swal from "sweetalert2";
import { apiFetch, normalizeList } from "@/lib/api";
import { MessageCategory, SMS_RECIPIENT_PATTERN, createTextAlert } from "./api";

const FIN_BASE = `${import.meta.env.VITE_APP_FIN_URL}`;

const MESSAGE_CATEGORY_OPTIONS = [
  { value: MessageCategory.SMSAlert, label: "SMS Alert" },
  { value: MessageCategory.USSDQuery, label: "USSD Query" },
  { value: MessageCategory.EmailAlert, label: "Email Alert" },
  { value: MessageCategory.PluginAlert, label: "Plugin Alert" },
  { value: MessageCategory.CreditBatchEntry, label: "Credit Batch Entry" },
];

const emptyForm = {
  branchId: "",
  textMessageRecipient: "",
  textMessageBody: "",
  messageCategory: MessageCategory.SMSAlert,
  appendSignature: false,
};

function FieldGroup({ label, children }) {
  return (
    <div>
      <Label className="text-sm font-semibold text-gray-700">{label}</Label>
      {children}
    </div>
  );
}

export default function CreateTextAlertDrawer({ open, onClose, onSuccess }) {
  const [form, setForm] = useState(emptyForm);
  const [loading, setLoading] = useState(false);
  const [branches, setBranches] = useState([]);
  const [loadingBranches, setLoadingBranches] = useState(false);

  useEffect(() => {
    if (!open) return;
    setForm(emptyForm);
    setLoadingBranches(true);
    apiFetch(`${FIN_BASE}/api/administration/branches`)
      .then((r) => r.json())
      .then((d) => setBranches(normalizeList(d)))
      .catch(() => setBranches([]))
      .finally(() => setLoadingBranches(false));
  }, [open]);

  const update = (key, value) => setForm((p) => ({ ...p, [key]: value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.branchId) {
      Swal.fire("Missing Field", "Branch is required.", "warning");
      return;
    }
    if (!form.textMessageRecipient || !form.textMessageBody) {
      Swal.fire("Missing Fields", "Recipient and message are required.", "warning");
      return;
    }
    // The app service rejects an SMSAlert with a badly-formatted recipient
    // as a 500, not a clean 400 — catch it here instead of surfacing that.
    if (Number(form.messageCategory) === MessageCategory.SMSAlert && !SMS_RECIPIENT_PATTERN.test(form.textMessageRecipient)) {
      Swal.fire(
        "Invalid Recipient",
        "SMS recipients must start with + followed by the country code and number, e.g. +254712345678.",
        "warning"
      );
      return;
    }

    setLoading(true);
    try {
      await createTextAlert({
        branchId: form.branchId,
        textMessageRecipient: form.textMessageRecipient,
        textMessageBody: form.textMessageBody,
        messageCategory: Number(form.messageCategory),
        appendSignature: form.appendSignature,
      });
      Swal.fire("Success", "Text alert created successfully", "success");
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
              <h2 className="font-bold text-lg text-white">New Text Alert</h2>
              <Button variant="outline" size="sm" onClick={onClose}>Close</Button>
            </div>

            <form onSubmit={handleSubmit} className="p-5 space-y-4 overflow-y-auto">
              <FieldGroup label="Branch">
                <Select value={form.branchId ? String(form.branchId) : ""} onValueChange={(v) => update("branchId", v)} disabled={loadingBranches}>
                  <SelectTrigger><SelectValue placeholder={loadingBranches ? "Loading..." : "Select Branch"} /></SelectTrigger>
                  <SelectContent className="max-h-60 overflow-y-auto">
                    {branches.map((b) => (
                      <SelectItem key={String(b.Id)} value={String(b.Id)}>{b.Description}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </FieldGroup>

              <FieldGroup label="Category">
                <Select value={String(form.messageCategory)} onValueChange={(v) => update("messageCategory", Number(v))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {MESSAGE_CATEGORY_OPTIONS.map((o) => (
                      <SelectItem key={o.value} value={String(o.value)}>{o.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </FieldGroup>

              <FieldGroup label="Recipient">
                <Input
                  value={form.textMessageRecipient}
                  onChange={(e) => update("textMessageRecipient", e.target.value)}
                  placeholder={Number(form.messageCategory) === MessageCategory.SMSAlert ? "e.g. +254712345678" : "Recipient"}
                  required
                />
              </FieldGroup>

              <FieldGroup label="Message">
                <textarea
                  value={form.textMessageBody}
                  onChange={(e) => update("textMessageBody", e.target.value)}
                  rows={4}
                  className="w-full border rounded-md p-2 text-sm"
                  placeholder="Message body..."
                  required
                />
              </FieldGroup>

              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.appendSignature}
                  onChange={(e) => update("appendSignature", e.target.checked)}
                  className="w-4 h-4 accent-indigo-600"
                />
                <span className="text-sm font-medium text-gray-700">Append branch/company signature to message</span>
              </label>
              {form.appendSignature && (
                <p className="text-xs text-gray-400 -mt-2">
                  The branch's and company's description will be appended to the message body server-side before
                  sending — what you typed above isn't exactly what gets dispatched.
                </p>
              )}

              <p className="text-xs text-gray-400">
                Priority, delivery status, origin, and retry count are set automatically — new alerts are always
                sent as High priority, Pending, from Within the system.
              </p>

              <Button type="submit" disabled={loading || loadingBranches} className="w-full bg-indigo-600 hover:bg-indigo-700">
                {loading ? "Sending..." : "Send Text Alert"}
              </Button>
            </form>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
