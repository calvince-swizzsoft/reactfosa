import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  FaBuilding,
  FaPlus,
  FaPhone,
  FaEnvelope,
  FaEdit,
  FaTrash,
  FaChevronDown,
  FaChevronUp,
  FaUniversity,
  FaMoneyCheck,
  FaEllipsisV,
} from "react-icons/fa";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

import Swal from "sweetalert2";
import EditInvVendorDrawer from "./EditInvVendorDrawer";
import AddInvVendorDrawer from "./AddInvVendorDrawer";
import { MdEditDocument } from "react-icons/md";
import NotFoundImage from "/assets/scopefinding.png";

export default function ProVendors() {
  const [vendors, setVendors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [addDrawerOpen, setAddDrawerOpen] = useState(false);
  const [editDrawerOpen, setEditDrawerOpen] = useState(false);
  const [editVendor, setEditVendor] = useState(null);
  const [expandedVendor, setExpandedVendor] = useState(null); // track dropdown

  const fetchVendors = () => {
    fetch(`${import.meta.env.VITE_APP_PRO_URL}/api/vendors`, {
      headers: { "ngrok-skip-browser-warning": "true" },
    })
      .then((res) => res.json())
      .then((data) => {
        setVendors(data.data || []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  };

  useEffect(() => {
    fetchVendors();
  }, []);

  // Delete Handler
  const handleDelete = async (id) => {
    Swal.fire({
      title: "Are you sure?",
      text: "This action cannot be undone.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#dc2626",
      cancelButtonColor: "#6b7280",
      confirmButtonText: "Yes, delete it!",
    }).then(async (result) => {
      if (result.isConfirmed) {
        try {
          const res = await fetch(
            `${import.meta.env.VITE_APP_PRO_URL}/api/vendors/${id}`,
            {
              method: "DELETE",
              headers: { "ngrok-skip-browser-warning": "true" },
            }
          );
          if (!res.ok) throw new Error("Failed to delete vendor");

          Swal.fire("Deleted!", "Vendor has been deleted.", "success");
          fetchVendors();
        } catch (err) {
          console.error(err);
          Swal.fire("Error!", "Failed to delete vendor.", "error");
        }
      }
    });
  };

  return (
    <div className="bg-white m-8 px-8 py-8 shadow-2xl rounded-lg relative">
      {/* Header */}
      <div className="flex justify-between items-center mb-6 bg-indigo-800 px-6 py-3 rounded-2xl">
        <h2 className="text-xl font-bold text-white flex items-center gap-2">
          <FaBuilding className="text-white" /> Vendors
        </h2>
        <Button
          onClick={() => setAddDrawerOpen(true)}
          className="bg-indigo-600 hover:bg-indigo-700 flex items-center gap-2"
        >
          <FaPlus /> Add Vendor
        </Button>
      </div>

      {/* Table */}
      <div className="bg-gray-200 p-4 rounded-sm">
        <div className="grid grid-cols-12 gap-4 bg-gray-700 text-gray-100 font-semibold p-3 rounded-lg mb-4">
          <span className="col-span-2">Name</span>
          <span className="col-span-1">Code</span>
          <span className="col-span-2">Phone</span>
          <span className="col-span-3">Email</span>
          <span className="col-span-1">Status</span>
          <span className="col-span-1">Bank</span>
          <span className="col-span-2 text-right">Actions</span>
        </div>

        {loading ? (
          <div className="space-y-2 animate-pulse">
            {Array.from({ length: 3 }).map((_, i) => (
              <div
                key={i}
                className="grid grid-cols-12 gap-2 bg-gray-50 p-6 rounded"
              >
                {Array.from({ length: 12 }).map((__, j) => (
                  <div key={j} className="h-4 bg-gray-200 rounded"></div>
                ))}
              </div>
            ))}
          </div>
        ) : vendors.length > 0 ? (
          <div className="space-y-2">
            {vendors.map((vendor) => (
              <div
                key={vendor.VendorId}
                className="bg-white rounded-lg shadow-lg border"
              >
                {/* Main Row */}
                <div className="grid grid-cols-12 gap-2 items-center py-4 px-6 hover:shadow-xl transition-all">
                  <span className="font-medium text-indigo-700 col-span-2">
                    {vendor.VendorName}
                  </span>
                  <span className="col-span-1">{vendor.VendorCode}</span>
                  <span className="flex items-center gap-2 col-span-2">
                    <FaPhone className="text-gray-500" /> {vendor.Phone}
                  </span>
                  <span className="col-span-3 truncate">
                    <FaEnvelope className="inline mr-1 text-gray-500" />
                    {vendor.Email}
                  </span>
                  <span
                    className={`text-sm  rounded-2xl text-center flex items-center justify-center p-1 col-span-1 ${vendor.IsActive
                        ? "text-white bg-green-600"
                        : "text-white bg-red-600"
                      }`}
                  >
                    {vendor.IsActive ? "Active" : "Inactive"}
                  </span>

                  {/* Bank Dropdown Toggle */}
                  <div className="col-span-1">
                    <Button
                      size="sm"
                      variant="outline"
                      className="bg-gray-700 hover:bg-gray-600 hover:text-white text-white"
                      onClick={() =>
                        setExpandedVendor(
                          expandedVendor === vendor.VendorId
                            ? null
                            : vendor.VendorId
                        )
                      }
                    >
                      {expandedVendor === vendor.VendorId ? (
                        <>
                          <FaChevronUp /> Hide Bank Detail
                        </>
                      ) : (
                        <>
                          <FaChevronDown /> View Bank Detail
                        </>
                      )}
                    </Button>
                  </div>

                  {/* Actions */}
                  <div className="col-span-2 flex justify-end">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 p-0"
                        >
                          <FaEllipsisV className="h-4 w-4 text-gray-600" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-32">
                        <DropdownMenuItem
                          onClick={() => {
                            setEditVendor(vendor);
                            setEditDrawerOpen(true);
                          }}
                        >
                          <MdEditDocument className="mr-2 text-blue-600" />Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          className=" hover:text-red-600 text-indigo-600"
                          onClick={() => handleDelete(vendor.VendorId)}
                        >
                          <FaTrash className="mr-2" /> Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>

                </div>

                {/* Expanded BankDetails */}
                {expandedVendor === vendor.VendorId && vendor.BankDetails && (
                  <div className="border-t bg-gray-200 p-2 rounded-b-lg">
                    {vendor.BankDetails.length > 0 ? (
                      <div className="divide-y">
                        {vendor.BankDetails.map((bank) => (
                          <div
                            key={bank.VendorBankId}
                            className="grid grid-cols-7 gap-2 items-center px-6 py-3 bg-white rounded-lg border-2 border-gray-400"
                          >
                            {/* Col 1: Bank Name */}
                            <span className="col-span-2 flex items-center gap-2 font-semibold text-indigo-700">
                              <FaUniversity className="text-blue-600" />
                              {bank.BankName} ({bank.Currency})
                            </span>

                            {/* Col 2: Account Number */}
                            <span className="col-span-1 text-sm text-gray-600">{bank.AccountNumber}</span>

                            {/* Col 3: Branch */}
                            <span className="col-span-1 text-sm text-gray-600">{bank.Branch}</span>

                            {/* Col 4: Type (Primary/Secondary) */}
                            <span
                              className={`col-span-1 text-xs text-center px-3 py-2 rounded-full ${bank.IsPrimary
                                  ? "bg-indigo-100 text-indigo-700"
                                  : "bg-gray-700 text-gray-100"
                                }`}
                            >
                              {bank.IsPrimary ? "Primary" : "Secondary"}
                            </span>

                            {/* Col 5: Empty placeholder to align */}
                            <span className="col-span-2 text-center px-3 py-2 rounded-full bg-gray-200"> Vendor Balance : 00.00</span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-gray-500 text-sm italic px-6 py-3">
                        No bank details found.
                      </p>
                    )}
                  </div>
                )}

              </div>
            ))}
          </div>
        ) : (
          <div className="text-gray-500 text-center mt-4">
            <img src={NotFoundImage} alt="Not Found" className="mx-auto w-42 h-auto" />
            <p className="font-medium text-gray-400">No Vendors Found.</p>
          </div>
        )}
      </div>

      {/* Add Drawer */}
      <AddInvVendorDrawer
        open={addDrawerOpen}
        onClose={() => setAddDrawerOpen(false)}
        onSuccess={fetchVendors}
      />

      {/* Edit Drawer */}
      <EditInvVendorDrawer
        open={editDrawerOpen}
        onClose={() => setEditDrawerOpen(false)}
        onSuccess={fetchVendors}
        vendor={editVendor}
      />
    </div>
  );
} 2