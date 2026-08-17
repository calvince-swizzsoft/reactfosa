import { useCallback, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { apiFetch } from "@/lib/api";
import Swal from "sweetalert2";
import { FaFolderOpen, FaPaperPlane, FaInbox, FaUndo } from "react-icons/fa";
import EntryPickerModal from "../../Accounts/BatchProcedures/lib/EntryPickerModal";
import CustomerPickerModal from "../../Loaning/LoanCases/lib/CustomerPickerModal";

const BASE = `${import.meta.env.VITE_APP_FIN_URL}`;
const API = `${BASE}/api/registry/fileregisters`;

async function request(url, options) {
  const response = await apiFetch(url, options);
  const body = await response.json().catch(() => ({}));
  if (!response.ok || body.success === false) throw new Error(body.message || `Request failed (${response.status})`);
  return body.data ?? body;
}

function Lookup({ label, value, onClick }) {
  return <div><Label className="font-semibold text-gray-700">{label}</Label><button type="button" onClick={onClick} className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-left text-sm text-gray-700">{value || `Select ${label.toLowerCase()}...`}</button></div>;
}

export default function FileTracking() {
  const [mode, setMode] = useState("catalogue");
  const [items, setItems] = useState([]);
  const [selected, setSelected] = useState([]);
  const [text, setText] = useState("");
  const [pageIndex, setPageIndex] = useState(0);
  const [itemsCount, setItemsCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [dispatch, setDispatch] = useState({ SourceDepartmentId: "", SourceLabel: "", DestinationDepartmentId: "", DestinationLabel: "", Carrier: "", Remarks: "" });
  const [departmentPicker, setDepartmentPicker] = useState(null);
  const [customerPicker, setCustomerPicker] = useState(false);
  const [dispatchCustomers, setDispatchCustomers] = useState([]);
  const pageSize = 20;

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const page = await request(`${API}?${new URLSearchParams({ text, customerFilter: "0", pageIndex: String(pageIndex), pageSize: String(pageSize) })}`);
      setItems(page?.PageCollection || page?.pageCollection || []);
      setItemsCount(page?.ItemsCount || page?.itemsCount || 0);
      setSelected([]);
    } catch (error) { setItems([]); Swal.fire("Error", error.message, "error"); }
    finally { setLoading(false); }
  }, [text, pageIndex]);

  useEffect(() => { load(); }, [load]);
  const toggle = (id) => setSelected((old) => old.includes(id) ? old.filter((value) => value !== id) : [...old, id]);
  const selectedRows = items.filter((item) => selected.includes(item.Id));

  const changeStatus = async (action) => {
    if (!selected.length) return Swal.fire("Select files", "Select at least one file first.", "warning");
    try {
      await request(`${API}/${action}`, { method: "POST", body: JSON.stringify({ FileRegisterIds: selected }) });
      await Swal.fire("Success", `Selected files were ${action === "receive" ? "received" : "recalled"}.`, "success");
      load();
    } catch (error) { Swal.fire("Error", error.message, "error"); }
  };

  const submitDispatch = async () => {
    const customerIds = [...new Set([...selectedRows.map((item) => item.CustomerId), ...dispatchCustomers.map((item) => item.Id)])];
    if (!customerIds.length || !dispatch.SourceDepartmentId || !dispatch.DestinationDepartmentId || !dispatch.Carrier.trim()) return Swal.fire("Missing fields", "Select or add customers, source and destination departments, and enter the carrier.", "warning");
    try {
      await request(`${API}/dispatch`, { method: "POST", body: JSON.stringify({ ...dispatch, CustomerIds: customerIds }) });
      await Swal.fire("Success", "Selected files were dispatched.", "success");
      load();
    } catch (error) { Swal.fire("Error", error.message, "error"); }
  };

  const pageCount = Math.max(1, Math.ceil(itemsCount / pageSize));
  return <div className="bg-white m-8 px-8 py-8 shadow-2xl rounded-lg relative">
    <div className="flex justify-between items-center mb-6 bg-indigo-800 px-6 py-3 rounded-2xl"><h2 className="text-xl font-bold text-white flex items-center gap-2"><FaFolderOpen /> File Tracking</h2></div>
    <div className="flex gap-2 mb-4">{[["catalogue", "Catalogue", FaFolderOpen], ["dispatch", "Dispatch", FaPaperPlane], ["receive", "Receive", FaInbox], ["recall", "Recall", FaUndo]].map(([key, label, Icon]) => <Button key={key} onClick={() => setMode(key)} className={mode === key ? "bg-indigo-600 hover:bg-indigo-700" : "bg-gray-500 hover:bg-gray-600"}><Icon className="mr-2" />{label}</Button>)}</div>
    <Input className="mb-4" value={text} onChange={(event) => { setText(event.target.value); setPageIndex(0); }} placeholder="Search name, member number, ID or reference..." />
    {mode === "dispatch" && <div className="grid grid-cols-1 md:grid-cols-2 gap-3 rounded-lg border bg-gray-50 p-4 mb-4">
      <Lookup label="Source department" value={dispatch.SourceLabel} onClick={() => setDepartmentPicker("source")} /><Lookup label="Destination department" value={dispatch.DestinationLabel} onClick={() => setDepartmentPicker("destination")} />
      <div><Label className="font-semibold text-gray-700">Carrier</Label><Input value={dispatch.Carrier} onChange={(e) => setDispatch((old) => ({ ...old, Carrier: e.target.value }))} /></div><div><Label className="font-semibold text-gray-700">Remarks</Label><Input value={dispatch.Remarks} onChange={(e) => setDispatch((old) => ({ ...old, Remarks: e.target.value }))} /></div>
      <div className="md:col-span-2"><Button type="button" onClick={() => setCustomerPicker(true)}>Add customer without an existing file register</Button>{dispatchCustomers.length > 0 && <p className="mt-2 text-sm text-gray-600">Added: {dispatchCustomers.map((item) => item.FullName).join(", ")}</p>}</div>
    </div>}
    <div className="bg-gray-200 p-4 rounded-sm"><div className="grid grid-cols-12 gap-3 bg-gray-700 text-gray-100 font-semibold p-3 rounded-lg mb-4 text-sm"><span className="col-span-1">Select</span><span className="col-span-2">Member No.</span><span className="col-span-4">Customer</span><span className="col-span-2">Status</span><span className="col-span-3">Created</span></div>
      {loading ? <div className="space-y-2 animate-pulse">{[1,2,3].map((i) => <div key={i} className="h-12 bg-gray-100 rounded-lg" />)}</div> : <div className="space-y-2">{items.map((item) => <label key={item.Id} className="grid grid-cols-12 gap-3 items-center bg-white rounded-lg shadow-lg border hover:shadow-xl transition-all p-3 text-sm cursor-pointer"><span className="col-span-1"><input type="checkbox" className="w-4 h-4 accent-indigo-600" checked={selected.includes(item.Id)} onChange={() => toggle(item.Id)} /></span><span className="col-span-2 font-medium text-indigo-700">{item.PaddedCustomerSerialNumber}</span><span className="col-span-4 text-gray-700">{item.CustomerFullName}</span><span className="col-span-2"><span className={`px-2 py-1 rounded text-xs font-semibold ${item.StatusDescription === "Received" ? "bg-green-100 text-green-600" : "bg-amber-100 text-amber-600"}`}>{item.StatusDescription}</span></span><span className="col-span-3 text-gray-500">{item.CreatedDate ? new Date(item.CreatedDate).toLocaleString() : "—"}</span></label>)}</div>}
    </div>
    <div className="mt-4 flex flex-col items-center gap-3">{mode === "dispatch" && <Button onClick={submitDispatch} className="bg-indigo-600 hover:bg-indigo-700">Dispatch selected</Button>}{mode === "receive" && <Button onClick={() => changeStatus("receive")} className="bg-indigo-600 hover:bg-indigo-700">Receive selected</Button>}{mode === "recall" && <Button onClick={() => changeStatus("recall")} className="bg-indigo-600 hover:bg-indigo-700">Recall selected</Button>}<div className="flex items-center gap-2"><Button disabled={pageIndex === 0} onClick={() => setPageIndex((value) => value - 1)}>Prev</Button><span className="text-sm text-gray-600">Page {pageIndex + 1} of {pageCount}</span><Button disabled={pageIndex + 1 >= pageCount} onClick={() => setPageIndex((value) => value + 1)}>Next</Button></div></div>
    {departmentPicker && <EntryPickerModal title={`Select ${departmentPicker} department`} fetchUrl={`${BASE}/api/humanresource/departments`} getLabel={(item) => item.Description} onSelect={(item) => { setDispatch((old) => departmentPicker === "source" ? { ...old, SourceDepartmentId: item.Id, SourceLabel: item.Description } : { ...old, DestinationDepartmentId: item.Id, DestinationLabel: item.Description }); setDepartmentPicker(null); }} onClose={() => setDepartmentPicker(null)} />}
    {customerPicker && <CustomerPickerModal title="Add customer file" onSelect={(item) => { setDispatchCustomers((old) => old.some((customer) => customer.Id === item.Id) ? old : [...old, item]); setCustomerPicker(false); }} onClose={() => setCustomerPicker(false)} />}
  </div>;
}
