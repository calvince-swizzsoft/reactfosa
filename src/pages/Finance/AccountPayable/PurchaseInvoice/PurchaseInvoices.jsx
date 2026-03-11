import { useState } from "react";
import { Button } from "@/components/ui/button";
import { FaFileInvoiceDollar, FaPlus, FaCheckCircle, FaFileAlt } from "react-icons/fa";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import Draft from "./Draft";
import Posted from "./Posted";
import AddVoucherDrawer from "./AddVoucherDrawer";
import AddPurchaseInvoiceDrawer from "./AddPurchaseInvoice";

export default function PurchaseInvoices() {
  const [showAddDrawer, setShowAddDrawer] = useState(false);
  const [showAddVoucherDrawer, setShowAddVoucherDrawer] = useState(false);

  return (
    <div className="bg-white px-4 py-8 relative">
      {/* 🔹 Shared Header */}
      <div className="flex justify-between items-center mb-6 bg-indigo-800 px-6 py-3 rounded-2xl">
        <h2 className="text-xl font-bold text-white flex items-center gap-2">
          <FaFileInvoiceDollar /> Purchase Invoices
        </h2>
        <div className="flex gap-2">
          {/* <Button
            className="bg-indigo-600 hover:bg-indigo-700 flex items-center gap-2"
            onClick={() => setShowAddVoucherDrawer(true)}
          >
            <FaPlus /> Add Voucher
          </Button> */}
          <Button
            className="bg-indigo-600 hover:bg-indigo-700 flex items-center gap-2"
            onClick={() => setShowAddDrawer(true)}
          >
            <FaPlus /> Add Invoice
          </Button>
        </div>
      </div>

      {/* 🔹 Tabs */}
      <Tabs defaultValue="drafted" className="w-full">
        <TabsList className="grid grid-cols-2 w-1/2 bg-indigo-100 rounded-xl mx-auto mb-4">
          <TabsTrigger
            value="drafted"
            className="data-[state=active]:bg-indigo-700 data-[state=active]:text-white"
          >
            <FaFileAlt className="mr-2" /> Drafted
          </TabsTrigger>
          <TabsTrigger
            value="posted"
            className="data-[state=active]:bg-indigo-700 data-[state=active]:text-white"
          >
            <FaCheckCircle className="mr-2" /> Posted
          </TabsTrigger>
        </TabsList>

        <TabsContent value="drafted">
          <Draft />
        </TabsContent>

        <TabsContent value="posted">
          <Posted />
        </TabsContent>
      </Tabs>

      {/* 🔹 Drawers for Adding Items */}
      {/* <AddVoucherDrawer
        open={showAddVoucherDrawer}
        onClose={() => setShowAddVoucherDrawer(false)}
      /> */}
      <AddPurchaseInvoiceDrawer
        open={showAddDrawer}
        onClose={() => setShowAddDrawer(false)}
      />
    </div>
  );
}
