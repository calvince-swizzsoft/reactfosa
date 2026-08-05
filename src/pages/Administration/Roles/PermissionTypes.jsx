import { useEffect, useMemo, useState } from "react";
import { FaTrash } from "react-icons/fa";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import Swal from "sweetalert2";
import { apiFetch, normalizeList } from "@/lib/api";

const normalizeRoleName = (role) => role?.roleName || role?.RoleName || role?.name || role?.Name || role;

const normalizePermissionType = (permissionType) =>
  permissionType?.systemPermissionType ||
  permissionType?.SystemPermissionType ||
  permissionType?.name ||
  permissionType?.Name ||
  permissionType;

const normalizeAssignedRole = (row) => ({
  roleName: row?.roleName || row?.RoleName || row?.name || row?.Name || "",
  branchId: row?.branchId || row?.BranchId || "",
  branchDescription: row?.branchDescription || row?.BranchDescription || row?.branchName || row?.BranchName || "",
  requiredApprovers: row?.requiredApprovers ?? row?.RequiredApprovers ?? "",
  approvalPriority: row?.approvalPriority ?? row?.ApprovalPriority ?? "",
});

const emptyAddForm = { roleName: "", branchId: "", requiredApprovers: "", approvalPriority: "" };

export default function AdministrationPermissionTypes() {
  const [permissionTypes, setPermissionTypes] = useState([]);
  const [permissionTypesLoading, setPermissionTypesLoading] = useState(false);
  const [selectedPermissionType, setSelectedPermissionType] = useState("");

  const [roles, setRoles] = useState([]);
  const [rolesLoading, setRolesLoading] = useState(false);

  const [branches, setBranches] = useState([]);
  const [branchesLoading, setBranchesLoading] = useState(false);

  const [assignedRows, setAssignedRows] = useState([]);
  const [assignedLoading, setAssignedLoading] = useState(false);
  const [removingRoleNames, setRemovingRoleNames] = useState(new Set());

  const [addForm, setAddForm] = useState(emptyAddForm);
  const [adding, setAdding] = useState(false);

  useEffect(() => {
    const fetchPermissionTypes = async () => {
      setPermissionTypesLoading(true);
      try {
        const response = await fetch(
          `${import.meta.env.VITE_APP_ADMIN_URL}/api/administration/roles/permissiontypes`
        );
        const data = await response.json().catch(() => ({}));

        if (!response.ok) {
          throw new Error(data?.message || "Failed to load permission types");
        }

        const list = Array.isArray(data?.data) ? data.data : Array.isArray(data) ? data : [];
        setPermissionTypes(list.map(normalizePermissionType).filter(Boolean));
      } catch (error) {
        Swal.fire("Error", error.message || "Unable to load permission types.", "error");
      } finally {
        setPermissionTypesLoading(false);
      }
    };

    const fetchRoles = async () => {
      setRolesLoading(true);
      try {
        const response = await fetch(`${import.meta.env.VITE_APP_ADMIN_URL}/api/administration/roles`);
        const data = await response.json().catch(() => ({}));

        if (!response.ok) {
          throw new Error(data?.message || "Failed to load roles");
        }

        const roleList = Array.isArray(data?.data) ? data.data : Array.isArray(data) ? data : [];
        setRoles(roleList.map(normalizeRoleName).filter(Boolean));
      } catch (error) {
        Swal.fire("Error", error.message || "Unable to load roles.", "error");
      } finally {
        setRolesLoading(false);
      }
    };

    const fetchBranches = async () => {
      setBranchesLoading(true);
      try {
        const response = await apiFetch(`${import.meta.env.VITE_APP_ADMIN_URL}/api/administration/branches`);
        const data = await response.json().catch(() => ({}));

        if (!response.ok) {
          throw new Error(data?.message || "Failed to load branches");
        }

        // GET / now returns PageCollectionInfo<BranchDTO> (paged), not a
        // bare array — the old Array.isArray(data?.data) check silently
        // returned [] once that shape landed, breaking this dropdown.
        setBranches(normalizeList(data));
      } catch (error) {
        Swal.fire("Error", error.message || "Unable to load branches.", "error");
      } finally {
        setBranchesLoading(false);
      }
    };

    fetchPermissionTypes();
    fetchRoles();
    fetchBranches();
  }, []);

  useEffect(() => {
    setAddForm(emptyAddForm);

    if (!selectedPermissionType) {
      setAssignedRows([]);
      return;
    }

    const fetchAssignedRoles = async () => {
      setAssignedLoading(true);
      try {
        const response = await fetch(
          `${import.meta.env.VITE_APP_ADMIN_URL}/api/administration/roles/GetRolesForPermissionType?permissionType=${encodeURIComponent(selectedPermissionType)}`
        );
        const data = await response.json().catch(() => ({}));

        if (!response.ok) {
          throw new Error(data?.message || "Failed to load roles for this permission type");
        }

        const rowList = Array.isArray(data?.data) ? data.data : Array.isArray(data) ? data : [];
        setAssignedRows(rowList.map(normalizeAssignedRole).filter((row) => row.roleName));
      } catch (error) {
        Swal.fire("Error", error.message || "Unable to load current roles for this permission type.", "error");
        setAssignedRows([]);
      } finally {
        setAssignedLoading(false);
      }
    };

    fetchAssignedRoles();
  }, [selectedPermissionType]);

  const branchDescriptionById = useMemo(() => {
    const map = new Map();
    branches.forEach((b) => map.set(String(b.Id), b.Description));
    return map;
  }, [branches]);

  const assignedRoleNames = useMemo(
    () => new Set(assignedRows.map((row) => row.roleName)),
    [assignedRows]
  );

  const availableRoles = useMemo(
    () => roles.filter((roleName) => !assignedRoleNames.has(roleName)),
    [roles, assignedRoleNames]
  );

  const updateAddForm = (key, value) => setAddForm((prev) => ({ ...prev, [key]: value }));

  const handleRemove = async (row) => {
    if (!selectedPermissionType) return;

    const { roleName } = row;
    setRemovingRoleNames((prev) => new Set(prev).add(roleName));

    try {
      const response = await fetch(
        `${import.meta.env.VITE_APP_ADMIN_URL}/api/administration/roles/RemoveRolesFromPermissionType`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            SystemPermissionType: selectedPermissionType,
            permissionTypeinRoles: [
              {
                RoleName: row.roleName,
                BranchId: row.branchId,
                RequiredApprovers: row.requiredApprovers,
                ApprovalPriority: row.approvalPriority,
              },
            ],
          }),
        }
      );
      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(data?.message || `Failed to remove "${roleName}" from "${selectedPermissionType}"`);
      }

      setAssignedRows((prev) => prev.filter((r) => r.roleName !== roleName));
    } catch (error) {
      Swal.fire("Error", error.message || "Unable to remove role mapping.", "error");
    } finally {
      setRemovingRoleNames((prev) => {
        const next = new Set(prev);
        next.delete(roleName);
        return next;
      });
    }
  };

  const handleAdd = async () => {
    if (!selectedPermissionType) return;

    const { roleName, branchId, requiredApprovers, approvalPriority } = addForm;
    if (!roleName || !branchId || requiredApprovers === "" || approvalPriority === "") {
      Swal.fire("Missing fields", "Please select a role, branch, and enter both approval fields.", "warning");
      return;
    }

    setAdding(true);
    try {
      const response = await fetch(
        `${import.meta.env.VITE_APP_ADMIN_URL}/api/administration/roles/addPermissionTypeToRoles`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            SystemPermissionType: selectedPermissionType,
            permissionTypeinRoles: [
              {
                RoleName: roleName,
                BranchId: branchId,
                RequiredApprovers: parseInt(requiredApprovers, 10),
                ApprovalPriority: parseInt(approvalPriority, 10),
              },
            ],
          }),
        }
      );
      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(data?.message || `Failed to map "${roleName}" to "${selectedPermissionType}"`);
      }

      setAssignedRows((prev) => [
        ...prev,
        {
          roleName,
          branchId,
          branchDescription: branchDescriptionById.get(String(branchId)) || "",
          requiredApprovers: parseInt(requiredApprovers, 10),
          approvalPriority: parseInt(approvalPriority, 10),
        },
      ]);
      setAddForm(emptyAddForm);
      Swal.fire("Success", data?.message || `"${roleName}" mapped to "${selectedPermissionType}".`, "success");
    } catch (error) {
      Swal.fire("Error", error.message || "Unable to add role mapping.", "error");
    } finally {
      setAdding(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 p-6 md:p-10">
      <div className="mx-auto max-w-4xl rounded-2xl bg-white p-8 shadow-xl">
        <div className="mb-6">
          <h2 className="text-2xl font-semibold text-slate-800">Permission Types</h2>
          <p className="mt-2 text-sm text-slate-500">
            Map a system permission type to one or more roles, with a branch and approval requirements per role.
          </p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="permissionType">Permission Type</Label>
          <Select value={selectedPermissionType} onValueChange={setSelectedPermissionType}>
            <SelectTrigger id="permissionType">
              <SelectValue placeholder={permissionTypesLoading ? "Loading permission types..." : "Select a permission type"} />
            </SelectTrigger>
            <SelectContent className="max-h-60 overflow-y-auto">
              {permissionTypes.map((permissionType) => (
                <SelectItem key={permissionType} value={permissionType}>{permissionType}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {selectedPermissionType && (
          <>
            <div className="mt-6">
              <div className="flex items-center justify-between">
                <Label className="text-xs font-semibold uppercase tracking-wider text-gray-400">
                  Mapped Roles
                </Label>
                {assignedLoading && <span className="text-xs text-slate-400">Loading current mappings...</span>}
              </div>

              <div className="mt-2 overflow-x-auto rounded-xl border border-slate-200">
                <table className="w-full text-left">
                  <thead className="bg-slate-50">
                    <tr className="divide-x divide-slate-200">
                      <th className="px-4 py-2.5 text-sm font-semibold text-slate-700">Role</th>
                      <th className="px-4 py-2.5 text-sm font-semibold text-slate-700">Branch</th>
                      <th className="px-4 py-2.5 text-sm font-semibold text-slate-700">Required Approvers</th>
                      <th className="px-4 py-2.5 text-sm font-semibold text-slate-700">Approval Priority</th>
                      <th className="px-4 py-2.5 text-sm font-semibold text-slate-700 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {assignedRows.length > 0 ? (
                      assignedRows.map((row) => (
                        <tr key={row.roleName}>
                          <td className="px-4 py-2.5 text-sm text-slate-700">{row.roleName}</td>
                          <td className="px-4 py-2.5 text-sm text-slate-700">
                            {row.branchDescription || branchDescriptionById.get(String(row.branchId)) || "—"}
                          </td>
                          <td className="px-4 py-2.5 text-sm text-slate-700">{row.requiredApprovers}</td>
                          <td className="px-4 py-2.5 text-sm text-slate-700">{row.approvalPriority}</td>
                          <td className="px-4 py-2.5 text-right">
                            <button
                              type="button"
                              onClick={() => handleRemove(row)}
                              disabled={removingRoleNames.has(row.roleName)}
                              className="rounded-md p-1.5 text-red-600 hover:bg-red-50 disabled:opacity-50"
                              title={`Remove ${row.roleName}`}
                            >
                              <FaTrash className="text-xs" />
                            </button>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={5} className="px-4 py-3 text-sm text-slate-500">
                          {assignedLoading ? "Loading..." : "No roles mapped to this permission type yet."}
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="mt-6 rounded-xl border border-slate-200 p-4">
              <Label className="text-xs font-semibold uppercase tracking-wider text-gray-400">
                Add Role Mapping
              </Label>

              {availableRoles.length === 0 && !rolesLoading ? (
                <p className="mt-2 text-sm text-slate-500">All roles are already mapped to this permission type.</p>
              ) : (
                <>
                  <div className="mt-3 grid grid-cols-1 gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="addRole">Role</Label>
                      <Select value={addForm.roleName} onValueChange={(v) => updateAddForm("roleName", v)}>
                        <SelectTrigger id="addRole">
                          <SelectValue placeholder={rolesLoading ? "Loading roles..." : "Select a role"} />
                        </SelectTrigger>
                        <SelectContent>
                          {availableRoles.map((roleName) => (
                            <SelectItem key={roleName} value={roleName}>{roleName}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="addBranch">Branch</Label>
                      <Select value={addForm.branchId} onValueChange={(v) => updateAddForm("branchId", v)}>
                        <SelectTrigger id="addBranch">
                          <SelectValue placeholder={branchesLoading ? "Loading branches..." : "Select a branch"} />
                        </SelectTrigger>
                        <SelectContent>
                          {branches.map((branch) => (
                            <SelectItem key={branch.Id} value={String(branch.Id)}>{branch.Description}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="requiredApprovers">Required Approvers</Label>
                      <Input
                        id="requiredApprovers"
                        type="number"
                        min="0"
                        step="1"
                        value={addForm.requiredApprovers}
                        onChange={(e) => updateAddForm("requiredApprovers", e.target.value)}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="approvalPriority">Approval Priority</Label>
                      <Input
                        id="approvalPriority"
                        type="number"
                        min="0"
                        step="1"
                        value={addForm.approvalPriority}
                        onChange={(e) => updateAddForm("approvalPriority", e.target.value)}
                      />
                    </div>
                  </div>

                  <div className="mt-4 flex justify-end">
                    <Button
                      type="button"
                      onClick={handleAdd}
                      disabled={adding}
                      className="bg-indigo-600 hover:bg-indigo-700"
                    >
                      {adding ? "Adding..." : "Add Mapping"}
                    </Button>
                  </div>
                </>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
