import { useState, useEffect, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  FaFileAlt, FaChevronLeft, FaChevronRight, FaSearch, FaChevronDown, FaTimes, FaSpinner, FaInfoCircle, FaSync,
} from "react-icons/fa";
import Swal from "sweetalert2";
import NotFoundImage from "/assets/scopefinding.png";
import { apiErrorMessage, apiJson, normalizeList } from "@/lib/api";
import { listAllUnpayReasons } from "../../Accounts/UnpayReasons/api";

// api/frontoffice/cheques + api/frontoffice/transfers/cheques —
// docs/api/frontoffice-api-spec.md §8. NavigationMenu.cs has exactly one
// real nav slot for this whole area (0x000061A8+11, Description "Cheques",
// ControllerName "Cheques", ActionName "Index") — Bank and Clear are
// sub-actions of the same controller (POST /bank, POST /clear), not
// separate nav items, same shape as the Cash/Cheque Transfer merge.
// Unified into one screen behind Catalogue/Bank/Clear tabs. Catalogue
// gets a status filter — GET / has no server-side status param
// (confirmed against ChequesController source), so this fetches the full
// list in one request (pageSize=1000, same precedent Bank/Clear already
// used) and filters/paginates client-side.
const BASE = `${import.meta.env.VITE_APP_FIN_URL}`;
const CHEQUES_NAVIGATION_CODE = 25011;

function chequeStatus(item) {
  if (item.IsCleared) return { label: "Cleared", cls: "bg-green-100 text-green-700" };
  if (item.IsBanked) return { label: "Banked", cls: "bg-blue-100 text-blue-700" };
  if (item.IsTransferred) return { label: "Transferred", cls: "bg-purple-100 text-purple-700" };
  return { label: "Pending", cls: "bg-yellow-100 text-yellow-700" };
}

function StatusBadge({ item }) {
  const { label, cls } = chequeStatus(item);
  return <span className={`px-2 py-1 rounded text-xs font-semibold ${cls}`}>{label}</span>;
}

const STATUS_FILTERS = ["All", "Pending", "Transferred", "Banked", "Cleared"];

/* ══════════════════════════ Catalogue ══════════════════════════ */

function CatalogueSkeletonRow() {
  return (
    <div className="grid grid-cols-12 gap-2 items-center bg-white px-4 py-3 rounded-lg shadow border animate-pulse">
      <div className="col-span-1"><div className="h-4 bg-gray-200 rounded w-16" /></div>
      <div className="col-span-2"><div className="h-4 bg-gray-200 rounded w-32" /></div>
      <div className="col-span-2 flex flex-col gap-1">
        <div className="h-4 bg-gray-200 rounded w-28" />
        <div className="h-3 bg-gray-100 rounded w-20" />
      </div>
      <div className="col-span-1"><div className="h-4 bg-indigo-100 rounded w-20" /></div>
      <div className="col-span-2"><div className="h-4 bg-gray-200 rounded w-24" /></div>
      <div className="col-span-2"><div className="h-4 bg-gray-200 rounded w-28" /></div>
      <div className="col-span-1"><div className="h-6 bg-gray-200 rounded-full w-16" /></div>
      <div className="col-span-1"><div className="h-4 bg-gray-100 rounded w-20" /></div>
    </div>
  );
}

function CataloguePanel() {
  const [cheques, setCheques] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [pageIndex, setPageIndex] = useState(0);
  const pageSize = 20;

  useEffect(() => {
    setLoading(true);
    apiJson(`${BASE}/api/frontoffice/cheques?pageSize=1000`)
      .then((d) => setCheques(normalizeList(d)))
      .catch((error) => {
        setCheques([]);
        Swal.fire("Error", apiErrorMessage(error, "Unable to load cheques."), "error");
      })
      .finally(() => setLoading(false));
  }, []);

  const filtered = useMemo(() => {
    let rows = cheques;
    if (statusFilter !== "All") {
      rows = rows.filter((c) => chequeStatus(c).label === statusFilter);
    }
    if (search.trim()) {
      const q = search.toLowerCase();
      rows = rows.filter((c) =>
        (c.PaddedNumber || c.Number || "").toString().toLowerCase().includes(q)
        || (c.CustomerAccountFullAccountNumber || "").toLowerCase().includes(q)
        || [c.CustomerAccountCustomerIndividualFirstName, c.CustomerAccountCustomerIndividualLastName].filter(Boolean).join(" ").toLowerCase().includes(q)
        || (c.DrawerBank || "").toLowerCase().includes(q)
      );
    }
    return rows;
  }, [cheques, statusFilter, search]);

  useEffect(() => { setPageIndex(0); }, [statusFilter, search]);

  const pageRows = filtered.slice(pageIndex * pageSize, (pageIndex + 1) * pageSize);
  const hasNextPage = (pageIndex + 1) * pageSize < filtered.length;

  return (
    <>
      <div className="flex flex-wrap justify-between items-center mb-4 gap-3">
        <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search by number, account, customer, bank..." className="max-w-xs" />
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-40"><SelectValue placeholder="Status" /></SelectTrigger>
          <SelectContent>
            {STATUS_FILTERS.map((s) => <SelectItem key={s} value={s}>{s === "All" ? "All Statuses" : s}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      <div className="bg-gray-200 p-4 rounded-sm">
        <div className="grid grid-cols-12 gap-4 bg-gray-700 text-gray-100 font-semibold p-3 rounded-lg mb-4 text-sm">
          <span className="col-span-1">Cheque #</span>
          <span className="col-span-2">Account</span>
          <span className="col-span-2">Customer</span>
          <span className="col-span-1">Amount</span>
          <span className="col-span-2">Drawer Bank</span>
          <span className="col-span-2">Write Date</span>
          <span className="col-span-1">Status</span>
          <span className="col-span-1">Teller</span>
        </div>

        {loading ? (
          <div className="space-y-2">
            {[1, 2, 3, 4, 5].map((i) => <CatalogueSkeletonRow key={i} />)}
          </div>
        ) : pageRows.length > 0 ? (
          <div className="space-y-2">
            {pageRows.map((c) => (
              <div key={c.Id} className="bg-white rounded-lg shadow-lg border">
                <div className="grid grid-cols-12 gap-2 items-center py-4 px-6 hover:shadow-xl transition-all text-sm">
                  <span className="col-span-1 font-mono text-xs text-gray-700">{c.PaddedNumber || c.Number || "—"}</span>
                  <span className="col-span-2 text-xs text-gray-500 truncate" title={c.CustomerAccountFullAccountNumber}>
                    {c.CustomerAccountFullAccountNumber || "—"}
                  </span>
                  <div className="col-span-2">
                    <p className="font-medium text-gray-800 truncate">
                      {[c.CustomerAccountCustomerIndividualFirstName, c.CustomerAccountCustomerIndividualLastName].filter(Boolean).join(" ") || c.Drawer || "—"}
                    </p>
                    <p className="text-xs text-gray-400">{c.CustomerAccountCustomerTypeDescription || ""}</p>
                  </div>
                  <span className="col-span-1 font-semibold text-indigo-700">
                    {c.Amount != null ? c.Amount.toLocaleString() : "—"}
                  </span>
                  <div className="col-span-2">
                    <p className="text-gray-700">{c.DrawerBank || "—"}</p>
                    <p className="text-xs text-gray-400 truncate" title={c.DrawerBankBranch}>{c.DrawerBankBranch || ""}</p>
                  </div>
                  <span className="col-span-2 text-xs text-gray-400">
                    {c.WriteDate && !c.WriteDate.startsWith("0001") ? new Date(c.WriteDate).toLocaleDateString() : "—"}
                  </span>
                  <span className="col-span-1"><StatusBadge item={c} /></span>
                  <span className="col-span-1 text-xs text-gray-500 truncate" title={c.TellerDescription}>
                    {c.TellerDescription || "—"}
                  </span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-gray-500 text-center mt-4">
            <img src={NotFoundImage} alt="Not Found" className="mx-auto w-42" />
            <p className="font-medium text-gray-400">No cheques match this filter.</p>
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
  );
}

/* ══════════════════════════ Bank ══════════════════════════ */

function SearchSelectModal({ title, fetchUrl, getLabel, getSublabel, onSelect, onClose, filterItem }) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");

  useEffect(() => {
    apiJson(fetchUrl)
      .then((d) => setItems(normalizeList(d).filter((item) => !filterItem || filterItem(item))))
      .catch((error) => {
        setItems([]);
        Swal.fire("Error", apiErrorMessage(error, "Unable to load cheques."), "error");
      })
      .finally(() => setLoading(false));
  }, [fetchUrl, filterItem]);

  const filtered = useMemo(() => {
    if (!query.trim()) return items;
    const q = query.toLowerCase();
    return items.filter((item) => {
      const label = getLabel(item) ?? "";
      const sub = getSublabel ? (getSublabel(item) ?? "") : "";
      return label.toLowerCase().includes(q) || sub.toLowerCase().includes(q);
    });
  }, [query, items, getLabel, getSublabel]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-2xl w-[480px] max-h-[80vh] flex flex-col z-10">
        <div className="flex justify-between items-center px-5 py-4 bg-indigo-600 rounded-t-2xl">
          <h3 className="font-bold text-white text-base">{title}</h3>
          <button onClick={onClose} className="text-white/70 hover:text-white transition-colors">
            <FaTimes />
          </button>
        </div>
        <div className="px-4 py-3 border-b border-gray-100">
          <div className="relative">
            <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-xs" />
            <Input autoFocus value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search..." className="pl-8 text-sm" />
          </div>
        </div>
        <div className="flex-1 overflow-y-auto px-2 py-2">
          {loading ? (
            <div className="flex items-center justify-center py-10 text-gray-400 gap-2">
              <FaSpinner className="animate-spin" />
              <span className="text-sm">Loading...</span>
            </div>
          ) : filtered.length === 0 ? (
            <p className="text-center text-sm text-gray-400 py-8">No results found.</p>
          ) : (
            filtered.map((item) => (
              <button
                key={item.Id}
                onClick={() => { onSelect(item); onClose(); }}
                className="w-full text-left px-4 py-2.5 rounded-xl hover:bg-indigo-50 transition-colors"
              >
                <p className="text-sm font-semibold text-gray-800">{getLabel(item)}</p>
                {getSublabel && <p className="text-xs text-gray-400 mt-0.5">{getSublabel(item)}</p>}
              </button>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

function SelectField({ label, value, placeholder, onClick }) {
  return (
    <div>
      <Label className="text-sm font-semibold text-gray-700 mb-1 block">{label}</Label>
      <button
        type="button"
        onClick={onClick}
        className="w-full flex items-center justify-between px-3 py-2 border border-gray-300 rounded-md bg-white text-sm hover:border-indigo-400 transition-colors text-left"
      >
        <span className={value ? "text-gray-800 truncate" : "text-gray-400"}>{value || placeholder}</span>
        <FaChevronDown className="text-gray-400 text-xs flex-shrink-0 ml-2" />
      </button>
    </div>
  );
}

function SelectSkeletonRow() {
  return (
    <div className="grid grid-cols-12 gap-2 items-center bg-white px-4 py-3 rounded-lg shadow border animate-pulse">
      <div className="col-span-1"><div className="h-4 w-4 bg-gray-200 rounded" /></div>
      <div className="col-span-2"><div className="h-3 bg-gray-200 rounded w-16" /></div>
      <div className="col-span-2"><div className="h-3 bg-gray-200 rounded w-28" /></div>
      <div className="col-span-2"><div className="h-4 bg-gray-200 rounded w-24" /></div>
      <div className="col-span-1"><div className="h-4 bg-indigo-100 rounded w-14" /></div>
      <div className="col-span-4 flex gap-1">
        <div className="h-5 bg-gray-200 rounded-full w-16" />
        <div className="h-5 bg-gray-200 rounded-full w-14" />
        <div className="h-5 bg-gray-200 rounded-full w-20" />
      </div>
    </div>
  );
}

const emptyLinkage = {
  Id: "", IdLabel: "",
  ChartOfAccountId: "", ChartOfAccountLabel: "",
  BranchId: "", BranchLabel: "",
};

function BankPanel() {
  const [cheques, setCheques] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState([]);
  const [linkage, setLinkage] = useState(emptyLinkage);
  const [openModal, setOpenModal] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const fetchCheques = () => {
    setLoading(true);
    apiJson(`${BASE}/api/frontoffice/cheques?pageSize=1000`)
      .then((chequeData) => {
        setCheques(normalizeList(chequeData));
        setSelected([]);
      })
      .catch((error) => {
        setCheques([]);
        Swal.fire("Error", apiErrorMessage(error, "Unable to load cheque-banking options."), "error");
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchCheques(); }, []);

  const transferredCheques = cheques.filter((c) => c.IsTransferred === true && !c.IsBanked && !c.IsCleared);
  const allSelected = transferredCheques.length > 0 && selected.length === transferredCheques.length;
  const toggleAll = () => setSelected(allSelected ? [] : transferredCheques.map((c) => c.Id));
  const toggleOne = (id) =>
    setSelected((prev) => prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]);

  const handleBankLinkageSelect = (item) => {
    setLinkage({
      Id: item.Id,
      IdLabel: `${item.BankName || ""} — ${item.BankBranchName || ""}`.trim(),
      ChartOfAccountId: item.ChartOfAccountId || "",
      ChartOfAccountLabel: item.ChartOfAccountName || item.ChartOfAccountAccountName || "",
      BranchId: item.BranchId || "",
      BranchLabel: item.BranchDescription || "",
      _raw: item,
    });
  };

  const handleSubmit = async () => {
    if (selected.length === 0) return Swal.fire("Warning", "Select at least one cheque.", "warning");
    if (!linkage.Id) return Swal.fire("Bank Account Required", "Select the bank account where the cheques will be deposited.", "warning");
    if (linkage._raw?.IsLocked) return Swal.fire("Locked Bank Account", "Select an active bank account.", "warning");
    if (!linkage.BranchId) return Swal.fire("Bank Account Incomplete", "The selected bank account has no institution branch configured.", "warning");
    if (!linkage.ChartOfAccountId) return Swal.fire("Bank Account Incomplete", "The selected bank account has no G/L account configured.", "warning");
    const bankableIds = new Set(transferredCheques.map((cheque) => cheque.Id));
    if (selected.some((id) => !bankableIds.has(id))) return Swal.fire("Refresh Required", "One or more selected cheques are no longer available for banking. Refresh and try again.", "warning");
    const confirm = await Swal.fire({
      title: `Bank ${selected.length} cheque(s)?`,
      icon: "question",
      showCancelButton: true,
      confirmButtonColor: "#4f46e5",
      confirmButtonText: "Bank",
    });
    if (!confirm.isConfirmed) return;
    setSubmitting(true);
    try {
      const data = await apiJson(`${BASE}/api/frontoffice/cheques/bank`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          selectedChequeIds: selected,
          // The API reloads this linkage and its branch/G/L details server-side.
          bankLinkageDTO: { Id: linkage.Id },
          ModuleNavigationItemCode: CHEQUES_NAVIGATION_CODE,
        }),
      });
      Swal.fire("Success", data.message || "Cheques banked successfully.", "success");
      setSelected([]);
      setLinkage(emptyLinkage);
      fetchCheques();
    } catch (err) {
      Swal.fire("Error", apiErrorMessage(err, "Unable to bank the selected cheques."), "error");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <div className="mb-4 space-y-3 rounded-xl border border-indigo-200 bg-indigo-50 p-4">
          <div className="flex items-center justify-between gap-3"><p className="text-sm font-semibold text-indigo-700">Bank deposit destination</p><Button type="button" variant="outline" size="sm" onClick={fetchCheques} disabled={loading || submitting} className="gap-2"><FaSync className={loading ? "animate-spin" : ""} /> Refresh cheques</Button></div>
          <SelectField
            label="Bank Account"
            value={linkage.IdLabel}
            placeholder="Search and select destination bank account..."
            onClick={() => setOpenModal("bankLinkage")}
          />
          {linkage.Id && (
            <div className="grid grid-cols-1 gap-3 rounded-xl border border-indigo-100 bg-white p-3 text-xs md:grid-cols-3">
              <div><p className="mb-0.5 font-semibold uppercase tracking-wide text-gray-400">Bank Branch</p><p className="font-medium text-gray-800">{linkage.BranchLabel || "Not configured"}</p></div>
              <div>
                <p className="text-gray-400 font-semibold uppercase tracking-wide mb-0.5">Chart of Account</p>
                <p className="text-gray-800 font-medium">{linkage.ChartOfAccountLabel || "—"}</p>
              </div>
              {linkage._raw && (
                <>
                  <div>
                    <p className="text-gray-400 font-semibold uppercase tracking-wide mb-0.5">Account No.</p>
                    <p className="text-gray-800 font-medium">{linkage._raw.BankAccountNumber || "—"}</p>
                  </div>
                  <div>
                    <p className="text-gray-400 font-semibold uppercase tracking-wide mb-0.5">Current G/L Balance</p>
                    <p className={`font-bold text-sm ${(linkage._raw.BankLinkageBalance ?? 0) < 0 ? "text-red-600" : "text-green-600"}`}>
                      {(linkage._raw.BankLinkageBalance ?? 0).toLocaleString()}
                    </p>
                  </div>
                </>
              )}
            </div>
          )}
          <div className="flex items-center justify-between gap-3"><p className="text-sm text-indigo-700">{selected.length ? `${selected.length} cheque(s) selected · ${transferredCheques.filter((c) => selected.includes(c.Id)).reduce((sum, c) => sum + Number(c.Amount || 0), 0).toLocaleString()} total` : "Select one or more cheques below."}</p><Button onClick={handleSubmit} disabled={submitting || !linkage.Id || selected.length === 0} className="bg-indigo-600 hover:bg-indigo-700">
            {submitting ? "Banking..." : `Bank ${selected.length} Cheque(s)`}
          </Button></div>
        </div>

      <div className="mb-4 flex items-start gap-2 rounded-lg border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-800">
        <Popover>
          <PopoverTrigger asChild>
            <button type="button" aria-label="About cheque banking" className="mt-0.5 text-blue-600 focus:outline-none focus:ring-2 focus:ring-indigo-500 rounded-full"><FaInfoCircle /></button>
          </PopoverTrigger>
          <PopoverContent className="w-80 text-sm text-gray-700">Only cheques already transferred out of the teller till can be banked. Banking moves their value from External Cheques in Hand to the selected bank account's G/L. The displayed balance is the current system G/L balance for the configured institution branch; it is not a live balance retrieved from the external bank.</PopoverContent>
        </Popover>
        <span>Only transferred, not-yet-banked cheques are listed here.</span>
      </div>

      <div className="bg-gray-200 p-4 rounded-sm">
        <div className="grid grid-cols-12 gap-4 bg-gray-700 text-gray-100 font-semibold p-3 rounded-lg mb-4 text-sm">
          <span className="col-span-1">
            <input type="checkbox" checked={allSelected} onChange={toggleAll} className="rounded cursor-pointer" />
          </span>
          <span className="col-span-2">Cheque #</span>
          <span className="col-span-2">Account</span>
          <span className="col-span-2">Customer</span>
          <span className="col-span-1">Amount</span>
          <span className="col-span-4">Status</span>
        </div>

        {loading ? (
          <div className="space-y-2">
            {[1, 2, 3, 4, 5].map((i) => <SelectSkeletonRow key={i} />)}
          </div>
        ) : transferredCheques.length > 0 ? (
          <div className="space-y-2">
            {transferredCheques.map((c) => {
              const isSelected = selected.includes(c.Id);
              return (
                <div
                  key={c.Id}
                  onClick={() => toggleOne(c.Id)}
                  className={`rounded-lg shadow-lg border cursor-pointer transition-all ${isSelected ? "bg-indigo-50 border-indigo-300" : "bg-white hover:shadow-xl"}`}
                >
                  <div className="grid grid-cols-12 gap-2 items-center py-4 px-6 text-sm">
                    <span className="col-span-1">
                      <input type="checkbox" checked={isSelected} onChange={() => toggleOne(c.Id)} onClick={(e) => e.stopPropagation()} className="rounded cursor-pointer" />
                    </span>
                    <span className="col-span-2 font-mono text-xs text-gray-700">{c.PaddedNumber || c.Number || "—"}</span>
                    <span className="col-span-2 text-xs text-gray-500 truncate" title={c.CustomerAccountFullAccountNumber}>
                      {c.CustomerAccountFullAccountNumber || "—"}
                    </span>
                    <div className="col-span-2">
                      <p className="font-medium text-gray-800 truncate text-xs">
                        {[c.CustomerAccountCustomerIndividualFirstName, c.CustomerAccountCustomerIndividualLastName].filter(Boolean).join(" ") || c.Drawer || "—"}
                      </p>
                    </div>
                    <span className="col-span-1 font-semibold text-indigo-700 text-xs">
                      {c.Amount != null ? c.Amount.toLocaleString() : "—"}
                    </span>
                    <div className="col-span-4 flex items-center gap-1 flex-wrap">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${c.IsCleared ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-400"}`}>
                        {c.IsCleared ? "Cleared" : "Not Cleared"}
                      </span>
                      <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${c.IsBanked ? "bg-blue-100 text-blue-700" : "bg-gray-100 text-gray-400"}`}>
                        {c.IsBanked ? "Banked" : "Not Banked"}
                      </span>
                      <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${c.IsTransferred ? "bg-purple-100 text-purple-700" : "bg-gray-100 text-gray-400"}`}>
                        {c.IsTransferred ? "Transferred" : "Not Transferred"}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-gray-500 text-center mt-4">
            <img src={NotFoundImage} alt="Not Found" className="mx-auto w-42" />
            <p className="font-medium text-gray-400">No transferred cheques available for banking.</p>
          </div>
        )}
      </div>

      {openModal === "bankLinkage" && (
        <SearchSelectModal
          title="Select Bank Account"
          fetchUrl={`${BASE}/api/accounts/banklinkages/all`}
          getLabel={(item) => `${item.BankName || ""} — ${item.BankBranchName || ""}`.trim() || item.Id}
          getSublabel={(item) => `Acc: ${item.BankAccountNumber || "—"}  |  Bal: ${(item.BankLinkageBalance ?? 0).toLocaleString()}  |  ${item.BranchDescription || ""}`}
          filterItem={(item) => !item.IsLocked}
          onSelect={(item) => { handleBankLinkageSelect(item); setOpenModal(null); }}
          onClose={() => setOpenModal(null)}
        />
      )}
    </>
  );
}

/* ══════════════════════════ Clear ══════════════════════════ */

const CLEARING_OPTIONS = [
  { value: 1, label: "Pay" },
  { value: 2, label: "UnPay" },
];

function ClearPanel() {
  const [cheques, setCheques] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState([]);
  const [clearingOption, setClearingOption] = useState(1);
  const [unpayReasons, setUnpayReasons] = useState([]);
  const [selectedReasonId, setSelectedReasonId] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const fetchAll = () => {
    setLoading(true);
    Promise.all([
      apiJson(`${BASE}/api/frontoffice/cheques?pageSize=1000`),
      // api/accounts/unpayreasons — the real, documented controller
      // (docs/api/unpayreason-api-spec.md), replacing the undocumented
      // /api/unpay endpoint this screen used to call.
      listAllUnpayReasons(),
    ])
      .then(([chequeData, reasonData]) => {
        setCheques(normalizeList(chequeData));
        setUnpayReasons(normalizeList(reasonData));
      })
      .catch((error) => {
        setCheques([]);
        setUnpayReasons([]);
        Swal.fire("Error", apiErrorMessage(error, "Unable to load cheque-clearing options."), "error");
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchAll(); }, []);

  const clearableCheques = cheques.filter((c) => c.IsTransferred && c.IsBanked && !c.IsCleared);
  const clearableIds = new Set(clearableCheques.map((c) => c.Id));

  const allSelected = clearableCheques.length > 0 && selected.length === clearableCheques.length;
  const toggleAll = () => setSelected(allSelected ? [] : clearableCheques.map((c) => c.Id));
  const toggleOne = (id) => {
    if (!clearableIds.has(id)) return;
    setSelected((prev) => prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]);
  };

  const handleOptionChange = (val) => {
    setClearingOption(val);
    setSelectedReasonId("");
  };

  const handleSubmit = async () => {
    if (selected.length === 0) return Swal.fire("Warning", "Select at least one cheque.", "warning");
    if (clearingOption === 2 && !selectedReasonId) {
      return Swal.fire("Warning", "Select an unpay reason.", "warning");
    }
    const label = clearingOption === 1 ? "Pay" : "UnPay";
    const confirm = await Swal.fire({
      title: `${label} ${selected.length} cheque(s)?`,
      icon: "question",
      showCancelButton: true,
      confirmButtonColor: clearingOption === 1 ? "#4f46e5" : "#dc2626",
      confirmButtonText: label,
    });
    if (!confirm.isConfirmed) return;
    setSubmitting(true);
    try {
      const reason = unpayReasons.find((r) => r.Id === selectedReasonId);
      const payload = {
        selectedChequeIds: selected,
        clearingOption,
        ModuleNavigationItemCode: CHEQUES_NAVIGATION_CODE,
        unPayReasonDTO: clearingOption === 2 && reason
          ? { Id: reason.Id, Code: reason.Code, Description: reason.Description }
          : {},
      };
      const data = await apiJson(`${BASE}/api/frontoffice/cheques/clear`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      Swal.fire("Success", data.message || `Cheques ${label.toLowerCase()}ed successfully.`, "success");
      setSelected([]);
      setSelectedReasonId("");
      fetchAll();
    } catch (err) {
      Swal.fire("Error", apiErrorMessage(err, "Unable to clear the selected cheques."), "error");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      {selected.length > 0 && (
        <div className="bg-indigo-50 border border-indigo-200 rounded-xl p-4 mb-4 flex flex-wrap items-end gap-4">
          <p className="text-sm font-semibold text-indigo-700 w-full">
            {selected.length} cheque(s) selected
          </p>
          <div className="flex items-center gap-6">
            {CLEARING_OPTIONS.map((opt) => (
              <label key={opt.value} className="flex items-center gap-2 cursor-pointer text-sm font-medium text-gray-700">
                <input
                  type="radio"
                  name="clearingOption"
                  value={opt.value}
                  checked={clearingOption === opt.value}
                  onChange={() => handleOptionChange(opt.value)}
                  className="accent-indigo-600"
                />
                {opt.label}
              </label>
            ))}
          </div>
          {clearingOption === 2 && (
            <div className="min-w-[220px]">
              <Label className="text-xs font-semibold text-gray-600 mb-1 block">Unpay Reason</Label>
              <Select value={selectedReasonId} onValueChange={setSelectedReasonId}>
                <SelectTrigger><SelectValue placeholder="Select reason" /></SelectTrigger>
                <SelectContent>
                  {unpayReasons.map((r) => <SelectItem key={r.Id} value={r.Id}>{r.Description}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          )}
          <Button
            onClick={handleSubmit}
            disabled={submitting}
            className={clearingOption === 1 ? "bg-indigo-600 hover:bg-indigo-700" : "bg-red-600 hover:bg-red-700"}
          >
            {submitting ? "Processing..." : `${clearingOption === 1 ? "Pay" : "UnPay"} ${selected.length} Cheque(s)`}
          </Button>
        </div>
      )}

      <div className="bg-gray-200 p-4 rounded-sm">
        <div className="grid grid-cols-12 gap-4 bg-gray-700 text-gray-100 font-semibold p-3 rounded-lg mb-4 text-sm">
          <span className="col-span-1">
            <input type="checkbox" checked={allSelected} onChange={toggleAll} className="rounded cursor-pointer" />
          </span>
          <span className="col-span-2">Cheque #</span>
          <span className="col-span-2">Account</span>
          <span className="col-span-3">Customer</span>
          <span className="col-span-2">Amount</span>
          <span className="col-span-2">Status</span>
        </div>

        {loading ? (
          <div className="space-y-2">
            {[1, 2, 3, 4, 5].map((i) => <SelectSkeletonRow key={i} />)}
          </div>
        ) : cheques.length > 0 ? (
          <div className="space-y-2">
            {cheques.map((c) => {
              const isSelected = selected.includes(c.Id);
              const isClearable = clearableIds.has(c.Id);
              const { label: statusLabel, cls: statusCls } = chequeStatus(c);
              return (
                <div
                  key={c.Id}
                  onClick={() => toggleOne(c.Id)}
                  title={isClearable ? undefined : "Must be transferred and banked before it can be cleared or unpaid"}
                  className={`rounded-lg shadow-lg border transition-all ${!isClearable ? "bg-gray-50 opacity-60 cursor-not-allowed" : isSelected ? "bg-indigo-50 border-indigo-300 cursor-pointer" : "bg-white hover:shadow-xl cursor-pointer"}`}
                >
                  <div className="grid grid-cols-12 gap-2 items-center py-4 px-6 text-sm">
                    <span className="col-span-1">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        disabled={!isClearable}
                        onChange={() => toggleOne(c.Id)}
                        onClick={(e) => e.stopPropagation()}
                        className="rounded cursor-pointer disabled:cursor-not-allowed"
                      />
                    </span>
                    <span className="col-span-2 font-mono text-xs text-gray-700">{c.PaddedNumber || c.Number || "—"}</span>
                    <span className="col-span-2 text-xs text-gray-500 truncate" title={c.CustomerAccountFullAccountNumber}>
                      {c.CustomerAccountFullAccountNumber || "—"}
                    </span>
                    <div className="col-span-3">
                      <p className="font-medium text-gray-800 truncate">
                        {[c.CustomerAccountCustomerIndividualFirstName, c.CustomerAccountCustomerIndividualLastName].filter(Boolean).join(" ") || c.Drawer || "—"}
                      </p>
                    </div>
                    <span className="col-span-2 font-semibold text-indigo-700">
                      {c.Amount != null ? c.Amount.toLocaleString() : "—"}
                    </span>
                    <span className="col-span-2">
                      <span className={`px-2 py-1 rounded-full text-xs font-semibold ${statusCls}`}>{statusLabel}</span>
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-gray-500 text-center mt-4">
            <img src={NotFoundImage} alt="Not Found" className="mx-auto w-42" />
            <p className="font-medium text-gray-400">No cheques available.</p>
          </div>
        )}
      </div>
    </>
  );
}

/* ══════════════════════════ Unified screen ══════════════════════════ */

const MODE_TABS = [
  { id: "catalogue", label: "Catalogue" },
  { id: "bank", label: "Bank" },
  { id: "clear", label: "Clear" },
];

export default function Cheques() {
  const [mode, setMode] = useState("catalogue");

  return (
    <div className="bg-white m-8 px-8 py-8 shadow-2xl rounded-lg relative">
      <div className="flex justify-between items-center mb-6 bg-indigo-800 px-6 py-3 rounded-2xl">
        <h2 className="text-xl font-bold text-white flex items-center gap-2">
          <FaFileAlt /> Cheques
        </h2>
      </div>

      <div className="flex gap-1 mb-4 bg-gray-100 rounded-lg p-1 w-fit">
        {MODE_TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setMode(tab.id)}
            className={`px-4 py-1.5 text-sm font-semibold rounded-md transition-all ${mode === tab.id ? "bg-white shadow text-indigo-700" : "text-gray-500 hover:text-indigo-600"}`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {mode === "catalogue" && <CataloguePanel />}
      {mode === "bank" && <BankPanel />}
      {mode === "clear" && <ClearPanel />}
    </div>
  );
}
