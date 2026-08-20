import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import Swal from "sweetalert2";
import { FaPlus, FaTrash, FaEdit, FaUsers } from "react-icons/fa";
import { apiFetch } from "@/lib/api";

const BASE = `${import.meta.env.VITE_APP_FIN_URL}`;
// api/registry/nextofkin (NextOfKinController.cs) — wraps the pre-existing
// WebApplication1/Services/NextOfKinService.cs (raw ADO.NET, already had
// percentage-allocation validation and full CRUD, just no REST controller
// in front of it). Per-customer, like AlertPreferencesDrawer's
// account-alerts routes — unlike that one, there's no bulk-replace PUT
// here, each row is its own Create/Update/Delete call, since that's the
// shape NextOfKinService already exposes.
const NEXT_OF_KIN_BASE = `${BASE}/api/registry/nextofkin`;

const SALUTATIONS = [
  [1, "Mr"], [2, "Mrs"], [3, "Miss"], [4, "Dr"], [5, "Prof"], [6, "Rev"],
  [7, "Eng"], [8, "Hon"], [9, "Cllr"], [10, "Sir"], [11, "Ms"],
];
const GENDERS = [[1, "Male"], [2, "Female"], [3, "Non-Binary"]];
const RELATIONSHIPS = [
  [1, "Father"], [2, "Mother"], [3, "Brother"], [4, "Sister"], [5, "Wife"],
  [6, "Husband"], [7, "Son"], [8, "Daughter"], [9, "Trustee"], [10, "Other"],
];
const IDENTITY_CARD_TYPES = [
  [1, "National ID"], [2, "Passport"], [3, "Alien ID"], [4, "Birth Certificate"],
];

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

const emptyForm = {
  Salutation: "", Gender: "", Relationship: "", FirstName: "", LastName: "",
  IdentityCardType: "", IdentityCardNumber: "", AddressMobileLine: "",
  AddressEmail: "", NominatedPercentage: "", Remarks: "",
};

const toForm = (item) => ({
  Salutation: String(item.Salutation ?? ""),
  Gender: String(item.Gender ?? ""),
  Relationship: String(item.Relationship ?? ""),
  FirstName: item.FirstName || "",
  LastName: item.LastName || "",
  IdentityCardType: String(item.IdentityCardType ?? ""),
  IdentityCardNumber: item.IdentityCardNumber || "",
  AddressMobileLine: item.AddressMobileLine || "",
  AddressEmail: item.AddressEmail || "",
  NominatedPercentage: String(item.NominatedPercentage ?? ""),
  Remarks: item.Remarks || "",
});

export default function NextOfKinDrawer({ open, onClose, customerId, customerName }) {
  const [items, setItems] = useState([]);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [adding, setAdding] = useState(false);
  const [form, setForm] = useState(emptyForm);

  const fetchItems = () => {
    setLoading(true);
    unwrapJson(apiFetch(`${NEXT_OF_KIN_BASE}?customerId=${customerId}`))
      .then((data) => { setItems(data?.items ?? []); setSummary(data?.summary ?? null); })
      .catch((err) => Swal.fire("Error", err.message, "error"))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    if (!open || !customerId) return;
    setAdding(false);
    setEditingId(null);
    fetchItems();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, customerId]);

  const startAdd = () => { setForm(emptyForm); setEditingId(null); setAdding(true); };
  const startEdit = (item) => { setForm(toForm(item)); setAdding(false); setEditingId(item.Id); };
  const cancelForm = () => { setAdding(false); setEditingId(null); };

  const submitForm = async (e) => {
    e.preventDefault();
    if (form.Relationship === "" || !form.FirstName.trim() || form.NominatedPercentage === "") {
      Swal.fire("Missing Field", "Relationship, First Name, and Nominated Percentage are required.", "warning");
      return;
    }
    setSaving(true);
    try {
      const payload = {
        CustomerId: customerId,
        Salutation: Number(form.Salutation || 0),
        Gender: Number(form.Gender || 0),
        Relationship: Number(form.Relationship),
        FirstName: form.FirstName,
        LastName: form.LastName,
        IdentityCardType: Number(form.IdentityCardType || 0),
        IdentityCardNumber: form.IdentityCardNumber,
        AddressMobileLine: form.AddressMobileLine,
        AddressEmail: form.AddressEmail,
        NominatedPercentage: Number(form.NominatedPercentage),
        Remarks: form.Remarks,
      };

      if (editingId) {
        await unwrapJson(apiFetch(`${NEXT_OF_KIN_BASE}/${editingId}`, { method: "PUT", body: JSON.stringify({ ...payload, Id: editingId }) }));
      } else {
        await unwrapJson(apiFetch(NEXT_OF_KIN_BASE, { method: "POST", body: JSON.stringify(payload) }));
      }

      Swal.fire("Success", `Next of kin ${editingId ? "updated" : "added"} successfully.`, "success");
      setAdding(false);
      setEditingId(null);
      fetchItems();
    } catch (err) {
      Swal.fire("Error", err.message, "error");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (item) => {
    const confirm = await Swal.fire({
      title: "Remove next of kin?",
      text: `${item.FirstName} ${item.LastName} will be removed.`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#dc2626",
      confirmButtonText: "Remove",
    });
    if (!confirm.isConfirmed) return;

    try {
      await unwrapJson(apiFetch(`${NEXT_OF_KIN_BASE}/${item.Id}`, { method: "DELETE" }));
      fetchItems();
    } catch (err) {
      Swal.fire("Error", err.message, "error");
    }
  };

  const showForm = adding || Boolean(editingId);

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div className="fixed inset-0 bg-black z-40" initial={{ opacity: 0 }} animate={{ opacity: 0.4 }} exit={{ opacity: 0 }} onClick={onClose} />
          <motion.div className="fixed top-5 right-3 w-[480px] bg-white shadow-xl z-50 flex flex-col rounded-2xl p-3 max-h-[95vh]" initial={{ x: "100%" }} animate={{ x: 0 }} exit={{ x: "100%" }} transition={{ type: "spring", stiffness: 300, damping: 30 }}>
            <div className="p-4 flex justify-between items-center bg-indigo-600 rounded-2xl m-2 shrink-0">
              <h2 className="font-bold text-lg text-white flex items-center gap-2"><FaUsers /> Next of Kin</h2>
              <Button variant="outline" size="sm" onClick={onClose}>Close</Button>
            </div>

            <div className="p-4 space-y-4 overflow-y-auto flex-1 min-h-0">
              <p className="text-xs text-gray-400">{customerName}</p>

              {summary && (
                <div className="flex gap-2 text-xs">
                  <span className="px-2 py-1 rounded bg-blue-100 text-blue-600 font-semibold">{summary.TotalNextOfKins} nominated</span>
                  <span className={`px-2 py-1 rounded font-semibold ${summary.RemainingPercentage <= 0 ? "bg-green-100 text-green-600" : "bg-amber-100 text-amber-600"}`}>
                    {summary.TotalPercentage}% allocated, {summary.RemainingPercentage}% remaining
                  </span>
                </div>
              )}

              {loading ? (
                <div className="space-y-2 animate-pulse">
                  {[1, 2].map((i) => <div key={i} className="h-16 bg-gray-100 rounded-lg" />)}
                </div>
              ) : items.length > 0 ? (
                <div className="space-y-3">
                  {items.map((item) => (
                    <div key={item.Id} className="border rounded-lg p-3 space-y-1">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <p className="text-sm font-semibold text-indigo-700">{item.FullName?.trim() || `${item.FirstName} ${item.LastName}`}</p>
                          <p className="text-xs text-gray-500">{item.RelationshipDescription} &middot; {item.NominatedPercentage}%</p>
                        </div>
                        <div className="flex gap-1 shrink-0">
                          <Button size="sm" variant="outline" onClick={() => startEdit(item)}><FaEdit /></Button>
                          <Button size="sm" variant="outline" onClick={() => handleDelete(item)}><FaTrash className="text-red-600" /></Button>
                        </div>
                      </div>
                      {(item.AddressMobileLine || item.AddressEmail) && (
                        <p className="text-xs text-gray-400">{[item.AddressMobileLine, item.AddressEmail].filter(Boolean).join(" · ")}</p>
                      )}
                      {item.Remarks && <p className="text-xs text-gray-400">{item.Remarks}</p>}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-gray-400 text-center py-2">No next of kin recorded for this customer.</p>
              )}

              {showForm ? (
                <form onSubmit={submitForm} className="bg-gray-100 rounded-lg p-3 space-y-2">
                  <p className="text-xs font-semibold uppercase tracking-wider text-gray-400">{editingId ? "Edit" : "Add"} Next of Kin</p>

                  <div className="grid grid-cols-2 gap-2">
                    <FieldGroup label="Salutation">
                      <Select value={form.Salutation} onValueChange={(v) => setForm((p) => ({ ...p, Salutation: v }))}>
                        <SelectTrigger><SelectValue placeholder="—" /></SelectTrigger>
                        <SelectContent>{SALUTATIONS.map(([v, l]) => <SelectItem key={v} value={String(v)}>{l}</SelectItem>)}</SelectContent>
                      </Select>
                    </FieldGroup>
                    <FieldGroup label="Gender">
                      <Select value={form.Gender} onValueChange={(v) => setForm((p) => ({ ...p, Gender: v }))}>
                        <SelectTrigger><SelectValue placeholder="—" /></SelectTrigger>
                        <SelectContent>{GENDERS.map(([v, l]) => <SelectItem key={v} value={String(v)}>{l}</SelectItem>)}</SelectContent>
                      </Select>
                    </FieldGroup>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <FieldGroup label="First Name">
                      <Input value={form.FirstName} onChange={(e) => setForm((p) => ({ ...p, FirstName: e.target.value }))} required />
                    </FieldGroup>
                    <FieldGroup label="Other Names">
                      <Input value={form.LastName} onChange={(e) => setForm((p) => ({ ...p, LastName: e.target.value }))} />
                    </FieldGroup>
                  </div>

                  <FieldGroup label="Relationship">
                    <Select value={form.Relationship} onValueChange={(v) => setForm((p) => ({ ...p, Relationship: v }))}>
                      <SelectTrigger><SelectValue placeholder="Select relationship" /></SelectTrigger>
                      <SelectContent>{RELATIONSHIPS.map(([v, l]) => <SelectItem key={v} value={String(v)}>{l}</SelectItem>)}</SelectContent>
                    </Select>
                  </FieldGroup>

                  <div className="grid grid-cols-2 gap-2">
                    <FieldGroup label="ID Type">
                      <Select value={form.IdentityCardType} onValueChange={(v) => setForm((p) => ({ ...p, IdentityCardType: v }))}>
                        <SelectTrigger><SelectValue placeholder="—" /></SelectTrigger>
                        <SelectContent>{IDENTITY_CARD_TYPES.map(([v, l]) => <SelectItem key={v} value={String(v)}>{l}</SelectItem>)}</SelectContent>
                      </Select>
                    </FieldGroup>
                    <FieldGroup label="ID Number">
                      <Input value={form.IdentityCardNumber} onChange={(e) => setForm((p) => ({ ...p, IdentityCardNumber: e.target.value }))} />
                    </FieldGroup>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <FieldGroup label="Mobile">
                      <Input value={form.AddressMobileLine} onChange={(e) => setForm((p) => ({ ...p, AddressMobileLine: e.target.value }))} />
                    </FieldGroup>
                    <FieldGroup label="Email">
                      <Input value={form.AddressEmail} onChange={(e) => setForm((p) => ({ ...p, AddressEmail: e.target.value }))} />
                    </FieldGroup>
                  </div>

                  <FieldGroup label="Nominated Percentage">
                    <Input type="number" min="1" max="100" step="0.01" value={form.NominatedPercentage} onChange={(e) => setForm((p) => ({ ...p, NominatedPercentage: e.target.value }))} required />
                  </FieldGroup>

                  <FieldGroup label="Remarks">
                    <Input value={form.Remarks} onChange={(e) => setForm((p) => ({ ...p, Remarks: e.target.value }))} />
                  </FieldGroup>

                  <div className="flex gap-2 pt-1">
                    <Button type="submit" size="sm" disabled={saving} className="flex-1 bg-indigo-600 hover:bg-indigo-700">
                      {saving ? "Saving..." : editingId ? "Update" : "Add"}
                    </Button>
                    <Button type="button" size="sm" variant="outline" onClick={cancelForm}>Cancel</Button>
                  </div>
                </form>
              ) : (
                <Button type="button" size="sm" onClick={startAdd} className="w-full bg-indigo-600 hover:bg-indigo-700 flex items-center justify-center gap-1">
                  <FaPlus /> Add Next of Kin
                </Button>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
