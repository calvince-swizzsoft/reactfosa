import { useState } from "react";
import { Button } from "@/components/ui/button";
import Swal from "sweetalert2";
import { FaSearch, FaBuilding } from "react-icons/fa";
import { linkCustomerToBranch, BRANCHES_BASE } from "./api";
import EntryPickerModal from "@/pages/Accounts/BatchProcedures/lib/EntryPickerModal";
import CustomerLookupModal from "../Documents/CustomerLookupModal";

const customerName = (item) =>
  [item.IndividualFirstName, item.IndividualLastName].filter(Boolean).join(" ") ||
  item.NonIndividualDescription ||
  item.Description ||
  "—";

// Per Areas/Registry/Branch linkage.md: pick a branch, pick a customer,
// click Update to link them — no persistent "linked customers" list or
// removal flow described (and ICustomerAppService has no reset/unlink for
// branch the way it does for station), so this is a lean pick-and-submit
// screen rather than Station Linkage's list-management workspace.
export default function BranchLinkage() {
  const [branch, setBranch] = useState(null);
  const [customer, setCustomer] = useState(null);
  const [branchPickerOpen, setBranchPickerOpen] = useState(false);
  const [customerPickerOpen, setCustomerPickerOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!branch) {
      Swal.fire("Missing Field", "Look up and select the branch to link the customer to.", "warning");
      return;
    }
    if (!customer) {
      Swal.fire("Missing Field", "Look up and select the customer to link.", "warning");
      return;
    }
    setSaving(true);
    try {
      await linkCustomerToBranch(customer.Id ?? customer.id, branch.Id);
      Swal.fire("Success", `${customerName(customer)} linked to ${branch.Description}.`, "success");
      setCustomer(null);
    } catch (err) {
      Swal.fire("Error", err.message, "error");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="bg-white m-8 px-8 py-8 shadow-2xl rounded-lg relative">
      <div className="flex justify-between items-center mb-6 bg-indigo-800 px-6 py-3 rounded-2xl">
        <h2 className="text-xl font-bold text-white flex items-center gap-2">
          <FaBuilding /> Branch Linkage
        </h2>
      </div>

      <form onSubmit={handleSubmit} className="max-w-xl space-y-4">
        <div>
          <label className="text-sm font-semibold text-gray-700">Branch</label>
          <button
            type="button"
            onClick={() => setBranchPickerOpen(true)}
            className="w-full flex items-center justify-between rounded-md border border-gray-300 py-2 px-3 text-sm text-left hover:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
          >
            <span className={branch ? "text-gray-800" : "text-gray-400"}>
              {branch ? branch.Description : "Look up branch..."}
            </span>
            <FaSearch className="text-gray-400" />
          </button>
        </div>

        <div>
          <label className="text-sm font-semibold text-gray-700">Customer</label>
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
        </div>

        <Button type="submit" disabled={saving} className="bg-indigo-600 hover:bg-indigo-700">
          {saving ? "Linking..." : "Update"}
        </Button>
      </form>

      {branchPickerOpen && (
        <EntryPickerModal
          title="Select Branch"
          fetchUrl={BRANCHES_BASE}
          getLabel={(b) => b.Description}
          onSelect={setBranch}
          onClose={() => setBranchPickerOpen(false)}
        />
      )}

      {customerPickerOpen && (
        <CustomerLookupModal onSelect={setCustomer} onClose={() => setCustomerPickerOpen(false)} />
      )}
    </div>
  );
}
