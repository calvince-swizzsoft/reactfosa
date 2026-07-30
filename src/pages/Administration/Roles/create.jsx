import { useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Swal from "sweetalert2";

export default function CreateRole() {
  const [roleName, setRoleName] = useState("");
  const [loading, setLoading] = useState(false);

  const handleCreate = async (e) => {
    e.preventDefault();

    const trimmedName = roleName.trim();
    if (!trimmedName) {
      Swal.fire("Missing field", "Please enter a role name.", "warning");
      return;
    }

    setLoading(true);

    try {
      const response = await fetch(`${import.meta.env.VITE_APP_ADMIN_URL}/api/administration/roles`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ name: trimmedName }),
        
      });

      const data = await response.json().catch(() => ({}));
      console.log(data);

      if (!response.ok) {
        throw new Error(data?.message || "Failed to create role");
      }

      Swal.fire("Success", data?.message || `Role "${trimmedName}" created successfully.`, "success");
      setRoleName("");
    } catch (error) {
      Swal.fire("Error", error.message || "Unable to create role.", "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 p-6 md:p-10">
      <div className="mx-auto max-w-2xl rounded-2xl bg-white p-8 shadow-xl">
        <div className="mb-6 flex items-start justify-between gap-4">
          <div>
            <h2 className="text-2xl font-semibold text-slate-800">Create Role</h2>
            <p className="mt-2 text-sm text-slate-500">
              Enter a role name and create it from this form.
            </p>
          </div>
          <Link
            to="/Administration/Roles/PermissionTypes"
            className="shrink-0 rounded-md border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-50"
          >
            Manage Permission Types
          </Link>
        </div>

        <form onSubmit={handleCreate} className="space-y-5">
          <div className="space-y-2">
            <Label htmlFor="roleName">Role Name</Label>
            <Input
              id="roleName"
              type="text"
              value={roleName}
              onChange={(e) => setRoleName(e.target.value)}
              placeholder="Enter role name"
            />
          </div>

          <div className="flex justify-end">
            <Button type="submit" disabled={loading} className="bg-indigo-600 hover:bg-indigo-700">
              {loading ? "Creating..." : "Create Role"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
