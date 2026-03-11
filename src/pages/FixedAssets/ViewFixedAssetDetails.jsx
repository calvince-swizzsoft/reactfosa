import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";

export default function ViewFixedAssetDetails({ open, onClose, asset }) {
  if (!asset) return null;

  const formatDate = (date) => {
    return date ? new Date(date).toLocaleDateString() : "N/A";
  };

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            className="fixed inset-0 bg-black z-40"
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.4 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />

          <motion.div
            className="fixed top-5 right-5 w-[550px] bg-white shadow-xl z-50 flex flex-col rounded-2xl p-3 overflow-y-auto max-h-[95vh]"
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
          >
            <div className="p-4 flex justify-between items-center bg-indigo-600 rounded-2xl m-2">
              <h2 className="font-bold text-lg text-white">Asset Details</h2>
              <Button variant="outline" size="sm" onClick={onClose}>
                Close
              </Button>
            </div>

            <div className="p-3 flex-1">
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label className="text-gray-600">No</Label>
                    <p className="font-medium text-indigo-700 mt-1">{asset.No}</p>
                  </div>
                  <div>
                    <Label className="text-gray-600">Serial Number</Label>
                    <p className="font-medium mt-1">{asset.SerialNo}</p>
                  </div>
                </div>

                <div>
                  <Label className="text-gray-600">Asset Name</Label>
                  <p className="font-medium mt-1">{asset.AssetName}</p>
                </div>

                <div>
                  <Label className="text-gray-600">Responsible Employee</Label>
                  <p className="font-medium mt-1">{asset.ResponsibleEmployee || "N/A"}</p>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label className="text-gray-600">FA SubClass</Label>
                    <p className="font-medium mt-1">{asset.FASubClassDescription || "N/A"}</p>
                  </div>
                  <div>
                    <Label className="text-gray-600">Location</Label>
                    <p className="font-medium mt-1">{asset.LocationDescription || "N/A"}</p>
                  </div>
                </div>

                <div>
                  <Label className="text-gray-600">Book Value</Label>
                  <p className="font-medium mt-1">{asset.BookValue || "N/A"}</p>
                </div>

                <div>
                  <Label className="text-gray-600">Status</Label>
                  <p className="font-medium mt-1">
                    <span className={`px-3 py-1 rounded-full text-sm ${asset.IsInactive ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>
                      {asset.IsInactive ? "Inactive" : "Active"}
                    </span>
                  </p>
                </div>

                <div className="border-t pt-4 mt-4">
                  <h3 className="font-semibold text-gray-700 mb-3">Depreciation Details</h3>
                  
                  <div>
                    <Label className="text-gray-600">Depreciation Method</Label>
                    <p className="font-medium mt-1">{asset.DepreciationMethod || "N/A"}</p>
                  </div>

                  <div className="grid grid-cols-2 gap-3 mt-3">
                    <div>
                      <Label className="text-gray-600">Start Date</Label>
                      <p className="font-medium mt-1">{formatDate(asset.DepreciationStartDate)}</p>
                    </div>
                    <div>
                      <Label className="text-gray-600">End Date</Label>
                      <p className="font-medium mt-1">{formatDate(asset.DepreciationEndingDate)}</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3 mt-3">
                    <div>
                      <Label className="text-gray-600">No. of Years</Label>
                      <p className="font-medium mt-1">{asset.NoOfDepreciationYears || "N/A"}</p>
                    </div>
                    <div>
                      <Label className="text-gray-600">Reducing Balance %</Label>
                      <p className="font-medium mt-1">{asset.ReducingBalancePercentage || "N/A"}</p>
                    </div>
                  </div>
                </div>

                <div className="border-t pt-4 mt-4">
                  <div>
                    <Label className="text-gray-600">FA Group</Label>
                    <p className="font-medium mt-1">{asset.FAGroup || "N/A"}</p>
                  </div>

                  <div className="mt-3">
                    <Label className="text-gray-600">Created Date</Label>
                    <p className="font-medium mt-1">{formatDate(asset.CreatedDate)}</p>
                  </div>

                  <div className="mt-3">
                    <Label className="text-gray-600">Created By</Label>
                    <p className="font-medium mt-1">{asset.CreatedBy || "N/A"}</p>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}