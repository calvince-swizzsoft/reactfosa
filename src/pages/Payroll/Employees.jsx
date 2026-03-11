// src/components/Employees.jsx
const dummyEmployees = [
  { id: 1, name: "Alice Johnson", department: "HR", email: "alice@company.com" },
  { id: 2, name: "Bob Smith", department: "IT", email: "bob@company.com" },
  { id: 3, name: "Carol White", department: "Finance", email: "carol@company.com" },
  { id: 4, name: "David Brown", department: "Sales", email: "david@company.com" },
  { id: 5, name: "Eva Green", department: "Admin", email: "eva@company.com" },
  { id: 6, name: "Frank Black", department: "IT", email: "frank@company.com" },
  { id: 7, name: "Grace Lee", department: "HR", email: "grace@company.com" },
  { id: 8, name: "Henry King", department: "Finance", email: "henry@company.com" },
  { id: 9, name: "Ivy Adams", department: "Sales", email: "ivy@company.com" },
  { id: 10, name: "Jack Wilson", department: "Admin", email: "jack@company.com" },
];

export default function Employees() {
  return (
    <div>
      <h2 className="text-2xl font-semibold mb-4">Employees</h2>
      <table className="w-full bg-white shadow rounded overflow-hidden">
        <thead className="bg-indigo-600 text-white">
          <tr>
            <th className="p-2">ID</th>
            <th className="p-2">Name</th>
            <th className="p-2">Department</th>
            <th className="p-2">Email</th>
          </tr>
        </thead>
        <tbody>
          {dummyEmployees.map(emp => (
            <tr key={emp.id} className="border-b hover:bg-gray-50">
              <td className="p-2">{emp.id}</td>
              <td className="p-2">{emp.name}</td>
              <td className="p-2">{emp.department}</td>
              <td className="p-2">{emp.email}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
