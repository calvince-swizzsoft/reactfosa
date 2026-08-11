import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import Swal from "sweetalert2";
import NotFoundImage from "/assets/scopefinding.png";
import { FaMoneyCheck, FaPlus, FaChevronLeft, FaChevronRight, FaPrint } from "react-icons/fa";
import { apiFetch, normalizeList } from "@/lib/api";
import { listInHouseCheques, listUnprintedInHouseCheques, printInHouseCheque } from "./inHouseChequesApi";

// api/frontoffice/inhousecheques — docs/api/frontoffice-api-spec.md §14.
const MODULE_NAVIGATION_ITEM_CODE = 25016;
const FIN_BASE = `${import.meta.env.VITE_APP_FIN_URL}`;

function FieldGroup({ label, children }) {
  return (
    <div>
      <Label className="text-sm font-semibold text-gray-700">{label}</Label>
      {children}
    </div>
  );
}

// PrintInHouseCheque only flips IsPrinted/PrintedNumber and posts the GL
// journal server-side — no server-side printing exists (confirmed against
// InHouseChequeAppService), so the client renders/prints the cheque face
// itself, same print-affordance convention as ReceiptModal.jsx.
function PrintChequeModal({ cheque, onClose, onPrinted }) {
  const [printedNumber, setPrintedNumber] = useState("");
  const [linkages, setLinkages] = useState([]);
  const [linkageId, setLinkageId] = useState("");
  const [loadingLinkages, setLoadingLinkages] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [printed, setPrinted] = useState(false);

  useEffect(() => {
    apiFetch(`${FIN_BASE}/api/values/getBankWithLinkages`)
      .then((r) => r.json())
      .then((d) => setLinkages(normalizeList(d)))
      .catch(() => setLinkages([]))
      .finally(() => setLoadingLinkages(false));
  }, []);

  if (!cheque) return null;

  const handlePrint = async () => {
    if (!printedNumber.trim() || !linkageId) {
      Swal.fire("Missing Fields", "Printed number and bank linkage are required.", "warning");
      return;
    }
    const linkage = linkages.find((l) => l.Id === linkageId);
    setSubmitting(true);
    try {
      await printInHouseCheque(cheque.Id, {
        PrintedNumber: printedNumber,
        BankLinkage: { Id: linkage.Id, ChartOfAccountId: linkage.ChartOfAccountId, BranchId: linkage.BranchId },
        ModuleNavigationItemCode: MODULE_NAVIGATION_ITEM_CODE,
      });
      setPrinted(true);
      onPrinted?.();
    } catch (err) {
      Swal.fire("Error", err.message, "error");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <div className="fixed inset-0 bg-black/40 z-40 print:hidden" onClick={onClose} />
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 print:static print:p-0">
        <div id="in-house-cheque-print-area" className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6 space-y-4 print:shadow-none print:rounded-none print:max-w-full">
          {!printed ? (
            <>
              <div className="text-center border-b pb-3">
                <h3 className="font-bold text-lg text-slate-800">Print Cheque</h3>
                <p className="text-xs text-slate-500">Payee: {cheque.Payee}</p>
                <p className="text-xs text-slate-500">Amount: {cheque.Amount?.toLocaleString?.()}</p>
              </div>
              <FieldGroup label="Printed Number">
                <Input value={printedNumber} onChange={(e) => setPrintedNumber(e.target.value)} placeholder="e.g. 000482" />
              </FieldGroup>
              <FieldGroup label={loadingLinkages ? "Loading..." : "Bank Linkage"}>
                <Select value={linkageId} onValueChange={setLinkageId} disabled={loadingLinkages}>
                  <SelectTrigger><SelectValue placeholder="Select bank linkage" /></SelectTrigger>
                  <SelectContent className="max-h-60 overflow-y-auto">
                    {linkages.map((l) => (
                      <SelectItem key={l.Id} value={l.Id}>{l.BankName} — {l.BankBranchName}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </FieldGroup>
              <div className="flex gap-2 pt-2 print:hidden">
                <Button variant="outline" className="flex-1" onClick={onClose}>Cancel</Button>
                <Button disabled={submitting} className="flex-1 bg-indigo-600 hover:bg-indigo-700" onClick={handlePrint}>
                  {submitting ? "Saving..." : "Confirm"}
                </Button>
              </div>
            </>
          ) : (
            <>
              <div className="text-center border-b pb-3">
                <h3 className="font-bold text-lg text-slate-800">Cheque #{printedNumber}</h3>
                <p className="text-xs text-slate-500">{cheque.BranchDescription}</p>
              </div>
              <div className="space-y-1.5 text-sm">
                <div className="flex justify-between"><span className="text-slate-500">Payee</span><span className="font-medium text-slate-800">{cheque.Payee}</span></div>
                <div className="flex justify-between"><span className="text-slate-500">Reference</span><span className="text-slate-700">{cheque.Reference}</span></div>
                <div className="flex justify-between items-center pt-2 border-t">
                  <span className="font-semibold text-slate-600">Amount</span>
                  <span className="text-xl font-bold text-indigo-700">{cheque.Amount?.toLocaleString?.()}</span>
                </div>
              </div>
              <div className="flex gap-2 pt-2 print:hidden">
                <Button variant="outline" className="flex-1" onClick={onClose}><FaPrint className="mr-2" />Close</Button>
                <Button className="flex-1 bg-indigo-600 hover:bg-indigo-700" onClick={() => window.print()}>
                  <FaPrint className="mr-2" />Print
                </Button>
              </div>
            </>
          )}
        </div>
      </div>
    </>
  );
}

export default function InHouseCheques() {
  const [activeTab, setActiveTab] = useState("all");
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [pageIndex, setPageIndex] = useState(0);
  const [pageSize] = useState(20);
  const [itemsCount, setItemsCount] = useState(0);
  const [branches, setBranches] = useState([]);
  const [branchId, setBranchId] = useState("");
  const [printCheque, setPrintCheque] = useState(null);

  useEffect(() => {
    apiFetch(`${FIN_BASE}/api/administration/branches`)
      .then((r) => r.json())
      .then((d) => {
        const list = normalizeList(d);
        setBranches(list);
        if (list.length > 0) setBranchId(list[0].Id);
      })
      .catch(() => setBranches([]));
  }, []);

  const fetchItems = () => {
    if (activeTab === "unprinted" && !branchId) return;
    setLoading(true);
    const fetcher = activeTab === "unprinted"
      ? () => listUnprintedInHouseCheques(branchId, { text: search, pageIndex, pageSize })
      : () => listInHouseCheques({ text: search, pageIndex, pageSize });
    fetcher()
      .then((page) => {
        setItems(page?.pageCollection || page?.PageCollection || []);
        setItemsCount(page?.itemsCount || page?.ItemsCount || 0);
      })
      .catch(() => { setItems([]); setItemsCount(0); })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchItems();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab, search, pageIndex, branchId]);

  const handleSearchChange = (e) => { setSearch(e.target.value); setPageIndex(0); };
  const changeTab = (id) => { setActiveTab(id); setPageIndex(0); };

  const hasNextPage = itemsCount ? (pageIndex + 1) * pageSize < itemsCount : items.length === pageSize;

  return (
    <div className="bg-white m-8 px-8 py-8 shadow-2xl rounded-lg relative">
      <div className="flex justify-between items-center mb-6 bg-indigo-800 px-6 py-3 rounded-2xl">
        <h2 className="text-xl font-bold text-white flex items-center gap-2">
          <FaMoneyCheck /> In-House Cheques
        </h2>
        <Link
          to="/FrontOffice/InHouseCheques/create"
          className="inline-flex items-center gap-2 rounded-md bg-indigo-600 hover:bg-indigo-700 px-4 py-2 text-sm font-medium text-white"
        >
          <FaPlus /> New Batch
        </Link>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
        <div className="flex gap-1 border-b border-gray-200">
          {["all", "unprinted"].map((id) => (
            <button
              key={id}
              onClick={() => changeTab(id)}
              className={`px-4 py-2 text-sm font-semibold rounded-t-lg transition-all ${activeTab === id ? "bg-indigo-600 text-white" : "text-gray-500 hover:bg-indigo-50"}`}
            >
              {id === "all" ? "All" : "Unprinted"}
            </button>
          ))}
        </div>
        <div className="flex gap-3">
          {activeTab === "unprinted" && (
            <Select value={branchId} onValueChange={setBranchId}>
              <SelectTrigger className="w-48"><SelectValue placeholder="Branch" /></SelectTrigger>
              <SelectContent className="max-h-60 overflow-y-auto">
                {branches.map((b) => <SelectItem key={b.Id} value={b.Id}>{b.Description}</SelectItem>)}
              </SelectContent>
            </Select>
          )}
          <Input value={search} onChange={handleSearchChange} placeholder="Search..." className="max-w-xs" />
        </div>
      </div>

      <div className="bg-gray-200 p-4 rounded-sm">
        <div className="grid grid-cols-12 gap-4 bg-gray-700 text-gray-100 font-semibold p-3 rounded-lg mb-4">
          <span className="col-span-3">Payee</span>
          <span className="col-span-2">Amount</span>
          <span className="col-span-2">Funding</span>
          <span className="col-span-3">Reference</span>
          <span className="col-span-2">Status</span>
        </div>

        {loading ? (
          <div className="space-y-2 animate-pulse">
            {[1, 2, 3].map((i) => (
              <div key={i} className="grid grid-cols-12 gap-2 bg-gray-50 p-6 rounded">
                {Array.from({ length: 12 }).map((_, j) => <div key={j} className="h-4 bg-gray-200 rounded"></div>)}
              </div>
            ))}
          </div>
        ) : items.length > 0 ? (
          <div className="space-y-2">
            {items.map((item) => (
              <div key={item.Id} className="bg-white rounded-lg shadow-lg border">
                <div className="grid grid-cols-12 gap-2 items-center py-4 px-6 hover:shadow-xl transition-all">
                  <span className="col-span-3 font-medium text-indigo-700 truncate">{item.Payee || "—"}</span>
                  <span className="col-span-2 text-sm text-gray-700">{typeof item.Amount === "number" ? item.Amount.toLocaleString() : "—"}</span>
                  <span className="col-span-2 text-sm text-gray-700">{item.FundingDescription || "—"}</span>
                  <span className="col-span-3 text-xs text-gray-500 truncate">{item.Reference || "—"}</span>
                  <div className="col-span-2 flex items-center gap-2">
                    <span className={`px-2 py-1 rounded text-xs font-semibold ${item.IsPrinted ? "bg-green-100 text-green-700" : "bg-yellow-100 text-yellow-700"}`}>
                      {item.IsPrinted ? "Printed" : "Unprinted"}
                    </span>
                    {!item.IsPrinted && (
                      <Button size="sm" variant="outline" onClick={() => setPrintCheque(item)} className="flex items-center gap-1">
                        <FaPrint className="text-indigo-600" /> Print
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-gray-500 text-center mt-4">
            <img src={NotFoundImage} alt="Not Found" className="mx-auto w-42" />
            <p className="font-medium text-gray-400">No in-house cheques found.</p>
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

      {printCheque && (
        <PrintChequeModal cheque={printCheque} onClose={() => setPrintCheque(null)} onPrinted={fetchItems} />
      )}
    </div>
  );
}
