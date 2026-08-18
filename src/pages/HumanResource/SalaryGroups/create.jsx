import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { FaLayerGroup } from "react-icons/fa";
import Swal from "sweetalert2";
import { createSalaryGroup } from "./lib/api";

export default function CreateSalaryGroup() {
  const navigate = useNavigate();
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const created = await createSalaryGroup(description);
      Swal.fire("Success", "Salary group created — now add its entries.", "success");
      navigate(`/HumanResource/SalaryGroups/${created.Id}`);
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
          <FaLayerGroup className="text-white text-xl" />
          <h2 className="text-xl font-bold text-white">Create Salary Group</h2>
        </div>
        <Link to="/HumanResource/SalaryGroups" className="text-sm text-white/80 hover:text-white">
          &larr; Back to Salary Groups
        </Link>
      </div>

      <form onSubmit={handleSubmit} className="max-w-xl space-y-4">
        <div>
          <Label className="text-sm font-semibold text-gray-700">Name</Label>
          <Input value={description} onChange={(e) => setDescription(e.target.value)} required placeholder="e.g. Job Group A" />
        </div>
        <Button type="submit" disabled={loading} className="bg-indigo-600 hover:bg-indigo-700">
          {loading ? "Saving..." : "Create Salary Group"}
        </Button>
      </form>
    </div>
  );
}
