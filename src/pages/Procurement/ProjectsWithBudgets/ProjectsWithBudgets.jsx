"use client";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  FaChevronDown,
  FaChevronUp,
  FaBuilding,
  FaProjectDiagram,
  FaPlus,
} from "react-icons/fa";
import NotFoundImage from "/assets/scopefinding.png";
import AddProjectWithBudgetsAndLines from "./AddProjectWithBudgetsAndLines";

export default function ProjectsWithBudgets() {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedProject, setExpandedProject] = useState(null);
  const [expandedBudget, setExpandedBudget] = useState(null);
  const [addDrawerOpen, setAddDrawerOpen] = useState(false);

  // ✅ Fetch Projects with Budgets and Lines
  const fetchProjects = async () => {
    try {
      const res = await fetch(
        `${import.meta.env.VITE_APP_PRO_URL}/api/BudgetManagement/GetAllProjectWithBudgetsAndLines`,
        {
          headers: { "ngrok-skip-browser-warning": "true" },
        }
      );
      const data = await res.json();

      if (Array.isArray(data)) {
        setProjects(data);
      } else {
        setProjects([]);
      }
    } catch (error) {
      console.error("Error fetching projects:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProjects();
  }, []);

  return (
    <div className="bg-white m-8 px-8 py-8 rounded-lg">
      {/* HEADER */}
      <div className="flex justify-between items-center mb-6 bg-indigo-800 px-6 py-3 rounded-2xl">
        <h2 className="text-xl font-bold text-white flex items-center gap-2">
          <FaProjectDiagram className="text-white" /> Projects with Budgets
        </h2>
        <Button
          className="bg-indigo-600 hover:bg-indigo-700 flex items-center gap-2"
          onClick={() => setAddDrawerOpen(true)}
        >
          <FaPlus /> Add Project Budgets
        </Button>
      </div>

      {/* TABLE HEADER */}
      <div className="bg-gray-200 p-4 rounded-sm">
        <div className="grid grid-cols-8 gap-4 bg-gray-700 text-gray-100 font-semibold p-3 rounded-lg mb-4">
          <span>Code</span>
          <span>Project Name</span>
          <span>Manager</span>
          <span>Department</span>
          <span>Start Date</span>
          <span>End Date</span>
          <span>Budget (KES)</span>
          <span className="text-right">Actions</span>
        </div>

        {/* LOADING STATE */}
        {loading ? (
          <div className="space-y-2 animate-pulse">
            {Array.from({ length: 3 }).map((_, i) => (
              <div
                key={i}
                className="grid grid-cols-8 gap-2 bg-gray-50 py-4 px-6 rounded"
              >
                {Array.from({ length: 8 }).map((__, j) => (
                  <div key={j} className="h-4 bg-gray-200 rounded"></div>
                ))}
              </div>
            ))}
          </div>
        ) : projects.length > 0 ? (
          <div className="space-y-2">
            {projects.map((project) => (
              <div key={project.ProjectId} className="bg-white rounded-lg shadow border">
                {/* PROJECT ROW */}
                <div className="grid grid-cols-8 gap-2 items-center py-4 px-6 hover:shadow-lg transition-all">
                  <span className="font-semibold text-indigo-700">
                    {project.ProjectCode}
                  </span>
                  <span>{project.ProjectName}</span>
                  <span>{project.ProjectManager}</span>
                  <span>{project.Department}</span>
                  <span>{new Date(project.StartDate).toLocaleDateString()}</span>
                  <span>{new Date(project.EndDate).toLocaleDateString()}</span>
                  <span className="font-semibold">
                    {project.BudgetAmount
                      ? `KES ${project.BudgetAmount.toLocaleString()}`
                      : "—"}
                  </span>
                  <div className="flex justify-end">
                    <Button
                      size="sm"
                      variant="outline"
                      className="bg-gray-700 text-white hover:bg-gray-600"
                      onClick={() =>
                        setExpandedProject(
                          expandedProject === project.ProjectId
                            ? null
                            : project.ProjectId
                        )
                      }
                    >
                      {expandedProject === project.ProjectId ? (
                        <>
                          <FaChevronUp /> Hide Budgets
                        </>
                      ) : (
                        <>
                          <FaChevronDown /> View Budgets
                        </>
                      )}
                    </Button>
                  </div>
                </div>

                {/* EXPANDED BUDGETS SECTION */}
                {expandedProject === project.ProjectId && (
                  <div className="bg-gray-100 px-6 py-4 border-t">
                    {project.Budgets && project.Budgets.length > 0 ? (
                      project.Budgets.map((budget) => (
                        <div
                          key={budget.BudgetId}
                          className="bg-white rounded-lg shadow mb-4 border border-gray-200"
                        >
                          {/* BUDGET HEADER */}
                          <div className="flex justify-between items-center bg-indigo-800 px-4 py-3 rounded-t-lg">
                            <div>
                              <h4 className="font-semibold text-indigo-100">
                                {budget.BudgetTitle} ({budget.BudgetCode})
                              </h4>
                              <p className="text-sm text-gray-100">
                                {/* Fiscal Year: {budget.FiscalYear} | Created By:{" "} */}
                                Created By: {budget.CreatedBy}
                              </p>
                              <p className="text-sm text-gray-100">
                                Total Amount: {budget.TotalAmount} | ApprovedAmount:{" "}
                                {budget.ApprovedAmount}
                              </p>
                            </div>
                            <div className="flex items-center gap-2">
                              <span
                                className={`text-sm font-medium px-3 py-1 rounded-full ${budget.ApprovalStatus === "Pending"
                                  ? "bg-yellow-500 text-white"
                                  : budget.ApprovalStatus === "Approved"
                                    ? "bg-green-600 text-white"
                                    : "bg-gray-500 text-white"
                                  }`}
                              >
                                {budget.ApprovalStatus}
                              </span>
                              <Button
                                size="sm"
                                variant="outline"
                                className="bg-gray-700 text-white hover:bg-gray-600"
                                onClick={() =>
                                  setExpandedBudget(
                                    expandedBudget === budget.BudgetId
                                      ? null
                                      : budget.BudgetId
                                  )
                                }
                              >
                                {expandedBudget === budget.BudgetId ? (
                                  <>
                                    <FaChevronUp /> Hide Lines
                                  </>
                                ) : (
                                  <>
                                    <FaChevronDown /> View Lines
                                  </>
                                )}
                              </Button>
                            </div>
                          </div>

                          {/* BUDGET LINES */}
                          {expandedBudget === budget.BudgetId && (
                            <div className="bg-gray-50 p-4 rounded-b-lg">
                              <div className="grid grid-cols-4 gap-4 font-semibold bg-gray-700 text-white py-2 px-4 rounded">
                                <span>#</span>
                                <span>Account Code</span>
                                <span>Description</span>
                                {/* <span>Department</span>
                                <span>Category</span>
                                <span>Allocated</span> */}
                                <span>Spent</span>
                                {/* <span>Remaining</span> */}
                              </div>

                              {budget.BudgetLines &&
                                budget.BudgetLines.length > 0 ? (
                                budget.BudgetLines.map((line, i) => (
                                  <div
                                    key={line.BudgetLineId}
                                    className="grid grid-cols-4 gap-4 py-2 px-4 border-b border-gray-200"
                                  >
                                    <span>{i + 1}</span>
                                    <span>{line.AccountCode}</span>
                                    <span>{line.Description}</span>
                                    {/* <span>{line.Department}</span> */}
                                    {/* <span>{line.Category}</span> */}
                                    {/* <span>
                                      KES{" "}
                                      {line.AllocatedAmount.toLocaleString()}
                                    </span> */}
                                    <span>
                                      KES {line.SpentAmount.toLocaleString()}
                                    </span>
                                    {/* <span className="font-medium">
                                      KES{" "}
                                      {line.RemainingAmount.toLocaleString()}
                                    </span> */}
                                  </div>
                                ))
                              ) : (
                                <p className="text-center py-3 text-gray-600">
                                  No budget lines found.
                                </p>
                              )}
                            </div>
                          )}
                        </div>
                      ))
                    ) : (
                      <p className="text-center py-4 text-gray-600">
                        No budgets found for this project.
                      </p>
                    )}
                  </div>
                )}
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
            <p className="font-medium text-gray-400">
              No Projects with Budgets found.
            </p>
          </div>
        )}
      </div>
      <AddProjectWithBudgetsAndLines
        open={addDrawerOpen}
        onClose={() => setAddDrawerOpen(false)}
      />
    </div>
  );
}
