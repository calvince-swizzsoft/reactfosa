import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  FaLayerGroup,
  FaPlus,
  FaCalendarAlt,
  FaUser,
  FaEdit,
  FaTrash,
} from "react-icons/fa";
import AddAssetClass from "./AddAssetClass";
import EditAssetClass from "./EditAssetClass";
import Swal from "sweetalert2";
import NotFoundImage from "/assets/scopefinding.png";
import fixedassetsApi from "../../../apis/fixedAssets/fixedassetsConfig";
import { MdMoreTime } from "react-icons/md";
import SubCategoryDrawer from "./subcategory/SubCategory";

export default function FixCategory() {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [addDrawerOpen, setAddDrawerOpen] = useState(false);
  const [editDrawerOpen, setEditDrawerOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [subCategoryOpen, setSubCategoryOpen] = useState(false);
  const [subCategory, setSubCategory] = useState([]);
  const [editCategory, setEditCategory] = useState(null);

  const fetchCategories = async () => {
    setLoading(true);
    try {
      const response = await fixedassetsApi.get("/faclass");
      console.log("Fetched categories:", response.data);
      setCategories(response.data.data || []);
    } catch (error) {
      console.error("Error fetching categories:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchSubCategory = async (categoryId) => {
    setLoading(true);
    try {
      const response = await fixedassetsApi.get(`/fasubclass/${categoryId}`);
      console.log("Fetched subcategories:", response.data);
      setSubCategories(response.data.data || []);
    } catch (error) {
      console.error("Error fetching subcategories:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
  if (selectedCategory?.Id) {
    fetchSubCategory(selectedCategory.Id);
  }
}, [selectedCategory]);
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
          const res = await fixedassetsApi.delete(`/faclass/${id}`);
          if (!res.ok) throw new Error("Failed to delete category");

          Swal.fire("Deleted!", "Category has been deleted.", "success");
          fetchCategories();
        } catch (err) {
          console.error(err);
          Swal.fire("Error!", "Failed to delete category.", "error");
        }
      }
    });
  };

  return (
    <div className="bg-white m-8 px-8 py-8 shadow-2xl rounded-lg relative">
      {/* Header */}
      <div className="flex justify-between items-center mb-6 bg-indigo-800 px-6 py-3 rounded-2xl">
        <h2 className="text-xl font-bold text-white flex items-center gap-2">
          <FaLayerGroup className="text-white" /> Asset Class
        </h2>
        <Button
          onClick={() => setAddDrawerOpen(true)}
          className="bg-indigo-600 hover:bg-indigo-700 flex items-center gap-2"
        >
          <FaPlus /> Add Asset Class
        </Button>
      </div>

      {/* Table */}
      <div className="bg-gray-200 p-4 rounded-sm">
        <div className="grid grid-cols-6 gap-4 bg-gray-700 text-gray-100 font-semibold p-3 rounded-lg mb-4">
          <span>Code</span>
          <span>Description</span>
          <span>Locked?</span>
          <span>Created Date</span>
          <span className="col-span-2 text-right">Actions</span>
        </div>

        {loading ? (
          <div className="space-y-2 animate-pulse">
            {Array.from({ length: 3 }).map((_, i) => (
              <div
                key={i}
                className="grid grid-cols-5 gap-4 bg-gray-50 p-6 rounded"
              >
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
                className="grid grid-cols-6 gap-4 items-center bg-white py-4 px-6 rounded-lg shadow-lg hover:shadow-xl transition-all border"
              >
                <span className="font-medium text-indigo-700">{cat.Code}</span>
                <span className="font-medium text-indigo-700">
                  {cat.Description}
                </span>

                <span
                  className={`text-sm w-16 rounded-2xl text-center flex items-start justify-center p-1 ${
                    cat.IsLocked
                      ? "text-white bg-red-600"
                      : "text-white bg-green-600"
                  }`}
                >
                  {cat.IsLocked ? "Locked" : "Open"}
                </span>

                <span className=" col-span-1 flex items-center gap-2">
                  {new Date(cat.CreatedDate).toLocaleString()}
                </span>

                <div className="col-span-2 flex justify-end gap-2">
                  <Button
                    size="sm"
                    className="bg-blue-600 hover:bg-blue-700"
                    onClick={() => {
                      setSelectedCategory(cat);
                      fetchSubCategory(cat.Id);
                      setSubCategoryOpen(true);
                    }}
                  >
                    <MdMoreTime /> View Sub Category
                  </Button>
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
                  <Button
                    size="sm"
                    variant="destructive"
                    className="text-white"
                    onClick={() => handleDelete(cat.Id)}
                  >
                    <FaTrash /> Delete
                  </Button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-gray-500 text-center mt-4">
            <img
              src={NotFoundImage}
              alt="Not Found"
              className="mx-auto w-42 h-auto"
            />
            <p className="font-medium text-gray-400">No categories found.</p>
          </div>
        )}
      </div>

      {/* Add Drawer */}
      <AddAssetClass
        open={addDrawerOpen}
        onClose={() => setAddDrawerOpen(false)}
        onSuccess={fetchCategories}
      />

      {/* Edit Drawer */}
      <EditAssetClass
        open={editDrawerOpen}
        onClose={() => setEditDrawerOpen(false)}
        onSuccess={fetchCategories}
        category={editCategory}
      />

      {/* subcategory drawer */}
      <SubCategoryDrawer
        category={selectedCategory}
        open={subCategoryOpen}
        onClose={() => setSubCategoryOpen(false)}
      />
    </div>
  );
}
