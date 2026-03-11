import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Swal from "sweetalert2";
import { Drawer } from "flowbite-react";

export default function AddInvJournalDrawer({ open, onClose, onSuccess }) {
  const [items, setItems] = useState([]);
  const [locations, setLocations] = useState([]);
  const [loading, setLoading] = useState(false);
  const [activeDropdown, setActiveDropdown] = useState(null);
  const [customEntryTypes, setCustomEntryTypes] = useState([]);
  const [newEntryType, setNewEntryType] = useState("");



    // static + dynamic entry types
    const entryTypeOptions = [
    { Id: "Purchase", Description: "Purchase" },
    { Id: "Sale", Description: "Sale" },
    { Id: "Adjustment+", Description: "Adjustment+" },
    { Id: "Adjustment-", Description: "Adjustment-" },
    { Id: "TransferIn", Description: "Transfer In" },
    { Id: "TransferOut", Description: "Transfer Out" },
    ...customEntryTypes.map((et) => ({
        Id: et,
        Description: et,
    })),
    ];


  const [form, setForm] = useState({
    PostingDate: new Date().toISOString().split("T")[0],
    EntryType: "Purchase",
    DocumentNo: "",
    ItemId: "",
    ItemNo: "",
    ItemName: "",
    ItemLocationId: "",
    Quantity: 1,
    CreatedBy: "Wyclif",
    CreatedDate: new Date().toISOString(),
    IsPosted: false,
    Status: "Draft",
  });

  useEffect(() => {
    if (open) {
      const fetchData = async () => {
        try {
          const [itemsRes, locRes] = await Promise.all([
            fetch(`${import.meta.env.VITE_APP_INV_URL}/api/items`, {
              headers: { "ngrok-skip-browser-warning": "true" },
            }).then((r) => r.json()),
            fetch(`${import.meta.env.VITE_APP_INV_URL}/api/locations`, {
              headers: { "ngrok-skip-browser-warning": "true" },
            }).then((r) => r.json()),
          ]);
          setItems(itemsRes.data || []);
          setLocations(locRes.data || []);
        } catch (err) {
          console.error("Failed fetching dropdowns", err);
        }
      };
      fetchData();
    }
  }, [open]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch(
        `${import.meta.env.VITE_APP_INV_URL}/api/itemjournals`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "ngrok-skip-browser-warning": "true",
          },
          body: JSON.stringify(form),
        }
      );
      const response = await res.json();
      if (!res.ok) throw new Error(response.message || "Failed to add journal");

      response.success && Swal.fire("Success", response.message, "success");
      if (onSuccess) onSuccess();
      onClose();
    } catch (err) {
      console.error(err);
      Swal.fire("Error", err.message || "Failed to add journal", "error");
    } finally {
      setLoading(false);
    }
  };

  const renderDropdown = (type, options, labelKey = "Description") => (
    <AnimatePresence>
      {activeDropdown === type && (
        <motion.div
          key={type}
          className="fixed top-40 w-72 max-h-100 right-132 bg-white shadow-xl z-50 p-4 overflow-y-auto border rounded-2xl"
          initial={{ x: "6%" }}
          animate={{ x: 0 }}
          exit={{ x: "3%" }}
          transition={{ type: "spring", stiffness: 300, damping: 30 }}
        >
          <div className="flex justify-between items-center mb-4 bg-indigo-600 p-2 rounded-2xl text-white">
            <h3 className="font-semibold capitalize">Select {type}</h3>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setActiveDropdown(null)}
            >
              ✕
            </Button>
          </div>
          <ul className="space-y-2 bg-gray-200 p-2 rounded-2xl">
            {options.map((opt) => (
              <li
                key={opt.Id}
                className="p-2 rounded-lg bg-white hover:bg-indigo-600 hover:text-white cursor-pointer"
                onClick={() => {
                    if (type === "item") {
                        setForm({
                        ...form,
                        ItemId: opt.Id,
                        ItemNo: opt.ItemNo,
                        ItemName: opt.Description,
                        });
                    } else if (type === "location") {
                        setForm({
                        ...form,
                        ItemLocationId: opt.Id,
                        });
                    } else if (type === "entrytype") {
                        setForm({
                        ...form,
                        EntryType: opt.Id, // since Id is the value (Purchase, Sale, etc.)
                        });
                    }
                    setActiveDropdown(null);
                    }}

              >
                {opt[labelKey] || opt.ItemNo}
                {type === "item" && ` - ${opt.Description}`}
              </li>
            ))}
            

          </ul>
        </motion.div>
      )}
    </AnimatePresence>
  );

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop */}
          <motion.div
            className="fixed inset-0 bg-black z-40"
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.4 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />

          {/* Drawer */}
          <motion.div
            className="fixed top-1 right-3 w-[500px] bg-white shadow-xl z-50 flex flex-col rounded-2xl p-4 h-[98%]"
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
          >
            {/* Header */}
            <div className="p-4 flex justify-between items-center bg-indigo-600 rounded-2xl">
              <h2 className="font-bold text-lg text-white">
                Add Inventory Journal
              </h2>
              <Button variant="outline" size="sm" onClick={onClose}>
                Close
              </Button>
            </div>

            {/* Form */}
            <form
              onSubmit={handleSubmit}
              className="p-4 space-y-3 overflow-y-auto relative"
            >
              <div>
                <Label>Document No</Label>
                <Input
                  value={form.DocumentNo}
                  onChange={(e) =>
                    setForm({ ...form, DocumentNo: e.target.value })
                  }
                  required
                />
              </div>

             <div>
                <Label>Entry Type</Label>
                <Button
                    type="button"
                    variant="outline"
                    className="w-full justify-between"
                    onClick={() => setActiveDropdown("entrytype")}
                    >
                    {form.EntryType || "Select Entry Type"}
                </Button>
             </div> 
            


              <div>
                <Label>Item</Label>
                <Button
                  type="button"
                  variant="outline"
                  className="w-full justify-between"
                  onClick={() =>
                    setActiveDropdown(activeDropdown === "item" ? null : "item")
                  }
                >
                  {items.find((i) => i.Id === form.ItemId)?.Description ||
                    "Select Item"}
                </Button>
              </div>

              <div>
                <Label>Location</Label>
                <Button
                  type="button"
                  variant="outline"
                  className="w-full justify-between"
                  onClick={() =>
                    setActiveDropdown(
                      activeDropdown === "location" ? null : "location"
                    )
                  }
                >
                  {locations.find((l) => l.Id === form.ItemLocationId)
                    ?.Description || "Select Location"}
                </Button>
              </div>

              <div>
                <Label>Quantity</Label>
                <Input
                  type="number"
                  value={form.Quantity}
                  onChange={(e) =>
                    setForm({ ...form, Quantity: Number(e.target.value) })
                  }
                  required
                />
              </div>

              <Button
                type="submit"
                disabled={loading}
                className="w-full bg-indigo-600 hover:bg-indigo-700"
              >
                {loading ? "Saving..." : "Save Journal"}
              </Button>
            </form>
          </motion.div>

          {/* Nested drawers */}
          {renderDropdown("entrytype", entryTypeOptions)}
          {renderDropdown("item", items, "ItemNo")}
          {renderDropdown("location", locations, "Description")}
        </>
      )}
    </AnimatePresence>
  );
}
