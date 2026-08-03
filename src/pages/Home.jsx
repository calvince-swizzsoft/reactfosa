import { Navigate } from "react-router-dom";
import { useModuleTree } from "@/context/ModuleTreeContext";
import { findFirstLeaf } from "@/lib/moduleTree";
import { moduleRouteMap } from "@/lib/moduleRouteMap";

export default function Home() {
  const { tree, loading } = useModuleTree();

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center p-6 text-sm text-slate-500">
        Loading your workspace...
      </div>
    );
  }

  const firstPath = findFirstLeaf(tree, moduleRouteMap);

  if (firstPath) {
    return <Navigate to={firstPath} replace />;
  }

  return (
    <div className="flex min-h-[60vh] items-center justify-center p-6">
      <div className="max-w-md rounded-2xl bg-white p-8 text-center shadow-xl">
        <h2 className="text-xl font-semibold text-slate-800">No modules available</h2>
        <p className="mt-2 text-sm text-slate-500">
          Your account doesn't have access to any modules yet. Contact an administrator.
        </p>
      </div>
    </div>
  );
}
