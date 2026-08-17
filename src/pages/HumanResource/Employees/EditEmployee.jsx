import { useEffect, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { FaArrowLeft, FaUserEdit } from "react-icons/fa";
import Swal from "sweetalert2";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { apiFetch, normalizeList } from "@/lib/api";

const BASE = `${import.meta.env.VITE_APP_FIN_URL}`;

const emptyForm = {
  Id: "",
  CustomerId: "",
  BranchId: "",
  DesignationId: "",
  DepartmentId: "",
  EmployeeTypeId: "",
  NationalSocialSecurityFundNumber: "",
  NationalHospitalInsuranceFundNumber: "",
  BloodGroup: "",
  Remarks: "",
  OnlineNotificationsEnabled: false,
  EnforceBiometricsForLogin: false,
  IsLocked: false,
};

const bloodGroups = [
  [1, "A+"], [2, "A-"], [3, "B+"], [4, "B-"],
  [5, "O+"], [6, "O-"], [7, "AB+"], [8, "AB-"],
];

const value = (item, pascal, camel) => item?.[pascal] ?? item?.[camel];

function toForm(employee) {
  return {
    ...emptyForm,
    Id: value(employee, "Id", "id") || "",
    CustomerId: value(employee, "CustomerId", "customerId") || "",
    BranchId: value(employee, "BranchId", "branchId") || "",
    DesignationId: value(employee, "DesignationId", "designationId") || "",
    DepartmentId: value(employee, "DepartmentId", "departmentId") || "",
    EmployeeTypeId: value(employee, "EmployeeTypeId", "employeeTypeId") || "",
    NationalSocialSecurityFundNumber: value(employee, "NationalSocialSecurityFundNumber", "nationalSocialSecurityFundNumber") || "",
    NationalHospitalInsuranceFundNumber: value(employee, "NationalHospitalInsuranceFundNumber", "nationalHospitalInsuranceFundNumber") || "",
    BloodGroup: String(value(employee, "BloodGroup", "bloodGroup") || ""),
    Remarks: value(employee, "Remarks", "remarks") || "",
    OnlineNotificationsEnabled: Boolean(value(employee, "OnlineNotificationsEnabled", "onlineNotificationsEnabled")),
    EnforceBiometricsForLogin: Boolean(value(employee, "EnforceBiometricsForLogin", "enforceBiometricsForLogin")),
    IsLocked: Boolean(value(employee, "IsLocked", "isLocked")),
  };
}

function Field({ label, children }) {
  return (
    <div className="space-y-2">
      <Label className="text-sm font-semibold text-gray-700">{label}</Label>
      {children}
    </div>
  );
}

function Lookup({ label, field, items, form, onChange, loading }) {
  return (
    <Field label={label}>
      <Select value={form[field]} onValueChange={(next) => onChange(field, next)} disabled={loading}>
        <SelectTrigger><SelectValue placeholder={loading ? "Loading..." : `Select ${label}`} /></SelectTrigger>
        <SelectContent className="max-h-60 overflow-y-auto">
          {items.map((item) => (
            <SelectItem key={item.Id ?? item.id} value={item.Id ?? item.id}>
              {item.Description ?? item.description}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </Field>
  );
}

export default function EditEmployee() {
  const { id } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const routedEmployee = location.state?.employee;

  const [employee, setEmployee] = useState(routedEmployee || null);
  const [form, setForm] = useState(() => routedEmployee ? toForm(routedEmployee) : emptyForm);
  const [loading, setLoading] = useState(!routedEmployee);
  const [saving, setSaving] = useState(false);
  const [lookupsLoading, setLookupsLoading] = useState(true);
  const [branches, setBranches] = useState([]);
  const [designations, setDesignations] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [employeeTypes, setEmployeeTypes] = useState([]);

  useEffect(() => {
    let active = true;

    const load = async () => {
      try {
        const employeePromise = routedEmployee
          ? Promise.resolve(routedEmployee)
          : apiFetch(`${BASE}/api/humanresource/employees/${id}`).then(async (response) => {
              if (!response.ok) throw new Error(response.status === 404 ? "Employee not found." : "Failed to load employee.");
              return response.json();
            });

        const [employeeData, branchResponse, designationResponse, departmentResponse, typeResponse] = await Promise.all([
          employeePromise,
          apiFetch(`${BASE}/api/administration/branches`).then((response) => response.json()),
          apiFetch(`${BASE}/api/humanresource/designations`).then((response) => response.json()),
          apiFetch(`${BASE}/api/humanresource/departments`).then((response) => response.json()),
          apiFetch(`${BASE}/api/humanresource/employeetypes`).then((response) => response.json()),
        ]);

        if (!active) return;
        const resolvedEmployee = employeeData?.data ?? employeeData;
        setEmployee(resolvedEmployee);
        setForm(toForm(resolvedEmployee));
        setBranches(normalizeList(branchResponse));
        setDesignations(normalizeList(designationResponse));
        setDepartments(normalizeList(departmentResponse));
        setEmployeeTypes(normalizeList(typeResponse));
      } catch (error) {
        if (active) Swal.fire("Unable to Load Employee", error.message, "error");
      } finally {
        if (active) {
          setLoading(false);
          setLookupsLoading(false);
        }
      }
    };

    load();
    return () => { active = false; };
  }, [id, routedEmployee]);

  const change = (field, next) => setForm((current) => ({ ...current, [field]: next }));

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSaving(true);
    try {
      const response = await apiFetch(`${BASE}/api/humanresource/employees/${id}`, {
        method: "PUT",
        body: JSON.stringify({ ...form, Id: id, BloodGroup: Number(form.BloodGroup) || 0 }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok || data === false) {
        throw new Error(data?.message || data?.Message || "Failed to update employee.");
      }

      await Swal.fire("Employee Updated", "The employee details were updated successfully.", "success");
      navigate("/HumanResource/Employees");
    } catch (error) {
      Swal.fire("Unable to Update Employee", error.message, "error");
    } finally {
      setSaving(false);
    }
  };

  const fullName = [
    value(employee, "CustomerIndividualFirstName", "customerIndividualFirstName"),
    value(employee, "CustomerIndividualLastName", "customerIndividualLastName"),
  ].filter(Boolean).join(" ") || "Employee";

  return (
    <div className="bg-white m-8 px-8 py-8 shadow-2xl rounded-lg relative">
      <div className="bg-indigo-800 px-6 py-3 rounded-2xl flex justify-between items-center">
        <h2 className="text-xl font-bold text-white flex items-center gap-2"><FaUserEdit /> Edit Employee</h2>
        <Button variant="outline" onClick={() => navigate("/HumanResource/Employees")} className="flex items-center gap-2">
          <FaArrowLeft /> Back to Employees
        </Button>
      </div>

      {loading ? (
        <div className="mt-6 space-y-4 animate-pulse">
          {[1, 2, 3, 4].map((item) => <div key={item} className="h-12 rounded bg-gray-200" />)}
        </div>
      ) : !employee ? (
        <p className="py-12 text-center text-gray-500">Employee details could not be loaded.</p>
      ) : (
        <form onSubmit={handleSubmit} className="mt-6 grid grid-cols-1 gap-5 md:grid-cols-2">
          <Field label="Employee">
            <Input value={fullName} readOnly className="bg-gray-100" />
          </Field>
          <Field label="Payroll Number">
            <Input value={value(employee, "CustomerIndividualPayrollNumbers", "customerIndividualPayrollNumbers") || "—"} readOnly className="bg-gray-100" />
          </Field>

          <Lookup label="Branch" field="BranchId" items={branches} form={form} onChange={change} loading={lookupsLoading} />
          <Lookup label="Designation" field="DesignationId" items={designations} form={form} onChange={change} loading={lookupsLoading} />
          <Lookup label="Department" field="DepartmentId" items={departments} form={form} onChange={change} loading={lookupsLoading} />
          <Lookup label="Employee Type" field="EmployeeTypeId" items={employeeTypes} form={form} onChange={change} loading={lookupsLoading} />

          <Field label="N.S.S.F Number">
            <Input value={form.NationalSocialSecurityFundNumber} onChange={(event) => change("NationalSocialSecurityFundNumber", event.target.value)} required />
          </Field>
          <Field label="N.H.I.F Number">
            <Input value={form.NationalHospitalInsuranceFundNumber} onChange={(event) => change("NationalHospitalInsuranceFundNumber", event.target.value)} required />
          </Field>
          <Field label="Blood Group">
            <Select value={form.BloodGroup} onValueChange={(next) => change("BloodGroup", next)}>
              <SelectTrigger><SelectValue placeholder="Select Blood Group" /></SelectTrigger>
              <SelectContent>{bloodGroups.map(([idValue, label]) => <SelectItem key={idValue} value={String(idValue)}>{label}</SelectItem>)}</SelectContent>
            </Select>
          </Field>
          <Field label="Remarks">
            <Input value={form.Remarks} onChange={(event) => change("Remarks", event.target.value)} />
          </Field>

          <div className="md:col-span-2 grid grid-cols-1 gap-3 md:grid-cols-3">
            {[
              ["OnlineNotificationsEnabled", "Online Notifications"],
              ["EnforceBiometricsForLogin", "Enforce Biometrics for Login"],
              ["IsLocked", "Lock Employee"],
            ].map(([field, label]) => (
              <label key={field} className="flex items-center gap-2 rounded-lg border border-gray-300 p-3 text-sm font-semibold text-gray-700">
                <input type="checkbox" checked={form[field]} onChange={(event) => change(field, event.target.checked)} className="w-4 h-4 accent-indigo-600" />
                {label}
              </label>
            ))}
          </div>

          <div className="md:col-span-2 flex justify-end gap-3 border-t pt-5">
            <Button type="button" variant="outline" onClick={() => navigate("/HumanResource/Employees")}>Cancel</Button>
            <Button type="submit" disabled={saving || lookupsLoading} className="bg-indigo-600 hover:bg-indigo-700">
              {saving ? "Saving..." : "Update Employee"}
            </Button>
          </div>
        </form>
      )}
    </div>
  );
}
