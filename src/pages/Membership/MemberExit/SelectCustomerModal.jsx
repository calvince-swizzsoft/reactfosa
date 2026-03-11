import { motion, AnimatePresence } from "framer-motion";
import { useEffect, useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

const API_URL = "http://88.99.215.90:8600";

export default function SelectCustomerModal({
    open,
    onClose,
    onSelect,
}) {
    const [members, setMembers] = useState([]);
    const [loading, setLoading] = useState(false);
    const [search, setSearch] = useState("");

    useEffect(() => {
        if (!open) return;

        const fetchMembers = async () => {
            setLoading(true);
            try {
                const res = await fetch(
                    `${API_URL}/api/values/GetMembersWithDetails`
                );
                const json = await res.json();
                setMembers(json?.Data?.Members ?? []);
            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        };

        fetchMembers();
    }, [open]);

    const filtered = members.filter((m) => {
        const c = m.Customer;
        return (
            c.IndividualFirstName?.toLowerCase().includes(search.toLowerCase()) ||
            c.IndividualLastName?.toLowerCase().includes(search.toLowerCase()) ||
            c.IndividualIdentityCardNumber?.includes(search)
        );
    });

    return (
        <AnimatePresence>
            {open && (
                <>
                    {/* Overlay */}
                    <motion.div
                        className="fixed inset-0 bg-black z-50"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 0.4 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                    />

                    {/* Modal */}
                    <motion.div
                        className="fixed top-1/2 right-3 z-50 w-[500px] max-h-[80vh] -translate-x-1/2 -translate-y-1/2 bg-white rounded-xl shadow-xl flex flex-col"
                        initial={{ scale: 0.9, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        exit={{ scale: 0.9, opacity: 0 }}
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="p-4 border-b font-semibold">
                            Select Member
                        </div>

                        <div className="p-3">
                            <Input
                                placeholder="Search by name or ID number"
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                            />
                        </div>

                        <div className="flex-1 overflow-y-auto p-3 space-y-2">
                            {loading && <p className="text-sm">Loading...</p>}

                            {!loading && filtered.map((member) => {
                                const { Customer, Accounts } = member;

                                return (
                                    <div
                                        key={Customer.Id}
                                        className="border rounded-md p-3 cursor-pointer hover:bg-gray-100"
                                        onClick={() => {
                                            onSelect({ Customer, Accounts });
                                            onClose();
                                        }}
                                    >
                                        <div className="font-medium">
                                            {Customer.IndividualFirstName} {Customer.IndividualLastName}
                                        </div>
                                        <div className="text-xs text-gray-600">
                                            ID: {Customer.IndividualIdentityCardNumber}
                                        </div>
                                        <div className="text-xs text-gray-600">
                                            Phone: {Customer.AddressMobileLine}
                                        </div>
                                    </div>
                                );
                            })}

                        </div>

                        <div className="p-3 border-t flex justify-end">
                            <Button variant="outline" onClick={onClose}>
                                Close
                            </Button>
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
}
