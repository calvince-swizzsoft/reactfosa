import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import Swal from "sweetalert2";
import { IoIosArrowDropleftCircle } from "react-icons/io";

export default function EditInvVendorDrawer({ open, onClose, onSuccess, vendor }) {
  const [formData, setFormData] = useState({
    VendorId: "",
    VendorCode: "",
    VendorName: "",
    TaxId: "",
    Address: "",
    Phone: "",
    Email: "",
    IsActive: true,
    BankDetails: [],
  });

  const [loading, setLoading] = useState(false);
  const [bankDrawerOpen, setBankDrawerOpen] = useState(false);

  // Track which bank is open
  const [expandedIndex, setExpandedIndex] = useState(null);

  useEffect(() => {
    if (vendor) {
      setFormData({
        VendorId: vendor.VendorId,
        VendorCode: vendor.VendorCode,
        VendorName: vendor.VendorName,
        TaxId: vendor.TaxId,
        Address: vendor.Address,
        Phone: vendor.Phone,
        Email: vendor.Email,
        IsActive: vendor.IsActive,
        BankDetails: vendor.BankDetails || [],
      });
    }
  }, [vendor]);

  const handleBankChange = (index, field, value) => {
    const updatedBanks = [...formData.BankDetails];
    updatedBanks[index] = { ...updatedBanks[index], [field]: value };
    setFormData({ ...formData, BankDetails: updatedBanks });
  };

  const addBankDetail = () => {
    const newBank = {
      VendorBankId: 0,
      VendorId: formData.VendorId,
      BankName: "",
      AccountNumber: "",
      Branch: "",
      Currency: "",
      IsPrimary: false,
    };

    setFormData({
      ...formData,
      BankDetails: [...formData.BankDetails, newBank],
    });

    // Collapse previous and expand the new one
    setExpandedIndex(formData.BankDetails.length);
  };

  const removeBankDetail = (index) => {
    const updatedBanks = [...formData.BankDetails];
    updatedBanks.splice(index, 1);
    setFormData({ ...formData, BankDetails: updatedBanks });

    if (expandedIndex === index) {
      setExpandedIndex(null);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await fetch(
        `${import.meta.env.VITE_APP_PRO_URL}/api/vendors/${vendor.VendorId}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            "ngrok-skip-browser-warning": "true",
          },
          body: JSON.stringify(formData), // ✅ send everything at once
        }
      );

      if (!res.ok) throw new Error("Failed to update vendor");

      Swal.fire("Success", "Vendor updated successfully!", "success");
      if (onSuccess) onSuccess();
      onClose();
    } catch (err) {
      console.error(err);
      Swal.fire("Error", "Failed to update vendor.", "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AnimatePresence>
      {open && vendor && (
        <>
          {/* Overlay */}
          <motion.div
            className="fixed inset-0 bg-black z-40"
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.4 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />

          {/* Right Drawer - Vendor Info */}
          <motion.div
            className="fixed top-5 right-5 w-[550px] max-h-[95vh] bg-white shadow-xl z-50 flex flex-col rounded-2xl p-3 overflow-hidden"
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
          >
            <div className="p-4 flex justify-between items-center bg-indigo-600 rounded-2xl m-2">
              <h2 className="font-bold text-lg text-white">Edit Vendor</h2>
              <Button variant="outline" size="sm" onClick={onClose}>
                Close
              </Button>
            </div>

            <div className="p-3 flex-1 overflow-y-auto">
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <Label>Vendor Name</Label>
                  <Input
                  className="bg-white border-2 border-gray-300"
                    value={formData.VendorName}
                    onChange={(e) =>
                      setFormData({ ...formData, VendorName: e.target.value })
                    }
                    required
                  />
                </div>
                <div>
                  <Label>Vendor Code</Label>
                  <Input
                  className="bg-white border-2 border-gray-300"
                    value={formData.VendorCode}
                    onChange={(e) =>
                      setFormData({ ...formData, VendorCode: e.target.value })
                    }
                    required
                  />
                </div>
                <div>
                  <Label>Tax ID</Label>
                  <Input
                  className="bg-white border-2 border-gray-300"
                    value={formData.TaxId}
                    onChange={(e) =>
                      setFormData({ ...formData, TaxId: e.target.value })
                    }
                  />
                </div>
                <div>
                  <Label>Address</Label>
                  <Input
                  className="bg-white border-2 border-gray-300"
                    value={formData.Address}
                    onChange={(e) =>
                      setFormData({ ...formData, Address: e.target.value })
                    }
                  />
                </div>
                <div>
                  <Label>Phone</Label>
                  <Input
                  className="bg-white border-2 border-gray-300"
                    value={formData.Phone}
                    onChange={(e) =>
                      setFormData({ ...formData, Phone: e.target.value })
                    }
                  />
                </div>
                <div>
                  <Label>Email</Label>
                  <Input
                  className="bg-white border-2 border-gray-300"
                    type="email"
                    value={formData.Email}
                    onChange={(e) =>
                      setFormData({ ...formData, Email: e.target.value })
                    }
                  />
                </div>
                <div className="flex items-center gap-2">
                  <Checkbox
                    checked={formData.IsActive}
                    onCheckedChange={(checked) =>
                      setFormData({ ...formData, IsActive: checked })
                    }
                  />
                  <Label>Active</Label>
                </div>

                {/* Bank Drawer Trigger */}
                <Button
                  type="button"
                  className="w-full bg-gray-600 hover:bg-gray-700 mt-4 flex justify-between"
                  onClick={() => setBankDrawerOpen(true)}
                >
                  <IoIosArrowDropleftCircle /> Add Bank Details
                </Button>

                {/* Submit Vendor (saves everything) */}
                <Button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-indigo-600 hover:bg-indigo-700 mt-4"
                >
                  {loading ? "Updating..." : "Update Vendor"}
                </Button>
              </form>
            </div>
          </motion.div>

          {/* Left Drawer - Bank Details */}
          <AnimatePresence>
            {bankDrawerOpen && (
              <motion.div
                className="fixed top-5 right-145 w-[450px] max-h-[95vh] bg-white shadow-xl z-45 flex flex-col rounded-2xl p-3 overflow-hidden"
                initial={{ x: "100%" }}
                animate={{ x: 0 }}
                exit={{ x: "100%" }}
                transition={{ type: "spring", stiffness: 300, damping: 30 }}
              >
                <div className="p-4 flex justify-between items-center bg-indigo-600 rounded-2xl m-2">
                  <h2 className="font-bold text-lg text-white">Bank Details</h2>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setBankDrawerOpen(false)}
                  >
                    Close
                  </Button>
                </div>

                <div className="p-3 flex-1 overflow-y-auto">
                  {formData.BankDetails.map((bank, index) => (
                    <div key={index} className="border rounded-lg mt-3">
                      {/* Collapsible Header */}
                      <div
                        className="flex justify-between items-center p-3 bg-gray-600 text-white rounded-lg cursor-pointer"
                        onClick={() =>
                          setExpandedIndex(
                            expandedIndex === index ? null : index
                          )
                        }
                      >
                        <span className="font-medium">
                          {bank.BankName || `Bank ${index + 1}`}
                        </span>
                        <span>{expandedIndex === index ? "▲" : "▼"}</span>
                      </div>

                      {/* Collapsible Content */}
                      <AnimatePresence>
                        {expandedIndex === index && (
                          <motion.div
                            className="p-3 space-y-3 bg-gray-100"
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: "auto", opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                          >
                            <div>
                              <Label>Bank Name</Label>
                              <Input
                                className="bg-white border-2 border-gray-300"
                                value={bank.BankName}
                                onChange={(e) =>
                                  handleBankChange(
                                    index,
                                    "BankName",
                                    e.target.value
                                  )
                                }
                              />
                            </div>
                            <div>
                              <Label>Account Number</Label>
                              <Input
                              className="bg-white border-2 border-gray-300"
                                value={bank.AccountNumber}
                                onChange={(e) =>
                                  handleBankChange(
                                    index,
                                    "AccountNumber",
                                    e.target.value
                                  )
                                }
                              />
                            </div>
                            <div>
                              <Label>Branch</Label>
                              <Input
                              className="bg-white border-2 border-gray-300"
                                value={bank.Branch}
                                onChange={(e) =>
                                  handleBankChange(
                                    index,
                                    "Branch",
                                    e.target.value
                                  )
                                }
                              />
                            </div>
                            <div>
                              <Label>Currency</Label>
                              <Input
                              className="bg-white border-2 border-gray-300"
                                value={bank.Currency}
                                onChange={(e) =>
                                  handleBankChange(
                                    index,
                                    "Currency",
                                    e.target.value
                                  )
                                }
                              />
                            </div>
                            <div className="flex items-center gap-2">
                              <Checkbox
                                checked={bank.IsPrimary}
                                onCheckedChange={(checked) =>
                                  handleBankChange(index, "IsPrimary", checked)
                                }
                              />
                              <Label>Primary Account</Label>
                            </div>
                            <Button
                              type="button"
                              variant="destructive"
                              className="text-white"
                              size="sm"
                              onClick={() => removeBankDetail(index)}
                            >
                              Remove Bank
                            </Button>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  ))}

                  <Button
                    type="button"
                    className="mt-3 bg-indigo-600 hover:bg-indigo-700"
                    onClick={addBankDetail}
                  >
                    Add Bank
                  </Button>
                </div>

                {/* Just close drawer - no API call */}
                <div className="p-3 border-t mt-3">
                  <Button
                    type="button"
                    className="w-full bg-indigo-600 hover:bg-indigo-700"
                    onClick={() => setBankDrawerOpen(false)}
                  >
                    Done
                  </Button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </>
      )}
    </AnimatePresence>
  );
}
