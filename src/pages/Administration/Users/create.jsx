import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Swal from "sweetalert2";
import { apiErrorMessage, apiJson } from "@/lib/api";
import { Link } from "react-router-dom";
import { FaArrowLeft } from "react-icons/fa";
import FieldHelp from "@/pages/Accounts/SavingsProducts/FieldHelp";

function FieldLabel({ label, help, htmlFor }) {
  return <div className="flex items-center gap-1"><Label htmlFor={htmlFor}>{label}</Label><FieldHelp label={label}>{help}</FieldHelp></div>;
}

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
        const [data, usersData] = await Promise.all([
          apiJson(`${import.meta.env.VITE_APP_ADMIN_URL}/api/humanresource/employees`, {}, { fallbackMessage: "Failed to load employees." }),
          apiJson(`${import.meta.env.VITE_APP_ADMIN_URL}/api/administration/users`, {}, { fallbackMessage: "Failed to load existing users." }),
        ]);

        const employeeList = Array.isArray(data?.data) ? data.data : Array.isArray(data) ? data : [];
        const userList = Array.isArray(usersData?.data) ? usersData.data : Array.isArray(usersData) ? usersData : [];
        const linkedEmployeeIds = new Set(userList.map((user) => String(user.EmployeeId || "")).filter(Boolean));
        setEmployees(employeeList.filter((employee) => !linkedEmployeeIds.has(String(employee.Id))));
      } catch (error) {
        Swal.fire("Error", apiErrorMessage(error, "Unable to load employees."), "error");
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

    if (!form.EmployeeId) {
      Swal.fire("Missing employee", "Select an employee before creating a user.", "warning");
      return;
    }

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

      const data = await apiJson(`${import.meta.env.VITE_APP_ADMIN_URL}/api/administration/users`, {
        method: "POST",
        body: JSON.stringify(payload),
      }, { fallbackMessage: "Failed to create user." });

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
      Swal.fire("Error", apiErrorMessage(error, "Unable to create user."), "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 p-6 md:p-10">
      <div className="mx-auto max-w-4xl rounded-2xl bg-white p-8 shadow-xl">
        <div className="mb-6 flex items-start justify-between gap-4">
          <div><h2 className="text-2xl font-semibold text-slate-800">Create User</h2><p className="mt-2 text-sm text-slate-500">Create a new user by filling in the details below.</p></div>
          <Button asChild variant="outline"><Link to="/Administration/Users" className="inline-flex items-center gap-2"><FaArrowLeft /> Back to Users</Link></Button>
        </div>

        <form onSubmit={handleSubmit} className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2 md:col-span-2">
            <FieldLabel label="Select Employee" help="Links this login to an active employee and copies the employee's customer, branch, email, phone, and name details. The employee must exist before a user can be created." />
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
              disabled={employeeLoading || employees.length === 0}
            >
              <option value="">
                {employeeLoading
                  ? "Loading employees..."
                  : employees.length
                    ? "Select an employee"
                    : "No unlinked employees are available"}
              </option>
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
            <FieldLabel label="User Name" help="The unique lowercase name used to sign in. It cannot be changed after the user is created." />
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
            <FieldLabel label="Temporary Password" help="The user's initial credential. On first sign-in the system requires them to replace it with a new password." />
            <Input type="password" value={form.password || ""} onChange={(e) => handleChange("password", e.target.value)} placeholder="Enter password" />
          </div>

          <div className="space-y-2">
            <FieldLabel label="Confirm Temporary Password" help="Repeat the temporary password exactly to prevent creating the account with a mistyped credential." />
            <Input type="password" value={form.confirmPassword || ""} onChange={(e) => handleChange("confirmPassword", e.target.value)} placeholder="Confirm password" />
          </div>

          <div className="flex items-center gap-2 rounded-lg border border-slate-200 p-3">
            <input id="twoFactor" type="checkbox" checked={form.twoFactorEnabled} onChange={(e) => handleChange("twoFactorEnabled", e.target.checked)} />
            <FieldLabel htmlFor="twoFactor" label="2FA Enabled" help="Requires a second verification factor when the authentication flow and delivery providers are configured for this user." />
          </div>

          <div className="flex items-center gap-2 rounded-lg border border-slate-200 p-3">
            <input id="lockout" type="checkbox" checked={form.lockoutEnabled} onChange={(e) => handleChange("lockoutEnabled", e.target.checked)} />
            <FieldLabel htmlFor="lockout" label="Allow Automatic Lockout" help="Allows the identity system to temporarily lock this account after the configured number of failed sign-in attempts. It does not immediately lock the user." />
          </div>

          <div className="md:col-span-2 flex justify-between gap-3">
            <Button asChild type="button" variant="outline"><Link to="/Administration/Users">Back</Link></Button>
            <Button type="submit" disabled={loading} className="bg-indigo-600 hover:bg-indigo-700">
              {loading ? "Creating..." : "Create User"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
