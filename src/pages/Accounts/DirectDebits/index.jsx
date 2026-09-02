import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Swal from "sweetalert2";
import { AnimatePresence, motion } from "framer-motion";
import { FaChevronLeft, FaChevronRight, FaEdit, FaExchangeAlt, FaPlus, FaTimes } from "react-icons/fa";
import NotFoundImage from "/assets/scopefinding.png";
import { getProductOptions, listDirectDebits, saveDirectDebit } from "./api";

const PRODUCT_CODES = [{ value: 1, label: "Savings" }, { value: 2, label: "Loan" }, { value: 3, label: "Investment" }];
const CHARGE_TYPES = [{ value: 1, label: "Percentage" }, { value: 2, label: "Fixed Amount" }];
const emptyForm = { Description: "", CustomerAccountTypeProductCode: 1, CustomerAccountTypeTargetProductId: "", CustomerAccountTypeTargetProductCode: 0, ChargeType: 1, ChargePercentage: "", ChargeFixedAmount: "", IsLocked: false };

function Field({ label, children }) { return <div><Label className="text-sm font-semibold text-gray-700">{label}</Label>{children}</div>; }

function DirectDebitDrawer({ item, products, productsLoading, onClose, onSaved }) {
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  useEffect(() => setForm(item ? { ...emptyForm, ...item } : emptyForm), [item]);
  const productOptions = products[form.CustomerAccountTypeProductCode] || [];
  const changeProductCode = (value) => setForm((previous) => ({ ...previous, CustomerAccountTypeProductCode: Number(value), CustomerAccountTypeTargetProductId: "", CustomerAccountTypeTargetProductCode: 0 }));
  const changeProduct = (id) => {
    const product = productOptions.find((candidate) => candidate.Id === id);
    setForm((previous) => ({ ...previous, CustomerAccountTypeTargetProductId: id, CustomerAccountTypeTargetProductCode: Number(product?.Code || 0) }));
  };
  const submit = async (event) => {
    event.preventDefault();
    if (!form.Description.trim() || !form.CustomerAccountTypeTargetProductId) {
      Swal.fire("Missing Fields", "Name and product are required.", "warning");
      return;
    }
    const amount = form.ChargeType === 1 ? Number(form.ChargePercentage) : Number(form.ChargeFixedAmount);
    if (!(amount > 0) || (form.ChargeType === 1 && amount > 100)) {
      Swal.fire("Invalid Charge", form.ChargeType === 1 ? "Percentage must be greater than 0 and no more than 100." : "Fixed amount must be greater than 0.", "warning");
      return;
    }
    setSaving(true);
    try {
      await saveDirectDebit(item?.Id, { ...form, Description: form.Description.trim(), ChargePercentage: Number(form.ChargePercentage) || 0, ChargeFixedAmount: Number(form.ChargeFixedAmount) || 0 });
      await Swal.fire("Success", `Direct debit ${item ? "updated" : "created"} successfully.`, "success");
      onSaved(); onClose();
    } catch (error) { Swal.fire("Error", error.message, "error"); }
    finally { setSaving(false); }
  };
  return <AnimatePresence>
    <motion.div className="fixed inset-0 z-40 bg-black" initial={{ opacity: 0 }} animate={{ opacity: 0.4 }} exit={{ opacity: 0 }} onClick={onClose} />
    <motion.div className="fixed right-0 top-0 z-50 flex h-full w-[500px] max-w-full flex-col bg-white shadow-2xl" initial={{ x: "100%" }} animate={{ x: 0 }} exit={{ x: "100%" }} transition={{ type: "spring", stiffness: 300, damping: 30 }}>
      <div className="m-2 flex items-center justify-between rounded-2xl bg-indigo-600 px-4 py-3 text-white"><h2 className="font-bold">{item ? "Edit" : "Create"} Direct Debit</h2><Button variant="outline" size="sm" onClick={onClose}><FaTimes /> Close</Button></div>
      <form onSubmit={submit} className="flex min-h-0 flex-1 flex-col"><div className="flex-1 space-y-4 overflow-y-auto p-4">
        <Field label="Name"><Input value={form.Description} onChange={(e) => setForm((p) => ({ ...p, Description: e.target.value }))} placeholder="e.g. Children's savings allocation" /></Field>
        <Field label="Product Code"><select value={form.CustomerAccountTypeProductCode} onChange={(e) => changeProductCode(e.target.value)} className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm">{PRODUCT_CODES.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}</select></Field>
        <Field label="Product"><select value={form.CustomerAccountTypeTargetProductId} onChange={(e) => changeProduct(e.target.value)} disabled={productsLoading} className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"><option value="">{productsLoading ? "Loading products..." : "Select product..."}</option>{productOptions.map((product) => <option key={product.Id} value={product.Id}>{product.Description || product.Name}</option>)}</select></Field>
        <Field label="Charge Type"><select value={form.ChargeType} onChange={(e) => setForm((p) => ({ ...p, ChargeType: Number(e.target.value) }))} className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm">{CHARGE_TYPES.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}</select></Field>
        {form.ChargeType === 1 ? <Field label="Percentage"><Input type="number" min="0" max="100" step="0.01" value={form.ChargePercentage} onChange={(e) => setForm((p) => ({ ...p, ChargePercentage: e.target.value }))} /></Field> : <Field label="Fixed Amount"><Input type="number" min="0" step="0.01" value={form.ChargeFixedAmount} onChange={(e) => setForm((p) => ({ ...p, ChargeFixedAmount: e.target.value }))} /></Field>}
        <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={form.IsLocked} onChange={(e) => setForm((p) => ({ ...p, IsLocked: e.target.checked }))} className="h-4 w-4 accent-indigo-600" /> Locked</label>
      </div><div className="shrink-0 border-t p-4"><Button type="submit" disabled={saving || productsLoading} className="w-full bg-indigo-600 hover:bg-indigo-700">{saving ? "Saving..." : "Save Direct Debit"}</Button></div></form>
    </motion.div>
  </AnimatePresence>;
}

export default function DirectDebits() {
  const [items, setItems] = useState([]); const [itemsCount, setItemsCount] = useState(0); const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState(""); const [pageIndex, setPageIndex] = useState(0); const [editing, setEditing] = useState(undefined);
  const [products, setProducts] = useState({}); const [productsLoading, setProductsLoading] = useState(true); const pageSize = 20;
  const fetchItems = () => { setLoading(true); listDirectDebits({ text: search, pageIndex, pageSize }).then((page) => { setItems(page?.PageCollection || page?.pageCollection || []); setItemsCount(page?.ItemsCount || page?.itemsCount || 0); }).catch((error) => { setItems([]); Swal.fire("Error", error.message, "error"); }).finally(() => setLoading(false)); };
  useEffect(fetchItems, [search, pageIndex]);
  useEffect(() => { getProductOptions().then(setProducts).catch((error) => Swal.fire("Unable to load products", error.message, "error")).finally(() => setProductsLoading(false)); }, []);
  const totalPages = useMemo(() => Math.max(1, Math.ceil(itemsCount / pageSize)), [itemsCount]);
  return <div className="relative m-8 rounded-lg bg-white px-8 py-8 shadow-2xl">
    <div className="mb-6 flex items-center justify-between rounded-2xl bg-indigo-800 px-6 py-3"><h2 className="flex items-center gap-2 text-xl font-bold text-white"><FaExchangeAlt /> Direct Debits</h2><Button onClick={() => setEditing(null)} className="gap-2 bg-indigo-600 hover:bg-indigo-700"><FaPlus /> Add Direct Debit</Button></div>
    <Input value={search} onChange={(e) => { setSearch(e.target.value); setPageIndex(0); }} placeholder="Search direct debits..." className="mb-4 max-w-xs" />
    <div className="rounded-sm bg-gray-200 p-4"><div className="mb-4 grid grid-cols-12 gap-4 rounded-lg bg-gray-700 p-3 font-semibold text-gray-100"><span className="col-span-3">Name</span><span className="col-span-2">Product Code</span><span className="col-span-3">Product</span><span className="col-span-2">Charge</span><span className="col-span-1">Status</span><span className="col-span-1 text-right">Action</span></div>
      {loading ? <div className="space-y-2">{[1, 2, 3].map((i) => <div key={i} className="h-14 animate-pulse rounded-lg bg-gray-100" />)}</div> : items.length ? <div className="space-y-2">{items.map((item) => <div key={item.Id} className="grid grid-cols-12 items-center gap-4 rounded-lg border bg-white p-4 text-sm shadow-lg transition-all hover:shadow-xl"><span className="col-span-3 font-medium text-indigo-700">{item.Description}</span><span className="col-span-2">{item.CustomerAccountTypeProductCodeDescription || "—"}</span><span className="col-span-3 truncate">{item.CustomerAccountTypeTargetProductDescription || "—"}</span><span className="col-span-2">{item.ChargeType === 1 ? `${item.ChargePercentage}%` : Number(item.ChargeFixedAmount || 0).toLocaleString()}</span><span className="col-span-1"><span className={`rounded px-2 py-1 text-xs font-semibold ${item.IsLocked ? "bg-red-100 text-red-600" : "bg-green-100 text-green-600"}`}>{item.IsLocked ? "Locked" : "Active"}</span></span><span className="col-span-1 text-right"><Button size="sm" variant="outline" onClick={() => setEditing(item)}><FaEdit /></Button></span></div>)}</div> : <div className="py-8 text-center"><img src={NotFoundImage} alt="No direct debits" className="mx-auto w-32" /><p className="text-gray-400">No direct debits found.</p></div>}
      <div className="mt-4 flex items-center justify-center"><Button disabled={pageIndex === 0} onClick={() => setPageIndex((p) => p - 1)}><FaChevronLeft /> Prev</Button><span className="mx-3">Page {pageIndex + 1} of {totalPages}</span><Button disabled={pageIndex + 1 >= totalPages} onClick={() => setPageIndex((p) => p + 1)}>Next <FaChevronRight /></Button></div>
    </div>{editing !== undefined && <DirectDebitDrawer item={editing} products={products} productsLoading={productsLoading} onClose={() => setEditing(undefined)} onSaved={fetchItems} />}
  </div>;
}
