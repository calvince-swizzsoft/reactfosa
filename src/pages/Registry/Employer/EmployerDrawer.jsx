import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Swal from "sweetalert2";
import { FaTrash } from "react-icons/fa";
import { apiFetch } from "@/lib/api";

const FIN_BASE = `${import.meta.env.VITE_APP_FIN_URL}`;
const EMPLOYER_BASE = `${FIN_BASE}/api/registry/employer`;
const DIVISION_BASE = `${FIN_BASE}/api/registry/division`;

const EMPTY_DIVISION_ID = "00000000-0000-0000-0000-000000000000";

const emptyDetails = {
  Description: "",
  AddressAddressLine1: "",
  AddressAddressLine2: "",
  AddressStreet: "",
  AddressPostalCode: "",
  AddressCity: "",
  AddressEmail: "",
  AddressLandLine: "",
  AddressMobileLine: "",
  RetirementAge: 60,
  EnforceRetirementAge: false,
  IsLocked: false,
};

const TABS = [
  { id: "details", label: "Details" },
  { id: "divisions", label: "Divisions" },
];

function FieldGroup({ label, children }) {
  return (
    <div>
      <Label className="text-sm font-semibold text-gray-700">{label}</Label>
      {children}
    </div>
  );
}

export default function EmployerDrawer({ open, onClose, onSuccess, employer }) {
  const isEdit = Boolean(employer);
  const [activeTab, setActiveTab] = useState("details");
  const [details, setDetails] = useState(emptyDetails);
  const [divisions, setDivisions] = useState([]);
  const [divisionsDirty, setDivisionsDirty] = useState(false);
  const [newDivisionName, setNewDivisionName] = useState("");
  const [loading, setLoading] = useState(false);
  const [loadingData, setLoadingData] = useState(false);

  const normalizeList = (d) => {
    const payload = d?.data ?? d?.Data ?? d;
    if (Array.isArray(payload)) return payload;
    if (Array.isArray(payload?.PageCollection)) return payload.PageCollection;
    if (Array.isArray(payload?.pageCollection)) return payload.pageCollection;
    return [];
  };

  useEffect(() => {
    if (!open) return;
    setActiveTab("details");
    setNewDivisionName("");
    setDivisionsDirty(false);

    if (isEdit) {
      setLoadingData(true);
      const detailPromise = apiFetch(`${EMPLOYER_BASE}/${employer.Id}`).then((r) => r.json());
      const divisionsPromise = apiFetch(`${DIVISION_BASE}/by-employer/${employer.Id}`).then((r) => r.json());
      Promise.all([detailPromise, divisionsPromise])
        .then(([detailData, divisionData]) => {
          const detail = detailData?.Data ?? detailData?.data ?? detailData ?? {};
          setDetails({
            Description: detail.Description ?? employer.Description ?? "",
            AddressAddressLine1: detail.AddressAddressLine1 ?? "",
            AddressAddressLine2: detail.AddressAddressLine2 ?? "",
            AddressStreet: detail.AddressStreet ?? "",
            AddressPostalCode: detail.AddressPostalCode ?? "",
            AddressCity: detail.AddressCity ?? "",
            AddressEmail: detail.AddressEmail ?? "",
            AddressLandLine: detail.AddressLandLine ?? "",
            AddressMobileLine: detail.AddressMobileLine ?? "",
            RetirementAge: detail.RetirementAge ?? 60,
            EnforceRetirementAge: detail.EnforceRetirementAge ?? false,
            IsLocked: detail.IsLocked ?? false,
          });
          setDivisions(normalizeList(divisionData));
        })
        .catch(() => {
          setDetails({ ...emptyDetails, Description: employer.Description || "" });
          setDivisions([]);
        })
        .finally(() => setLoadingData(false));
    } else {
      setDetails(emptyDetails);
      setDivisions([]);
    }
  }, [open, isEdit, employer]);

  const handleDetailChange = (field, value) => setDetails((p) => ({ ...p, [field]: value }));

  const addDivision = () => {
    if (!newDivisionName.trim()) {
      Swal.fire("Missing Field", "Division name is required.", "warning");
      return;
    }
    setDivisions((prev) => [
      ...prev,
      { Id: EMPTY_DIVISION_ID, EmployerId: employer?.Id || "", Description: newDivisionName.trim() },
    ]);
    setNewDivisionName("");
    setDivisionsDirty(true);
  };

  const removeDivision = (index) => {
    setDivisions((prev) => prev.filter((_, i) => i !== index));
    setDivisionsDirty(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!details.Description) {
      Swal.fire("Missing Field", "Description is required.", "warning");
      return;
    }

    setLoading(true);
    try {
      if (isEdit) {
        const res = await apiFetch(`${EMPLOYER_BASE}/${employer.Id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ Id: employer.Id, ...details }),
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok || data.success === false) throw new Error(data.message || "Failed to update employer");

        // Only bulk-sync divisions if the user actually touched the tab —
        // PUT .../divisions removes anything omitted from the array, so
        // issuing it from an untouched copy risks silently dropping
        // divisions that were never loaded/rendered.
        if (divisionsDirty) {
          const divisionsRes = await apiFetch(`${EMPLOYER_BASE}/${employer.Id}/divisions`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(divisions),
          });
          const divisionsData = await divisionsRes.json().catch(() => ({}));
          if (!divisionsRes.ok || divisionsData.success === false) {
            throw new Error(divisionsData.message || "Failed to update divisions");
          }
        }

        Swal.fire("Success", "Employer updated successfully", "success");
      } else {
        const res = await apiFetch(EMPLOYER_BASE, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            Employer: details,
            Divisions: divisions.map((d) => d.Description),
          }),
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok || data.success === false) throw new Error(data.message || "Failed to create employer");
        Swal.fire("Success", "Employer created successfully", "success");
      }

      onSuccess();
      onClose();
    } catch (err) {
      Swal.fire("Error", err.message, "error");
    } finally {
      setLoading(false);
    }
  };

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
            className="fixed top-3 right-3 w-[80vw] max-w-[900px] h-[90vh] max-h-[90vh] bg-white shadow-2xl z-50 flex flex-col rounded-2xl overflow-hidden"
            initial={{ x: "100%" }} animate={{ x: 0 }} exit={{ x: "100%" }}
            transition={{ type: "spring", stiffness: 280, damping: 28 }}
          >
            <div className="p-4 flex justify-between items-center bg-indigo-700 rounded-2xl m-2 shrink-0">
              <h2 className="font-bold text-lg text-white">{isEdit ? "Edit Employer" : "New Employer"}</h2>
              <Button variant="outline" size="sm" onClick={onClose}>Close</Button>
            </div>

            <form onSubmit={handleSubmit} className="flex flex-col flex-1 overflow-hidden">
              <div className="grid grid-cols-12 gap-3 px-3 pt-2 pb-3 flex-1 overflow-hidden">
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
                    </div>
                  ))}
                </aside>

                <main className="col-span-9 overflow-y-auto pr-1">
                  {activeTab === "details" && (
                    <section className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <FieldGroup label="Description">
                          <Input value={details.Description} onChange={(e) => handleDetailChange("Description", e.target.value)} required placeholder="e.g. Acme Corp" />
                        </FieldGroup>
                        <FieldGroup label="Email">
                          <Input type="email" value={details.AddressEmail} onChange={(e) => handleDetailChange("AddressEmail", e.target.value)} placeholder="e.g. hr@acme.co.ke" />
                        </FieldGroup>
                        <FieldGroup label="Address Line 1">
                          <Input value={details.AddressAddressLine1} onChange={(e) => handleDetailChange("AddressAddressLine1", e.target.value)} placeholder="e.g. 123 Kimathi St" />
                        </FieldGroup>
                        <FieldGroup label="Address Line 2">
                          <Input value={details.AddressAddressLine2} onChange={(e) => handleDetailChange("AddressAddressLine2", e.target.value)} />
                        </FieldGroup>
                        <FieldGroup label="Street">
                          <Input value={details.AddressStreet} onChange={(e) => handleDetailChange("AddressStreet", e.target.value)} placeholder="e.g. Kimathi Street" />
                        </FieldGroup>
                        <FieldGroup label="City">
                          <Input value={details.AddressCity} onChange={(e) => handleDetailChange("AddressCity", e.target.value)} placeholder="e.g. Nairobi" />
                        </FieldGroup>
                        <FieldGroup label="Postal Code">
                          <Input value={details.AddressPostalCode} onChange={(e) => handleDetailChange("AddressPostalCode", e.target.value)} placeholder="e.g. 00100" />
                        </FieldGroup>
                        <FieldGroup label="Land Line">
                          <Input value={details.AddressLandLine} onChange={(e) => handleDetailChange("AddressLandLine", e.target.value)} placeholder="e.g. 020-12345" />
                        </FieldGroup>
                        <FieldGroup label="Mobile Line">
                          <Input value={details.AddressMobileLine} onChange={(e) => handleDetailChange("AddressMobileLine", e.target.value)} placeholder="e.g. 0712345678" />
                        </FieldGroup>
                        <FieldGroup label="Retirement Age">
                          <Input type="number" value={details.RetirementAge} onChange={(e) => handleDetailChange("RetirementAge", Number(e.target.value))} placeholder="e.g. 60" />
                        </FieldGroup>
                      </div>
                      <div className="flex items-center gap-4 pt-2">
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input type="checkbox" checked={details.EnforceRetirementAge} onChange={(e) => handleDetailChange("EnforceRetirementAge", e.target.checked)} className="w-4 h-4 accent-indigo-600" />
                          <span className="text-sm font-medium">Enforce Retirement Age</span>
                        </label>
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input type="checkbox" checked={details.IsLocked} onChange={(e) => handleDetailChange("IsLocked", e.target.checked)} className="w-4 h-4 accent-indigo-600" />
                          <span className="text-sm font-medium">Is Locked</span>
                        </label>
                      </div>
                    </section>
                  )}

                  {activeTab === "divisions" && (
                    <section className="space-y-4">
                      {loadingData ? (
                        <p className="text-sm text-gray-400">Loading divisions...</p>
                      ) : divisions.length === 0 ? (
                        <p className="text-sm text-gray-400">No divisions added yet.</p>
                      ) : (
                        <div className="divide-y rounded-lg border">
                          {divisions.map((d, index) => (
                            <div key={`${d.Id}-${index}`} className="flex items-center justify-between px-3 py-2.5">
                              <p className="text-sm font-medium text-gray-800">{d.Description}</p>
                              <Button type="button" variant="ghost" size="icon" onClick={() => removeDivision(index)}>
                                <FaTrash className="text-red-500" />
                              </Button>
                            </div>
                          ))}
                        </div>
                      )}

                      <div className="rounded-lg border p-4 bg-gray-50 space-y-3">
                        <p className="text-sm font-semibold text-gray-700">Add a Division</p>
                        <div className="flex gap-3">
                          <Input value={newDivisionName} onChange={(e) => setNewDivisionName(e.target.value)} placeholder="e.g. Nairobi Region" />
                          <Button type="button" onClick={addDivision} className="bg-indigo-600 hover:bg-indigo-700 shrink-0">
                            + Add
                          </Button>
                        </div>
                        {!isEdit && (
                          <p className="text-xs text-gray-400">
                            If you don't add any divisions, one named after the employer will be created automatically.
                          </p>
                        )}
                      </div>
                    </section>
                  )}
                </main>
              </div>

              <div className="px-5 py-3 border-t bg-gray-50 flex justify-end rounded-b-2xl shrink-0">
                <Button type="submit" disabled={loading || loadingData} className="bg-indigo-600 hover:bg-indigo-700">
                  {loading ? "Saving..." : isEdit ? "Save Changes" : "Create Employer"}
                </Button>
              </div>
            </form>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
