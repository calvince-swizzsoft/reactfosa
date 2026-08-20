import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import Swal from "sweetalert2";
import { FaSearch, FaUsers } from "react-icons/fa";
import { createDelegate, updateDelegate } from "./api";
import ZoneLookupModal from "./ZoneLookupModal";
import CustomerLookupModal from "../Documents/CustomerLookupModal";

function FieldGroup({ label, children }) {
  return (
    <div>
      <Label className="text-sm font-semibold text-gray-700">{label}</Label>
      {children}
    </div>
  );
}

const customerName = (item) =>
  [item.IndividualFirstName, item.IndividualLastName].filter(Boolean).join(" ") ||
  item.NonIndividualDescription ||
  item.Description ||
  "—";

export default function DelegateDrawer({ open, onClose, onSuccess, item }) {
  const [zone, setZone] = useState(null);
  const [customer, setCustomer] = useState(null);
  const [remarks, setRemarks] = useState("");
  const [isLocked, setIsLocked] = useState(false);
  const [saving, setSaving] = useState(false);
  const [zonePickerOpen, setZonePickerOpen] = useState(false);
  const [customerPickerOpen, setCustomerPickerOpen] = useState(false);

  useEffect(() => {
    if (!open) return;

    if (item) {
      setZone(item.ZoneId ? { Id: item.ZoneId, Description: item.ZoneDescription, EmployerDescription: item.ZoneDivisionEmployerDescription } : null);
      setCustomer(item.CustomerId ? { Id: item.CustomerId, IndividualFirstName: item.CustomerIndividualFirstName, IndividualLastName: item.CustomerIndividualLastName } : null);
      setRemarks(item.Remarks || "");
      setIsLocked(Boolean(item.IsLocked));
    } else {
      setZone(null);
      setCustomer(null);
      setRemarks("");
      setIsLocked(false);
    }
  }, [open, item]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!zone) {
      Swal.fire("Missing Field", "Look up and select the zone this delegate belongs to.", "warning");
      return;
    }
    if (!customer) {
      Swal.fire("Missing Field", "Look up and select the customer to register as a delegate.", "warning");
      return;
    }
    setSaving(true);
    try {
      if (item) {
        await updateDelegate(item.Id, { zoneId: zone.Id, customerId: customer.Id ?? customer.id, remarks, isLocked });
      } else {
        await createDelegate({ zoneId: zone.Id, customerId: customer.Id ?? customer.id, remarks });
      }
      Swal.fire("Success", `Delegate ${item ? "updated" : "created"} successfully.`, "success");
      onSuccess();
      onClose();
    } catch (err) {
      Swal.fire("Error", err.message, "error");
    } finally {
      setSaving(false);
    }
  };

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div className="fixed inset-0 bg-black z-40" initial={{ opacity: 0 }} animate={{ opacity: 0.4 }} exit={{ opacity: 0 }} onClick={onClose} />
          <motion.div className="fixed top-5 right-3 w-[420px] bg-white shadow-xl z-50 flex flex-col rounded-2xl p-3" initial={{ x: "100%" }} animate={{ x: 0 }} exit={{ x: "100%" }} transition={{ type: "spring", stiffness: 300, damping: 30 }}>
            <div className="p-4 flex justify-between items-center bg-indigo-600 rounded-2xl m-2">
              <h2 className="font-bold text-lg text-white flex items-center gap-2"><FaUsers /> {item ? "Edit" : "Add"} Delegate</h2>
              <Button variant="outline" size="sm" onClick={onClose}>Close</Button>
            </div>

            <form onSubmit={handleSubmit} className="p-4 space-y-4">
              {!item && (
                <p className="text-xs text-gray-400">Note: the customer selected below should already belong to the zone you pick.</p>
              )}

              <FieldGroup label="Zone">
                <button
                  type="button"
                  onClick={() => setZonePickerOpen(true)}
                  className="w-full flex items-center justify-between rounded-md border border-gray-300 py-2 px-3 text-sm text-left hover:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                >
                  <span className={zone ? "text-gray-800" : "text-gray-400"}>
                    {zone ? `${zone.Description}${zone.EmployerDescription ? ` (${zone.EmployerDescription})` : ""}` : "Look up zone..."}
                  </span>
                  <FaSearch className="text-gray-400" />
                </button>
              </FieldGroup>

              <FieldGroup label="Customer">
                <button
                  type="button"
                  onClick={() => setCustomerPickerOpen(true)}
                  className="w-full flex items-center justify-between rounded-md border border-gray-300 py-2 px-3 text-sm text-left hover:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                >
                  <span className={customer ? "text-gray-800" : "text-gray-400"}>
                    {customer ? customerName(customer) : "Look up customer..."}
                  </span>
                  <FaSearch className="text-gray-400" />
                </button>
              </FieldGroup>

              <FieldGroup label="Remarks">
                <Input value={remarks} onChange={(e) => setRemarks(e.target.value)} placeholder="Optional" />
              </FieldGroup>

              {item && (
                <label className="flex items-center gap-2 text-sm text-gray-700">
                  <input type="checkbox" className="w-4 h-4 accent-indigo-600" checked={isLocked} onChange={(e) => setIsLocked(e.target.checked)} /> Delegate is locked
                </label>
              )}

              <Button type="submit" disabled={saving} className="w-full bg-indigo-600 hover:bg-indigo-700">
                {saving ? "Saving..." : item ? "Update Delegate" : "Create Delegate"}
              </Button>
            </form>
          </motion.div>

          {zonePickerOpen && (
            <ZoneLookupModal onSelect={setZone} onClose={() => setZonePickerOpen(false)} />
          )}
          {customerPickerOpen && (
            <CustomerLookupModal onSelect={setCustomer} onClose={() => setCustomerPickerOpen(false)} />
          )}
        </>
      )}
    </AnimatePresence>
  );
}
