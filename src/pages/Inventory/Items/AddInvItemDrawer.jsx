

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Swal from "sweetalert2";

export default function AddInvItemDrawer({ open, onClose, onSuccess }) {
  const [formData, setFormData] = useState({
  itemId: "",
  itemNo: "",
  description: "",
  itemCategoryId: "",
  categoryDescription: "",
  unitOfMeasureId: "",
  unitOfMeasureDescription: "",
  locationId: "",
  locationDescription: "",
  inventoryBalance: 0,
  costingMethod: "Average",
});

  const [loading, setLoading] = useState(false);

  const [categories, setCategories] = useState([]);
  const [uoms, setUoms] = useState([]);
  const [locations, setLocations] = useState([]);

  const [activeDropdown, setActiveDropdown] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [catRes, uomRes, locRes] = await Promise.all([
          fetch(`${import.meta.env.VITE_APP_INV_URL}/api/categories`, {
            headers: { "ngrok-skip-browser-warning": "true" },
          }).then((r) => r.json()),
          fetch(`${import.meta.env.VITE_APP_INV_URL}/api/unit-of-measure`, {
            headers: { "ngrok-skip-browser-warning": "true" },
          }).then((r) => r.json()),
          fetch(`${import.meta.env.VITE_APP_INV_URL}/api/locations`, {
            headers: { "ngrok-skip-browser-warning": "true" },
          }).then((r) => r.json()),
        ]);
        setCategories(catRes.data || []);
        setUoms(uomRes.data || []);
        setLocations(locRes.data || []);
      } catch (err) {
        console.error("Failed fetching dropdowns", err);
      }
    };
    if (open) fetchData();
  }, [open]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch(`${import.meta.env.VITE_APP_INV_URL}/api/items`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "ngrok-skip-browser-warning": "true",
        },
        body: JSON.stringify(formData),
      });
      const response = await res.json();
      console.log('yes', response);
      if (!res.ok) throw new Error( response.message || "Failed to add item");
      response.success && Swal.fire("Success", response.message, "success");
      setFormData({
        itemId: "",
        itemNo: "",
        description: "",
        itemCategoryId: "",
        categoryDescription: "",
        unitOfMeasureId: "",
        unitOfMeasureDescription: "",
        locationId: "",
        locationDescription: "",
        inventoryBalance: 0,
        costingMethod: "Average",
      });
      if (onSuccess) onSuccess();
      onClose();
    } catch (err) {
      console.error(err);
      Swal.fire("Error", response.message || "Failed to add item.", "error");
    } finally {
      setLoading(false);
    }
  };

  const renderDropdown = (type, options, labelKey = "Description") => (
    <AnimatePresence>
      {activeDropdown === type && (
        <motion.div
          key={type}
          className="fixed top-80 w-72 max-h-100 right-132 bg-white shadow-xl z-50 p-4 overflow-y-auto border-r rounded-2xl"
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
                  if (type === "itemCategory") {
                    setFormData({
                      ...formData,
                      itemCategoryId: opt.Id,
                      categoryDescription: opt.Description,
                    });
                  } else if (type === "unitOfMeasure") {
                    setFormData({
                      ...formData,
                      unitOfMeasureId: opt.Id,
                      unitOfMeasureDescription: opt.Description,
                    });
                  } else if (type === "location") {
                    setFormData({
                      ...formData,
                      locationId: opt.Id,
                      locationDescription: opt.Description,
                    });
                  }
                  setActiveDropdown(null);
                }}

              >
                {opt[labelKey]}
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

          {/* Main Drawer */}
          <motion.div
            className="fixed top-1 right-3 w-[500px] bg-white shadow-xl z-50 flex flex-col rounded-2xl p-4 h-[98%]"
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
          >
            <div className="p-4 flex justify-between items-center bg-indigo-600 rounded-2xl">
              <h2 className="font-bold text-lg text-white">Add Item</h2>
              <Button variant="outline" size="sm" onClick={onClose}>
                Close
              </Button>
            </div>

            <form
              onSubmit={handleSubmit}
              className="p-4 space-y-3 overflow-y-auto relative"
            >
              {/* Text inputs */}
              <div>
                <Label>Item ID</Label>
                <Input
                  value={formData.itemId}
                  onChange={(e) =>
                    setFormData({ ...formData, itemId: e.target.value })
                  }
                  required
                />
              </div>
              <div>
                <Label>Item No</Label>
                <Input
                  value={formData.itemNo}
                  onChange={(e) =>
                    setFormData({ ...formData, itemNo: e.target.value })
                  }
                  required
                />
              </div>
              <div>
                <Label>Description</Label>
                <Input
                  value={formData.description}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                  required
                />
              </div>

              {/* Dropdown triggers */}
              <div>
                <Label>Category</Label>
                <Button
                  type="button"
                  variant="outline"
                  className="w-full justify-between"
                  onClick={() =>
                    setActiveDropdown(
                      activeDropdown === "itemCategory" ? null : "itemCategory"
                    )
                  }
                >
                  {categories.find((c) => c.Id === formData.itemCategoryId)
                    ?.Description || "Select Category"}
                </Button>
              </div>
              <div>
                <Label>Unit of Measure</Label>
                <Button
                  type="button"
                  variant="outline"
                  className="w-full justify-between"
                  onClick={() =>
                    setActiveDropdown(
                      activeDropdown === "unitOfMeasure"
                        ? null
                        : "unitOfMeasure"
                    )
                  }
                >
                  {uoms.find((u) => u.Id === formData.unitOfMeasureId)
                    ?.Description || "Select Unit"}
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
                  {locations.find((l) => l.Id === formData.locationId)
                    ?.Description || "Select Location"}
                </Button>
              </div>

              <div>
                <Label>Quantity</Label>
                <Input
                  type="number"
                  disabled
                  value={formData.inventoryBalance}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      inventoryBalance: Number(e.target.value),
                    })
                  }
                />
              </div>

              <Button
                type="submit"
                disabled={loading}
                className="w-full bg-indigo-600 hover:bg-indigo-700"
              >
                {loading ? "Saving..." : "Save Item"}
              </Button>
            </form>
          </motion.div>

          {/* Left-side nested drawer */}
          {renderDropdown("itemCategory", categories)}
          {renderDropdown("unitOfMeasure", uoms)}
          {renderDropdown("location", locations)}
        </>
      )}
    </AnimatePresence>
  );
}
