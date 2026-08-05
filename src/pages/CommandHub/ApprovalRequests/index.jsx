import { useEffect, useMemo, useState } from "react";
import { FaSearch } from "react-icons/fa";
import Swal from "sweetalert2";
import { useAuth } from "@/context/AuthContext";
import { apiFetch, normalizeList } from "@/lib/api";
import {
  normalizeWorkflowItem,
  paddedReferenceNumber,
  toApprovalWorkflowItemDto,
  WorkflowRecordStatus,
} from "@/lib/workflowFormat";

const ADMIN_URL = import.meta.env.VITE_APP_ADMIN_URL;

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
  const { roles } = useAuth();
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [actingIds, setActingIds] = useState(new Set());

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
      const response = await apiFetch(`${ADMIN_URL}/api/administration/workflows/items/mine?${params.toString()}`);
      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(data?.message || "Failed to load your approval requests");
      }

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
          myRoleSet.has((item.roleName || "").toLowerCase())
      );

      setTasks(myTasks);
    } catch (error) {
      Swal.fire("Error", error.message || "Unable to load your approval requests.", "error");
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

      const response = await apiFetch(`${ADMIN_URL}/api/administration/workflows/items/approve`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(data?.message || `Failed to ${decision} this item`);
      }

      setTasks((prev) => prev.filter((t) => t.id !== item.id));
      Swal.fire("Success", data?.message || `Item ${decision === "approve" ? "approved" : "rejected"}.`, "success");
    } catch (error) {
      Swal.fire("Error", error.message || `Unable to ${decision} this item.`, "error");
    } finally {
      setActingIds((prev) => {
        const next = new Set(prev);
        next.delete(item.id);
        return next;
      });
    }
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
                          <button
                            type="button"
                            disabled={isActing}
                            onClick={() => handleDecision(item, "approve")}
                            className="rounded-md bg-indigo-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-indigo-700 disabled:opacity-50"
                          >
                            Approve
                          </button>
                          <button
                            type="button"
                            disabled={isActing}
                            onClick={() => handleDecision(item, "reject")}
                            className="rounded-md border border-red-200 px-3 py-1.5 text-xs font-medium text-red-600 hover:bg-red-50 disabled:opacity-50"
                          >
                            Reject
                          </button>
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
    </div>
  );
}
