import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { FaIdCard } from "react-icons/fa";
import Swal from "sweetalert2";
import { listEmployees, getSalaryCardByEmployee, createSalaryCard } from "./lib/api";
import { listSalaryGroups } from "../SalaryGroups/lib/api";

const employeeLabel = (e) => `${e.CustomerIndividualFirstName ?? ""} ${e.CustomerIndividualLastName ?? ""}`.trim() || "—";

function FieldGroup({ label, children }) {
  return (
    <div>
      <Label className="text-sm font-semibold text-gray-700">{label}</Label>
      {children}
    </div>
  );
}

export default function CreateSalaryCard() {
  const navigate = useNavigate();
  const [employeeId, setEmployeeId] = useState("");
  const [salaryGroupId, setSalaryGroupId] = useState("");
  const [taxExemption, setTaxExemption] = useState(0);
  const [insuranceReliefAmount, setInsuranceReliefAmount] = useState(0);
  const [remarks, setRemarks] = useState("");
  const [isTaxExempt, setIsTaxExempt] = useState(false);
  const [isLocked, setIsLocked] = useState(false);
  const [loading, setLoading] = useState(false);

  const [employees, setEmployees] = useState([]);
  const [salaryGroups, setSalaryGroups] = useState([]);
  const [loadingData, setLoadingData] = useState(true);
  const [existingCardWarning, setExistingCardWarning] = useState(false);
  const [checkingExisting, setCheckingExisting] = useState(false);

  useEffect(() => {
    Promise.all([
      listEmployees(),
      listSalaryGroups({ pageSize: 200 }).then((page) => page?.PageCollection || page?.pageCollection || []),
    ])
      .then(([emps, groups]) => { setEmployees(emps); setSalaryGroups(groups); })
      .catch(() => { setEmployees([]); setSalaryGroups([]); })
      .finally(() => setLoadingData(false));
  }, []);

  const handleEmployeeChange = async (value) => {
    setEmployeeId(value);
    setExistingCardWarning(false);
    setCheckingExisting(true);
    try {
      const existing = await getSalaryCardByEmployee(value);
      setExistingCardWarning(!!existing);
    } finally {
      setCheckingExisting(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (existingCardWarning) {
      Swal.fire("Already Linked", "This employee already has a salary card.", "warning");
      return;
    }
    setLoading(true);
    try {
      await createSalaryCard({
        EmployeeId: employeeId,
        SalaryGroupId: salaryGroupId,
        TaxExemption: Number(taxExemption),
        InsuranceReliefAmount: Number(insuranceReliefAmount),
        Remarks: remarks,
        IsTaxExempt: isTaxExempt,
        IsLocked: isLocked,
      });
      Swal.fire("Success", "Salary card created successfully", "success");
      navigate("/HumanResource/SalaryCards");
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
          <FaIdCard className="text-white text-xl" />
          <h2 className="text-xl font-bold text-white">Create Salary Card</h2>
        </div>
        <Link to="/HumanResource/SalaryCards" className="text-sm text-white/80 hover:text-white">
          &larr; Back to Salary Cards
        </Link>
      </div>

      <form onSubmit={handleSubmit} className="max-w-xl space-y-4">
        <FieldGroup label="Employee">
          <Select value={employeeId} onValueChange={handleEmployeeChange} disabled={loadingData}>
            <SelectTrigger><SelectValue placeholder={loadingData ? "Loading..." : "Select Employee"} /></SelectTrigger>
            <SelectContent className="max-h-60 overflow-y-auto">
              {employees.map((emp) => (
                <SelectItem key={emp.Id} value={emp.Id}>{employeeLabel(emp)}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </FieldGroup>

        {checkingExisting && <p className="text-xs text-gray-400">Checking for an existing card...</p>}
        {existingCardWarning && <p className="text-xs text-red-600">This employee already has a salary card — only one is allowed.</p>}

        <FieldGroup label="Salary Group">
          <Select value={salaryGroupId} onValueChange={setSalaryGroupId} disabled={loadingData}>
            <SelectTrigger><SelectValue placeholder={loadingData ? "Loading..." : "Select Salary Group"} /></SelectTrigger>
            <SelectContent className="max-h-60 overflow-y-auto">
              {salaryGroups.map((g) => (
                <SelectItem key={g.Id} value={g.Id}>{g.Description}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </FieldGroup>

        <FieldGroup label="Tax Exemption Amount">
          <Input type="number" min="0" step="0.01" value={taxExemption} onChange={(e) => setTaxExemption(e.target.value)} />
        </FieldGroup>

        <FieldGroup label="Insurance Relief Amount">
          <Input type="number" min="0" step="0.01" value={insuranceReliefAmount} onChange={(e) => setInsuranceReliefAmount(e.target.value)} />
        </FieldGroup>

        <FieldGroup label="Remarks">
          <Input value={remarks} onChange={(e) => setRemarks(e.target.value)} placeholder="Optional remarks" />
        </FieldGroup>

        <div className="flex items-center gap-2">
          <input type="checkbox" id="card-taxexempt" checked={isTaxExempt} onChange={(e) => setIsTaxExempt(e.target.checked)} className="w-4 h-4 accent-indigo-600" />
          <Label htmlFor="card-taxexempt">Is Tax Exempt?</Label>
        </div>
        <div className="flex items-center gap-2">
          <input type="checkbox" id="card-locked" checked={isLocked} onChange={(e) => setIsLocked(e.target.checked)} className="w-4 h-4 accent-indigo-600" />
          <Label htmlFor="card-locked">Is Locked?</Label>
        </div>

        <Button type="submit" disabled={loading || loadingData || !employeeId || !salaryGroupId || existingCardWarning} className="bg-indigo-600 hover:bg-indigo-700">
          {loading ? "Saving..." : "Create Salary Card"}
        </Button>
      </form>
    </div>
  );
}
