import { Label } from "@/components/ui/label";
import { FaInfoCircle } from "react-icons/fa";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

export function BatchFieldHelp({ label, children }) {
  if (!children) return null;
  return (
    <Popover>
      <PopoverTrigger asChild>
        <button type="button" aria-label={`About ${label}`} className="inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-gray-400 hover:bg-indigo-50 hover:text-indigo-600 focus:outline-none focus:ring-2 focus:ring-indigo-500">
          <FaInfoCircle className="text-sm" aria-hidden="true" />
        </button>
      </PopoverTrigger>
      <PopoverContent align="start" side="top" collisionPadding={12} className="z-[100] w-72 max-w-[calc(100vw-24px)] border-gray-200 bg-white p-3 text-sm leading-5 text-gray-700 shadow-lg">
        <p className="font-semibold text-gray-800">{label}</p>
        <p className="mt-1">{children}</p>
      </PopoverContent>
    </Popover>
  );
}

export default function BatchFieldLabel({ label, help, htmlFor }) {
  return (
    <div className="mb-1 flex items-center gap-1.5">
      <Label htmlFor={htmlFor} className="text-sm font-semibold text-gray-700">{label}</Label>
      <BatchFieldHelp label={label}>{help}</BatchFieldHelp>
    </div>
  );
}
