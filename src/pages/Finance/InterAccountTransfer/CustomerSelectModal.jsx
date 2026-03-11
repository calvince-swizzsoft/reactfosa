import React, { useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search } from "lucide-react";


export default function CustomerSelectModal({ open, onClose, customers, onSelect }) {
    const [search, setSearch] = useState("");

    const filtered = useMemo(() => {
        return customers.filter((m) =>
            `${m.Customer.IndividualFirstName} ${m.Customer.IndividualLastName}`
                .toLowerCase()
                .includes(search.toLowerCase())
        );
    }, [customers, search]);

    return (
        <AnimatePresence>
            {open && (
                <>
                    {/* Backdrop */}
                    <motion.div
                        className="fixed inset-0 bg-black/20 z-40"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 0.4 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                    />

                    {/* Right-side drawer */}
                    <motion.div
                        className="fixed top-15 right-45 h-[60vh] w-full max-w-md z-50 flex flex-col bg-white shadow-2xl rounded-2xl"
                        initial={{ x: "100%" }}
                        animate={{ x: 0 }}
                        exit={{ x: "100%" }}
                        transition={{ type: "spring", stiffness: 260, damping: 30 }}
                    >
                        {/* Header */}
                        <div className="flex justify-between items-center p-4 bg-indigo-700 text-white rounded-2xl m-2">
                            <h2 className="text-lg font-bold">Select Customer</h2>
                            <Button
                                variant="outline"
                                size="sm"
                                className="bg-white text-gray-800"
                                onClick={onClose}
                            >
                                Close
                            </Button>
                        </div>

                        {/* Content */}
                        <div className="p-5 flex flex-col h-full bg-gray-50">
                            {/* Search */}
                            <div className="relative mb-3">
                                <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                                <Input
                                    className="pl-9"
                                    placeholder="Search customer..."
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                />
                            </div>

                            {/* Customer list */}
                            <div className="flex-1 overflow-y-auto border rounded-md bg-white">
                                {filtered.length === 0 && (
                                    <div className="p-4 text-sm text-center text-gray-500">
                                        No customers found
                                    </div>
                                )}

                                {filtered.map((m) => (
                                    <button
                                        key={m.Customer.Id}
                                        onClick={() => {
                                            onSelect(m);
                                            onClose();
                                        }}
                                        className="w-full text-left p-3 hover:bg-indigo-50 border-b last:border-b-0"
                                    >
                                        <div className="font-medium">
                                            {m.Customer.IndividualFirstName} {m.Customer.IndividualLastName}
                                        </div>
                                    </button>
                                ))}
                            </div>
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
}
