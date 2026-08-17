import { useState } from "react";
import { FaLayerGroup } from "react-icons/fa";
import { BATCH_TYPES } from "./types/registry";

// api/accounts/{creditbatches,debitbatches,wiretransferbatches,...} —
// docs/api/batch-procedures-api-spec.md. One shell, 3 stages
// (Origination/Verification/Authorization), 9 type-tabs per stage. Gating is
// stage-level only (NavigationMenu codes 23069/23079/23089) — the per-type
// child codes are commented out server-side, so there's no per-type tab
// gating to build; Layout.jsx already blocks the route itself if the
// stage-level code isn't in the caller's by-role response.
const STAGE_META = {
  origination: { title: "Batch Origination" },
  verification: { title: "Batch Verification" },
  authorization: { title: "Batch Authorization" },
};

export default function BatchStageScreen({ stage }) {
  const [activeType, setActiveType] = useState(BATCH_TYPES[0].id);
  const type = BATCH_TYPES.find((t) => t.id === activeType);
  const meta = STAGE_META[stage];

  return (
    <div className="bg-white m-8 px-8 py-8 shadow-2xl rounded-lg relative">
      <div className="flex justify-between items-center mb-6 bg-indigo-800 px-6 py-3 rounded-2xl">
        <h2 className="text-xl font-bold text-white flex items-center gap-2">
          <FaLayerGroup /> {meta.title}
        </h2>
      </div>

      <div className="flex flex-wrap gap-1 mb-6 bg-gray-100 rounded-lg p-1 w-fit">
        {BATCH_TYPES.map((t) => (
          <button
            key={t.id}
            type="button"
            disabled={!t.Panel}
            onClick={() => setActiveType(t.id)}
            title={!t.Panel ? "Not built yet." : undefined}
            className={`px-4 py-1.5 text-sm font-semibold rounded-md transition-all whitespace-nowrap ${
              !t.Panel
                ? "text-gray-300 cursor-not-allowed"
                : activeType === t.id
                  ? "bg-white shadow text-indigo-700"
                  : "text-gray-500 hover:text-indigo-600"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {type.Panel ? <type.Panel stage={stage} /> : (
        <p className="text-sm text-gray-400 text-center py-10">This batch type isn't built yet.</p>
      )}
    </div>
  );
}
