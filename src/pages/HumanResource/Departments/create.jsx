import { useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { FaBuilding } from "react-icons/fa";
import Swal from "sweetalert2";
import { apiFetch } from "@/lib/api";

const BASE = `${import.meta.env.VITE_APP_FIN_URL}`;

const emptyForm = { Description: "", IsRegistry: false, IsLocked: false };

export default function CreateDepartment() {
  const [form, setForm] = useState(emptyForm);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await apiFetch(`${BASE}/api/humanresource/departments`, {
        method: "POST",
        body: JSON.stringify(form),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.message || "Failed to create department");
      Swal.fire("Success", "Department created successfully", "success");
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
          <FaBuilding className="text-white text-xl" />
          <h2 className="text-xl font-bold text-white">Create Department</h2>
        </div>
        <Link to="/HumanResource/Departments" className="text-sm text-white/80 hover:text-white">
          &larr; Back to Departments
        </Link>
      </div>

      <form onSubmit={handleSubmit} className="max-w-xl space-y-4">
        <div>
          <Label>Description</Label>
          <Input
            value={form.Description}
            onChange={(e) => setForm((p) => ({ ...p, Description: e.target.value }))}
            required
            placeholder="e.g. FOSA"
          />
        </div>
        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            id="dept-registry"
            checked={form.IsRegistry}
            onChange={(e) => setForm((p) => ({ ...p, IsRegistry: e.target.checked }))}
            className="w-4 h-4 accent-indigo-600"
          />
          <Label htmlFor="dept-registry">Is Registry?</Label>
        </div>
        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            id="dept-locked"
            checked={form.IsLocked}
            onChange={(e) => setForm((p) => ({ ...p, IsLocked: e.target.checked }))}
            className="w-4 h-4 accent-indigo-600"
          />
          <Label htmlFor="dept-locked">Is Locked?</Label>
        </div>
        <Button type="submit" disabled={loading} className="bg-indigo-600 hover:bg-indigo-700">
          {loading ? "Saving..." : "Create Department"}
        </Button>
      </form>
    </div>
  );
}
