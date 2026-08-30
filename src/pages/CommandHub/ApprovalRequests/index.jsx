import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { FaSearch } from "react-icons/fa";
import { AnimatePresence, motion } from "framer-motion";
import Swal from "sweetalert2";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/context/AuthContext";
import { apiErrorMessage, apiJson, normalizeList } from "@/lib/api";
import {
  normalizeWorkflowItem,
  paddedReferenceNumber,
  toApprovalWorkflowItemDto,
  WorkflowRecordStatus,
} from "@/lib/workflowFormat";

const ADMIN_URL = import.meta.env.VITE_APP_ADMIN_URL;
const FINAL_LOAN_STAGE_ROUTES = {
  45008: "/Loaning/LoanCases/appraisal",
  45009: "/Loaning/LoanCases/approval",
  45007: "/Loaning/LoanCases/audit",
  45012: "/Loaning/LoanCases/appraisal",
  45013: "/Loaning/LoanCases/approval",
  45011: "/Loaning/LoanCases/audit",
};

// /items/mine resolves scope purely from the caller's roles (JWT) server
// side and returns pending/other-status items across every permission type
// those roles can act on in one call — no systemPermissionType param at
// all (sending 0 doesn't mean "no filter" here, real values start at
// 44992+, so 0 matched nothing and this page returned empty). Don't loop
// GET /items over every permission type client-side either; that's what
// this endpoint replaces. GET /items?systemPermissionType=X is still the
// right call for a single-type/tabbed view (e.g. a dedicated "Customer
// Verifications" screen) — unchanged, not used here.
// pageIndex is 0-based here (AllMatchingPaged's Skip(pageSize * pageIndex),
// same as every other paged endpoint in this API) — /items, /items/mine,
// and /queueable used to default to 1-based, which silently skipped every
// real row once pageSize was reached (itemsCount still came back correct,
// just paired with an empty pageCollection). Fixed server-side to default
// to 0; this page passes pageIndex explicitly so it needed the same fix.
// The start/end dates span the full DateTime range so no date filter is
// effectively applied.
const MIN_DATE = "0001-01-01T00:00:00";
const MAX_DATE = "9999-12-31T23:59:59";
const MAX_PAGE_SIZE = 1000; // this page has no pager UI, so ask for everything in one page

const valueOf = (record, name) => record?.[name] ?? record?.[name[0].toLowerCase() + name.slice(1)];
const GUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const requestRemarks = (record) => {
  const remarks = String(valueOf(record, "Remarks") ?? "").trim();
  return GUID_PATTERN.test(remarks) ? "Created from a teller transaction (legacy record)" : remarks;
};

function DetailField({ label, value }) {
  return (
    <div className="min-w-0 rounded-lg bg-slate-50 p-3">
      <span className="block text-xs font-semibold uppercase tracking-wider text-slate-400">{label}</span>
      <span className="mt-1 block break-words text-sm text-slate-700">{value || value === 0 ? value : "—"}</span>
    </div>
  );
}

function ApprovalRecordDrawer({ item, onClose, onDecision, isActing }) {
  const [record, setRecord] = useState(null);
  const [recordType, setRecordType] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!item?.id) return;
    setLoading(true);
    setRecord(null);
    apiJson(`${ADMIN_URL}/api/administration/workflows/items/${item.id}/record`, {}, {
      fallbackMessage: "Failed to load the record related to this approval.",
    }).then((response) => {
      setRecord(response?.data ?? response?.Data ?? null);
      setRecordType(response?.recordType ?? response?.RecordType ?? item.workflowSystemPermissionTypeDescription);
    }).catch((error) => {
      Swal.fire("Error", apiErrorMessage(error, "Unable to load the related record."), "error");
      onClose();
    }).finally(() => setLoading(false));
    // The item id is the request identity. Depending on the inline onClose
    // callback would re-fetch on every parent render.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [item?.id]);

  const amount = valueOf(record, "Amount");
  const createdDate = valueOf(record, "CreatedDate");

  return (
    <AnimatePresence>
      {item && <>
        <motion.div className="fixed inset-0 z-40 bg-black" initial={{ opacity: 0 }} animate={{ opacity: 0.4 }} exit={{ opacity: 0 }} onClick={onClose} />
        <motion.div className="fixed bottom-3 right-3 top-3 z-50 flex w-full max-w-2xl flex-col rounded-2xl bg-white p-3 shadow-xl" initial={{ x: "100%" }} animate={{ x: 0 }} exit={{ x: "100%" }} transition={{ type: "spring", stiffness: 300, damping: 30 }}>
          <div className="m-2 flex shrink-0 items-center justify-between rounded-2xl bg-indigo-600 px-4 py-3">
            <div><h2 className="text-lg font-bold text-white">Review approval record</h2><p className="text-xs text-indigo-100">{recordType || "Related record"}</p></div>
            <Button variant="outline" size="sm" onClick={onClose}>Close</Button>
          </div>
          <div className="flex-1 overflow-y-auto p-3">
            {loading ? <p className="p-6 text-sm text-slate-500">Loading record details...</p> : record ? (
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <DetailField label="Customer" value={valueOf(record, "CustomerAccountCustomerFullName") || valueOf(record, "CustomerName")} />
                <DetailField label="Customer account" value={valueOf(record, "CustomerAccountFullAccountNumber")} />
                <DetailField label="Amount" value={amount == null ? "—" : Number(amount).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} />
                <DetailField label="Savings product" value={valueOf(record, "CustomerAccountCustomerAccountTypeTargetProductDescription")} />
                <DetailField label="Branch" value={valueOf(record, "BranchDescription")} />
                <DetailField label="Transaction type" value={valueOf(record, "TransactionTypeDescription")} />
                <DetailField label="Request status" value={valueOf(record, "StatusDescription")} />
                <DetailField label="Created by" value={valueOf(record, "CreatedBy")} />
                <DetailField label="Created date" value={createdDate ? new Date(createdDate).toLocaleString() : "—"} />
                <DetailField label="Request remarks" value={requestRemarks(record)} />
              </div>
            ) : <p className="p-6 text-sm text-slate-500">The related record could not be loaded.</p>}
          </div>
          <div className="flex shrink-0 justify-end gap-2 border-t border-slate-200 p-3">
            <button type="button" disabled={!record || isActing} onClick={() => onDecision(item, "reject")} className="rounded-md border border-red-200 px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-50 disabled:opacity-50">Reject</button>
            <button type="button" disabled={!record || isActing} onClick={() => onDecision(item, "approve")} className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50">Approve</button>
          </div>
        </motion.div>
      </>}
    </AnimatePresence>
  );
}

async function promptDecision(item, decision) {
  const isApprove = decision === "approve";

  const { value: formValues } = await Swal.fire({
    title: isApprove ? `Approve as ${item.roleName}?` : `Reject as ${item.roleName}?`,
    html: `
      <div style="text-align:left">
        <label style="display:block; font-size:12px; font-weight:600; color:#64748b; margin-bottom:4px;">Remarks</label>
        <textarea id="swal-remarks" class="swal2-textarea" placeholder="Optional remarks" style="margin:0 0 10px 0;"></textarea>
        <label style="display:flex; align-items:center; gap:8px; font-size:14px; color:#334155;">
          <input id="swal-biometrics" type="checkbox" style="width:16px; height:16px; accent-color:#4f46e5;" />
          Verified with biometrics
        </label>
      </div>
    `,
    showCancelButton: true,
    confirmButtonText: isApprove ? "Approve" : "Reject",
    confirmButtonColor: isApprove ? "#4f46e5" : "#dc2626",
    focusConfirm: false,
    preConfirm: () => ({
      remarks: document.getElementById("swal-remarks").value,
      usedBiometrics: document.getElementById("swal-biometrics").checked,
    }),
  });

  return formValues;
}

export default function ApprovalRequests() {
  const navigate = useNavigate();
  const { roles } = useAuth();
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [actingIds, setActingIds] = useState(new Set());
  const [reviewingItem, setReviewingItem] = useState(null);

  const myRoleSet = useMemo(
    () => new Set((roles || []).map((r) => String(r).toLowerCase())),
    [roles]
  );

  const fetchMyTasks = async () => {
    setLoading(true);
    try {
      // Hits the unified /items/mine endpoint directly (server-side scoped
      // to the caller's role via the bearer token) instead of pulling every
      // workflow and every item on it and filtering client-side — that
      // older approach exposed every role's pending approvals to every
      // user's browser regardless of what they were actually entitled to
      // see.
      const params = new URLSearchParams({
        status: String(WorkflowRecordStatus.Pending),
        text: "",
        startDate: MIN_DATE,
        endDate: MAX_DATE,
        pageIndex: "0",
        pageSize: String(MAX_PAGE_SIZE),
      });
      const data = await apiJson(
        `${ADMIN_URL}/api/administration/workflows/items/mine?${params.toString()}`,
        {},
        { fallbackMessage: "Failed to load your approval requests." },
      );

      // Unlike most of this API, /items/mine's response isn't wrapped in
      // the { success, message, data } envelope — it's the bare
      // PageCollectionInfo object itself, PascalCase keys included
      // (confirmed against a real response: { PageIndex, PageCollection,
      // ItemsCount, ... } with no success/message/data at all).
      // normalizeList still handles it since it falls back to checking
      // `.PageCollection` directly on the response when there's no
      // `.data`/`.Data` wrapper.
      const list = normalizeList(data);
      const allItems = list.map(normalizeWorkflowItem);

      // The endpoint already scopes results to the caller's role(s) — this is
      // defense-in-depth against rendering an action button, not the actual
      // security boundary.
      const myTasks = allItems.filter(
        (item) =>
          item.status === WorkflowRecordStatus.Pending &&
          !item.isLocked &&
          myRoleSet.has((item.roleName || "").toLowerCase())
      );

      setTasks(myTasks);
    } catch (error) {
      Swal.fire("Error", apiErrorMessage(error, "Unable to load your approval requests."), "error");
      setTasks([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (myRoleSet.size > 0) fetchMyTasks();
    else setTasks([]);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [myRoleSet]);

  // POST /items/approve only marks the WorkflowItem itself approved/
  // rejected, synchronously — it does NOT flip the underlying customer's
  // (or customer account's) recordStatus. That happens asynchronously once
  // a separate dispatcher service picks up the queued job, so the success
  // message below is about the workflow item only. Don't add UI here that
  // implies the customer/account is immediately verified — poll
  // GET /api/registry/customer/{id} (or the account equivalent) and check
  // recordStatus if a screen ever needs to confirm that part landed.
  const handleDecision = async (item, decision) => {
    const formValues = await promptDecision(item, decision);
    if (!formValues) return;

    setActingIds((prev) => new Set(prev).add(item.id));
    try {
      const status = decision === "approve" ? WorkflowRecordStatus.Approved : WorkflowRecordStatus.Rejected;
      const payload = {
        WorkflowItem: toApprovalWorkflowItemDto(item, { status, remarks: formValues.remarks }),
        UsedBiometrics: Boolean(formValues.usedBiometrics),
      };

      const data = await apiJson(`${ADMIN_URL}/api/administration/workflows/items/approve`, {
        method: "POST",
        body: JSON.stringify(payload),
      }, { fallbackMessage: `Failed to ${decision} this item.` });

      setTasks((prev) => prev.filter((t) => t.id !== item.id));
      setReviewingItem(null);
      Swal.fire("Success", data?.message || `Item ${decision === "approve" ? "approved" : "rejected"}.`, "success");
    } catch (error) {
      Swal.fire("Error", apiErrorMessage(error, `Unable to ${decision} this item.`), "error");
    } finally {
      setActingIds((prev) => {
        const next = new Set(prev);
        next.delete(item.id);
        return next;
      });
    }
  };

  const openDetailedLoanStage = (item) => {
    const route = FINAL_LOAN_STAGE_ROUTES[Number(item.workflowSystemPermissionType)];
    if (!route) return;

    const params = new URLSearchParams({
      loanCaseId: item.workflowRecordId,
      workflowItemId: item.id,
    });
    navigate(`${route}?${params.toString()}`);
  };

  const query = search.trim().toLowerCase();
  const visibleTasks = useMemo(() => {
    if (!query) return tasks;
    return tasks.filter((item) =>
      [
        paddedReferenceNumber(item),
        item.workflowBranchDescription,
        item.workflowSystemPermissionTypeDescription,
        item.roleName,
      ].some((field) => String(field ?? "").toLowerCase().includes(query))
    );
  }, [tasks, query]);

  return (
    <div className="min-h-screen bg-slate-100 p-6 md:p-10">
      <div className="mx-auto max-w-6xl rounded-2xl bg-white p-8 shadow-xl">
        <div className="mb-6">
          <h2 className="text-2xl font-semibold text-slate-800">Approval Requests</h2>
          <p className="mt-2 text-sm text-slate-500">
            Workflow items awaiting your decision, based on your assigned role(s).
          </p>
        </div>

        <div className="mb-4 relative">
          <FaSearch className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-xs text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by reference #, branch, permission type, or role..."
            className="w-full rounded-lg border border-slate-200 py-2 pl-9 pr-3 text-sm outline-none focus:border-indigo-400"
          />
        </div>

        <div className="overflow-x-auto rounded-xl border border-slate-200">
          <table className="w-full text-left">
            <thead className="bg-slate-50">
              <tr className="divide-x divide-slate-200">
                <th className="whitespace-nowrap px-4 py-2.5 text-sm font-semibold text-slate-700">Reference #</th>
                <th className="whitespace-nowrap px-4 py-2.5 text-sm font-semibold text-slate-700">Branch</th>
                <th className="whitespace-nowrap px-4 py-2.5 text-sm font-semibold text-slate-700">Permission Type</th>
                <th className="whitespace-nowrap px-4 py-2.5 text-sm font-semibold text-slate-700">Role</th>
                <th className="whitespace-nowrap px-4 py-2.5 text-sm font-semibold text-slate-700">Role Stage</th>
                <th className="whitespace-nowrap px-4 py-2.5 text-sm font-semibold text-slate-700">Overall Stage</th>
                <th className="whitespace-nowrap px-4 py-2.5 text-sm font-semibold text-slate-700">Remarks</th>
                <th className="whitespace-nowrap px-4 py-2.5 text-sm font-semibold text-slate-700 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {loading ? (
                <tr>
                  <td colSpan={8} className="px-4 py-3 text-sm text-slate-500">Loading your approval requests...</td>
                </tr>
              ) : visibleTasks.length > 0 ? (
                visibleTasks.map((item) => {
                  const isActing = actingIds.has(item.id);
                  const isFinalLoanStage = Boolean(
                    item.isLastItemInOverallApprovalChain &&
                    FINAL_LOAN_STAGE_ROUTES[Number(item.workflowSystemPermissionType)]
                  );
                  return (
                    <tr key={item.id}>
                      <td className="px-4 py-2.5 text-sm font-medium text-slate-800">{paddedReferenceNumber(item)}</td>
                      <td className="px-4 py-2.5 text-sm text-slate-700">{item.workflowBranchDescription || "—"}</td>
                      <td className="px-4 py-2.5 text-sm text-slate-700">
                        {item.workflowSystemPermissionTypeDescription || "—"}
                      </td>
                      <td className="px-4 py-2.5 text-sm text-slate-700">{item.roleName || "—"}</td>
                      <td className="px-4 py-2.5 text-sm text-slate-700">{item.stage || "—"}</td>
                      <td className="px-4 py-2.5 text-sm text-slate-700">{item.overallApprovalStage || "—"}</td>
                      <td className="px-4 py-2.5 text-sm text-slate-700">{item.remarks || "—"}</td>
                      <td className="px-4 py-2.5 text-right">
                        <div className="flex justify-end gap-2">
                          {isFinalLoanStage ? (
                            <button
                              type="button"
                              disabled={isActing}
                              onClick={() => openDetailedLoanStage(item)}
                              className="rounded-md bg-indigo-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-indigo-700 disabled:opacity-50"
                            >
                              Open loan
                            </button>
                          ) : (
                            <button
                              type="button"
                              disabled={isActing}
                              onClick={() => setReviewingItem(item)}
                              className="rounded-md bg-indigo-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-indigo-700 disabled:opacity-50"
                            >
                              Review
                            </button>
                          )}
                          {isFinalLoanStage && <button
                            type="button"
                            disabled={isActing}
                            onClick={() => handleDecision(item, "reject")}
                            className="rounded-md border border-red-200 px-3 py-1.5 text-xs font-medium text-red-600 hover:bg-red-50 disabled:opacity-50"
                          >
                            Reject
                          </button>}
                        </div>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={8} className="px-4 py-3 text-sm text-slate-500">
                    {query ? "No approval requests match your search." : "No approval requests waiting on you."}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
      <ApprovalRecordDrawer item={reviewingItem} onClose={() => setReviewingItem(null)} onDecision={handleDecision} isActing={reviewingItem ? actingIds.has(reviewingItem.id) : false} />
    </div>
  );
}
