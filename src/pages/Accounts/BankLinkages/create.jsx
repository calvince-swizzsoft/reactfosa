import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { FaExchangeAlt } from "react-icons/fa";
import Swal from "sweetalert2";
import BankLinkageForm from "./BankLinkageForm";
import { createBankLinkage } from "./api";
import { apiErrorMessage } from "@/lib/api";

const emptyForm = {
  BankId: "",
  BankName: "",
  BankAccountNumber: "",
  BankBranchName: "",
  BranchId: "",
  BranchDescription: "",
  ChartOfAccountId: "",
  ChartOfAccountAccountType: "",
  ChartOfAccountAccountCode: "",
  ChartOfAccountAccountName: "",
  ChartOfAccountCostCenterId: "",
  Remarks: "",
  IsLocked: false,
};

export default function CreateBankLinkage() {
  const navigate = useNavigate();
  const [form, setForm] = useState(emptyForm);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.BankId || !form.BranchId || !form.ChartOfAccountId) {
      Swal.fire("Missing Fields", "Bank, branch, and chart of account are required.", "warning");
      return;
    }
    setLoading(true);
    try {
      await createBankLinkage({ ...form, ChartOfAccountCostCenterId: form.ChartOfAccountCostCenterId || null });
      Swal.fire("Success", "Bank linkage created successfully", "success");
      navigate("/Accounts/BankLinkages");
    } catch (err) {
      Swal.fire("Error", apiErrorMessage(err, "Unable to create the bank linkage."), "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white m-8 px-8 py-8 shadow-2xl rounded-lg relative">
      <div className="flex items-center justify-between gap-3 mb-6 bg-indigo-700 px-6 py-3 rounded-2xl">
        <div className="flex items-center gap-3">
          <FaExchangeAlt className="text-white text-xl" />
          <h2 className="text-xl font-bold text-white">Add Bank Linkage</h2>
        </div>
        <Link to="/Accounts/BankLinkages" className="text-sm text-white/80 hover:text-white">
          &larr; Back to Bank Linkages
        </Link>
      </div>

      <div className="max-w-xl">
        <BankLinkageForm form={form} setForm={setForm} loading={loading} submitLabel="Create Bank Linkage" onSubmit={handleSubmit} />
      </div>
    </div>
  );
}
