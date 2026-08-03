import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import Swal from "sweetalert2";
import { FaTrash } from "react-icons/fa";
import { apiFetch } from "@/lib/api";

const FIN_BASE = `${import.meta.env.VITE_APP_FIN_URL}`;
const ZONE_BASE = `${FIN_BASE}/api/registry/zone`;
const DIVISION_BASE = `${FIN_BASE}/api/registry/division`;

const EMPTY_STATION_ID = "00000000-0000-0000-0000-000000000000";

const emptyStationForm = {
  Description: "",
  AddressAddressLine1: "",
  AddressAddressLine2: "",
  AddressStreet: "",
  AddressPostalCode: "",
  AddressCity: "",
  AddressEmail: "",
  AddressLandLine: "",
  AddressMobileLine: "",
};

const emptyDetails = {
  DivisionId: "",
  Description: "",
};

const TABS = [
  { id: "details", label: "Details" },
  { id: "stations", label: "Stations" },
];

function FieldGroup({ label, children }) {
  return (
    <div>
      <Label className="text-sm font-semibold text-gray-700">{label}</Label>
      {children}
    </div>
  );
}

export default function ZoneDrawer({ open, onClose, onSuccess, zone }) {
  const isEdit = Boolean(zone);
  const [activeTab, setActiveTab] = useState("details");
  const [details, setDetails] = useState(emptyDetails);
  const [divisions, setDivisions] = useState([]);
  const [stations, setStations] = useState([]);
  const [stationsDirty, setStationsDirty] = useState(false);
  const [stationForm, setStationForm] = useState(emptyStationForm);
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
    setStationForm(emptyStationForm);
    setStationsDirty(false);
    setLoadingData(true);

    const divisionsPromise = apiFetch(`${DIVISION_BASE}/all`).then((r) => r.json());

    if (isEdit) {
      const detailPromise = apiFetch(`${ZONE_BASE}/${zone.Id}`).then((r) => r.json());
      const stationsPromise = apiFetch(`${ZONE_BASE}/${zone.Id}/stations`).then((r) => r.json());
      Promise.all([divisionsPromise, detailPromise, stationsPromise])
        .then(([divisionData, detailData, stationData]) => {
          setDivisions(normalizeList(divisionData));
          const detail = detailData?.Data ?? detailData?.data ?? detailData ?? {};
          setDetails({
            DivisionId: detail.DivisionId || zone.DivisionId || "",
            Description: detail.Description ?? zone.Description ?? "",
          });
          setStations(normalizeList(stationData));
        })
        .catch(() => {
          setDivisions([]);
          setDetails({ DivisionId: zone.DivisionId || "", Description: zone.Description || "" });
          setStations([]);
        })
        .finally(() => setLoadingData(false));
    } else {
      setDetails(emptyDetails);
      setStations([]);
      divisionsPromise
        .then((d) => setDivisions(normalizeList(d)))
        .catch(() => setDivisions([]))
        .finally(() => setLoadingData(false));
    }
  }, [open, isEdit, zone]);

  const handleDetailChange = (field, value) => setDetails((p) => ({ ...p, [field]: value }));
  const handleStationFieldChange = (field, value) => setStationForm((p) => ({ ...p, [field]: value }));

  const addStation = () => {
    if (!stationForm.Description) {
      Swal.fire("Missing Field", "Station description is required.", "warning");
      return;
    }
    setStations((prev) => [...prev, { Id: EMPTY_STATION_ID, ...stationForm }]);
    setStationForm(emptyStationForm);
    setStationsDirty(true);
  };

  const removeStation = (index) => {
    setStations((prev) => prev.filter((_, i) => i !== index));
    setStationsDirty(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!details.DivisionId || !details.Description) {
      Swal.fire("Missing Fields", "Division and Description are required.", "warning");
      return;
    }

    setLoading(true);
    try {
      if (isEdit) {
        const res = await apiFetch(`${ZONE_BASE}/${zone.Id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            Id: zone.Id,
            DivisionId: details.DivisionId,
            Description: details.Description,
          }),
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(data.message || "Failed to update zone");

        // Only replace the station list if the user actually touched the
        // Stations tab this session — PUT .../stations removes anything
        // omitted from the array, so issuing it from a possibly-incomplete
        // untouched copy would silently delete stations.
        if (stationsDirty) {
          const stationsRes = await apiFetch(`${ZONE_BASE}/${zone.Id}/stations`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(stations),
          });
          const stationsData = await stationsRes.json().catch(() => ({}));
          if (!stationsRes.ok) throw new Error(stationsData.message || "Failed to update zone stations");
        }

        Swal.fire("Success", "Zone updated successfully", "success");
      } else {
        const res = await apiFetch(ZONE_BASE, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            Zone: {
              DivisionId: details.DivisionId,
              Description: details.Description,
            },
            Stations: stations,
          }),
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(data.message || "Failed to create zone");
        Swal.fire("Success", "Zone created successfully", "success");
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
              <h2 className="font-bold text-lg text-white">{isEdit ? "Edit Zone" : "New Zone"}</h2>
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
                    <section className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FieldGroup label="Description">
                        <Input value={details.Description} onChange={(e) => handleDetailChange("Description", e.target.value)} required placeholder="e.g. North Zone" />
                      </FieldGroup>
                      <FieldGroup label="Division">
                        <Select value={details.DivisionId} onValueChange={(v) => handleDetailChange("DivisionId", v)} disabled={loadingData}>
                          <SelectTrigger><SelectValue placeholder={loadingData ? "Loading..." : "Select Division"} /></SelectTrigger>
                          <SelectContent className="max-h-60 overflow-y-auto">
                            {divisions.map((d) => (
                              <SelectItem key={d.Id} value={d.Id}>{d.Description}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </FieldGroup>
                    </section>
                  )}

                  {activeTab === "stations" && (
                    <section className="space-y-4">
                      {loadingData ? (
                        <p className="text-sm text-gray-400">Loading stations...</p>
                      ) : stations.length === 0 ? (
                        <p className="text-sm text-gray-400">No stations added yet.</p>
                      ) : (
                        <div className="divide-y rounded-lg border">
                          {stations.map((s, index) => (
                            <div key={`${s.Id}-${index}`} className="flex items-center justify-between px-3 py-2.5">
                              <div>
                                <p className="text-sm font-medium text-gray-800">{s.Description}</p>
                                <p className="text-xs text-gray-500">
                                  {[s.AddressCity, s.AddressMobileLine].filter(Boolean).join(" • ") || "—"}
                                </p>
                              </div>
                              <Button type="button" variant="ghost" size="icon" onClick={() => removeStation(index)}>
                                <FaTrash className="text-red-500" />
                              </Button>
                            </div>
                          ))}
                        </div>
                      )}

                      <div className="rounded-lg border p-4 bg-gray-50 space-y-3">
                        <p className="text-sm font-semibold text-gray-700">Add a Station</p>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          <FieldGroup label="Description">
                            <Input value={stationForm.Description} onChange={(e) => handleStationFieldChange("Description", e.target.value)} placeholder="e.g. North Zone Station 1" />
                          </FieldGroup>
                          <FieldGroup label="Mobile Line">
                            <Input value={stationForm.AddressMobileLine} onChange={(e) => handleStationFieldChange("AddressMobileLine", e.target.value)} placeholder="e.g. 0722000111" />
                          </FieldGroup>
                          <FieldGroup label="Address Line 1">
                            <Input value={stationForm.AddressAddressLine1} onChange={(e) => handleStationFieldChange("AddressAddressLine1", e.target.value)} placeholder="e.g. P.O. Box 123" />
                          </FieldGroup>
                          <FieldGroup label="Address Line 2">
                            <Input value={stationForm.AddressAddressLine2} onChange={(e) => handleStationFieldChange("AddressAddressLine2", e.target.value)} />
                          </FieldGroup>
                          <FieldGroup label="Street">
                            <Input value={stationForm.AddressStreet} onChange={(e) => handleStationFieldChange("AddressStreet", e.target.value)} placeholder="e.g. Main Street" />
                          </FieldGroup>
                          <FieldGroup label="City">
                            <Input value={stationForm.AddressCity} onChange={(e) => handleStationFieldChange("AddressCity", e.target.value)} placeholder="e.g. Nairobi" />
                          </FieldGroup>
                          <FieldGroup label="Postal Code">
                            <Input value={stationForm.AddressPostalCode} onChange={(e) => handleStationFieldChange("AddressPostalCode", e.target.value)} placeholder="e.g. 00100" />
                          </FieldGroup>
                          <FieldGroup label="Email">
                            <Input type="email" value={stationForm.AddressEmail} onChange={(e) => handleStationFieldChange("AddressEmail", e.target.value)} placeholder="e.g. station1@example.com" />
                          </FieldGroup>
                          <FieldGroup label="Land Line">
                            <Input value={stationForm.AddressLandLine} onChange={(e) => handleStationFieldChange("AddressLandLine", e.target.value)} placeholder="e.g. 0202223344" />
                          </FieldGroup>
                        </div>
                        <Button type="button" onClick={addStation} className="bg-indigo-600 hover:bg-indigo-700">
                          + Add Station
                        </Button>
                      </div>
                    </section>
                  )}
                </main>
              </div>

              <div className="px-5 py-3 border-t bg-gray-50 flex justify-end rounded-b-2xl shrink-0">
                <Button type="submit" disabled={loading || loadingData} className="bg-indigo-600 hover:bg-indigo-700">
                  {loading ? "Saving..." : isEdit ? "Save Changes" : "Create Zone"}
                </Button>
              </div>
            </form>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
