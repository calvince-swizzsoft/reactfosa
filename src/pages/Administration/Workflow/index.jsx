import { useEffect, useMemo, useState } from "react";
import { FaSearch } from "react-icons/fa";
import Swal from "sweetalert2";
import WorkflowDetailsDrawer from "./WorkflowDetailsDrawer";
import {
  normalizeWorkflow,
  statusBadgeClass,
  WorkflowRecordStatus,
  WORKFLOW_MATCHED_STATUS_NOT_MATCHED,
} from "@/lib/workflowFormat";
import { apiErrorMessage, apiJson, normalizeList } from "@/lib/api";

const ADMIN_URL = import.meta.env.VITE_APP_ADMIN_URL;

function ApprovalsMeter({ current, required }) {
  const pct = required > 0 ? Math.min(100, Math.round((current / required) * 100)) : 0;
  const complete = required > 0 && current >= required;

  return (
    <div className="flex items-center gap-2">
      <div className="h-1.5 w-20 overflow-hidden rounded-full bg-slate-200">
        <div
          className={`h-full rounded-full ${complete ? "bg-green-500" : "bg-indigo-600"}`}
          style={{ width: `${pct}%` }}
        />
      </div>
      <span className="text-xs font-medium tabular-nums text-slate-600">
        {current}/{required}
      </span>
    </div>
  );
}

export default function AdministrationWorkflows() {
  const [workflows, setWorkflows] = useState([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [selectedWorkflow, setSelectedWorkflow] = useState(null);
  const [drawerOpen, setDrawerOpen] = useState(false);

  const fetchWorkflows = async () => {
    setLoading(true);
    try {
      const data = await apiJson(
        `${ADMIN_URL}/api/administration/workflows`,
        {},
        { fallbackMessage: "Failed to load workflows." },
      );

      setWorkflows(normalizeList(data).map(normalizeWorkflow));
    } catch (error) {
      Swal.fire("Error", apiErrorMessage(error, "Unable to load workflows."), "error");
      setWorkflows([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWorkflows();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const [matchingIds, setMatchingIds] = useState(new Set());

  const handleMatch = async (workflow) => {
    const r = await Swal.fire({
      title: "Manually match this workflow?",
      text: "Runs the same processing the dispatcher would have, synchronously, right now.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#4f46e5",
      confirmButtonText: "Match",
    });
    if (!r.isConfirmed) return;

    setMatchingIds((prev) => new Set(prev).add(workflow.id));
    try {
      const data = await apiJson(`${ADMIN_URL}/api/administration/workflows/${workflow.id}/match`, {
        method: "POST",
      }, { fallbackMessage: "Failed to match this workflow." });

      // 400 = workflow hasn't reached a final Approved/Rejected status yet;
      // already-matched is a harmless success, not an error — either way
      // the server's own message says what happened.
      Swal.fire("Done", data?.message || "Workflow matched successfully.", "success");
      fetchWorkflows();
    } catch (error) {
      Swal.fire("Error", apiErrorMessage(error, "Unable to match this workflow."), "error");
    } finally {
      setMatchingIds((prev) => {
        const next = new Set(prev);
        next.delete(workflow.id);
        return next;
      });
    }
  };

  const query = search.trim().toLowerCase();
  const visibleWorkflows = useMemo(() => {
    if (!query) return workflows;
    return workflows.filter((w) =>
      [w.referenceNumber, w.branchDescription, w.systemPermissionTypeDescription, w.statusDescription]
        .some((field) => String(field ?? "").toLowerCase().includes(query))
    );
  }, [workflows, query]);

  const openDetails = (workflow) => {
    setSelectedWorkflow(workflow);
    setDrawerOpen(true);
  };

  return (
    <div className="min-h-screen bg-slate-100 p-6 md:p-10">
      <div className="mx-auto max-w-6xl rounded-2xl bg-white p-8 shadow-xl">
        <div className="mb-6">
          <h2 className="text-2xl font-semibold text-slate-800">Workflows</h2>
          <p className="mt-2 text-sm text-slate-500">
            Approval workflows across the system, with their items and history.
          </p>
        </div>

        <div className="mb-4 relative">
          <FaSearch className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-xs text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by reference #, branch, permission type, or status..."
            className="w-full rounded-lg border border-slate-200 py-2 pl-9 pr-3 text-sm outline-none focus:border-indigo-400"
          />
        </div>

        <div className="overflow-x-auto rounded-xl border border-slate-200">
          <table className="w-full text-left">
            <thead className="bg-slate-50">
              <tr className="divide-x divide-slate-200">
                <th className="px-4 py-2.5 text-sm font-semibold text-slate-700">Reference #</th>
                <th className="px-4 py-2.5 text-sm font-semibold text-slate-700">Branch</th>
                <th className="px-4 py-2.5 text-sm font-semibold text-slate-700">Permission Type</th>
                <th className="px-4 py-2.5 text-sm font-semibold text-slate-700">Status</th>
                <th className="px-4 py-2.5 text-sm font-semibold text-slate-700">Matched Status</th>
                <th className="px-4 py-2.5 text-sm font-semibold text-slate-700">Approvals</th>
                <th className="px-4 py-2.5 text-sm font-semibold text-slate-700 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {loading ? (
                <tr>
                  <td colSpan={7} className="px-4 py-3 text-sm text-slate-500">Loading workflows...</td>
                </tr>
              ) : visibleWorkflows.length > 0 ? (
                visibleWorkflows.map((workflow) => (
                  <tr key={workflow.id}>
                    <td className="px-4 py-2.5 text-sm font-medium text-slate-800">{workflow.referenceNumber}</td>
                    <td className="px-4 py-2.5 text-sm text-slate-700">{workflow.branchDescription || "—"}</td>
                    <td className="px-4 py-2.5 text-sm text-slate-700">{workflow.systemPermissionTypeDescription || "—"}</td>
                    <td className="px-4 py-2.5 text-sm">
                      <span className={`rounded px-2 py-1 text-xs font-semibold ${statusBadgeClass(workflow.statusDescription, workflow.status)}`}>
                        {workflow.statusDescription || "—"}
                      </span>
                    </td>
                    <td className="px-4 py-2.5 text-sm">
                      <span className={`rounded px-2 py-1 text-xs font-semibold ${statusBadgeClass(workflow.matchedStatusDescription)}`}>
                        {workflow.matchedStatusDescription || "—"}
                      </span>
                    </td>
                    <td className="px-4 py-2.5 text-sm">
                      <ApprovalsMeter current={workflow.currentApprovals} required={workflow.requiredApprovals} />
                    </td>
                    <td className="px-4 py-2.5 text-right">
                      <div className="flex justify-end gap-2">
                        {(workflow.status === WorkflowRecordStatus.Approved || workflow.status === WorkflowRecordStatus.Rejected) &&
                          Number(workflow.matchedStatus) === WORKFLOW_MATCHED_STATUS_NOT_MATCHED && (
                            <button
                              type="button"
                              disabled={matchingIds.has(workflow.id)}
                              onClick={() => handleMatch(workflow)}
                              title="Stuck at Not Matched despite reaching a final status — run the dispatcher's processing manually"
                              className="rounded-md bg-indigo-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-indigo-700 disabled:opacity-50"
                            >
                              {matchingIds.has(workflow.id) ? "Matching..." : "Match"}
                            </button>
                          )}
                        <button
                          type="button"
                          onClick={() => openDetails(workflow)}
                          className="rounded-md border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-50"
                        >
                          View
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={7} className="px-4 py-3 text-sm text-slate-500">
                    {query ? "No workflows match your search." : "No workflows found."}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <WorkflowDetailsDrawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        workflow={selectedWorkflow}
      />
    </div>
  );
}
