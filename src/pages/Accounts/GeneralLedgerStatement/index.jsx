import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import Swal from "sweetalert2";
import NotFoundImage from "/assets/scopefinding.png";
import { FaBookOpen, FaChevronLeft, FaChevronRight } from "react-icons/fa";
import { apiFetch } from "@/lib/api";
import { listAllChartOfAccounts } from "@/pages/Accounts/ChartOfAccounts/api";
import {
  JOURNAL_ENTRY_FILTER_OPTIONS,
  DEFAULT_JOURNAL_ENTRY_FILTER,
  SYSTEM_TRANSACTION_CODE_OPTIONS,
  StatementRow,
} from "../GeneralLedgerTransaction.jsx";
import {
  getGlAccountStatement,
  getGlAccountStatementByTransactionCode,
  browseGlPostings,
} from "./api";

const FIN_BASE = `${import.meta.env.VITE_APP_FIN_URL}`;

const MODES = [
  { id: "byAccount", label: "By G/L Account" },
  { id: "byTransactionCode", label: "By Transaction Code" },
  { id: "browse", label: "Browse All (Unscoped)" },
];

function FieldGroup({ label, children }) {
  return (
    <div>
      <Label className="text-sm font-semibold text-gray-700">{label}</Label>
      {children}
    </div>
  );
}

const todayIso = () => new Date().toISOString().slice(0, 10);
const lastMonthIso = () => {
  const d = new Date();
  d.setMonth(d.getMonth() - 1);
  return d.toISOString().slice(0, 10);
};

export default function GeneralLedgerStatement() {
  const [mode, setMode] = useState("byAccount");

  const [coaList, setCoaList] = useState([]);
  const [loadingCoa, setLoadingCoa] = useState(false);
  const [chartOfAccountId, setChartOfAccountId] = useState("");

  const [startDate, setStartDate] = useState(lastMonthIso());
  const [endDate, setEndDate] = useState(todayIso());
  const [text, setText] = useState("");
  const [journalEntryFilter, setJournalEntryFilter] = useState(DEFAULT_JOURNAL_ENTRY_FILTER);
  const [transactionCode, setTransactionCode] = useState("");
  const [reference, setReference] = useState("");
  const [pageIndex, setPageIndex] = useState(0);
  const [pageSize, setPageSize] = useState(20);

  const [loadingLines, setLoadingLines] = useState(false);
  const [lines, setLines] = useState([]);
  const [itemsCount, setItemsCount] = useState(0);

  useEffect(() => {
    setLoadingCoa(true);
    listAllChartOfAccounts()
      .then(setCoaList)
      .catch(() => setCoaList([]))
      .finally(() => setLoadingCoa(false));
  }, []);

  const canSearch = mode === "browse" || Boolean(chartOfAccountId);

  const fetchStatement = () => {
    if (!canSearch) return;
    if (mode === "byTransactionCode" && !transactionCode) {
      Swal.fire("Missing Field", "Select a transaction code first.", "warning");
      return;
    }

    setLoadingLines(true);
    const call = mode === "byAccount"
      ? getGlAccountStatement(chartOfAccountId, { startDate, endDate, pageIndex, pageSize, text, journalEntryFilter })
      : mode === "byTransactionCode"
        ? getGlAccountStatementByTransactionCode(chartOfAccountId, { startDate, endDate, pageIndex, pageSize, transactionCode, reference })
        : browseGlPostings({ startDate, endDate, pageIndex, pageSize, text, journalEntryFilter });

    call
      .then((page) => {
        // Server returns PascalCase (PageCollection/ItemsCount) — see
        // CustomerAccountStatement/index.jsx for the confirmed real shape.
        setLines(page?.PageCollection || page?.pageCollection || []);
        setItemsCount(page?.ItemsCount || page?.itemsCount || 0);
      })
      .catch((err) => {
        setLines([]);
        setItemsCount(0);
        Swal.fire("Error", err.message, "error");
      })
      .finally(() => setLoadingLines(false));
  };

  useEffect(() => {
    setLines([]);
    setItemsCount(0);
    setPageIndex(0);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode, chartOfAccountId]);

  useEffect(() => {
    if (!canSearch) return;
    fetchStatement();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pageIndex, pageSize]);

  const handleSearch = () => {
    setPageIndex(0);
    fetchStatement();
  };

  const hasNextPage = itemsCount
    ? (pageIndex + 1) * pageSize < itemsCount
    : lines.length === pageSize;

  return (
    <div className="bg-white m-8 px-8 py-8 shadow-2xl rounded-lg relative">
      <div className="flex justify-between items-center mb-6 bg-indigo-800 px-6 py-3 rounded-2xl">
        <h2 className="text-xl font-bold text-white flex items-center gap-2">
          <FaBookOpen /> General Ledger Statement
        </h2>
      </div>

      <div className="flex gap-2 mb-4">
        {MODES.map((m) => (
          <button
            key={m.id}
            type="button"
            onClick={() => setMode(m.id)}
            className={`px-4 py-2 rounded-md text-sm font-semibold transition-colors ${mode === m.id
              ? "bg-indigo-600 text-white"
              : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}
          >
            {m.label}
          </button>
        ))}
      </div>

      {mode !== "browse" && (
        <div className="mb-4 max-w-md">
          <FieldGroup label="G/L Account">
            <Select value={chartOfAccountId ? String(chartOfAccountId) : ""} onValueChange={setChartOfAccountId} disabled={loadingCoa}>
              <SelectTrigger><SelectValue placeholder={loadingCoa ? "Loading..." : "Select Chart of Account"} /></SelectTrigger>
              <SelectContent className="max-h-60 overflow-y-auto">
                {coaList.map((c) => (
                  <SelectItem key={String(c.Id)} value={String(c.Id)}>{c.AccountCode} — {c.AccountName}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </FieldGroup>
        </div>
      )}

      {canSearch && (
        <>
          <div className="flex flex-wrap items-end gap-3 mb-4">
            <FieldGroup label="Start Date">
              <Input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="w-40" />
            </FieldGroup>
            <FieldGroup label="End Date">
              <Input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className="w-40" />
            </FieldGroup>

            {mode === "byTransactionCode" ? (
              <>
                <FieldGroup label="Transaction Code">
                  <Select value={transactionCode ? String(transactionCode) : ""} onValueChange={(v) => setTransactionCode(Number(v))}>
                    <SelectTrigger className="w-64"><SelectValue placeholder="Select transaction code" /></SelectTrigger>
                    <SelectContent className="max-h-60 overflow-y-auto">
                      {SYSTEM_TRANSACTION_CODE_OPTIONS.map((o) => (
                        <SelectItem key={o.value} value={String(o.value)}>{o.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </FieldGroup>
                <FieldGroup label="Reference (optional)">
                  <Input value={reference} onChange={(e) => setReference(e.target.value)} placeholder="e.g. a receipt/reference number" className="w-52" />
                </FieldGroup>
              </>
            ) : (
              <>
                <FieldGroup label="Search Text">
                  <Input value={text} onChange={(e) => setText(e.target.value)} placeholder="e.g. a reference number" className="w-48" />
                </FieldGroup>
                <FieldGroup label="Match Against">
                  <Select value={String(journalEntryFilter)} onValueChange={(v) => setJournalEntryFilter(Number(v))}>
                    <SelectTrigger className="w-52"><SelectValue /></SelectTrigger>
                    <SelectContent className="max-h-60 overflow-y-auto">
                      {JOURNAL_ENTRY_FILTER_OPTIONS.map((o) => (
                        <SelectItem key={o.value} value={String(o.value)}>{o.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </FieldGroup>
              </>
            )}

            <select value={pageSize} onChange={(e) => { setPageSize(Number(e.target.value)); setPageIndex(0); }} className="border p-2 rounded-lg h-10">
              {[10, 20, 50, 100].map((s) => (
                <option key={s} value={s}>{s} per page</option>
              ))}
            </select>
            <Button type="button" onClick={handleSearch} className="bg-indigo-600 hover:bg-indigo-700">Search</Button>
          </div>

          <div className="bg-gray-200 p-4 rounded-sm">
            <div className="grid grid-cols-12 gap-2 bg-gray-700 text-gray-100 font-semibold p-3 rounded-lg mb-2 text-sm">
              <span className="col-span-2">Date</span>
              <span className="col-span-3">Description</span>
              <span className="col-span-2">G/L Account</span>
              <span className="col-span-1">Reference</span>
              <span className="col-span-1 text-right">Debit</span>
              <span className="col-span-1 text-right">Credit</span>
              <span className="col-span-1 text-right">Balance</span>
              <span className="col-span-1 text-right"></span>
            </div>

            {loadingLines ? (
              <div className="space-y-2 animate-pulse">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="grid grid-cols-12 gap-2 bg-gray-50 p-4 rounded">
                    {Array.from({ length: 12 }).map((_, j) => (
                      <div key={j} className="h-4 bg-gray-200 rounded"></div>
                    ))}
                  </div>
                ))}
              </div>
            ) : lines.length > 0 ? (
              <div className="bg-white rounded-lg shadow-lg border">
                {lines.map((line) => (
                  <StatementRow key={line.Id} line={line} showGlAccount />
                ))}
              </div>
            ) : (
              <div className="text-gray-500 text-center mt-4">
                <img src={NotFoundImage} alt="Not Found" className="mx-auto w-42" />
                <p className="font-medium text-gray-400">No postings found.</p>
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
        </>
      )}
    </div>
  );
}
