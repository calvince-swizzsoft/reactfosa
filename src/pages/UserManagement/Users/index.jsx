
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import {
    FaUsers,
    FaChevronDown,
    FaChevronUp,
    FaEllipsisV,
    FaTrash,
    FaUserPlus,
} from "react-icons/fa";

import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

import Swal from "sweetalert2";
import NotFoundImage from "/assets/scopefinding.png";
import RegisterMember from "./RegisterMember";

export default function Users() {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [expandedUser, setExpandedUser] = useState(null);
    const [openRegister, setOpenRegister] = useState(false);

    useEffect(() => {
        fetchUsers();
    }, []);

    const fetchUsers = async () => {
        setLoading(true);
        try {
            const res = await fetch(
                "http://95.216.225.26:8006/api/auth/GetUsers"
            );
            const json = await res.json();
            if (json.success) setUsers(json.data);
        } catch (err) {
            console.error("Fetch Users Error:", err);
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id) => {
        Swal.fire({
            title: "Delete User?",
            text: "This action cannot be undone.",
            icon: "warning",
            showCancelButton: true,
            confirmButtonColor: "#dc2626",
            cancelButtonColor: "#6b7280",
            confirmButtonText: "Delete",
        }).then(async (result) => {
            if (result.isConfirmed) {
                try {
                    const res = await fetch(
                        `http://95.216.225.26:8006/api/auth/DeleteUser/${id}`,
                        { method: "DELETE" }
                    );

                    if (!res.ok) throw new Error("Failed to delete user");

                    setUsers((prev) => prev.filter((u) => u.Id !== id));

                    Swal.fire("Deleted!", "User removed successfully.", "success");
                } catch (err) {
                    Swal.fire("Error", err.message, "error");
                }
            }
        });
    };

    return (
        <div className="bg-white m-8 px-8 py-8 shadow-2xl rounded-lg relative">

            {/* Header */}
            <div className="flex justify-between items-center mb-6 bg-indigo-800 px-6 py-3 rounded-2xl">
                <h2 className="text-xl font-bold text-white flex items-center gap-2">
                    <FaUsers /> Users
                </h2>

                <Button
                    className="bg-indigo-600 hover:bg-indigo-700 flex items-center gap-2"
                    onClick={() => setOpenRegister(true)}
                >
                    <FaUserPlus /> Register User
                </Button>
            </div>

            <div className="bg-gray-200 p-4 rounded-sm">

                {/* Table Header */}
                <div className="grid grid-cols-12 gap-4 bg-gray-700 text-gray-100 font-semibold p-3 rounded-lg mb-4">
                    <span className="col-span-3">Name</span>
                    <span className="col-span-2">Username</span>
                    <span className="col-span-2">Role</span>
                    <span className="col-span-2">Department</span>
                    <span className="col-span-1">Status</span>
                    <span className="col-span-2 text-right">Actions</span>
                </div>

                {loading ? (
                    <div className="space-y-2 animate-pulse">
                        {Array.from({ length: 3 }).map((_, i) => (
                            <div
                                key={i}
                                className="grid grid-cols-12 gap-2 bg-gray-50 p-6 rounded"
                            >
                                {Array.from({ length: 12 }).map((__, j) => (
                                    <div key={j} className="h-4 bg-gray-200 rounded"></div>
                                ))}
                            </div>
                        ))}
                    </div>
                ) : users.length > 0 ? (
                    <div className="space-y-2">
                        {users.map((user) => (
                            <div
                                key={user.Id}
                                className="bg-white rounded-lg shadow-lg border"
                            >
                                <div className="grid grid-cols-12 gap-2 items-center py-4 px-6 hover:shadow-xl transition-all">

                                    <span className="font-medium text-indigo-700 col-span-3">
                                        {user.FirstName} {user.LastName}
                                    </span>

                                    <span className="col-span-2">{user.Username}</span>
                                    <span className="col-span-2">{user.Role}</span>
                                    <span className="col-span-2">{user.Department || "N/A"}</span>

                                    <span className="col-span-1">
                                        <span
                                            className={`px-2 py-1 text-xs rounded-full ${user.IsActive
                                                ? "bg-green-100 text-green-700"
                                                : "bg-red-100 text-red-700"
                                                }`}
                                        >
                                            {user.IsActive ? "Active" : "Inactive"}
                                        </span>
                                    </span>

                                    {/* Expand */}
                                    <div className="col-span-1 flex justify-end">
                                        <Button
                                            size="sm"
                                            variant="outline"
                                            className="bg-gray-700 hover:bg-gray-600 text-white"
                                            onClick={() =>
                                                setExpandedUser(
                                                    expandedUser === user.Id ? null : user.Id
                                                )
                                            }
                                        >
                                            {expandedUser === user.Id ? (
                                                <>
                                                    <FaChevronUp /> Hide
                                                </>
                                            ) : (
                                                <>
                                                    <FaChevronDown /> View
                                                </>
                                            )}
                                        </Button>
                                    </div>

                                    {/* Dropdown */}
                                    <div className="col-span-1 flex justify-end">
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <Button variant="ghost" size="icon" className="h-8 w-8">
                                                    <FaEllipsisV className="h-4 w-4 text-gray-600" />
                                                </Button>
                                            </DropdownMenuTrigger>

                                            <DropdownMenuContent align="end" className="w-32">
                                                <DropdownMenuItem
                                                    className="text-red-600"
                                                    onClick={() => handleDelete(user.Id)}
                                                >
                                                    <FaTrash className="mr-2" /> Delete
                                                </DropdownMenuItem>
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    </div>
                                </div>

                                {/* Expandable Section */}
                                {expandedUser === user.Id && (
                                    <div className="border-t bg-gray-200 p-4 rounded-b-lg">
                                        <div className="bg-white shadow-md rounded-xl p-6 grid grid-cols-1 md:grid-cols-2 gap-6 text-gray-700">
                                            <div>
                                                <p><strong>Email:</strong> {user.Email}</p>
                                                <p><strong>Phone:</strong> {user.PhoneNumber || "N/A"}</p>
                                            </div>
                                            <div>
                                                <p><strong>Created:</strong> {new Date(user.CreatedDate).toLocaleString()}</p>

                                            </div>
                                        </div>
                                    </div>
                                )}
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


            <RegisterMember
                open={openRegister}
                onClose={() => setOpenRegister(false)}
                refresh={fetchUsers}
            />
        </div>
    );
}