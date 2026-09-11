import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import FieldLabel, { BatchFieldHelp } from "@/pages/Accounts/BatchProcedures/lib/BatchFieldLabel";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";
import CashFlowMappings from "./CashFlowMappings";
import { cashFlowQuery, cashFlowRequest, field } from "./cashFlowApi";

const money = (value) => Number(value || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const today = () => new Date().toISOString().slice(0, 10);
const sections = { Operating: "Operating activities", Investing: "Investing activities", Financing: "Financing activities", Exchange: "Exchange-rate effects", Review: "Needs review", Internal: "Internal transfers · excluded from cash flow" };
const primary = "bg-indigo-600 hover:bg-indigo-700";
const sectionHelp = {
  Operating: "Cash receipts and payments from ordinary SACCO operations, such as member deposits, loan disbursements and repayments, interest, fees and running expenses. The account mappings determine the report lines.",
  Investing: "Cash used to buy, or received from selling, long-term assets and relevant investments outside cash equivalents. For example, purchasing a motor vehicle. Member lending is classified under Operating in this setup.",
  Financing: "Cash movements relating to capital and financing, such as capital subscriptions and borrowing principal, according to the account mappings and the institution’s accounting policy.",
  Exchange: "Changes in cash balances caused by exchange-rate adjustments. These are shown separately from operating, investing and financing cash flows. Only accounts specifically mapped to Exchange contribute here.",
  Review: "Cash movements that could not be classified reliably, including unmapped counterpart accounts and mixed, unbalanced or cross-period journals. Select a report line to inspect its journals. Correct the underlying mapping or posting as appropriate, then regenerate. Review items remain incomplete even when they cancel to zero.",
  Internal: "Balanced transfers entirely between configured cash accounts, such as bank to teller cash. They move money within the cash total and are excluded from net cash flow. Transfers through separate clearing journals may need review.",
};
const totalHelp = {
  "Opening cash and cash equivalents": "The combined ledger balance of the configured cash and cash-equivalent accounts before the From date, within the selected scope.",
  "Net cash from operating, investing and financing": "Receipts minus payments across the three activity sections. A positive amount is a net inflow; a negative amount is a net outflow. Exchange effects, unclassified movements and internal transfers are excluded from this subtotal.",
  "Exchange-rate effects": sectionHelp.Exchange,
  "Unclassified movement": "Net receipts minus payments in Needs review. It is included in the reconciliation so cash is accounted for, but it has not been assigned reliably to an activity section. Zero can mean that unresolved receipts and payments offset each other.",
  "Closing cash and cash equivalents": "The combined ledger balance of the configured cash and cash-equivalent accounts through the To date, inclusive, within the selected scope.",
  "Reconciliation difference": "Closing cash − opening cash − net cash from the three activity sections − exchange-rate effects − unclassified movement. It should be zero. For example, opening cash of 100 plus net cash inflows of 50 should give closing cash of 150. A nonzero difference means the displayed movements do not explain the change in cash. Zero does not confirm that every account is mapped correctly or that Needs review is empty.",
};
const columnHelp = {
  Receipts: "Amounts increasing cash on this report line. For Needs review and Internal transfers, the amounts are shown for investigation and are not classified operating, investing or financing receipts.",
  Payments: "Amounts decreasing cash on this report line, displayed as positive amounts. They are subtracted when calculating net movement.",
  Net: "Receipts minus payments. Positive means an increase in cash; negative means a decrease. Section subtotals add the net movements of their report lines.",
};
const statusHelp = "Reconciled means the displayed movements explain the change between opening and closing cash. Complete classification additionally requires no Needs review items. Both checks apply only to the configured cash accounts; they do not establish whether all eligible cash accounts were included.";
const exportHelp = "Generate the statement, then download an Excel (.xlsx) workbook containing all report lines, section subtotals, opening and closing cash, reconciliation totals, period, scope and classification status. A Report guide sheet explains the figures. The export is a snapshot; individual drill-down journals are not included.";

function Explained({ label, help }) {
  return <span className="inline-flex items-center gap-1"><span>{label}</span><BatchFieldHelp label={label}>{help}</BatchFieldHelp></span>;
}

function Entries({ filters, row, onClose }) {
  const [page, setPage] = useState(0);
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [retry, setRetry] = useState(0);
  useEffect(() => {
    const controller = new AbortController(); setLoading(true); setError("");
    cashFlowRequest(`/entries?${cashFlowQuery(filters, { section: field(row, "section"), line: field(row, "line"), pageIndex: page, pageSize: 20 })}`, { signal: controller.signal })
      .then((data) => { if (!controller.signal.aborted) setRows(data); })
      .catch((err) => { if (!controller.signal.aborted) setError(err.message); })
      .finally(() => { if (!controller.signal.aborted) setLoading(false); });
    return () => controller.abort();
  }, [filters, row, page, retry]);
  const count = rows.length ? Number(field(rows[0], "totalCount")) : Number(field(row, "detailCount"));
  return <Dialog open onOpenChange={(open) => { if (!open) onClose(); }}><DialogContent className="max-w-4xl bg-white rounded-2xl">
    <DialogTitle>{field(row, "line")}</DialogTitle><DialogDescription>Posted journals for {filters.startDate} to {filters.endDate}. Amounts reflect this report line. Entries are re-read when paging.</DialogDescription>
    <div className="max-h-[55vh] overflow-auto bg-gray-200 p-3 rounded-sm"><div role="table" aria-label="Cash-flow journal details" className="min-w-[620px]">
      <div role="row" className="grid grid-cols-12 gap-3 bg-gray-700 text-white font-semibold text-sm p-3 rounded-lg mb-2"><span role="columnheader" className="col-span-2">Value date</span><span role="columnheader" className="col-span-6">Reference / narration</span><span role="columnheader" className="col-span-2 text-right">Receipts</span><span role="columnheader" className="col-span-2 text-right">Payments</span></div>
      {loading ? <p className="p-4 text-gray-500">Loading journals…</p> : error ? <div role="alert"><p className="text-red-600">{error}</p><Button onClick={() => setRetry((r) => r + 1)}>Retry</Button></div> : rows.length ? rows.map((item) => <div role="row" key={field(item, "journalId")} className="grid grid-cols-12 gap-3 bg-white p-3 rounded-lg border shadow-lg mb-2 text-sm text-gray-700"><span role="cell" className="col-span-2">{String(field(item, "valueDate")).slice(0, 10)}</span><span role="cell" className="col-span-6"><span className="block font-semibold">{field(item, "reference") || "No reference"}</span>{field(item, "narration")}<span className="block text-xs text-gray-500 break-all">Journal: {field(item, "journalId")}</span></span><span role="cell" className="col-span-2 text-right tabular-nums">{money(field(item, "receipts"))}</span><span role="cell" className="col-span-2 text-right tabular-nums">{money(field(item, "payments"))}</span></div>) : <p className="p-4 text-gray-500">No entries on this page. Regenerate the report if mappings or postings have changed.</p>}
    </div></div>
    <div className="flex justify-center items-center gap-3"><Button disabled={loading || page === 0} onClick={() => setPage((p) => p - 1)}>Prev</Button><span>Page {page + 1} of {Math.max(1, Math.ceil(count / 20))}</span><Button disabled={loading || (page + 1) * 20 >= count || !rows.length} onClick={() => setPage((p) => p + 1)}>Next</Button></div>
  </DialogContent></Dialog>;
}

export default function CashFlowReport({ branches }) {
  const [filters, setFilters] = useState({ startDate: `${today().slice(0, 4)}-01-01`, endDate: today(), branchId: "" });
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [setup, setSetup] = useState(false);
  const [selected, setSelected] = useState(null);
  const request = useRef(null);
  useEffect(() => () => request.current?.abort(), []);
  const clear = () => { request.current?.abort(); setLoading(false); setReport(null); setSelected(null); setError(""); };
  const change = (key, value) => { clear(); setFilters((previous) => ({ ...previous, [key]: value })); };
  const generate = async () => {
    clear();
    if (!filters.startDate || !filters.endDate || filters.startDate > filters.endDate) { setError("Select a valid start and end date."); return; }
    const controller = new AbortController(); request.current = controller; setLoading(true);
    try { const data = await cashFlowRequest(`?${cashFlowQuery(filters)}`, { signal: controller.signal }); if (!controller.signal.aborted) setReport(data); }
    catch (err) { if (!controller.signal.aborted) setError(err.message); }
    finally { if (!controller.signal.aborted) setLoading(false); }
  };
  const rows = field(report, "rows") || [];
  const totals = report ? [
    ["Opening cash and cash equivalents", field(report, "openingCash")],
    ["Net cash from operating, investing and financing", field(report, "netCashFlow")],
    ["Exchange-rate effects", field(report, "exchangeEffects")],
    ["Unclassified movement", field(report, "unclassifiedNet")],
    ["Closing cash and cash equivalents", field(report, "closingCash")],
    ["Reconciliation difference", field(report, "reconciliationDifference")],
  ] : [];
  const exportExcel = () => {
    const book = XLSX.utils.book_new();
    const scope = filters.branchId ? field(branches.find((b) => field(b, "id") === filters.branchId), "description") || filters.branchId : "Consolidated";
    const output = [["Cash Flow Statement — direct method"], ["From", filters.startDate, "To", filters.endDate], ["Scope", scope], ["Classification", field(report, "isComplete") ? "Complete for configured accounts" : "Incomplete — review required"], [], ["Section", "Report line", "Receipts", "Payments", "Net"]];
    for (const [section, title] of Object.entries(sections)) {
      const group = rows.filter((r) => field(r, "section") === section);
      if (!group.length && !["Operating", "Investing", "Financing"].includes(section)) continue;
      group.forEach((r) => output.push([title, field(r, "line"), field(r, "receipts"), field(r, "payments"), field(r, "net")]));
      output.push([title, "Subtotal", group.reduce((a, r) => a + Number(field(r, "receipts")), 0), group.reduce((a, r) => a + Number(field(r, "payments")), 0), group.reduce((a, r) => a + Number(field(r, "net")), 0)]);
    }
    output.push([], ...totals.map(([label, value]) => [label, "", "", "", value]));
    const sheet = XLSX.utils.aoa_to_sheet(output);
    sheet["!cols"] = [{ wch: 52 }, { wch: 48 }, { wch: 18 }, { wch: 18 }, { wch: 18 }];
    for (const [address, cell] of Object.entries(sheet)) {
      if (!address.startsWith("!") && cell.t === "n") cell.z = '#,##0.00;[Red](#,##0.00);0.00';
    }
    XLSX.utils.book_append_sheet(book, sheet, "Cash Flow");
    const guide = XLSX.utils.aoa_to_sheet([
      ["Cash Flow Statement — report guide"], ["Term", "Explanation"],
      ...Object.entries(sections).map(([key, title]) => [title, sectionHelp[key]]),
      ...Object.entries(totalHelp), ...Object.entries(columnHelp),
      ["Reconciliation and classification", statusHelp], ["Excel export", exportHelp],
    ]);
    guide["!cols"] = [{ wch: 52 }, { wch: 110 }];
    XLSX.utils.book_append_sheet(book, guide, "Report guide");
    saveAs(new Blob([XLSX.write(book, { bookType: "xlsx", type: "array" })], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" }), `cash-flow-${filters.startDate}-${filters.endDate}.xlsx`);
  };
  return <>
    <div className="flex flex-wrap gap-3 items-end bg-gray-100 p-4 rounded-lg mb-5">
      <div><FieldLabel label="From date" htmlFor="cash-start" help="Cash movements use journal-entry value date, falling back to entry creation date. Opening cash is the balance before this date." /><Input id="cash-start" type="date" value={filters.startDate} onChange={(e) => change("startDate", e.target.value)} className="w-44" /></div>
      <div><FieldLabel label="To date" htmlFor="cash-end" help="Includes cash movements through this entire date. Closing cash is calculated at the end of this day." /><Input id="cash-end" type="date" value={filters.endDate} onChange={(e) => change("endDate", e.target.value)} className="w-44" /></div>
      <div><FieldLabel label="Scope" htmlFor="cash-branch" help="Consolidated includes all branches. Branch figures follow the posting journal’s branch; transfers through interbranch clearing need the appropriate mapping and review." /><select id="cash-branch" value={filters.branchId} onChange={(e) => change("branchId", e.target.value)} className="h-10 max-w-64 border border-gray-300 rounded-md bg-white px-3"><option value="">Consolidated · all branches</option>{branches.map((b) => <option key={field(b, "id")} value={field(b, "id")}>{field(b, "description")}</option>)}</select></div>
      <Button onClick={generate} disabled={loading} className={primary}>{loading ? "Generating…" : "Generate"}</Button>
      <Button variant="outline" aria-expanded={setup} onClick={() => setSetup((value) => !value)}>{setup ? "Close mappings" : "Account mappings"}</Button>
      <div className="flex items-center gap-1"><Button variant="outline" disabled={!report || loading} onClick={exportExcel}>Export Excel</Button><BatchFieldHelp label="Excel export">{exportHelp}</BatchFieldHelp></div>
    </div>
    {setup && <CashFlowMappings onChanged={clear} />}
    {error && <p role="alert" className="bg-red-50 text-red-700 p-3 rounded-lg mb-4">{error}</p>}
    {loading ? <div aria-label="Loading cash flow" className="animate-pulse space-y-3">{[1, 2, 3].map((n) => <div key={n} className="h-14 bg-gray-200 rounded-lg" />)}</div> : report ? <>
      <div className={`rounded-lg p-3 mb-4 text-sm flex items-center gap-1 ${field(report, "isComplete") ? "bg-green-100 text-green-800" : "bg-amber-100 text-amber-800"}`}><span role="status">{field(report, "isComplete") ? "All detected movements are classified and reconciled for the configured cash accounts." : "Incomplete classification — review the highlighted movements and reconciliation before using this statement."}</span><BatchFieldHelp label="Reconciliation and classification">{statusHelp}</BatchFieldHelp></div>
      <div className="flex justify-between items-center gap-4 bg-gray-100 p-4 rounded-lg font-semibold mb-4"><Explained label="Opening cash and cash equivalents" help={totalHelp["Opening cash and cash equivalents"]} /><span className="tabular-nums">{money(field(report, "openingCash"))}</span></div>
      <div className="overflow-x-auto bg-gray-200 p-4 rounded-sm"><div className="min-w-[650px]" role="table" aria-label="Cash Flow Statement">
        <div role="row" className="grid grid-cols-12 gap-3 bg-gray-700 text-white font-semibold text-sm p-3 rounded-lg mb-3"><span role="columnheader" className="col-span-6">Report line · select to view journals</span>{Object.entries(columnHelp).map(([label, help]) => <span key={label} role="columnheader" className="col-span-2 text-right"><Explained label={label} help={help} /></span>)}</div>
        {Object.entries(sections).map(([section, title]) => {
          const group = rows.filter((r) => field(r, "section") === section);
          if (!group.length && !["Operating", "Investing", "Financing"].includes(section)) return null;
          return <div role="rowgroup" key={section} className="mb-4"><h3 className={`font-semibold p-2 ${section === "Review" ? "text-amber-800" : "text-gray-700"}`}><Explained label={title} help={sectionHelp[section]} /></h3>
            {group.map((row) => <div role="row" key={field(row, "line")} className={`grid grid-cols-12 gap-3 items-center rounded-lg border shadow-lg hover:shadow-xl p-3 mb-2 text-sm text-gray-700 ${section === "Review" ? "bg-amber-50" : "bg-white"}`}><span role="cell" className="col-span-6"><button className="text-indigo-700 text-left underline focus-visible:ring-2 focus-visible:ring-indigo-500 rounded" onClick={() => setSelected(row)}>{field(row, "line")}</button></span>{["receipts", "payments", "net"].map((key) => <span role="cell" key={key} className="col-span-2 text-right tabular-nums">{money(field(row, key))}</span>)}</div>)}
            <div role="row" className="grid grid-cols-12 gap-3 p-3 text-sm font-semibold text-gray-800"><span role="cell" className="col-span-6">{group.length ? "Subtotal" : "No movements"}</span>{["receipts", "payments", "net"].map((key) => <span role="cell" key={key} className="col-span-2 text-right tabular-nums">{money(group.reduce((sum, r) => sum + Number(field(r, key)), 0))}</span>)}</div>
          </div>;
        })}
      </div></div>
      <div className="mt-4 rounded-lg border divide-y">{totals.slice(1).map(([label, value]) => <div key={label} className="flex justify-between items-center gap-4 p-3 text-sm text-gray-800 font-semibold"><Explained label={label} help={totalHelp[label]} /><span className="tabular-nums">{money(value)}</span></div>)}</div>
    </> : !loading && !error && <p className="py-10 text-center text-gray-500">Configure cash accounts and report classifications, then generate the statement.</p>}
    {selected && <Entries filters={filters} row={selected} onClose={() => setSelected(null)} />}
  </>;
}
