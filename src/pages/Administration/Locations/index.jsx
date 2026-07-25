import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { FaMapMarkerAlt, FaPlus, FaTrash, FaEllipsisV } from "react-icons/fa";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import Swal from "sweetalert2";
import NotFoundImage from "/assets/scopefinding.png";
import AddLocation from "./AddLocation";
import EditLocation from "./EditLocation";

export default function AdministrationLocations() {
  const [locations, setLocations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [openAdd, setOpenAdd] = useState(false);
  const [openEdit, setOpenEdit] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState(null);

  const fetchLocations = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${import.meta.env.VITE_APP_ADMIN_URL}/api/administration/locations`);
      const json = await res.json();
      const locationList = Array.isArray(json?.data) ? json.data : Array.isArray(json) ? json : [];
      setLocations(locationList);
    } catch (err) {
      console.error("Fetch Locations Error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLocations();
  }, []);

  const handleDelete = async (id) => {
    Swal.fire({
      title: "Delete Location?",
      text: "This action cannot be undone.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#dc2626",
      cancelButtonColor: "#6b7280",
      confirmButtonText: "Delete",
    }).then(async (result) => {
      if (result.isConfirmed) {
        try {
          const res = await fetch(`${import.meta.env.VITE_APP_ADMIN_URL}/api/administration/locations/${id}`, {
            method: "DELETE",
          });

          if (!res.ok) throw new Error("Failed to delete location");

          setLocations((prev) => prev.filter((l) => l.Id !== id));
          Swal.fire("Deleted!", "Location removed successfully.", "success");
        } catch (error) {
          Swal.fire("Error", error.message, "error");
        }
      }
    });
  };

  return (
    <div className="bg-white m-8 px-8 py-8 shadow-2xl rounded-lg relative">
      {/* Header */}
      <div className="flex justify-between items-center mb-6 bg-indigo-800 px-6 py-3 rounded-2xl">
        <h2 className="text-xl font-bold text-white flex items-center gap-2">
          <FaMapMarkerAlt className="text-white" /> Locations
          <span className="text-sm font-normal ml-2">
            ({locations.length} {locations.length === 1 ? "location" : "locations"})
          </span>
        </h2>
        <Button
          onClick={() => setOpenAdd(true)}
          className="bg-indigo-600 hover:bg-indigo-700 flex items-center gap-2"
        >
          <FaPlus /> Add Location
        </Button>
      </div>

      {/* Table */}
      <div className="bg-gray-200 p-4 rounded-sm">
        <div className="grid grid-cols-12 gap-4 bg-gray-700 text-gray-100 font-semibold p-3 rounded-lg mb-4">
          <span className="col-span-4">Location</span>
          <span className="col-span-3">Branch</span>
          <span className="col-span-2">Status</span>
          <span className="col-span-2">Created</span>
          <span className="col-span-1 text-right">Actions</span>
        </div>

        {loading ? (
          <div className="space-y-2 animate-pulse">
            {[1, 2, 3].map((i) => (
              <div key={i} className="grid grid-cols-12 gap-2 bg-gray-50 p-6 rounded">
                {Array.from({ length: 12 }).map((_, j) => (
                  <div key={j} className="h-4 bg-gray-200 rounded"></div>
                ))}
              </div>
            ))}
          </div>
        ) : locations.length > 0 ? (
          <div className="space-y-2">
            {locations.map((location) => (
              <div key={location.Id} className="bg-white rounded-lg shadow-lg border">
                <div className="grid grid-cols-12 gap-2 items-center py-4 px-6 hover:shadow-xl transition-all">
                  <span className="font-medium text-indigo-700 col-span-4">
                    {location.Description}
                  </span>

                  <span className="col-span-3 text-gray-600">
                    {location.BranchDescription}
                  </span>

                  <span className="col-span-2">
                    <span
                      className={`px-2 py-1 rounded text-xs font-semibold ${
                        location.IsLocked ? "bg-red-100 text-red-600" : "bg-green-100 text-green-600"
                      }`}
                    >
                      {location.IsLocked ? "Locked" : "Active"}
                    </span>
                  </span>

                  <span className="col-span-2 text-sm text-gray-600">
                    {location.CreatedDate ? new Date(location.CreatedDate).toLocaleDateString() : ""}
                  </span>

                  <div className="col-span-1 flex justify-end">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <FaEllipsisV className="h-4 w-4 text-gray-600" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-32">
                        <DropdownMenuItem
                          onClick={() => {
                            setSelectedLocation(location);
                            setOpenEdit(true);
                          }}
                        >
                          Edit
                        </DropdownMenuItem>

                        <DropdownMenuItem
                          className="text-red-600"
                          onClick={() => handleDelete(location.Id)}
                        >
                          <FaTrash className="mr-2" /> Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-gray-500 text-center mt-4">
            <img src={NotFoundImage} alt="Not Found" className="mx-auto w-42" />
            <p className="font-medium text-gray-400">No Locations Found.</p>
          </div>
        )}
      </div>

      <AddLocation open={openAdd} onClose={() => setOpenAdd(false)} refresh={fetchLocations} />
      <EditLocation
        open={openEdit}
        onClose={() => setOpenEdit(false)}
        data={selectedLocation}
        refresh={fetchLocations}
      />
    </div>
  );
}
