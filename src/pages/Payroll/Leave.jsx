// src/components/Leaves.jsx
const dummyLeaves = [
  { id: 1, employee: "Alice Johnson", type: "Annual", days: 5, status: "Approved" },
  { id: 2, employee: "Bob Smith", type: "Sick", days: 2, status: "Pending" },
  { id: 3, employee: "Carol White", type: "Maternity", days: 60, status: "Approved" },
  { id: 4, employee: "David Brown", type: "Annual", days: 10, status: "Rejected" },
  { id: 5, employee: "Eva Green", type: "Sick", days: 3, status: "Approved" },
  { id: 6, employee: "Frank Black", type: "Annual", days: 7, status: "Pending" },
  { id: 7, employee: "Grace Lee", type: "Paternity", days: 14, status: "Approved" },
  { id: 8, employee: "Henry King", type: "Annual", days: 4, status: "Approved" },
  { id: 9, employee: "Ivy Adams", type: "Sick", days: 1, status: "Approved" },
  { id: 10, employee: "Jack Wilson", type: "Annual", days: 6, status: "Pending" },
];

export default function Leaves() {
  return (
    <div>
      <h2 className="text-2xl font-semibold mb-4">Leaves</h2>
      <table className="w-full bg-white shadow rounded overflow-hidden">
        <thead className="bg-indigo-600 text-white">
          <tr>
            <th className="p-2">ID</th>
            <th className="p-2">Employee</th>
            <th className="p-2">Type</th>
            <th className="p-2">Days</th>
            <th className="p-2">Status</th>
          </tr>
        </thead>
        <tbody>
          {dummyLeaves.map(leave => (
            <tr key={leave.id} className="border-b hover:bg-gray-50">
              <td className="p-2">{leave.id}</td>
              <td className="p-2">{leave.employee}</td>
              <td className="p-2">{leave.type}</td>
              <td className="p-2">{leave.days}</td>
              <td className={`p-2 font-semibold ${
                leave.status === "Approved" ? "text-green-600" :
                leave.status === "Rejected" ? "text-red-600" : "text-yellow-600"
              }`}>
                {leave.status}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
