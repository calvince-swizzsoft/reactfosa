import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Swal from "sweetalert2";

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
        const response = await fetch(`${import.meta.env.VITE_APP_ADMIN_URL}/api/users`);
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
        const response = await fetch(`${import.meta.env.VITE_APP_ADMIN_URL}/api/roles`);
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
      const response = await fetch(`${import.meta.env.VITE_APP_ADMIN_URL}/api/users/roles?user=${encodeURIComponent(username)}`);
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
      const response = await fetch(`${import.meta.env.VITE_APP_ADMIN_URL}/api/users`, {
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

      const response = await fetch(`${import.meta.env.VITE_APP_ADMIN_URL}/api/roles/add`, {
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

      const response = await fetch(`${import.meta.env.VITE_APP_ADMIN_URL}/api/roles/remove`, {
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
    <div className="min-h-screen bg-slate-100 p-6 md:p-10">
      <div className="mx-auto max-w-6xl rounded-2xl bg-white p-8 shadow-xl">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-semibold text-slate-800">Users</h2>
            <p className="mt-2 text-sm text-slate-500">
              List of users fetched from the server.
            </p>
          </div>
        </div>

        <div className="overflow-hidden rounded-xl border border-slate-200">
          <table className="min-w-full divide-y divide-slate-200">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-4 py-3 text-left text-sm font-semibold text-slate-700">User Name</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-slate-700">Email Address</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-slate-700">Phone Number</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-slate-700">Branch Name</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white">
              {loading ? (
                <tr>
                  <td colSpan="4" className="px-4 py-6 text-center text-sm text-slate-500">
                    Loading users...
                  </td>
                </tr>
              ) : users.length > 0 ? (
                users.map((user, index) => (
                  <tr key={user.id || user.Id || index} className="hover:bg-slate-50">
                    <td className="px-4 py-3 text-sm text-slate-700">
                      {getValue(user, ["userName", "UserName", "name", "Name"])}
                    </td>
                    <td className="px-4 py-3 text-sm text-slate-700">
                      {getValue(user, ["email", "Email", "emailAddress", "EmailAddress"])}
                    </td>
                    <td className="px-4 py-3 text-sm text-slate-700">
                      {getValue(user, ["phoneNumber", "PhoneNumber", "phone", "Phone"])}
                    </td>
                    <td className="px-4 py-3 text-sm text-slate-700">
                      {getValue(user, ["branchDescription", "BranchDescription", "branchName", "BranchName"])}
                    </td>
                    <td className="px-4 py-3 text-sm">
                      <Button variant="outline" size="sm" onClick={() => openEditDrawer(user)}>
                        Edit
                      </Button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="4" className="px-4 py-6 text-center text-sm text-slate-500">
                    No users found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
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
              className="fixed top-5 right-3 bottom-5 w-[420px] max-w-[92vw] bg-white shadow-xl z-50 flex flex-col rounded-2xl p-3 overflow-hidden"
              initial={{ x: "100%" }} animate={{ x: 0 }} exit={{ x: "100%" }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
            >
              <div className="p-4 flex justify-between items-center bg-indigo-600 rounded-2xl m-2 shrink-0">
                <h2 className="font-bold text-lg text-white">Edit User</h2>
                <Button variant="outline" size="sm" onClick={() => setDrawerOpen(false)}>Close</Button>
              </div>

              <div className="p-4 flex-1 min-h-0 overflow-y-auto space-y-4">
                <div className="space-y-2">
                  <Label>User Name</Label>
                  <Input value={editForm.userName || ""} readOnly className="bg-slate-100" />
                </div>
                <div className="flex gap-3">
                  <div className="flex-1 space-y-2">
                    <Label>First Name</Label>
                    <Input value={editForm.firstName || ""} onChange={(e) => handleDrawerChange("firstName", e.target.value)} />
                  </div>
                  <div className="flex-1 space-y-2">
                    <Label>Other Names</Label>
                    <Input value={editForm.otherNames || ""} onChange={(e) => handleDrawerChange("otherNames", e.target.value)} />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Email Address</Label>
                  <Input type="email" value={editForm.email || ""} onChange={(e) => handleDrawerChange("email", e.target.value)} />
                </div>
                <div className="flex gap-3">
                  <div className="flex-1 space-y-2">
                    <Label>Phone Number</Label>
                    <Input value={editForm.phoneNumber || ""} onChange={(e) => handleDrawerChange("phoneNumber", e.target.value)} />
                  </div>
                  <div className="flex-1 space-y-2">
                    <Label>Branch Name</Label>
                    <Input value={editForm.branchDescription || ""} onChange={(e) => handleDrawerChange("branchDescription", e.target.value)} />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Created Date</Label>
                  <Input value={editForm.createdDate || ""} onChange={(e) => handleDrawerChange("createdDate", e.target.value)} />
                </div>

                <div className="space-y-2 pt-1">
                  <div className="flex items-center gap-2 rounded-lg border border-slate-200 p-3">
                    <input id="twoFactor" type="checkbox" checked={editForm.twoFactorEnabled || false} onChange={(e) => handleDrawerChange("twoFactorEnabled", e.target.checked)} className="w-4 h-4 accent-indigo-600" />
                    <Label htmlFor="twoFactor">2FA Enabled</Label>
                  </div>
                  <div className="flex items-center gap-2 rounded-lg border border-slate-200 p-3">
                    <input id="lockout" type="checkbox" checked={editForm.lockoutEnabled || false} onChange={(e) => handleDrawerChange("lockoutEnabled", e.target.checked)} className="w-4 h-4 accent-indigo-600" />
                    <Label htmlFor="lockout">Lock User?</Label>
                  </div>
                  <div className="flex items-center gap-2 rounded-lg border border-slate-200 p-3">
                    <input id="emailConfirmed" type="checkbox" checked={editForm.emailConfirmed || false} onChange={(e) => handleDrawerChange("emailConfirmed", e.target.checked)} className="w-4 h-4 accent-indigo-600" />
                    <Label htmlFor="emailConfirmed">Email Confirmed</Label>
                  </div>
                </div>

                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider pt-2">Current Roles</p>
                <div className="space-y-3 rounded-xl border border-slate-200 p-3">
                  <div className="flex items-center justify-end">
                    <Button variant="outline" size="sm" onClick={handleRemoveRoles} disabled={userRolesLoading || rolesToRemove.length === 0}>
                      Remove Selected
                    </Button>
                  </div>

                  <div className="space-y-2">
                    {userRolesLoading ? (
                      <p className="text-sm text-slate-500">Loading roles...</p>
                    ) : userRoles.length > 0 ? (
                      userRoles.map((roleName, index) => (
                        <label key={roleName || index} className="flex items-center gap-2 rounded-lg border border-slate-200 p-2">
                          <input type="checkbox" checked={rolesToRemove.includes(roleName)} onChange={() => toggleRoleToRemove(roleName)} className="w-4 h-4 accent-indigo-600" />
                          <span className="text-sm text-slate-700">{roleName}</span>
                        </label>
                      ))
                    ) : (
                      <p className="text-sm text-slate-500">This user has no roles assigned.</p>
                    )}
                  </div>
                </div>

                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider pt-2">Add Roles</p>
                <div className="space-y-3 rounded-xl border border-slate-200 p-3">
                  <div className="flex items-center justify-end">
                    <Button variant="outline" size="sm" onClick={handleAssignRoles} disabled={roleLoading || rolesToAdd.length === 0}>
                      Add Selected
                    </Button>
                  </div>

                  <div className="space-y-2">
                    {roleLoading ? (
                      <p className="text-sm text-slate-500">Loading roles...</p>
                    ) : availableRoles.length > 0 ? (
                      availableRoles.map((roleName, index) => (
                        <label key={roleName || index} className="flex items-center gap-2 rounded-lg border border-slate-200 p-2">
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

              <div className="p-4 pt-2 shrink-0">
                <Button onClick={handleSave} className="w-full bg-indigo-600 hover:bg-indigo-700">
                  Save Changes
                </Button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
