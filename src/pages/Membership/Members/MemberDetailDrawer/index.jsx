import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import {
    Tabs,
    TabsList,
    TabsTrigger,
    TabsContent,
} from "@/components/ui/tabs";
import { FaUser, FaWallet, FaUsers } from "react-icons/fa";

import MemberInfoTab from "./MemberInfoTab";
import MemberAccountsTab from "./MemberAccountsTab";
import MemberNextOfKinTab from "./MemberNextOfKinTab";
import MemberStatement from "./MemberStatement";

export default function MemberDetailsDrawer({ open, onClose, member }) {
    if (!open || !member) return null;

    const { Customer, Accounts, NextOfKin } = member;

    return (
        <AnimatePresence>
            {open && (
                <>
                    {/* BACKDROP */}
                    <motion.div
                        className="fixed inset-0 bg-black z-40"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 0.4 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                    />

                    {/* DRAWER */}
                    <motion.div
                        className="fixed top-3 right-3 w-[85vw] max-w-[1000px] bg-white shadow-2xl z-50 
                                   flex flex-col rounded-2xl h-[94vh] overflow-hidden"
                        initial={{ x: "100%" }}
                        animate={{ x: 0 }}
                        exit={{ x: "100%" }}
                        transition={{ type: "spring", stiffness: 260, damping: 26 }}
                    >
                        <div className="bg-gray-100 m-2 rounded-xl h-full flex flex-col">

                            {/* HEADER */}
                            <div className="p-4 flex justify-between items-center bg-indigo-700 rounded-xl m-2">
                                <h2 className="font-bold text-xl text-white">
                                    Member – {Customer?.IndividualFirstName} {Customer?.IndividualLastName}
                                </h2>
                                <Button variant="outline" size="sm" onClick={onClose}>
                                    Close
                                </Button>
                            </div>

                            {/* CONTENT */}
                            <div className="p-5 flex-1 overflow-y-auto">

                                <Tabs defaultValue="details">
                                    <TabsList className="flex justify-center gap-3 bg-indigo-800 text-white rounded-xl p-6 mb-6 shadow-inner">

                                        <TabsTrigger value="details" className="flex items-center gap-2 px-4 py-2">
                                            <FaUser /> Member Details
                                        </TabsTrigger>
                                        <TabsTrigger value="nok" className="flex items-center gap-2 px-4 py-2">
                                            <FaUsers /> Next of Kin
                                        </TabsTrigger>
                                        <TabsTrigger value="accounts" className="flex items-center gap-2 px-4 py-2">
                                            <FaWallet /> Accounts
                                        </TabsTrigger>
                                        {/* <TabsTrigger value="statements" className="flex items-center gap-2 px-4 py-2">
                                            <FaWallet /> Entries
                                        </TabsTrigger> */}
                                    </TabsList>






                                    <TabsContent value="details">
                                        <MemberInfoTab customer={Customer} />
                                    </TabsContent>

                                    <TabsContent value="accounts">
                                        <MemberAccountsTab accounts={Accounts} />
                                    </TabsContent>

                                    <TabsContent value="nok">
                                        <MemberNextOfKinTab nextOfKin={NextOfKin} />
                                    </TabsContent>
                                    {/* <TabsContent value="statements">
                                        <MemberStatement customer={Customer} accounts={Accounts} />
                                    </TabsContent> */}
                                </Tabs>
                            </div>
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
}

