import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  FaLayerGroup,
  FaPlus,
  FaCheckCircle,
  FaAdjust,
  FaFileAlt,
  FaBoxes,
} from "react-icons/fa";
import {
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
} from "@/components/ui/tabs";

import Drafts from "./Drafts";
import Grns from "./Grns";
import PartiallyReceived from "./PartiallyReceived";
import FullyReceived from "./FullyReceived";
import AddPurchaseOrderDrawer from "./AddPurchaseOrderDrawer";

export default function PurchaseOrders() {
  const [drawerOpen, setDrawerOpen] = useState(false);
  return (
    <div className="bg-white m-8 px-8 py-8 shadow-2xl rounded-lg relative">
      {/* Header */}
      <div className="flex justify-between items-center mb-6 bg-indigo-800 px-6 py-3 rounded-2xl">
        <h2 className="text-xl font-bold text-white flex items-center gap-2">
          <FaLayerGroup /> Purchase Orders
        </h2>
        <Button
          onClick={() => setDrawerOpen(true)}
          className="bg-indigo-600 hover:bg-indigo-700"
        >
          + New Purchase Order
        </Button>

      </div>

      {/* Tabs */}
      <Tabs defaultValue="draft" className="w-full">
        <TabsList className="grid grid-cols-4 w-3/4 bg-indigo-100 rounded-xl mx-auto mb-4">
          <TabsTrigger
            value="draft"
            className="data-[state=active]:bg-indigo-700 data-[state=active]:text-white"
          >
            <FaFileAlt className="mr-2" /> Draft
          </TabsTrigger>

          <TabsTrigger
            value="grn"
            className="data-[state=active]:bg-indigo-700 data-[state=active]:text-white"
          >
            <FaBoxes className="mr-2" /> Goods Received Notes
          </TabsTrigger>

          <TabsTrigger
            value="partial"
            className="data-[state=active]:bg-indigo-700 data-[state=active]:text-white"
          >
            <FaAdjust className="mr-2" /> Partially Received
          </TabsTrigger>

          <TabsTrigger
            value="fully"
            className="data-[state=active]:bg-indigo-700 data-[state=active]:text-white"
          >
            <FaCheckCircle className="mr-2" /> Fully Received
          </TabsTrigger>
        </TabsList>

        {/* Draft Tab */}
        <TabsContent value="draft">
          <Drafts />
        </TabsContent>

        {/* GRN Tab */}
        <TabsContent value="grn">
          <Grns />
        </TabsContent>

        {/* Partially Received Tab */}
        <TabsContent value="partial">
          <PartiallyReceived />
        </TabsContent>

        {/* Fully Received Tab */}
        <TabsContent value="fully">
          <FullyReceived />
        </TabsContent>
      </Tabs>
      <AddPurchaseOrderDrawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        onSuccess={() => console.log("PO created successfully")}
      />
    </div>
  );
}
