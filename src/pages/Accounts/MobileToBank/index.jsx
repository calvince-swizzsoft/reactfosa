import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { FaMobileAlt } from "react-icons/fa";
import Swal from "sweetalert2";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import FieldHelp from "../SavingsProducts/FieldHelp";
import TransferAccountLookup from "../BatchProcedures/lib/TransferAccountLookup";
import { listPayments, getPayment, reconcilePayment, canReconcile, matchingStatus, verificationStatus } from "./api";

const localDate = (date) => `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
const amount = (value) => Number(value ?? 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
function Field({ label, children, help }) { return <div><div className="mb-1 flex items-center gap-1 text-sm font-semibold text-gray-700">{label}{help && <FieldHelp label={label}>{help}</FieldHelp>}</div>{children}</div>; }
function Status({ item }) { return <span className={`rounded px-2 py-1 text-xs font-semibold ${Number(item.Status) === 0 ? "bg-amber-100 text-amber-600" : "bg-blue-100 text-blue-600"}`}>{matchingStatus(item)}</span>; }

export default function MobileToBank() {
  const [filters, setFilters] = useState(() => ({ startDate: localDate(new Date(new Date().getFullYear(), new Date().getMonth(), 1)), endDate: localDate(new Date()), status: "", text: "" }));
  const [criteria, setCriteria] = useState(() => ({ ...filters, pageIndex: 0 }));
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [revision, setRevision] = useState(0);
  const [selected, setSelected] = useState(null);
  const pending = loading || result?.criteria !== criteria || result?.revision !== revision;
  useEffect(() => {
    const controller = new AbortController();
    setLoading(true); setError("");
    listPayments(criteria, controller.signal).then((page) => {
      if (!controller.signal.aborted) setResult({ criteria, revision, rows: page?.PageCollection ?? page?.pageCollection ?? [], count: page?.ItemsCount ?? page?.itemsCount ?? 0 });
    }).catch((err) => { if (!controller.signal.aborted) setError(err.message); })
      .finally(() => { if (!controller.signal.aborted) setLoading(false); });
    return () => controller.abort();
  }, [criteria, revision]);
  const pages = Math.max(1, Math.ceil((result?.count || 0) / 20));
  const refresh = () => setRevision((value) => value + 1);
  return <div className="relative m-8 rounded-lg bg-white px-8 py-8 shadow-2xl">
    <div className="mb-6 flex items-center justify-between rounded-2xl bg-indigo-800 px-6 py-3"><h1 className="flex items-center gap-2 text-xl font-bold text-white"><FaMobileAlt /> Mobile To Bank</h1></div>
    <form className="mb-5 flex flex-wrap items-end gap-3" onSubmit={(event) => { event.preventDefault(); setCriteria({ ...filters, text: filters.text.trim(), pageIndex: 0 }); }}>
      <Field label="From date" help="Filters the date the transaction was received by this system. Both dates are inclusive."><Input aria-label="From date" required type="date" max={filters.endDate} value={filters.startDate} onChange={(e) => setFilters({ ...filters, startDate: e.target.value })} /></Field>
      <Field label="To date"><Input aria-label="To date" required type="date" min={filters.startDate} value={filters.endDate} onChange={(e) => setFilters({ ...filters, endDate: e.target.value })} /></Field>
      <Field label="Matching status" help="Auto matched means the system identified an account. Reconciliation matched means an operator assigned the payment to an account. Unmatched payments need an account selected. Matching and verification are separate statuses."><select aria-label="Matching status" className="h-10 rounded-md border bg-white px-3 text-sm" value={filters.status} onChange={(e) => setFilters({ ...filters, status: e.target.value })}><option value="">All</option><option value="0">Unmatched</option><option value="1">Auto matched</option><option value="2">Reconciliation matched</option></select></Field>
      <div className="min-w-48 flex-1"><Field label="Search"><Input aria-label="Search payments" placeholder="Mobile, payment reference, bill reference or customer…" value={filters.text} onChange={(e) => setFilters({ ...filters, text: e.target.value })} /></Field></div>
      <Button type="submit" className="bg-indigo-600 hover:bg-indigo-700">Search</Button><Button type="button" variant="outline" onClick={refresh} disabled={pending && !error}>Refresh</Button>
    </form>
    <div className="overflow-x-auto rounded-sm bg-gray-200 p-4"><div className="min-w-[760px]">
      <div className="mb-4 grid grid-cols-12 gap-4 rounded-lg bg-gray-700 p-3 text-sm font-semibold text-gray-100"><span className="col-span-3">Payment / mobile</span><span className="col-span-2">Amount</span><span className="col-span-4">Customer account</span><span className="col-span-3">Matching status</span></div>
      {error ? <div role="alert" className="p-6 text-center text-red-600">{error} <Button onClick={refresh}>Retry</Button></div> : pending ? <div role="status" aria-label="Loading payments" className="space-y-2 animate-pulse">{[1,2,3].map((n) => <div key={n} className="grid grid-cols-12 gap-4 rounded-lg bg-gray-50 p-4">{[3,2,4,3].map((span, i) => <div key={i} style={{ gridColumn: `span ${span}` }} className="h-8 rounded bg-gray-200" />)}</div>)}</div> : result?.rows.length ? <div className="space-y-2">{result.rows.map((item) => <button key={item.Id} type="button" onClick={() => setSelected(item.Id)} className="grid w-full grid-cols-12 items-center gap-4 rounded-lg border bg-white p-3 text-left text-sm shadow-lg transition-all hover:shadow-xl focus-visible:outline-indigo-600">
        <span className="col-span-3 break-words"><span className="block font-semibold text-indigo-700">{item.TransID || "No reference"}</span><span className="text-gray-500">{item.MSISDN || "—"}</span></span><span className="col-span-2 text-gray-700">{amount(item.TransAmount)}</span><span className="col-span-4 text-gray-700">{item.CustomerAccountId ? <><span className="block">{item.CustomerAccountCustomerFullName}</span><span className="text-xs text-gray-500">{item.CustomerAccountFullAccountNumber} · {item.CustomerAccountTypeTargetProductDescription}</span></> : item.ChartOfAccountId ? item.ChartOfAccountAccountName : "No account assigned"}</span><span className="col-span-3"><Status item={item} />{Number(item.Status) === 2 && <span className="mt-1 block text-xs text-gray-500">{verificationStatus(item)}</span>}</span>
      </button>)}</div> : <div className="py-6 text-center"><img src="/assets/scopefinding.png" alt="" className="mx-auto w-32" /><p className="mt-2 text-sm text-gray-400">No payments match these filters.</p></div>}
    </div></div>
    <div className="mt-4 flex items-center justify-center gap-3"><Button disabled={pending || !!error || criteria.pageIndex === 0} onClick={() => setCriteria({ ...criteria, pageIndex: criteria.pageIndex - 1 })}>Prev</Button><span className="text-sm text-gray-600">Page {criteria.pageIndex + 1} of {pending ? "…" : pages}</span><Button disabled={pending || !!error || criteria.pageIndex + 1 >= pages} onClick={() => setCriteria({ ...criteria, pageIndex: criteria.pageIndex + 1 })}>Next</Button></div>
    {!pending && !error && <p className="mt-2 text-center text-xs text-gray-500">{result?.count || 0} payments</p>}
    {selected && <PaymentDrawer key={selected} id={selected} onClose={() => setSelected(null)} onSaved={() => { setSelected(null); refresh(); }} />}
  </div>;
}

function PaymentDrawer({ id, onClose, onSaved }) {
  const [item, setItem] = useState(null);
  const [account, setAccount] = useState(null);
  const [lookup, setLookup] = useState(false);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [retry, setRetry] = useState(0);
  useEffect(() => {
    const controller = new AbortController();
    setError(""); setItem(null); setAccount(null);
    getPayment(id, controller.signal).then((data) => { if (!controller.signal.aborted) setItem(data); }).catch((err) => { if (!controller.signal.aborted) setError(err.message); });
    return () => controller.abort();
  }, [id, retry]);
  useEffect(() => {
    const escape = (event) => { if (event.key === "Escape" && !busy && !lookup) onClose(); };
    window.addEventListener("keydown", escape);
    return () => window.removeEventListener("keydown", escape);
  }, [busy, lookup, onClose]);
  async function save() {
    if (!account || busy || !canReconcile(item)) return;
    setBusy(true); setError("");
    try { await reconcilePayment(id, account.Id); onSaved(); await Swal.fire({ icon: "success", title: "Account matched", text: "Pending verification. This action has not posted funds to the account." }); }
    catch (err) { setError(err.message); }
    finally { setBusy(false); }
  }
  return <><div className="fixed inset-0 z-40 flex justify-end"><motion.div initial={{ opacity: 0 }} animate={{ opacity: 0.4 }} className="absolute inset-0 bg-black" onClick={() => { if (!busy) onClose(); }} /><motion.section role="dialog" aria-modal="true" aria-label="Mobile payment details" initial={{ x: "100%" }} animate={{ x: 0 }} transition={{ type: "spring", stiffness: 300, damping: 30 }} className="relative m-2 flex h-[calc(100%-1rem)] w-full max-w-xl flex-col rounded-2xl bg-white shadow-2xl">
    <div className="m-2 flex shrink-0 items-center justify-between rounded-2xl bg-indigo-600 p-4 text-white"><h2 className="font-bold">Mobile Payment Details</h2><Button autoFocus variant="outline" disabled={busy} onClick={onClose}>Close</Button></div>
    <div className="flex-1 space-y-4 overflow-y-auto p-5">
      {error && <div role="alert" className="text-sm text-red-600">{error}<Button className="ml-2" variant="outline" disabled={busy} onClick={() => setRetry((n) => n + 1)}>Reload details</Button></div>}
      {!item && !error ? <p role="status">Loading payment…</p> : item && <>
        <Status item={item} /><dl className="grid grid-cols-2 gap-4 text-sm">{[["Payment reference", item.TransID], ["Amount", amount(item.TransAmount)], ["Mobile number", item.MSISDN], ["Bill reference", item.BillRefNumber], ["Business short code", item.BusinessShortCode], ["Provider time", item.TransTime], ["Received", item.CreatedDate ? new Date(item.CreatedDate).toLocaleString() : ""], ["Customer information", item.KYCInfo], ["Invoice", item.InvoiceNumber], ["Remarks", item.Remarks], ["Matched by", item.ModifiedBy], ["Verification", verificationStatus(item)], ["Verified / rejected by", item.AuditedBy], ["Audit remarks", item.AuditRemarks]].map(([label, value]) => <div key={label}><dt className="text-xs font-semibold text-gray-500">{label}</dt><dd className="mt-1 break-words text-gray-800">{value || "—"}</dd></div>)}</dl>
        <Field label="Customer account and product" help="Choose the customer, then the exact account/product that should receive this payment. Saving records a manual match pending verification; it does not credit the account.">
          <div className="rounded-lg border bg-gray-50 p-3 text-sm text-gray-700">{account ? <>{account.CustomerFullName}<br />{account.FullAccountNumber} · {account.CustomerAccountTypeTargetProductDescription}</> : item.CustomerAccountId ? <>{item.CustomerAccountCustomerFullName}<br />{item.CustomerAccountFullAccountNumber} · {item.CustomerAccountTypeTargetProductDescription}</> : item.ChartOfAccountId ? item.ChartOfAccountAccountName : "No customer account selected"}</div>
          {canReconcile(item) && <Button variant="outline" className="mt-2" disabled={busy} onClick={() => setLookup(true)}>{account ? "Change customer account" : "Find customer account"}</Button>}
        </Field>
        {Number(item.Status) === 2 && <p className="rounded-lg bg-blue-50 p-3 text-sm text-blue-700">{Number(item.RecordStatus) === 0 ? "This payment is matched and awaiting the existing backend verification workflow. It cannot be matched again here." : `This reconciliation is ${verificationStatus(item).toLowerCase()}.`}</p>}
      </>}
    </div>
    <div className="flex shrink-0 justify-end border-t p-4">{item && canReconcile(item) ? <Button className="bg-indigo-600 hover:bg-indigo-700" disabled={!account || busy} onClick={save}>{busy ? "Saving…" : "Update account match"}</Button> : <Button variant="outline" onClick={onClose}>Close</Button>}</div>
  </motion.section></div>{lookup && <TransferAccountLookup onClose={() => setLookup(false)} onSelect={(value) => { setAccount(value); setLookup(false); }} />}</>;
}