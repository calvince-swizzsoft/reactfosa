import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";

export default function InvTransactionDrawer({ open, onClose, transaction }) {
  if (!transaction) return null;

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-50 flex"
          initial={{ x: "100%" }}
          animate={{ x: 0 }}
          exit={{ x: "100%" }}
          transition={{ type: "tween", duration: 0.3 }}
        >
          {/* Overlay */}
          <div
            className="fixed inset-0 bg-black bg-opacity-40"
            onClick={onClose}
          />

          {/* Drawer content */}
          <div className="relative w-[400px] bg-white shadow-xl p-6 overflow-y-auto">
            <h2 className="text-lg font-semibold mb-4">Transaction Details</h2>
            <div className="space-y-3 text-sm">
              <p><strong>Document No:</strong> {transaction.DocumentNo}</p>
              <p><strong>Entry Type:</strong> {transaction.EntryType}</p>
              <p><strong>Quantity:</strong> {transaction.Quantity}</p>
              <p><strong>Unit Cost:</strong> {transaction.UnitCost}</p>
              <p><strong>Total Cost:</strong> {transaction.TotalCost}</p>
              <p><strong>Location:</strong> {transaction.LocationId}</p>
              <p><strong>Reference Journal:</strong> {transaction.ReferenceJournalId}</p>
              <p><strong>Created By:</strong> {transaction.CreatedBy}</p>
              <p>
                <strong>Created Date:</strong>{" "}
                {new Date(transaction.CreatedDate).toLocaleString()}
              </p>
            </div>

            <Button
              onClick={onClose}
              className="mt-6 w-full bg-indigo-600 hover:bg-indigo-700 text-white"
            >
              Close
            </Button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
