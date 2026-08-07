import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { FaAddressBook } from "react-icons/fa";
import Swal from "sweetalert2";
import { apiFetch, normalizeList } from "@/lib/api";
import { getChartOfAccountTree, createChartOfAccount } from "./api";
import ChartOfAccountForm from "./ChartOfAccountForm";
import { ChartOfAccountType, ChartOfAccountCategory } from "./enums";

const FIN_BASE = `${import.meta.env.VITE_APP_FIN_URL}`;

const emptyForm = {
  ParentId: "",
  AccountType: ChartOfAccountType.Asset,
  AccountCategory: ChartOfAccountCategory.DetailAccount,
  AccountCode: "",
  AccountName: "",
  CostCenterId: "",
  IsControlAccount: false,
  IsReconciliationAccount: false,
  PostAutomaticallyOnly: false,
  IsLocked: false,
};

export default function CreateChartOfAccount() {
  const [form, setForm] = useState(emptyForm);
  const [loading, setLoading] = useState(false);
  const [loadingData, setLoadingData] = useState(true);
  const [parentOptions, setParentOptions] = useState([]);
  const [costCenters, setCostCenters] = useState([]);

  useEffect(() => {
    setLoadingData(true);
    Promise.all([
      getChartOfAccountTree(),
      apiFetch(`${FIN_BASE}/api/accounts/costcenters?pageSize=1000`).then((r) => r.json()),
    ]).then(([tree, costCenterData]) => {
      setParentOptions(Array.isArray(tree) ? tree : []);
      setCostCenters(normalizeList(costCenterData));
    }).catch(() => { }).finally(() => setLoadingData(false));
  }, []);

  const handleChange = (field, value) => setForm((p) => ({ ...p, [field]: value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const payload = {
        ...form,
        ParentId: form.ParentId || null,
        CostCenterId: form.IsControlAccount ? null : (form.CostCenterId || null),
        AccountCode: Number(form.AccountCode),
      };
      const created = await createChartOfAccount(payload);
      Swal.fire("Success", `Chart of account "${created.AccountName}" created successfully`, "success");
      setForm(emptyForm);
    } catch (err) {
      Swal.fire("Error", err.message, "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white m-8 px-8 py-8 shadow-2xl rounded-lg relative">
      <div className="flex items-center justify-between gap-3 mb-6 bg-indigo-700 px-6 py-3 rounded-2xl">
        <div className="flex items-center gap-3">
          <FaAddressBook className="text-white text-xl" />
          <h2 className="text-xl font-bold text-white">Create Chart of Account</h2>
        </div>
        <Link to="/Accounts/ChartOfAccounts" className="text-sm text-white/80 hover:text-white">
          &larr; Back to Chart of Accounts
        </Link>
      </div>

      <div className="max-w-xl">
        <ChartOfAccountForm
          form={form}
          onChange={handleChange}
          parentOptions={parentOptions}
          costCenters={costCenters}
          loading={loading}
          loadingData={loadingData}
          submitLabel="Create Account"
          onSubmit={handleSubmit}
        />
      </div>
    </div>
  );
}
