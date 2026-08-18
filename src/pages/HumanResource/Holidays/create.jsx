import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { FaTree } from "react-icons/fa";
import Swal from "sweetalert2";
import { listPostingPeriods, createHoliday } from "./api";

const emptyForm = { PostingPeriodId: "", Description: "", DurationStartDate: "", DurationEndDate: "", IsLocked: false };
const toDateInput = (iso) => (iso ? iso.slice(0, 10) : "");
const formatDate = (iso) => {
  if (!iso) return "—";
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? "—" : d.toLocaleDateString();
};

function FieldGroup({ label, children }) {
  return (
    <div>
      <Label className="text-sm font-semibold text-gray-700">{label}</Label>
      {children}
    </div>
  );
}

export default function CreateHoliday() {
  const [form, setForm] = useState(emptyForm);
  const [loading, setLoading] = useState(false);
  const [postingPeriods, setPostingPeriods] = useState([]);
  const [loadingData, setLoadingData] = useState(true);

  useEffect(() => {
    listPostingPeriods().then(setPostingPeriods).catch(() => setPostingPeriods([])).finally(() => setLoadingData(false));
  }, []);

  const selectedPeriod = postingPeriods.find((p) => p.Id === form.PostingPeriodId);
  const bounds = selectedPeriod
    ? { min: toDateInput(selectedPeriod.DurationStartDate), max: toDateInput(selectedPeriod.DurationEndDate) }
    : {};

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await createHoliday(form);
      Swal.fire("Success", "Holiday created successfully", "success");
      setForm(emptyForm);
    } catch (err) {
      Swal.fire("Error", err.message, "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white m-8 px-8 py-8 shadow-2xl rounded-lg relative">
      <div className="flex items-center justify-between gap-3 mb-6 bg-indigo-800 px-6 py-3 rounded-2xl">
        <div className="flex items-center gap-3">
          <FaTree className="text-white text-xl" />
          <h2 className="text-xl font-bold text-white">Create Holiday</h2>
        </div>
        <Link to="/HumanResource/Holidays" className="text-sm text-white/80 hover:text-white">
          &larr; Back to Holidays
        </Link>
      </div>

      <form onSubmit={handleSubmit} className="max-w-xl space-y-4">
        <FieldGroup label="Posting Period">
          <Select
            value={form.PostingPeriodId}
            onValueChange={(v) => setForm((p) => ({ ...p, PostingPeriodId: v, DurationStartDate: "", DurationEndDate: "" }))}
            disabled={loadingData}
          >
            <SelectTrigger><SelectValue placeholder={loadingData ? "Loading..." : "Select Posting Period"} /></SelectTrigger>
            <SelectContent>
              {postingPeriods.map((p) => (
                <SelectItem key={p.Id} value={p.Id}>{p.Description}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </FieldGroup>

        <FieldGroup label="Description">
          <Input
            value={form.Description}
            onChange={(e) => setForm((p) => ({ ...p, Description: e.target.value }))}
            required
            placeholder="e.g. Independence Day"
          />
        </FieldGroup>

        <FieldGroup label="Start Date">
          <Input
            type="date"
            value={form.DurationStartDate}
            onChange={(e) => setForm((p) => ({ ...p, DurationStartDate: e.target.value }))}
            min={bounds.min}
            max={bounds.max}
            disabled={!form.PostingPeriodId}
            required
          />
        </FieldGroup>

        <FieldGroup label="End Date">
          <Input
            type="date"
            value={form.DurationEndDate}
            onChange={(e) => setForm((p) => ({ ...p, DurationEndDate: e.target.value }))}
            min={form.DurationStartDate || bounds.min}
            max={bounds.max}
            disabled={!form.PostingPeriodId}
            required
          />
        </FieldGroup>

        {selectedPeriod && (
          <p className="text-xs text-gray-400">
            Must fall within {formatDate(selectedPeriod.DurationStartDate)} – {formatDate(selectedPeriod.DurationEndDate)}.
          </p>
        )}

        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            id="holiday-locked"
            checked={form.IsLocked}
            onChange={(e) => setForm((p) => ({ ...p, IsLocked: e.target.checked }))}
            className="w-4 h-4 accent-indigo-600"
          />
          <Label htmlFor="holiday-locked">Is Locked?</Label>
        </div>

        <Button type="submit" disabled={loading || loadingData || !form.PostingPeriodId} className="bg-indigo-600 hover:bg-indigo-700">
          {loading ? "Saving..." : "Create Holiday"}
        </Button>
      </form>
    </div>
  );
}
