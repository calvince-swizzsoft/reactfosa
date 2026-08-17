import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import AddEmployeeDrawer from "./AddEmployeeDrawer"; // import the drawer
import {
  FaMoneyCheckAlt,
  FaEllipsisV,
  FaEdit,
} from "react-icons/fa";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import NotFoundImage from "/assets/scopefinding.png";

export default function Employees() {
  const navigate = useNavigate();
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [addDrawerOpen, setAddDrawerOpen] = useState(false);

  const fetchEmployees = () => {
    fetch(`${import.meta.env.VITE_APP_FIN_URL}/api/humanresource/employees`)
      .then((res) => res.json())
      .then((data) => {
        setEmployees(Array.isArray(data) ? data : []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  };


  useEffect(() => {
    fetchEmployees();
  }, []);

  return (
    <div className="bg-white m-8 px-8 py-8 shadow-2xl rounded-lg relative">
      {/* Header */}
      <div className="flex justify-between items-center mb-6 bg-indigo-700 px-6 py-3 rounded-2xl">
        <h2 className="text-xl font-bold text-white flex items-center gap-2">
          <FaMoneyCheckAlt /> Employees
        </h2>
        <Button
          onClick={() => setAddDrawerOpen(true)}
          className="bg-indigo-500 hover:bg-indigo-600 flex items-center gap-2"
        >
          + New Employee
        </Button>
      </div>

      {/* Table Header */}
      <div className="bg-gray-200 p-4 rounded-sm">
        <div className="grid grid-cols-12 gap-4 bg-gray-700 text-gray-100 font-semibold p-3 rounded-lg mb-4">
          <span className="col-span-2">Employee Type</span>
          <span className="col-span-2">Full Name</span>
          <span className="col-span-2">Payroll No.</span>
          <span className="col-span-2">Designation</span>
          <span className="col-span-2">Department</span>
          <span className="col-span-1">Is Locked</span>
          <span className="col-span-1 text-right">Actions</span>
        </div>


        {/* Loader */}
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
        ) : employees.length > 0 ? (
          <div className="space-y-2">
            {employees.map((employee) => (
              <div
                key={employee.Id}
                className="bg-white rounded-lg shadow-lg border"
              >
                {/* Main Row */}
                <div className="grid grid-cols-12 gap-4 items-center py-4 px-6 hover:shadow-xl transition-all">
                  <span className="font-medium text-green-700 col-span-2 truncate">
                    {employee.EmployeeTypeDescription}
                  </span>
                  <span className="col-span-2 truncate">
                    {`${employee.CustomerIndividualFirstName ?? ""} ${employee.CustomerIndividualLastName ?? ""}`.trim() || "—"}
                  </span>
                  <span className="col-span-2 text-indigo-600 font-semibold">
                    {employee.CustomerIndividualPayrollNumbers || "—"}
                  </span>
                  <span className="col-span-2 text-indigo-600 font-semibold">
                    {employee.DesignationDescription || "—"}
                  </span>
                  <span className="col-span-2 text-indigo-600 font-semibold">
                    {employee.DepartmentDescription || "—"}
                  </span>
                  <span className="col-span-1">
                    <span className={`px-2 py-1 rounded text-xs font-semibold ${employee.IsLocked ? "bg-red-100 text-red-600" : "bg-green-100 text-green-600"}`}>
                      {employee.IsLocked ? "Locked" : "Active"}
                    </span>
                  </span>

                  <div className="col-span-1 flex justify-end">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8"><FaEllipsisV className="text-gray-500" /></Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => navigate(`/HumanResource/Employees/${employee.Id}/edit`, { state: { employee } })}>
                          <FaEdit className="mr-2 text-indigo-600" /> Edit
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
            <img
              src={NotFoundImage}
              alt="Not Found"
              className="mx-auto w-42 h-auto"
            />
            <p className="font-medium text-gray-400">No Employees Found.</p>
          </div>
        )}
      </div>

      {/* Add Drawer */}
      <AddEmployeeDrawer
        open={addDrawerOpen}
        onClose={() => setAddDrawerOpen(false)}
        onSuccess={fetchEmployees}
      />
    </div>
  );
}
