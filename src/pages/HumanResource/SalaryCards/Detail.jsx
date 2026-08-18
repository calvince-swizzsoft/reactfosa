import { useState, useEffect } from "react";
import { Link, useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import Swal from "sweetalert2";
import NotFoundImage from "/assets/scopefinding.png";
import { FaIdCard, FaEdit, FaCheck, FaTimes, FaSyncAlt } from "react-icons/fa";
import { getSalaryCard, updateSalaryCard, listCardEntries, updateCardEntry, resetCardEntries } from "./lib/api";
import { listSalaryGroups } from "../SalaryGroups/lib/api";
import { ChargeType, CHARGE_TYPE_LABEL } from "../SalaryGroups/lib/enums";

function FieldGroup({ label, children }) {
  return (
    <div>
      <Label className="text-sm font-semibold text-gray-700">{label}</Label>
      {children}
    </div>
  );
}

function EntryRow({ entry, onSaved }) {
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({ ChargeType: entry.ChargeType, ChargePercentage: entry.ChargePercentage, ChargeFixedAmount: entry.ChargeFixedAmount });
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    try {
      await updateCardEntry(entry.Id, {
        ChargeType: form.ChargeType,
        ChargePercentage: form.ChargeType === ChargeType.Percentage ? Number(form.ChargePercentage) : 0,
        ChargeFixedAmount: form.ChargeType === ChargeType.FixedAmount ? Number(form.ChargeFixedAmount) : 0,
      });
      setEditing(false);
      onSaved();
    } catch (err) {
      Swal.fire("Error", err.message, "error");
    } finally {
      setSaving(false);
    }
  };

  const groupValue = entry.SalaryGroupEntryChargeType === ChargeType.Percentage
    ? `${entry.SalaryGroupEntryChargePercentage}%`
    : entry.SalaryGroupEntryChargeFixedAmount;

  return (
    <div className="bg-white rounded-lg shadow-lg border">
      <div className="grid grid-cols-12 gap-2 items-center py-3 px-6 hover:shadow-xl transition-all">
        <span className="col-span-4 font-medium text-indigo-700 truncate">{entry.SalaryGroupEntrySalaryHeadDescription || "—"}</span>
        <span className="col-span-3 text-sm text-gray-500">{groupValue}</span>
        {editing ? (
          <>
            <span className="col-span-3">
              <div className="flex gap-2">
                <Select value={String(form.ChargeType)} onValueChange={(v) => setForm((p) => ({ ...p, ChargeType: Number(v) }))}>
                  <SelectTrigger className="w-28"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {Object.entries(CHARGE_TYPE_LABEL).map(([value, label]) => (
                      <SelectItem key={value} value={value}>{label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Input
                  type="number" step="0.01" className="w-24"
                  value={form.ChargeType === ChargeType.Percentage ? form.ChargePercentage : form.ChargeFixedAmount}
                  onChange={(e) => setForm((p) => (p.ChargeType === ChargeType.Percentage ? { ...p, ChargePercentage: e.target.value } : { ...p, ChargeFixedAmount: e.target.value }))}
                />
              </div>
            </span>
            <div className="col-span-2 flex justify-end gap-1">
              <Button size="sm" disabled={saving} onClick={handleSave} className="bg-indigo-600 hover:bg-indigo-700"><FaCheck /></Button>
              <Button size="sm" variant="outline" onClick={() => setEditing(false)}><FaTimes /></Button>
            </div>
          </>
        ) : (
          <>
            <span className="col-span-3 text-sm font-semibold text-gray-800">
              {entry.ChargeType === ChargeType.Percentage ? `${entry.ChargePercentage}%` : entry.ChargeFixedAmount}
            </span>
            <div className="col-span-2 flex justify-end">
              <Button size="sm" variant="outline" onClick={() => setEditing(true)}><FaEdit className="text-indigo-600" /></Button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default function SalaryCardDetail() {
  const { id } = useParams();

  const [card, setCard] = useState(null);
  const [entries, setEntries] = useState([]);
  const [salaryGroups, setSalaryGroups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [resetting, setResetting] = useState(false);

  const [form, setForm] = useState({ SalaryGroupId: "", TaxExemption: 0, InsuranceReliefAmount: 0, Remarks: "", IsTaxExempt: false, IsLocked: false });
  const [savingCard, setSavingCard] = useState(false);

  const load = () => {
    setLoading(true);
    Promise.all([
      getSalaryCard(id),
      listCardEntries(id),
      listSalaryGroups({ pageSize: 200 }).then((page) => page?.PageCollection || page?.pageCollection || []),
    ])
      .then(([c, es, groups]) => {
        setCard(c);
        setEntries(es || []);
        setSalaryGroups(groups);
        setForm({
          SalaryGroupId: c.SalaryGroupId || "",
          TaxExemption: c.TaxExemption || 0,
          InsuranceReliefAmount: c.InsuranceReliefAmount || 0,
          Remarks: c.Remarks || "",
          IsTaxExempt: c.IsTaxExempt || false,
          IsLocked: c.IsLocked || false,
        });
      })
      .catch(() => Swal.fire("Error", "Failed to load salary card.", "error"))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const handleSaveCard = async (e) => {
    e.preventDefault();
    setSavingCard(true);
    try {
      await updateSalaryCard(id, {
        SalaryGroupId: form.SalaryGroupId,
        TaxExemption: Number(form.TaxExemption),
        InsuranceReliefAmount: Number(form.InsuranceReliefAmount),
        Remarks: form.Remarks,
        IsTaxExempt: form.IsTaxExempt,
        IsLocked: form.IsLocked,
      });
      Swal.fire("Success", "Salary card updated. If you changed the Salary Group, use Reset Entries below to refresh its entries.", "success");
      load();
    } catch (err) {
      Swal.fire("Error", err.message, "error");
    } finally {
      setSavingCard(false);
    }
  };

  const handleReset = async () => {
    const confirm = await Swal.fire({
      title: "Reset entries?",
      text: "This replaces every entry on this card with the Salary Group's current values, discarding any per-employee overrides.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#dc2626",
      confirmButtonText: "Reset",
    });
    if (!confirm.isConfirmed) return;

    setResetting(true);
    try {
      const refreshed = await resetCardEntries(id);
      setEntries(refreshed || []);
      Swal.fire("Success", "Salary card entries reset.", "success");
    } catch (err) {
      Swal.fire("Error", err.message, "error");
    } finally {
      setResetting(false);
    }
  };

  if (loading) {
    return <div className="p-8 text-center text-gray-500">Loading...</div>;
  }

  if (!card) {
    return (
      <div className="text-center mt-10">
        <img src={NotFoundImage} alt="Not Found" className="mx-auto w-32" />
        <p className="text-gray-400 mt-2">Salary card not found.</p>
      </div>
    );
  }

  return (
    <div className="bg-white m-8 px-8 py-8 shadow-2xl rounded-lg relative">
      <div className="flex items-center justify-between gap-3 mb-6 bg-indigo-800 px-6 py-3 rounded-2xl">
        <h2 className="text-xl font-bold text-white flex items-center gap-2">
          <FaIdCard /> {card.EmployeeCustomerFullName?.trim() || "Salary Card"}
        </h2>
        <Link to="/HumanResource/SalaryCards" className="text-sm text-white/80 hover:text-white">
          &larr; Back to Salary Cards
        </Link>
      </div>

      <form onSubmit={handleSaveCard} className="max-w-xl space-y-4 mb-8">
        <FieldGroup label="Salary Group">
          <Select value={form.SalaryGroupId} onValueChange={(v) => setForm((p) => ({ ...p, SalaryGroupId: v }))}>
            <SelectTrigger><SelectValue placeholder="Select Salary Group" /></SelectTrigger>
            <SelectContent className="max-h-60 overflow-y-auto">
              {salaryGroups.map((g) => (
                <SelectItem key={g.Id} value={g.Id}>{g.Description}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </FieldGroup>

        <FieldGroup label="Tax Exemption Amount">
          <Input type="number" min="0" step="0.01" value={form.TaxExemption} onChange={(e) => setForm((p) => ({ ...p, TaxExemption: e.target.value }))} />
        </FieldGroup>

        <FieldGroup label="Insurance Relief Amount">
          <Input type="number" min="0" step="0.01" value={form.InsuranceReliefAmount} onChange={(e) => setForm((p) => ({ ...p, InsuranceReliefAmount: e.target.value }))} />
        </FieldGroup>

        <FieldGroup label="Remarks">
          <Input value={form.Remarks} onChange={(e) => setForm((p) => ({ ...p, Remarks: e.target.value }))} />
        </FieldGroup>

        <div className="flex items-center gap-2">
          <input type="checkbox" id="card-taxexempt" checked={form.IsTaxExempt} onChange={(e) => setForm((p) => ({ ...p, IsTaxExempt: e.target.checked }))} className="w-4 h-4 accent-indigo-600" />
          <Label htmlFor="card-taxexempt">Is Tax Exempt?</Label>
        </div>
        <div className="flex items-center gap-2">
          <input type="checkbox" id="card-locked" checked={form.IsLocked} onChange={(e) => setForm((p) => ({ ...p, IsLocked: e.target.checked }))} className="w-4 h-4 accent-indigo-600" />
          <Label htmlFor="card-locked">Is Locked?</Label>
        </div>

        <Button type="submit" disabled={savingCard} className="bg-indigo-600 hover:bg-indigo-700">
          {savingCard ? "Saving..." : "Update Salary Card"}
        </Button>
      </form>

      <div className="flex items-center justify-between mb-2">
        <p className="text-xs font-semibold uppercase tracking-wider text-gray-400">Salary Head Entries</p>
        <Button size="sm" variant="outline" disabled={resetting} onClick={handleReset} className="flex items-center gap-1">
          <FaSyncAlt /> {resetting ? "Resetting..." : "Reset Entries"}
        </Button>
      </div>

      <div className="bg-gray-200 p-4 rounded-sm">
        <div className="grid grid-cols-12 gap-4 bg-gray-700 text-gray-100 font-semibold p-3 rounded-lg mb-4">
          <span className="col-span-4">Salary Head</span>
          <span className="col-span-3">Group Value</span>
          <span className="col-span-3">Card Value</span>
          <span className="col-span-2 text-right">Actions</span>
        </div>

        {entries.length > 0 ? (
          <div className="space-y-2">
            {entries.map((entry) => (
              <EntryRow key={entry.Id} entry={entry} onSaved={load} />
            ))}
          </div>
        ) : (
          <div className="text-gray-500 text-center py-4">
            <p className="font-medium text-gray-400">No entries — the linked Salary Group may have none, or try Reset Entries.</p>
          </div>
        )}
      </div>
    </div>
  );
}
