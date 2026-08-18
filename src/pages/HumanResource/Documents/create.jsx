import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { FaFileAlt } from "react-icons/fa";
import Swal from "sweetalert2";
import { listEmployees, uploadDocument } from "./api";

const employeeLabel = (e) => `${e.CustomerIndividualFirstName ?? ""} ${e.CustomerIndividualLastName ?? ""}`.trim() || "—";

function FieldGroup({ label, children }) {
  return (
    <div>
      <Label className="text-sm font-semibold text-gray-700">{label}</Label>
      {children}
    </div>
  );
}

export default function CreateDocument() {
  const navigate = useNavigate();
  const [employeeId, setEmployeeId] = useState("");
  const [fileTitle, setFileTitle] = useState("");
  const [fileDescription, setFileDescription] = useState("");
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [employees, setEmployees] = useState([]);
  const [loadingData, setLoadingData] = useState(true);

  useEffect(() => {
    listEmployees().then(setEmployees).catch(() => setEmployees([])).finally(() => setLoadingData(false));
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!file) {
      Swal.fire("Missing File", "Choose a file to upload.", "warning");
      return;
    }
    setLoading(true);
    try {
      await uploadDocument({ file, employeeId, fileTitle, fileDescription });
      Swal.fire("Success", "Document uploaded successfully", "success");
      navigate("/HumanResource/Documents");
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
          <h2 className="text-xl font-bold text-white">Upload Document</h2>
        </div>
        <Link to="/HumanResource/Documents" className="text-sm text-white/80 hover:text-white">
          &larr; Back to Documents
        </Link>
      </div>

      <form onSubmit={handleSubmit} className="max-w-xl space-y-4">
        <FieldGroup label="Employee">
          <Select value={employeeId} onValueChange={setEmployeeId} disabled={loadingData}>
            <SelectTrigger><SelectValue placeholder={loadingData ? "Loading..." : "Select Employee"} /></SelectTrigger>
            <SelectContent className="max-h-60 overflow-y-auto">
              {employees.map((emp) => (
                <SelectItem key={emp.Id} value={emp.Id}>{employeeLabel(emp)}</SelectItem>
              ))}
            </SelectContent>
          </Select>
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

        <Button type="submit" disabled={loading || loadingData || !employeeId} className="bg-indigo-600 hover:bg-indigo-700">
          {loading ? "Uploading..." : "Upload Document"}
        </Button>
      </form>
    </div>
  );
}
