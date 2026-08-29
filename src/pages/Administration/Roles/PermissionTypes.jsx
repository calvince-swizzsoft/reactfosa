import { useEffect, useMemo, useRef, useState } from "react";
import { FaChevronDown, FaSearch, FaShieldAlt, FaTimes, FaTrash, FaUsersCog } from "react-icons/fa";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import Swal from "sweetalert2";
import { apiErrorMessage, apiJson } from "@/lib/api";
import { normalizeBranchOptions } from "../branchOptions";

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

const searchablePermissionName = (permissionType) => {
  const value = String(permissionType);
  const aliases = value.startsWith("FrontOffice")
    ? " fosa front office"
    : value.startsWith("BackOffice") ? " bosa back office" : "";
  return value
    .replace(/([a-z0-9])([A-Z])/g, "$1 $2")
    .replace(/[_-]+/g, " ")
    .toLowerCase() + aliases;
};

const permissionGroup = (permissionType) => {
  if (String(permissionType).startsWith("FrontOffice")) return "FOSA / Front Office";
  if (String(permissionType).startsWith("BackOffice")) return "BOSA / Back Office";
  return "Other Permissions";
};

export default function AdministrationPermissionTypes() {
  const [permissionTypes, setPermissionTypes] = useState([]);
  const [permissionTypesLoading, setPermissionTypesLoading] = useState(false);
  const [selectedPermissionType, setSelectedPermissionType] = useState("");
  const [permissionSearch, setPermissionSearch] = useState("");
  const [permissionPickerOpen, setPermissionPickerOpen] = useState(false);
  const permissionPickerRef = useRef(null);

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
        const data = await apiJson(`${import.meta.env.VITE_APP_ADMIN_URL}/api/administration/roles/permissiontypes`, {}, { fallbackMessage: "Failed to load permission types." });

        const list = Array.isArray(data?.data) ? data.data : Array.isArray(data) ? data : [];
        setPermissionTypes(list.map(normalizePermissionType).filter(Boolean));
      } catch (error) {
        Swal.fire("Error", apiErrorMessage(error, "Unable to load permission types."), "error");
      } finally {
        setPermissionTypesLoading(false);
      }
    };

    const fetchRoles = async () => {
      setRolesLoading(true);
      try {
        const data = await apiJson(`${import.meta.env.VITE_APP_ADMIN_URL}/api/administration/roles`, {}, { fallbackMessage: "Failed to load roles." });

        const roleList = Array.isArray(data?.data) ? data.data : Array.isArray(data) ? data : [];
        setRoles(roleList.map(normalizeRoleName).filter(Boolean));
      } catch (error) {
        Swal.fire("Error", apiErrorMessage(error, "Unable to load roles."), "error");
      } finally {
        setRolesLoading(false);
      }
    };

    const fetchBranches = async () => {
      setBranchesLoading(true);
      try {
        const data = await apiJson(`${import.meta.env.VITE_APP_ADMIN_URL}/api/administration/branches/all`, {}, { fallbackMessage: "Failed to load branches." });
        setBranches(normalizeBranchOptions(data));
      } catch (error) {
        Swal.fire("Error", apiErrorMessage(error, "Unable to load branches."), "error");
      } finally {
        setBranchesLoading(false);
      }
    };

    fetchPermissionTypes();
    fetchRoles();
    fetchBranches();
  }, []);

  useEffect(() => {
    const closePicker = (event) => {
      if (!permissionPickerRef.current?.contains(event.target)) setPermissionPickerOpen(false);
    };
    document.addEventListener("mousedown", closePicker);
    return () => document.removeEventListener("mousedown", closePicker);
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
        const data = await apiJson(`${import.meta.env.VITE_APP_ADMIN_URL}/api/administration/roles/GetRolesForPermissionType?permissionType=${encodeURIComponent(selectedPermissionType)}`, {}, { fallbackMessage: "Failed to load roles for this permission type." });

        const rowList = Array.isArray(data?.data) ? data.data : Array.isArray(data) ? data : [];
        setAssignedRows(rowList.map(normalizeAssignedRole).filter((row) => row.roleName));
      } catch (error) {
        Swal.fire("Error", apiErrorMessage(error, "Unable to load current roles for this permission type."), "error");
        setAssignedRows([]);
      } finally {
        setAssignedLoading(false);
      }
    };

    fetchAssignedRoles();
  }, [selectedPermissionType]);

  const branchDescriptionById = useMemo(() => {
    const map = new Map();
    branches.forEach((branch) => map.set(String(branch.id), branch.name));
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

  const groupedPermissionTypes = useMemo(() => {
    const terms = searchablePermissionName(permissionSearch).split(/\s+/).filter(Boolean);
    const matches = permissionTypes.filter((permissionType) => {
      const searchable = searchablePermissionName(permissionType);
      return terms.every((term) => searchable.includes(term));
    });

    return ["FOSA / Front Office", "BOSA / Back Office", "Other Permissions"]
      .map((label) => ({ label, items: matches.filter((item) => permissionGroup(item) === label) }))
      .filter((group) => group.items.length > 0);
  }, [permissionSearch, permissionTypes]);

  const matchingPermissionCount = useMemo(
    () => groupedPermissionTypes.reduce((count, group) => count + group.items.length, 0),
    [groupedPermissionTypes]
  );

  const choosePermissionType = (permissionType) => {
    setSelectedPermissionType(permissionType);
    setPermissionSearch(permissionType);
    setPermissionPickerOpen(false);
  };

  const updateAddForm = (key, value) => setAddForm((prev) => ({ ...prev, [key]: value }));

  const handleRemove = async (row) => {
    if (!selectedPermissionType) return;

    const { roleName } = row;
    setRemovingRoleNames((prev) => new Set(prev).add(roleName));

    try {
      const data = await apiJson(
        `${import.meta.env.VITE_APP_ADMIN_URL}/api/administration/roles/RemoveRolesFromPermissionType`,
        {
          method: "POST",
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
        },
        { fallbackMessage: `Failed to remove "${roleName}" from "${selectedPermissionType}".` },
      );

      setAssignedRows((prev) => prev.filter((r) => r.roleName !== roleName));
    } catch (error) {
      Swal.fire("Error", apiErrorMessage(error, "Unable to remove role mapping."), "error");
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
      const data = await apiJson(
        `${import.meta.env.VITE_APP_ADMIN_URL}/api/administration/roles/addPermissionTypeToRoles`,
        {
          method: "POST",
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
        },
        { fallbackMessage: `Failed to map "${roleName}" to "${selectedPermissionType}".` },
      );

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
      Swal.fire("Error", apiErrorMessage(error, "Unable to add role mapping."), "error");
    } finally {
      setAdding(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 p-6 md:p-10">
      <div className="mx-auto max-w-6xl rounded-2xl bg-white p-8 shadow-xl">
        <div className="mb-6 flex items-start gap-3">
          <div className="mt-0.5 rounded-xl bg-indigo-50 p-3 text-indigo-600"><FaShieldAlt className="text-xl" /></div>
          <div>
          <h2 className="text-2xl font-semibold text-slate-800">Permission Types</h2>
          <p className="mt-2 text-sm text-slate-500">
            Map a system permission type to one or more roles, with a branch and approval requirements per role.
          </p>
          </div>
        </div>

        <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
          <Label htmlFor="permissionTypeSearch" className="text-xs font-semibold uppercase tracking-wider text-slate-500">Select permission type</Label>
          <div ref={permissionPickerRef} className="relative">
            <div className="relative mt-2">
              <FaSearch className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-xs text-slate-400" />
              <input
                id="permissionTypeSearch"
                type="text"
                role="combobox"
                aria-expanded={permissionPickerOpen}
                aria-controls="permissionTypeOptions"
                autoComplete="off"
                disabled={permissionTypesLoading}
                value={permissionSearch}
                onFocus={() => setPermissionPickerOpen(true)}
                onChange={(event) => {
                  setPermissionSearch(event.target.value);
                  if (event.target.value !== selectedPermissionType) setSelectedPermissionType("");
                  setPermissionPickerOpen(true);
                }}
                onKeyDown={(event) => {
                  if (event.key === "Escape") setPermissionPickerOpen(false);
                  if (event.key === "Enter" && permissionPickerOpen && matchingPermissionCount === 1) {
                    event.preventDefault();
                    choosePermissionType(groupedPermissionTypes[0].items[0]);
                  }
                }}
                placeholder={permissionTypesLoading ? "Loading permission types..." : "Search permissions, e.g. FOSA loan approval"}
                className="h-10 w-full rounded-md border border-slate-200 bg-white pl-9 pr-16 text-sm text-slate-800 outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 disabled:cursor-not-allowed disabled:opacity-50"
              />
              <div className="absolute right-2 top-1/2 flex -translate-y-1/2 items-center gap-1">
                {permissionSearch && (
                  <button
                    type="button"
                    onClick={() => {
                      setPermissionSearch("");
                      setSelectedPermissionType("");
                      setPermissionPickerOpen(true);
                    }}
                    className="rounded p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
                    aria-label="Clear permission type"
                  >
                    <FaTimes className="text-xs" />
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => setPermissionPickerOpen((open) => !open)}
                  className="rounded p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
                  aria-label="Toggle permission options"
                >
                  <FaChevronDown className={`text-xs transition-transform ${permissionPickerOpen ? "rotate-180" : ""}`} />
                </button>
              </div>
            </div>

            {permissionPickerOpen && !permissionTypesLoading && (
              <div id="permissionTypeOptions" role="listbox" className="absolute z-30 mt-1 max-h-80 w-full overflow-y-auto rounded-xl border border-slate-200 bg-white p-2 shadow-lg">
                <div className="px-2 pb-2 text-xs text-slate-400">
                  {matchingPermissionCount} {matchingPermissionCount === 1 ? "permission" : "permissions"} found
                </div>
                {groupedPermissionTypes.length > 0 ? groupedPermissionTypes.map((group) => (
                  <div key={group.label} className="mb-2 last:mb-0">
                    <p className="px-2 py-1 text-xs font-semibold uppercase tracking-wider text-slate-400">{group.label}</p>
                    {group.items.map((permissionType) => (
                      <button
                        key={permissionType}
                        type="button"
                        role="option"
                        aria-selected={selectedPermissionType === permissionType}
                        onClick={() => choosePermissionType(permissionType)}
                        className={`block w-full rounded-lg px-3 py-2 text-left text-sm transition-colors ${
                          selectedPermissionType === permissionType
                            ? "bg-indigo-50 font-medium text-indigo-700"
                            : "text-slate-700 hover:bg-slate-50"
                        }`}
                      >
                        {permissionType}
                      </button>
                    ))}
                  </div>
                )) : (
                  <p className="px-3 py-6 text-center text-sm text-slate-500">No permission types match your search.</p>
                )}
              </div>
            )}
          </div>
          <p className="mt-2 text-xs text-slate-500">Search by workflow area, action, FOSA, or BOSA.</p>
        </div>

        {selectedPermissionType && (
          <>
            <div className="mt-6 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-indigo-100 bg-indigo-50 px-4 py-3">
              <div className="flex items-center gap-3">
                <FaUsersCog className="text-indigo-600" />
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-indigo-500">Managing permission</p>
                  <p className="font-semibold text-indigo-900">{selectedPermissionType}</p>
                </div>
              </div>
              <span className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-indigo-700 shadow-sm">
                {assignedRows.length} {assignedRows.length === 1 ? "mapped role" : "mapped roles"}
              </span>
            </div>

            <div className="mt-6">
              <div className="flex items-center justify-between">
                <Label className="text-xs font-semibold uppercase tracking-wider text-slate-400">
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
                    {assignedLoading ? (
                      Array.from({ length: 3 }).map((_, index) => (
                        <tr key={index} className="animate-pulse">
                          <td colSpan={5} className="px-4 py-3"><div className="h-4 rounded bg-slate-100" /></td>
                        </tr>
                      ))
                    ) : assignedRows.length > 0 ? (
                      assignedRows.map((row) => (
                        <tr key={row.roleName} className="transition-colors hover:bg-slate-50">
                          <td className="px-4 py-2.5 text-sm font-medium text-slate-800">{row.roleName}</td>
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
                          No roles mapped to this permission type yet. Use the form below to add the first mapping.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="mt-6 rounded-xl border border-slate-200 bg-slate-50 p-5">
              <Label className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                Add Role Mapping
              </Label>
              <p className="mt-1 text-sm text-slate-500">Assign a role and branch, then define its approval count and sequence.</p>

              {availableRoles.length === 0 && !rolesLoading ? (
                <p className="mt-2 text-sm text-slate-500">All roles are already mapped to this permission type.</p>
              ) : (
                <>
                  <div className="mt-3 grid grid-cols-1 gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="addRole" className="text-sm font-semibold text-slate-700">Role</Label>
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
                      <Label htmlFor="addBranch" className="text-sm font-semibold text-slate-700">Branch</Label>
                      <Select value={addForm.branchId} onValueChange={(v) => updateAddForm("branchId", v)}>
                        <SelectTrigger id="addBranch">
                          <SelectValue placeholder={branchesLoading ? "Loading branches..." : "Select a branch"} />
                        </SelectTrigger>
                        <SelectContent>
                          {branches.map((branch) => (
                            <SelectItem key={branch.id} value={String(branch.id)}>{branch.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="requiredApprovers" className="text-sm font-semibold text-slate-700">Required Approvers</Label>
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
                      <Label htmlFor="approvalPriority" className="text-sm font-semibold text-slate-700">Approval Priority</Label>
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

        {!selectedPermissionType && !permissionTypesLoading && (
          <div className="mt-6 rounded-xl border border-dashed border-slate-300 px-6 py-12 text-center">
            <FaShieldAlt className="mx-auto text-3xl text-slate-300" />
            <p className="mt-3 font-medium text-slate-700">Select a permission type to manage its role mappings</p>
            <p className="mt-1 text-sm text-slate-500">Existing assignments and the add-mapping form will appear here.</p>
          </div>
        )}
      </div>
    </div>
  );
}
