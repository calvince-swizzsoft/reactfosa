import React, { useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Search } from "lucide-react";

export default function MemberSelectModal({ open, onClose, members, onSelect }) {
    const [search, setSearch] = useState("");

    const filteredMembers = useMemo(() => {
        return members.filter((m) => {
            const name = `${m.IndividualFirstName} ${m.IndividualLastName}`.toLowerCase();
            const ref = (m.Reference2 || "").toLowerCase();
            return (
                name.includes(search.toLowerCase()) ||
                ref.includes(search.toLowerCase())
            );
        });
    }, [members, search]);

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

                    {/* Modal Panel */}
                    <motion.div
                        className="fixed top-1/2 left-1/2 w-[80vw] max-w-[500px] bg-white shadow-2xl z-50 flex flex-col rounded-2xl -translate-x-1/2 -translate-y-1/2"
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.8 }}
                        transition={{ type: "spring", stiffness: 260, damping: 30 }}
                    >
                        {/* Header */}
                        <div className="p-4 flex justify-between items-center bg-indigo-700 text-white rounded-t-2xl">
                            <h2 className="font-bold text-lg">Select Member</h2>
                            <Button variant="outline" size="sm" className="text-gray-800" onClick={() => onClose(false)}>
                                Close
                            </Button>
                        </div>

                        {/* Content */}
                        <div className="p-5 overflow-y-auto h-[60vh] bg-gray-50">
                            {/* Search */}
                            <div className="relative mb-3">
                                <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                                <Input
                                    className="pl-9"
                                    placeholder="Search by name or member number..."
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                />
                            </div>

                            {/* Member List */}
                            <div className="max-h-[45vh] overflow-y-auto border rounded-md">
                                {filteredMembers.length === 0 && (
                                    <div className="p-4 text-sm text-center text-gray-500">
                                        No members found
                                    </div>
                                )}

                                {filteredMembers.map((m) => (
                                    <button
                                        key={m.Id}
                                        onClick={() => {
                                            onSelect(m.Id);
                                            onClose(false);
                                        }}
                                        className="w-full text-left p-3 hover:bg-indigo-50 border-b last:border-b-0"
                                    >
                                        <div className="font-medium">
                                            {m.IndividualFirstName} {m.IndividualLastName}
                                        </div>
                                        <div className="text-xs text-gray-500">
                                            Member No: {m.Reference2 || "—"}
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
