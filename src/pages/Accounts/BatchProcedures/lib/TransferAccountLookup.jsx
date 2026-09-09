import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import CustomerLookupModal from "@/pages/Registry/Customers/Documents/CustomerLookupModal";
import { apiJson } from "@/lib/api";
import NotFoundImage from "/assets/scopefinding.png";

export default function TransferAccountLookup({ customerId, excludeAccountId, onSelect, onClose }) {
  const [customer, setCustomer] = useState(customerId ? { Id: customerId } : null);
  const selectedCustomer = useRef(false);
  const [pageIndex, setPageIndex] = useState(0);
  const [rows, setRows] = useState([]);
  const [count, setCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [retry, setRetry] = useState(0);
  useEffect(() => {
    if (!customer) return;
    let active = true;
    setLoading(true); setError("");
    apiJson(`${import.meta.env.VITE_APP_FIN_URL}/api/accounts/customer-accounts/customer/${customer.Id}?pageIndex=${pageIndex}&pageSize=20`)
      .then((body) => {
        if (!active) return;
        const page = body?.data ?? body;
        setRows(page?.PageCollection || page?.pageCollection || []);
        setCount(page?.ItemsCount ?? page?.itemsCount ?? 0);
      }).catch((err) => { if (active) setError(err.message); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [customer, pageIndex, retry]);
  if (!customer) return <CustomerLookupModal onClose={() => { if (!selectedCustomer.current) onClose(); }} onSelect={(item) => { selectedCustomer.current = true; setCustomer(item); setPageIndex(0); }} />;
  return <div className="fixed inset-0 z-50 flex items-center justify-center">
    <div className="absolute inset-0 bg-black/40" onClick={onClose} />
    <section role="dialog" aria-modal="true" aria-label="Select customer account" className="relative bg-white rounded-2xl shadow-2xl w-full max-w-xl max-h-[85vh] flex flex-col m-4">
      <div className="m-2 flex justify-between items-center bg-indigo-600 rounded-2xl p-4 text-white"><h3 className="font-bold">Select Customer Account</h3><Button variant="outline" onClick={onClose}>Close</Button></div>
      <div className="p-4 overflow-y-auto space-y-3">
        {!customerId && <Button variant="outline" onClick={() => { selectedCustomer.current = false; setCustomer(null); }}>Choose another customer</Button>}
        {error ? <p role="alert" className="text-red-600">{error} <Button onClick={() => setRetry((n) => n + 1)}>Retry</Button></p> : loading ? <div className="space-y-2 animate-pulse">{[1,2,3].map((n) => <div key={n} className="h-14 bg-gray-100 rounded-lg" />)}</div> :
          <div className="bg-gray-200 p-3 space-y-2 rounded-sm">{rows.length ? rows.map((item) => <button type="button" key={item.Id} disabled={item.Id === excludeAccountId} onClick={() => onSelect(item)} className="w-full text-left bg-white border rounded-lg shadow-lg hover:shadow-xl p-3 disabled:opacity-40">
            <p className="text-sm font-semibold text-gray-800">{item.FullAccountNumber} · {item.CustomerAccountTypeTargetProductDescription}</p>
            <p className="text-xs text-gray-500">{item.CustomerFullName} · {item.StatusDescription}{item.Id === excludeAccountId ? " · Source account" : ""}</p>
          </button>) : <div className="text-center p-4"><img src={NotFoundImage} alt="" className="mx-auto w-32" /><p className="text-gray-400">No accounts found.</p></div>}</div>}
      </div>
      <div className="shrink-0 flex justify-center items-center gap-3 p-4 border-t"><Button disabled={loading || pageIndex === 0} onClick={() => setPageIndex((n) => n - 1)}>Prev</Button><span className="text-sm">Page {pageIndex + 1} of {Math.max(1, Math.ceil(count / 20))}</span><Button disabled={loading || (pageIndex + 1) * 20 >= count} onClick={() => setPageIndex((n) => n + 1)}>Next</Button></div>
    </section>
  </div>;
}
