import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  FaUsers, FaClipboardCheck, FaBalanceScale, FaSms, FaEnvelope,
  FaFileSignature, FaHandHoldingUsd, FaCashRegister,
} from "react-icons/fa";
import { useAuth } from "@/context/AuthContext";
import { useModuleTree } from "@/context/ModuleTreeContext";
import { apiJson, normalizeList } from "@/lib/api";
import { findFirstBuiltPath, isPathGranted } from "@/lib/moduleTree";
import { moduleRouteMap } from "@/lib/moduleRouteMap";
import { getIconForModule } from "@/lib/faIconMap";
import { normalizeWorkflowItem, WorkflowRecordStatus } from "@/lib/workflowFormat";
import { listTextAlerts } from "@/pages/Messaging/TextAlerts/api";
import { listEmailAlerts } from "@/pages/Messaging/EmailAlerts/api";
import { listLoanCases } from "@/pages/Loaning/LoanCases/lib/loanCaseApi";
import { LoanCaseStatus } from "@/pages/Loaning/LoanCases/lib/loanCaseEnums";
import { listRequests } from "@/pages/FOSA/TellerTransactions/requestsApi";
import { getFinancialStatement } from "@/pages/Reports/FinanceReports/api";

const FIN_BASE = `${import.meta.env.VITE_APP_FIN_URL}`;
const ADMIN_URL = import.meta.env.VITE_APP_ADMIN_URL;

// Deliberately excludes anything backed by the legacy god-class
// ValuesController.cs (e.g. GET api/values/get-pending-payouts) per
// explicit direction — every tile below hits a real, documented
// controller instead. See TODO.md for the "role-based content" and
// "user-configurable layout" follow-ups this v1 intentionally skips.
const itemsCountOf = (page) =>
  Number(page?.TotalCount ?? page?.totalCount ?? page?.ItemsCount ?? page?.itemsCount ?? 0);

async function fetchCustomerCount() {
  const params = new URLSearchParams({ pageIndex: "0", pageSize: "1", text: "", customerFilter: "2" });
  const body = await apiJson(
    `${FIN_BASE}/api/registry/customer?${params.toString()}`,
    {},
    { fallbackMessage: "Failed to load customer count." },
  );
  return itemsCountOf(body?.data ?? body?.Data ?? body);
}

// Mirrors CommandHub/ApprovalRequests' own fetch: /items/mine is already
// scoped to the caller's roles server-side, but the response still mixes
// in items other roles hold too, so the same client-side role/status/lock
// filter is required to get an accurate "mine and actionable" count.
async function fetchPendingApprovalsCount(roles) {
  const myRoleSet = new Set((roles || []).map((r) => String(r).toLowerCase()));
  if (myRoleSet.size === 0) return 0;

  const params = new URLSearchParams({
    status: String(WorkflowRecordStatus.Pending),
    text: "",
    startDate: "0001-01-01T00:00:00",
    endDate: "9999-12-31T23:59:59",
    pageIndex: "0",
    pageSize: "1000",
  });
  const data = await apiJson(
    `${ADMIN_URL}/api/administration/workflows/items/mine?${params.toString()}`,
    {},
    { fallbackMessage: "Failed to load approvals." },
  );

  const list = normalizeList(data).map(normalizeWorkflowItem);
  return list.filter(
    (item) =>
      item.status === WorkflowRecordStatus.Pending &&
      !item.isLocked &&
      myRoleSet.has((item.roleName || "").toLowerCase())
  ).length;
}

// Trial-balance debit/credit difference as of today — same computation
// Reports/FinanceReports/index.jsx does over the same endpoint, reused
// here as a one-number financial-health snapshot rather than the full
// statement.
async function fetchFinancialSnapshot() {
  const today = new Date().toISOString().slice(0, 10);
  const data = await getFinancialStatement("trial-balance", today);
  const rows = Array.isArray(data?.rows) ? data.rows : Array.isArray(data?.Rows) ? data.Rows : [];
  const valueOf = (row, name) => row[name] ?? row[name[0].toUpperCase() + name.slice(1)];
  const totalDebit = rows.reduce((sum, row) => sum + Number(valueOf(row, "debit") || 0), 0);
  const totalCredit = rows.reduce((sum, row) => sum + Number(valueOf(row, "credit") || 0), 0);
  return totalDebit - totalCredit;
}

// Omitting dlrStatus hits the plain unfiltered listing (see TextAlerts/api.js) —
// a real "all alerts" total, unlike Email Alerts below.
async function fetchTextAlertsCount() {
  const page = await listTextAlerts({ pageSize: 1 });
  return itemsCountOf(page);
}

// listEmailAlerts has no "unfiltered" option — it always defaults to
// DLRStatus.Delivered when no status is passed, so this is a "Delivered"
// count, not a raw total. Labeled accordingly below rather than presented
// as an all-statuses count it isn't.
async function fetchEmailAlertsDeliveredCount() {
  const page = await listEmailAlerts({ pageSize: 1 });
  return itemsCountOf(page);
}

async function fetchLoanCaseCount(status) {
  const page = await listLoanCases({ status, pageSize: 1 });
  return itemsCountOf(page);
}

// STATUS.Final = 8 in SavingsReceiptsPayments.jsx — shared by both the
// CashDepositRequestAuthStatus/CashWithdrawalRequestAuthStatus enums
// (Posted for deposits, Paid for withdrawals) on the merged queue.
async function fetchFrontOfficeTransactionsCount() {
  const page = await listRequests({ status: 8, pageSize: 1 });
  return itemsCountOf(page);
}

const money = (value) =>
  Number(value || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });

// Each tile is gated behind `isPathGranted` for its own destination route
// so a user never sees (or triggers a fetch for) a count on a page their
// role can't open — same permission source Layout.jsx/MiniSidebar already
// trust, just applied per-tile instead of per-route.
function buildTiles(roles) {
  return [
    {
      key: "customers",
      label: "Customers",
      icon: FaUsers,
      color: "indigo",
      to: "/Registry/Customers",
      fetcher: fetchCustomerCount,
      format: (v) => v.toLocaleString(),
    },
    {
      key: "approvals",
      label: "Pending Approvals",
      icon: FaClipboardCheck,
      color: "amber",
      to: "/CommandHub/ApprovalRequests",
      fetcher: () => fetchPendingApprovalsCount(roles),
      format: (v) => v.toLocaleString(),
    },
    {
      key: "financial-position",
      label: "Trial Balance Difference",
      icon: FaBalanceScale,
      color: "blue",
      to: "/Reports/FinancialReports",
      fetcher: fetchFinancialSnapshot,
      format: (v) => money(v),
    },
    {
      key: "text-alerts",
      label: "Text Alerts",
      icon: FaSms,
      color: "green",
      to: "/Messaging/TextAlerts",
      fetcher: fetchTextAlertsCount,
      format: (v) => v.toLocaleString(),
    },
    {
      key: "email-alerts",
      label: "Email Alerts (Delivered)",
      icon: FaEnvelope,
      color: "green",
      to: "/Messaging/EmailAlerts",
      fetcher: fetchEmailAlertsDeliveredCount,
      format: (v) => v.toLocaleString(),
    },
    {
      key: "loans-registered",
      label: "Loans Registered",
      icon: FaFileSignature,
      color: "indigo",
      to: "/Loaning/LoanCases/registration",
      fetcher: () => fetchLoanCaseCount(LoanCaseStatus.Registered),
      format: (v) => v.toLocaleString(),
    },
    {
      key: "loans-disbursed",
      label: "Loans Disbursed",
      icon: FaHandHoldingUsd,
      color: "indigo",
      // No dedicated "disbursed" list screen exists yet — routes to the
      // same LoanCaseController-backed registration screen, the only real
      // loan-case list page today.
      to: "/Loaning/LoanCases/registration",
      fetcher: () => fetchLoanCaseCount(LoanCaseStatus.Disbursed),
      format: (v) => v.toLocaleString(),
    },
    {
      key: "front-office",
      label: "Front Office Transactions (Posted/Paid)",
      icon: FaCashRegister,
      color: "blue",
      to: "/FrontOffice/SavingsReceiptsPayments",
      fetcher: fetchFrontOfficeTransactionsCount,
      format: (v) => v.toLocaleString(),
    },
  ];
}

const TILE_COLOR = {
  indigo: "bg-indigo-100 text-indigo-600",
  amber: "bg-amber-100 text-amber-600",
  blue: "bg-blue-100 text-blue-600",
  green: "bg-green-100 text-green-600",
};

function KpiTile({ tile, state }) {
  const Icon = tile.icon;
  const body =
    state.loading ? (
      <div className="mt-2 h-7 w-20 animate-pulse rounded bg-gray-200" />
    ) : state.error ? (
      <p className="mt-2 text-sm text-gray-400">—</p>
    ) : (
      <p className="mt-2 text-2xl font-bold text-gray-800">{tile.format(state.value)}</p>
    );

  return (
    <Link
      to={tile.to}
      className="block rounded-lg bg-white p-4 shadow-lg border hover:shadow-xl transition-all"
    >
      <div className={`inline-flex h-9 w-9 items-center justify-center rounded-lg ${TILE_COLOR[tile.color]}`}>
        <Icon className="text-base" />
      </div>
      <p className="mt-3 text-xs font-semibold uppercase tracking-wider text-gray-400">{tile.label}</p>
      {body}
    </Link>
  );
}

export default function Home() {
  const { userName, roles } = useAuth();
  const { tree, loading: treeLoading } = useModuleTree();
  const [tileState, setTileState] = useState({});

  useEffect(() => {
    if (treeLoading) return;

    const tiles = buildTiles(roles).filter((tile) => isPathGranted(tree, tile.to, moduleRouteMap));

    setTileState(
      Object.fromEntries(tiles.map((tile) => [tile.key, { loading: true, error: false, value: 0 }]))
    );

    tiles.forEach((tile) => {
      tile
        .fetcher()
        .then((value) => setTileState((prev) => ({ ...prev, [tile.key]: { loading: false, error: false, value } })))
        .catch(() => setTileState((prev) => ({ ...prev, [tile.key]: { loading: false, error: true, value: 0 } })));
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [treeLoading, tree, roles]);

  const visibleTiles = treeLoading ? [] : buildTiles(roles).filter((tile) => isPathGranted(tree, tile.to, moduleRouteMap));

  const moduleCards = tree.map((node) => ({
    node,
    path: findFirstBuiltPath(node, moduleRouteMap),
  }));

  if (treeLoading) {
    return (
      <div className="bg-white m-8 px-8 py-8 shadow-2xl rounded-lg" aria-label="Preparing dashboard">
        <div className="h-12 animate-pulse rounded-2xl bg-indigo-200" />
        <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {Array.from({ length: 8 }).map((_, index) => (
            <div key={index} className="h-28 animate-pulse rounded-lg bg-gray-100 shadow" />
          ))}
        </div>
      </div>
    );
  }

  if (tree.length === 0) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center p-6">
        <div className="max-w-md rounded-2xl bg-white p-8 text-center shadow-xl">
          <h2 className="text-xl font-semibold text-slate-800">No modules available</h2>
          <p className="mt-2 text-sm text-slate-500">
            Your account doesn't have access to any modules yet. Contact an administrator.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white m-8 px-8 py-8 shadow-2xl rounded-lg relative">
      <div className="bg-indigo-800 px-6 py-3 rounded-2xl flex justify-between items-center">
        <span className="text-xl font-bold text-white">
          Welcome back{userName ? `, ${userName}` : ""}
        </span>
        <span className="text-sm text-indigo-200">Dashboard</span>
      </div>

      {visibleTiles.length > 0 && (
        <div className="mt-6">
          <p className="text-xs font-semibold uppercase tracking-wider text-gray-400">At a glance</p>
          <div className="mt-3 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
            {visibleTiles.map((tile) => (
              <KpiTile key={tile.key} tile={tile} state={tileState[tile.key] || { loading: true }} />
            ))}
          </div>
        </div>
      )}

      <div className="mt-8">
        <p className="text-xs font-semibold uppercase tracking-wider text-gray-400">Your modules</p>
        <div className="mt-3 bg-gray-200 p-4 rounded-sm">
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
            {moduleCards.map(({ node, path }) =>
              path ? (
                <Link
                  key={node.Id}
                  to={path}
                  className="flex items-center gap-3 rounded-lg bg-white p-3 shadow border hover:shadow-xl transition-all"
                >
                  {(() => {
                    const Icon = getIconForModule(node.Icon);
                    return <Icon className="shrink-0 text-lg text-amber-500" />;
                  })()}
                  <span className="truncate text-sm font-semibold text-gray-700">{node.Description}</span>
                </Link>
              ) : (
                <div
                  key={node.Id}
                  className="flex items-center gap-3 rounded-lg bg-white/60 p-3 border border-dashed text-gray-400"
                  title="Nothing built under this module yet"
                >
                  {(() => {
                    const Icon = getIconForModule(node.Icon);
                    return <Icon className="shrink-0 text-lg" />;
                  })()}
                  <span className="truncate text-sm">{node.Description}</span>
                </div>
              )
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
