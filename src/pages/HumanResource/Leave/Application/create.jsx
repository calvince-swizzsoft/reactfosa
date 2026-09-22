import { useState, useEffect, useMemo } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { FaClipboardList } from "react-icons/fa";
import Swal from "sweetalert2";
import LeaveBalancePreview from "../lib/LeaveBalancePreview";
import { listEmployees, listLeaveTypes, createLeaveApplication } from "../lib/api";

const employeeLabel = (e) => `${e.CustomerIndividualFirstName ?? ""} ${e.CustomerIndividualLastName ?? ""}`.trim() || "—";

function FieldGroup({ label, children }) {
  return (
    <div>
      <Label className="text-sm font-semibold text-gray-700">{label}</Label>
      {children}
    </div>
  );
}

export default function CreateLeaveApplication() {
  const navigate = useNavigate();
  const [employeeId, setEmployeeId] = useState("");
  const [leaveTypeId, setLeaveTypeId] = useState("");
  const [durationStartDate, setDurationStartDate] = useState("");
  const [durationEndDate, setDurationEndDate] = useState("");
  const [reason, setReason] = useState("");
  const [loading, setLoading] = useState(false);

  const [employees, setEmployees] = useState([]);
  const [leaveTypes, setLeaveTypes] = useState([]);
  const [loadingData, setLoadingData] = useState(true);

  const [preview, setPreview] = useState(null);

  useEffect(() => {
    Promise.all([
      listEmployees(),
      listLeaveTypes({ pageSize: 200 }).then((page) => page?.PageCollection || page?.pageCollection || []),
    ])
      .then(([emps, types]) => {
        setEmployees(emps.filter((employee) => !employee.IsLocked));
        setLeaveTypes(types.filter((leaveType) => !leaveType.IsLocked));
      })
      .catch((error) => {
        setEmployees([]);
        setLeaveTypes([]);
        Swal.fire("Unable to Load Leave Options", error.message, "error");
      })
      .finally(() => setLoadingData(false));
  }, []);

  const selectedEmployee = useMemo(() => employees.find((employee) => employee.Id === employeeId), [employees, employeeId]);
  const eligibleLeaveTypes = useMemo(() => leaveTypes.filter((leaveType) =>
    !leaveType.TargetGender || Number(leaveType.TargetGender) === Number(selectedEmployee?.CustomerIndividualGender)
  ), [leaveTypes, selectedEmployee]);

  useEffect(() => {
    if (leaveTypeId && !eligibleLeaveTypes.some((leaveType) => leaveType.Id === leaveTypeId)) setLeaveTypeId("");
  }, [eligibleLeaveTypes, leaveTypeId]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (!preview?.CanSubmit) return;
      const saved = await createLeaveApplication({
        EmployeeId: employeeId,
        LeaveTypeId: leaveTypeId,
        DurationStartDate: durationStartDate,
        DurationEndDate: durationEndDate,
        Reason: reason,
      });
      Swal.fire("Success", saved.NotificationPending ? "Leave application saved. Approver notification is pending; retry it from the applications list." : "Leave application submitted successfully", "success");
      navigate("/HumanResource/Leave/Application");
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
          <FaClipboardList className="text-white text-xl" />
          <h2 className="text-xl font-bold text-white">Apply for Leave</h2>
        </div>
        <Link to="/HumanResource/Leave/Application" className="text-sm text-white/80 hover:text-white">
          &larr; Back to Leave Applications
        </Link>
      </div>

      <form onSubmit={handleSubmit} className="max-w-xl space-y-4">
        <FieldGroup label="Employee">
          <Select value={employeeId} onValueChange={setEmployeeId} disabled={loadingData}>
            <SelectTrigger><SelectValue placeholder={loadingData ? "Loading..." : "Select Employee"} /></SelectTrigger>
            <SelectContent className="max-h-60 overflow-y-auto">
              {employees.map((emp) => (
                <SelectItem key={emp.Id} value={emp.Id}>{employeeLabel(emp)}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </FieldGroup>

        <FieldGroup label="Leave Type">
          <Select value={leaveTypeId} onValueChange={setLeaveTypeId} disabled={loadingData}>
            <SelectTrigger><SelectValue placeholder={loadingData ? "Loading..." : "Select Leave Type"} /></SelectTrigger>
            <SelectContent className="max-h-60 overflow-y-auto">
              {eligibleLeaveTypes.map((lt) => (
                <SelectItem key={lt.Id} value={lt.Id}>{lt.Description} ({lt.Entitlement} days)</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </FieldGroup>

        <FieldGroup label="Start Date">
          <Input type="date" value={durationStartDate} min={new Date().toISOString().slice(0, 10)} onChange={(e) => setDurationStartDate(e.target.value)} required />
        </FieldGroup>

        <FieldGroup label="End Date">
          <Input type="date" value={durationEndDate} min={durationStartDate} onChange={(e) => setDurationEndDate(e.target.value)} required />
        </FieldGroup>

        <FieldGroup label="Reason">
          <Input value={reason} onChange={(e) => setReason(e.target.value)} required placeholder="Reason for leave" />
        </FieldGroup>

        <LeaveBalancePreview employeeId={employeeId} leaveTypeId={leaveTypeId} start={durationStartDate} end={durationEndDate} onChange={setPreview} />

        <Button type="submit" disabled={loading || loadingData || !employeeId || !leaveTypeId || !preview?.CanSubmit} className="bg-indigo-600 hover:bg-indigo-700">
          {loading ? "Submitting..." : "Submit Application"}
        </Button>
      </form>
    </div>
  );
}
