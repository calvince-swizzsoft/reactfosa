import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import Swal from "sweetalert2";
import { apiFetch } from "@/lib/api";

const FIN_BASE = `${import.meta.env.VITE_APP_FIN_URL}`;
const STATION_BASE = `${FIN_BASE}/api/registry/station`;

const salutationOptions = [
  { value: 1, label: "Mr" },
  { value: 2, label: "Mrs" },
  { value: 3, label: "Miss" },
  { value: 4, label: "Dr" },
  { value: 5, label: "Prof" },
  { value: 6, label: "Rev" },
  { value: 7, label: "Eng" },
  { value: 8, label: "Hon" },
];

const genderOptions = [
  { value: 1, label: "Male" },
  { value: 2, label: "Female" },
  { value: 3, label: "Non-Binary" },
];

const maritalStatusOptions = [
  { value: 1, label: "Married" },
  { value: 2, label: "Single" },
  { value: 3, label: "Divorced" },
  { value: 4, label: "Separated" },
];

const identityCardTypeOptions = [
  { value: 1, label: "National ID" },
  { value: 2, label: "Passport" },
  { value: 3, label: "Alien ID" },
  { value: 4, label: "Birth Certificate" },
];

const classificationOptions = [
  { value: 1, label: "Class A" },
  { value: 2, label: "Class B" },
];

const individualTypeOptions = [
  { value: 0, label: "Adult" },
  { value: 1, label: "Minor" },
];

// Individual particulars/address/referees/investment products/savings
// products are wired up — Credit Types, Debit Types, Specimen, and Capture
// Specimen remain stubbed (matching the full tab set from the reference
// screenshot). See TODO.md for what's left.
const TABS = [
  { id: "individual", label: "Individual Particulars", stub: false },
  { id: "address", label: "Address", stub: false },
  { id: "referees", label: "Referees", stub: false },
  { id: "creditTypes", label: "Credit Types", stub: true },
  { id: "debitTypes", label: "Debit Types", stub: true },
  { id: "investmentProducts", label: "Investment Products", stub: false },
  { id: "savingsProducts", label: "Savings Products", stub: false },
  { id: "specimen", label: "Specimen", stub: true },
  { id: "captureSpecimen", label: "Capture Specimen", stub: true },
];

const emptyForm = {
  branchId: "",
  stationId: "",
  personalIdentificationNumber: "",
  individualType: 0,
  individualFirstName: "",
  individualLastName: "",
  individualIdentityCardType: 1,
  individualIdentityCardNumber: "",
  individualIdentityCardSerialNumber: "",
  individualPayrollNumbers: "",
  individualSalutation: 1,
  individualGender: 1,
  individualMaritalStatus: 1,
  individualNationality: "",
  individualBirthDate: "",
  individualEmploymentDesignation: "",
  individualEmploymentDate: "",
  individualClassification: 1,
  bankName: "",
  branchName: "",
  addressAddressLine1: "",
  addressAddressLine2: "",
  addressStreet: "",
  addressPostalCode: "",
  addressCity: "",
  addressEmail: "",
  addressLandLine: "",
  addressMobileLine: "",
  reference1: "",
  reference2: "",
  reference3: "",
  remarks: "",
  isDefaulter: false,
  isLocked: false,
  inhibitGuaranteeing: false,
};

function FieldGroup({ label, children }) {
  return (
    <div>
      <Label className="text-sm font-semibold text-gray-700">{label}</Label>
      {children}
    </div>
  );
}

function EnumSelect({ value, options, onChange }) {
  return (
    <Select value={String(value)} onValueChange={(v) => onChange(Number(v))}>
      <SelectTrigger><SelectValue /></SelectTrigger>
      <SelectContent>
        {options.map((o) => (
          <SelectItem key={o.value} value={String(o.value)}>{o.label}</SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

export default function CreateCustomerDrawer({ open, onClose, onSuccess }) {
  const [form, setForm] = useState(emptyForm);
  const [activeTab, setActiveTab] = useState("individual");
  const [loading, setLoading] = useState(false);
  const [loadingData, setLoadingData] = useState(false);
  const [branches, setBranches] = useState([]);
  const [stations, setStations] = useState([]);
  const [investmentProducts, setInvestmentProducts] = useState([]);
  const [savingsProducts, setSavingsProducts] = useState([]);
  const [selectedInvestmentProductIds, setSelectedInvestmentProductIds] = useState([]);
  const [selectedSavingsProductIds, setSelectedSavingsProductIds] = useState([]);

  // Handles both the plain shapes ({data:[...]} / {Data:[...]} / bare
  // array) used by branches/investment-products/savings-products, and the
  // paged Registry envelope (data.PageCollection, alongside
  // PageIndex/PageSize/ItemsCount/TotalCount/TotalPages) used by stations.
  const normalizeList = (d) => {
    const payload = d?.data ?? d?.Data ?? d;
    if (Array.isArray(payload)) return payload;
    if (Array.isArray(payload?.PageCollection)) return payload.PageCollection;
    if (Array.isArray(payload?.pageCollection)) return payload.pageCollection;
    return [];
  };

  useEffect(() => {
    if (!open) return;
    setForm(emptyForm);
    setActiveTab("individual");
    setSelectedInvestmentProductIds([]);
    setSelectedSavingsProductIds([]);
    setLoadingData(true);
    Promise.all([
      apiFetch(`${FIN_BASE}/api/administration/branches`).then((r) => r.json()),
      apiFetch(`${STATION_BASE}?pageIndex=0&pageSize=1000&text=`).then((r) => r.json()),
      apiFetch(`${FIN_BASE}/api/accounts/investmentsproducts`).then((r) => r.json()),
      apiFetch(`${FIN_BASE}/api/accounts/savingsproducts`).then((r) => r.json()),
    ]).then(([branchData, stationData, investmentData, savingsData]) => {
      setBranches(normalizeList(branchData));
      setStations(normalizeList(stationData));
      setInvestmentProducts(normalizeList(investmentData));
      setSavingsProducts(normalizeList(savingsData));
    }).catch(() => { }).finally(() => setLoadingData(false));
  }, [open]);

  const handleChange = (field, value) => setForm((p) => ({ ...p, [field]: value }));

  const toggleSelection = (setter, id) =>
    setter((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));

  const toIsoOrNull = (dateStr) => (dateStr ? new Date(dateStr).toISOString() : null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.individualFirstName || !form.individualLastName || !form.individualIdentityCardNumber) {
      Swal.fire("Missing Fields", "First name, last name, and identity card number are required.", "warning");
      return;
    }
    if (!form.branchId || !form.stationId) {
      Swal.fire("Missing Fields", "Branch and Station are required.", "warning");
      return;
    }

    setLoading(true);
    try {
      const today = new Date().toISOString();
      const payload = {
        Customer: {
          BranchId: form.branchId,
          Type: 0,
          PersonalIdentificationNumber: form.personalIdentificationNumber,
          IndividualType: Number(form.individualType),
          IndividualFirstName: form.individualFirstName,
          IndividualLastName: form.individualLastName,
          IndividualIdentityCardType: Number(form.individualIdentityCardType),
          IndividualIdentityCardNumber: form.individualIdentityCardNumber,
          IndividualIdentityCardSerialNumber: form.individualIdentityCardSerialNumber,
          IndividualPayrollNumbers: form.individualPayrollNumbers,
          IndividualSalutation: Number(form.individualSalutation),
          IndividualGender: Number(form.individualGender),
          IndividualMaritalStatus: Number(form.individualMaritalStatus),
          IndividualNationality: Number(form.individualNationality) || 0,
          IndividualBirthDate: toIsoOrNull(form.individualBirthDate),
          DurationStartDate: today,
          DurationEndDate: today,
          IndividualEmploymentDesignation: form.individualEmploymentDesignation,
          IndividualEmploymentDate: toIsoOrNull(form.individualEmploymentDate),
          IndividualClassification: Number(form.individualClassification),
          BankName: form.bankName,
          BranchName: form.branchName,
          AddressAddressLine1: form.addressAddressLine1,
          AddressAddressLine2: form.addressAddressLine2,
          AddressStreet: form.addressStreet,
          AddressPostalCode: form.addressPostalCode,
          AddressCity: form.addressCity,
          AddressEmail: form.addressEmail,
          AddressLandLine: form.addressLandLine,
          AddressMobileLine: form.addressMobileLine,
          StationId: form.stationId,
          Reference1: form.reference1,
          Reference2: form.reference2,
          Reference3: form.reference3,
          Remarks: form.remarks,
          IsDefaulter: form.isDefaulter,
          IsLocked: form.isLocked,
          InhibitGuaranteeing: form.inhibitGuaranteeing,
          RecordStatus: 0,
        },
        MandatoryDebitTypes: [],
        MandatoryInvestmentProducts: investmentProducts.filter((p) => selectedInvestmentProductIds.includes(p.Id)),
        MandatorySavingsProducts: savingsProducts.filter((p) => selectedSavingsProductIds.includes(p.Id)),
        MandatoryProducts: {
          InvestmentProductCollection: [],
          SavingsProductCollection: [],
        },
        ModuleNavigationItemCode: 0,
      };

      const res = await apiFetch(`${FIN_BASE}/api/registry/customer`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.message || "Failed to create customer");
      Swal.fire("Success", data.message || "Customer created successfully", "success");
      setForm(emptyForm);
      onSuccess();
      onClose();
    } catch (err) {
      Swal.fire("Error", err.message, "error");
    } finally {
      setLoading(false);
    }
  };

  const activeTabMeta = TABS.find((t) => t.id === activeTab);

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            className="fixed inset-0 bg-black z-40"
            initial={{ opacity: 0 }} animate={{ opacity: 0.4 }} exit={{ opacity: 0 }}
            onClick={onClose}
          />
          <motion.div
            className="fixed top-3 right-3 w-[85vw] max-w-[1150px] h-[94vh] max-h-[94vh] bg-white shadow-2xl z-50 flex flex-col rounded-2xl overflow-hidden"
            initial={{ x: "100%" }} animate={{ x: 0 }} exit={{ x: "100%" }}
            transition={{ type: "spring", stiffness: 280, damping: 28 }}
          >
            <div className="p-4 flex justify-between items-center bg-indigo-700 rounded-2xl m-2 shrink-0">
              <h2 className="font-bold text-lg text-white">New Customer — Individual</h2>
              <Button variant="outline" size="sm" onClick={onClose}>Close</Button>
            </div>

            <form onSubmit={handleSubmit} className="flex flex-col flex-1 overflow-hidden">
              {/* Header fields — always visible above the tabs */}
              <div className="px-5 pt-2 pb-4 grid grid-cols-1 md:grid-cols-3 gap-4 shrink-0">
                <FieldGroup label="Customer Type">
                  <div className="rounded-md border border-input bg-gray-100 px-3 py-2 text-sm text-gray-700">Individual</div>
                  <p className="mt-1 text-xs text-gray-400">Partnership and MicroCredit are coming soon.</p>
                </FieldGroup>
                <FieldGroup label="Branch">
                  <Select value={form.branchId} onValueChange={(v) => handleChange("branchId", v)} disabled={loadingData}>
                    <SelectTrigger><SelectValue placeholder={loadingData ? "Loading..." : "Select Branch"} /></SelectTrigger>
                    <SelectContent className="max-h-60 overflow-y-auto">
                      {branches.map((b) => (
                        <SelectItem key={b.Id} value={b.Id}>{b.Description}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </FieldGroup>
                <FieldGroup label="Station">
                  <Select value={form.stationId} onValueChange={(v) => handleChange("stationId", v)} disabled={loadingData}>
                    <SelectTrigger><SelectValue placeholder={loadingData ? "Loading..." : "Select Station"} /></SelectTrigger>
                    <SelectContent className="max-h-60 overflow-y-auto">
                      {stations.map((s) => (
                        <SelectItem key={s.Id} value={s.Id}>{s.Description}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </FieldGroup>
              </div>

              <div className="grid grid-cols-12 gap-3 px-3 pb-3 flex-1 overflow-hidden">
                <aside className="col-span-3 bg-gray-200 p-3 rounded-lg overflow-y-auto">
                  {TABS.map((tab) => (
                    <div
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={`p-3 mb-2 rounded-md cursor-pointer border text-sm font-medium transition-colors ${activeTab === tab.id
                        ? "bg-indigo-700 border-indigo-500 text-white"
                        : "bg-white border-transparent hover:bg-gray-100 text-gray-700"
                        }`}
                    >
                      {tab.label}
                      {tab.stub && <span className="block text-xs opacity-70 mt-0.5">Coming soon</span>}
                    </div>
                  ))}
                </aside>

                <main className="col-span-9 overflow-y-auto pr-1">
                  {activeTab === "individual" && (
                    <section className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <FieldGroup label="First Name">
                          <Input value={form.individualFirstName} onChange={(e) => handleChange("individualFirstName", e.target.value)} required placeholder="e.g. John" />
                        </FieldGroup>
                        <FieldGroup label="Last Name">
                          <Input value={form.individualLastName} onChange={(e) => handleChange("individualLastName", e.target.value)} required placeholder="e.g. Doe" />
                        </FieldGroup>
                        <FieldGroup label="Salutation">
                          <EnumSelect value={form.individualSalutation} options={salutationOptions} onChange={(v) => handleChange("individualSalutation", v)} />
                        </FieldGroup>
                        <FieldGroup label="Gender">
                          <EnumSelect value={form.individualGender} options={genderOptions} onChange={(v) => handleChange("individualGender", v)} />
                        </FieldGroup>
                        <FieldGroup label="Marital Status">
                          <EnumSelect value={form.individualMaritalStatus} options={maritalStatusOptions} onChange={(v) => handleChange("individualMaritalStatus", v)} />
                        </FieldGroup>
                        <FieldGroup label="Nationality (code)">
                          <Input type="number" value={form.individualNationality} onChange={(e) => handleChange("individualNationality", e.target.value)} placeholder="e.g. 1" />
                        </FieldGroup>
                        <FieldGroup label="Individual Type">
                          <EnumSelect value={form.individualType} options={individualTypeOptions} onChange={(v) => handleChange("individualType", v)} />
                        </FieldGroup>
                        <FieldGroup label="Classification">
                          <EnumSelect value={form.individualClassification} options={classificationOptions} onChange={(v) => handleChange("individualClassification", v)} />
                        </FieldGroup>
                        <FieldGroup label="Birth Date">
                          <Input type="date" value={form.individualBirthDate} onChange={(e) => handleChange("individualBirthDate", e.target.value)} />
                        </FieldGroup>
                        <FieldGroup label="Identity Card Type">
                          <EnumSelect value={form.individualIdentityCardType} options={identityCardTypeOptions} onChange={(v) => handleChange("individualIdentityCardType", v)} />
                        </FieldGroup>
                        <FieldGroup label="Identity Card Number">
                          <Input value={form.individualIdentityCardNumber} onChange={(e) => handleChange("individualIdentityCardNumber", e.target.value)} required placeholder="e.g. 12345678" />
                        </FieldGroup>
                        <FieldGroup label="Identity Card Serial Number">
                          <Input value={form.individualIdentityCardSerialNumber} onChange={(e) => handleChange("individualIdentityCardSerialNumber", e.target.value)} placeholder="e.g. SN001" />
                        </FieldGroup>
                        <FieldGroup label="Personal Identification # (KRA PIN)">
                          <Input value={form.personalIdentificationNumber} onChange={(e) => handleChange("personalIdentificationNumber", e.target.value)} placeholder="e.g. PIN12345678" />
                        </FieldGroup>
                        <FieldGroup label="Payroll Numbers">
                          <Input value={form.individualPayrollNumbers} onChange={(e) => handleChange("individualPayrollNumbers", e.target.value)} />
                        </FieldGroup>
                        <FieldGroup label="Employment Designation">
                          <Input value={form.individualEmploymentDesignation} onChange={(e) => handleChange("individualEmploymentDesignation", e.target.value)} placeholder="e.g. Accountant" />
                        </FieldGroup>
                        <FieldGroup label="Employment Date">
                          <Input type="date" value={form.individualEmploymentDate} onChange={(e) => handleChange("individualEmploymentDate", e.target.value)} />
                        </FieldGroup>
                        <FieldGroup label="Bank Name">
                          <Input value={form.bankName} onChange={(e) => handleChange("bankName", e.target.value)} placeholder="e.g. KCB" />
                        </FieldGroup>
                        <FieldGroup label="Bank Branch">
                          <Input value={form.branchName} onChange={(e) => handleChange("branchName", e.target.value)} placeholder="e.g. Nairobi Branch" />
                        </FieldGroup>
                      </div>
                      <FieldGroup label="Remarks">
                        <Input value={form.remarks} onChange={(e) => handleChange("remarks", e.target.value)} placeholder="Enter remarks" />
                      </FieldGroup>
                      <div className="flex items-center gap-4 pt-2">
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input type="checkbox" checked={form.isDefaulter} onChange={(e) => handleChange("isDefaulter", e.target.checked)} className="w-4 h-4 accent-indigo-600" />
                          <span className="text-sm font-medium">Is Defaulter</span>
                        </label>
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input type="checkbox" checked={form.isLocked} onChange={(e) => handleChange("isLocked", e.target.checked)} className="w-4 h-4 accent-indigo-600" />
                          <span className="text-sm font-medium">Is Locked</span>
                        </label>
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input type="checkbox" checked={form.inhibitGuaranteeing} onChange={(e) => handleChange("inhibitGuaranteeing", e.target.checked)} className="w-4 h-4 accent-indigo-600" />
                          <span className="text-sm font-medium">Inhibit Guaranteeing</span>
                        </label>
                      </div>
                    </section>
                  )}

                  {activeTab === "address" && (
                    <section className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FieldGroup label="Address Line 1">
                        <Input value={form.addressAddressLine1} onChange={(e) => handleChange("addressAddressLine1", e.target.value)} placeholder="e.g. P.O. Box 1234" />
                      </FieldGroup>
                      <FieldGroup label="Address Line 2">
                        <Input value={form.addressAddressLine2} onChange={(e) => handleChange("addressAddressLine2", e.target.value)} />
                      </FieldGroup>
                      <FieldGroup label="Street">
                        <Input value={form.addressStreet} onChange={(e) => handleChange("addressStreet", e.target.value)} placeholder="e.g. Moi Avenue" />
                      </FieldGroup>
                      <FieldGroup label="City">
                        <Input value={form.addressCity} onChange={(e) => handleChange("addressCity", e.target.value)} placeholder="e.g. Nairobi" />
                      </FieldGroup>
                      <FieldGroup label="Postal Code">
                        <Input value={form.addressPostalCode} onChange={(e) => handleChange("addressPostalCode", e.target.value)} placeholder="e.g. 00100" />
                      </FieldGroup>
                      <FieldGroup label="Email">
                        <Input type="email" value={form.addressEmail} onChange={(e) => handleChange("addressEmail", e.target.value)} placeholder="e.g. john.doe@example.com" />
                      </FieldGroup>
                      <FieldGroup label="Mobile Line">
                        <Input value={form.addressMobileLine} onChange={(e) => handleChange("addressMobileLine", e.target.value)} placeholder="e.g. 0712345678" />
                      </FieldGroup>
                      <FieldGroup label="Land Line">
                        <Input value={form.addressLandLine} onChange={(e) => handleChange("addressLandLine", e.target.value)} />
                      </FieldGroup>
                    </section>
                  )}

                  {activeTab === "referees" && (
                    <section className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <FieldGroup label="Reference 1">
                        <Input value={form.reference1} onChange={(e) => handleChange("reference1", e.target.value)} />
                      </FieldGroup>
                      <FieldGroup label="Reference 2">
                        <Input value={form.reference2} onChange={(e) => handleChange("reference2", e.target.value)} />
                      </FieldGroup>
                      <FieldGroup label="Reference 3">
                        <Input value={form.reference3} onChange={(e) => handleChange("reference3", e.target.value)} />
                      </FieldGroup>
                    </section>
                  )}

                  {activeTab === "investmentProducts" && (
                    <section>
                      <p className="text-sm text-gray-500 mb-3">Select the investment products this customer should be enrolled in.</p>
                      {loadingData ? (
                        <p className="text-sm text-gray-400">Loading investment products...</p>
                      ) : investmentProducts.length === 0 ? (
                        <p className="text-sm text-gray-400">No investment products available.</p>
                      ) : (
                        <div className="divide-y rounded-lg border">
                          {investmentProducts.map((p) => (
                            <label key={p.Id} className="flex items-center gap-2 px-3 py-2.5 cursor-pointer hover:bg-gray-50">
                              <input
                                type="checkbox"
                                checked={selectedInvestmentProductIds.includes(p.Id)}
                                onChange={() => toggleSelection(setSelectedInvestmentProductIds, p.Id)}
                                className="w-4 h-4 accent-indigo-600"
                              />
                              <span className="text-sm text-gray-700">{p.Description}</span>
                            </label>
                          ))}
                        </div>
                      )}
                    </section>
                  )}

                  {activeTab === "savingsProducts" && (
                    <section>
                      <p className="text-sm text-gray-500 mb-3">Select the savings products this customer should be enrolled in.</p>
                      {loadingData ? (
                        <p className="text-sm text-gray-400">Loading savings products...</p>
                      ) : savingsProducts.length === 0 ? (
                        <p className="text-sm text-gray-400">No savings products available.</p>
                      ) : (
                        <div className="divide-y rounded-lg border">
                          {savingsProducts.map((p) => (
                            <label key={p.Id} className="flex items-center gap-2 px-3 py-2.5 cursor-pointer hover:bg-gray-50">
                              <input
                                type="checkbox"
                                checked={selectedSavingsProductIds.includes(p.Id)}
                                onChange={() => toggleSelection(setSelectedSavingsProductIds, p.Id)}
                                className="w-4 h-4 accent-indigo-600"
                              />
                              <span className="text-sm text-gray-700">{p.Description}</span>
                            </label>
                          ))}
                        </div>
                      )}
                    </section>
                  )}

                  {activeTabMeta?.stub && (
                    <div className="flex items-center justify-center h-64 text-gray-400 text-sm">
                      This section isn't wired up yet — coming soon.
                    </div>
                  )}
                </main>
              </div>

              <div className="px-5 py-3 border-t bg-gray-50 flex justify-end rounded-b-2xl shrink-0">
                <Button type="submit" disabled={loading || loadingData} className="bg-indigo-600 hover:bg-indigo-700">
                  {loading ? "Saving..." : "Create Customer"}
                </Button>
              </div>
            </form>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
