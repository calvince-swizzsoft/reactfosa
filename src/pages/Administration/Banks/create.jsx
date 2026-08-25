import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { FaUniversity } from "react-icons/fa";
import Swal from "sweetalert2";
import BankBranchesFields, { emptyBranch } from "./BankBranchesFields";
import { createBank } from "./api";
import { apiErrorMessage } from "@/lib/api";

const emptyForm = { Code: "", Description: "", Address: "", City: "", IbanNo: "", SwiftCode: "" };

function FieldGroup({ label, children }) {
  return (
    <div>
      <Label>{label}</Label>
      {children}
    </div>
  );
}

export default function CreateBank() {
  const navigate = useNavigate();
  const [form, setForm] = useState(emptyForm);
  const [branches, setBranches] = useState([{ ...emptyBranch }]);
  const [loading, setLoading] = useState(false);

  const handleChange = (field, value) => setForm((p) => ({ ...p, [field]: value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await createBank(
        { ...form, Code: Number(form.Code) || 0 },
        branches.filter((b) => b.Description.trim())
      );
      Swal.fire("Success", "Bank created successfully", "success");
      navigate("/Administration/Banks");
    } catch (err) {
      Swal.fire("Error", apiErrorMessage(err, "Unable to create the bank."), "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white m-8 px-8 py-8 shadow-2xl rounded-lg relative">
      <div className="flex items-center justify-between gap-3 mb-6 bg-indigo-700 px-6 py-3 rounded-2xl">
        <div className="flex items-center gap-3">
          <FaUniversity className="text-white text-xl" />
          <h2 className="text-xl font-bold text-white">Add Bank</h2>
        </div>
        <Link to="/Administration/Banks" className="text-sm text-white/80 hover:text-white">
          &larr; Back to Banks
        </Link>
      </div>

      <form onSubmit={handleSubmit} className="max-w-2xl space-y-6">
        <div className="grid grid-cols-2 gap-4">
          <FieldGroup label="Bank Name">
            <Input value={form.Description} onChange={(e) => handleChange("Description", e.target.value)} required placeholder="e.g. Equity Bank" />
          </FieldGroup>
          <FieldGroup label="Code">
            {/* Not server-assigned (bank-api-spec.md §4.5) — pick a unique
                number, nothing reserves or generates one for you. */}
            <Input type="number" value={form.Code} onChange={(e) => handleChange("Code", e.target.value)} required placeholder="Unique numeric code" />
          </FieldGroup>
          <FieldGroup label="Address">
            <Input value={form.Address} onChange={(e) => handleChange("Address", e.target.value)} required />
          </FieldGroup>
          <FieldGroup label="City">
            <Input value={form.City} onChange={(e) => handleChange("City", e.target.value)} required />
          </FieldGroup>
          <FieldGroup label="Swift Code">
            <Input value={form.SwiftCode} onChange={(e) => handleChange("SwiftCode", e.target.value)} required />
          </FieldGroup>
          <FieldGroup label="IBAN No">
            <Input value={form.IbanNo} onChange={(e) => handleChange("IbanNo", e.target.value)} required />
          </FieldGroup>
        </div>

        <div>
          <Label className="text-sm font-semibold text-gray-700 mb-2 block">Branches (optional)</Label>
          <BankBranchesFields branches={branches} onChange={setBranches} />
        </div>

        <Button type="submit" disabled={loading} className="bg-indigo-600 hover:bg-indigo-700">
          {loading ? "Saving..." : "Create Bank"}
        </Button>
      </form>
    </div>
  );
}
