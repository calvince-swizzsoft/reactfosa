import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { FaUserShield, FaPlus, FaEllipsisV } from "react-icons/fa";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import Swal from "sweetalert2";
import NotFoundImage from "/assets/scopefinding.png";

export default function AdministrationUsers() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [roles, setRoles] = useState([]);
  const [roleLoading, setRoleLoading] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editForm, setEditForm] = useState({});
  const [userRoles, setUserRoles] = useState([]);
  const [userRolesLoading, setUserRolesLoading] = useState(false);
  const [rolesToAdd, setRolesToAdd] = useState([]);
  const [rolesToRemove, setRolesToRemove] = useState([]);

  useEffect(() => {
    const fetchUsers = async () => {
      setLoading(true);
      try {
        const response = await fetch(`${import.meta.env.VITE_APP_ADMIN_URL}/api/administration/users`);
        const data = await response.json().catch(() => []);

        if (!response.ok) {
          throw new Error(data?.message || "Failed to load users");
        }

        setUsers(Array.isArray(data) ? data : []);
      } catch (error) {
        Swal.fire("Error", error.message || "Unable to load users.", "error");
        setUsers([]);
      } finally {
        setLoading(false);
      }
    };

    const fetchRoles = async () => {
      setRoleLoading(true);
      try {
        const response = await fetch(`${import.meta.env.VITE_APP_ADMIN_URL}/api/administration/roles`);
        const data = await response.json().catch(() => ({}));

        if (!response.ok) {
          throw new Error(data?.message || "Failed to load roles");
        }

        const roleList = Array.isArray(data?.data) ? data.data : Array.isArray(data) ? data : [];
        setRoles(roleList);
      } catch (error) {
        Swal.fire("Error", error.message || "Unable to load roles.", "error");
      } finally {
        setRoleLoading(false);
      }
    };

    fetchUsers();
    fetchRoles();
  }, []);

  const getValue = (user, keys) => {
    for (const key of keys) {
      if (user?.[key] !== undefined && user?.[key] !== null && user?.[key] !== "") {
        return user[key];
      }
    }
    return "—";
  };

  const normalizeRoleName = (role) => role?.roleName || role?.RoleName || role?.name || role?.Name || role;

  const fetchUserRoles = async (username) => {
    setUserRolesLoading(true);
    try {
      const response = await fetch(`${import.meta.env.VITE_APP_ADMIN_URL}/api/administration/users/roles?user=${encodeURIComponent(username)}`);
      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(data?.message || "Failed to load user roles");
      }

      const roleList = Array.isArray(data?.data) ? data.data : Array.isArray(data) ? data : [];
      setUserRoles(roleList.map(normalizeRoleName));
    } catch (error) {
      console.error("Failed to load user roles", error);
      setUserRoles([]);
    } finally {
      setUserRolesLoading(false);
    }
  };

  const openEditDrawer = async (user) => {
    setSelectedUser(user);
    setRolesToAdd([]);
    setRolesToRemove([]);
    setEditForm({
      firstName: getValue(user, ["firstName", "FirstName", ""]) || "",
      otherNames: getValue(user, ["otherNames", "OtherNames", ""]) || "",
      email: getValue(user, ["email", "Email", "emailAddress", "EmailAddress"]) || "",
      userName: getValue(user, ["userName", "UserName", "name", "Name"]) || "",
      phoneNumber: getValue(user, ["phoneNumber", "PhoneNumber", "phone", "Phone"]) || "",
      branchDescription: getValue(user, ["branchDescription", "BranchDescription", "branchName", "BranchName"]) || "",
      twoFactorEnabled: Boolean(user?.twoFactorEnabled ?? user?.TwoFactorEnabled),
      lockoutEnabled: Boolean(user?.lockoutEnabled ?? user?.LockoutEnabled),
      emailConfirmed: Boolean(user?.emailConfirmed ?? user?.EmailConfirmed),
      createdDate: user?.createdDate || user?.CreatedDate || "",
    });

    const username = getValue(user, ["userName", "UserName", "name", "Name"]);
    await fetchUserRoles(username);

    setDrawerOpen(true);
  };

  const handleDrawerChange = (field, value) => {
    setEditForm((prev) => ({ ...prev, [field]: value }));
  };

  const toggleRoleToAdd = (roleName) => {
    setRolesToAdd((prev) =>
      prev.includes(roleName) ? prev.filter((item) => item !== roleName) : [...prev, roleName]
    );
  };

  const toggleRoleToRemove = (roleName) => {
    setRolesToRemove((prev) =>
      prev.includes(roleName) ? prev.filter((item) => item !== roleName) : [...prev, roleName]
    );
  };

  const handleSave = async () => {
    if (!selectedUser) return;

    try {
      const response = await fetch(`${import.meta.env.VITE_APP_ADMIN_URL}/api/administration/users`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...selectedUser,
          ...editForm,
        }),
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(data?.message || "Failed to update user");
      }

      Swal.fire("Success", data?.message || "User updated successfully.", "success");
      setDrawerOpen(false);
    } catch (error) {
      Swal.fire("Error", error.message || "Unable to update user.", "error");
    }
  };

  const handleAssignRoles = async () => {
    if (!selectedUser) return;

    if (rolesToAdd.length === 0) {
      Swal.fire("Info", "Select at least one role to add.", "info");
      return;
    }

    try {
      const username = editForm.userName || selectedUser.userName || selectedUser.UserName || "";

      const response = await fetch(`${import.meta.env.VITE_APP_ADMIN_URL}/api/administration/roles/add`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          UserName: username,
          Roles: rolesToAdd,
        }),
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(data?.message || "Failed to assign roles");
      }

      Swal.fire("Success", data?.message || "Roles assigned successfully.", "success");
      setRolesToAdd([]);
      await fetchUserRoles(username);
    } catch (error) {
      Swal.fire("Error", error.message || "Unable to assign roles.", "error");
    }
  };

  const handleRemoveRoles = async () => {
    if (!selectedUser) return;

    if (rolesToRemove.length === 0) {
      Swal.fire("Info", "Select at least one role to remove.", "info");
      return;
    }

    try {
      const username = editForm.userName || selectedUser.userName || selectedUser.UserName || "";

      const response = await fetch(`${import.meta.env.VITE_APP_ADMIN_URL}/api/administration/roles/remove`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          UserName: username,
          Roles: rolesToRemove,
        }),
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(data?.message || "Failed to remove roles");
      }

      Swal.fire("Success", data?.message || "Roles removed successfully.", "success");
      setRolesToRemove([]);
      await fetchUserRoles(username);
    } catch (error) {
      Swal.fire("Error", error.message || "Unable to remove roles.", "error");
    }
  };

  const availableRoles = roles
    .map(normalizeRoleName)
    .filter((roleName) => !userRoles.includes(roleName));

  return (
    <div className="bg-white m-8 px-8 py-8 shadow-2xl rounded-lg relative">
      {/* Header */}
      <div className="flex justify-between items-center mb-6 bg-indigo-800 px-6 py-3 rounded-2xl">
        <h2 className="text-xl font-bold text-white flex items-center gap-2">
          <FaUserShield className="text-white" /> Users
          <span className="text-sm font-normal ml-2">
            ({users.length} {users.length === 1 ? "user" : "users"})
          </span>
        </h2>
        <Link
          to="/Administration/Users/create"
          className="inline-flex items-center gap-2 rounded-md bg-indigo-600 hover:bg-indigo-700 px-4 py-2 text-sm font-medium text-white"
        >
          <FaPlus /> Add User
        </Link>
      </div>

      {/* Table */}
      <div className="bg-gray-200 p-4 rounded-sm">
        <div className="grid grid-cols-12 gap-4 bg-gray-700 text-gray-100 font-semibold p-3 rounded-lg mb-4">
          <span className="col-span-3">User Name</span>
          <span className="col-span-3">Email</span>
          <span className="col-span-2">Phone</span>
          <span className="col-span-3">Branch</span>
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
        ) : users.length > 0 ? (
          <div className="space-y-2">
            {users.map((user, index) => (
              <div key={user.id || user.Id || index} className="bg-white rounded-lg shadow-lg border">
                <div className="grid grid-cols-12 gap-2 items-center py-4 px-6 hover:shadow-xl transition-all">
                  <span className="font-medium text-indigo-700 col-span-3">
                    {getValue(user, ["userName", "UserName", "name", "Name"])}
                  </span>

                  <span className="col-span-3 truncate">
                    {getValue(user, ["email", "Email", "emailAddress", "EmailAddress"])}
                  </span>

                  <span className="col-span-2 text-gray-600">
                    {getValue(user, ["phoneNumber", "PhoneNumber", "phone", "Phone"])}
                  </span>

                  <span className="col-span-3 text-sm text-gray-600">
                    {getValue(user, ["branchDescription", "BranchDescription", "branchName", "BranchName"])}
                  </span>

                  <div className="col-span-1 flex justify-end">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <FaEllipsisV className="h-4 w-4 text-gray-600" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-32">
                        <DropdownMenuItem onClick={() => openEditDrawer(user)}>
                          Edit
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
            <p className="font-medium text-gray-400">No Users Found.</p>
          </div>
        )}
      </div>

      <AnimatePresence>
        {drawerOpen && selectedUser && (
          <>
            <motion.div
              className="fixed inset-0 bg-black z-40"
              initial={{ opacity: 0 }} animate={{ opacity: 0.4 }} exit={{ opacity: 0 }}
              onClick={() => setDrawerOpen(false)}
            />
            <motion.div
              className="fixed top-3 right-3 w-[80vw] max-w-[950px] bg-white shadow-2xl z-50 flex flex-col rounded-2xl"
              initial={{ x: "100%" }} animate={{ x: 0 }} exit={{ x: "100%" }}
              transition={{ type: "spring", stiffness: 260, damping: 30 }}
            >
              <div className="bg-gray-200 m-2 rounded-xl">
                <div className="p-4 flex justify-between items-center bg-indigo-700 rounded-2xl m-2">
                  <h2 className="font-bold text-xl text-white">Edit User</h2>
                  <Button variant="outline" size="sm" onClick={() => setDrawerOpen(false)}>Close</Button>
                </div>

                <div className="p-5 overflow-y-auto h-[75vh] bg-gray-50 rounded-xl m-3 space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="col-span-2 space-y-2">
                      <Label>User Name</Label>
                      <Input value={editForm.userName || ""} readOnly className="bg-slate-100" />
                    </div>
                    <div className="space-y-2">
                      <Label>First Name</Label>
                      <Input value={editForm.firstName || ""} onChange={(e) => handleDrawerChange("firstName", e.target.value)} />
                    </div>
                    <div className="space-y-2">
                      <Label>Other Names</Label>
                      <Input value={editForm.otherNames || ""} onChange={(e) => handleDrawerChange("otherNames", e.target.value)} />
                    </div>
                    <div className="space-y-2">
                      <Label>Email Address</Label>
                      <Input type="email" value={editForm.email || ""} onChange={(e) => handleDrawerChange("email", e.target.value)} />
                    </div>
                    <div className="space-y-2">
                      <Label>Phone Number</Label>
                      <Input value={editForm.phoneNumber || ""} onChange={(e) => handleDrawerChange("phoneNumber", e.target.value)} />
                    </div>
                    <div className="space-y-2">
                      <Label>Branch Name</Label>
                      <Input value={editForm.branchDescription || ""} onChange={(e) => handleDrawerChange("branchDescription", e.target.value)} />
                    </div>
                    <div className="space-y-2">
                      <Label>Created Date</Label>
                      <Input value={editForm.createdDate || ""} onChange={(e) => handleDrawerChange("createdDate", e.target.value)} />
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-3 pt-1">
                    <div className="flex items-center gap-2 rounded-lg border border-gray-300 bg-white p-3">
                      <input id="twoFactor" type="checkbox" checked={editForm.twoFactorEnabled || false} onChange={(e) => handleDrawerChange("twoFactorEnabled", e.target.checked)} className="w-4 h-4 accent-indigo-600" />
                      <Label htmlFor="twoFactor">2FA Enabled</Label>
                    </div>
                    <div className="flex items-center gap-2 rounded-lg border border-gray-300 bg-white p-3">
                      <input id="lockout" type="checkbox" checked={editForm.lockoutEnabled || false} onChange={(e) => handleDrawerChange("lockoutEnabled", e.target.checked)} className="w-4 h-4 accent-indigo-600" />
                      <Label htmlFor="lockout">Lock User?</Label>
                    </div>
                    <div className="flex items-center gap-2 rounded-lg border border-gray-300 bg-white p-3">
                      <input id="emailConfirmed" type="checkbox" checked={editForm.emailConfirmed || false} onChange={(e) => handleDrawerChange("emailConfirmed", e.target.checked)} className="w-4 h-4 accent-indigo-600" />
                      <Label htmlFor="emailConfirmed">Email Confirmed</Label>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4 pt-2">
                    <div className="space-y-3 rounded-xl border border-gray-300 bg-white p-3">
                      <div className="flex items-center justify-between">
                        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Current Roles</p>
                        <Button variant="outline" size="sm" onClick={handleRemoveRoles} disabled={userRolesLoading || rolesToRemove.length === 0}>
                          Remove Selected
                        </Button>
                      </div>

                      <div className="space-y-2">
                        {userRolesLoading ? (
                          <p className="text-sm text-slate-500">Loading roles...</p>
                        ) : userRoles.length > 0 ? (
                          userRoles.map((roleName, index) => (
                            <label key={roleName || index} className="flex items-center gap-2 rounded-lg border border-gray-200 p-2">
                              <input type="checkbox" checked={rolesToRemove.includes(roleName)} onChange={() => toggleRoleToRemove(roleName)} className="w-4 h-4 accent-indigo-600" />
                              <span className="text-sm text-slate-700">{roleName}</span>
                            </label>
                          ))
                        ) : (
                          <p className="text-sm text-slate-500">This user has no roles assigned.</p>
                        )}
                      </div>
                    </div>

                    <div className="space-y-3 rounded-xl border border-gray-300 bg-white p-3">
                      <div className="flex items-center justify-between">
                        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Add Roles</p>
                        <Button variant="outline" size="sm" onClick={handleAssignRoles} disabled={roleLoading || rolesToAdd.length === 0}>
                          Add Selected
                        </Button>
                      </div>

                      <div className="space-y-2">
                        {roleLoading ? (
                          <p className="text-sm text-slate-500">Loading roles...</p>
                        ) : availableRoles.length > 0 ? (
                          availableRoles.map((roleName, index) => (
                            <label key={roleName || index} className="flex items-center gap-2 rounded-lg border border-gray-200 p-2">
                              <input type="checkbox" checked={rolesToAdd.includes(roleName)} onChange={() => toggleRoleToAdd(roleName)} className="w-4 h-4 accent-indigo-600" />
                              <span className="text-sm text-slate-700">{roleName}</span>
                            </label>
                          ))
                        ) : (
                          <p className="text-sm text-slate-500">No additional roles available.</p>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex justify-end pt-2">
                    <Button onClick={handleSave} className="bg-indigo-600 hover:bg-indigo-700">
                      Save Changes
                    </Button>
                  </div>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
