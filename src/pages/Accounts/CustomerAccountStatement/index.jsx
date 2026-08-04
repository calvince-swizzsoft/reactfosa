import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import Swal from "sweetalert2";
import NotFoundImage from "/assets/scopefinding.png";
import { FaFileInvoiceDollar, FaFilePdf, FaChevronLeft, FaChevronRight } from "react-icons/fa";
import { apiFetch } from "@/lib/api";
import {
  JOURNAL_ENTRY_FILTER_OPTIONS,
  DEFAULT_JOURNAL_ENTRY_FILTER,
  StatementRow,
} from "../GeneralLedgerTransaction.jsx";
import { getMiniStatement, getFullStatement, printStatement, downloadPdfBlob } from "./api";

const FIN_BASE = `${import.meta.env.VITE_APP_FIN_URL}`;

const MODES = [
  { id: "mini", label: "Mini Statement" },
  { id: "full", label: "Full Statement" },
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

export default function CustomerAccountStatement() {
  const [customers, setCustomers] = useState([]);
  const [loadingCustomers, setLoadingCustomers] = useState(false);
  const [customerId, setCustomerId] = useState("");

  const [accounts, setAccounts] = useState([]);
  const [loadingAccounts, setLoadingAccounts] = useState(false);
  const [accountId, setAccountId] = useState("");

  const [mode, setMode] = useState("mini");
  const [loadingLines, setLoadingLines] = useState(false);
  const [lines, setLines] = useState([]);
  const [itemsCount, setItemsCount] = useState(0);

  const [lastXDays, setLastXDays] = useState(90);
  const [lastXItems, setLastXItems] = useState(20);

  const [startDate, setStartDate] = useState(lastMonthIso());
  const [endDate, setEndDate] = useState(todayIso());
  const [text, setText] = useState("");
  const [journalEntryFilter, setJournalEntryFilter] = useState(DEFAULT_JOURNAL_ENTRY_FILTER);
  const [pageIndex, setPageIndex] = useState(0);
  const [pageSize, setPageSize] = useState(20);

  const [printOpen, setPrintOpen] = useState(false);
  const [printing, setPrinting] = useState(false);
  const [chargeForPrinting, setChargeForPrinting] = useState(false);
  const [includeInterestStatement, setIncludeInterestStatement] = useState(false);

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

  const handleCustomerChange = (id) => {
    setCustomerId(id);
    setAccountId("");
    setAccounts([]);
    setLines([]);
    if (!id) return;
    setLoadingAccounts(true);
    apiFetch(`${FIN_BASE}/api/accounts/customer-accounts/${id}/accounts`)
      .then((r) => r.json())
      .then((d) => setAccounts(normalizeList(d)))
      .catch(() => setAccounts([]))
      .finally(() => setLoadingAccounts(false));
  };

  const fetchStatement = () => {
    if (!accountId) return;
    setLoadingLines(true);
    const call = mode === "mini"
      ? getMiniStatement(accountId, { lastXDays, lastXItems })
      : getFullStatement(accountId, { startDate, endDate, pageIndex, pageSize, text, journalEntryFilter });

    call
      .then((page) => {
        setLines(page?.pageCollection || []);
        setItemsCount(page?.itemsCount || 0);
      })
      .catch((err) => {
        setLines([]);
        setItemsCount(0);
        Swal.fire("Error", err.message, "error");
      })
      .finally(() => setLoadingLines(false));
  };

  useEffect(() => {
    if (!accountId) return;
    fetchStatement();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [accountId, mode, pageIndex, pageSize]);

  const handleSearch = () => {
    setPageIndex(0);
    fetchStatement();
  };

  const handlePrint = async () => {
    setPrinting(true);
    try {
      const blob = await printStatement(accountId, {
        startDate,
        endDate,
        chargeForPrinting,
        includeInterestStatement,
        // No confirmed module-nav code for statement printing yet — see
        // TODO.md. Left at 0 like every other unconfirmed
        // moduleNavigationItemCode in this app until one is supplied.
        moduleNavigationItemCode: 0,
      });
      downloadPdfBlob(blob, `statement-${accountId}.pdf`);
      setPrintOpen(false);
    } catch (err) {
      Swal.fire("Error", err.message, "error");
    } finally {
      setPrinting(false);
    }
  };

  const openPrintDialog = () => {
    if (!accountId) {
      Swal.fire("Select an Account", "Choose a customer and account first.", "warning");
      return;
    }
    setChargeForPrinting(false);
    setIncludeInterestStatement(false);
    setPrintOpen(true);
  };

  const hasNextPage = itemsCount
    ? (pageIndex + 1) * pageSize < itemsCount
    : lines.length === pageSize;

  return (
    <div className="bg-white m-8 px-8 py-8 shadow-2xl rounded-lg relative">
      <div className="flex justify-between items-center mb-6 bg-indigo-800 px-6 py-3 rounded-2xl">
        <h2 className="text-xl font-bold text-white flex items-center gap-2">
          <FaFileInvoiceDollar /> Customer Account Statement
        </h2>
        <Button onClick={openPrintDialog} className="bg-indigo-600 hover:bg-indigo-700 flex items-center gap-2">
          <FaFilePdf /> Print PDF
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
        <FieldGroup label="Customer">
          <Select value={customerId ? String(customerId) : ""} onValueChange={handleCustomerChange} disabled={loadingCustomers}>
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
        <FieldGroup label="Account">
          <Select value={accountId ? String(accountId) : ""} onValueChange={setAccountId} disabled={!customerId || loadingAccounts}>
            <SelectTrigger>
              <SelectValue placeholder={loadingAccounts ? "Loading..." : !customerId ? "Select a customer first" : "Select account"} />
            </SelectTrigger>
            <SelectContent className="max-h-60 overflow-y-auto">
              {accounts.map((a) => (
                <SelectItem key={String(a.Id)} value={String(a.Id)}>
                  {a.CustomerAccountTypeTargetProductDescription || a.FullAccountNumber || a.Id}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </FieldGroup>
      </div>

      {accountId && (
        <>
          <div className="flex gap-2 mb-4">
            {MODES.map((m) => (
              <button
                key={m.id}
                type="button"
                onClick={() => { setMode(m.id); setPageIndex(0); }}
                className={`px-4 py-2 rounded-md text-sm font-semibold transition-colors ${mode === m.id
                  ? "bg-indigo-600 text-white"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                  }`}
              >
                {m.label}
              </button>
            ))}
          </div>

          {mode === "mini" ? (
            <div className="flex flex-wrap items-end gap-3 mb-4">
              <FieldGroup label="Last X Days">
                <Input type="number" min="1" value={lastXDays} onChange={(e) => setLastXDays(Number(e.target.value))} className="w-32" />
              </FieldGroup>
              <FieldGroup label="Last X Items">
                <Input type="number" min="1" value={lastXItems} onChange={(e) => setLastXItems(Number(e.target.value))} className="w-32" />
              </FieldGroup>
              <Button type="button" onClick={fetchStatement} className="bg-indigo-600 hover:bg-indigo-700">Refresh</Button>
            </div>
          ) : (
            <div className="flex flex-wrap items-end gap-3 mb-4">
              <FieldGroup label="Start Date">
                <Input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="w-40" />
              </FieldGroup>
              <FieldGroup label="End Date">
                <Input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className="w-40" />
              </FieldGroup>
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
              <select value={pageSize} onChange={(e) => { setPageSize(Number(e.target.value)); setPageIndex(0); }} className="border p-2 rounded-lg h-10">
                {[10, 20, 50, 100].map((s) => (
                  <option key={s} value={s}>{s} per page</option>
                ))}
              </select>
              <Button type="button" onClick={handleSearch} className="bg-indigo-600 hover:bg-indigo-700">Search</Button>
            </div>
          )}

          <div className="bg-gray-200 p-4 rounded-sm">
            <div className="grid grid-cols-12 gap-2 bg-gray-700 text-gray-100 font-semibold p-3 rounded-lg mb-2 text-sm">
              <span className="col-span-2">Date</span>
              <span className="col-span-4">Description</span>
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
                  <StatementRow key={line.id} line={line} />
                ))}
              </div>
            ) : (
              <div className="text-gray-500 text-center mt-4">
                <img src={NotFoundImage} alt="Not Found" className="mx-auto w-42" />
                <p className="font-medium text-gray-400">No transactions found.</p>
              </div>
            )}

            {mode === "full" && (
              <div className="flex justify-center items-center mt-4">
                <Button type="button" size="sm" disabled={pageIndex === 0} onClick={() => setPageIndex((p) => Math.max(0, p - 1))} className="flex items-center gap-1 m-2">
                  <FaChevronLeft /> Prev
                </Button>
                <span>Page {pageIndex + 1}</span>
                <Button type="button" size="sm" disabled={!hasNextPage} onClick={() => setPageIndex((p) => p + 1)} className="flex items-center gap-1 m-2">
                  Next <FaChevronRight />
                </Button>
              </div>
            )}
          </div>
        </>
      )}

      {printOpen && (
        <>
          <div className="fixed inset-0 bg-black opacity-40 z-40" onClick={() => setPrintOpen(false)} />
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 space-y-4">
              <h3 className="font-bold text-lg text-slate-800">Print Statement PDF</h3>
              <div className="grid grid-cols-2 gap-3">
                <FieldGroup label="Start Date">
                  <Input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
                </FieldGroup>
                <FieldGroup label="End Date">
                  <Input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
                </FieldGroup>
              </div>
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={includeInterestStatement} onChange={(e) => setIncludeInterestStatement(e.target.checked)} className="w-4 h-4 accent-indigo-600" />
                <span className="text-sm font-medium">Include Interest Statement (loan accounts only)</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={chargeForPrinting} onChange={(e) => setChargeForPrinting(e.target.checked)} className="w-4 h-4 accent-indigo-600" />
                <span className="text-sm font-medium">Charge the account for this printout</span>
              </label>
              {chargeForPrinting && (
                <p className="text-xs text-amber-600 bg-amber-50 border border-amber-200 rounded-md px-3 py-2">
                  This posts a real statement-printing fee to the account per the configured savings-product tariff.
                </p>
              )}
              <div className="flex justify-end gap-2 pt-2">
                <Button type="button" variant="outline" onClick={() => setPrintOpen(false)}>Cancel</Button>
                <Button type="button" disabled={printing} onClick={handlePrint} className="bg-indigo-600 hover:bg-indigo-700">
                  {printing ? "Generating..." : "Download PDF"}
                </Button>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
