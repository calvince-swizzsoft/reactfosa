import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Plus, Edit, Trash2, X, Lock, Unlock, Save, XCircle } from "lucide-react";
import Swal from "sweetalert2";
import NotFoundImage from "/assets/scopefinding.png";
import fixedassetsApi from "../../../../apis/fixedAssets/fixedassetsConfig";

export default function SubCategoryDrawer({ category, open, onClose }) {
  const [subCategories, setSubCategories] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [formMode, setFormMode] = useState("create");
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({
    Code: "",
    Description: "",
    IsLocked: false,
  });

 useEffect(() => {
  if (!category?.Id || !open) return;

  const fetchData = async () => {
    setLoading(true);
    try {
      console.log("Fetching all subclasses...");
      const res = await fixedassetsApi.get(`/fasubclass`);
      console.log("SubCategory Response: ", res);

      let allSubCategories = [];
      if (res.data?.data) {
        allSubCategories = res.data.data;
      } else if (Array.isArray(res.data)) {
        allSubCategories = res.data;
      }

      // ✅ filter by FAClassId of the opened category
      const filtered = allSubCategories.filter(
        sub => sub.FAClassId === category.Id
      );

      console.log("Filtered Subcategories:", filtered);
      setSubCategories(filtered);
    } catch (err) {
      console.error("Error fetching subcategories:", err);
      Swal.fire({
        icon: "error",
        title: "Error",
        text: "Failed to load subcategories",
      });
      setSubCategories([]);
    } finally {
      setLoading(false);
    }
  };

  fetchData();
}, [category?.Id, open]);

  const resetForm = () => {
    setFormData({
      Code: "",
      Description: "",
      IsLocked: false,
    });
    setEditingId(null);
    setFormMode("create");
    setShowForm(false);
  };

  // Handle Create
  const handleCreate = async () => {
    if (!formData.Code.trim() || !formData.Description.trim()) {
      Swal.fire({
        icon: "warning",
        title: "Validation Error",
        text: "Code and Description are required",
      });
      return;
    }

    try {
      const payload = {
        Code: formData.Code.trim(),
        Description: formData.Description.trim(),
        IsLocked: formData.IsLocked,
        FAClassId: category.Id,
      };

      console.log("Creating subcategory with payload:", payload);
      const res = await fixedassetsApi.post("/fasubclass", payload);
      console.log("Create response:", res);

      if (res.data?.success || res.status === 200 || res.status === 201) {
        Swal.fire({
          icon: "success",
          title: "Success",
          text: "SubClass created successfully",
          timer: 2000,
          showConfirmButton: false,
        });

        await refreshList();
        resetForm();
      }
    } catch (err) {
      console.error("Create error:", err);
      Swal.fire({
        icon: "error",
        title: "Error",
        text: err.response?.data?.message || "Failed to create SubClass" || err.message,
      });
    }
  };

  // Handle Edit Click
  const handleEditClick = (sub) => {
    setFormMode("edit");
    setEditingId(sub.Id);
    setFormData({
      Code: sub.Code,
      Description: sub.Description,
      IsLocked: sub.IsLocked,
    });
    setShowForm(true);
  };

  const refreshList = async () => {
  try {
    const res = await fixedassetsApi.get(`/fasubclass`);
    let all = [];
    if (res.data?.data) {
      all = res.data.data;
    } else if (Array.isArray(res.data)) {
      all = res.data;
    }
    const filtered = all.filter(sub => sub.FAClassId === category.Id);
    setSubCategories(filtered);
  } catch (err) {
    console.error("Refresh error:", err);
  }
};

  // Handle Update
  const handleUpdate = async () => {
    if (!formData.Code.trim() || !formData.Description.trim()) {
      Swal.fire({
        icon: "warning",
        title: "Validation Error",
        text: "Code and Description are required",
      });
      return;
    }

    try {
      const payload = {
        Code: formData.Code.trim(),
        Description: formData.Description.trim(),
        IsLocked: formData.IsLocked,
        Id: editingId,
        FAClassId: category.Id,
      };

      const res = await fixedassetsApi.put(`/fasubclass/${editingId}`, payload);

      if (res.data?.success || res.status === 200) {
        Swal.fire({
          icon: "success",
          title: "Success",
          text: "SubClass updated successfully",
          timer: 2000,
          showConfirmButton: false,
        });

        // Refresh list
        await refreshList();

        resetForm();
      }
    } catch (err) {
      console.error("Update error:", err);
      Swal.fire({
        icon: "error",
        title: "Error",
        text: err.response?.data?.message || "Failed to update SubClass",
      });
    }
  };

  // Handle Delete
  const handleDelete = async (id) => {
    const result = await Swal.fire({
      title: "Are you sure?",
      text: "This action cannot be undone.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#dc2626",
      cancelButtonColor: "#6b7280",
      confirmButtonText: "Yes, delete it!",
    });

    if (result.isConfirmed) {
      try {
        const res = await fixedassetsApi.delete(`/fasubclass/${id}`);

        if (res.data?.success || res.status === 200) {
          Swal.fire({
            icon: "success",
            title: "Deleted!",
            text: "SubClass has been deleted.",
            timer: 2000,
            showConfirmButton: false,
          });

          await refreshList();
        }
      } catch (err) {
        console.error("Delete error:", err);
        Swal.fire({
          icon: "error",
          title: "Error",
          text: err.response?.data?.message || "Failed to delete SubClass",
        });
      }
    }
  };

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop */}
          <motion.div
            className="fixed inset-0 bg-black z-40"
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.5 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            onClick={onClose}
          />

          {/* Drawer */}
          <motion.div
            className="fixed top-5 right-5 rounded-2xl w-[1000px] bg-white shadow-2xl z-50 flex flex-col max-h-[90vh] border border-gray-200"
            initial={{ x: "100%", opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: "100%", opacity: 0 }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
          >
            {/* Header with Gradient */}
            <div className="p-6 flex justify-between items-center border-b bg-gradient-to-r from-indigo-600 to-purple-600 rounded-t-2xl">
              <div>
                <h2 className="font-bold text-xl text-white flex items-center gap-2">
                  Sub Class
                </h2>
                <p className="text-indigo-100 text-sm mt-1">
                  Managing: {category?.Description}
                </p>
              </div>
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={onClose}
                className="text-white hover:bg-white/20"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>

            {/* Content */}
            <div className="p-6 overflow-y-auto flex-1 bg-gray-50">
              {/* Table */}
              <div className="bg-white rounded-xl shadow-lg overflow-hidden border border-gray-200 mb-6">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-gradient-to-r from-gray-50 to-gray-100 border-b-2 border-gray-200">
                      <TableHead className="text-gray-700 font-bold">Code</TableHead>
                      <TableHead className="text-gray-700 font-bold">Description</TableHead>
                      <TableHead className="text-gray-700 font-bold">Status</TableHead>
                      <TableHead className="text-gray-700 font-bold">Class</TableHead>
                      <TableHead className="text-gray-700 font-bold">Created Date</TableHead>
                      <TableHead className="text-gray-700 font-bold text-center">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {loading ? (
                      <TableRow>
                        <TableCell
                          colSpan={6}
                          className="text-center py-12"
                        >
                          <div className="flex flex-col items-center gap-3">
                            <div className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
                            <p className="text-gray-500 font-medium">Loading subcategories...</p>
                          </div>
                        </TableCell>
                      </TableRow>
                    ) : subCategories.length > 0 ? (
                      subCategories.map((sub, i) => (
                        <TableRow
                          key={sub.Id}
                          className="hover:bg-gray-50 transition-colors border-b border-gray-100"
                        >
                          <TableCell className="font-medium text-gray-900">{sub.Code}</TableCell>
                          <TableCell className="text-gray-700">{sub.Description}</TableCell>
                          <TableCell>
                            {sub.IsLocked ? (
                              <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold bg-red-100 text-red-700">
                                <Lock className="w-3 h-3" />
                                Locked
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-700">
                                <Unlock className="w-3 h-3" />
                                Open
                              </span>
                            )}
                          </TableCell>
                          <TableCell className="text-gray-600">{sub.FAClassDescription}</TableCell>
                          <TableCell className="text-gray-600">
                            {new Date(sub.CreatedDate).toLocaleDateString()}
                          </TableCell>
                          <TableCell>
                            <div className="flex gap-2 justify-center">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleEditClick(sub)}
                                className="h-9 w-9 p-0 hover:bg-indigo-50 rounded-lg transition-colors"
                              >
                                <Edit className="w-4 h-4 text-indigo-600" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleDelete(sub.Id)}
                                className="h-9 w-9 p-0 hover:bg-red-50 rounded-lg transition-colors"
                              >
                                <Trash2 className="w-4 h-4 text-red-600" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell
                          colSpan={6}
                          className="text-center py-12"
                        >
                          <div className="flex flex-col items-center gap-4">
                            <img
                              src={NotFoundImage}
                              alt="Not Found"
                              className="w-48 h-auto opacity-60"
                            />
                            <div>
                              <p className="font-semibold text-gray-700 text-lg">No Sub Class found</p>
                              <p className="text-gray-500 text-sm mt-1">
                                Create your first Sub Class to get started
                              </p>
                            </div>
                          </div>
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>

              {/* Modern Create/Edit Form - Now at Bottom */}
              <div className="bg-white p-6 rounded-xl border-2 border-dashed border-gray-300 hover:border-indigo-400 transition-colors w-120">
                {!showForm ? (
                  <button
                    onClick={() => {
                      setFormMode("create");
                      setShowForm(true);
                    }}
                    className="w-full flex items-center justify-center gap-3 py-8 text-gray-600 hover:text-indigo-600 transition-colors group"
                  >
                    <div className="w-12 h-12 rounded-full bg-indigo-100 group-hover:bg-indigo-200 flex items-center justify-center transition-colors">
                      <Plus className="w-6 h-6 text-indigo-600" />
                    </div>
                    <div className="text-left">
                      <p className="font-bold text-lg">Add New SubClass</p>
                      <p className="text-sm text-gray-500">Click to create a new subcategory</p>
                    </div>
                  </button>
                ) : (
                  <AnimatePresence>
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 20 }}
                      transition={{ duration: 0.3 }}
                    >
                      <div className="flex justify-between items-center mb-6">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
                            {formMode === "create" ? (
                              <Plus className="w-5 h-5 text-white" />
                            ) : (
                              <Edit className="w-5 h-5 text-white" />
                            )}
                          </div>
                          <div>
                            <h3 className="font-bold text-lg text-gray-800">
                              {formMode === "create" ? "Create New SubClass" : "Edit SubClass"}
                            </h3>
                            <p className="text-sm text-gray-500">
                              {formMode === "create" 
                                ? "Add a new subcategory to your asset classification" 
                                : "Update the subcategory details"}
                            </p>
                          </div>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={resetForm}
                          className="h-9 w-9 p-0 hover:bg-gray-100 rounded-lg"
                        >
                          <X className="w-4 h-4 text-gray-600" />
                        </Button>
                      </div>

                      <div className="grid grid-cols-2 gap-6">
                        <div className="space-y-2">
                          <Label 
                            htmlFor="code" 
                            className="text-sm font-semibold text-gray-700 flex items-center gap-2"
                          >
                            Code
                            <span className="text-red-500">*</span>
                          </Label>
                          <Input
                            id="code"
                            value={formData.Code}
                            onChange={(e) =>
                              setFormData({ ...formData, Code: e.target.value })
                            }
                            placeholder="e.g., SC001"
                            className="h-11 border-gray-300 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 transition-all"
                          />
                        </div>

                        <div className="space-y-2">
                          <Label 
                            htmlFor="description" 
                            className="text-sm font-semibold text-gray-700 flex items-center gap-2"
                          >
                            Description
                            <span className="text-red-500">*</span>
                          </Label>
                          <Input
                            id="description"
                            value={formData.Description}
                            onChange={(e) =>
                              setFormData({ ...formData, Description: e.target.value })
                            }
                            placeholder="Enter description"
                            className="h-11 border-gray-300 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 transition-all"
                          />
                        </div>
                      </div>

                      <div className="mt-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className={`w-10 h-10 rounded-lg flex items-center justify-center transition-colors ${
                              formData.IsLocked 
                                ? "bg-red-100" 
                                : "bg-green-100"
                            }`}>
                              {formData.IsLocked ? (
                                <Lock className="w-5 h-5 text-red-600" />
                              ) : (
                                <Unlock className="w-5 h-5 text-green-600" />
                              )}
                            </div>
                            <div>
                              <Label htmlFor="locked" className="cursor-pointer font-semibold text-gray-700">
                                Lock Status
                              </Label>
                              <p className="text-sm text-gray-500">
                                {formData.IsLocked 
                                  ? "This subcategory is locked" 
                                  : "This subcategory is unlocked"}
                              </p>
                            </div>
                          </div>
                          <div className="relative">
                            <input
                              type="checkbox"
                              id="locked"
                              checked={formData.IsLocked}
                              onChange={(e) =>
                                setFormData({ ...formData, IsLocked: e.target.checked })
                              }
                              className="sr-only peer"
                            />
                            <label
                              htmlFor="locked"
                              className="w-14 h-7 bg-gray-300 peer-checked:bg-indigo-600 rounded-full cursor-pointer relative inline-block transition-colors peer-focus:ring-2 peer-focus:ring-indigo-200"
                            >
                              <span className="w-5 h-5 bg-white rounded-full absolute top-1 left-1 transition-transform peer-checked:translate-x-7 shadow-md"></span>
                            </label>
                          </div>
                        </div>
                      </div>

                      <div className="flex gap-3 pt-6 border-t mt-6">
                        <Button
                          onClick={formMode === "create" ? handleCreate : handleUpdate}
                          className="flex-1 h-11 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white shadow-md hover:shadow-lg transition-all duration-200"
                        >
                          <Save className="w-4 h-4 mr-2" />
                          {formMode === "create" ? "Create SubClass" : "Update SubClass"}
                        </Button>
                        <Button 
                          variant="outline" 
                          onClick={resetForm}
                          className="h-11 px-6 hover:bg-gray-100 border-gray-300"
                        >
                          <XCircle className="w-4 h-4 mr-2" />
                          Cancel
                        </Button>
                      </div>
                    </motion.div>
                  </AnimatePresence>
                )}
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}