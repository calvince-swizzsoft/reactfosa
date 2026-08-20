import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { FaFileAlt, FaSearch } from "react-icons/fa";
import Swal from "sweetalert2";
import { uploadDocument } from "./api";
import CustomerLookupModal from "./CustomerLookupModal";

const customerName = (item) =>
  [item.IndividualFirstName, item.IndividualLastName].filter(Boolean).join(" ") ||
  item.NonIndividualDescription ||
  item.Description ||
  "—";

function FieldGroup({ label, children }) {
  return (
    <div>
      <Label className="text-sm font-semibold text-gray-700">{label}</Label>
      {children}
    </div>
  );
}

export default function CreateCustomerDocument() {
  const navigate = useNavigate();
  const [customer, setCustomer] = useState(null);
  const [type, setType] = useState("0");
  const [fileTitle, setFileTitle] = useState("");
  const [fileDescription, setFileDescription] = useState("");
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [pickerOpen, setPickerOpen] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!file) {
      Swal.fire("Missing File", "Choose a file to upload.", "warning");
      return;
    }
    if (!customer) {
      Swal.fire("Missing Customer", "Look up and select the document's owner.", "warning");
      return;
    }
    setLoading(true);
    try {
      await uploadDocument({ file, customerId: customer.Id ?? customer.id, type: Number(type), fileTitle, fileDescription });
      Swal.fire("Success", "Document uploaded successfully", "success");
      navigate("/Registry/Customers/Documents");
    } catch (err) {
      Swal.fire("Error", err.message, "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white m-8 px-8 py-8 shadow-2xl rounded-lg relative">
      <div className="flex items-center justify-between gap-3 mb-6 bg-indigo-800 px-6 py-3 rounded-2xl">
        <div className="flex items-center gap-3">
          <FaFileAlt className="text-white text-xl" />
          <h2 className="text-xl font-bold text-white">Upload Customer Document</h2>
        </div>
        <Link to="/Registry/Customers/Documents" className="text-sm text-white/80 hover:text-white">
          &larr; Back to Documents
        </Link>
      </div>

      <form onSubmit={handleSubmit} className="max-w-xl space-y-4">
        <FieldGroup label="Document Type">
          <Select value={type} onValueChange={setType}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="0">General</SelectItem>
              <SelectItem value="1">Collateral</SelectItem>
            </SelectContent>
          </Select>
        </FieldGroup>

        <FieldGroup label="Customer">
          <button
            type="button"
            onClick={() => setPickerOpen(true)}
            className="w-full flex items-center justify-between rounded-md border border-gray-300 py-2 px-3 text-sm text-left hover:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
          >
            <span className={customer ? "text-gray-800" : "text-gray-400"}>
              {customer ? customerName(customer) : "Look up customer..."}
            </span>
            <FaSearch className="text-gray-400" />
          </button>
        </FieldGroup>

        <FieldGroup label="File">
          <input
            type="file"
            onChange={(e) => setFile(e.target.files?.[0] || null)}
            required
            className="block w-full text-sm text-gray-700 file:mr-4 file:rounded-md file:border-0 file:bg-indigo-600 file:px-4 file:py-2 file:text-sm file:font-medium file:text-white hover:file:bg-indigo-700"
          />
        </FieldGroup>

        <FieldGroup label="Title">
          <Input value={fileTitle} onChange={(e) => setFileTitle(e.target.value)} required placeholder="e.g. National ID Scan" />
        </FieldGroup>

        <FieldGroup label="Description">
          <Input value={fileDescription} onChange={(e) => setFileDescription(e.target.value)} required placeholder="e.g. Front and back, certified copy" />
        </FieldGroup>

        <Button type="submit" disabled={loading || !customer} className="bg-indigo-600 hover:bg-indigo-700">
          {loading ? "Uploading..." : "Upload Document"}
        </Button>
      </form>

      {pickerOpen && (
        <CustomerLookupModal onSelect={setCustomer} onClose={() => setPickerOpen(false)} />
      )}
    </div>
  );
}
