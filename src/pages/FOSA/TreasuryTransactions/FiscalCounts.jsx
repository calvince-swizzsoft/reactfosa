import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import NotFoundImage from "/assets/scopefinding.png";
import { FaTable, FaChevronLeft, FaChevronRight } from "react-icons/fa";
import Swal from "sweetalert2";
import { apiErrorMessage, apiJson } from "@/lib/api";
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
// `Description` field, SavingsProduct, and Teller always come back
// empty/default — don't render columns for them.
//
// TransactionType/TransactionTypeDescription used to be in that same
// "always empty" bucket, but the entity gained a real backing column and
// every fiscal-count-creating flow now sets it (spec updated 2026-08-08) —
// it's a reliable read field, just still not this endpoint's filter
// (`transactionCode`, not `transactionType` — §16.1). Kept as a secondary
// display field in the detail drawer below: it's mostly redundant with
// TransactionCode (same event, same category), EXCEPT End of Day, where
// TransactionCode reads "Teller End-of-Day" but TransactionType reads
// "Teller to Treasury" — two different labels the backend genuinely uses
// for the same row, not a bug to normalize away here.

function DetailRow({ label, value }) {
  return (
    <div className="flex justify-between gap-4 py-1.5 text-sm">
      <span className="text-gray-500">{label}</span>
      <span className="text-gray-800 font-medium text-right">{value ?? "—"}</span>
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
    apiJson(`${FISCAL_COUNTS_BASE}/${id}`)
      .then((data) => setItem(data?.data ?? data?.Data ?? null))
      .catch((error) => {
        setItem(null);
        Swal.fire("Error", apiErrorMessage(error, "Unable to load the fiscal count."), "error");
      })
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
                <p className="text-sm text-gray-400">Loading...</p>
              ) : !item ? (
                <p className="text-sm text-gray-400">Fiscal count not found.</p>
              ) : (
                <div className="space-y-4">
                  <div className="rounded-lg border border-gray-200 divide-y divide-gray-100 px-3">
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
                    <DetailRow label="Transaction Type" value={item.TransactionTypeDescription || "—"} />
                    <DetailRow label="System Trace Audit Number" value={item.SystemTraceAuditNumber} />
                    <DetailRow label="Created By" value={item.CreatedBy} />
                    <DetailRow label="Created Date" value={item.CreatedDate ? new Date(item.CreatedDate).toLocaleString() : null} />
                  </div>

                  <div>
                    <Label className="text-sm font-semibold text-gray-700 mb-2 block">Denomination Breakdown</Label>
                    <div className="grid grid-cols-3 gap-2">
                      {DENOMINATIONS.map((d) => (
                        <div key={d.key} className="rounded-lg bg-gray-50 border border-gray-200 px-3 py-2">
                          <div className="text-xs font-semibold text-gray-500">{d.label}</div>
                          <div className="text-sm font-medium text-gray-800">
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

    apiJson(`${FISCAL_COUNTS_BASE}?${params.toString()}`)
      .then((data) => {
        const payload = data?.data ?? data?.Data ?? data;
        setItems(payload?.pageCollection || payload?.PageCollection || []);
        setItemsCount(payload?.itemsCount || payload?.ItemsCount || 0);
      })
      .catch((error) => {
        setItems([]);
        setItemsCount(0);
        Swal.fire("Error", apiErrorMessage(error, "Unable to load fiscal counts."), "error");
      })
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
    <div className="bg-white m-8 px-8 py-8 shadow-2xl rounded-lg relative">
      <div className="flex justify-between items-center mb-6 bg-indigo-800 px-6 py-3 rounded-2xl">
        <h2 className="text-xl font-bold text-white flex items-center gap-2">
          <FaTable /> Fiscal Counts
        </h2>
      </div>

      <div className="mb-4 flex flex-wrap gap-1.5">
        {TYPE_FILTERS.map((f) => (
          <button
            key={f.id}
            type="button"
            onClick={() => changeType(f.id)}
            className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-all ${typeFilter === f.id ? "bg-indigo-600 text-white" : "bg-gray-100 text-gray-600 hover:bg-indigo-50 hover:text-indigo-700"}`}
          >
            {f.label}
          </button>
        ))}
      </div>

      <form onSubmit={runSearch} className="flex flex-wrap justify-between items-center mb-4 gap-3">
        <input
          type="text"
          placeholder="Search by account name, description, reference, or created by..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="border p-2 rounded-lg flex-1 min-w-[220px]"
        />
        <Label className="text-xs font-semibold text-gray-500 sr-only">Start Date</Label>
        <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="border p-2 rounded-lg" />
        <Label className="text-xs font-semibold text-gray-500 sr-only">End Date</Label>
        <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className="border p-2 rounded-lg" />
        <Button type="submit" className="bg-indigo-600 hover:bg-indigo-700">Filter</Button>
      </form>

      <div className="bg-gray-200 p-4 rounded-sm">
        <div className="grid grid-cols-12 gap-4 bg-gray-700 text-gray-100 font-semibold p-3 rounded-lg mb-4">
          <span className="col-span-2">Branch</span>
          <span className="col-span-2">G/L Account</span>
          <span className="col-span-2">Description</span>
          <span className="col-span-1">Reference</span>
          <span className="col-span-2">Total Value</span>
          <span className="col-span-2">Transaction Code</span>
          <span className="col-span-1">Created</span>
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
              <button
                key={item.Id}
                type="button"
                onClick={() => setSelectedId(item.Id)}
                className="w-full text-left bg-white rounded-lg shadow-lg border"
              >
                <div className="grid grid-cols-12 gap-2 items-center py-4 px-6 hover:shadow-xl transition-all">
                  <span className="col-span-2 text-sm text-gray-700">{item.BranchDescription || "—"}</span>
                  <span className="col-span-2 text-sm text-gray-700 break-words">{item.ChartOfAccountName || "—"}</span>
                  <span className="col-span-2 text-sm text-gray-700 break-words">
                    {item.PrimaryDescription || "—"}
                    {item.SecondaryDescription && <span className="block text-xs text-gray-400">{item.SecondaryDescription}</span>}
                  </span>
                  <span className="col-span-1 text-sm text-gray-700 break-words">{item.Reference || "—"}</span>
                  <span className="col-span-2 font-medium text-indigo-700">
                    {typeof item.TotalValue === "number" ? item.TotalValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : "—"}
                  </span>
                  <span className="col-span-2">
                    <span className="px-2 py-1 rounded text-xs font-semibold bg-blue-100 text-blue-600">
                      {item.TransactionCodeDescription || "Unclassified"}
                    </span>
                  </span>
                  <span className="col-span-1 text-xs text-gray-500">{item.CreatedDate ? new Date(item.CreatedDate).toLocaleDateString() : "—"}</span>
                </div>
              </button>
            ))}
          </div>
        ) : (
          <div className="text-gray-500 text-center mt-4">
            <img src={NotFoundImage} alt="Not Found" className="mx-auto w-42" />
            <p className="font-medium text-gray-400">
              {search || startDate || endDate || typeFilter !== "all" ? "No fiscal counts match your filters." : "No fiscal counts found."}
            </p>
          </div>
        )}

        <div className="flex justify-center items-center mt-4">
          <Button type="button" size="sm" disabled={pageIndex === 0} onClick={() => setPageIndex((p) => Math.max(0, p - 1))} className="flex items-center gap-1 m-2">
            <FaChevronLeft /> Prev
          </Button>
          <span>Page {pageIndex + 1}</span>
          <Button type="button" size="sm" disabled={!hasNextPage} onClick={() => setPageIndex((p) => p + 1)} className="flex items-center gap-1 m-2">
            Next <FaChevronRight />
          </Button>
        </div>
      </div>

      <FiscalCountDetailDrawer id={selectedId} onClose={() => setSelectedId(null)} />
    </div>
  );
}
