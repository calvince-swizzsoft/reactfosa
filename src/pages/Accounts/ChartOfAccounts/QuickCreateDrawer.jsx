import { useEffect, useId, useState } from "react";
import { createPortal } from "react-dom";
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
  const formId = useId();
  const [form, setForm] = useState(emptyForm);
  const [parentOptions, setParentOptions] = useState([]);
  const [costCenters, setCostCenters] = useState([]);
  const [loadingData, setLoadingData] = useState(false);
  const [saving, setSaving] = useState(false);
  const [loadError, setLoadError] = useState(false);

  useEffect(() => {
    if (!open) return;
    let active = true;
    setForm(emptyForm);
    setLoadingData(true);
    setLoadError(false);
    Promise.all([getChartOfAccountTree(), apiJson(`${FIN_BASE}/api/accounts/costcenters?pageSize=1000`)]).then(([tree, centers]) => {
      if (!active) return;
      setParentOptions(Array.isArray(tree) ? tree : []);
      setCostCenters(normalizeList(centers));
    }).catch((error) => {
      if (!active) return;
      setLoadError(true);
      Swal.fire("Load Error", apiErrorMessage(error, "Unable to load G/L account options. Close and reopen the drawer to retry."), "error");
    }).finally(() => { if (active) setLoadingData(false); });
    return () => { active = false; };
  }, [open]);

  const submit = async (event) => {
    event.preventDefault();
    event.stopPropagation();
    if (saving || loadingData || loadError) return;
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

  return createPortal(<AnimatePresence>{open && <>
    <motion.div className="fixed inset-0 z-[60] bg-black" initial={{ opacity: 0 }} animate={{ opacity: 0.4 }} exit={{ opacity: 0 }} onClick={() => { if (!saving) onClose(); }} />
    <motion.div role="dialog" aria-modal="true" aria-labelledby={`${formId}-title`} className="fixed right-3 top-5 z-[70] flex h-[95vh] w-[560px] max-w-[calc(100vw-1.5rem)] flex-col rounded-2xl bg-white p-3 shadow-xl" initial={{ x: "100%" }} animate={{ x: 0 }} exit={{ x: "100%" }} transition={{ type: "spring", stiffness: 300, damping: 30 }}>
      <div className="m-2 flex shrink-0 items-center justify-between rounded-2xl bg-indigo-600 p-4"><h2 id={`${formId}-title`} className="text-lg font-bold text-white">Create G/L Account</h2><Button type="button" variant="outline" size="sm" onClick={onClose} disabled={saving}>Close</Button></div>
      <div className="min-h-0 flex-1 overflow-y-auto p-4"><ChartOfAccountForm formId={formId} hideSubmit selectContentClassName="z-[80]" form={form} onChange={(field, value) => setForm((current) => ({ ...current, [field]: value }))} parentOptions={parentOptions} costCenters={costCenters} loading={saving} loadingData={loadingData} submitLabel="Create and Select Account" onSubmit={submit} /></div>
      <div className="shrink-0 border-t border-gray-200 p-4"><Button type="submit" form={formId} disabled={saving || loadingData || loadError} className="w-full bg-indigo-600 hover:bg-indigo-700">{saving ? "Saving..." : "Create and Select Account"}</Button></div>
    </motion.div>
  </>}</AnimatePresence>, document.body);
}
