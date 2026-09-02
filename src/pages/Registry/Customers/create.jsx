import { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { FaCamera, FaPlus, FaTrash } from "react-icons/fa";
import Swal from "sweetalert2";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { apiFetch } from "@/lib/api";
import { apiErrorMessage, readApiResponse } from "@/lib/api-errors";
import FieldHelp from "@/pages/Accounts/SavingsProducts/FieldHelp";

const BASE = `${import.meta.env.VITE_APP_FIN_URL}`;
const CUSTOMER_URL = `${BASE}/api/registry/customer`;
const TYPES = [[0, "Individual"], [1, "Partnership"], [2, "Corporation"], [3, "Micro-credit"]];
const SALUTATIONS = [[1, "Mr"], [2, "Mrs"], [3, "Miss"], [4, "Dr"], [5, "Prof"]];
const GENDERS = [[1, "Male"], [2, "Female"], [3, "Non-Binary"]];
const ID_TYPES = [[1, "National ID"], [2, "Passport"], [3, "Alien ID"], [4, "Birth Certificate"]];
// Mirrors Infrastructure.Crosscutting.Framework.Utils.Nationality. The API
// persists the numeric enum value; registration should expose its description.
const NATIONALITIES = [
  [0, "Not specified"],
  [1, "Kenya"],
  [2, "Uganda"],
  [3, "Tanzania"],
  [4, "Rwanda"],
  [5, "Burundi"],
  [6, "Sudan"],
  [7, "South Sudan"],
  [8, "Malawi"],
  [9, "Zimbabwe"],
  [10, "Zambia"],
  [11, "Somalia"],
  [12, "Djibouti"],
  [13, "Ethiopia"],
];
const IMAGE_FIELDS = [["passportBuffer", "Passport photograph"], ["signatureBuffer", "Signature"], ["identityCardFrontSideBuffer", "Identity card — front"], ["identityCardBackSideBuffer", "Identity card — back"]];
const emptyForm = {
  type: 0, branchId: "", stationId: "", personalIdentificationNumber: "", individualType: 0,
  individualFirstName: "", individualLastName: "", individualIdentityCardType: 1,
  individualIdentityCardNumber: "", individualIdentityCardSerialNumber: "", individualPayrollNumbers: "",
  individualSalutation: 1, individualGender: 1, individualMaritalStatus: 1, individualNationality: 0,
  individualBirthDate: "", individualEmploymentDesignation: "", individualEmploymentDate: "", individualClassification: 1,
  nonIndividualDescription: "", nonIndividualRegistrationNumber: "", nonIndividualRegistrationSerialNumber: "",
  nonIndividualDateEstablished: "", addressAddressLine1: "", addressAddressLine2: "", addressStreet: "",
  addressPostalCode: "", addressCity: "", addressEmail: "", addressLandLine: "", addressMobileLine: "",
  bankName: "", branchName: "", reference1: "", reference2: "", reference3: "", remarks: "",
  isDefaulter: false, isLocked: false, inhibitGuaranteeing: false,
};
const emptyPartner = { salutation: 1, firstName: "", lastName: "", identityCardType: 1, identityCardNumber: "", gender: 1, relationship: 0, addressMobileLine: "", addressEmail: "", remarks: "", signatory: false };
const pick = (item, ...keys) => keys.map((key) => item?.[key]).find((v) => v !== undefined && v !== null);
const list = (body) => { const data = body?.data ?? body?.Data ?? body; return Array.isArray(data) ? data : data?.PageCollection ?? data?.pageCollection ?? []; };
const nameOf = (item) => pick(item, "FullName", "fullName") || `${pick(item, "IndividualFirstName", "individualFirstName") || ""} ${pick(item, "IndividualLastName", "individualLastName") || ""}`.trim();
const iso = (date) => date ? new Date(date).toISOString() : null;
const EMAIL_PATTERN = /^\w+([-+.']\w+)*@\w+([-.]\w+)*\.\w+([-.]\w+)*$/;
const MOBILE_PATTERN = /^\+[0-9]{7,15}$/;

function customerValidationErrors(form, partners, corporationMembers) {
  const errors = [];
  let tab = "particulars";
  const text = (value) => String(value ?? "").trim();

  if (!form.branchId) errors.push("Branch is required.");
  if (!form.stationId) errors.push("Station is required.");

  if (form.type === 0) {
    if (!text(form.individualFirstName)) errors.push("First name is required.");
    if (!text(form.individualLastName)) errors.push("Last name is required.");
    if (!text(form.individualIdentityCardNumber)) errors.push("Identity card number is required.");
    if (!form.individualBirthDate) {
      errors.push("Birth date is required.");
    } else {
      const birthDate = new Date(form.individualBirthDate);
      const adultThreshold = new Date();
      adultThreshold.setFullYear(adultThreshold.getFullYear() - 18);
      if (birthDate > adultThreshold) errors.push("The minimum required membership age is 18 years.");
    }
    if (form.individualEmploymentDate && new Date(form.individualEmploymentDate) > new Date()) {
      errors.push("Employment date cannot be in the future.");
    }
  } else {
    if (!text(form.nonIndividualDescription)) errors.push(`${TYPES.find(([id]) => id === form.type)?.[1] || "Customer"} name is required.`);
    if (!text(form.nonIndividualRegistrationNumber)) errors.push("Registration number is required.");
    if (!form.nonIndividualDateEstablished) {
      errors.push("Date established is required.");
    } else if (new Date(form.nonIndividualDateEstablished) > new Date()) {
      errors.push("Date established cannot be in the future.");
    }
  }

  if (form.type === 1 && !partners.length) errors.push("Add at least one partnership member.");
  if (form.type === 2 && !corporationMembers.length) errors.push("Add at least one corporation member.");

  const email = text(form.addressEmail);
  const mobile = text(form.addressMobileLine);
  if (email && !EMAIL_PATTERN.test(email)) {
    errors.push("Invalid customer email address.");
    tab = "address";
  }
  if (mobile && !MOBILE_PATTERN.test(mobile)) {
    errors.push("Customer mobile number must start with + and contain 7 to 15 digits.");
    tab = "address";
  }

  partners.forEach((partner, index) => {
    const partnerEmail = text(partner.addressEmail);
    const partnerMobile = text(partner.addressMobileLine);
    if (partnerEmail && !EMAIL_PATTERN.test(partnerEmail)) errors.push(`Partnership member ${index + 1} has an invalid email address.`);
    if (partnerMobile && !MOBILE_PATTERN.test(partnerMobile)) errors.push(`Partnership member ${index + 1} mobile number must start with + and contain 7 to 15 digits.`);
  });

  return { errors, tab };
}

function Field({ label, required, help, children }) {
  return <div><div className="flex items-center gap-1"><Label className="text-sm font-semibold text-gray-700">{label}{required && <span className="text-red-600"> *</span>}</Label><FieldHelp label={label}>{help}</FieldHelp></div>{children}</div>;
}
function EnumSelect({ value, options, onChange }) {
  return <Select value={String(value)} onValueChange={(v) => onChange(Number(v))}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{options.map(([id, label]) => <SelectItem key={id} value={String(id)}>{label}</SelectItem>)}</SelectContent></Select>;
}
function Options({ items, selected, toggle, empty }) {
  if (!items.length) return <p className="text-sm text-gray-400">{empty}</p>;
  return <div className="divide-y rounded-lg border">{items.map((item) => {
    const id = pick(item, "Id", "id");
    const locked = Boolean(pick(item, "IsLocked", "isLocked"));
    const automatic = Boolean(pick(item, "IsMandatory", "isMandatory")) || Boolean(pick(item, "IsDefault", "isDefault"));
    return <label key={id} className={`flex gap-3 p-3 ${locked || automatic ? "bg-gray-50 text-gray-400" : "hover:bg-gray-50"}`}><input type="checkbox" checked={selected.includes(id)} onChange={() => toggle(id)} disabled={locked || automatic} className="accent-indigo-600" /><span>{pick(item, "Description", "description")}</span>{locked ? <small className="ml-auto text-red-600">Locked</small> : automatic ? <small className="ml-auto text-indigo-600">Created automatically</small> : null}</label>;
  })}</div>;
}

export default function CreateCustomerDrawer({ open, onClose, onSuccess }) {
  const [form, setForm] = useState(emptyForm);
  const [tab, setTab] = useState("particulars");
  const [loading, setLoading] = useState(false);
  const [loadingData, setLoadingData] = useState(false);
  const [branches, setBranches] = useState([]), [stations, setStations] = useState([]);
  const [debits, setDebits] = useState([]), [investments, setInvestments] = useState([]), [savings, setSavings] = useState([]);
  const [unavailableSources, setUnavailableSources] = useState([]);
  const [selectedDebits, setSelectedDebits] = useState([]), [selectedInvestments, setSelectedInvestments] = useState([]), [selectedSavings, setSelectedSavings] = useState([]);
  const [images, setImages] = useState({});
  const [partner, setPartner] = useState(emptyPartner), [partners, setPartners] = useState([]);
  const [corporationMembers, setCorporationMembers] = useState([]), [referees, setReferees] = useState([]);
  const [search, setSearch] = useState(""), [results, setResults] = useState([]), [searching, setSearching] = useState(false);
  const typeLabel = TYPES.find(([id]) => id === form.type)?.[1];
  const tabs = useMemo(() => [
    ["particulars", `${typeLabel} Particulars`],
    ...([1, 2].includes(form.type) ? [["members", "Member Details"]] : []),
    ["address", "Address"], ["referees", "Referees"], ["images", "Images & Specimen"],
    ["debits", "Debit Types"], ["investments", "Investment Products"], ["savings", "Savings Products"],
  ], [form.type, typeLabel]);

  useEffect(() => {
    if (!open) return;
    setForm(emptyForm); setTab("particulars"); setSelectedDebits([]); setSelectedInvestments([]); setSelectedSavings([]);
    setImages({}); setPartners([]); setCorporationMembers([]); setReferees([]); setResults([]); setSearch(""); setUnavailableSources([]);
    setLoadingData(true);
    const sources = [["branches", `${BASE}/api/administration/branches`, setBranches], ["stations", `${BASE}/api/registry/station?pageIndex=0&pageSize=1000&text=`, setStations], ["debit types", `${CUSTOMER_URL}/registration/debit-types`, setDebits], ["investment products", `${BASE}/api/accounts/investmentsproducts`, setInvestments], ["savings products", `${BASE}/api/accounts/savingsproducts`, setSavings]];
    Promise.allSettled(sources.map(async ([, url, setter]) => { const response = await apiFetch(url); const body = await readApiResponse(response); setter(list(body)); }))
      .then((results) => { const failed = results.map((result, index) => result.status === "rejected" ? sources[index][0] : null).filter(Boolean); setUnavailableSources(failed); if (failed.length) Swal.fire("Some options could not be loaded", `Unavailable: ${failed.join(", ")}. Reload registration before selecting products from an unavailable catalogue.`, "warning"); })
      .finally(() => setLoadingData(false));
  }, [open]);

  const change = (key, value) => setForm((current) => ({ ...current, [key]: value }));
  const toggle = (setter, id) => setter((current) => current.includes(id) ? current.filter((value) => value !== id) : [...current, id]);
  const selectType = (type) => { change("type", type); setTab("particulars"); setPartners([]); setCorporationMembers([]); };
  const addPartner = () => {
    if (!partner.firstName.trim() || !partner.lastName.trim() || !partner.identityCardNumber.trim()) return Swal.fire("Missing details", "Member first name, last name, and identity card number are required.", "warning");
    setPartners((items) => [...items, { ...partner, key: crypto.randomUUID() }]); setPartner(emptyPartner);
  };
  const readImage = (field, file) => {
    if (!file) return;
    if (!file.type.startsWith("image/") || file.size > 5 * 1024 * 1024) return Swal.fire("Invalid image", "Choose an image no larger than 5 MB.", "warning");
    const reader = new FileReader(); reader.onload = () => setImages((current) => ({ ...current, [field]: { preview: reader.result, bytes: String(reader.result).split(",")[1] } })); reader.readAsDataURL(file);
  };
  const findCustomers = async () => {
    if (!search.trim()) return;
    setSearching(true);
    try { const response = await apiFetch(`${CUSTOMER_URL}?pageIndex=0&pageSize=20&customerFilter=2&text=${encodeURIComponent(search.trim())}`); setResults(list(await response.json())); }
    catch (error) { Swal.fire("Search failed", apiErrorMessage(error), "error"); } finally { setSearching(false); }
  };
  const addExisting = (customer, target) => {
    const id = pick(customer, "Id", "id"), item = { customerId: id, name: nameOf(customer), remarks: "", signatory: false };
    const setter = target === "corporation" ? setCorporationMembers : setReferees;
    setter((items) => items.some((entry) => entry.customerId === id) ? items : [...items, item]);
  };
  const submit = async (event) => {
    event.preventDefault();
    const validation = customerValidationErrors(form, partners, corporationMembers);
    if (validation.errors.length) {
      setTab(validation.tab);
      return Swal.fire({ title: "Check Customer Details", html: `<div style="text-align:left">${validation.errors.map((message) => `<div>• ${message}</div>`).join("")}</div>`, icon: "warning" });
    }
    const invalidSavings = selectedSavings.some((id) => !savings.some((item) => pick(item, "Id", "id") === id && !pick(item, "IsLocked", "isLocked")));
    const invalidInvestments = selectedInvestments.some((id) => !investments.some((item) => pick(item, "Id", "id") === id && !pick(item, "IsLocked", "isLocked")));
    if (invalidSavings || invalidInvestments) {
      return Swal.fire("Invalid product selection", "A selected product is no longer available or is locked. Reload registration and choose again.", "warning");
    }
    setLoading(true);
    try {
      const now = new Date().toISOString();
      const customer = { ...form, individualNationality: Number(form.individualNationality) || 0, individualBirthDate: iso(form.individualBirthDate), individualEmploymentDate: iso(form.individualEmploymentDate), nonIndividualDateEstablished: iso(form.nonIndividualDateEstablished), durationStartDate: now, durationEndDate: now, registrationDate: now, recordStatus: 0, ...Object.fromEntries(IMAGE_FIELDS.map(([field]) => [field, images[field]?.bytes || null])) };
      const response = await apiFetch(CUSTOMER_URL, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({
        customer, additionalDebitTypes: selectedDebits.map((id) => ({ id })), additionalInvestmentProducts: selectedInvestments.map((id) => ({ id })), additionalSavingsProducts: selectedSavings.map((id) => ({ id })),
        partnershipMembers: partners.map(({ key, ...member }) => member), corporationMembers: corporationMembers.map((member) => ({ customerId: member.customerId, remarks: member.remarks, signatory: member.signatory })), referees: referees.map((member) => ({ witnessId: member.customerId, remarks: member.remarks })), moduleNavigationItemCode: 21007,
      }) });
      const body = await readApiResponse(response, { fallbackMessage: "Customer registration failed." });
      await Swal.fire(body.warning ? "Registered with warning" : "Customer registered", body.message || `${typeLabel} customer created successfully.`, body.warning ? "warning" : "success"); onSuccess?.(); onClose();
    } catch (error) { Swal.fire("Registration failed", apiErrorMessage(error), "error"); } finally { setLoading(false); }
  };

  const Lookup = ({ target }) => <div className="space-y-3"><div className="flex gap-2"><Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search registered customers by name" /><Button type="button" onClick={findCustomers}>{searching ? "Searching..." : "Search"}</Button></div>{results.map((customer) => <button type="button" key={pick(customer, "Id", "id")} onClick={() => addExisting(customer, target)} className="w-full flex justify-between border rounded-lg p-3 hover:bg-gray-50"><span><b>{nameOf(customer)}</b><small className="block text-gray-500">ID: {pick(customer, "IndividualIdentityCardNumber", "individualIdentityCardNumber") || "—"}</small></span><FaPlus className="text-indigo-600" /></button>)}</div>;
  const MemberRows = ({ items, setter, signatory }) => <div className="space-y-2">{items.map((member, index) => <div key={member.customerId || member.key} className="flex items-center gap-3 border rounded-lg p-3"><span className="flex-1 font-semibold">{member.name || `${member.firstName} ${member.lastName}`}</span>{signatory && <label className="text-sm flex gap-2"><input type="checkbox" checked={member.signatory} onChange={(e) => setter((rows) => rows.map((row, i) => i === index ? { ...row, signatory: e.target.checked } : row))} />Signatory</label>}<Button type="button" variant="ghost" onClick={() => setter((rows) => rows.filter((_, i) => i !== index))}><FaTrash className="text-red-600" /></Button></div>)}</div>;

  return <AnimatePresence>{open && <><motion.div className="fixed inset-0 bg-black z-40" initial={{ opacity: 0 }} animate={{ opacity: 0.4 }} exit={{ opacity: 0 }} onClick={onClose} /><motion.div className="fixed top-3 right-3 w-[90vw] max-w-[1200px] h-[94vh] bg-white shadow-2xl z-50 flex flex-col rounded-2xl overflow-hidden" initial={{ x: "100%" }} animate={{ x: 0 }} exit={{ x: "100%" }} transition={{ type: "spring", stiffness: 300, damping: 30 }}>
    <div className="p-4 flex justify-between items-center bg-indigo-700 rounded-2xl m-2 shrink-0"><div><h2 className="font-bold text-lg text-white">Register Customer</h2><p className="text-xs text-indigo-100">Individual, partnership, corporation, and micro-credit registration</p></div><Button type="button" variant="outline" size="sm" onClick={onClose}>Close</Button></div>
    <form onSubmit={submit} className="flex flex-col flex-1 overflow-hidden"><div className="px-5 py-3 grid grid-cols-3 gap-4 shrink-0"><Field label="Customer Type" required><EnumSelect value={form.type} options={TYPES} onChange={selectType} /></Field><Field label="Branch" required><Select value={form.branchId} onValueChange={(v) => change("branchId", v)} disabled={loadingData}><SelectTrigger><SelectValue placeholder="Select branch" /></SelectTrigger><SelectContent>{branches.map((item) => <SelectItem key={pick(item, "Id", "id")} value={pick(item, "Id", "id")}>{pick(item, "Description", "description")}</SelectItem>)}</SelectContent></Select></Field><Field label="Station" required><Select value={form.stationId} onValueChange={(v) => change("stationId", v)} disabled={loadingData}><SelectTrigger><SelectValue placeholder="Select station" /></SelectTrigger><SelectContent>{stations.map((item) => <SelectItem key={pick(item, "Id", "id")} value={pick(item, "Id", "id")}>{pick(item, "Description", "description")}</SelectItem>)}</SelectContent></Select></Field></div>
      <div className="grid grid-cols-12 gap-3 px-3 pb-3 flex-1 overflow-hidden"><aside className="col-span-3 bg-gray-200 p-3 rounded-lg overflow-y-auto">{tabs.map(([id, label]) => <button type="button" key={id} onClick={() => setTab(id)} className={`w-full text-left p-3 mb-2 rounded-md text-sm font-medium ${tab === id ? "bg-indigo-700 text-white" : "bg-white hover:bg-gray-100 text-gray-700"}`}>{label}</button>)}</aside><main className="col-span-9 overflow-y-auto pr-1">
        {tab === "particulars" && (form.type === 0 ? <div className="grid grid-cols-3 gap-4"><Field label="First Name" required><Input value={form.individualFirstName} onChange={(e) => change("individualFirstName", e.target.value)} /></Field><Field label="Last Name" required><Input value={form.individualLastName} onChange={(e) => change("individualLastName", e.target.value)} /></Field><Field label="Birth Date" required><Input type="date" value={form.individualBirthDate} onChange={(e) => change("individualBirthDate", e.target.value)} /></Field><Field label="Identity Type"><EnumSelect value={form.individualIdentityCardType} options={ID_TYPES} onChange={(v) => change("individualIdentityCardType", v)} /></Field><Field label="Identity Number" required><Input value={form.individualIdentityCardNumber} onChange={(e) => change("individualIdentityCardNumber", e.target.value)} /></Field><Field label="Identity Serial"><Input value={form.individualIdentityCardSerialNumber} onChange={(e) => change("individualIdentityCardSerialNumber", e.target.value)} /></Field><Field label="Salutation"><EnumSelect value={form.individualSalutation} options={SALUTATIONS} onChange={(v) => change("individualSalutation", v)} /></Field><Field label="Gender"><EnumSelect value={form.individualGender} options={GENDERS} onChange={(v) => change("individualGender", v)} /></Field><Field label="Nationality"><EnumSelect value={form.individualNationality} options={NATIONALITIES} onChange={(v) => change("individualNationality", v)} /></Field><Field label="KRA PIN"><Input value={form.personalIdentificationNumber} onChange={(e) => change("personalIdentificationNumber", e.target.value)} /></Field><Field label="Payroll Numbers"><Input value={form.individualPayrollNumbers} onChange={(e) => change("individualPayrollNumbers", e.target.value)} /></Field><Field label="Employment Designation"><Input value={form.individualEmploymentDesignation} onChange={(e) => change("individualEmploymentDesignation", e.target.value)} /></Field><Field label="Employment Date"><Input type="date" value={form.individualEmploymentDate} onChange={(e) => change("individualEmploymentDate", e.target.value)} /></Field><Field label="Remarks"><Input value={form.remarks} onChange={(e) => change("remarks", e.target.value)} /></Field></div> : <div className="grid grid-cols-2 gap-4"><Field label={`${typeLabel} Name`} required><Input value={form.nonIndividualDescription} onChange={(e) => change("nonIndividualDescription", e.target.value)} /></Field><Field label="Registration Number" required><Input value={form.nonIndividualRegistrationNumber} onChange={(e) => change("nonIndividualRegistrationNumber", e.target.value)} /></Field><Field label="Registration Serial"><Input value={form.nonIndividualRegistrationSerialNumber} onChange={(e) => change("nonIndividualRegistrationSerialNumber", e.target.value)} /></Field><Field label="Date Established" required><Input type="date" value={form.nonIndividualDateEstablished} onChange={(e) => change("nonIndividualDateEstablished", e.target.value)} /></Field><Field label="KRA PIN"><Input value={form.personalIdentificationNumber} onChange={(e) => change("personalIdentificationNumber", e.target.value)} /></Field><Field label="Remarks"><Input value={form.remarks} onChange={(e) => change("remarks", e.target.value)} /></Field></div>)}
        {tab === "members" && form.type === 1 && <div className="space-y-4"><div className="grid grid-cols-3 gap-3"><Field label="First Name" required><Input value={partner.firstName} onChange={(e) => setPartner((p) => ({ ...p, firstName: e.target.value }))} /></Field><Field label="Last Name" required><Input value={partner.lastName} onChange={(e) => setPartner((p) => ({ ...p, lastName: e.target.value }))} /></Field><Field label="Identity Number" required><Input value={partner.identityCardNumber} onChange={(e) => setPartner((p) => ({ ...p, identityCardNumber: e.target.value }))} /></Field><Field label="Mobile"><Input value={partner.addressMobileLine} onChange={(e) => setPartner((p) => ({ ...p, addressMobileLine: e.target.value }))} /></Field><Field label="Email"><Input type="email" value={partner.addressEmail} onChange={(e) => setPartner((p) => ({ ...p, addressEmail: e.target.value }))} /></Field><label className="flex gap-2 items-center pt-5"><input type="checkbox" checked={partner.signatory} onChange={(e) => setPartner((p) => ({ ...p, signatory: e.target.checked }))} />Signatory</label></div><Button type="button" onClick={addPartner} className="bg-indigo-600"><FaPlus /> Add Member</Button><MemberRows items={partners} setter={setPartners} signatory /></div>}
        {tab === "members" && form.type === 2 && <div className="space-y-4"><p className="text-sm text-gray-500">Add existing registered customers as corporation members.</p><Lookup target="corporation" /><MemberRows items={corporationMembers} setter={setCorporationMembers} signatory /></div>}
        {tab === "address" && <div className="grid grid-cols-2 gap-4">{[["addressAddressLine1", "Address Line 1"], ["addressAddressLine2", "Address Line 2"], ["addressStreet", "Street"], ["addressCity", "City"], ["addressPostalCode", "Postal Code"], ["addressEmail", "Email"], ["addressMobileLine", "Mobile (+country code)"], ["addressLandLine", "Land Line"]].map(([key, label]) => <Field key={key} label={label}><Input type={key === "addressEmail" ? "email" : "text"} value={form[key]} onChange={(e) => change(key, e.target.value)} /></Field>)}</div>}
        {tab === "referees" && <div className="space-y-4"><p className="text-sm text-gray-500">Add existing registered customers as referees.</p><Lookup target="referee" /><MemberRows items={referees} setter={setReferees} /></div>}
        {tab === "images" && <div className="grid grid-cols-2 gap-4">{IMAGE_FIELDS.map(([field, label]) => <div key={field} className="border rounded-lg p-4"><Label className="font-semibold">{label}</Label>{images[field] ? <img src={images[field].preview} alt={label} className="h-36 w-full object-contain bg-gray-100 mt-2" /> : <div className="h-36 bg-gray-100 mt-2 flex items-center justify-center"><FaCamera className="text-3xl text-gray-400" /></div>}<Input className="mt-3" type="file" accept="image/*" capture="environment" onChange={(e) => readImage(field, e.target.files?.[0])} /><small className="text-gray-400">Camera, scanner output, JPG or PNG; max 5 MB.</small></div>)}</div>}
        {tab === "debits" && <div><div className="mb-3 flex items-center gap-1 text-sm font-semibold text-gray-700">Additional debit types <FieldHelp label="Debit Types">Recurring or automatic charge instructions made available to the customer. Company-mandatory debit types are attached automatically; selections here are additional.</FieldHelp></div><Options items={debits} selected={selectedDebits} toggle={(id) => toggle(setSelectedDebits, id)} empty="No debit types configured." /></div>}
        {tab === "investments" && <div><div className="mb-3 flex items-center gap-1 text-sm font-semibold text-gray-700">Additional investment products <FieldHelp label="Investment Products">Default, mandatory, and company-attached products are resolved and created by the server. Select only optional extras.</FieldHelp></div>{unavailableSources.includes("investment products") && <p className="mb-3 rounded-md bg-amber-50 p-3 text-sm text-amber-700">Investment products could not be loaded. Reload registration before choosing an optional investment product.</p>}<Options items={investments} selected={selectedInvestments} toggle={(id) => toggle(setSelectedInvestments, id)} empty="No investment products configured." /></div>}
        {tab === "savings" && <div><div className="mb-3 flex items-center gap-1 text-sm font-semibold text-gray-700">Additional savings products <FieldHelp label="Savings Products">The default, mandatory, and company-attached savings products are resolved and created by the server. Select only optional extras.</FieldHelp></div>{unavailableSources.includes("savings products") && <p className="mb-3 rounded-md bg-amber-50 p-3 text-sm text-amber-700">Savings products could not be loaded. Reload registration before choosing an optional savings product.</p>}<Options items={savings} selected={selectedSavings} toggle={(id) => toggle(setSelectedSavings, id)} empty="No savings products configured." /></div>}
      </main></div><div className="px-5 py-3 border-t bg-gray-50 flex justify-between shrink-0"><div className="flex gap-4"><label className="flex gap-2"><input type="checkbox" checked={form.isLocked} onChange={(e) => change("isLocked", e.target.checked)} />Locked</label><label className="flex gap-2"><input type="checkbox" checked={form.inhibitGuaranteeing} onChange={(e) => change("inhibitGuaranteeing", e.target.checked)} />Inhibit guaranteeing</label></div><Button type="submit" disabled={loading || loadingData} className="bg-indigo-600 hover:bg-indigo-700">{loading ? "Registering..." : `Register ${typeLabel}`}</Button></div>
    </form>
  </motion.div></>}</AnimatePresence>;
}
