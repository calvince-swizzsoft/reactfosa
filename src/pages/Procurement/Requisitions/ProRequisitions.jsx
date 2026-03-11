

// import * as React from "react";
// import { useState } from "react";
// import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
// import { FaFileAlt, FaPaperPlane, FaCheckCircle, FaTimesCircle, FaExchangeAlt, FaFileInvoice, FaPlus, FaListAlt } from "react-icons/fa";
// import Draft from "./Draft";
// import { Button } from "@/components/ui/button";
// import AddRequisitionDrawer from "./AddRequisitionDrawer";
// import ConvertToPO from "./ConvertToPO";
// import Submitted from "./Submitted";
// import PendingApproval from "./PendingApproval";
// import Drafts from "./Drafts";
// import Approved from "./Approved";
// import Rejected from "./Rejected";


// export default function ProRequisitions() {
//     const [addDrawerOpen, setAddDrawerOpen] = useState(false);

//   return (
//     <div className="bg-white m-8 px-8 py-8 shadow-2xl rounded-lg relative flex flex-col">
//        {/* Header */}
//       <div className="flex justify-between items-center mb-4 bg-indigo-800 px-6 py-3 rounded-2xl">
//         <h2 className="text-xl font-bold text-white flex items-center gap-2">
//           <FaListAlt className="text-white" /> Requisitions
//         </h2>
//         <Button
//           className="bg-indigo-600 hover:bg-indigo-700 flex items-center gap-2"
//           onClick={() => setAddDrawerOpen(true)}
//         >
//           <FaPlus /> New Requisition
//         </Button>
//       </div>

//       <Tabs defaultValue="account" className="mx-auto flex flex-col">
//       <TabsList className="bg-indigo-800 text-white active:text-white mx-auto border-4 border-indigo-800 py-4 ">
//         <TabsTrigger value="Draft" className="flex gap-1"><FaFileAlt /> Draft</TabsTrigger> 
//         <TabsTrigger value="sendForApproval" className="flex gap-1"><FaPaperPlane /> Send For Approval</TabsTrigger>
//         <TabsTrigger value="Approved" className="flex gap-1"><FaCheckCircle /> Approved</TabsTrigger>
//         <TabsTrigger value="convertToPo" className="flex gap-1"><FaTimesCircle />Convert To Purchase Order</TabsTrigger>
//         <TabsTrigger value="issued" className="flex gap-1"><FaExchangeAlt />Issued</TabsTrigger>
//         <TabsTrigger value="rejected" className="flex gap-1"><FaFileInvoice />Rejected</TabsTrigger>
//       </TabsList>
//       <TabsContent value="Draft"><Drafts/></TabsContent>
//       <TabsContent value="Approved"><Approved/></TabsContent>
//       <TabsContent value="convertToPo"> <ConvertToPO/> </TabsContent>
//       <TabsContent value="issued"> <Submitted/> </TabsContent>
//       <TabsContent value="sendForApproval"> <PendingApproval/></TabsContent>
//       <TabsContent value="rejected"> <Rejected/></TabsContent>
//     </Tabs>

//     <AddRequisitionDrawer
//             open={addDrawerOpen}
//             onClose={() => setAddDrawerOpen(false)}
//            // onSuccess={fetchRequisitions}
//           />
//     </div>
//   );
// }








import * as React from "react";
import { useState } from "react";
import {
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
} from "@/components/ui/tabs";
import {
  FaFileAlt,
  FaPaperPlane,
  FaCheckCircle,
  FaTimesCircle,
  FaExchangeAlt,
  FaFileInvoice,
  FaPlus,
  FaListAlt,
} from "react-icons/fa";
import Drafts from "./Drafts";
import ConvertToPO from "./ConvertToPO";
import Submitted from "./Submitted";
import PendingApproval from "./PendingApproval";
import Approved from "./Approved";
import Rejected from "./Rejected";
import { Button } from "@/components/ui/button";
import AddRequisitionDrawer from "./AddRequisitionDrawer";

export default function ProRequisitions() {
  const [addDrawerOpen, setAddDrawerOpen] = useState(false);

  return (
    <div className="bg-white m-8 px-8 py-8 shadow-2xl rounded-lg relative flex flex-col">
      {/* Header */}
      <div className="flex justify-between items-center mb-6 bg-indigo-800 px-6 py-4 rounded-2xl shadow">
        <h2 className="text-xl font-bold text-white flex items-center gap-2">
          <FaListAlt className="text-white" /> Requisitions
        </h2>
        <Button
          className="bg-indigo-600 hover:bg-indigo-700 flex items-center gap-2"
          onClick={() => setAddDrawerOpen(true)}
        >
          <FaPlus /> New Requisition
        </Button>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="Draft" className="max-w-full">
        <TabsList className="flex flex-wrap justify-center gap-3 bg-indigo-800 text-white min-h-15 rounded-xl  p-2 mb-2 shadow-inner ">

          <TabsTrigger
            value="Draft"
            className="flex items-center gap-2 px-4 py-2 rounded-lg data-[state=active]:bg-indigo-600 data-[state=active]:text-white hover:bg-indigo-600 transition"
          >
            <FaFileAlt /> Draft 
          </TabsTrigger>

          <TabsTrigger
            value="sendForApproval"
            className="flex items-center gap-2 px-4 py-2 rounded-lg data-[state=active]:bg-indigo-600 data-[state=active]:text-white hover:bg-indigo-600 transition"
          >
            <FaPaperPlane /> Send For Approval
          </TabsTrigger>
          <div className="flex bg-gray-100 rounded-lg p-1 shadow-md">
            <TabsTrigger
              value="Approved"
              className="flex items-center gap-2 px-4 py-2 rounded-lg data-[state=active]:bg-indigo-600 data-[state=active]:text-white hover:bg-indigo-600 transition text-indigo-700  hover:text-white"
            >
              <FaCheckCircle /> Approved
            </TabsTrigger>
            <span className="text-indigo-700 flex justify-center items-center font-semibold">|</span>
            <TabsTrigger
              value="rejected"
              className="flex items-center gap-2 px-4 py-2 rounded-lg data-[state=active]:bg-indigo-600 data-[state=active]:text-white hover:bg-indigo-600 transition text-indigo-700 hover:text-white"
            >
              <FaTimesCircle /> Rejected
            </TabsTrigger>
          </div>
          <TabsTrigger
            value="convertToPo"
            className="flex items-center gap-2 px-4 py-2 rounded-lg data-[state=active]:bg-indigo-600 data-[state=active]:text-white hover:bg-indigo-600 transition"
          >
            <FaFileInvoice /> Converted To Requisition
          </TabsTrigger>

          {/* <TabsTrigger
            value="issued"
            className="flex items-center gap-2 px-4 py-2 rounded-lg data-[state=active]:bg-indigo-600 data-[state=active]:text-white hover:bg-indigo-600 transition"
          >
            <FaExchangeAlt /> Issued
          </TabsTrigger> */}


        </TabsList>

        {/* Tab Contents */}
        <TabsContent value="Draft">
          <Drafts />
        </TabsContent>
        <TabsContent value="sendForApproval">
          <PendingApproval />
        </TabsContent>
        <TabsContent value="Approved">
          <Approved />
        </TabsContent>
        <TabsContent value="convertToPo">
          <ConvertToPO />
        </TabsContent>
        <TabsContent value="issued">
          <Submitted />
        </TabsContent>
        <TabsContent value="rejected">
          <Rejected />
        </TabsContent>
      </Tabs>

      {/* Drawer */}
      <AddRequisitionDrawer
        open={addDrawerOpen}
        onClose={() => setAddDrawerOpen(false)}
      />
    </div>
  );
}
