import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { apiFetch, normalizeList } from "@/lib/api";
import Swal from "sweetalert2";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";
import { FaBalanceScale, FaChevronLeft, FaChevronRight, FaDownload, FaSearch } from "react-icons/fa";
import NotFoundImage from "/assets/scopefinding.png";
import { getBranchFinancialStatement, getFinancialStatement } from "./api";

const REPORTS = [
  { id: "trial-balance", label: "Trial Balance" },
  { id: "income-expenditure", label: "Income & Expenditure" },
  { id: "balance-sheet", label: "Balance Sheet" },
  { id: "branch", label: "Branch Financial Statement" },
];
const todayIso = () => new Date().toISOString().slice(0, 10);
const money = (value) => Number(value || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const valueOf = (row, name) => row[name] ?? row[name[0].toUpperCase() + name.slice(1)];

function FieldGroup({ label, children }) {
  return <div><Label className="text-sm font-semibold text-gray-700">{label}</Label>{children}</div>;
}

export default function FinanceReports() {
  const [reportId, setReportId] = useState("trial-balance");
  const [endDate, setEndDate] = useState(todayIso());
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [pageIndex, setPageIndex] = useState(0);
  const [pageSize, setPageSize] = useState(20);
  const [branches, setBranches] = useState([]);
  const [branchId, setBranchId] = useState("");
  const report = REPORTS.find((item) => item.id === reportId) || REPORTS[0];
  const isBranch = reportId === "branch";

  useEffect(() => {
    apiFetch(`${import.meta.env.VITE_APP_MEMBERSHIP_URL}/api/administration/branches?pageIndex=0&pageSize=1000`)
      .then((response) => response.json()).then((payload) => setBranches(normalizeList(payload))).catch(() => setBranches([]));
  }, []);

  const loadReport = async () => {
    if (!endDate || (isBranch && !branchId)) {
      Swal.fire("Missing Field", isBranch ? "Select an end date and branch." : "Select an end date.", "warning");
      return;
    }
    setLoading(true);
    try {
      const data = isBranch ? await getBranchFinancialStatement(endDate, branchId) : await getFinancialStatement(reportId, endDate);
      setRows(Array.isArray(data?.rows) ? data.rows : Array.isArray(data?.Rows) ? data.Rows : []);
      setPageIndex(0);
    } catch (error) {
      setRows([]);
      Swal.fire("Unable to load statement", error.message, "error");
    } finally { setLoading(false); }
  };

  useEffect(() => { setRows([]); setSearch(""); setPageIndex(0); }, [reportId]);
  const filteredRows = useMemo(() => {
    const needle = search.trim().toLowerCase();
    return needle ? rows.filter((row) => Object.values(row).some((value) => String(value ?? "").toLowerCase().includes(needle))) : rows;
  }, [rows, search]);
  const pageCount = Math.max(1, Math.ceil(filteredRows.length / pageSize));
  const visibleRows = filteredRows.slice(pageIndex * pageSize, (pageIndex + 1) * pageSize);
  const totalDebit = rows.reduce((sum, row) => sum + Number(valueOf(row, "debit") || 0), 0);
  const totalCredit = rows.reduce((sum, row) => sum + Number(valueOf(row, "credit") || 0), 0);
  const totalBalance = rows.reduce((sum, row) => sum + Number(valueOf(row, "balance") || 0), 0);

  const exportExcel = () => {
    if (!rows.length) return;
    const output = isBranch
      ? rows.map((r) => ({ Category: valueOf(r, "accountTypeCode"), Code: valueOf(r, "shortCode"), Account: valueOf(r, "code"), Balance: valueOf(r, "balance") }))
      : rows.map((r) => ({ AccountCode: valueOf(r, "accountCode"), AccountName: valueOf(r, "accountName"), ParentCode: valueOf(r, "parentCode"), ParentName: valueOf(r, "parentName"), Debit: valueOf(r, "debit"), Credit: valueOf(r, "credit"), CostCenter: valueOf(r, "costCenter"), Type: valueOf(r, "typeName") }));
    const book = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(book, XLSX.utils.json_to_sheet(output), report.label.slice(0, 31));
    const buffer = XLSX.write(book, { bookType: "xlsx", type: "array" });
    saveAs(new Blob([buffer], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" }), `${reportId}-${endDate}.xlsx`);
  };

  return <div className="bg-white m-8 px-8 py-8 shadow-2xl rounded-lg relative">
    <div className="flex justify-between items-center mb-6 bg-indigo-800 px-6 py-3 rounded-2xl">
      <h2 className="text-xl font-bold text-white flex items-center gap-2"><FaBalanceScale /> Financial Statements</h2>
      <Button onClick={exportExcel} disabled={!rows.length} className="bg-indigo-600 hover:bg-indigo-700 flex items-center gap-2"><FaDownload /> Export Excel</Button>
    </div>
    <div className="flex flex-wrap gap-2 mb-5">{REPORTS.map((item) => <button key={item.id} type="button" onClick={() => setReportId(item.id)} className={`px-4 py-2 rounded-md text-sm font-semibold ${reportId === item.id ? "bg-indigo-600 text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"}`}>{item.label}</button>)}</div>
    <div className="flex flex-wrap items-end gap-4 bg-gray-100 p-4 rounded-lg mb-5">
      <FieldGroup label="As at date"><Input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className="w-44" /></FieldGroup>
      {isBranch && <FieldGroup label="Branch"><select value={branchId} onChange={(e) => setBranchId(e.target.value)} className="h-10 min-w-64 border border-gray-300 rounded-md bg-white px-3"><option value="">Select branch</option>{branches.map((b) => <option key={b.Id ?? b.id} value={b.Id ?? b.id}>{b.Description ?? b.description}</option>)}</select></FieldGroup>}
      <Button onClick={loadReport} disabled={loading} className="bg-indigo-600 hover:bg-indigo-700">{loading ? "Generating..." : "Generate"}</Button>
      <div className="relative flex-1 min-w-56"><FaSearch className="absolute left-3 top-3 text-gray-400" /><Input value={search} onChange={(e) => { setSearch(e.target.value); setPageIndex(0); }} placeholder="Search accounts, parents or cost centres" className="pl-9" /></div>
      <select value={pageSize} onChange={(e) => { setPageSize(Number(e.target.value)); setPageIndex(0); }} className="h-10 border border-gray-300 rounded-md bg-white px-3">{[20, 50, 100].map((size) => <option key={size} value={size}>{size} per page</option>)}</select>
    </div>
    {!isBranch && rows.length > 0 && <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-5">
      <div className="bg-gray-100 rounded-lg p-4"><p className="text-xs uppercase text-gray-500">Total Debit</p><p className="text-lg font-bold text-gray-800">{money(totalDebit)}</p></div>
      <div className="bg-gray-100 rounded-lg p-4"><p className="text-xs uppercase text-gray-500">Total Credit</p><p className="text-lg font-bold text-gray-800">{money(totalCredit)}</p></div>
      <div className={`rounded-lg p-4 ${Math.abs(totalDebit - totalCredit) < 0.01 ? "bg-green-100" : "bg-amber-100"}`}><p className="text-xs uppercase text-gray-500">Difference</p><p className="text-lg font-bold text-gray-800">{money(totalDebit - totalCredit)}</p></div>
    </div>}
    <div className="bg-gray-200 p-4 rounded-sm">
      <div className="grid grid-cols-12 gap-3 bg-gray-700 text-gray-100 font-semibold p-3 rounded-lg mb-4 text-sm">{isBranch ? <><span className="col-span-2">Category</span><span className="col-span-2">Short Code</span><span className="col-span-6">Account</span><span className="col-span-2 text-right">Balance</span></> : <><span className="col-span-2">Account Code</span><span className="col-span-3">Account Name</span><span className="col-span-2">Parent</span><span className="col-span-2">Cost Centre</span><span className="col-span-1">Type</span><span className="col-span-1 text-right">Debit</span><span className="col-span-1 text-right">Credit</span></>}</div>
      {loading ? <div className="space-y-2 animate-pulse">{[1, 2, 3].map((i) => <div key={i} className="grid grid-cols-12 gap-3 bg-gray-50 p-5 rounded-lg">{Array.from({ length: 12 }).map((_, j) => <div key={j} className="h-4 bg-gray-200 rounded" />)}</div>)}</div> : visibleRows.length ? <div className="space-y-2">{visibleRows.map((row, index) => <div key={`${valueOf(row, "accountCode") ?? valueOf(row, "shortCode")}-${index}`} className="grid grid-cols-12 gap-3 items-center bg-white rounded-lg shadow-lg border p-4 hover:shadow-xl transition-all text-sm text-gray-700">{isBranch ? <><span className="col-span-2">{valueOf(row, "accountTypeCode")}</span><span className="col-span-2 font-medium text-indigo-700">{valueOf(row, "shortCode")}</span><span className="col-span-6 whitespace-pre-wrap">{valueOf(row, "code")}</span><span className="col-span-2 text-right tabular-nums">{money(valueOf(row, "balance"))}</span></> : <><span className="col-span-2 font-medium text-indigo-700">{valueOf(row, "accountCode")}</span><span className="col-span-3">{valueOf(row, "accountName")}</span><span className="col-span-2 text-gray-500">{valueOf(row, "parentCode")} {valueOf(row, "parentName")}</span><span className="col-span-2">{valueOf(row, "costCenter")}</span><span className="col-span-1">{valueOf(row, "typeName")}</span><span className="col-span-1 text-right tabular-nums">{money(valueOf(row, "debit"))}</span><span className="col-span-1 text-right tabular-nums">{money(valueOf(row, "credit"))}</span></>}</div>)}</div> : <div className="text-center py-8"><img src={NotFoundImage} alt="No records" className="mx-auto w-32" /><p className="text-gray-400 font-medium">Generate a statement to view financial balances.</p></div>}
      {rows.length > 0 && <><p className="text-center text-sm text-gray-500 mt-4">Showing {visibleRows.length} of {filteredRows.length} matching rows{isBranch ? ` · Total balance ${money(totalBalance)}` : ""}</p><div className="flex justify-center items-center mt-2"><Button size="sm" disabled={pageIndex === 0} onClick={() => setPageIndex((p) => p - 1)} className="m-2 flex gap-1"><FaChevronLeft /> Prev</Button><span>Page {pageIndex + 1} of {pageCount}</span><Button size="sm" disabled={pageIndex + 1 >= pageCount} onClick={() => setPageIndex((p) => p + 1)} className="m-2 flex gap-1">Next <FaChevronRight /></Button></div></>}
    </div>
  </div>;
}
