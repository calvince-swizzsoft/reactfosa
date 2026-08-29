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
import { apiErrorMessage, apiJson, normalizeList } from "@/lib/api";
import { FaSearch } from "react-icons/fa";
import CustomerLookupModal from "@/pages/Registry/Customers/Documents/CustomerLookupModal";

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
          {items.length === 0 ? (
            <SelectItem value={`__none-${field}`} disabled>No options available</SelectItem>
          ) : items.map((i) => (
            <SelectItem key={i.Id} value={String(i.Id)}>{i.Description}</SelectItem>
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

  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [customerPickerOpen, setCustomerPickerOpen] = useState(false);
  const [branches, setBranches] = useState([]);
  const [designations, setDesignations] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [employeeTypes, setEmployeeTypes] = useState([]);

  const handleChange = (field, value) =>
    setFormData((prev) => ({ ...prev, [field]: value }));

  useEffect(() => {
    if (!open) {
      setCustomerPickerOpen(false);
      return;
    }
    setLoadingData(true);
    const lookupRequests = [
      apiJson(`${import.meta.env.VITE_APP_FIN_URL}/api/administration/branches?pageSize=1000`),
      apiJson(`${import.meta.env.VITE_APP_FIN_URL}/api/humanresource/designations`),
      apiJson(`${import.meta.env.VITE_APP_FIN_URL}/api/humanresource/departments`),
      apiJson(`${import.meta.env.VITE_APP_FIN_URL}/api/humanresource/employeetypes`),
    ];
    const lookupLabels = ["branches", "designations", "departments", "employee types"];

    Promise.allSettled(lookupRequests).then((results) => {
      const setters = [setBranches, setDesignations, setDepartments, setEmployeeTypes];
      const failures = [];

      results.forEach((result, index) => {
        if (result.status === "fulfilled") {
          setters[index](normalizeList(result.value));
        } else {
          setters[index]([]);
          failures.push(`${lookupLabels[index]}: ${apiErrorMessage(result.reason, "request failed")}`);
        }
      });

      if (failures.length > 0) {
        Swal.fire("Some employee options could not be loaded", failures.join("\n"), "error");
      }
    }).finally(() => setLoadingData(false));
  }, [open]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.CustomerId) {
      Swal.fire("Missing Field", "Search for and select a customer.", "warning");
      return;
    }
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

      const created = await apiJson(`${import.meta.env.VITE_APP_FIN_URL}/api/humanresource/employees`, {
        method: "POST",
        body: JSON.stringify(payload),
      });

      const employee = created?.data ?? created;
      const businessError = employee?.errormassage ?? employee?.ErrorMessageResult;
      if (businessError) throw new Error(businessError);
      if (!employee?.Id && !employee?.id) throw new Error("The API did not return the created employee.");

      await Swal.fire("Success", "Employee created successfully", "success");
      setFormData(defaultFormData);
      setSelectedCustomer(null);
      if (onSuccess) await onSuccess();
      onClose();
    } catch (err) {
      Swal.fire("Error", apiErrorMessage(err, "Failed to create employee."), "error");
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
                <Field label="Customer">
                  <Button type="button" variant="outline" onClick={() => setCustomerPickerOpen(true)} className="w-full justify-between font-normal" disabled={loadingData}>
                    <span className={selectedCustomer ? "text-gray-900" : "text-gray-500"}>
                      {selectedCustomer
                        ? ([selectedCustomer.IndividualFirstName, selectedCustomer.IndividualLastName].filter(Boolean).join(" ") || selectedCustomer.NonIndividualDescription || selectedCustomer.Description || selectedCustomer.Id)
                        : "Search and select customer"}
                    </span>
                    <FaSearch className="text-gray-400" />
                  </Button>
                </Field>
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
      {customerPickerOpen && (
        <CustomerLookupModal
          onSelect={(customer) => {
            setSelectedCustomer(customer);
            handleChange("CustomerId", customer.Id ?? customer.id);
          }}
          onClose={() => setCustomerPickerOpen(false)}
        />
      )}
    </AnimatePresence>
  );
}
