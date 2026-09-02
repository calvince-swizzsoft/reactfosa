import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import NotFoundImage from "/assets/scopefinding.png";
import { FaSyncAlt, FaPlus, FaChevronLeft, FaChevronRight, FaEdit, FaCogs } from "react-icons/fa";
import { Link } from "react-router-dom";
import { statusBadgeClass } from "@/lib/workflowFormat";
import {
  listStandingOrders,
  StandingOrderTrigger,
  StandingOrderCustomerAccountFilter,
  CustomerFilter,
} from "./api";
import StandingOrderDrawer from "./StandingOrderDrawer";

const TRIGGER_FILTER_OPTIONS = [
  { value: StandingOrderTrigger.Payout, label: "Payout" },
  { value: StandingOrderTrigger.CheckOff, label: "Check-Off" },
  { value: StandingOrderTrigger.Schedule, label: "Schedule" },
  { value: StandingOrderTrigger.Sweep, label: "Sweep" },
  { value: StandingOrderTrigger.Microloan, label: "Microloan" },
];

const CUSTOMER_ACCOUNT_FILTER_OPTIONS = [
  { value: StandingOrderCustomerAccountFilter.Beneficiary, label: "By Beneficiary" },
  { value: StandingOrderCustomerAccountFilter.Benefactor, label: "By Benefactor" },
];

// Value 1 (PersonalIdentificationNumber) is real here, unlike
// CustomerAccounts' CUSTOMER_FILTER_OPTIONS which has a gap at 1 — this is a
// separate enum (CustomerFilter, not that page's inline filter list).
const CUSTOMER_FILTER_OPTIONS = [
  { value: CustomerFilter.SerialNumber, label: "Serial Number" },
  { value: CustomerFilter.PersonalIdentificationNumber, label: "Personal ID Number" },
  { value: CustomerFilter.FirstName, label: "First Name" },
  { value: CustomerFilter.LastName, label: "Last Name" },
  { value: CustomerFilter.IdentityCardNumber, label: "Identity Card Number" },
  { value: CustomerFilter.PayrollNumbers, label: "Payroll Number" },
];

const formatDate = (iso) => {
  if (!iso) return "—";
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) || d.getFullYear() <= 1 ? "Not scheduled" : d.toLocaleDateString();
};

const field = (item, camelCaseName, pascalCaseName) => item?.[camelCaseName] ?? item?.[pascalCaseName];

const formatCharge = (item) =>
  Number(field(item, "chargeType", "ChargeType")) === 1 // Percentage
    ? `${field(item, "chargePercentage", "ChargePercentage") ?? 0}%`
    : Number(field(item, "chargeFixedAmount", "ChargeFixedAmount") ?? 0).toLocaleString();

export default function StandingOrders() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editingOrder, setEditingOrder] = useState(null);

  const [search, setSearch] = useState("");
  const [customerAccountFilter, setCustomerAccountFilter] = useState(StandingOrderCustomerAccountFilter.Beneficiary);
  const [customerFilter, setCustomerFilter] = useState(CustomerFilter.SerialNumber);
  const [trigger, setTrigger] = useState("");
  const [pageIndex, setPageIndex] = useState(0);
  const [pageSize, setPageSize] = useState(20);
  const [itemsCount, setItemsCount] = useState(0);

  const fetchItems = () => {
    setLoading(true);
    listStandingOrders({
      pageIndex,
      pageSize,
      text: search,
      customerAccountFilter,
      customerFilter,
      trigger: trigger === "" ? undefined : trigger,
    })
      .then((page) => {
        setItems(page?.pageCollection || page?.PageCollection || []);
        setItemsCount(page?.itemsCount ?? page?.ItemsCount ?? 0);
      })
      .catch(() => {
        setItems([]);
        setItemsCount(0);
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchItems();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search, customerAccountFilter, customerFilter, trigger, pageIndex, pageSize]);

  const handleSearchChange = (e) => {
    setSearch(e.target.value);
    setPageIndex(0);
  };

  const openCreate = () => {
    setEditingOrder(null);
    setDrawerOpen(true);
  };

  const openEdit = (order) => {
    setEditingOrder(order);
    setDrawerOpen(true);
  };

  const hasNextPage = itemsCount
    ? (pageIndex + 1) * pageSize < itemsCount
    : items.length === pageSize;

  return (
    <div className="bg-white m-8 px-8 py-8 shadow-2xl rounded-lg relative">
      <div className="flex justify-between items-center mb-6 bg-indigo-800 px-6 py-3 rounded-2xl">
        <h2 className="text-xl font-bold text-white flex items-center gap-2">
          <FaSyncAlt /> Standing Orders
        </h2>
        <div className="flex gap-2">
          <Link to="/Accounts/StandingOrders/Execution">
            <Button variant="outline" className="bg-white flex items-center gap-2">
              <FaCogs /> Execution
            </Button>
          </Link>
          <Link to="/Accounts/RecurringBatches">
            <Button variant="outline" className="bg-white flex items-center gap-2">
              Recurring Batches
            </Button>
          </Link>
          <Button onClick={openCreate} className="bg-indigo-600 hover:bg-indigo-700 flex items-center gap-2">
            <FaPlus /> Add Standing Order
          </Button>
        </div>
      </div>

      <div className="flex flex-wrap justify-between items-center mb-4 gap-3">
        <input
          type="text"
          placeholder="Search Standing Orders..."
          value={search}
          onChange={handleSearchChange}
          className="border p-2 rounded-lg flex-1 min-w-[200px]"
        />
        <Select value={String(customerAccountFilter)} onValueChange={(v) => { setCustomerAccountFilter(Number(v)); setPageIndex(0); }}>
          <SelectTrigger className="w-44"><SelectValue /></SelectTrigger>
          <SelectContent>
            {CUSTOMER_ACCOUNT_FILTER_OPTIONS.map((o) => (
              <SelectItem key={o.value} value={String(o.value)}>{o.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={String(customerFilter)} onValueChange={(v) => { setCustomerFilter(Number(v)); setPageIndex(0); }}>
          <SelectTrigger className="w-48"><SelectValue /></SelectTrigger>
          <SelectContent>
            {CUSTOMER_FILTER_OPTIONS.map((o) => (
              <SelectItem key={o.value} value={String(o.value)}>{o.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={trigger === "" ? "all" : String(trigger)} onValueChange={(v) => { setTrigger(v === "all" ? "" : Number(v)); setPageIndex(0); }}>
          <SelectTrigger className="w-40"><SelectValue placeholder="Trigger" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Triggers</SelectItem>
            {TRIGGER_FILTER_OPTIONS.map((o) => (
              <SelectItem key={o.value} value={String(o.value)}>{o.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <select
          value={pageSize}
          onChange={(e) => { setPageSize(Number(e.target.value)); setPageIndex(0); }}
          className="border p-2 rounded-lg"
        >
          {[10, 20, 50, 100].map((s) => (
            <option key={s} value={s}>{s} per page</option>
          ))}
        </select>
      </div>

      <div className="bg-gray-200 p-4 rounded-sm">
        <div className="grid grid-cols-12 gap-4 bg-gray-700 text-gray-100 font-semibold p-3 rounded-lg mb-4">
          <span className="col-span-1">Trigger</span>
          <span className="col-span-3">Benefactor</span>
          <span className="col-span-3">Beneficiary</span>
          <span className="col-span-2">Schedule</span>
          <span className="col-span-1">Charge</span>
          <span className="col-span-1">Status</span>
          <span className="col-span-1 text-right">Actions</span>
        </div>

        {loading ? (
          <div className="space-y-2 animate-pulse">
            {[1, 2, 3].map((i) => (
              <div key={i} className="grid grid-cols-12 gap-2 bg-gray-50 p-6 rounded">
                {Array.from({ length: 12 }).map((_, j) => (
                  <div key={j} className="h-4 bg-gray-200 rounded"></div>
                ))}
              </div>
            ))}
          </div>
        ) : items.length > 0 ? (
          <div className="space-y-2">
            {items.map((item) => (
              <div key={field(item, "id", "Id")} className="bg-white rounded-lg shadow-lg border">
                <div className="grid grid-cols-12 gap-2 items-center py-4 px-6 hover:shadow-xl transition-all">
                  <span className="col-span-1">
                    <span className="px-2 py-0.5 rounded text-xs font-semibold bg-indigo-100 text-indigo-600">
                      {field(item, "triggerDescription", "TriggerDescription") || "—"}
                    </span>
                  </span>
                  <div className="col-span-3">
                    <p className="text-sm text-gray-700">{field(item, "benefactorCustomerAccountCustomerFullName", "BenefactorCustomerAccountCustomerFullName") || "—"}</p>
                    <p className="text-xs text-gray-400">{field(item, "benefactorFullAccountNumber", "BenefactorFullAccountNumber") || "—"}</p>
                  </div>
                  <div className="col-span-3">
                    <p className="text-sm text-gray-700">{field(item, "beneficiaryCustomerAccountCustomerFullName", "BeneficiaryCustomerAccountCustomerFullName") || "—"}</p>
                    <p className="text-xs text-gray-400">{field(item, "beneficiaryFullAccountNumber", "BeneficiaryFullAccountNumber") || "—"}</p>
                  </div>
                  <div className="col-span-2">
                    <p className="text-sm text-gray-700">{field(item, "scheduleFrequencyDescription", "ScheduleFrequencyDescription") || "—"}</p>
                    <p className="text-xs text-gray-400">Next: {formatDate(field(item, "scheduleExpectedRunDate", "ScheduleExpectedRunDate"))}</p>
                  </div>
                  <div className="col-span-1">
                    <p className="text-sm text-gray-700">{field(item, "chargeTypeDescription", "ChargeTypeDescription") || "—"}</p>
                    <p className="text-xs text-gray-400">{formatCharge(item)}</p>
                  </div>
                  <div className="col-span-1 flex flex-col gap-1 items-start">
                    <span className={`px-2 py-0.5 rounded text-xs font-semibold ${statusBadgeClass(field(item, "recordStatusDescription", "RecordStatusDescription"))}`}>
                      {field(item, "recordStatusDescription", "RecordStatusDescription") || "—"}
                    </span>
                    <span className={`px-2 py-0.5 rounded text-xs font-semibold ${field(item, "isLocked", "IsLocked") ? "bg-red-100 text-red-600" : "bg-green-100 text-green-600"}`}>
                      {field(item, "isLocked", "IsLocked") ? "Locked" : "Active"}
                    </span>
                  </div>
                  <div className="col-span-1 flex justify-end">
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEdit(item)}>
                      <FaEdit className="text-indigo-600" />
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-gray-500 text-center mt-4">
            <img src={NotFoundImage} alt="Not Found" className="mx-auto w-42" />
            <p className="font-medium text-gray-400">No Standing Orders Found.</p>
          </div>
        )}

        <div className="flex justify-center items-center mt-4">
          <Button
            type="button"
            size="sm"
            disabled={pageIndex === 0}
            onClick={() => setPageIndex((p) => Math.max(0, p - 1))}
            className="flex items-center gap-1 m-2"
          >
            <FaChevronLeft /> Prev
          </Button>
          <span>Page {pageIndex + 1}</span>
          <Button
            type="button"
            size="sm"
            disabled={!hasNextPage}
            onClick={() => setPageIndex((p) => p + 1)}
            className="flex items-center gap-1 m-2"
          >
            Next <FaChevronRight />
          </Button>
        </div>
      </div>

      <StandingOrderDrawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        onSuccess={fetchItems}
        standingOrder={editingOrder}
      />
    </div>
  );
}
