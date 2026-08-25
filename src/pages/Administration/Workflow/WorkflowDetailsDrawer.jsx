import { useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import Swal from "sweetalert2";
import {
  normalizeWorkflowItem,
  normalizeWorkflowItemEntry,
  statusBadgeClass,
  formatDateTime,
} from "@/lib/workflowFormat";
import { apiErrorMessage, apiJson, normalizeList } from "@/lib/api";

export default function WorkflowDetailsDrawer({ open, onClose, workflow }) {
  const [items, setItems] = useState([]);
  const [itemsLoading, setItemsLoading] = useState(false);
  const [entries, setEntries] = useState([]);
  const [entriesLoading, setEntriesLoading] = useState(false);

  useEffect(() => {
    if (!open || !workflow?.id) return;

    const fetchItems = async () => {
      setItemsLoading(true);
      try {
        const data = await apiJson(
          `${import.meta.env.VITE_APP_ADMIN_URL}/api/administration/workflows/${workflow.id}/items`,
          {},
          { fallbackMessage: "Failed to load workflow items." },
        );

        setItems(normalizeList(data).map(normalizeWorkflowItem));
      } catch (error) {
        Swal.fire("Error", apiErrorMessage(error, "Unable to load workflow items."), "error");
        setItems([]);
      } finally {
        setItemsLoading(false);
      }
    };

    const fetchEntries = async () => {
      setEntriesLoading(true);
      try {
        const data = await apiJson(
          `${import.meta.env.VITE_APP_ADMIN_URL}/api/administration/workflows/${workflow.id}/entries`,
          {},
          { fallbackMessage: "Failed to load workflow entries." },
        );

        setEntries(normalizeList(data).map(normalizeWorkflowItemEntry));
      } catch (error) {
        Swal.fire("Error", apiErrorMessage(error, "Unable to load workflow entries."), "error");
        setEntries([]);
      } finally {
        setEntriesLoading(false);
      }
    };

    fetchItems();
    fetchEntries();
  }, [open, workflow?.id]);

  // Entries reference a WorkflowItemId, not a role name — resolve it against
  // the items list so the entries table can show who/what stage acted rather
  // than a bare GUID.
  const roleNameByItemId = useMemo(() => {
    const map = new Map();
    items.forEach((item) => map.set(item.id, item.roleName));
    return map;
  }, [items]);

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            className="fixed inset-0 z-40 bg-black"
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.4 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />
          <motion.div
            className="fixed top-3 right-3 bottom-3 z-50 flex w-full max-w-3xl flex-col rounded-2xl bg-white shadow-xl"
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
          >
            <div className="m-2 flex items-center justify-between rounded-2xl bg-indigo-600 px-4 py-3">
              <h2 className="text-lg font-bold text-white">
                Workflow {workflow?.referenceNumber ? `#${workflow.referenceNumber}` : ""}
              </h2>
              <Button variant="outline" size="sm" onClick={onClose}>
                Close
              </Button>
            </div>

            <div className="flex-1 overflow-y-auto px-4 pb-4">
              {workflow && (
                <div className="mb-6 grid grid-cols-2 gap-3 rounded-xl border border-slate-200 p-4 text-sm md:grid-cols-3">
                  <div>
                    <span className="block text-xs font-semibold uppercase tracking-wider text-gray-400">Branch</span>
                    <span className="text-slate-700">{workflow.branchDescription || "—"}</span>
                  </div>
                  <div>
                    <span className="block text-xs font-semibold uppercase tracking-wider text-gray-400">
                      Permission Type
                    </span>
                    <span className="text-slate-700">{workflow.systemPermissionTypeDescription || "—"}</span>
                  </div>
                  <div>
                    <span className="block text-xs font-semibold uppercase tracking-wider text-gray-400">
                      Record Id
                    </span>
                    <span className="break-all text-slate-700">{workflow.recordId || "—"}</span>
                  </div>
                  <div>
                    <span className="block text-xs font-semibold uppercase tracking-wider text-gray-400">
                      Approvals
                    </span>
                    <span className="text-slate-700">
                      {workflow.currentApprovals} / {workflow.requiredApprovals}
                    </span>
                  </div>
                  <div>
                    <span className="block text-xs font-semibold uppercase tracking-wider text-gray-400">Status</span>
                    <span className={`inline-block rounded px-2 py-1 text-xs font-semibold ${statusBadgeClass(workflow.statusDescription, workflow.status)}`}>
                      {workflow.statusDescription || "—"}
                    </span>
                  </div>
                  <div>
                    <span className="block text-xs font-semibold uppercase tracking-wider text-gray-400">
                      Matched Status
                    </span>
                    <span className={`inline-block rounded px-2 py-1 text-xs font-semibold ${statusBadgeClass(workflow.matchedStatusDescription)}`}>
                      {workflow.matchedStatusDescription || "—"}
                    </span>
                  </div>
                </div>
              )}

              <div className="mb-6">
                <Label className="text-xs font-semibold uppercase tracking-wider text-gray-400">
                  Workflow Items — Approval Chain
                </Label>
                <div className="mt-2 overflow-x-auto rounded-xl border border-slate-200">
                  <table className="w-full text-left">
                    <thead className="bg-slate-50">
                      <tr className="divide-x divide-slate-200">
                        <th className="whitespace-nowrap px-4 py-2.5 text-sm font-semibold text-slate-700">Role</th>
                        <th className="whitespace-nowrap px-4 py-2.5 text-sm font-semibold text-slate-700">Priority</th>
                        <th className="whitespace-nowrap px-4 py-2.5 text-sm font-semibold text-slate-700">Role Stage</th>
                        <th className="whitespace-nowrap px-4 py-2.5 text-sm font-semibold text-slate-700">Overall Stage</th>
                        <th className="whitespace-nowrap px-4 py-2.5 text-sm font-semibold text-slate-700">Status</th>
                        <th className="whitespace-nowrap px-4 py-2.5 text-sm font-semibold text-slate-700">Locked</th>
                        <th className="whitespace-nowrap px-4 py-2.5 text-sm font-semibold text-slate-700">Created By</th>
                        <th className="whitespace-nowrap px-4 py-2.5 text-sm font-semibold text-slate-700">Created Date</th>
                        <th className="whitespace-nowrap px-4 py-2.5 text-sm font-semibold text-slate-700">Remarks</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200">
                      {itemsLoading ? (
                        <tr>
                          <td colSpan={9} className="px-4 py-3 text-sm text-slate-500">Loading...</td>
                        </tr>
                      ) : items.length > 0 ? (
                        items.map((item) => (
                          <tr key={item.id}>
                            <td className="px-4 py-2.5 text-sm font-medium text-slate-800">
                              {item.roleName || "—"}
                              {item.isLastItemInOverallApprovalChain && (
                                <span className="ml-2 rounded bg-blue-100 px-1.5 py-0.5 text-[11px] font-semibold text-blue-600">
                                  Final
                                </span>
                              )}
                            </td>
                            <td className="px-4 py-2.5 text-sm text-slate-700">{item.approvalPriority}</td>
                            <td className="px-4 py-2.5 text-sm text-slate-700">{item.stage || "—"}</td>
                            <td className="px-4 py-2.5 text-sm text-slate-700">{item.overallApprovalStage || "—"}</td>
                            <td className="px-4 py-2.5 text-sm">
                              <span className={`rounded px-2 py-1 text-xs font-semibold ${statusBadgeClass(item.statusDescription, item.status)}`}>
                                {item.statusDescription || "—"}
                              </span>
                            </td>
                            <td className="px-4 py-2.5 text-sm">
                              <span
                                className={`rounded px-2 py-1 text-xs font-semibold ${
                                  item.isLocked ? "bg-red-100 text-red-600" : "bg-green-100 text-green-600"
                                }`}
                              >
                                {item.isLocked ? "Locked" : "Active"}
                              </span>
                            </td>
                            <td className="px-4 py-2.5 text-sm text-slate-700">{item.createdBy || "—"}</td>
                            <td className="px-4 py-2.5 text-sm text-slate-700">{formatDateTime(item.createdDate)}</td>
                            <td className="px-4 py-2.5 text-sm text-slate-700">{item.remarks || "—"}</td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan={9} className="px-4 py-3 text-sm text-slate-500">
                            No items for this workflow.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              <div>
                <Label className="text-xs font-semibold uppercase tracking-wider text-gray-400">
                  Workflow Entries — Approval Decisions
                </Label>
                <div className="mt-2 overflow-x-auto rounded-xl border border-slate-200">
                  <table className="w-full text-left">
                    <thead className="bg-slate-50">
                      <tr className="divide-x divide-slate-200">
                        <th className="whitespace-nowrap px-4 py-2.5 text-sm font-semibold text-slate-700">Role</th>
                        <th className="whitespace-nowrap px-4 py-2.5 text-sm font-semibold text-slate-700">Decision</th>
                        <th className="whitespace-nowrap px-4 py-2.5 text-sm font-semibold text-slate-700">Biometrics</th>
                        <th className="whitespace-nowrap px-4 py-2.5 text-sm font-semibold text-slate-700">Created By</th>
                        <th className="whitespace-nowrap px-4 py-2.5 text-sm font-semibold text-slate-700">Created Date</th>
                        <th className="whitespace-nowrap px-4 py-2.5 text-sm font-semibold text-slate-700">Remarks</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200">
                      {entriesLoading ? (
                        <tr>
                          <td colSpan={6} className="px-4 py-3 text-sm text-slate-500">Loading...</td>
                        </tr>
                      ) : entries.length > 0 ? (
                        entries.map((entry) => (
                          <tr key={entry.id}>
                            <td className="px-4 py-2.5 text-sm text-slate-700">
                              {roleNameByItemId.get(entry.workflowItemId) || "—"}
                            </td>
                            <td className="px-4 py-2.5 text-sm">
                              <span className={`rounded px-2 py-1 text-xs font-semibold ${statusBadgeClass(entry.decision)}`}>
                                {entry.decision || "—"}
                              </span>
                            </td>
                            <td className="px-4 py-2.5 text-sm text-slate-700">{entry.usedBiometrics ? "Yes" : "No"}</td>
                            <td className="px-4 py-2.5 text-sm text-slate-700">{entry.createdBy || "—"}</td>
                            <td className="px-4 py-2.5 text-sm text-slate-700">{formatDateTime(entry.createdDate)}</td>
                            <td className="px-4 py-2.5 text-sm text-slate-700">{entry.remarks || "—"}</td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan={6} className="px-4 py-3 text-sm text-slate-500">
                            No entries for this workflow.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
