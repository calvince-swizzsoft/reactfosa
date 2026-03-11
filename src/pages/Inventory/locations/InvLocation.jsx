import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { FaWarehouse, FaPlus, FaCalendarAlt, FaUser, FaEdit, FaTrash } from "react-icons/fa";
import AddInvLocationDrawer from "./AddInvLocationDrawer";
import EditInvLocationDrawer from "./EditInvLocationDrawer";
import Swal from "sweetalert2";
import NotFoundImage from "/assets/scopefinding.png";

export default function InvLocation() {
  const [locations, setLocations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [addDrawerOpen, setAddDrawerOpen] = useState(false);
  const [editDrawerOpen, setEditDrawerOpen] = useState(false);
  const [editLocation, setEditLocation] = useState(null);

  const fetchLocations = () => {
    fetch(`${import.meta.env.VITE_APP_INV_URL}/api/locations`, {
      headers: { "ngrok-skip-browser-warning": "true" },
    })
      .then((res) => res.json())
      .then((data) => {
        setLocations(data.data || []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  };

  useEffect(() => {
    fetchLocations();
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
            `${import.meta.env.VITE_APP_INV_URL}/api/locations/${id}`,
            {
              method: "DELETE",
              headers: { "ngrok-skip-browser-warning": "true" },
            }
          );
          if (!res.ok) throw new Error("Failed to delete location");

          Swal.fire("Deleted!", "Location has been deleted.", "success");
          fetchLocations();
        } catch (err) {
          console.error(err);
          Swal.fire("Error!", "Failed to delete location.", "error");
        }
      }
    });
  };

  return (
    <div className="bg-white m-8 px-8 py-8 shadow-2xl rounded-lg relative">
      {/* Header */}
      <div className="flex justify-between items-center mb-6 bg-indigo-800 px-6 py-3 rounded-2xl">
        <h2 className="text-xl font-bold text-white flex items-center gap-2">
          <FaWarehouse /> Locations
        </h2>
        <Button
          onClick={() => setAddDrawerOpen(true)}
          className="bg-indigo-600 hover:bg-indigo-700 flex items-center gap-2"
        >
          <FaPlus /> Add Location
        </Button>
      </div>

      {/* Table */}
      <div className="bg-gray-200 p-6 rounded-xl">
        <div className="grid grid-cols-5 gap-6 bg-gray-700 text-gray-100 font-semibold px-5 py-3 rounded-lg mb-4">
          <span>Code</span>
          <span>Description</span>
          <span>Created By</span>
          <span>Created Date</span>
          <span className="text-right">Actions</span>
        </div>

        {loading ? (
        <div className="space-y-2 animate-pulse">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="grid grid-cols-5 gap-4 bg-gray-50 p-6 rounded">
              <div className="h-4 bg-gray-200 rounded"></div>
              <div className="h-4 bg-gray-200 rounded"></div>
              <div className="h-4 bg-gray-200 rounded"></div>
              <div className="h-4 bg-gray-200 rounded"></div>
              <div className="h-4 bg-gray-200 rounded text-right"></div>
            </div>
          ))}
        </div>
        ) : locations.length > 0 ? (
          <div className="space-y-2">
            {locations.map((loc) => (
              <div
                key={loc.Id}
                className="grid grid-cols-5 gap-4 items-center bg-white px-5 py-4 hover:bg-gray-50 transition-all rounded-2xl"
              >
                <span className="font-semibold text-indigo-700">{loc.Code}</span>
                <span>{loc.Description}</span>
                <span className="flex items-center gap-2 text-gray-700">
                  <FaUser className="text-gray-500" /> {loc.CreatedBy}
                </span>
                <span className="flex items-center gap-2 text-gray-700">
                  <FaCalendarAlt className="text-gray-500" />
                  {new Date(loc.CreatedDate).toLocaleString()}
                </span>

                {/* Actions */}
                <div className="flex justify-end gap-3">
                  <Button
                    size="sm"
                    className="bg-blue-600 hover:bg-blue-700 flex items-center gap-1 text-white"
                    onClick={() => {
                      setEditLocation(loc);
                      setEditDrawerOpen(true);
                    }}
                  >
                    <FaEdit /> Edit
                  </Button>
                  <Button
                    size="sm"
                    variant="destructive"
                    className="flex items-center gap-1 text-white"
                    onClick={() => handleDelete(loc.Id)}
                  >
                    <FaTrash /> Delete
                  </Button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-gray-500 text-center mt-4">
            <img src={NotFoundImage} alt="Not Found" className="mx-auto w-42 h-auto" />
            <p className="font-medium text-gray-400">No locations found.</p>
          </div>
        )}
      </div>

      {/* Add Drawer */}
      <AddInvLocationDrawer
        open={addDrawerOpen}
        onClose={() => setAddDrawerOpen(false)}
        onSuccess={fetchLocations}
      />

      {/* Edit Drawer */}
      <EditInvLocationDrawer
        open={editDrawerOpen}
        onClose={() => setEditDrawerOpen(false)}
        onSuccess={fetchLocations}
        location={editLocation}
      />
    </div>
  );
}
