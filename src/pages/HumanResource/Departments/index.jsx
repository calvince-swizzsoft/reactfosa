import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Swal from "sweetalert2";
import NotFoundImage from "/assets/scopefinding.png";
import { FaEllipsisV, FaTrash, FaEdit, FaPlus } from "react-icons/fa";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const BASE = `${import.meta.env.VITE_APP_FIN_URL}`;

const emptyForm = { Description: "", IsRegistry: false, IsLocked: false };

function DrawerShell({ open, onClose, title, children }) {
  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div className="fixed inset-0 bg-black z-40" initial={{ opacity: 0 }} animate={{ opacity: 0.4 }} exit={{ opacity: 0 }} onClick={onClose} />
          <motion.div className="fixed top-5 right-3 w-[420px] bg-white shadow-xl z-50 flex flex-col rounded-2xl p-3" initial={{ x: "100%" }} animate={{ x: 0 }} exit={{ x: "100%" }} transition={{ type: "spring", stiffness: 300, damping: 30 }}>
            <div className="p-4 flex justify-between items-center bg-indigo-600 rounded-2xl m-2">
              <h2 className="font-bold text-lg text-white">{title}</h2>
              <Button variant="outline" size="sm" onClick={onClose}>Close</Button>
            </div>
            {children}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

function DepartmentForm({ form, setForm, loading, submitLabel, onSubmit }) {
  return (
    <form onSubmit={onSubmit} className="p-4 space-y-4">
      <div>
        <Label>Description</Label>
        <Input value={form.Description} onChange={(e) => setForm((p) => ({ ...p, Description: e.target.value }))} required placeholder="e.g. FOSA" />
      </div>
      <div className="flex items-center gap-2">
        <input type="checkbox" id="dept-registry" checked={form.IsRegistry} onChange={(e) => setForm((p) => ({ ...p, IsRegistry: e.target.checked }))} className="w-4 h-4 accent-indigo-600" />
        <Label htmlFor="dept-registry">Is Registry?</Label>
      </div>
      <div className="flex items-center gap-2">
        <input type="checkbox" id="dept-locked" checked={form.IsLocked} onChange={(e) => setForm((p) => ({ ...p, IsLocked: e.target.checked }))} className="w-4 h-4 accent-indigo-600" />
        <Label htmlFor="dept-locked">Is Locked?</Label>
      </div>
      <Button type="submit" disabled={loading} className="w-full bg-indigo-600 hover:bg-indigo-700">
        {loading ? "Saving..." : submitLabel}
      </Button>
    </form>
  );
}

function EditDepartmentDrawer({ open, onClose, onSuccess, item }) {
  const [form, setForm] = useState(emptyForm);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (item) {
      setForm({
        Description: item.Description || "",
        IsRegistry: item.IsRegistry || false,
        IsLocked: item.IsLocked || false,
      });
    }
  }, [item]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch(`${BASE}/api/humanresource/departments/${item.Id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.message || "Failed to update department");
      Swal.fire("Success", "Department updated successfully", "success");
      onSuccess();
      onClose();
    } catch (err) {
      Swal.fire("Error", err.message, "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <DrawerShell open={open} onClose={onClose} title="Edit Department">
      <DepartmentForm form={form} setForm={setForm} loading={loading} submitLabel="Update Department" onSubmit={handleSubmit} />
    </DrawerShell>
  );
}

export default function Departments() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editItem, setEditItem] = useState(null);

  const fetchItems = () => {
    setLoading(true);
    fetch(`${BASE}/api/humanresource/departments`)
      .then((r) => r.json())
      .then((d) => setItems(Array.isArray(d?.data) ? d.data : Array.isArray(d) ? d : []))
      .catch(() => setItems([]))
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchItems(); }, []);

  const handleDelete = (id) => {
    Swal.fire({ title: "Delete Department?", icon: "warning", showCancelButton: true, confirmButtonColor: "#dc2626", confirmButtonText: "Delete" }).then(async (r) => {
      if (r.isConfirmed) {
        try {
          const res = await fetch(`${BASE}/api/humanresource/departments/${id}`, { method: "DELETE" });
          if (!res.ok) throw new Error("Failed to delete");
          setItems((prev) => prev.filter((x) => x.Id !== id));
          Swal.fire("Deleted!", "Department removed.", "success");
        } catch (err) {
          Swal.fire("Error", err.message, "error");
        }
      }
    });
  };

  return (
    <div>
      <div className="flex justify-end mb-3">
        <Link
          to="/HumanResource/Departments/create"
          className="inline-flex items-center gap-2 rounded-md bg-indigo-600 hover:bg-indigo-700 px-4 py-2 text-sm font-medium text-white"
        >
          <FaPlus /> Add Department
        </Link>
      </div>

      <div className="grid grid-cols-12 gap-2 bg-gray-700 text-gray-100 font-semibold p-3 rounded-lg mb-3">
        <span className="col-span-6">Description</span>
        <span className="col-span-2">Registry</span>
        <span className="col-span-2">Locked</span>
        <span className="col-span-2 text-right">Actions</span>
      </div>

      {loading ? (
        <div className="space-y-2 animate-pulse">
          {[1, 2, 3].map((i) => <div key={i} className="h-12 bg-gray-100 rounded-lg" />)}
        </div>
      ) : items.length > 0 ? (
        <div className="space-y-2">
          {items.map((item) => (
            <div key={item.Id} className="grid grid-cols-12 gap-2 items-center bg-white px-4 py-3 rounded-lg shadow border">
              <span className="col-span-6 font-medium text-indigo-700">{item.Description}</span>
              <span className="col-span-2">
                <span className={`px-2 py-1 rounded text-xs font-semibold ${item.IsRegistry ? "bg-blue-100 text-blue-600" : "bg-gray-100 text-gray-500"}`}>
                  {item.IsRegistry ? "Yes" : "No"}
                </span>
              </span>
              <span className="col-span-2">
                <span className={`px-2 py-1 rounded text-xs font-semibold ${item.IsLocked ? "bg-red-100 text-red-600" : "bg-green-100 text-green-600"}`}>
                  {item.IsLocked ? "Locked" : "Active"}
                </span>
              </span>
              <div className="col-span-2 flex justify-end">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-8 w-8"><FaEllipsisV className="text-gray-500" /></Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => setEditItem(item)}>
                      <FaEdit className="mr-2 text-indigo-600" /> Edit
                    </DropdownMenuItem>
                    <DropdownMenuItem className="text-red-600" onClick={() => handleDelete(item.Id)}>
                      <FaTrash className="mr-2" /> Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center mt-4">
          <img src={NotFoundImage} alt="Not Found" className="mx-auto w-32 h-auto" />
          <p className="text-gray-400 mt-2">No departments found.</p>
        </div>
      )}

      <EditDepartmentDrawer open={!!editItem} onClose={() => setEditItem(null)} onSuccess={fetchItems} item={editItem} />
    </div>
  );
}
