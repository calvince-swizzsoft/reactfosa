import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { FaMoneyBillWave } from "react-icons/fa";
import Swal from "sweetalert2";
import { createSalaryHead } from "./lib/api";
import SalaryHeadForm from "./lib/SalaryHeadForm";

const emptyForm = {
  Description: "", Type: 0, IsOneOff: false,
  ChartOfAccountId: "", CustomerAccountTypeProductCode: 0, CustomerAccountTypeTargetProductId: "", CustomerAccountTypeTargetProductCode: 0,
};

export default function CreateSalaryHead() {
  const navigate = useNavigate();
  const [form, setForm] = useState(emptyForm);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.Type) {
      Swal.fire("Missing Field", "Select a Type.", "warning");
      return;
    }
    if (!form.ChartOfAccountId) {
      Swal.fire("Missing Field", "Select a G/L Account.", "warning");
      return;
    }
    setLoading(true);
    try {
      await createSalaryHead(form);
      Swal.fire("Success", "Salary head created successfully", "success");
      navigate("/HumanResource/SalaryHeads");
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
          <FaMoneyBillWave className="text-white text-xl" />
          <h2 className="text-xl font-bold text-white">Create Salary Head</h2>
        </div>
        <Link to="/HumanResource/SalaryHeads" className="text-sm text-white/80 hover:text-white">
          &larr; Back to Salary Heads
        </Link>
      </div>

      <div className="max-w-xl">
        <SalaryHeadForm form={form} setForm={setForm} loading={loading} submitLabel="Create Salary Head" onSubmit={handleSubmit} />
      </div>
    </div>
  );
}
