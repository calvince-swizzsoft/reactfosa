import { useState, useEffect, useRef } from "react";
import { Link, useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import Swal from "sweetalert2";
import NotFoundImage from "/assets/scopefinding.png";
import { FaLayerGroup, FaPlus, FaTrash, FaEdit, FaSave } from "react-icons/fa";
import { getSalaryGroup, updateSalaryGroup, listGroupEntries, updateGroupEntries } from "./lib/api";
import { listSalaryHeads } from "../SalaryHeads/lib/api";
import { ChargeType, CHARGE_TYPE_LABEL, RoundingType, ROUNDING_TYPE_LABEL } from "./lib/enums";

function FieldGroup({ label, children }) {
  return (
    <div>
      <Label className="text-sm font-semibold text-gray-700">{label}</Label>
      {children}
    </div>
  );
}

const emptyEntryForm = { SalaryHeadId: "", ChargeType: ChargeType.FixedAmount, ChargePercentage: 0, ChargeFixedAmount: 0, MinimumValue: 0, RoundingType: RoundingType.NoRounding };

export default function SalaryGroupDetail() {
  const { id } = useParams();
  const editorRef = useRef(null);

  const [group, setGroup] = useState(null);
  const [description, setDescription] = useState("");
  const [savingName, setSavingName] = useState(false);

  const [entries, setEntries] = useState([]);
  const [salaryHeads, setSalaryHeads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [dirty, setDirty] = useState(false);

  const [entryForm, setEntryForm] = useState(emptyEntryForm);
  const [editingIndex, setEditingIndex] = useState(null);
  const isEditing = editingIndex !== null;

  const load = () => {
    setLoading(true);
    Promise.all([
      getSalaryGroup(id),
      listGroupEntries(id),
      listSalaryHeads({ pageSize: 500 }).then((page) => page?.PageCollection || page?.pageCollection || []),
    ])
      .then(([g, es, heads]) => {
        setGroup(g);
        setDescription(g?.Description || "");
        setEntries(es || []);
        setSalaryHeads(heads);
        setDirty(false);
        setEditingIndex(null);
        setEntryForm(emptyEntryForm);
      })
      .catch(() => Swal.fire("Error", "Failed to load salary group.", "error"))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const handleSaveName = async () => {
    setSavingName(true);
    try {
      await updateSalaryGroup(id, description);
      Swal.fire("Success", "Salary group name updated.", "success");
      load();
    } catch (err) {
      Swal.fire("Error", err.message, "error");
    } finally {
      setSavingName(false);
    }
  };

  const handleAddEntry = () => {
    if (!entryForm.SalaryHeadId) {
      Swal.fire("Missing Field", "Select a Salary Head.", "warning");
      return;
    }
    const head = salaryHeads.find((h) => h.Id === entryForm.SalaryHeadId);
    const next = {
      SalaryGroupId: id,
      SalaryHeadId: entryForm.SalaryHeadId,
      SalaryHeadDescription: head?.Description || "",
      ChargeType: Number(entryForm.ChargeType),
      ChargePercentage: entryForm.ChargeType === ChargeType.Percentage ? Number(entryForm.ChargePercentage) : 0,
      ChargeFixedAmount: entryForm.ChargeType === ChargeType.FixedAmount ? Number(entryForm.ChargeFixedAmount) : 0,
      MinimumValue: Number(entryForm.MinimumValue),
      RoundingType: Number(entryForm.RoundingType),
    };
    if ([next.ChargePercentage, next.ChargeFixedAmount, next.MinimumValue].some((value) => !Number.isFinite(value) || value < 0)) {
      Swal.fire("Invalid Value", "Enter non-negative amounts and percentages.", "warning");
      return;
    }
    if (isEditing) {
      const original = entries[editingIndex];
      const unchanged = ["SalaryHeadId", "ChargeType", "ChargePercentage", "ChargeFixedAmount", "MinimumValue", "RoundingType"]
        .every((field) => original[field] === next[field]);
      if (!unchanged) {
        // The API replaces changed entries using a blank Id. Keep the original
        // row until the user explicitly applies their changes; Cancel is local.
        setEntries((prev) => prev.map((entry, index) => index === editingIndex ? { ...next, Id: "" } : entry));
        setDirty(true);
      }
    } else {
      setEntries((prev) => [...prev, { ...next, Id: "" }]);
      setDirty(true);
    }
    setEntryForm(emptyEntryForm);
    setEditingIndex(null);
  };

  const handleEditEntry = (index) => {
    const entry = entries[index];
    setEntryForm({
      SalaryHeadId: entry.SalaryHeadId,
      ChargeType: entry.ChargeType,
      ChargePercentage: entry.ChargePercentage,
      ChargeFixedAmount: entry.ChargeFixedAmount,
      MinimumValue: entry.MinimumValue,
      RoundingType: entry.RoundingType,
    });
    setEditingIndex(index);
    editorRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
  };

  const handleCancelEdit = () => {
    setEntryForm(emptyEntryForm);
    setEditingIndex(null);
  };

  const handleRemoveEntry = (index) => {
    setEntries((prev) => prev.filter((_, i) => i !== index));
    setDirty(true);
  };

  const handleSaveEntries = async () => {
    if (isEditing || saving) return;
    setSaving(true);
    try {
      const saved = await updateGroupEntries(id, entries);
      setEntries(saved || []);
      setDirty(false);
      Swal.fire("Success", "Salary group entries saved.", "success");
    } catch (err) {
      Swal.fire("Error", err.message, "error");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="p-8 text-center text-gray-500">Loading...</div>;
  }

  if (!group) {
    return (
      <div className="text-center mt-10">
        <img src={NotFoundImage} alt="Not Found" className="mx-auto w-32" />
        <p className="text-gray-400 mt-2">Salary group not found.</p>
      </div>
    );
  }

  return (
    <div className="bg-white m-8 px-8 py-8 shadow-2xl rounded-lg relative">
      <div className="flex items-center justify-between gap-3 mb-6 bg-indigo-800 px-6 py-3 rounded-2xl">
        <h2 className="text-xl font-bold text-white flex items-center gap-2">
          <FaLayerGroup /> {group.Description}
        </h2>
        <Link to="/HumanResource/SalaryGroups" className="text-sm text-white/80 hover:text-white">
          &larr; Back to Salary Groups
        </Link>
      </div>

      <div className="flex items-end gap-3 mb-6 max-w-xl">
        <FieldGroup label="Name">
          <Input value={description} onChange={(e) => setDescription(e.target.value)} />
        </FieldGroup>
        <Button onClick={handleSaveName} disabled={savingName || saving || dirty || isEditing || description === group.Description} className="bg-indigo-600 hover:bg-indigo-700">
          {savingName ? "Saving..." : "Rename"}
        </Button>
      </div>

      <p className="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-2">Entries</p>

      <div className="bg-gray-200 p-4 rounded-sm mb-6">
        <div className="grid grid-cols-12 gap-4 bg-gray-700 text-gray-100 font-semibold p-3 rounded-lg mb-4">
          <span className="col-span-4">Salary Head</span>
          <span className="col-span-2">Value Type</span>
          <span className="col-span-2">Value</span>
          <span className="col-span-2">Minimum</span>
          <span className="col-span-2 text-right">Actions</span>
        </div>

        {entries.length > 0 ? (
          <div className="space-y-2">
            {entries.map((entry, index) => (
              <div key={entry.Id || `new-${index}`} className="bg-white rounded-lg shadow-lg border">
                <div className="grid grid-cols-12 gap-2 items-center py-3 px-6 hover:shadow-xl transition-all">
                  <span className="col-span-4 font-medium text-indigo-700 truncate">
                    {entry.SalaryHeadDescription || "—"}{editingIndex === index && <span className="ml-2 text-xs text-indigo-600">(editing)</span>}{!entry.Id && <span className="ml-2 text-xs text-amber-600">(unsaved)</span>}
                  </span>
                  <span className="col-span-2 text-sm text-gray-700">{CHARGE_TYPE_LABEL[entry.ChargeType] || "—"}</span>
                  <span className="col-span-2 text-sm text-gray-700">
                    {entry.ChargeType === ChargeType.Percentage ? `${entry.ChargePercentage}%` : entry.ChargeFixedAmount}
                  </span>
                  <span className="col-span-2 text-sm text-gray-700">{entry.MinimumValue}</span>
                  <div className="col-span-2 flex justify-end gap-1">
                    <Button size="sm" variant="outline" aria-label={`Edit ${entry.SalaryHeadDescription}`} disabled={saving || isEditing} onClick={() => handleEditEntry(index)}><FaEdit className="text-indigo-600" /></Button>
                    <Button size="sm" variant="outline" aria-label={`Remove ${entry.SalaryHeadDescription}`} disabled={saving || isEditing} onClick={() => handleRemoveEntry(index)}><FaTrash className="text-red-600" /></Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-gray-500 text-center py-4">
            <p className="font-medium text-gray-400">No entries yet.</p>
          </div>
        )}
      </div>

      <div ref={editorRef} className="bg-gray-100 rounded-lg p-4 max-w-2xl space-y-4">
        <p className="text-xs font-semibold uppercase tracking-wider text-gray-400">{isEditing ? "Edit Entry" : "Add Entry"}</p>

        <FieldGroup label="Salary Head">
          <Select value={entryForm.SalaryHeadId} onValueChange={(v) => { if (v) setEntryForm((p) => ({ ...p, SalaryHeadId: v })); }}>
            <SelectTrigger><SelectValue placeholder="Select Salary Head" /></SelectTrigger>
            <SelectContent className="max-h-60 overflow-y-auto">
              {salaryHeads.map((h) => (
                <SelectItem key={h.Id} value={h.Id}>{h.Description}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </FieldGroup>

        <div className="grid grid-cols-2 gap-3">
          <FieldGroup label="Value Type">
            <Select value={String(entryForm.ChargeType)} onValueChange={(v) => { if (v) setEntryForm((p) => ({ ...p, ChargeType: Number(v) })); }}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {Object.entries(CHARGE_TYPE_LABEL).map(([value, label]) => (
                  <SelectItem key={value} value={value}>{label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </FieldGroup>

          {entryForm.ChargeType === ChargeType.Percentage ? (
            <FieldGroup label="Percentage Value">
              <Input type="number" min="0" step="0.01" value={entryForm.ChargePercentage} onChange={(e) => setEntryForm((p) => ({ ...p, ChargePercentage: e.target.value }))} />
            </FieldGroup>
          ) : (
            <FieldGroup label="Fixed Value">
              <Input type="number" min="0" step="0.01" value={entryForm.ChargeFixedAmount} onChange={(e) => setEntryForm((p) => ({ ...p, ChargeFixedAmount: e.target.value }))} />
            </FieldGroup>
          )}
        </div>

        <div className="grid grid-cols-2 gap-3">
          <FieldGroup label="Minimum Value">
            <Input type="number" min="0" step="0.01" value={entryForm.MinimumValue} onChange={(e) => setEntryForm((p) => ({ ...p, MinimumValue: e.target.value }))} />
          </FieldGroup>
          <FieldGroup label="Rounding Type">
            <Select value={String(entryForm.RoundingType)} onValueChange={(v) => { if (v) setEntryForm((p) => ({ ...p, RoundingType: Number(v) })); }}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {Object.entries(ROUNDING_TYPE_LABEL).map(([value, label]) => (
                  <SelectItem key={value} value={value}>{label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </FieldGroup>
        </div>

        <Button type="button" onClick={handleAddEntry} disabled={saving} className="bg-indigo-600 hover:bg-indigo-700 flex items-center gap-2">
          {isEditing ? <FaEdit /> : <FaPlus />} {isEditing ? "Update Entry" : "Add Entry"}
        </Button>
        {isEditing && <Button type="button" variant="outline" onClick={handleCancelEdit} disabled={saving}>Cancel</Button>}
      </div>

      <div className="mt-6 flex justify-end">
        <Button onClick={handleSaveEntries} disabled={saving || !dirty || isEditing} className="bg-indigo-600 hover:bg-indigo-700 flex items-center gap-2">
          <FaSave /> {saving ? "Saving..." : "Save Entries"}
        </Button>
      </div>
    </div>
  );
}
