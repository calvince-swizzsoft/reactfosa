
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
import Drafts from "./Pending";
import Approved from "./Approved";
import Rejected from "./Rejected";
import { Button } from "@/components/ui/button";
import AddStoreRequisitionDrawer from "./AddStoreRequisitionDrawer";
import Posted from "./Posted";

export default function StoreRequisitions() {
  const [addDrawerOpen, setAddDrawerOpen] = useState(false);

  return (
    <div className="bg-white m-8 px-8 py-8 shadow-2xl rounded-lg relative flex flex-col">
      {/* Header */}
      <div className="flex justify-between items-center mb-6 bg-indigo-800 px-6 py-4 rounded-2xl shadow">
        <h2 className="text-xl font-bold text-white flex items-center gap-2">
          <FaListAlt className="text-white" />Store Requisitions
        </h2>
        <Button
          className="bg-indigo-600 hover:bg-indigo-700 flex items-center gap-2"
          onClick={() => setAddDrawerOpen(true)}
        >
          <FaPlus /> Add Store Requisition
        </Button>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="Pending" className="max-w-full">
        <TabsList className="flex flex-wrap justify-center gap-3 bg-indigo-800 text-white min-h-15 rounded-xl  p-2 mb-2 shadow-inner ">
          
          <TabsTrigger
            value="Pending"
            className="flex items-center gap-2 px-4 py-2 rounded-lg data-[state=active]:bg-indigo-600 data-[state=active]:text-white hover:bg-indigo-600 transition"
          >
            <FaFileAlt /> Pending
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
            value="post"
            className="flex items-center gap-2 px-4 py-2 rounded-lg data-[state=active]:bg-indigo-600 data-[state=active]:text-white hover:bg-indigo-600 transition"
          >
            <FaFileAlt /> Post
          </TabsTrigger>        
        </TabsList>

        {/* Tab Contents */}
        <TabsContent value="Pending">
          <Drafts />
        </TabsContent>
        <TabsContent value="Approved">
          <Approved />
        </TabsContent>
        <TabsContent value="rejected">
          <Rejected />
        </TabsContent>
        <TabsContent value="post">
          <Posted />
        </TabsContent>
      </Tabs>

      {/* Drawer */}
      <AddStoreRequisitionDrawer
        open={addDrawerOpen}
        onClose={() => setAddDrawerOpen(false)}
      />
    </div>
  );
}
