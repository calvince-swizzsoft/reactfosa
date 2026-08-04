import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import Swal from "sweetalert2";
import { Link } from "react-router-dom";
import { FaCogs, FaArrowLeft, FaPlay, FaWrench, FaBroom, FaMoneyCheckAlt } from "react-icons/fa";
import { apiFetch } from "@/lib/api";
import { TargetDateOption } from "./api";
import {
  QueuePriority,
  executeDueStandingOrders,
  fixSkippedStandingOrders,
  sweepStandingOrders,
  payoutStandingOrder,
} from "./executionApi";

const FIN_BASE = `${import.meta.env.VITE_APP_FIN_URL}`;

const PRIORITY_OPTIONS = [
  { value: QueuePriority.Lowest, label: "Lowest" },
  { value: QueuePriority.VeryLow, label: "Very Low" },
  { value: QueuePriority.Low, label: "Low" },
  { value: QueuePriority.Normal, label: "Normal" },
  { value: QueuePriority.AboveNormal, label: "Above Normal" },
  { value: QueuePriority.High, label: "High" },
  { value: QueuePriority.VeryHigh, label: "Very High" },
  { value: QueuePriority.Highest, label: "Highest" },
];

const TARGET_DATE_OPTION_OPTIONS = [
  { value: TargetDateOption.ActualRunDate, label: "Actual Run Date (holiday-adjusted)" },
  { value: TargetDateOption.ExpectedRunDate, label: "Expected Run Date (nominal)" },
];

const MONTH_OPTIONS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
].map((label, i) => ({ value: i + 1, label }));

function FieldGroup({ label, children }) {
  return (
    <div>
      <Label className="text-sm font-semibold text-gray-700">{label}</Label>
      {children}
    </div>
  );
}

function EnumSelect({ value, options, onChange }) {
  return (
    <Select value={String(value)} onValueChange={(v) => onChange(Number(v))}>
      <SelectTrigger><SelectValue /></SelectTrigger>
      <SelectContent>
        {options.map((o) => (
          <SelectItem key={o.value} value={String(o.value)}>{o.label}</SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

function ActionCard({ icon, title, description, children, submitLabel, onSubmit, loading }) {
  return (
    <div className="rounded-xl border bg-white shadow p-6 space-y-4">
      <div className="flex items-center gap-2 text-indigo-700">
        {icon}
        <h3 className="font-semibold text-slate-800">{title}</h3>
      </div>
      <p className="text-xs text-slate-500">{description}</p>
      <div className="space-y-3">{children}</div>
      <Button
        type="button"
        disabled={loading}
        onClick={onSubmit}
        className="w-full bg-indigo-600 hover:bg-indigo-700"
      >
        {loading ? "Running..." : submitLabel}
      </Button>
    </div>
  );
}

// Every action here runs a batch operation across potentially many accounts
// — confirm before firing (same destructive-confirm pattern used for
// deletes elsewhere in this app) rather than let a misclick run silently.
const confirmRun = (title, text) =>
  Swal.fire({
    title,
    text,
    icon: "warning",
    showCancelButton: true,
    confirmButtonColor: "#dc2626",
    confirmButtonText: "Run",
  });

export default function StandingOrderExecution() {
  const [executeForm, setExecuteForm] = useState({
    targetDate: "",
    targetDateOption: TargetDateOption.ActualRunDate,
    priority: QueuePriority.Normal,
    maximumStandingOrderExecuteAttemptCount: 3,
    pageSize: 100,
  });
  const [executeLoading, setExecuteLoading] = useState(false);

  const [fixForm, setFixForm] = useState({ targetDate: "", pageSize: 100 });
  const [fixLoading, setFixLoading] = useState(false);

  const [sweepForm, setSweepForm] = useState({ priority: QueuePriority.Normal, pageSize: 100 });
  const [sweepLoading, setSweepLoading] = useState(false);

  const [customers, setCustomers] = useState([]);
  const [loadingCustomers, setLoadingCustomers] = useState(false);
  const [payoutCustomerId, setPayoutCustomerId] = useState("");
  const [payoutAccounts, setPayoutAccounts] = useState([]);
  const [loadingPayoutAccounts, setLoadingPayoutAccounts] = useState(false);
  const [payoutForm, setPayoutForm] = useState({
    benefactorCustomerAccountId: "",
    month: new Date().getMonth() + 1,
    priority: QueuePriority.Normal,
  });
  const [payoutLoading, setPayoutLoading] = useState(false);

  const normalizeList = (d) => {
    const payload = d?.data ?? d?.Data ?? d;
    if (Array.isArray(payload)) return payload;
    if (Array.isArray(payload?.PageCollection)) return payload.PageCollection;
    if (Array.isArray(payload?.pageCollection)) return payload.pageCollection;
    return [];
  };

  useEffect(() => {
    setLoadingCustomers(true);
    apiFetch(`${FIN_BASE}/api/registry/customers`)
      .then((r) => r.json())
      .then((d) => setCustomers(normalizeList(d)))
      .catch(() => setCustomers([]))
      .finally(() => setLoadingCustomers(false));
  }, []);

  const handlePayoutCustomerChange = (customerId) => {
    setPayoutCustomerId(customerId);
    setPayoutForm((p) => ({ ...p, benefactorCustomerAccountId: "" }));
    if (!customerId) {
      setPayoutAccounts([]);
      return;
    }
    setLoadingPayoutAccounts(true);
    apiFetch(`${FIN_BASE}/api/accounts/customer-accounts/${customerId}/accounts`)
      .then((r) => r.json())
      .then((d) => setPayoutAccounts(normalizeList(d)))
      .catch(() => setPayoutAccounts([]))
      .finally(() => setLoadingPayoutAccounts(false));
  };

  const runExecute = async () => {
    const r = await confirmRun("Run due standing orders?", "This executes every standing order due as of the target date.");
    if (!r.isConfirmed) return;
    setExecuteLoading(true);
    try {
      const { ran, message } = await executeDueStandingOrders({
        targetDate: executeForm.targetDate || undefined,
        targetDateOption: Number(executeForm.targetDateOption),
        priority: Number(executeForm.priority),
        maximumStandingOrderExecuteAttemptCount: Number(executeForm.maximumStandingOrderExecuteAttemptCount),
        pageSize: Number(executeForm.pageSize) || 100,
      });
      Swal.fire("Done", message, ran ? "success" : "info");
    } catch (err) {
      Swal.fire("Error", err.message, "error");
    } finally {
      setExecuteLoading(false);
    }
  };

  const runFixSkipped = async () => {
    const r = await confirmRun("Fix skipped standing orders?", "This resets the retry count for standing orders skipped on/before the target date.");
    if (!r.isConfirmed) return;
    setFixLoading(true);
    try {
      const { ran, message } = await fixSkippedStandingOrders({
        targetDate: fixForm.targetDate || undefined,
        pageSize: Number(fixForm.pageSize) || 100,
      });
      Swal.fire("Done", message, ran ? "success" : "info");
    } catch (err) {
      Swal.fire("Error", err.message, "error");
    } finally {
      setFixLoading(false);
    }
  };

  const runSweep = async () => {
    const r = await confirmRun("Run sweeping standing orders?", "This moves the full balance for every Sweep-trigger standing order.");
    if (!r.isConfirmed) return;
    setSweepLoading(true);
    try {
      const { ran, message } = await sweepStandingOrders({
        priority: Number(sweepForm.priority),
        pageSize: Number(sweepForm.pageSize) || 100,
      });
      Swal.fire("Done", message, ran ? "success" : "info");
    } catch (err) {
      Swal.fire("Error", err.message, "error");
    } finally {
      setSweepLoading(false);
    }
  };

  const runPayout = async () => {
    if (!payoutForm.benefactorCustomerAccountId) {
      Swal.fire("Missing Field", "Select a benefactor account first.", "warning");
      return;
    }
    const r = await confirmRun("Run payout?", "This runs this account's dividend payout for the selected month now.");
    if (!r.isConfirmed) return;
    setPayoutLoading(true);
    try {
      const { ran, message } = await payoutStandingOrder({
        benefactorCustomerAccountId: payoutForm.benefactorCustomerAccountId,
        month: Number(payoutForm.month),
        priority: Number(payoutForm.priority),
      });
      Swal.fire("Done", message, ran ? "success" : "info");
    } catch (err) {
      Swal.fire("Error", err.message, "error");
    } finally {
      setPayoutLoading(false);
    }
  };

  return (
    <div className="bg-white m-8 px-8 py-8 shadow-2xl rounded-lg relative">
      <div className="flex justify-between items-center mb-6 bg-indigo-800 px-6 py-3 rounded-2xl">
        <h2 className="text-xl font-bold text-white flex items-center gap-2">
          <FaCogs /> Standing Order Execution
        </h2>
        <Link to="/Accounts/StandingOrders">
          <Button variant="outline" className="bg-white flex items-center gap-2">
            <FaArrowLeft /> Back to Standing Orders
          </Button>
        </Link>
      </div>

      <div className="mb-6 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700">
        Admin/ops only. Every action below runs a batch operation across potentially many accounts —
        the same runs a scheduled service fires on a cron, exposed here to re-trigger on demand.
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <ActionCard
          icon={<FaPlay />}
          title="Execute Due"
          description="Runs standing orders due as of the target date, retrying up to the attempt ceiling before an order counts as skipped."
          submitLabel="Run Execute"
          onSubmit={runExecute}
          loading={executeLoading}
        >
          <FieldGroup label="Target Date (default: today)">
            <Input type="date" value={executeForm.targetDate} onChange={(e) => setExecuteForm((p) => ({ ...p, targetDate: e.target.value }))} />
          </FieldGroup>
          <FieldGroup label="Target Date Option">
            <EnumSelect value={executeForm.targetDateOption} options={TARGET_DATE_OPTION_OPTIONS} onChange={(v) => setExecuteForm((p) => ({ ...p, targetDateOption: v }))} />
          </FieldGroup>
          <FieldGroup label="Priority">
            <EnumSelect value={executeForm.priority} options={PRIORITY_OPTIONS} onChange={(v) => setExecuteForm((p) => ({ ...p, priority: v }))} />
          </FieldGroup>
          <FieldGroup label="Max Attempt Count">
            <Input type="number" min="1" value={executeForm.maximumStandingOrderExecuteAttemptCount} onChange={(e) => setExecuteForm((p) => ({ ...p, maximumStandingOrderExecuteAttemptCount: e.target.value }))} />
          </FieldGroup>
          <FieldGroup label="Page Size">
            <Input type="number" min="1" value={executeForm.pageSize} onChange={(e) => setExecuteForm((p) => ({ ...p, pageSize: e.target.value }))} />
          </FieldGroup>
        </ActionCard>

        <ActionCard
          icon={<FaWrench />}
          title="Fix Skipped"
          description="Resets the execute-attempt count for standing orders skipped on/before the target date, so the next Execute run retries them."
          submitLabel="Run Fix Skipped"
          onSubmit={runFixSkipped}
          loading={fixLoading}
        >
          <FieldGroup label="Target Date (default: yesterday)">
            <Input type="date" value={fixForm.targetDate} onChange={(e) => setFixForm((p) => ({ ...p, targetDate: e.target.value }))} />
          </FieldGroup>
          <FieldGroup label="Page Size">
            <Input type="number" min="1" value={fixForm.pageSize} onChange={(e) => setFixForm((p) => ({ ...p, pageSize: e.target.value }))} />
          </FieldGroup>
        </ActionCard>

        <ActionCard
          icon={<FaBroom />}
          title="Sweep"
          description="Processes every standing order with Trigger = Sweep, moving each account's full balance rather than a fixed amount."
          submitLabel="Run Sweep"
          onSubmit={runSweep}
          loading={sweepLoading}
        >
          <FieldGroup label="Priority">
            <EnumSelect value={sweepForm.priority} options={PRIORITY_OPTIONS} onChange={(v) => setSweepForm((p) => ({ ...p, priority: v }))} />
          </FieldGroup>
          <FieldGroup label="Page Size">
            <Input type="number" min="1" value={sweepForm.pageSize} onChange={(e) => setSweepForm((p) => ({ ...p, pageSize: e.target.value }))} />
          </FieldGroup>
        </ActionCard>

        <ActionCard
          icon={<FaMoneyCheckAlt />}
          title="Payout"
          description="Runs a single benefactor account's payout for a chosen month on demand — no scheduled job triggers this one."
          submitLabel="Run Payout"
          onSubmit={runPayout}
          loading={payoutLoading}
        >
          <FieldGroup label="Customer">
            <Select value={payoutCustomerId ? String(payoutCustomerId) : ""} onValueChange={handlePayoutCustomerChange} disabled={loadingCustomers}>
              <SelectTrigger><SelectValue placeholder={loadingCustomers ? "Loading..." : "Search & select customer"} /></SelectTrigger>
              <SelectContent className="max-h-60 overflow-y-auto">
                {customers.map((c) => {
                  const name = [c.IndividualFirstName, c.IndividualLastName]
                    .filter(Boolean)
                    .join(" ") || c.NonIndividualDescription || c.Description || `Customer ${c.Id}`;
                  return (
                    <SelectItem key={String(c.Id)} value={String(c.Id)}>{name}</SelectItem>
                  );
                })}
              </SelectContent>
            </Select>
          </FieldGroup>
          <FieldGroup label="Benefactor Account">
            <Select
              value={payoutForm.benefactorCustomerAccountId ? String(payoutForm.benefactorCustomerAccountId) : ""}
              onValueChange={(v) => setPayoutForm((p) => ({ ...p, benefactorCustomerAccountId: v }))}
              disabled={!payoutCustomerId || loadingPayoutAccounts}
            >
              <SelectTrigger>
                <SelectValue placeholder={loadingPayoutAccounts ? "Loading..." : !payoutCustomerId ? "Select a customer first" : "Select account"} />
              </SelectTrigger>
              <SelectContent className="max-h-60 overflow-y-auto">
                {payoutAccounts.map((a) => (
                  <SelectItem key={String(a.Id)} value={String(a.Id)}>
                    {a.CustomerAccountTypeTargetProductDescription || a.FullAccountNumber || a.Id}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </FieldGroup>
          <FieldGroup label="Month">
            <EnumSelect value={payoutForm.month} options={MONTH_OPTIONS} onChange={(v) => setPayoutForm((p) => ({ ...p, month: v }))} />
          </FieldGroup>
          <FieldGroup label="Priority">
            <EnumSelect value={payoutForm.priority} options={PRIORITY_OPTIONS} onChange={(v) => setPayoutForm((p) => ({ ...p, priority: v }))} />
          </FieldGroup>
        </ActionCard>
      </div>
    </div>
  );
}
