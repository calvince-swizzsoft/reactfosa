import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { FaUmbrellaBeach } from "react-icons/fa";
import Swal from "sweetalert2";
import { createLeaveType } from "../Leave/lib/api";
import { LEAVE_UNIT_TYPE_LABEL, LEAVE_TARGET_GENDER_LABEL } from "../Leave/lib/enums";
import FieldHelp from "@/pages/Accounts/SavingsProducts/FieldHelp";

const emptyForm = { Description: "", Entitlement: 1, TargetGender: 0, UnitType: 3, IsAccrued: false, ExcludeHolidays: false, ExcludeWeekends: false, IsLocked: false };

function FieldGroup({ label, help, children }) {
  return (
    <div>
      <div className="flex items-center gap-1"><Label className="text-sm font-semibold text-gray-700">{label}</Label>{help && <FieldHelp label={label}>{help}</FieldHelp>}</div>
      {children}
    </div>
  );
}

export default function CreateLeaveType() {
  const navigate = useNavigate();
  const [form, setForm] = useState(emptyForm);
  const [loading, setLoading] = useState(false);
  const set = (field, value) => setForm((p) => ({ ...p, [field]: value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await createLeaveType(form);
      Swal.fire("Success", "Leave type created successfully", "success");
      navigate("/HumanResource/LeaveTypes");
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
          <FaUmbrellaBeach className="text-white text-xl" />
          <h2 className="text-xl font-bold text-white">Create Leave Type</h2>
        </div>
        <Link to="/HumanResource/LeaveTypes" className="text-sm text-white/80 hover:text-white">
          &larr; Back to Leave Types
        </Link>
      </div>

      <form onSubmit={handleSubmit} className="max-w-xl space-y-4">
        <FieldGroup label="Description">
          <Input value={form.Description} onChange={(e) => set("Description", e.target.value)} required placeholder="e.g. Annual Leave" />
        </FieldGroup>

        <FieldGroup label="Entitlement (Days)" help="The number of leave days granted in each selected entitlement cycle.">
          <Input type="number" min="1" value={form.Entitlement} onChange={(e) => set("Entitlement", Number(e.target.value))} required />
        </FieldGroup>

        <FieldGroup label="Unit Type" help="Determines whether entitlement is granted weekly, monthly, or yearly.">
          <Select value={String(form.UnitType)} onValueChange={(v) => set("UnitType", Number(v))}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {Object.entries(LEAVE_UNIT_TYPE_LABEL).map(([value, label]) => (
                <SelectItem key={value} value={value}>{label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </FieldGroup>

        <FieldGroup label="Target Gender" help="Restricts this leave type to eligible employees. Choose All genders for a general policy.">
          <Select value={String(form.TargetGender)} onValueChange={(v) => set("TargetGender", Number(v))}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {Object.entries(LEAVE_TARGET_GENDER_LABEL).map(([value, label]) => (
                <SelectItem key={value} value={value}>{label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </FieldGroup>

        <div className="flex items-center gap-2">
          <input type="checkbox" id="leavetype-accrued" checked={form.IsAccrued} onChange={(e) => set("IsAccrued", e.target.checked)} className="w-4 h-4 accent-indigo-600" />
          <Label htmlFor="leavetype-accrued">Is Accrued?</Label>
        </div>
        <div className="flex items-center gap-2">
          <input type="checkbox" id="leavetype-excludeholidays" checked={form.ExcludeHolidays} onChange={(e) => set("ExcludeHolidays", e.target.checked)} className="w-4 h-4 accent-indigo-600" />
          <Label htmlFor="leavetype-excludeholidays">Exclude Holidays?</Label>
        </div>
        <div className="flex items-center gap-2">
          <input type="checkbox" id="leavetype-excludeweekends" checked={form.ExcludeWeekends} onChange={(e) => set("ExcludeWeekends", e.target.checked)} className="w-4 h-4 accent-indigo-600" />
          <Label htmlFor="leavetype-excludeweekends">Exclude Weekends?</Label>
        </div>
        <div className="flex items-center gap-2">
          <input type="checkbox" id="leavetype-locked" checked={form.IsLocked} onChange={(e) => set("IsLocked", e.target.checked)} className="w-4 h-4 accent-indigo-600" />
          <Label htmlFor="leavetype-locked">Create as locked</Label>
          <FieldHelp label="Locked leave type">Locked leave types remain available for configuration but cannot be used in leave applications.</FieldHelp>
        </div>

        <Button type="submit" disabled={loading} className="bg-indigo-600 hover:bg-indigo-700">
          {loading ? "Saving..." : "Create Leave Type"}
        </Button>
      </form>
    </div>
  );
}
