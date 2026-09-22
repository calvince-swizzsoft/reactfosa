import { useState, useEffect, useId, useRef } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { FaSearch, FaTimes, FaSpinner } from "react-icons/fa";
import NotFoundImage from "/assets/scopefinding.png";
import { searchCustomers, getCustomerBranchAccounts } from "./api";
import { loadCustomerBranches } from "./customerBranches";

// Values match the CustomerFilter options on the Registry customer list.
const customerFilters = [
  [2, "First name"], [3, "Last name"], [4, "Identity card number"],
  [17, "Membership number"], [0, "Serial number"], [5, "Payroll number"],
  [16, "Account number"], [18, "Personal file number"],
  [15, "Mobile number"], [13, "Email"], [1, "Personal identification number (PIN)"],
  [6, "Organisation name"], [7, "Organisation registration number"],
  [8, "Address line 1"], [9, "Address line 2"], [10, "Street"],
  [11, "Postal code"], [12, "City"], [14, "Landline"],
];

const customerName = (item) => item.FullName ||
  [item.IndividualFirstName, item.IndividualLastName].filter(Boolean).join(" ") ||
  item.NonIndividualDescription || item.Description ||
  `Customer #${item.PaddedSerialNumber || item.SerialNumber || "—"}`;

export default function CustomerLookupModal({ onSelect, onClose, title = "Select Customer", getCustomerName = customerName }) {
  const [criteria, setCriteria] = useState({ filter: 2, search: "", pageIndex: 0 });
  const [result, setResult] = useState(null);
  const [attempt, setAttempt] = useState(0);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [branchLabels, setBranchLabels] = useState({});
  const branchCache = useRef(new Map());
  const searchRef = useRef(null);
  const resultsRef = useRef(null);
  const fieldId = useId();
  const { filter, search, pageIndex } = criteria;
  const filterLabel = customerFilters.find(([value]) => value === filter)?.[1];
  // A criteria change hides old results immediately, including during debounce.
  const pending = loading || result?.criteria !== criteria || result?.attempt !== attempt;
  const items = result?.items || [];
  const totalPages = result?.totalPages || 1;

  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);
    setError("");
    const handle = setTimeout(() => {
      searchCustomers({ text: search.trim(), customerFilter: filter, pageIndex, pageSize: 20, signal: controller.signal })
        .then((page) => {
          if (controller.signal.aborted) return;
          setResult({ ...page, criteria, attempt });
          if (resultsRef.current) resultsRef.current.scrollTop = 0;
        })
        .catch(() => {
          if (controller.signal.aborted) return;
          setResult({ items: [], totalPages: 1, criteria, attempt });
          setError("Could not load customers. Try again.");
        })
        .finally(() => { if (!controller.signal.aborted) setLoading(false); });
    }, 300);
    return () => { controller.abort(); clearTimeout(handle); };
  }, [criteria, attempt, search, filter, pageIndex]);

  useEffect(() => {
    const controller = new AbortController();
    setBranchLabels({});
    if (result?.criteria !== criteria || result?.attempt !== attempt) return;
    loadCustomerBranches(result.items, getCustomerBranchAccounts, (id, label) => {
      setBranchLabels((current) => ({ ...current, [id]: label }));
    }, { signal: controller.signal, cache: branchCache.current });
    return () => controller.abort();
  }, [result, criteria, attempt]);

  return (
    <Dialog.Root open onOpenChange={(open) => { if (!open) onClose(); }}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-black/40" />
        <Dialog.Content aria-describedby={undefined} onOpenAutoFocus={(event) => { event.preventDefault(); searchRef.current?.focus(); }} className="fixed left-1/2 top-1/2 z-50 flex max-h-[90dvh] w-[calc(100vw-2rem)] max-w-3xl -translate-x-1/2 -translate-y-1/2 flex-col overflow-hidden rounded-2xl bg-white shadow-2xl">
          <div className="m-2 flex shrink-0 items-center justify-between gap-3 rounded-2xl bg-indigo-600 px-5 py-4">
            <Dialog.Title className="text-base font-bold text-white">{title}</Dialog.Title>
            <Dialog.Close asChild><button type="button" aria-label="Close customer picker" className="rounded-md p-2 text-white hover:bg-indigo-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-white"><FaTimes /></button></Dialog.Close>
          </div>
          <div className="grid shrink-0 gap-3 border-b border-gray-200 px-4 py-3 sm:grid-cols-[minmax(0,1fr)_minmax(0,2fr)]">
            <div>
              <label htmlFor={`${fieldId}-filter`} className="mb-1 block text-sm font-semibold text-gray-700">Search by</label>
              <Select value={String(filter)} onValueChange={(value) => setCriteria((current) => ({ ...current, filter: Number(value), pageIndex: 0 }))}>
                <SelectTrigger id={`${fieldId}-filter`} className="h-10 w-full"><SelectValue /></SelectTrigger>
                <SelectContent>{customerFilters.map(([value, label]) => <SelectItem key={value} value={String(value)}>{label}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div>
              <label htmlFor={`${fieldId}-search`} className="mb-1 block text-sm font-semibold text-gray-700">{filterLabel}</label>
              <div className="relative">
                <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-gray-400" />
                <Input ref={searchRef} id={`${fieldId}-search`} value={search} onChange={(event) => setCriteria((current) => ({ ...current, search: event.target.value, pageIndex: 0 }))} placeholder={`Search by ${filterLabel.toLowerCase()}…`} className="h-10 pl-8 pr-10 text-sm" />
                {search && <button type="button" aria-label="Clear search" onClick={() => { setCriteria((current) => ({ ...current, search: "", pageIndex: 0 })); searchRef.current?.focus(); }} className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-2 text-gray-500 focus-visible:outline-indigo-600"><FaTimes /></button>}
              </div>
            </div>
          </div>
          <div ref={resultsRef} aria-busy={pending} className="min-h-0 flex-1 overflow-y-auto bg-gray-200 p-4">
            {pending ? (
              <div role="status" className="space-y-2">
                <p className="flex items-center justify-center gap-2 py-2 text-sm text-gray-500"><FaSpinner className="animate-spin" />Searching customers…</p>
                {[1, 2, 3].map((row) => <div key={row} className="space-y-3 rounded-lg bg-white p-4 animate-pulse"><div className="h-4 w-1/2 rounded bg-gray-200" /><div className="h-3 w-3/4 rounded bg-gray-200" /><div className="h-3 w-2/3 rounded bg-gray-200" /></div>)}
              </div>
            ) : error ? (
              <div className="py-8 text-center"><p role="alert" className="mb-3 text-sm text-red-600">{error}</p><Button type="button" onClick={() => setAttempt((value) => value + 1)} className="bg-indigo-600 hover:bg-indigo-700">Try again</Button></div>
            ) : items.length === 0 ? (
              <div role="status" className="py-6 text-center"><img src={NotFoundImage} alt="" className="mx-auto w-32" /><p className="mt-3 text-sm text-gray-500">{search.trim() ? `No customers found for this ${filterLabel.toLowerCase()}. Check the value or choose another search field.` : "No customers found."}</p></div>
            ) : (
              <div className="space-y-2">
                {items.map((item) => {
                  const selectedName = getCustomerName(item);
                  return <button key={item.Id ?? item.id} type="button" onClick={() => { onSelect(item); onClose(); }} aria-label={`Select ${selectedName}, serial number ${item.PaddedSerialNumber || item.SerialNumber || "unavailable"}`} className="w-full rounded-lg border bg-white p-4 text-left shadow-lg transition-all hover:border-indigo-400 hover:shadow-xl focus-visible:outline focus-visible:outline-2 focus-visible:outline-indigo-600">
                    <div className="flex flex-wrap items-start justify-between gap-2">
                      <span className="break-words text-sm font-semibold text-gray-800">{selectedName}</span>
                      <span className={`rounded px-2 py-1 text-xs font-semibold ${Number(item.RecordStatus) === 2 ? "bg-green-100 text-green-600" : "bg-gray-100 text-gray-600"}`}>{item.RecordStatusDescription || (Number(item.RecordStatus) === 2 ? "Approved" : "Status unavailable")}</span>
                    </div>
                    <div className="mt-3 grid gap-x-5 gap-y-2 text-xs text-gray-700 sm:grid-cols-2">
                      <span>Serial #: <strong>{item.PaddedSerialNumber || item.SerialNumber || "—"}</strong></span>
                      <span>ID / registration #: <strong>{item.IndividualIdentityCardNumber || item.IndividualIdentificationNumber || item.NonIndividualRegistrationNumber || "—"}</strong></span>
                      <span>Payroll #: <strong>{item.IndividualPayrollNumbers || item.IndividualPayrollNumber || "—"}</strong></span>
                      <span>Mobile: <strong>{item.AddressMobileLine || "—"}</strong></span>
                      <span className="break-words">Employer: <strong>{item.StationZoneDivisionEmployerDescription || "—"}</strong></span>
                      <span className="break-words">Station: <strong>{item.StationDescription || "—"}</strong></span>
                      <span className="break-words">Account branches: <strong>{branchLabels[item.Id ?? item.id] || "Loading…"}</strong></span>
                    </div>
                  </button>;
                })}
              </div>
            )}
          </div>
          <div className="shrink-0 space-y-2 border-t border-gray-200 px-4 py-3">
            <p role="status" className="text-center text-xs text-gray-500">{pending ? "Searching…" : error ? "Results unavailable" : `${items.length} customers on this page · 20 per page`}</p>
            <div className="flex items-center justify-center gap-3">
              <Button type="button" size="sm" disabled={pending || !!error || pageIndex === 0} onClick={() => setCriteria((current) => ({ ...current, pageIndex: current.pageIndex - 1 }))}>Prev</Button>
              <span className="text-xs text-gray-600">Page {pageIndex + 1} of {pending ? "…" : totalPages}</span>
              <Button type="button" size="sm" disabled={pending || !!error || pageIndex + 1 >= totalPages} onClick={() => setCriteria((current) => ({ ...current, pageIndex: current.pageIndex + 1 }))}>Next</Button>
            </div>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
