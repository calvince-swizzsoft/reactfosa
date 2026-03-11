// import { useEffect, useState } from "react";
// import { Button } from "@/components/ui/button";
// import { FaBook, FaPlus, FaEdit, FaTrash, FaChevronDown, FaChevronUp } from "react-icons/fa";

// import Swal from "sweetalert2";
// import AddInvJournalDrawer from "./AddInvJournalDrawer";
// import EditInvJournalDrawer from "./EditInvJournalDrawer";

// export default function InvJournal() {
//   const [journals, setJournals] = useState([]);
//   const [loading, setLoading] = useState(true);
//   const [addDrawerOpen, setAddDrawerOpen] = useState(false);
//   const [editDrawerOpen, setEditDrawerOpen] = useState(false);
//   const [editJournal, setEditJournal] = useState(null);
//   const [expanded, setExpanded] = useState({});

//   const fetchJournals = () => {
//     fetch(`${import.meta.env.VITE_APP_INV_URL}/api/itemjournals`, {
//       headers: { "ngrok-skip-browser-warning": "true" },
//     })
//       .then((res) => res.json())
//       .then((data) => {
//         setJournals(data.data || []);
//         setLoading(false);
//       })
//       .catch(() => setLoading(false));
//   };

//   useEffect(() => {
//     fetchJournals();
//   }, []);

//   const handleDelete = async (id) => {
//     Swal.fire({
//       title: "Are you sure?",
//       text: "This action cannot be undone.",
//       icon: "warning",
//       showCancelButton: true,
//       confirmButtonColor: "#dc2626",
//       cancelButtonColor: "#6b7280",
//       confirmButtonText: "Yes, delete it!",
//     }).then(async (result) => {
//       if (result.isConfirmed) {
//         try {
//           const res = await fetch(
//             `${import.meta.env.VITE_APP_INV_URL}/api/itemjournals/${id}`,
//             {
//               method: "DELETE",
//               headers: { "ngrok-skip-browser-warning": "true" },
//             }
//           );
//           if (!res.ok) throw new Error("Failed to delete journal");
//           Swal.fire("Deleted!", "Journal has been deleted.", "success");
//           fetchJournals();
//         } catch (err) {
//           console.error(err);
//           Swal.fire("Error!", "Failed to delete journal.", "error");
//         }
//       }
//     });
//   };

//   return (
//     <div className="bg-white m-8 px-8 py-8 shadow-2xl rounded-lg relative">
//       {/* Header */}
//       <div className="flex justify-between items-center mb-6 bg-indigo-800 px-6 py-3 rounded-2xl">
//         <h2 className="text-xl font-bold text-white flex items-center gap-2">
//           <FaBook /> Item Journals
//         </h2>
//         <Button
//           onClick={() => setAddDrawerOpen(true)}
//           className="bg-indigo-600 hover:bg-indigo-700 flex items-center gap-2"
//         >
//           <FaPlus /> Add Journal
//         </Button>
//       </div>

//       {/* Table */}
//       <div className="bg-gray-200 p-4 rounded-sm">
//         <div className="grid grid-cols-6 gap-4 bg-gray-700 text-gray-100 font-semibold p-3 rounded-lg mb-4">
//           <span>Document No</span>
//           <span>Item</span>
//           <span>Entry Type</span>
//           <span>Quantity</span>
//           <span>Posting Date</span>
//           <span className="text-right">Actions</span>
//         </div>

//         {loading ? (
//           <p className="text-gray-500 text-center">Loading...</p>
//         ) : journals.length > 0 ? (
//           <div className="space-y-2">
//             {journals.map((journal) => (
//               <div
//                 key={journal.Id}
//                 className="bg-white rounded-lg shadow-lg hover:shadow-xl transition-all border-2 border-gray-100"
//               >
//                 <div className="grid grid-cols-6 gap-4 items-center py-4 px-6">
//                   <span>{journal.DocumentNo}</span>
//                   <span className="font-medium text-indigo-700">{journal.ItemName}</span>
//                   <span>{journal.EntryType}</span>
//                   <span>{journal.Quantity}</span>
//                   <span>{new Date(journal.PostingDate).toLocaleDateString()}</span>
//                   <div className="flex justify-end gap-2">
//                     <Button
//                       size="sm"
//                       className="bg-blue-600 hover:bg-blue-700"
//                       onClick={() => {
//                         setEditJournal(journal);
//                         setEditDrawerOpen(true);
//                       }}
//                     >
//                       <FaEdit /> Edit
//                     </Button>
//                     <Button
//                       size="sm"
//                       variant="destructive"
//                       className="text-white"
//                       onClick={() => handleDelete(journal.Id)}
//                     >
//                       <FaTrash /> Delete
//                     </Button>
//                     <Button
//                       size="sm"
//                       variant="outline"
//                       onClick={() =>
//                         setExpanded((prev) => ({
//                           ...prev,
//                           [journal.Id]: !prev[journal.Id],
//                         }))
//                       }
//                     >
//                       {expanded[journal.Id] ? <FaChevronUp /> : <FaChevronDown />}
//                     </Button>
//                   </div>
//                 </div>

//                 {/* Expanded details */}
//                 {expanded[journal.Id] && (
//                   <div className="px-3 py-3 text-sm bg-gray-300 border-t mt-2 rounded-b-lg">
//                     <p className="p-3 border rounded-lg bg-white m-1 mb-2">
//                       <strong>Item No:</strong> {journal.ItemNo}
//                     </p>
//                     <p className="p-3 border rounded-lg bg-white m-1 mb-2">
//                       <strong>Location:</strong> {journal.ItemLocationId}
//                     </p>
//                     <p className="p-3 border rounded-lg bg-white m-1 mb-2">
//                       <strong>Created By:</strong> {journal.CreatedBy}
//                     </p>
//                     <p className="p-3 border rounded-lg bg-white m-1 mb-2">
//                       <strong>Created Date:</strong>{" "}
//                       {new Date(journal.CreatedDate).toLocaleString()}
//                     </p>
//                     <p className="p-3 border rounded-lg bg-white m-1 mb-2">
//                       <strong>Status:</strong> {journal.Status || "N/A"}
//                     </p>
//                   </div>
//                 )}
//               </div>
//             ))}
//           </div>
//         ) : (
//           <p className="text-gray-500 text-center mt-4">No journals found.</p>
//         )}
//       </div>

//       {/* Add Drawer */}
//       <AddInvJournalDrawer
//         open={addDrawerOpen}
//         onClose={() => setAddDrawerOpen(false)}
//         onSuccess={fetchJournals}
//       />

//       {/* Edit Drawer */}
//       <EditInvJournalDrawer
//         open={editDrawerOpen}
//         onClose={() => setEditDrawerOpen(false)}
//         onSuccess={fetchJournals}
//         journal={editJournal}
//       />
//     </div>
//   );
// }






// import { useEffect, useState } from "react";
// import { Button } from "@/components/ui/button";
// import {
//   FaBook,
//   FaPlus,
//   FaEdit,
//   FaTrash,
//   FaChevronDown,
//   FaChevronUp,
// } from "react-icons/fa";

// import Swal from "sweetalert2";
// import AddInvJournalDrawer from "./AddInvJournalDrawer";
// import EditInvJournalDrawer from "./EditInvJournalDrawer";

// export default function InvJournal() {
//   const [journals, setJournals] = useState([]);
//   const [loading, setLoading] = useState(true);
//   const [addDrawerOpen, setAddDrawerOpen] = useState(false);
//   const [editDrawerOpen, setEditDrawerOpen] = useState(false);
//   const [editJournal, setEditJournal] = useState(null);
//   const [expanded, setExpanded] = useState({});

//   const fetchJournals = () => {
//     fetch(`${import.meta.env.VITE_APP_INV_URL}/api/itemjournals`, {
//       headers: { "ngrok-skip-browser-warning": "true" },
//     })
//       .then((res) => res.json())
//       .then((data) => {
//         setJournals(data.data || []);
//         setLoading(false);
//       })
//       .catch(() => setLoading(false));
//   };

//   useEffect(() => {
//     fetchJournals();
//   }, []);

//   const handleDelete = async (id) => {
//     Swal.fire({
//       title: "Are you sure?",
//       text: "This action cannot be undone.",
//       icon: "warning",
//       showCancelButton: true,
//       confirmButtonColor: "#dc2626",
//       cancelButtonColor: "#6b7280",
//       confirmButtonText: "Yes, delete it!",
//     }).then(async (result) => {
//       if (result.isConfirmed) {
//         try {
//           const res = await fetch(
//             `${import.meta.env.VITE_APP_INV_URL}/api/itemjournals/${id}`,
//             {
//               method: "DELETE",
//               headers: { "ngrok-skip-browser-warning": "true" },
//             }
//           );
//           if (!res.ok) throw new Error("Failed to delete journal");
//           Swal.fire("Deleted!", "Journal has been deleted.", "success");
//           fetchJournals();
//         } catch (err) {
//           console.error(err);
//           Swal.fire("Error!", "Failed to delete journal.", "error");
//         }
//       }
//     });
//   };

//   const handlePost = async (id) => {
//     Swal.fire({
//       title: "Post Journal?",
//       text: "This will finalize the journal entry.",
//       icon: "question",
//       showCancelButton: true,
//       confirmButtonColor: "#16a34a",
//       cancelButtonColor: "#6b7280",
//       confirmButtonText: "Yes, Post",
//     }).then(async (result) => {
//       if (result.isConfirmed) {
//         try {
//           const res = await fetch(
//             `${import.meta.env.VITE_APP_INV_URL}/api/itemjournals/${id}/post`,
//             {
//               method: "POST",
//               headers: { "ngrok-skip-browser-warning": "true" },
//             }
//           );
//           if (!res.ok) throw new Error("Failed to post journal");
//           Swal.fire("Success!", "Journal has been posted.", "success");
//           fetchJournals();
//         } catch (err) {
//           console.error(err);
//           Swal.fire("Error!", "Failed to post journal.", "error");
//         }
//       }
//     });
//   };

//   const handleCancel = async (id) => {
//     Swal.fire({
//       title: "Cancel Journal?",
//       text: "This will mark the journal as cancelled.",
//       icon: "warning",
//       showCancelButton: true,
//       confirmButtonColor: "#eab308",
//       cancelButtonColor: "#6b7280",
//       confirmButtonText: "Yes, Cancel",
//     }).then(async (result) => {
//       if (result.isConfirmed) {
//         try {
//           const res = await fetch(
//             `${import.meta.env.VITE_APP_INV_URL}/api/itemjournals/${id}/cancel`,
//             {
//               method: "POST",
//               headers: { "ngrok-skip-browser-warning": "true" },
//             }
//           );
//           if (!res.ok) throw new Error("Failed to cancel journal");
//           Swal.fire("Cancelled!", "Journal has been cancelled.", "success");
//           fetchJournals();
//         } catch (err) {
//           console.error(err);
//           Swal.fire("Error!", "Failed to cancel journal.", "error");
//         }
//       }
//     });
//   };

//   return (
//     <div className="bg-white m-8 px-8 py-8 shadow-2xl rounded-lg relative">
//       {/* Header */}
//       <div className="flex justify-between items-center mb-6 bg-indigo-800 px-6 py-3 rounded-2xl">
//         <h2 className="text-xl font-bold text-white flex items-center gap-2">
//           <FaBook /> Item Journals
//         </h2>
//         <Button
//           onClick={() => setAddDrawerOpen(true)}
//           className="bg-indigo-600 hover:bg-indigo-700 flex items-center gap-2"
//         >
//           <FaPlus /> Add Journal
//         </Button>
//       </div>

//       {/* Table */}
//       <div className="bg-gray-200 p-4 rounded-sm">
//         <div className="grid grid-cols-6 gap-4 bg-gray-700 text-gray-100 font-semibold p-3 rounded-lg mb-4">
//           <span>Document No</span>
//           <span>Item</span>
//           <span>Entry Type</span>
//           <span>Quantity</span>
//           <span>Posting Date</span>
//           <span className="text-right">Actions</span>
//         </div>

//         {loading ? (
//           <p className="text-gray-500 text-center">Loading...</p>
//         ) : journals.length > 0 ? (
//           <div className="space-y-2">
//             {journals.map((journal) => (
//               <div
//                 key={journal.Id}
//                 className="bg-white rounded-lg shadow-lg hover:shadow-xl transition-all border-2 border-gray-100"
//               >
//                 <div className="grid grid-cols-6 gap-4 items-center py-4 px-6">
//                   <span>{journal.DocumentNo}</span>
//                   <span className="font-medium text-indigo-700">
//                     {journal.ItemName}
//                   </span>
//                   <span>{journal.EntryType}</span>
//                   <span>{journal.Quantity}</span>
//                   <span>
//                     {new Date(journal.PostingDate).toLocaleDateString()}
//                   </span>
//                   <div className="flex justify-end gap-2 flex-wrap">
//                     <Button
//                       size="sm"
//                       className="bg-green-600 hover:bg-green-700"
//                       onClick={() => handlePost(journal.Id)}
//                     >
//                       Post
//                     </Button>
//                     <Button
//                       size="sm"
//                       className="bg-yellow-500 hover:bg-yellow-600 text-white"
//                       onClick={() => handleCancel(journal.Id)}
//                     >
//                       Cancel
//                     </Button>
//                     <Button
//                       size="sm"
//                       className="bg-blue-600 hover:bg-blue-700"
//                       onClick={() => {
//                         setEditJournal(journal);
//                         setEditDrawerOpen(true);
//                       }}
//                     >
//                       <FaEdit /> Edit
//                     </Button>
//                     <Button
//                       size="sm"
//                       variant="destructive"
//                       className="text-white"
//                       onClick={() => handleDelete(journal.Id)}
//                     >
//                       <FaTrash /> Delete
//                     </Button>
//                     <Button
//                       size="sm"
//                       variant="outline"
//                       onClick={() =>
//                         setExpanded((prev) => ({
//                           ...prev,
//                           [journal.Id]: !prev[journal.Id],
//                         }))
//                       }
//                     >
//                       {expanded[journal.Id] ? (
//                         <FaChevronUp />
//                       ) : (
//                         <FaChevronDown />
//                       )}
//                     </Button>
//                   </div>
//                 </div>

//                 {/* Expanded details */}
//                 {expanded[journal.Id] && (
//                   <div className="px-3 py-3 text-sm bg-gray-300 border-t mt-2 rounded-b-lg">
//                     <p className="p-3 border rounded-lg bg-white m-1 mb-2">
//                       <strong>Item No:</strong> {journal.ItemNo}
//                     </p>
//                     <p className="p-3 border rounded-lg bg-white m-1 mb-2">
//                       <strong>Location:</strong> {journal.ItemLocationId}
//                     </p>
//                     <p className="p-3 border rounded-lg bg-white m-1 mb-2">
//                       <strong>Created By:</strong> {journal.CreatedBy}
//                     </p>
//                     <p className="p-3 border rounded-lg bg-white m-1 mb-2">
//                       <strong>Created Date:</strong>{" "}
//                       {new Date(journal.CreatedDate).toLocaleString()}
//                     </p>
//                     <p className="p-3 border rounded-lg bg-white m-1 mb-2">
//                       <strong>Status:</strong> {journal.Status || "N/A"}
//                     </p>
//                   </div>
//                 )}
//               </div>
//             ))}
//           </div>
//         ) : (
//           <p className="text-gray-500 text-center mt-4">No journals found.</p>
//         )}
//       </div>

//       {/* Add Drawer */}
//       <AddInvJournalDrawer
//         open={addDrawerOpen}
//         onClose={() => setAddDrawerOpen(false)}
//         onSuccess={fetchJournals}
//       />

//       {/* Edit Drawer */}
//       <EditInvJournalDrawer
//         open={editDrawerOpen}
//         onClose={() => setEditDrawerOpen(false)}
//         onSuccess={fetchJournals}
//         journal={editJournal}
//       />
//     </div>
//   );
// }



























import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  FaBook,
  FaPlus,
  FaChevronDown,
  FaChevronUp,
  FaEdit,
  FaTrash,
} from "react-icons/fa";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

import Swal from "sweetalert2";
import AddInvJournalDrawer from "./AddInvJournalDrawer";
import EditInvJournalDrawer from "./EditInvJournalDrawer";
import { MdCancel, MdEditDocument, MdOutlinePostAdd } from "react-icons/md";
import NotFoundImage from "/assets/scopefinding.png";

export default function InvJournal() {
  const [journals, setJournals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [addDrawerOpen, setAddDrawerOpen] = useState(false);
  const [editDrawerOpen, setEditDrawerOpen] = useState(false);
  const [editJournal, setEditJournal] = useState(null);
  const [expanded, setExpanded] = useState({});

  const fetchJournals = () => {
    fetch(`${import.meta.env.VITE_APP_INV_URL}/api/itemjournals`, {
      headers: { "ngrok-skip-browser-warning": "true" },
    })
      .then((res) => res.json())
      .then((data) => {
        setJournals(data.data || []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  };

  useEffect(() => {
    fetchJournals();
  }, []);

  const handleDelete = async (id) => {
    Swal.fire({
      title: "Are you sure?",
      text: "This action cannot be undone.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#dc2626",
      cancelButtonColor: "#6b7280",
      confirmButtonText: "Yes, delete it!",
    }).then(async (result) => {
      if (result.isConfirmed) {
        try {
          const res = await fetch(
            `${import.meta.env.VITE_APP_INV_URL}/api/itemjournals/${id}`,
            {
              method: "DELETE",
              headers: { "ngrok-skip-browser-warning": "true" },
            }
          );
          if (!res.ok) throw new Error("Failed to delete journal");
          Swal.fire("Deleted!", "Journal has been deleted.", "success");
          fetchJournals();
        } catch (err) {
          console.error(err);
          Swal.fire("Error!", "Failed to delete journal.", "error");
        }
      }
    });
  };

  const handlePost = async (id) => {
    Swal.fire({
      title: "Post Journal?",
      text: "This will finalize the journal entry.",
      icon: "question",
      showCancelButton: true,
      confirmButtonColor: "#16a34a",
      cancelButtonColor: "#6b7280",
      confirmButtonText: "Yes, Post",
    }).then(async (result) => {
      if (result.isConfirmed) {
        try {
          const res = await fetch(
            `${import.meta.env.VITE_APP_INV_URL}/api/itemjournals/${id}/post`,
            {
              method: "POST",
              headers: { "ngrok-skip-browser-warning": "true" },
            }
          );
          if (!res.ok) throw new Error("Failed to post journal");
          Swal.fire("Success!", "Journal has been posted.", "success");
          fetchJournals();
        } catch (err) {
          console.error(err);
          Swal.fire("Error!", "Failed to post journal.", "error");
        }
      }
    });
  };

  const handleCancel = async (id) => {
    Swal.fire({
      title: "Cancel Journal?",
      text: "This will mark the journal as cancelled.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#eab308",
      cancelButtonColor: "#6b7280",
      confirmButtonText: "Yes, Cancel",
    }).then(async (result) => {
      if (result.isConfirmed) {
        try {
          const res = await fetch(
            `${import.meta.env.VITE_APP_INV_URL}/api/itemjournals/${id}/cancel`,
            {
              method: "POST",
              headers: { "ngrok-skip-browser-warning": "true" },
            }
          );
          if (!res.ok) throw new Error("Failed to cancel journal");
          Swal.fire("Cancelled!", "Journal has been cancelled.", "success");
          fetchJournals();
        } catch (err) {
          console.error(err);
          Swal.fire("Error!", "Failed to cancel journal.", "error");
        }
      }
    });
  };

  return (
    <div className="bg-white m-8 px-8 py-8 shadow-2xl rounded-lg relative">
      {/* Header */}
      <div className="flex justify-between items-center mb-6 bg-indigo-800 px-6 py-3 rounded-2xl">
        <h2 className="text-xl font-bold text-white flex items-center gap-2">
          <FaBook /> Item Journals
        </h2>
        <Button
          onClick={() => setAddDrawerOpen(true)}
          className="bg-indigo-600 hover:bg-indigo-700 flex items-center gap-2"
        >
          <FaPlus /> Add Journal
        </Button>
      </div>

      {/* Table */}
      <div className="bg-gray-200 p-4 rounded-sm">
        <div className="grid grid-cols-6 gap-4 bg-gray-700 text-gray-100 font-semibold p-3 rounded-lg mb-4">
          <span>Document No</span>
          <span>Item</span>
          <span>Entry Type</span>
          <span>Quantity</span>
          <span>Posting Date</span>
          <span className="text-right">Actions</span>
        </div>

        {loading ? (
         <div className="space-y-2 animate-pulse">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="grid grid-cols-5 gap-4 bg-gray-50 p-6 rounded">
              <div className="h-4 bg-gray-200 rounded"></div>
              <div className="h-4 bg-gray-200 rounded"></div>
              <div className="h-4 bg-gray-200 rounded"></div>
              <div className="h-4 bg-gray-200 rounded"></div>
              <div className="h-4 bg-gray-200 rounded text-right"></div>
            </div>
          ))}
        </div>
        ) : journals.length > 0 ? (
          <div className="space-y-2">
            {journals.map((journal) => (
              <div
                key={journal.Id}
                className="bg-white rounded-lg shadow-lg hover:shadow-xl transition-all border-2 border-gray-100"
              >
                <div className="grid grid-cols-6 gap-4 items-center py-4 px-6">
                  <span>{journal.DocumentNo}</span>
                  <span className="font-medium text-indigo-700">
                    {journal.ItemName}
                  </span>
                  <span>{journal.EntryType}</span>
                  <span>{journal.Quantity}</span>
                  <span>
                    {new Date(journal.PostingDate).toLocaleDateString()}
                  </span>
                  <div className="flex justify-end gap-2 flex-wrap">
                    {/* Dropdown with actions */}
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          size="sm"
                          variant="outline"
                          className="flex items-center gap-1 bg-indigo-600 hover:bg-indigo-500 hover:text-white text-white"
                        >
                          Actions <FaChevronDown />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent>
                        <DropdownMenuItem onClick={() => handlePost(journal.Id)}>
                          <MdOutlinePostAdd /> Post
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => handleCancel(journal.Id)}
                        >
                          <MdCancel /> Cancel
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => {
                            setEditJournal(journal);
                            setEditDrawerOpen(true);
                          }}
                        >
                          <MdEditDocument /> Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => handleDelete(journal.Id)}
                        >
                          <FaTrash className="mr-2" /> Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>

                    {/* Expand toggle */}
                    <Button
                      size="sm"
                      variant="outline"
                      className="bg-gray-600 hover:bg-gray-500 hover:text-white text-white"
                      onClick={() =>
                        setExpanded((prev) => ({
                          ...prev,
                          [journal.Id]: !prev[journal.Id],
                        }))
                      }
                    >
                      {expanded[journal.Id] ? <FaChevronUp /> : <FaChevronDown />}
                    </Button>
                  </div>
                </div>

                {/* Expanded details */}
                {expanded[journal.Id] && (
                  <div className="px-3 py-3 text-sm bg-gray-300 border-t mt-2 rounded-b-lg">
                    <p className="p-3 border rounded-lg bg-white m-1 mb-2">
                      <strong>Item No:</strong> {journal.ItemNo}
                    </p>
                   {/* <p className="p-3 border rounded-lg bg-white m-1 mb-2">
                      <strong>Location:</strong> {journal.ItemLocationId}
                    </p>*/}
                    <p className="p-3 border rounded-lg bg-white m-1 mb-2">
                      <strong>Created By:</strong> {journal.CreatedBy}
                    </p>
                    <p className="p-3 border rounded-lg bg-white m-1 mb-2">
                      <strong>Created Date:</strong>{" "}
                      {new Date(journal.CreatedDate).toLocaleString()}
                    </p>
                    <p className="p-3 border rounded-lg bg-white m-1 mb-2">
                      <strong>Status:</strong> {journal.Status || "N/A"}
                    </p>
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="text-gray-500 text-center mt-4">
            <img src={NotFoundImage} alt="Not Found" className="mx-auto w-42 h-auto" />
            <p className="font-medium text-gray-400">No journals found.</p>
          </div>
        )}
      </div>

      {/* Add Drawer */}
      <AddInvJournalDrawer
        open={addDrawerOpen}
        onClose={() => setAddDrawerOpen(false)}
        onSuccess={fetchJournals}
      />

      {/* Edit Drawer */}
      <EditInvJournalDrawer
        open={editDrawerOpen}
        onClose={() => setEditDrawerOpen(false)}
        onSuccess={fetchJournals}
        journal={editJournal}
      />
    </div>
  );
}
