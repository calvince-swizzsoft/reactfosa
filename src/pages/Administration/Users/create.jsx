import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Swal from "sweetalert2";

export default function CreateUser() {
  const [loading, setLoading] = useState(false);
  const [employees, setEmployees] = useState([]);
  const [employeeLoading, setEmployeeLoading] = useState(false);
  const [form, setForm] = useState({
    firstName: "",
    otherNames: "",
    email: "",
    userName: "",
    phoneNumber: "",
    branchDescription: "",
    BranchId: "",
    EmployeeId: "",
    CustomerId: "",
    password: "",
    confirmPassword: "",
    twoFactorEnabled: false,
    lockoutEnabled: false,
  });

  useEffect(() => {
    const fetchEmployees = async () => {
      setEmployeeLoading(true);
      try {
        const response = await fetch(`${import.meta.env.VITE_APP_ADMIN_URL}/api/humanresource/employees`);
        const data = await response.json().catch(() => ({}));

        if (!response.ok) {
          throw new Error(data?.message || "Failed to load employees");
        }

        const employeeList = Array.isArray(data?.data) ? data.data : Array.isArray(data) ? data : [];
        setEmployees(employeeList);
      } catch (error) {
        Swal.fire("Error", error.message || "Unable to load employees.", "error");
      } finally {
        setEmployeeLoading(false);
      }
    };

    fetchEmployees();
  }, []);

  const handleChange = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const trimmedUsername = form.userName.trim();
    if (!trimmedUsername) {
      Swal.fire("Missing field", "Username is required.", "warning");
      return;
    }

    const lowerUsername = trimmedUsername.toLowerCase();
    if (lowerUsername !== trimmedUsername) {
      Swal.fire("Invalid username", "Username must be lowercase.", "warning");
      return;
    }

    if (!form.password) {
      Swal.fire("Missing field", "Password is required.", "warning");
      return;
    }

    if (form.password !== form.confirmPassword) {
      Swal.fire("Password mismatch", "Passwords do not match.", "warning");
      return;
    }

    setLoading(true);
    try {
      const payload = {
        ...form,
        userName: lowerUsername,
        password: form.password,
      };

      delete payload.confirmPassword;

      const response = await fetch(`${import.meta.env.VITE_APP_ADMIN_URL}/api/administration/users`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(data?.message || "Failed to create user");
      }

      Swal.fire("Success", data?.message || "User created successfully.", "success");
      setForm({
        firstName: "",
        otherNames: "",
        email: "",
        userName: "",
        phoneNumber: "",
        branchDescription: "",
        BranchId: "",
        EmployeeId: "",
        CustomerId: "",
        password: "",
        confirmPassword: "",
        twoFactorEnabled: false,
        lockoutEnabled: false,
      });
    } catch (error) {
      Swal.fire("Error", error.message || "Unable to create user.", "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 p-6 md:p-10">
      <div className="mx-auto max-w-4xl rounded-2xl bg-white p-8 shadow-xl">
        <div className="mb-6">
          <h2 className="text-2xl font-semibold text-slate-800">Create User</h2>
          <p className="mt-2 text-sm text-slate-500">Create a new user by filling in the details below.</p>
        </div>

        <form onSubmit={handleSubmit} className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2 md:col-span-2">
            <Label>Select Employee</Label>
            <select
              value={form.EmployeeId || ""}
              onChange={(e) => {
                const selectedEmployee = employees.find((employee) => employee.Id === e.target.value);
                if (!selectedEmployee) return;

                handleChange("EmployeeId", selectedEmployee.Id || "");
                handleChange("CustomerId", selectedEmployee.CustomerId || selectedEmployee.CustomerDTO?.Id || "");
                handleChange("firstName", selectedEmployee.CustomerIndividualFirstName || selectedEmployee.FirstName || "");
                handleChange("otherNames", selectedEmployee.CustomerIndividualLastName || selectedEmployee.OtherNames || "");
                handleChange(
                  "email",
                  selectedEmployee.CustomerAddressEmail ||
                    selectedEmployee.customerAddressEmail ||
                    selectedEmployee.CustomerIndividualEmail ||
                    selectedEmployee.Email ||
                    "",
                );
                handleChange(
                  "phoneNumber",
                  selectedEmployee.CustomerAddressMobileLine ||
                    selectedEmployee.customerAddressMobileLine ||
                    selectedEmployee.CustomerIndividualMobile ||
                    selectedEmployee.PhoneNumber ||
                    "",
                );
                handleChange("branchDescription", selectedEmployee.BranchDescription || "");
                handleChange("BranchId", selectedEmployee.BranchId || "");
              }}
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-indigo-500"
              disabled={employeeLoading}
            >
              <option value="">{employeeLoading ? "Loading employees..." : "Select an employee"}</option>
              {employees.map((employee) => (
                <option key={employee.Id} value={employee.Id}>
                  {employee.CustomerIndividualFirstName && employee.CustomerIndividualLastName
                    ? `${employee.CustomerIndividualFirstName} ${employee.CustomerIndividualLastName}`
                    : employee.DisplayName || employee.FirstName || employee.Id}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-2 md:col-span-2">
            <Label>User Name</Label>
            <Input value={form.userName} onChange={(e) => handleChange("userName", e.target.value)} placeholder="Enter lowercase username" />
          </div>

          <div className="space-y-2">
            <Label>First Name</Label>
            <Input value={form.firstName} readOnly className="bg-slate-100" />
          </div>

          <div className="space-y-2">
            <Label>Other Names</Label>
            <Input value={form.otherNames} readOnly className="bg-slate-100" />
          </div>

          <div className="space-y-2">
            <Label>Email Address</Label>
            <Input type="email" value={form.email} readOnly className="bg-slate-100" />
          </div>

          <div className="space-y-2">
            <Label>Phone Number</Label>
            <Input value={form.phoneNumber} readOnly className="bg-slate-100" />
          </div>

          <div className="space-y-2">
            <Label>Branch Name</Label>
            <Input value={form.branchDescription} readOnly className="bg-slate-100" />
          </div>

          <div className="space-y-2">
            <Label>Password</Label>
            <Input type="password" value={form.password || ""} onChange={(e) => handleChange("password", e.target.value)} placeholder="Enter password" />
          </div>

          <div className="space-y-2">
            <Label>Confirm Password</Label>
            <Input type="password" value={form.confirmPassword || ""} onChange={(e) => handleChange("confirmPassword", e.target.value)} placeholder="Confirm password" />
          </div>

          <div className="flex items-center gap-2 rounded-lg border border-slate-200 p-3">
            <input id="twoFactor" type="checkbox" checked={form.twoFactorEnabled} onChange={(e) => handleChange("twoFactorEnabled", e.target.checked)} />
            <Label htmlFor="twoFactor">2FA Enabled</Label>
          </div>

          <div className="flex items-center gap-2 rounded-lg border border-slate-200 p-3">
            <input id="lockout" type="checkbox" checked={form.lockoutEnabled} onChange={(e) => handleChange("lockoutEnabled", e.target.checked)} />
            <Label htmlFor="lockout">Lock User?</Label>
          </div>

          <div className="md:col-span-2 flex justify-end">
            <Button type="submit" disabled={loading} className="bg-indigo-600 hover:bg-indigo-700">
              {loading ? "Creating..." : "Create User"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
