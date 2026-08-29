import { FaInfoCircle } from "react-icons/fa";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

export default function FieldHelp({ label, children }) {
  if (!children) return null;

  return (
    <Popover>
      <PopoverTrigger asChild>
        <button
          type="button"
          aria-label={`About ${label}`}
          className="inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-gray-400 hover:bg-indigo-50 hover:text-indigo-600 focus:outline-none focus:ring-2 focus:ring-indigo-500"
        >
          <FaInfoCircle className="text-sm" aria-hidden="true" />
        </button>
      </PopoverTrigger>
      <PopoverContent align="start" side="top" className="w-64 border-gray-200 bg-white p-3 text-sm leading-5 text-gray-700 shadow-lg">
        <p className="font-semibold text-gray-800">{label}</p>
        <p className="mt-1">{children}</p>
      </PopoverContent>
    </Popover>
  );
}
