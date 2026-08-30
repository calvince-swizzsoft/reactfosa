import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import Swal from "sweetalert2";
import { apiErrorMessage, apiJson, normalizeList } from "@/lib/api";
import ChartOfAccountForm from "./ChartOfAccountForm";
import { createChartOfAccount, getChartOfAccountTree } from "./api";
import { ChartOfAccountCategory, ChartOfAccountType } from "./enums";

const FIN_BASE = `${import.meta.env.VITE_APP_FIN_URL}`;
const emptyForm = { ParentId: "", AccountType: ChartOfAccountType.Asset, AccountCategory: ChartOfAccountCategory.DetailAccount, AccountCode: "", AccountName: "", CostCenterId: "", IsControlAccount: false, IsReconciliationAccount: false, PostAutomaticallyOnly: false, IsLocked: false };

export default function QuickCreateDrawer({ open, onClose, onCreated }) {
  const [form, setForm] = useState(emptyForm);
  const [parentOptions, setParentOptions] = useState([]);
  const [costCenters, setCostCenters] = useState([]);
  const [loadingData, setLoadingData] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) return;
    setForm(emptyForm);
    setLoadingData(true);
    Promise.all([getChartOfAccountTree(), apiJson(`${FIN_BASE}/api/accounts/costcenters?pageSize=1000`)]).then(([tree, centers]) => {
      setParentOptions(Array.isArray(tree) ? tree : []);
      setCostCenters(normalizeList(centers));
    }).catch((error) => Swal.fire("Load Error", apiErrorMessage(error, "Unable to load G/L account options."), "error"))
      .finally(() => setLoadingData(false));
  }, [open]);

  const submit = async (event) => {
    event.preventDefault();
    if (!String(form.AccountName).trim() || !Number.isInteger(Number(form.AccountCode)) || Number(form.AccountCode) <= 0) {
      Swal.fire("Account Details Required", "Enter an account name and a positive whole-number account code.", "warning");
      return;
    }
    setSaving(true);
    try {
      const created = await createChartOfAccount({ ...form, AccountName: form.AccountName.trim(), AccountCode: Number(form.AccountCode), ParentId: form.ParentId || null, CostCenterId: form.IsControlAccount ? null : (form.CostCenterId || null) });
      await Swal.fire("Success", `G/L account "${created.AccountName}" created successfully.`, "success");
      onCreated(created);
      onClose();
    } catch (error) {
      Swal.fire("Creation Failed", apiErrorMessage(error, "Unable to create the G/L account."), "error");
    } finally { setSaving(false); }
  };

  return <AnimatePresence>{open && <>
    <motion.div className="fixed inset-0 z-[60] bg-black" initial={{ opacity: 0 }} animate={{ opacity: 0.4 }} exit={{ opacity: 0 }} onClick={onClose} />
    <motion.div className="fixed right-3 top-5 z-[70] flex max-h-[95vh] w-[560px] flex-col rounded-2xl bg-white p-3 shadow-xl" initial={{ x: "100%" }} animate={{ x: 0 }} exit={{ x: "100%" }} transition={{ type: "spring", stiffness: 300, damping: 30 }}>
      <div className="m-2 flex shrink-0 items-center justify-between rounded-2xl bg-indigo-600 p-4"><h2 className="text-lg font-bold text-white">Create G/L Account</h2><Button type="button" variant="outline" size="sm" onClick={onClose}>Close</Button></div>
      <div className="min-h-0 flex-1 overflow-y-auto p-4"><ChartOfAccountForm form={form} onChange={(field, value) => setForm((current) => ({ ...current, [field]: value }))} parentOptions={parentOptions} costCenters={costCenters} loading={saving} loadingData={loadingData} submitLabel="Create and Select Account" onSubmit={submit} /></div>
    </motion.div>
  </>}</AnimatePresence>;
}
