import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import Swal from "sweetalert2";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { apiFetch, normalizeList } from "@/lib/api";
import { createEmailAlert, getEmailAlert, QueuePriority } from "./api";

const FIN_BASE = `${import.meta.env.VITE_APP_FIN_URL}`;

function DrawerShell({ open, title, onClose, children, footer }) {
  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div className="fixed inset-0 z-40 bg-black" initial={{ opacity: 0 }} animate={{ opacity: 0.4 }} exit={{ opacity: 0 }} onClick={onClose} />
          <motion.div className="fixed right-0 top-0 z-50 flex h-full w-[600px] max-w-[92vw] flex-col bg-white shadow-2xl" initial={{ x: "100%" }} animate={{ x: 0 }} exit={{ x: "100%" }} transition={{ type: "spring", stiffness: 300, damping: 30 }}>
            <div className="m-2 flex items-center justify-between rounded-2xl bg-indigo-600 px-4 py-3">
              <h2 className="font-bold text-white">{title}</h2>
              <Button type="button" variant="outline" size="sm" onClick={onClose}>Close</Button>
            </div>
            <div className="flex-1 space-y-4 overflow-y-auto px-5 py-4">{children}</div>
            {footer && <div className="shrink-0 border-t px-5 py-3">{footer}</div>}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

function FieldGroup({ label, children }) {
  return <div><Label className="text-sm font-semibold text-gray-700">{label}</Label>{children}</div>;
}

const emptyForm = {
  branchId: "", mailMessageFrom: "", mailMessageTo: "", mailMessageCC: "",
  mailMessageSubject: "", mailMessageBody: "", mailMessageIsBodyHtml: true,
  mailMessagePriority: QueuePriority.Normal, mailMessageSecurityCritical: false,
};

export function ComposeEmailDrawer({ open, onClose, onSuccess }) {
  const [form, setForm] = useState(emptyForm);
  const [branches, setBranches] = useState([]);
  const [loadingBranches, setLoadingBranches] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!open) return;
    setForm(emptyForm);
    setLoadingBranches(true);
    apiFetch(`${FIN_BASE}/api/administration/branches?pageIndex=0&pageSize=1000`)
      .then((response) => response.json())
      .then((body) => setBranches(normalizeList(body)))
      .catch(() => setBranches([]))
      .finally(() => setLoadingBranches(false));
  }, [open]);

  const update = (key, value) => setForm((previous) => ({ ...previous, [key]: value }));

  const selectBranch = (branchId) => {
    const branch = branches.find((item) => String(item.Id) === String(branchId));
    setForm((previous) => ({
      ...previous,
      branchId,
      mailMessageFrom: branch?.AddressEmail || branch?.CompanyAddressEmail || previous.mailMessageFrom,
    }));
  };

  const submit = async (event) => {
    event.preventDefault();
    if (!form.mailMessageFrom || !form.mailMessageTo || !form.mailMessageSubject || !form.mailMessageBody) {
      Swal.fire("Missing Fields", "Sender, recipient, subject, and message are required.", "warning");
      return;
    }

    setSubmitting(true);
    try {
      await createEmailAlert({ ...form, mailMessagePriority: Number(form.mailMessagePriority) });
      Swal.fire("Queued", "The email alert has been queued for delivery.", "success");
      onSuccess();
      onClose();
    } catch (error) {
      Swal.fire("Error", error.message || "Unable to queue the email alert.", "error");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <DrawerShell open={open} title="Compose Email Alert" onClose={onClose} footer={
      <Button type="submit" form="compose-email-alert" disabled={submitting || loadingBranches} className="w-full bg-indigo-600 hover:bg-indigo-700">
        {submitting ? "Queueing..." : "Queue Email"}
      </Button>
    }>
      <form id="compose-email-alert" onSubmit={submit} className="space-y-4">
        <FieldGroup label="Branch">
          <Select value={form.branchId} onValueChange={selectBranch} disabled={loadingBranches}>
            <SelectTrigger><SelectValue placeholder={loadingBranches ? "Loading branches..." : "Select a branch (optional)"} /></SelectTrigger>
            <SelectContent className="max-h-60 overflow-y-auto">
              {branches.map((branch) => <SelectItem key={branch.Id} value={String(branch.Id)}>{branch.Description}</SelectItem>)}
            </SelectContent>
          </Select>
        </FieldGroup>
        <FieldGroup label="Sender">
          <Input type="email" value={form.mailMessageFrom} onChange={(event) => update("mailMessageFrom", event.target.value)} placeholder="sender@example.org" required />
          <p className="mt-1 text-xs text-gray-400">The dispatcher ultimately sends using its configured SMTP identity.</p>
        </FieldGroup>
        <FieldGroup label="Recipient(s)">
          <Input value={form.mailMessageTo} onChange={(event) => update("mailMessageTo", event.target.value)} placeholder="recipient@example.org; another@example.org" required />
        </FieldGroup>
        <FieldGroup label="CC">
          <Input value={form.mailMessageCC} onChange={(event) => update("mailMessageCC", event.target.value)} placeholder="Optional; separate addresses with semicolons" />
        </FieldGroup>
        <FieldGroup label="Subject">
          <Input value={form.mailMessageSubject} onChange={(event) => update("mailMessageSubject", event.target.value)} required />
        </FieldGroup>
        <FieldGroup label="Priority">
          <Select value={String(form.mailMessagePriority)} onValueChange={(value) => update("mailMessagePriority", Number(value))}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {Object.entries(QueuePriority).map(([label, value]) => <SelectItem key={value} value={String(value)}>{label.replace(/([a-z])([A-Z])/g, "$1 $2")}</SelectItem>)}
            </SelectContent>
          </Select>
        </FieldGroup>
        <FieldGroup label="Message">
          <textarea rows={10} value={form.mailMessageBody} onChange={(event) => update("mailMessageBody", event.target.value)} className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm" required />
        </FieldGroup>
        <label className="flex items-center gap-2 text-sm text-gray-700">
          <input type="checkbox" className="h-4 w-4 accent-indigo-600" checked={form.mailMessageIsBodyHtml} onChange={(event) => update("mailMessageIsBodyHtml", event.target.checked)} />
          Treat message as HTML
        </label>
        <label className="flex items-center gap-2 text-sm text-gray-700">
          <input type="checkbox" className="h-4 w-4 accent-indigo-600" checked={form.mailMessageSecurityCritical} onChange={(event) => update("mailMessageSecurityCritical", event.target.checked)} />
          Security-critical message
        </label>
      </form>
    </DrawerShell>
  );
}

const value = (item, camel, pascal) => item?.[camel] ?? item?.[pascal] ?? "";
const displayDate = (dateValue) => {
  if (!dateValue) return "—";
  const date = new Date(dateValue);
  return Number.isNaN(date.getTime()) ? "—" : date.toLocaleString();
};

export function EmailAlertDetailsDrawer({ id, onClose }) {
  const [item, setItem] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    getEmailAlert(id)
      .then(setItem)
      .catch((error) => Swal.fire("Error", error.message || "Unable to load the email alert.", "error"))
      .finally(() => setLoading(false));
  }, [id]);

  const rows = item ? [
    ["From", value(item, "mailMessageFrom", "MailMessageFrom")],
    ["To", value(item, "mailMessageTo", "MailMessageTo")],
    ["CC", value(item, "mailMessageCC", "MailMessageCC")],
    ["Subject", value(item, "mailMessageSubject", "MailMessageSubject")],
    ["Status", value(item, "mailMessageDLRStatusDescription", "MailMessageDLRStatusDescription")],
    ["Origin", value(item, "mailMessageOriginDescription", "MailMessageOriginDescription")],
    ["Priority", value(item, "mailMessagePriorityDescription", "MailMessagePriorityDescription")],
    ["Created By", value(item, "createdBy", "CreatedBy")],
    ["Created", displayDate(value(item, "createdDate", "CreatedDate"))],
  ] : [];

  return (
    <DrawerShell open={Boolean(id)} title="Email Alert Details" onClose={onClose}>
      {loading ? <div className="space-y-2 animate-pulse">{[1, 2, 3].map((i) => <div key={i} className="h-10 rounded bg-gray-100" />)}</div> : item && (
        <>
          <div className="divide-y rounded-lg border">
            {rows.map(([label, content]) => <div key={label} className="grid grid-cols-3 gap-3 px-4 py-3 text-sm"><span className="font-semibold text-gray-500">{label}</span><span className="col-span-2 break-words text-gray-700">{content || "—"}</span></div>)}
          </div>
          <div>
            <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-gray-400">Message</p>
            <div className="whitespace-pre-wrap break-words rounded-lg bg-gray-50 p-4 text-sm text-gray-700">{value(item, "mailMessageBody", "MailMessageBody") || "—"}</div>
          </div>
        </>
      )}
    </DrawerShell>
  );
}
