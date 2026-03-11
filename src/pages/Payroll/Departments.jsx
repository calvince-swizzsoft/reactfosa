// src/components/Departments.jsx
const dummyDepartments = [
  { id: 1, name: "HR" },
  { id: 2, name: "IT" },
  { id: 3, name: "Finance" },
  { id: 4, name: "Sales" },
  { id: 5, name: "Admin" },
  { id: 6, name: "Logistics" },
  { id: 7, name: "Procurement" },
  { id: 8, name: "R&D" },
  { id: 9, name: "Legal" },
  { id: 10, name: "Customer Support" },
];

export default function Departments() {
  return (
    <div>
      <h2 className="text-2xl font-semibold mb-4">Departments</h2>
      <ul className="bg-white shadow rounded p-4 space-y-2">
        {dummyDepartments.map(dep => (
          <li key={dep.id} className="p-2 border-b">{dep.id}. {dep.name}</li>
        ))}
      </ul>
    </div>
  );
}
