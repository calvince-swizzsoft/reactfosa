import { useEffect, useMemo, useState } from "react";
import {
  FaClipboardList,
  FaSearch,
  FaChevronDown,
  FaChevronUp,
  FaDesktop,
  FaUser,
} from "react-icons/fa";
import NotFoundImage from "/assets/scopefinding.png";

export default function AuditLogs() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedLog, setExpandedLog] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    const fetchLogs = async () => {
      setLoading(true);
      try {
        const res = await fetch(`${import.meta.env.VITE_APP_ADMIN_URL}/api/administration/auditlogs`);
        const json = await res.json();
        const logList = Array.isArray(json?.data) ? json.data : Array.isArray(json) ? json : [];
        setLogs(logList);
      } catch (err) {
        console.error("Fetch Audit Logs Error:", err);
        setLogs([]);
      } finally {
        setLoading(false);
      }
    };

    fetchLogs();
  }, []);

  const filteredLogs = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) return logs;

    return logs.filter((log) =>
      log.EventType?.toLowerCase().includes(query) ||
      log.TableName?.toLowerCase().includes(query) ||
      log.RecordID?.toLowerCase().includes(query) ||
      log.ApplicationUserName?.toLowerCase().includes(query) ||
      log.AdditionalNarration?.toLowerCase().includes(query)
    );
  }, [logs, searchQuery]);

  return (
    <div className="bg-white m-8 px-8 py-8 shadow-2xl rounded-lg relative">
      {/* Header */}
      <div className="flex justify-between items-center mb-6 bg-indigo-800 px-6 py-3 rounded-2xl">
        <h2 className="text-xl font-bold text-white flex items-center gap-2">
          <FaClipboardList className="text-white" /> Audit Logs
          <span className="text-sm font-normal ml-2">
            ({filteredLogs.length} {filteredLogs.length === 1 ? "entry" : "entries"})
          </span>
        </h2>
      </div>

      {/* Search Bar */}
      <div className="mb-6 bg-gray-100 p-4 rounded-lg">
        <div className="flex-1 relative">
          <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search audit logs by event, table, record, user, or narration..."
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      {/* Table */}
      <div className="bg-gray-200 p-4 rounded-sm">
        <div className="grid grid-cols-12 gap-4 bg-gray-700 text-gray-100 font-semibold p-3 rounded-lg mb-4">
          <span className="col-span-2">Event</span>
          <span className="col-span-2">Table</span>
          <span className="col-span-2">Record Id</span>
          <span className="col-span-3">App. User</span>
          <span className="col-span-2">Created</span>
          <span className="col-span-1 text-right">Details</span>
        </div>

        {loading ? (
          <div className="space-y-2 animate-pulse">
            {[1, 2, 3].map((i) => (
              <div key={i} className="grid grid-cols-12 gap-2 bg-gray-50 p-6 rounded">
                {Array.from({ length: 12 }).map((_, j) => (
                  <div key={j} className="h-4 bg-gray-200 rounded"></div>
                ))}
              </div>
            ))}
          </div>
        ) : filteredLogs.length > 0 ? (
          <div className="space-y-2">
            {filteredLogs.map((log) => (
              <div key={log.Id} className="bg-white rounded-lg shadow-lg border">
                {/* Main Row */}
                <div className="grid grid-cols-12 gap-2 items-center py-4 px-6 hover:shadow-xl transition-all">
                  <span className="font-medium text-indigo-700 col-span-2 truncate">
                    {log.EventType}
                  </span>

                  <span className="col-span-2 truncate">{log.TableName}</span>

                  <span className="col-span-2 truncate text-gray-600">{log.RecordID}</span>

                  <span className="col-span-3 flex items-center gap-2 truncate">
                    <FaUser className="text-gray-500 shrink-0" />
                    {log.ApplicationUserName}
                  </span>

                  <span className="col-span-2 text-sm text-gray-600">
                    {log.CreatedDate ? new Date(log.CreatedDate).toLocaleString() : ""}
                  </span>

                  <span className="col-span-1 flex justify-end">
                    <button
                      type="button"
                      onClick={() =>
                        setExpandedLog(expandedLog === log.Id ? null : log.Id)
                      }
                      className="inline-flex items-center gap-1 rounded-md bg-gray-700 hover:bg-gray-600 text-white px-3 py-1.5 text-xs font-medium"
                    >
                      {expandedLog === log.Id ? (
                        <>
                          <FaChevronUp /> Hide
                        </>
                      ) : (
                        <>
                          <FaChevronDown /> View
                        </>
                      )}
                    </button>
                  </span>
                </div>

                {/* Expanded Section */}
                {expandedLog === log.Id && (
                  <div className="border-t bg-gray-400 p-4 mx-1 mb-1 rounded-b-lg space-y-4">
                    <div className="bg-white p-4 rounded-lg shadow border">
                      <div className="bg-gray-200 rounded-xl p-3">
                        <h3 className="font-bold text-white bg-indigo-700 p-3 rounded-xl mb-2">
                          Narration
                        </h3>
                        <p className="p-3 bg-gray-50 rounded-xl border-2 text-sm text-gray-700">
                          {log.AdditionalNarration || "—"}
                        </p>
                      </div>
                    </div>

                    <div className="bg-white p-4 rounded-lg shadow border">
                      <div className="bg-gray-200 rounded-xl p-3">
                        <h3 className="font-bold text-white bg-indigo-700 p-3 rounded-xl mb-2 flex items-center gap-2">
                          <FaDesktop /> Environment
                        </h3>
                        <div className="grid grid-cols-2 p-3 bg-gray-50 rounded-xl border-2 gap-3 text-sm text-gray-700">
                          <span><b>User:</b> {log.EnvironmentUserName}</span>
                          <span><b>Machine:</b> {log.EnvironmentMachineName}</span>
                          <span><b>Domain:</b> {log.EnvironmentDomainName}</span>
                          <span><b>OS Version:</b> {log.EnvironmentOSVersion}</span>
                          <span><b>MAC Address:</b> {log.EnvironmentMACAddress}</span>
                          <span><b>Motherboard S/N:</b> {log.EnvironmentMotherboardSerialNumber}</span>
                          <span><b>Processor Id:</b> {log.EnvironmentProcessorId}</span>
                          <span><b>IP Address:</b> {log.EnvironmentIPAddress}</span>
                        </div>
                      </div>
                    </div>

                    <div className="bg-white p-4 rounded-lg shadow border">
                      <div className="bg-gray-200 rounded-xl p-3">
                        <h3 className="font-bold text-white bg-indigo-700 p-3 rounded-xl mb-2">
                          System
                        </h3>
                        <div className="grid grid-cols-2 p-3 bg-gray-50 rounded-xl border-2 gap-3 text-sm text-gray-700">
                          <span><b>Created By:</b> {log.CreatedBy}</span>
                          <span>
                            <b>Created Date:</b>{" "}
                            {log.CreatedDate ? new Date(log.CreatedDate).toLocaleString() : "—"}
                          </span>
                        </div>
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
            <p className="font-medium text-gray-400">
              {searchQuery ? "No audit logs match your search." : "No Audit Logs Found."}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
