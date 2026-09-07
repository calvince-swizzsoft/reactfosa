import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { FaEdit, FaPlus, FaTrash } from "react-icons/fa";
import Swal from "sweetalert2";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { apiFetch } from "@/lib/api";
import { apiErrorMessage, readApiResponse } from "@/lib/api-errors";
import FieldHelp from "@/pages/Accounts/SavingsProducts/FieldHelp";
import { ID_TYPES, normalizeIdentityNumber, normalizeKraPin, validateIdentityNumber, validateKraPin } from "./customerValidation";

const BASE = `${import.meta.env.VITE_APP_FIN_URL}/api/registry/customer`;
const CUSTOMER_TYPES = { 0: "Individual", 1: "Partnership", 2: "Corporation", 3: "Micro-credit" };
const SALUTATIONS = [[1, "Mr"], [2, "Mrs"], [3, "Miss"], [4, "Dr"], [5, "Prof"], [6, "Rev"], [7, "Eng"], [8, "Hon"], [9, "Cllr"], [10, "Sir"], [11, "Ms"]];
const GENDERS = [[0, "Not specified"], [1, "Male"], [2, "Female"], [3, "Non-Binary"]];
const RELATIONSHIPS = [[0, "Not specified"], [1, "Father"], [2, "Mother"], [3, "Brother"], [4, "Sister"], [5, "Wife"], [6, "Husband"], [7, "Son"], [8, "Daughter"]];
const emptyMember = { Id: null, Salutation: 1, FirstName: "", LastName: "", IdentityCardType: 1, IdentityCardNumber: "", Gender: 0, Relationship: 0, AddressMobileLine: "", AddressEmail: "", Remarks: "", Signatory: false };
const read = (value, name) => value?.[name] ?? value?.[name[0].toLowerCase() + name.slice(1)] ?? "";
const dateValue = (value) => value ? String(value).slice(0, 10) : "";
const customerTypeOf = (customer) => {
  const rawType = customer?.Type ?? customer?.type ?? customer?.CustomerType ?? customer?.customerType;
  const numericType = Number(rawType);
  if (Number.isInteger(numericType) && Object.prototype.hasOwnProperty.call(CUSTOMER_TYPES, numericType)) return numericType;
  const description = rawType ?? customer?.TypeDescription ?? customer?.typeDescription ?? customer?.CustomerTypeDescription ?? customer?.customerTypeDescription;
  const normalizedType = String(description ?? "").toLowerCase().replace(/[-_\s]/g, "");
  const describedType = { individual: 0, partnership: 1, corporation: 2, microcredit: 3 }[normalizedType];
  if (describedType !== undefined) return describedType;
  if (read(customer, "NonIndividualDescription") || read(customer, "NonIndividualRegistrationNumber")) return 1;
  return 0;
};
const responseList = (body) => {
  const data = body?.data ?? body?.Data ?? body;
  return Array.isArray(data) ? data : data?.PageCollection ?? data?.pageCollection ?? [];
};
const memberValue = (member, name) => member?.[name] ?? member?.[name[0].toLowerCase() + name.slice(1)] ?? "";
const normalizeMember = (member) => ({
  Id: memberValue(member, "Id") || null,
  PartnershipId: memberValue(member, "PartnershipId") || null,
  Salutation: Number(memberValue(member, "Salutation")) || 1,
  FirstName: memberValue(member, "FirstName"),
  LastName: memberValue(member, "LastName"),
  IdentityCardType: Number(memberValue(member, "IdentityCardType")) || 1,
  IdentityCardNumber: memberValue(member, "IdentityCardNumber"),
  Gender: Number(memberValue(member, "Gender")) || 0,
  Relationship: Number(memberValue(member, "Relationship")) || 0,
  AddressMobileLine: memberValue(member, "AddressMobileLine"),
  AddressEmail: memberValue(member, "AddressEmail"),
  Remarks: memberValue(member, "Remarks"),
  Signatory: Boolean(memberValue(member, "Signatory")),
});

function Field({ label, help, children }) {
  return <div><div className="flex items-center gap-1"><Label className="text-sm font-semibold text-gray-700">{label}</Label><FieldHelp label={label}>{help}</FieldHelp></div>{children}</div>;
}
function EnumSelect({ value, options, onChange }) {
  return <Select value={String(value)} onValueChange={(next) => onChange(Number(next))}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{options.map(([id, label]) => <SelectItem key={id} value={String(id)}>{label}</SelectItem>)}</SelectContent></Select>;
}

export default function EditCustomerDrawer({ customerId, customerSummary, open, onClose, onSuccess }) {
  const [customer, setCustomer] = useState(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [partnershipMembers, setPartnershipMembers] = useState([]);
  const [membersLoading, setMembersLoading] = useState(false);
  const [memberDraft, setMemberDraft] = useState(emptyMember);
  const [editingMemberIndex, setEditingMemberIndex] = useState(null);
  const customerType = customerTypeOf(customer);
  const customerTypeLabel = CUSTOMER_TYPES[customerType];

  useEffect(() => {
    if (!open || !customerId) return;
    setLoading(true);
    setPartnershipMembers([]);
    setMemberDraft(emptyMember);
    setEditingMemberIndex(null);
    apiFetch(`${BASE}/${customerId}`).then(async (response) => {
      const body = await readApiResponse(response, { fallbackMessage: "Could not load customer." });
      const detail = body?.data?.customer ?? body?.Data?.Customer ?? body?.data?.Customer ?? body?.Data?.customer ?? null;
      const summaryType = customerSummary?.Type ?? customerSummary?.type ?? customerSummary?.CustomerType ?? customerSummary?.customerType;
      const summaryTypeDescription = customerSummary?.TypeDescription ?? customerSummary?.typeDescription ?? customerSummary?.CustomerTypeDescription ?? customerSummary?.customerTypeDescription;
      const mergedCustomer = detail ? {
        ...customerSummary,
        ...detail,
        ...(summaryType !== undefined && summaryType !== null ? { Type: summaryType } : {}),
        ...(summaryTypeDescription ? { TypeDescription: summaryTypeDescription } : {}),
      } : customerSummary ?? null;
      setCustomer(mergedCustomer);
      if (customerTypeOf(mergedCustomer) === 1) {
        setMembersLoading(true);
        try {
          const membersResponse = await apiFetch(`${BASE}/${customerId}/partnership-members`);
          const membersBody = await readApiResponse(membersResponse, { fallbackMessage: "Could not load partnership members." });
          setPartnershipMembers(responseList(membersBody).map(normalizeMember));
        } finally {
          setMembersLoading(false);
        }
      }
    }).catch((error) => Swal.fire("Unable to Load Customer", apiErrorMessage(error), "error")).finally(() => setLoading(false));
  }, [open, customerId, customerSummary]);

  const change = (name, value) => setCustomer((current) => {
    const camelName = name[0].toLowerCase() + name.slice(1);
    const key = Object.prototype.hasOwnProperty.call(current, name) ? name : camelName;
    return { ...current, [key]: value };
  });
  const changeMember = (name, value) => setMemberDraft((current) => ({ ...current, [name]: value }));
  const memberError = (member) => {
    if (!String(member.FirstName || "").trim() || !String(member.LastName || "").trim()) return "First name and last name are required.";
    const identityError = validateIdentityNumber(member.IdentityCardNumber, member.IdentityCardType);
    if (identityError) return identityError;
    if (member.AddressEmail && !/^\w+([-+.']\w+)*@\w+([-.]\w+)*\.\w+([-.]\w+)*$/.test(member.AddressEmail)) return "Enter a valid member email address.";
    if (member.AddressMobileLine && !/^\+[0-9]{7,15}$/.test(member.AddressMobileLine)) return "Member mobile number must begin with + and contain 7 to 15 digits.";
    return "";
  };
  const saveMemberDraft = () => {
    const error = memberError(memberDraft);
    if (error) return Swal.fire("Check Member Details", error, "warning");
    const normalized = { ...memberDraft, IdentityCardNumber: normalizeIdentityNumber(memberDraft.IdentityCardNumber, memberDraft.IdentityCardType) };
    setPartnershipMembers((current) => editingMemberIndex === null ? [...current, normalized] : current.map((member, index) => index === editingMemberIndex ? normalized : member));
    setMemberDraft(emptyMember);
    setEditingMemberIndex(null);
  };
  const editMember = (member, index) => {
    setMemberDraft({ ...member });
    setEditingMemberIndex(index);
  };
  const cancelMemberEdit = () => {
    setMemberDraft(emptyMember);
    setEditingMemberIndex(null);
  };
  const submit = async (event) => {
    event.preventDefault();
    if (customerType === 0) {
      if (!String(read(customer, "IndividualFirstName")).trim() || !String(read(customer, "IndividualLastName")).trim() || !String(read(customer, "IndividualIdentityCardNumber")).trim()) {
        return Swal.fire("Missing Individual Details", "First name, last name, and identity card number are required.", "warning");
      }
      const identityError = validateIdentityNumber(read(customer, "IndividualIdentityCardNumber"), read(customer, "IndividualIdentityCardType"));
      if (identityError) return Swal.fire("Invalid Identity Number", identityError, "warning");
    } else if (!String(read(customer, "NonIndividualDescription")).trim() || !String(read(customer, "NonIndividualRegistrationNumber")).trim() || !read(customer, "NonIndividualDateEstablished")) {
      return Swal.fire("Missing Organisation Details", `${customerTypeLabel} name, registration number, and date established are required.`, "warning");
    }
    if (customerType === 1) {
      if (editingMemberIndex !== null) return Swal.fire("Unsaved Member Changes", "Save or cancel the member being edited before submitting.", "warning");
      if (!partnershipMembers.length) return Swal.fire("Partnership Member Required", "A partnership must have at least one member.", "warning");
      const invalidMemberIndex = partnershipMembers.findIndex((member) => memberError(member));
      if (invalidMemberIndex >= 0) return Swal.fire("Check Partnership Members", `Member ${invalidMemberIndex + 1}: ${memberError(partnershipMembers[invalidMemberIndex])}`, "warning");
    }
    const kraPinError = validateKraPin(read(customer, "PersonalIdentificationNumber"));
    if (kraPinError) return Swal.fire("Invalid KRA PIN", kraPinError, "warning");
    const email = String(read(customer, "AddressEmail") || "").trim();
    const mobile = String(read(customer, "AddressMobileLine") || "").trim();
    if (email && !/^\w+([-+.']\w+)*@\w+([-.]\w+)*\.\w+([-.]\w+)*$/.test(email)) return Swal.fire("Invalid Email", "Enter a valid customer email address.", "warning");
    if (mobile && !/^\+[0-9]{7,15}$/.test(mobile)) return Swal.fire("Invalid Mobile Number", "Use international format, beginning with + and followed by 7 to 15 digits.", "warning");
    setSaving(true);
    try {
      const payload = { ...customer };
      const kraKey = Object.prototype.hasOwnProperty.call(payload, "PersonalIdentificationNumber") ? "PersonalIdentificationNumber" : "personalIdentificationNumber";
      payload[kraKey] = normalizeKraPin(read(customer, "PersonalIdentificationNumber"));
      if (customerType === 0) {
        const identityKey = Object.prototype.hasOwnProperty.call(payload, "IndividualIdentityCardNumber") ? "IndividualIdentityCardNumber" : "individualIdentityCardNumber";
        payload[identityKey] = normalizeIdentityNumber(read(customer, "IndividualIdentityCardNumber"), read(customer, "IndividualIdentityCardType"));
      }
      delete payload.RecordStatus;
      delete payload.recordStatus;
      const response = await apiFetch(`${BASE}/${customerId}`, {
        method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload),
      });
      const body = await readApiResponse(response, { fallbackMessage: "Could not submit customer edit." });
      if (customerType === 1) {
        const membersResponse = await apiFetch(`${BASE}/${customerId}/partnership-members`, {
          method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(partnershipMembers),
        });
        await readApiResponse(membersResponse, { fallbackMessage: "Customer details were submitted, but partnership members could not be updated." });
      }
      await Swal.fire("Submitted", body.message || "Customer edit submitted successfully", "success");
      onSuccess(); onClose();
    } catch (error) { Swal.fire("Unable to Update Customer", apiErrorMessage(error), "error"); }
    finally { setSaving(false); }
  };

  return <AnimatePresence>{open && <>
    <motion.div className="fixed inset-0 bg-black z-40" initial={{ opacity: 0 }} animate={{ opacity: 0.4 }} exit={{ opacity: 0 }} onClick={onClose} />
    <motion.div className="fixed top-3 right-3 z-50 h-[94vh] w-[82vw] max-w-4xl rounded-2xl bg-white shadow-2xl flex flex-col overflow-hidden" initial={{ x: "100%" }} animate={{ x: 0 }} exit={{ x: "100%" }} transition={{ type: "spring", stiffness: 300, damping: 30 }}>
      <div className="m-2 shrink-0 rounded-2xl bg-indigo-600 p-4 flex items-center justify-between">
        <div><h2 className="text-lg font-bold text-white">Edit {customer ? customerTypeLabel : "Customer"}</h2><p className="text-xs text-indigo-100">Changes may be routed for verification.</p></div>
        <Button type="button" variant="outline" size="sm" onClick={onClose}>Close</Button>
      </div>
      {loading || !customer ? <div className="flex-1 grid place-items-center text-gray-500">Loading customer…</div> :
      <form onSubmit={submit} className="flex flex-1 min-h-0 flex-col">
        <div className="flex-1 overflow-y-auto p-6 grid grid-cols-1 md:grid-cols-2 gap-4">
          {customerType === 0 ? <>
            <Field label="First Name"><Input value={read(customer, "IndividualFirstName")} onChange={(e) => change("IndividualFirstName", e.target.value)} /></Field>
            <Field label="Last Name"><Input value={read(customer, "IndividualLastName")} onChange={(e) => change("IndividualLastName", e.target.value)} /></Field>
            <Field label="Identity Type" help="The document type determines which identity-number format is accepted."><Select value={String(read(customer, "IndividualIdentityCardType") || 1)} onValueChange={(value) => change("IndividualIdentityCardType", Number(value))}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{ID_TYPES.map(([value, label]) => <SelectItem key={value} value={String(value)}>{label}</SelectItem>)}</SelectContent></Select></Field>
            <Field label="Identity Card Number" help="Enter the number exactly as it appears on the customer's identity document."><Input value={read(customer, "IndividualIdentityCardNumber")} onChange={(e) => change("IndividualIdentityCardNumber", e.target.value)} /></Field>
            <Field label="Identity Card Serial" help="Enter the document serial number when it differs from the identity card number."><Input value={read(customer, "IndividualIdentityCardSerialNumber")} onChange={(e) => change("IndividualIdentityCardSerialNumber", e.target.value)} /></Field>
            <Field label="Payroll Numbers" help="The payroll or staff number used by the customer's employer."><Input value={read(customer, "IndividualPayrollNumbers")} onChange={(e) => change("IndividualPayrollNumbers", e.target.value)} /></Field>
            <Field label="Birth Date" help="The customer's recorded date of birth."><Input type="date" value={dateValue(read(customer, "IndividualBirthDate"))} onChange={(e) => change("IndividualBirthDate", e.target.value || null)} /></Field>
            <Field label="Employment Designation" help="The customer's current job title or employment role."><Input value={read(customer, "IndividualEmploymentDesignation")} onChange={(e) => change("IndividualEmploymentDesignation", e.target.value)} /></Field>
            <Field label="Employment Date" help="The date the customer began their current employment."><Input type="date" value={dateValue(read(customer, "IndividualEmploymentDate"))} onChange={(e) => change("IndividualEmploymentDate", e.target.value || null)} /></Field>
          </> : <>
            <Field label={`${customerTypeLabel} Name`} help="Enter the legal name exactly as it appears on the registration documents."><Input value={read(customer, "NonIndividualDescription")} onChange={(e) => change("NonIndividualDescription", e.target.value)} /></Field>
            <Field label="Registration Number" help="The official registration number issued to the organisation or group."><Input value={read(customer, "NonIndividualRegistrationNumber")} onChange={(e) => change("NonIndividualRegistrationNumber", e.target.value)} /></Field>
            <Field label="Registration Serial" help="The registration certificate serial number, when issued separately."><Input value={read(customer, "NonIndividualRegistrationSerialNumber")} onChange={(e) => change("NonIndividualRegistrationSerialNumber", e.target.value)} /></Field>
            <Field label="Date Established" help="The legal establishment or incorporation date."><Input type="date" value={dateValue(read(customer, "NonIndividualDateEstablished"))} onChange={(e) => change("NonIndividualDateEstablished", e.target.value || null)} /></Field>
          </>}
          {customerType === 1 && <section className="md:col-span-2 rounded-xl border border-gray-200 bg-gray-50 p-4">
            <div className="mb-4 flex items-start justify-between gap-4">
              <div><h3 className="font-semibold text-gray-800">Partnership Members</h3><p className="text-sm text-gray-500">Add, edit, or remove the people registered as members of this partnership.</p></div>
              <FieldHelp label="Partnership members">At least one member is required. Mark members who are authorised to sign for the partnership as signatories.</FieldHelp>
            </div>
            {membersLoading ? <p className="text-sm text-gray-500">Loading partnership members…</p> : <>
              <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
                <Field label="Salutation"><EnumSelect value={memberDraft.Salutation} options={SALUTATIONS} onChange={(value) => changeMember("Salutation", value)} /></Field>
                <Field label="First Name"><Input value={memberDraft.FirstName} onChange={(event) => changeMember("FirstName", event.target.value)} /></Field>
                <Field label="Last Name"><Input value={memberDraft.LastName} onChange={(event) => changeMember("LastName", event.target.value)} /></Field>
                <Field label="Identity Type" help="The selected document type controls identity-number validation."><EnumSelect value={memberDraft.IdentityCardType} options={ID_TYPES} onChange={(value) => changeMember("IdentityCardType", value)} /></Field>
                <Field label="Identity Number" help="Enter the number exactly as it appears on the selected identity document."><Input value={memberDraft.IdentityCardNumber} maxLength={30} onChange={(event) => changeMember("IdentityCardNumber", event.target.value)} /></Field>
                <Field label="Gender"><EnumSelect value={memberDraft.Gender} options={GENDERS} onChange={(value) => changeMember("Gender", value)} /></Field>
                <Field label="Relationship"><EnumSelect value={memberDraft.Relationship} options={RELATIONSHIPS} onChange={(value) => changeMember("Relationship", value)} /></Field>
                <Field label="Mobile" help="Use international format beginning with + and the country code."><Input value={memberDraft.AddressMobileLine} onChange={(event) => changeMember("AddressMobileLine", event.target.value)} /></Field>
                <Field label="Email"><Input type="email" value={memberDraft.AddressEmail} onChange={(event) => changeMember("AddressEmail", event.target.value)} /></Field>
                <Field label="Remarks"><Input value={memberDraft.Remarks} onChange={(event) => changeMember("Remarks", event.target.value)} /></Field>
                <label className="flex items-center gap-2 pt-6 text-sm text-gray-700"><input type="checkbox" className="h-4 w-4 accent-indigo-600" checked={memberDraft.Signatory} onChange={(event) => changeMember("Signatory", event.target.checked)} /> Signatory</label>
              </div>
              <div className="mt-4 flex gap-2"><Button type="button" onClick={saveMemberDraft} className="bg-indigo-600 hover:bg-indigo-700">{editingMemberIndex === null ? <><FaPlus /> Add Member</> : <><FaEdit /> Save Member</>}</Button>{editingMemberIndex !== null && <Button type="button" variant="outline" onClick={cancelMemberEdit}>Cancel</Button>}</div>
              <div className="mt-4 space-y-2">{partnershipMembers.map((member, index) => <div key={member.Id || `${member.IdentityCardNumber}-${index}`} className="flex items-center gap-3 rounded-lg border bg-white p-3 shadow-sm"><div className="min-w-0 flex-1"><p className="truncate font-semibold text-gray-800">{member.FirstName} {member.LastName}</p><p className="text-xs text-gray-500">{ID_TYPES.find(([id]) => id === Number(member.IdentityCardType))?.[1] || "Identity"}: {member.IdentityCardNumber}{member.Signatory ? " · Signatory" : ""}</p></div><Button type="button" variant="outline" size="sm" disabled={editingMemberIndex !== null} onClick={() => editMember(member, index)}><FaEdit /> Edit</Button><Button type="button" variant="ghost" size="sm" aria-label={`Remove ${member.FirstName} ${member.LastName}`} onClick={() => { setPartnershipMembers((current) => current.filter((_, itemIndex) => itemIndex !== index)); if (editingMemberIndex === index) cancelMemberEdit(); }}><FaTrash className="text-red-600" /></Button></div>)}</div>
            </>}
          </section>}
          <Field label="KRA PIN" help="Use the 11-character format A123456789B. Spaces are removed and letters are saved in uppercase."><Input value={read(customer, "PersonalIdentificationNumber")} maxLength={11} onChange={(e) => change("PersonalIdentificationNumber", normalizeKraPin(e.target.value))} /></Field>
          <Field label="Email" help="The customer's primary email address. Account alerts configured for email delivery are sent to this address."><Input type="email" value={read(customer, "AddressEmail")} onChange={(e) => change("AddressEmail", e.target.value)} /></Field>
          <Field label="Mobile" help="The customer's primary mobile number in international format. SMS alerts use this number."><Input value={read(customer, "AddressMobileLine")} onChange={(e) => change("AddressMobileLine", e.target.value)} /></Field>
          <Field label="Address Line 1"><Input value={read(customer, "AddressAddressLine1")} onChange={(e) => change("AddressAddressLine1", e.target.value)} /></Field>
          <Field label="City"><Input value={read(customer, "AddressCity")} onChange={(e) => change("AddressCity", e.target.value)} /></Field>
          <Field label="Reference 1"><Input value={read(customer, "Reference1")} onChange={(e) => change("Reference1", e.target.value)} /></Field>
          <Field label="Remarks"><Input value={read(customer, "Remarks")} onChange={(e) => change("Remarks", e.target.value)} /></Field>
          <label className="flex items-center gap-2 text-sm text-gray-700"><input type="checkbox" className="w-4 h-4 accent-indigo-600" checked={Boolean(read(customer, "IsLocked"))} onChange={(e) => change("IsLocked", e.target.checked)} /> Locked</label>
          <label className="flex items-center gap-2 text-sm text-gray-700"><input type="checkbox" className="w-4 h-4 accent-indigo-600" checked={Boolean(read(customer, "InhibitGuaranteeing"))} onChange={(e) => change("InhibitGuaranteeing", e.target.checked)} /> Inhibit guaranteeing</label>
        </div>
        <div className="shrink-0 border-t p-4 flex justify-end"><Button disabled={saving} className="bg-indigo-600 hover:bg-indigo-700">{saving ? "Submitting…" : "Submit Changes"}</Button></div>
      </form>}
    </motion.div>
  </>}</AnimatePresence>;
}
