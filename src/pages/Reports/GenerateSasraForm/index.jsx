import { Link } from "react-router-dom";
import { FaFileAlt, FaFolder, FaChevronRight } from "react-icons/fa";

export default function SasraReports() {
  const categories = [
    { code: "DT", title: "Deposit-taking SACCOs", description: "Forms 1–7 and 9 · Preview and Excel downloads" },
    { code: "NWDT", title: "Non-withdrawable-deposit SACCOs", description: "Form 2 reports · To be added" },
  ];
  return <main className="bg-white m-8 px-8 py-8 shadow-2xl rounded-lg relative">
    <header className="bg-indigo-800 px-6 py-3 rounded-2xl"><h1 className="text-xl font-bold text-white flex items-center gap-2"><FaFileAlt />SASRA Reports</h1></header>
    <p className="my-4 text-sm text-gray-500">Choose a reporting category.</p>
    <div className="bg-gray-200 p-4 rounded-sm space-y-3">
      {categories.map(category => <Link key={category.code} to={`/Reports/GenerateSasraForm/${category.code}`} className="flex items-center gap-4 bg-white rounded-lg shadow-lg border p-4 hover:shadow-xl transition-all focus-visible:outline-indigo-600">
        <FaFolder className="text-amber-600 text-xl shrink-0" />
        <div className="flex-1"><h2 className="font-semibold text-gray-700">{category.code} · {category.title}</h2><p className="text-sm text-gray-500 mt-1">{category.description}</p></div>
        <FaChevronRight className="text-gray-400" />
      </Link>)}
    </div>
  </main>;
}
