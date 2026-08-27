import { useCallback, useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { apiJson, normalizeList } from "@/lib/api";
import Swal from "sweetalert2";
import { FaSignOutAlt, FaSyncAlt } from "react-icons/fa";
import NotFoundImage from "/assets/scopefinding.png";

const BASE = `${import.meta.env.VITE_APP_MEMBERSHIP_URL}/api/registry`;
const API = `${BASE}/withdrawal-notifications`;
const STAGES = [
  ["register", "Registration"], ["approval", "Approval", [1, 16]],
  ["verification", "Verification", [2]], ["settlement", "Settlement", [4]],
  ["death", "Death Claim", [8]],
];
const CATEGORIES = [[1792, "Deceased"], [1793, "Voluntary"], [1794, "Retiree"]];
const cash = (v) => Number(v || 0).toLocaleString(undefined, { minimumFractionDigits: 2 });
const err = (e) => e?.message || "The operation could not be completed.";
const Field = ({ label, children }) => <div><Label className="text-sm font-semibold text-gray-700">{label}</Label>{children}</div>;

function Accounts({ title, rows, field = "BookBalance" }) {
  return <div className="border rounded-lg p-3"><h4 className="font-semibold mb-2">{title}</h4>{rows?.length ? rows.map((x) =>
    <div key={x.Id} className="flex justify-between bg-gray-50 p-2 rounded mb-2 text-sm"><span>{x.FullAccountNumber}<small className="block">{x.CustomerAccountTypeTargetProductDescription}</small></span><b>{cash(x[field])}</b></div>
  ) : <p className="text-sm text-gray-400">None</p>}</div>;
}

export default function MemberExit() {
  const [stage, setStage] = useState("register"), [items, setItems] = useState([]), [customers, setCustomers] = useState([]);
  const [selected, setSelected] = useState(null), [position, setPosition] = useState(null), [search, setSearch] = useState(""), [loading, setLoading] = useState(true);
  const [customerId, setCustomerId] = useState(""), [category, setCategory] = useState(1793), [remarks, setRemarks] = useState("");
  const [actionRemarks, setActionRemarks] = useState(""), [option, setOption] = useState(1), [settlementType, setSettlementType] = useState(1);
  const [insurers, setInsurers] = useState([]), [insurerId, setInsurerId] = useState(""), [settlements, setSettlements] = useState([]), [checked, setChecked] = useState([]);

  const load = useCallback(async () => { setLoading(true); try { setItems(normalizeList(await apiJson(API))); } catch (e) { Swal.fire("Error", err(e), "error"); } finally { setLoading(false); } }, []);
  useEffect(() => { load(); apiJson(`${BASE}/customer?pageIndex=0&pageSize=500`).then((x) => setCustomers(normalizeList(x))).catch(() => setCustomers([])); }, [load]);
  useEffect(() => { if (!customerId) return setPosition(null); apiJson(`${API}/customer/${customerId}/position`).then((x) => setPosition(x.data)).catch((e) => Swal.fire("Error", err(e), "error")); }, [customerId]);
  useEffect(() => { if (stage === "death") apiJson(`${API}/insurance-companies`).then((x) => setInsurers(normalizeList(x))); }, [stage]);
  useEffect(() => { if (stage === "death" && selected) apiJson(`${API}/${selected.Id}/settlements`).then((x) => { const r = normalizeList(x); setSettlements(r); setChecked(r.map((y) => y.Id)); }); }, [stage, selected]);

  const config = STAGES.find((x) => x[0] === stage), customer = customers.find((x) => x.Id === customerId);
  const visible = useMemo(() => items.filter((x) => (!config[2] || config[2].includes(x.Status)) && (stage !== "death" || x.Category === 1792) && `${x.CustomerFullName} ${x.CustomerReference2} ${x.CustomerIndividualIdentityCardNumber}`.toLowerCase().includes(search.toLowerCase())), [items, config, stage, search]);

  async function register() {
    if (!customerId || !position?.branchId || !remarks.trim()) return Swal.fire("Required", "Select a customer with an account and enter remarks.", "info");
    try { await apiJson(API, { method: "POST", body: JSON.stringify({ CustomerId: customerId, BranchId: position.branchId, Category: +category, Remarks: remarks.trim() }) }); await Swal.fire("Success", "Withdrawal registered.", "success"); setCustomerId(""); setRemarks(""); load(); } catch (e) { Swal.fire("Unable to register", err(e), "error"); }
  }
  async function update() {
    if (!selected || !actionRemarks.trim()) return Swal.fire("Required", "Select a case and enter remarks.", "info");
    const endpoint = stage === "approval" ? "approval" : stage === "verification" ? "verification" : "settlement";
    try { await apiJson(`${API}/${selected.Id}/${endpoint}`, { method: "POST", body: JSON.stringify({ Option: +option, Remarks: actionRemarks.trim(), SettlementType: +settlementType, ModuleNavigationItemCode: 0 }) }); await Swal.fire("Success", `${config[1]} updated.`, "success"); setSelected(null); setActionRemarks(""); load(); } catch (e) { Swal.fire("Unable to update", err(e), "error"); }
  }
  async function deathClaim() {
    const insurer = insurers.find((x) => x.Id === insurerId), rows = settlements.filter((x) => checked.includes(x.Id));
    if (!insurer || !rows.length) return Swal.fire("Required", "Select an insurer and at least one settlement.", "info");
    try { await apiJson(`${API}/${selected.Id}/death-claim`, { method: "POST", body: JSON.stringify({ InsuranceCompany: insurer, Settlements: rows, ModuleNavigationItemCode: 0 }) }); await Swal.fire("Success", "Death claim settled.", "success"); setSelected(null); load(); } catch (e) { Swal.fire("Unable to settle", err(e), "error"); }
  }

  return <div className="bg-white m-8 px-8 py-8 shadow-2xl rounded-lg relative">
    <div className="flex justify-between items-center mb-6 bg-indigo-800 px-6 py-3 rounded-2xl"><h2 className="text-xl font-bold text-white flex gap-2 items-center"><FaSignOutAlt/> Membership Withdrawals</h2><Button className="bg-indigo-600 hover:bg-indigo-700" onClick={load}><FaSyncAlt/> Refresh</Button></div>
    <div className="flex gap-2 flex-wrap mb-6">{STAGES.map(([id, label]) => <Button key={id} onClick={() => { setStage(id); setSelected(null); }} className={stage === id ? "bg-indigo-600 hover:bg-indigo-700" : "bg-gray-200 text-gray-700 hover:bg-gray-300"}>{label}</Button>)}</div>
    {stage === "register" ? <div className="space-y-5">
      <div className="grid md:grid-cols-3 gap-4 bg-gray-50 border rounded-lg p-4">
        <Field label="Customer"><select className="w-full border rounded-md h-10 px-3" value={customerId} onChange={(e) => setCustomerId(e.target.value)}><option value="">Select customer</option>{customers.map((x) => <option key={x.Id} value={x.Id}>{x.FullName || `${x.IndividualFirstName || ""} ${x.IndividualLastName || ""}`} — {x.Reference2 || x.SerialNumber}</option>)}</select></Field>
        <Field label="Serial / Membership #"><Input readOnly value={customer ? `${customer.SerialNumber || ""} / ${customer.Reference2 || ""}` : ""}/></Field>
        <Field label="Identity / Payroll #"><Input readOnly value={customer ? `${customer.IndividualIdentityCardNumber || ""} / ${customer.IndividualPayrollNumbers || ""}` : ""}/></Field>
        <Field label="Station"><Input readOnly value={customer?.StationDescription || ""}/></Field>
        <Field label="Category"><select className="w-full border rounded-md h-10 px-3" value={category} onChange={(e) => setCategory(e.target.value)}>{CATEGORIES.map(([v, l]) => <option key={v} value={v}>{l}</option>)}</select></Field>
        <Field label="Remarks"><Input value={remarks} onChange={(e) => setRemarks(e.target.value)}/></Field>
      </div>
      {position && <><div className="grid md:grid-cols-3 gap-3"><Accounts title="Savings Accounts" rows={position.savings}/><Accounts title="Loan Accounts" rows={position.loans} field="PrincipalBalance"/><Accounts title="Investment Accounts" rows={position.investments}/></div><div className="grid md:grid-cols-4 gap-3 text-sm"><div className="p-3 bg-indigo-50 rounded">Refundable investments<br/><b>{cash(position.refundableInvestments)}</b></div><div className="p-3 bg-red-50 rounded">Loan liability<br/><b>{cash(position.loanLiability)}</b></div><div className={`p-3 rounded ${position.netRefundable < 0 ? "bg-red-100" : "bg-green-100"}`}>Net refundable<br/><b>{cash(position.netRefundable)}</b></div><div className="p-3 bg-amber-50 rounded">Loans guaranteed<br/><b>{position.totalLoansGuaranteed}</b></div></div></>}
      <div className="flex justify-end"><Button className="bg-indigo-600 hover:bg-indigo-700" onClick={register}>Register Withdrawal</Button></div>
    </div> : <div className="grid lg:grid-cols-5 gap-5"><div className="lg:col-span-3"><Input className="mb-4" placeholder="Search member, membership or ID number" value={search} onChange={(e) => setSearch(e.target.value)}/><div className="bg-gray-200 p-4 rounded-sm"><div className="grid grid-cols-12 gap-3 bg-gray-700 text-gray-100 font-semibold p-3 rounded-lg mb-4"><span className="col-span-4">Member</span><span className="col-span-3">Category</span><span className="col-span-3">Status</span><span className="col-span-2">Select</span></div>{loading ? <p className="p-6 text-center">Loading...</p> : visible.length ? visible.map((x) => <button key={x.Id} onClick={() => setSelected(x)} className={`w-full grid grid-cols-12 gap-3 p-3 mb-2 rounded-lg shadow-lg text-left border ${selected?.Id === x.Id ? "bg-indigo-50 border-indigo-500" : "bg-white"}`}><span className="col-span-4">{x.CustomerFullName}<small className="block">{x.CustomerReference2}</small></span><span className="col-span-3">{x.CategoryDescription}</span><span className="col-span-3">{x.StatusDescription}</span><span className="col-span-2 text-indigo-600">Open</span></button>) : <div className="text-center p-8"><img src={NotFoundImage} className="mx-auto w-32"/><p className="text-gray-400">No eligible cases</p></div>}</div></div>
      <div className="lg:col-span-2 border rounded-lg p-4 space-y-4"><h3 className="font-semibold">{config[1]}</h3>{selected ? <><div className="bg-gray-50 p-3 rounded text-sm"><b>{selected.CustomerFullName}</b><p>{selected.CustomerStationDescription}</p><p>{selected.Remarks}</p><p>Maturity: {new Date(selected.MaturityDate).toLocaleDateString()}</p></div>{stage === "death" ? <><Field label="Insurer"><select className="w-full border rounded-md h-10 px-3" value={insurerId} onChange={(e) => setInsurerId(e.target.value)}><option value="">Select insurer</option>{insurers.map((x) => <option key={x.Id} value={x.Id}>{x.Description}</option>)}</select></Field><div><Label>Settlements</Label>{settlements.map((x) => <label key={x.Id} className="flex gap-2 p-2 border rounded mt-2"><input type="checkbox" className="accent-indigo-600" checked={checked.includes(x.Id)} onChange={(e) => setChecked(e.target.checked ? [...checked, x.Id] : checked.filter((id) => id !== x.Id))}/>{x.FullAccountNumber} — {cash(+x.Principal + +x.Interest + +x.CarryForwards)}</label>)}</div><Button className="w-full bg-indigo-600 hover:bg-indigo-700" onClick={deathClaim}>Settle Death Claim</Button></> : <><Field label={`${config[1]} remarks`}><Input value={actionRemarks} onChange={(e) => setActionRemarks(e.target.value)}/></Field><Field label="Action"><select className="w-full border rounded-md h-10 px-3" value={option} onChange={(e) => setOption(e.target.value)}><option value={1}>{stage === "approval" ? "Approve" : stage === "verification" ? "Verify" : "Settle"}</option><option value={2}>Defer</option></select></Field>{stage === "settlement" && <Field label="Settlement type"><select className="w-full border rounded-md h-10 px-3" value={settlementType} onChange={(e) => setSettlementType(e.target.value)}><option value={1}>Normal</option><option value={2}>Express</option><option value={4}>Waiver</option></select></Field>}<Button className="w-full bg-indigo-600 hover:bg-indigo-700" onClick={update}>Update</Button></>}</> : <p className="text-sm text-gray-400">Select an eligible case.</p>}</div></div>}
  </div>;
}
