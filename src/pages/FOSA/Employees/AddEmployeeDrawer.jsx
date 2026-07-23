import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
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
import Swal from "sweetalert2";

const defaultFormData = {
  CustomerId: "",
  BranchId: "",
  DesignationId: "",
  DepartmentId: "",
  EmployeeTypeId: "",
  NationalSocialSecurityFundNumber: "",
  NationalHospitalInsuranceFundNumber: "",
  BloodGroup: "",
};

const bloodGroupOptions = [
  { value: 1, label: "A+" },
  { value: 2, label: "A-" },
  { value: 3, label: "B+" },
  { value: 4, label: "B-" },
  { value: 5, label: "O+" },
  { value: 6, label: "O-" },
  { value: 7, label: "AB+" },
  { value: 8, label: "AB-" },
];

function Field({ label, children }) {
  return (
    <div>
      <Label>{label}</Label>
      {children}
    </div>
  );
}

function TextInput({ field, label, placeholder = "", required = false, formData, onChange }) {
  return (
    <Field label={label}>
      <Input
        value={formData[field]}
        onChange={(e) => onChange(field, e.target.value)}
        placeholder={placeholder}
        required={required}
      />
    </Field>
  );
}

function LookupSelect({ field, label, items, placeholder, formData, onChange, disabled }) {
  return (
    <Field label={label}>
      <Select value={formData[field]} onValueChange={(v) => onChange(field, v)} disabled={disabled}>
        <SelectTrigger><SelectValue placeholder={disabled ? "Loading..." : placeholder} /></SelectTrigger>
        <SelectContent className="max-h-60 overflow-y-auto">
          {items.map((i) => (
            <SelectItem key={i.Id} value={i.Id}>{i.Description}</SelectItem>
          ))}
        </SelectContent>
      </Select>
    </Field>
  );
}

export default function AddEmployeeDrawer({ open, onClose, onSuccess }) {
  const [formData, setFormData] = useState(defaultFormData);
  const [loading, setLoading] = useState(false);
  const [loadingData, setLoadingData] = useState(false);

  const [customers, setCustomers] = useState([]);
  const [branches, setBranches] = useState([]);
  const [designations, setDesignations] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [employeeTypes, setEmployeeTypes] = useState([]);

  const handleChange = (field, value) =>
    setFormData((prev) => ({ ...prev, [field]: value }));

  useEffect(() => {
    if (!open) return;
    setLoadingData(true);
    Promise.all([
      fetch(`${import.meta.env.VITE_APP_FIN_URL}/api/customers`).then((r) => r.json()),
      fetch(`${import.meta.env.VITE_APP_FIN_URL}/api/branches`).then((r) => r.json()),
      fetch(`${import.meta.env.VITE_APP_FIN_URL}/api/designations`).then((r) => r.json()),
      fetch(`${import.meta.env.VITE_APP_FIN_URL}/api/departments`).then((r) => r.json()),
      fetch(`${import.meta.env.VITE_APP_FIN_URL}/api/employeetypes`).then((r) => r.json()),
    ]).then(([custData, branchData, desigData, deptData, empTypeData]) => {
      const list = custData.success ? custData.data : [];
      setCustomers(list.map((c) => ({
        Id: c.Id,
        Description: `${c.IndividualFirstName ?? ""} ${c.IndividualLastName ?? ""}`.trim() || c.Id,
      })));
      setBranches(Array.isArray(branchData.data) ? branchData.data : []);
      setDesignations(Array.isArray(desigData) ? desigData : []);
      setDepartments(Array.isArray(deptData) ? deptData : []);
      setEmployeeTypes(Array.isArray(empTypeData) ? empTypeData : []);
    }).catch(() => { }).finally(() => setLoadingData(false));
  }, [open]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const payload = {
        CustomerId: formData.CustomerId,
        BranchId: formData.BranchId,
        DesignationId: formData.DesignationId,
        DepartmentId: formData.DepartmentId,
        EmployeeTypeId: formData.EmployeeTypeId,
        NationalSocialSecurityFundNumber: formData.NationalSocialSecurityFundNumber,
        NationalHospitalInsuranceFundNumber: formData.NationalHospitalInsuranceFundNumber,
        BloodGroup: parseInt(formData.BloodGroup) || 0,
      };

      const res = await fetch(`${import.meta.env.VITE_APP_FIN_URL}/api/employees`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.message || "Failed to create employee");

      Swal.fire("Success", "Employee created successfully", "success");
      setFormData(defaultFormData);
      if (onSuccess) onSuccess();
      onClose();
    } catch (err) {
      Swal.fire("Error", err.message, "error");
    } finally {
      setLoading(false);
    }
  };

  const fp = { formData, onChange: handleChange };

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
            className="fixed top-5 right-3 bottom-5 w-[500px] h-4.8/5 bg-white shadow-xl z-50 flex flex-col rounded-2xl p-3"
            initial={{ x: "100%" }} animate={{ x: 0 }} exit={{ x: "100%" }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
          >
            <div className="p-4 flex justify-between items-center bg-indigo-600 rounded-2xl m-2">
              <h2 className="font-bold text-lg text-white">Register Employee</h2>
              <Button variant="outline" size="sm" onClick={onClose}>Close</Button>
            </div>

            <div className="p-3 overflow-y-auto">
              <form onSubmit={handleSubmit} className="space-y-4">
                <LookupSelect field="CustomerId" label="Customer" items={customers} placeholder="Select Customer" {...fp} disabled={loadingData} />
                <LookupSelect field="BranchId" label="Branch" items={branches} placeholder="Select Branch" {...fp} disabled={loadingData} />
                <LookupSelect field="DesignationId" label="Designation" items={designations} placeholder="Select Designation" {...fp} disabled={loadingData} />
                <LookupSelect field="DepartmentId" label="Department" items={departments} placeholder="Select Department" {...fp} disabled={loadingData} />
                <LookupSelect field="EmployeeTypeId" label="Employee Type" items={employeeTypes} placeholder="Select Employee Type" {...fp} disabled={loadingData} />

                <TextInput field="NationalSocialSecurityFundNumber" label="N.S.S.F Number" required {...fp} />
                <TextInput field="NationalHospitalInsuranceFundNumber" label="N.H.I.F Number" required {...fp} />

                <Field label="Blood Group">
                  <Select value={String(formData.BloodGroup)} onValueChange={(v) => handleChange("BloodGroup", v)}>
                    <SelectTrigger><SelectValue placeholder="Select Blood Group" /></SelectTrigger>
                    <SelectContent>
                      {bloodGroupOptions.map((o) => (
                        <SelectItem key={o.value} value={String(o.value)}>{o.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </Field>

                <Button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-indigo-600 hover:bg-indigo-700"
                >
                  {loading ? "Saving..." : "Create Employee"}
                </Button>
              </form>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
