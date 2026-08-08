import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { FaTable, FaSearch, FaChevronLeft, FaChevronRight } from "react-icons/fa";
import { apiFetch } from "@/lib/api";
import { DENOMINATIONS } from "../lib/DenominationCountFields";
import { FiscalCountTransactionCode } from "../lib/frontOfficeEnums";

const FIN_BASE = `${import.meta.env.VITE_APP_FIN_URL}`;
// FiscalCountController.cs — docs/api/frontoffice-api-spec.md §16.
// Read-only catalogue, not a CRUD screen: every FiscalCount row that
// matters is written implicitly by treasury cash movement (§5), EOD close
// (§9), or a cash transfer request (§7) — this screen's job is to let a
// user pick one of those transaction types and browse every row it ever
// produced, not to create/edit rows by hand. §16.3 (manual POST) exists
// for ad-hoc records outside that normal flow but isn't part of this
// screen's intended use.
const FISCAL_COUNTS_BASE = `${FIN_BASE}/api/frontoffice/fiscalcounts`;

// §16.1's own "select a transaction type" table — drives the type-selector
// chips below. transactionCode omitted (or 0) on the request means "all
// types", so "All" isn't a real enum value, just an absence of the param.
const TYPE_FILTERS = [
  { id: "all", label: "All", value: 0 },
  { id: "banktotreasury", label: "Bank to Treasury", value: FiscalCountTransactionCode.BankToTreasury },
  { id: "treasurytobank", label: "Treasury to Bank", value: FiscalCountTransactionCode.TreasuryToBank },
  { id: "treasurytoteller", label: "Treasury to Teller", value: FiscalCountTransactionCode.TreasuryToTeller },
  { id: "treasurytotreasury", label: "Treasury to Treasury", value: FiscalCountTransactionCode.TreasuryToTreasury },
  { id: "endofday", label: "Teller End-of-Day", value: FiscalCountTransactionCode.TellerEndOfDay },
  { id: "cashtransfer", label: "Teller Cash Transfer", value: FiscalCountTransactionCode.TellerCashTransfer },
];

// §16.4: FiscalCountDTO is shared with the write side (§5/§7/§9 build one
// to post a movement), so it carries fields the FiscalCount entity itself
// doesn't have. On a GET/list from this controller, TellerId/TellerDescription,
// TreasuryId/TreasuryDescription, DestinationBranchId, the generic
// `Description` field, SavingsProduct, Teller, and
// TransactionType/TransactionTypeDescription always come back
// empty/default — don't render columns for them. Use TransactionCode /
// TransactionCodeDescription (SystemTransactionCode — what actually
// persisted) instead of TransactionType.

function DetailRow({ label, value }) {
  return (
    <div className="flex justify-between gap-4 py-1.5 text-sm">
      <span className="text-slate-500">{label}</span>
      <span className="text-slate-800 font-medium text-right">{value ?? "—"}</span>
    </div>
  );
}

function FiscalCountDetailDrawer({ id, onClose }) {
  const [item, setItem] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    setItem(null);
    apiFetch(`${FISCAL_COUNTS_BASE}/${id}`)
      .then((r) => r.json())
      .then((data) => setItem(data?.data ?? data?.Data ?? null))
      .catch(() => setItem(null))
      .finally(() => setLoading(false));
  }, [id]);

  const totalValue = item?.TotalValue;

  return (
    <AnimatePresence>
      {id && (
        <>
          <motion.div className="fixed inset-0 bg-black z-40" initial={{ opacity: 0 }} animate={{ opacity: 0.4 }} exit={{ opacity: 0 }} onClick={onClose} />
          <motion.div
            className="fixed top-5 right-3 w-[440px] bg-white shadow-xl z-50 flex flex-col rounded-2xl p-3 max-h-[95vh] overflow-y-auto"
            initial={{ x: "100%" }} animate={{ x: 0 }} exit={{ x: "100%" }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
          >
            <div className="p-4 flex justify-between items-center bg-indigo-600 rounded-2xl m-2">
              <h2 className="font-bold text-lg text-white">Fiscal Count Detail</h2>
              <Button variant="outline" size="sm" onClick={onClose}>Close</Button>
            </div>

            <div className="p-4">
              {loading ? (
                <p className="text-sm text-slate-400">Loading...</p>
              ) : !item ? (
                <p className="text-sm text-slate-400">Fiscal count not found.</p>
              ) : (
                <div className="space-y-4">
                  <div className="rounded-lg border border-slate-200 divide-y divide-slate-100 px-3">
                    <DetailRow label="Branch" value={item.BranchDescription} />
                    <DetailRow label="Posting Period" value={item.PostingPeriodDescription} />
                    <DetailRow label="G/L Account" value={item.ChartOfAccountName} />
                    {item.ChartOfAccountCostCenterId && (
                      <DetailRow label="Cost Center" value={item.ChartOfAccountCostCenterDescription} />
                    )}
                    <DetailRow label="Primary Description" value={item.PrimaryDescription} />
                    <DetailRow label="Secondary Description" value={item.SecondaryDescription} />
                    <DetailRow label="Reference" value={item.Reference} />
                    <DetailRow label="Transaction Code" value={item.TransactionCodeDescription || "Unclassified"} />
                    <DetailRow label="System Trace Audit Number" value={item.SystemTraceAuditNumber} />
                    <DetailRow label="Created By" value={item.CreatedBy} />
                    <DetailRow label="Created Date" value={item.CreatedDate ? new Date(item.CreatedDate).toLocaleString() : null} />
                  </div>

                  <div>
                    <Label className="text-sm font-semibold text-slate-700 mb-2 block">Denomination Breakdown</Label>
                    <div className="grid grid-cols-3 gap-2">
                      {DENOMINATIONS.map((d) => (
                        <div key={d.key} className="rounded-lg bg-slate-50 border border-slate-200 px-3 py-2">
                          <div className="text-xs font-semibold text-slate-500">{d.label}</div>
                          <div className="text-sm font-medium text-slate-800">
                            {(Number(item[d.key]) || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </div>
                        </div>
                      ))}
                    </div>
                    <div className="flex justify-between items-center rounded-lg bg-indigo-50 border border-indigo-100 px-4 py-2 mt-2">
                      <span className="text-sm font-semibold text-indigo-700">Total Value</span>
                      <span className="text-lg font-bold text-indigo-700">
                        {typeof totalValue === "number" ? totalValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : "—"}
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

export default function FiscalCounts() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [pageIndex, setPageIndex] = useState(0);
  const [pageSize] = useState(20);
  const [itemsCount, setItemsCount] = useState(0);
  const [selectedId, setSelectedId] = useState(null);

  const fetchItems = () => {
    setLoading(true);
    const transactionCode = TYPE_FILTERS.find((f) => f.id === typeFilter)?.value || 0;
    const params = new URLSearchParams({ pageIndex: String(pageIndex), pageSize: String(pageSize) });
    if (search.trim()) params.set("text", search.trim());
    // Supplying either bound alone still works server-side — a lone
    // startDate means "from then through now", a lone endDate means
    // "everything up to then" (§16.1).
    if (startDate) params.set("startDate", startDate);
    if (endDate) params.set("endDate", endDate);
    if (transactionCode) params.set("transactionCode", String(transactionCode));

    apiFetch(`${FISCAL_COUNTS_BASE}?${params.toString()}`)
      .then((r) => r.json())
      .then((data) => {
        const payload = data?.data ?? data?.Data ?? data;
        setItems(payload?.pageCollection || payload?.PageCollection || []);
        setItemsCount(payload?.itemsCount || payload?.ItemsCount || 0);
      })
      .catch(() => { setItems([]); setItemsCount(0); })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchItems();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pageIndex, typeFilter]);

  const runSearch = (e) => {
    e?.preventDefault();
    setPageIndex(0);
    fetchItems();
  };

  const changeType = (id) => { setTypeFilter(id); setPageIndex(0); };

  const hasNextPage = itemsCount ? (pageIndex + 1) * pageSize < itemsCount : items.length === pageSize;

  return (
    <div className="min-h-screen bg-slate-100 p-6 md:p-10">
      <div className="mx-auto max-w-6xl rounded-2xl bg-white p-8 shadow-xl">
        <div className="mb-6">
          <h2 className="text-2xl font-semibold text-slate-800 flex items-center gap-2">
            <FaTable className="text-indigo-600" /> Fiscal Counts
          </h2>
          <p className="mt-2 text-sm text-slate-500">
            Denomination-count audit trail, written automatically by Cash Management, End of Day, and Cash Transfer postings. Pick a transaction type to filter, or click a row for the full denomination breakdown.
          </p>
        </div>

        <div className="mb-3 flex flex-wrap gap-1.5">
          {TYPE_FILTERS.map((f) => (
            <button
              key={f.id}
              type="button"
              onClick={() => changeType(f.id)}
              className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-all ${typeFilter === f.id ? "bg-indigo-600 text-white" : "bg-slate-100 text-slate-600 hover:bg-indigo-50 hover:text-indigo-700"}`}
            >
              {f.label}
            </button>
          ))}
        </div>

        <form onSubmit={runSearch} className="mb-4 flex flex-wrap items-end gap-3">
          <div className="relative flex-1 min-w-[220px]">
            <Label className="text-xs font-semibold text-slate-500 mb-1 block">Search</Label>
            <FaSearch className="pointer-events-none absolute left-3 top-[38px] -translate-y-1/2 text-xs text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Account name, description, reference, or created by..."
              className="w-full rounded-lg border border-slate-200 py-2 pl-9 pr-3 text-sm outline-none focus:border-indigo-400"
            />
          </div>
          <div>
            <Label className="text-xs font-semibold text-slate-500 mb-1 block">Start Date</Label>
            <Input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="w-40" />
          </div>
          <div>
            <Label className="text-xs font-semibold text-slate-500 mb-1 block">End Date</Label>
            <Input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className="w-40" />
          </div>
          <Button type="submit" variant="outline" className="mb-0.5">Filter</Button>
        </form>

        <div className="overflow-x-auto rounded-xl border border-slate-200">
          <table className="w-full text-left">
            <thead className="bg-slate-50">
              <tr className="divide-x divide-slate-200">
                <th className="px-4 py-2.5 text-sm font-semibold text-slate-700">Branch</th>
                <th className="px-4 py-2.5 text-sm font-semibold text-slate-700">G/L Account</th>
                <th className="px-4 py-2.5 text-sm font-semibold text-slate-700">Description</th>
                <th className="px-4 py-2.5 text-sm font-semibold text-slate-700">Reference</th>
                <th className="px-4 py-2.5 text-sm font-semibold text-slate-700">Total Value</th>
                <th className="px-4 py-2.5 text-sm font-semibold text-slate-700">Transaction Code</th>
                <th className="px-4 py-2.5 text-sm font-semibold text-slate-700">Created</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {loading ? (
                <tr>
                  <td colSpan={7} className="px-4 py-3 text-sm text-slate-500">Loading fiscal counts...</td>
                </tr>
              ) : items.length > 0 ? (
                items.map((item) => (
                  <tr key={item.Id} onClick={() => setSelectedId(item.Id)} className="cursor-pointer hover:bg-indigo-50/50">
                    <td className="px-4 py-2.5 text-sm text-slate-700">{item.BranchDescription || "—"}</td>
                    <td className="px-4 py-2.5 text-sm text-slate-700">{item.ChartOfAccountName || "—"}</td>
                    <td className="px-4 py-2.5 text-sm text-slate-700">
                      <div>{item.PrimaryDescription || "—"}</div>
                      {item.SecondaryDescription && <div className="text-xs text-slate-400">{item.SecondaryDescription}</div>}
                    </td>
                    <td className="px-4 py-2.5 text-sm text-slate-700">{item.Reference || "—"}</td>
                    <td className="px-4 py-2.5 text-sm font-medium text-indigo-700">
                      {typeof item.TotalValue === "number" ? item.TotalValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : "—"}
                    </td>
                    <td className="px-4 py-2.5 text-sm">
                      <span className="rounded px-2 py-1 text-xs font-semibold bg-blue-100 text-blue-600">
                        {item.TransactionCodeDescription || "Unclassified"}
                      </span>
                    </td>
                    <td className="px-4 py-2.5 text-xs text-slate-500">
                      <div>{item.CreatedBy || "—"}</div>
                      <div>{item.CreatedDate ? new Date(item.CreatedDate).toLocaleString() : "—"}</div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={7} className="px-4 py-3 text-sm text-slate-500">
                    {search || startDate || endDate || typeFilter !== "all" ? "No fiscal counts match your filters." : "No fiscal counts found."}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="flex justify-center items-center mt-4">
          <Button type="button" size="sm" variant="outline" disabled={pageIndex === 0} onClick={() => setPageIndex((p) => Math.max(0, p - 1))} className="flex items-center gap-1 m-2">
            <FaChevronLeft /> Prev
          </Button>
          <span className="text-sm text-slate-600">Page {pageIndex + 1}</span>
          <Button type="button" size="sm" variant="outline" disabled={!hasNextPage} onClick={() => setPageIndex((p) => p + 1)} className="flex items-center gap-1 m-2">
            Next <FaChevronRight />
          </Button>
        </div>
      </div>

      <FiscalCountDetailDrawer id={selectedId} onClose={() => setSelectedId(null)} />
    </div>
  );
}
