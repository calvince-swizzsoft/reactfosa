import { useParams } from "react-router-dom";
import { FaTools } from "react-icons/fa";
import { useModuleTree } from "@/context/ModuleTreeContext";

function findByCode(nodes, code) {
  for (const node of nodes) {
    if (String(node.Code) === code) return node;
    const found = findByCode(node.Children, code);
    if (found) return found;
  }
  return null;
}

export default function PlaceholderModule() {
  const { code } = useParams();
  const { tree } = useModuleTree();
  const module = findByCode(tree, code);

  return (
    <div className="flex min-h-[60vh] items-center justify-center p-6">
      <div className="max-w-md rounded-2xl bg-white p-8 text-center shadow-xl">
        <FaTools className="mx-auto mb-4 text-3xl text-amber-500" />
        <h2 className="text-xl font-semibold text-slate-800">
          {module?.Description || "This module"} isn't wired up yet
        </h2>
        <p className="mt-2 text-sm text-slate-500">
          This item exists in the backend's navigation but doesn't have a page built for it yet.
        </p>
        <dl className="mt-4 grid grid-cols-2 gap-2 text-left text-xs text-slate-500">
          <dt className="font-medium text-slate-600">Code</dt>
          <dd>{module?.Code ?? code}</dd>
          <dt className="font-medium text-slate-600">Controller</dt>
          <dd>{module?.ControllerName || "—"}</dd>
          <dt className="font-medium text-slate-600">Action</dt>
          <dd>{module?.ActionName || "—"}</dd>
        </dl>
      </div>
    </div>
  );
}
