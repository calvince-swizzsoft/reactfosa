import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import Swal from "sweetalert2";

export default function AddVoucherDrawer({ open, onClose, onSuccess }) {
  const [formData, setFormData] = useState({
    InvoiceId: "",
    PaymentMethod: "",
    BankLinkageChartOfAccountId: "",
    VendorNo: "",
    PostingDate: new Date().toISOString().split("T")[0],
  });

  const [loading, setLoading] = useState(false);
  const [purchaseInvoices, setPurchaseInvoices] = useState([]);
  const [chartOfAccounts, setChartOfAccounts] = useState([]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await fetch(
        `${import.meta.env.VITE_APP_FIN_URL}/api/values/AddVoucher`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "ngrok-skip-browser-warning": "true",
          },
          body: JSON.stringify(formData),
        }
      );

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.message || "Failed to add voucher");
      }

      Swal.fire("Success", data.message, "success");

      // reset
      setFormData({
        InvoiceId: "",
        PaymentMethod: "",
        BankLinkageChartOfAccountId: "",
        VendorNo: "",
        PostingDate: new Date().toISOString().split("T")[0],
      });

      if (onSuccess) onSuccess();
      onClose();
    } catch (err) {
      console.error(err);
      Swal.fire("Error", err.message, "error");
    } finally {
      setLoading(false);
    }
  };

  console.log(formData);

  useEffect(() => {

    // Fetch purchase invoices
    fetch(`${import.meta.env.VITE_APP_FIN_URL}/api/values/GetPurchaseInvoices`, {
    headers: { "ngrok-skip-browser-warning": "true" },
    })
    .then((res) => res.json())
    .then((data) => {
        const invoices = data?.Data || [];
        setPurchaseInvoices(invoices);
    })
    .catch((err) => console.error("Error fetching invoices:", err));


    // Fetch chart of accounts
    fetch(`${import.meta.env.VITE_APP_FIN_URL}/api/values/GetChartOfAccount`, {
      headers: { "ngrok-skip-browser-warning": "true" },
    })
      .then((res) => res.json())
      .then((data) => {
        const accounts = Array.isArray(data) ? data : data.Data || [];
        setChartOfAccounts(accounts);
      })
      .catch((err) => {
        console.error("Error fetching chart of accounts:", err);
        setChartOfAccounts([]);
      });
  }, []);

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
            className="fixed top-5 right-3 w-[500px] bg-white shadow-xl z-50 flex flex-col rounded-2xl p-3"
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
          >
            <div className="p-4 flex justify-between items-center bg-indigo-600 rounded-2xl m-2">
              <h2 className="font-bold text-lg text-white">Add Voucher</h2>
              <Button variant="outline" size="sm" onClick={onClose}>
                Close
              </Button>
            </div>

            <div className="p-3 flex-1 overflow-y-auto">
              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Vendor */}
                <div>
                  <Label>Vendor No</Label>
                  <Input
                    type="number"
                    value={formData.VendorNo}
                    onChange={(e) =>
                      setFormData({ ...formData, VendorNo: e.target.value })
                    }
                  />
                </div>

                {/* Purchase Invoice */}
                <div>
                  <Label>Purchase Invoice</Label>
                  <Select
                    value={formData.InvoiceId}
                    onValueChange={(value) =>
                      setFormData({ ...formData, InvoiceId: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select Invoice" />
                    </SelectTrigger>
                    <SelectContent>
                    {purchaseInvoices.map((inv) => (
                        <SelectItem key={inv.Id} value={inv.Id}>
                        {inv.VendorName}
                        </SelectItem>
                    ))}
                    </SelectContent>

                  </Select>
                </div>

                {/* Payment Method */}
                <div>
                  <Label>Payment Method</Label>
                  <Select
                    value={formData.PaymentMethod}
                    onValueChange={(value) =>
                      setFormData({ ...formData, PaymentMethod: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select Method" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Cash">Cash</SelectItem>
                      <SelectItem value="Bank">Bank</SelectItem>
                      <SelectItem value="EFT">EFT</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Bank Account */}
                <div>
                  <Label>Bank Linkage Account</Label>
                  <Select
                    value={formData.BankLinkageChartOfAccountId}
                    onValueChange={(value) =>
                      setFormData({
                        ...formData,
                        BankLinkageChartOfAccountId: value,
                      })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select Bank Account" />
                    </SelectTrigger>
                    <SelectContent className="max-h-80 overflow-y-auto">
                      {chartOfAccounts.map((acc) => (
                        <SelectItem key={acc.Id} value={acc.Id}>
                          {acc.AccountName}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Posting Date */}
                <div>
                  <Label>Posting Date</Label>
                  <Input
                    type="date"
                    value={formData.PostingDate}
                    onChange={(e) =>
                      setFormData({ ...formData, PostingDate: e.target.value })
                    }
                  />
                </div>

                {/* Submit */}
                <Button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-indigo-600 hover:bg-indigo-700"
                >
                  {loading ? "Saving..." : "Save Voucher"}
                </Button>
              </form>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
