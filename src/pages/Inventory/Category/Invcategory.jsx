import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { FaLayerGroup, FaPlus, FaUser, FaEdit } from "react-icons/fa";
import AddInvCategoryDrawer from "./AddInvCategoryDrawer";
import EditInvCategoryDrawer from "./EditInvCategoryDrawer";
import Swal from "sweetalert2";
import NotFoundImage from "/assets/scopefinding.png";
import { apiErrorMessage, apiJson, normalizeList } from "@/lib/api";

export default function Invcategory() {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [addDrawerOpen, setAddDrawerOpen] = useState(false);
  const [editDrawerOpen, setEditDrawerOpen] = useState(false);
  const [editCategory, setEditCategory] = useState(null);


  const fetchCategories = async () => {
    setLoading(true);
    try {
      const data = await apiJson(`${import.meta.env.VITE_APP_FIN_URL}/api/control/inventory-categories?pageIndex=0&pageSize=1000`, {
        headers: { "ngrok-skip-browser-warning": "true" },
      });
      setCategories(normalizeList(data));
    } catch (error) {
      setCategories([]);
      Swal.fire("Error", apiErrorMessage(error, "Unable to load categories."), "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  return (
    <div className="bg-white m-8 px-8 py-8 shadow-2xl rounded-lg relative">
      {/* Header */}
      <div className="flex justify-between items-center mb-6 bg-indigo-800 px-6 py-3 rounded-2xl">
        <h2 className="text-xl font-bold text-white flex items-center gap-2">
          <FaLayerGroup className="text-white" /> Inventory Categories
        </h2>
        <Button
          onClick={() => setAddDrawerOpen(true)}
          className="bg-indigo-600 hover:bg-indigo-700 flex items-center gap-2"
        >
          <FaPlus /> Add Category
        </Button>
      </div>

      {/* Table */}
      <div className="bg-gray-200 p-4 rounded-sm">
        <div className="grid grid-cols-12 gap-4 bg-gray-700 text-gray-100 font-semibold p-3 rounded-lg mb-4">
          <span className="col-span-3">Name</span>
          <span className="col-span-3">Remarks</span>
          <span>Created By</span>
          <span className="col-span-2">Created Date</span>
          <span>Locked?</span>
          <span className="col-span-2 text-right">Actions</span>
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
        ) : categories.length > 0 ? (
          <div className="space-y-2">
            {categories.map((cat) => (
              <div
                key={cat.Id}
                className="grid grid-cols-12 gap-4 items-center bg-white py-4 px-6 rounded-lg shadow-lg hover:shadow-xl transition-all border"
              >
              
                <span className="col-span-3 font-medium text-indigo-700">{cat.Description}</span>
                <span className="col-span-3 text-sm text-gray-600">{cat.Remarks}</span>
                <span className="flex items-center gap-2">
                  <FaUser className="text-gray-500" /> {cat.CreatedBy}
                </span>
                <span className="col-span-2 flex items-center gap-2">
                  {new Date(cat.CreatedDate).toLocaleString()}
                </span>
                <span
                  className={`text-sm w-16 rounded-2xl text-center flex items-start justify-center p-1 ${
                    cat.IsLocked ? "text-white bg-red-600" : "text-white bg-green-600"
                  }`}
                >
                  {cat.IsLocked ? "Locked" : "Open"}
                </span>

                <div className="col-span-2 flex justify-end gap-2">
                  <Button
                    size="sm"
                    className="bg-blue-600 hover:bg-blue-700"
                    onClick={() => {
                      setEditCategory(cat);
                      setEditDrawerOpen(true);
                    }}
                  >
                    <FaEdit /> Edit
                  </Button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-gray-500 text-center mt-4">
            <img src={NotFoundImage} alt="Not Found" className="mx-auto w-42 h-auto" />
            <p className="font-medium text-gray-400">No categories found.</p>
          </div>
        )}
      </div>

      {/* Add Drawer */}
      <AddInvCategoryDrawer
        open={addDrawerOpen}
        onClose={() => setAddDrawerOpen(false)}
        onSuccess={fetchCategories}
      />

      {/* Edit Drawer */}
      <EditInvCategoryDrawer
        open={editDrawerOpen}
        onClose={() => setEditDrawerOpen(false)}
        onSuccess={fetchCategories}
        category={editCategory}
      />
    </div>
  );
}
