// import React, { useEffect, useState } from "react";
// import { motion, AnimatePresence } from "framer-motion";
// import { Button } from "@/components/ui/button";
// import { Input } from "@/components/ui/input";
// import { Label } from "@/components/ui/label";
// import { Card } from "@/components/ui/card";
// import Swal from "sweetalert2";
// import { Steps } from "@ark-ui/react/steps";
// import { Check, Trash2 } from "lucide-react";
// import {
//     Select,
//     SelectTrigger,
//     SelectValue,
//     SelectContent,
//     SelectItem,
// } from "@/components/ui/select";
// import { nationalities, banks } from "./Selectdata";
// import { useMemberRegistration } from "./MemberRegistrationContext";

// const STEPS = [
//     { title: "Personal Details", description: "Basic info & contacts" },
//     { title: "Next of Kin", description: "Beneficiary details" },
//     { title: "Uploads", description: "Documents & images" },
// ];




// export default function MemberRegistrationDrawer({ open, onClose, refresh }) {
//     // ── Context (state + auto-save + clear) ────────────────────────────────
//     const {
//         customer, setCustomer,
//         nextOfKins, setNextOfKins,
//         step, setStep,
//         hasDraft, clearDraft,
//         initialNextOfKin,
//     } = useMemberRegistration();

//     // ── Local UI state ──────────────────────────────────────────────────────
//     const [branches, setBranches] = useState([]);
//     const [stations, setStations] = useState([]);
//     const [loading, setLoading] = useState(false);
//     const [checkingId, setCheckingId] = useState(false);
//     const [idExists, setIdExists] = useState(false);
//     const [showNationalityDropdown, setShowNationalityDropdown] = useState(false);
//     const [administrativeDivision, setAdministrativeDivision] = useState([]);
//     const [errors, setErrors] = useState({
//         addressEmail: "",
//         addressMobileLine: "",
//         personalIdentificationNumber: "",
//         individualIdentityCardNumber: "",
//     });



//     const update = (key, value) => setCustomer(prev => ({ ...prev, [key]: value }));
//     const next = () => setStep(s => Math.min(s + 1, STEPS.length));
//     const back = () => setStep(s => Math.max(s - 1, 1));

//     const handleSafeClose = () => {
//         if (hasDraft) {
//             Swal.fire({
//                 title: "Close without submitting?",
//                 text: "Your draft is saved and will be here when you return.",
//                 icon: "info",
//                 showCancelButton: true,
//                 confirmButtonColor: "#4f46e5",
//                 cancelButtonColor: "#d33",
//                 confirmButtonText: "Yes, close",
//             }).then(r => { if (r.isConfirmed) onClose(); });
//         } else {
//             onClose();
//         }
//     };

//     const handleClearDraft = () => {
//         Swal.fire({
//             title: "Clear draft?",
//             text: "All staged data will be permanently deleted.",
//             icon: "warning",
//             showCancelButton: true,
//             confirmButtonColor: "#dc2626",
//             confirmButtonText: "Yes, clear it",
//         }).then(r => { if (r.isConfirmed) clearDraft(); });
//     };

//     const updateNextOfKin = (index, key, value) => {
//         const updated = [...nextOfKins];
//         updated[index][key] = value;
//         setNextOfKins(updated);
//     };

//     const addNextOfKin = () => {
//         if (totalNokPercentage >= 100) {
//             Swal.fire("Limit reached", "Total nominated percentage is already 100%", "warning");
//             return;
//         }
//         setNextOfKins(prev => [...prev, { ...initialNextOfKin }]);
//     };

//     const removeNextOfKin = (index) => {
//         if (nextOfKins.length === 1) return;
//         setNextOfKins(prev => prev.filter((_, i) => i !== index));
//     };

//     const payload = { customer, nextOfKins };





//     // ========================
//     // VALIDATE ID NUMBER
//     // ========================
//     const checkIfIdExists = async (idNumber) => {
//         const trimmedId = idNumber?.trim();

//         if (!trimmedId || trimmedId.length < 5) {
//             setIdExists(false);
//             return;
//         }

//         setCheckingId(true);
//         try {
//             const response = await fetch(
//                 `${import.meta.env.VITE_APP_MEMBERSHIP_URL}/api/customers/search/identity-card?identityCardNumber=${trimmedId}&exactMatch=true`,
//             );

//             if (response.ok) {
//                 const data = await response.json();
//                 const exists = Array.isArray(data?.data) && data.data.length > 0;

//                 setIdExists(exists);
//                 setErrors(prev => ({
//                     ...prev,
//                     individualIdentityCardNumber: exists
//                         ? "This ID number is already registered"
//                         : ""
//                 }));
//             }
//         } catch (err) {
//             console.error("Error checking ID:", err);
//         } finally {
//             setCheckingId(false);
//         }
//     };







//     // ========================
//     // SUBMIT HANDLER
//     // ========================
//     const handleSubmit = async () => {
//         // Validate required fields
//         if (!customer.individualFirstName || !customer.individualLastName) {
//             Swal.fire("Error", "First name and last name are required", "error");
//             return;
//         }

//         if (!customer.individualIdentityCardNumber) {
//             Swal.fire("Error", "ID/Passport number is required", "error");
//             return;
//         }

//         if (idExists) {
//             Swal.fire("Error", "This ID number is already registered. Please use a different ID.", "error");
//             return;
//         }

//         // Validate email if provided
//         if (customer.addressEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(customer.addressEmail)) {
//             Swal.fire("Error", "Please enter a valid email address", "error");
//             return;
//         }

//         // Validate mobile if provided
//         if (customer.addressMobileLine && !/^\+254(7|1)\d{8}$/.test(customer.addressMobileLine)) {
//             Swal.fire("Error", "Phone must start with +254 and be 12 digits", "error");
//             return;
//         }

//         // Validate PIN format if provided
//         if (customer.personalIdentificationNumber && !/^[A-Z]\d{9}[A-Z]$/.test(customer.personalIdentificationNumber)) {
//             Swal.fire("Error", "KRA PIN must be in format A123456789B", "error");
//             return;
//         }

//         setLoading(true);


//         try {
//             const response = await fetch(
//                 `${import.meta.env.VITE_APP_MEMBERSHIP_URL}/api/customers`,
//                 {
//                     method: "POST",
//                     headers: {
//                         "Content-Type": "application/json"
//                     },
//                     body: JSON.stringify(payload),
//                 }
//             );

//             if (!response.ok) throw new Error("Failed to submit");

//             console.log(response);
//             const data = await response.json();

//             console.log(data);

//             if (data.success) {
//                 Swal.fire("Success", data.message, "success");
//                 clearDraft(); // <--- CLEAR DRAFT ON SUCCESS

//                 //refresh();
//                 //onClose();
//                 if (refresh) refresh();
//                 if (onClose) onClose();
//             } else {
//                 Swal.fire("Error", data.message, "error");
//             }
//         } catch (err) {
//             Swal.fire("Error", "Failed to register member", "error");
//         } finally {
//             setLoading(false);
//         }
//     };

//     const loadStations = async () => {
//         try {
//             const res = await fetch(`${import.meta.env.VITE_APP_MEMBERSHIP_URL}/api/stations`);
//             const json = await res.json();
//             if (json.success) {
//                 setStations(json.data);
//             }
//         } catch (err) {
//             console.error("Failed to load stations", err);
//         }
//     };

//     const loadAdministrativeDivision = async () => {
//         try {
//             const res = await fetch(`${import.meta.env.VITE_APP_MEMBERSHIP_URL}/api/administrative-divisions`);
//             const json = await res.json();
//             if (json.success) {
//                 setAdministrativeDivision(json.data);
//             }
//         } catch (err) {
//             console.error("Failed to load stations", err);
//         }
//     };

//     const fetchBranches = async () => {
//         try {
//             const res = await fetch(
//                 `${import.meta.env.VITE_APP_MEMBERSHIP_URL}/api/branches`
//             );
//             const json = await res.json();
//             setBranches(json.data || []);
//         } catch (err) {
//             console.error("Fetch Branches Error:", err);
//         } finally {
//             setLoading(false);
//         }
//     };

//     useEffect(() => {
//         loadStations();
//         loadAdministrativeDivision();
//         fetchBranches();
//     }, []);

//     const toBase64 = (file) =>
//         new Promise((resolve, reject) => {
//             const reader = new FileReader();
//             reader.readAsDataURL(file);
//             reader.onload = () => resolve(reader.result.split(",")[1]); // strip prefix
//             reader.onerror = reject;
//         });

//     const handleImageUpload = async (e, key) => {
//         const file = e.target.files[0];
//         if (!file) return;

//         const base64 = await toBase64(file);
//         update(key, base64);
//     };

//     const totalNokPercentage = nextOfKins.reduce(
//         (sum, k) => sum + Number(k.nominatedPercentage || 0),
//         0
//     );

//     // Get today's date for max date validation
//     const today = new Date().toISOString().split('T')[0];

//     // Filter nationalities based on search
//     const [nationalitySearch, setNationalitySearch] = useState("");
//     const filteredNationalities = nationalities.filter(nationality =>
//         nationality.toLowerCase().includes(nationalitySearch.toLowerCase())
//     );

//     // Filter banks based on search
//     const [bankSearch, setBankSearch] = useState("");
//     const filteredBanks = banks.filter(bank =>
//         bank.toLowerCase().includes(bankSearch.toLowerCase())
//     );

//     return (
//         <AnimatePresence>
//             {open && (
//                 <>
//                     {/* BACKDROP */}
//                     <motion.div
//                         className="fixed inset-0 bg-black z-40"
//                         initial={{ opacity: 0 }}
//                         animate={{ opacity: 0.4 }}
//                         exit={{ opacity: 0 }}
//                         onClick={onClose}
//                     />

//                     {/* DRAWER */}
//                     <motion.div
//                         className="fixed top-3 right-3 w-[85vw] max-w-[1200px] bg-white shadow-2xl z-50 flex flex-col rounded-2xl"
//                         initial={{ x: "100%" }}
//                         animate={{ x: 0 }}
//                         exit={{ x: "100%" }}
//                         transition={{ type: "spring", stiffness: 280, damping: 28 }}
//                     >

//                         {/* DRAFT BANNER */}
//                         {hasDraft && (
//                             <div className="mx-2 mt-2 px-4 py-2 bg-amber-50 border border-amber-300 rounded-xl flex items-center justify-between text-sm">
//                                 <span className="text-amber-700 font-medium">
//                                     Draft in progress — your data is auto-saved locally.
//                                 </span>
//                                 <button
//                                     onClick={handleClearDraft}
//                                     className="flex items-center gap-1 text-red-600 hover:text-red-800 font-medium ml-4"
//                                 >
//                                     <Trash2 className="w-4 h-4" />
//                                     Clear Draft
//                                 </button>
//                             </div>
//                         )}

//                         {/* HEADER */}
//                         <div className="p-4 flex justify-between items-center bg-indigo-700 rounded-2xl m-2">
//                             <h2 className="font-bold text-xl text-white">Member Registration</h2>
//                             <Button variant="outline" size="sm" onClick={handleSafeClose}>
//                                 Close
//                             </Button>
//                         </div>

//                         <div className="grid grid-cols-12 h-[88vh] overflow-hidden p-3">

//                             {/* LEFT STEPS NAVIGATION */}
//                             <aside className="col-span-2 bg-gray-100 p-4 rounded-lg flex flex-col">
//                                 <Steps.Root
//                                     count={STEPS.length}
//                                     step={step - 1}
//                                     onStepChange={({ step: s }) => setStep(s + 1)}
//                                     orientation="vertical"
//                                     className="w-full"
//                                 >
//                                     <Steps.List className="flex flex-col gap-1">
//                                         {STEPS.map((s, index) => {
//                                             const isComplete = index < step - 1;
//                                             const isCurrent = index === step - 1;
//                                             return (
//                                                 <Steps.Item
//                                                     key={index}
//                                                     index={index}
//                                                     className="relative flex items-start"
//                                                 >
//                                                     <Steps.Trigger className="flex items-start gap-3 text-left rounded-md w-full py-2 px-1 hover:bg-gray-200 transition-colors">
//                                                         <div className={`flex justify-center items-center shrink-0 rounded-full font-semibold w-8 h-8 text-sm border-2 transition-colors
//                                                             ${isComplete ? "bg-indigo-700 text-white border-indigo-700" : ""}
//                                                             ${isCurrent ? "bg-indigo-700 text-white border-indigo-700" : ""}
//                                                             ${!isComplete && !isCurrent ? "bg-white text-gray-400 border-gray-300" : ""}
//                                                         `}>
//                                                             {isComplete
//                                                                 ? <Check className="w-4 h-4" />
//                                                                 : index + 1
//                                                             }
//                                                         </div>
//                                                         <div className="flex flex-col min-w-0">
//                                                             <span className={`text-xs font-semibold leading-tight ${isCurrent ? "text-indigo-700" : "text-gray-800"}`}>
//                                                                 {s.title}
//                                                             </span>
//                                                             <span className="text-xs text-gray-400 leading-tight mt-0.5">
//                                                                 {s.description}
//                                                             </span>
//                                                         </div>
//                                                     </Steps.Trigger>
//                                                     {index < STEPS.length - 1 && (
//                                                         <div className={`absolute top-10 left-4 w-0.5 h-6 transition-colors ${isComplete ? "bg-indigo-700" : "bg-gray-300"}`} />
//                                                     )}
//                                                 </Steps.Item>
//                                             );
//                                         })}
//                                     </Steps.List>
//                                 </Steps.Root>
//                             </aside>

//                             {/* RIGHT CONTENT */}
//                             <main className="col-span-10 p-6 overflow-y-auto">

//                                 {/* STEP 1 – PERSONAL INFO */}
//                                 {step === 1 && (
//                                     <section>
//                                         <h3 className="text-lg font-semibold mb-3 bg-indigo-700 text-white p-3 rounded-2xl">Personal Information</h3>

//                                         <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
//                                             <div>
//                                                 <Label>Type</Label>
//                                                 <select
//                                                     value={customer.type}
//                                                     onChange={(e) => update("type", e.target.value)}
//                                                     required
//                                                     className="w-full border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
//                                                 >
//                                                     <option value="">Select Member Type</option>
//                                                     <option value="1">Individual</option>
//                                                     <option value="2">Partnership</option>
//                                                     <option value="3">Corporation</option>
//                                                     <option value="4">MicroCredit</option>
//                                                 </select>
//                                             </div>
//                                             <div>
//                                                 <Label>Surname *</Label>
//                                                 <Input
//                                                     value={customer.individualLastName}
//                                                     onChange={e => update("individualLastName", e.target.value)}
//                                                     required
//                                                     placeholder="Enter surname"
//                                                 />
//                                             </div>

//                                             <div>
//                                                 <Label>Other Name *</Label>
//                                                 <Input
//                                                     required
//                                                     value={customer.individualFirstName}
//                                                     onChange={e => update("individualFirstName", e.target.value)}
//                                                     placeholder="Enter other name"
//                                                 />
//                                             </div>

//                                             <div>
//                                                 <Label>ID / Passport Number *</Label>
//                                                 <div className="relative">
//                                                     <Input
//                                                         value={customer.individualIdentityCardNumber}
//                                                         onChange={(e) => {
//                                                             update("individualIdentityCardNumber", e.target.value);
//                                                             setErrors(prev => ({ ...prev, individualIdentityCardNumber: "" }));
//                                                             setIdExists(false);
//                                                         }}
//                                                         onBlur={() => {
//                                                             const trimmed = customer.individualIdentityCardNumber?.trim();

//                                                             update("individualIdentityCardNumber", trimmed);

//                                                             if (trimmed && trimmed.length >= 5) {
//                                                                 checkIfIdExists(trimmed);
//                                                             }
//                                                         }}
//                                                         className={
//                                                             errors.individualIdentityCardNumber || idExists
//                                                                 ? "border-red-500 focus-visible:ring-red-500"
//                                                                 : ""
//                                                         }
//                                                         placeholder="Enter ID/Passport number"
//                                                         required
//                                                     />

//                                                     {checkingId && (
//                                                         <div className="absolute right-2 top-2">
//                                                             <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-900"></div>
//                                                         </div>
//                                                     )}
//                                                 </div>
//                                                 {idExists && (
//                                                     <p className="text-sm text-red-500 mt-1">
//                                                         This ID number is already registered
//                                                     </p>
//                                                 )}
//                                                 {errors.individualIdentityCardNumber && !idExists && (
//                                                     <p className="text-sm text-red-500 mt-1">
//                                                         {errors.individualIdentityCardNumber}
//                                                     </p>
//                                                 )}
//                                             </div>


//                                             <div>
//                                                 <Label>Date of Birth</Label>
//                                                 <Input
//                                                     type="date"
//                                                     value={customer.individualBirthDate}
//                                                     onChange={e => update("individualBirthDate", e.target.value)}
//                                                     max={today}
//                                                 />
//                                             </div>

//                                             <div>
//                                                 <Label>Mobile</Label>
//                                                 <Input
//                                                     placeholder="+2547XXXXXXXX"
//                                                     value={customer.addressMobileLine}
//                                                     onChange={(e) => {
//                                                         update("addressMobileLine", e.target.value);
//                                                         setErrors(prev => ({ ...prev, addressMobileLine: "" }));
//                                                     }}
//                                                     onBlur={() => {
//                                                         if (
//                                                             customer.addressMobileLine &&
//                                                             !/^\+254(7|1)\d{8}$/.test(customer.addressMobileLine)
//                                                         ) {
//                                                             setErrors(prev => ({
//                                                                 ...prev,
//                                                                 addressMobileLine:
//                                                                     "Phone must start with +254 and be 12 digits",
//                                                             }));
//                                                         }
//                                                     }}
//                                                     className={
//                                                         errors.addressMobileLine
//                                                             ? "border-red-500 focus-visible:ring-red-500"
//                                                             : ""
//                                                     }
//                                                 />

//                                                 {errors.addressMobileLine && (
//                                                     <p className="text-sm text-red-500 mt-1">
//                                                         {errors.addressMobileLine}
//                                                     </p>
//                                                 )}
//                                             </div>
//                                             <div>
//                                                 <Label>Landline</Label>
//                                                 <Input
//                                                     value={customer.addressLandLine}
//                                                     onChange={(e) => update("addressLandLine", e.target.value)}
//                                                     placeholder="0201234567"
//                                                 />
//                                             </div>

//                                             <div>
//                                                 <Label>Email</Label>
//                                                 <Input
//                                                     type="email"
//                                                     value={customer.addressEmail}
//                                                     onChange={(e) => {
//                                                         update("addressEmail", e.target.value);
//                                                         setErrors(prev => ({ ...prev, addressEmail: "" }));
//                                                     }}
//                                                     onBlur={() => {
//                                                         if (
//                                                             customer.addressEmail &&
//                                                             !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(customer.addressEmail)
//                                                         ) {
//                                                             setErrors(prev => ({
//                                                                 ...prev,
//                                                                 addressEmail: "Enter a valid email address",
//                                                             }));
//                                                         }
//                                                     }}
//                                                     className={
//                                                         errors.addressEmail
//                                                             ? "border-red-500 focus-visible:ring-red-500"
//                                                             : ""
//                                                     }
//                                                     placeholder="email@example.com"
//                                                 />

//                                                 {errors.addressEmail && (
//                                                     <p className="text-sm text-red-500 mt-1">
//                                                         {errors.addressEmail}
//                                                     </p>
//                                                 )}
//                                             </div>

//                                             <div>
//                                                 <Label>Marital Status</Label>
//                                                 <select
//                                                     value={customer.individualMaritalStatus}
//                                                     onChange={(e) => update("individualMaritalStatus", e.target.value)}
//                                                     className="w-full border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
//                                                 >
//                                                     <option value="">Select Marital Status</option>
//                                                     <option value="1">Single</option>
//                                                     <option value="2">Married</option>
//                                                     <option value="3">Divorced</option>
//                                                     <option value="4">Widowed</option>
//                                                     <option value="5">Separated</option>
//                                                 </select>
//                                             </div>

//                                             <div>
//                                                 <Label>KRA PIN (Optional)</Label>
//                                                 <Input
//                                                     placeholder="A123456789B"
//                                                     value={customer.personalIdentificationNumber}
//                                                     onChange={(e) => {
//                                                         update(
//                                                             "personalIdentificationNumber",
//                                                             e.target.value.toUpperCase()
//                                                         );
//                                                         setErrors(prev => ({ ...prev, personalIdentificationNumber: "" }));
//                                                     }}
//                                                     onBlur={() => {
//                                                         if (
//                                                             customer.personalIdentificationNumber &&
//                                                             !/^[A-Z]\d{9}[A-Z]$/.test(
//                                                                 customer.personalIdentificationNumber
//                                                             )
//                                                         ) {
//                                                             setErrors(prev => ({
//                                                                 ...prev,
//                                                                 personalIdentificationNumber:
//                                                                     "KRA PIN must be in format A123456789B",
//                                                             }));
//                                                         }
//                                                     }}
//                                                     className={
//                                                         errors.personalIdentificationNumber
//                                                             ? "border-red-500 focus-visible:ring-red-500"
//                                                             : ""
//                                                     }
//                                                 />

//                                                 {errors.personalIdentificationNumber && (
//                                                     <p className="text-sm text-red-500 mt-1">
//                                                         {errors.personalIdentificationNumber}
//                                                     </p>
//                                                 )}
//                                             </div>

//                                             <div>
//                                                 <Label>Gender</Label>
//                                                 <select
//                                                     value={customer.individualGender}
//                                                     onChange={(e) => update("individualGender", e.target.value)}
//                                                     className="w-full border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
//                                                 >
//                                                     <option value="">Select gender</option>
//                                                     <option value="1">Male</option>
//                                                     <option value="2">Female</option>
//                                                 </select>
//                                             </div>
//                                             <div>
//                                                 <Label>City</Label>
//                                                 <Input
//                                                     value={customer.addressCity}
//                                                     onChange={e => update("addressCity", e.target.value)}
//                                                     placeholder="Enter city"
//                                                 />
//                                             </div>

//                                             <div>
//                                                 <Label>Postal Code</Label>
//                                                 <Input
//                                                     value={customer.addressPostalCode}
//                                                     onChange={e => update("addressPostalCode", e.target.value)}
//                                                     placeholder="00100"
//                                                 />
//                                             </div>
//                                             <div>
//                                                 <Label>Place Of Birth</Label>
//                                                 <Input
//                                                     value={customer.addressStreet}
//                                                     onChange={(e) => update("addressStreet", e.target.value)}
//                                                     placeholder="Enter place of birth"
//                                                 />
//                                             </div>

//                                             {/* FIXED: Nationality Field with Auto-Population */}
//                                             <div>
//                                                 <Label>Nationality</Label>
//                                                 <div className="relative">
//                                                     <Input
//                                                         type="text"
//                                                         value={nationalitySearch}
//                                                         onChange={(e) => {
//                                                             const value = e.target.value;
//                                                             setNationalitySearch(value);
//                                                             setShowNationalityDropdown(true);

//                                                             if (value !== customer.individualNationality) {
//                                                                 update("individualNationality", "");
//                                                             }
//                                                         }}
//                                                         onFocus={() => {
//                                                             setShowNationalityDropdown(true);
//                                                             setNationalitySearch(customer.individualNationality || "");
//                                                         }}
//                                                         onBlur={() => {
//                                                             // Delay so click can register
//                                                             setTimeout(() => setShowNationalityDropdown(false), 150);
//                                                         }}
//                                                         placeholder="Search nationality..."
//                                                         className="w-full border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
//                                                     />


//                                                     {/* Dropdown list */}
//                                                     {showNationalityDropdown && nationalitySearch && filteredNationalities.length > 0 && (
//                                                         <div className="absolute z-10 w-full bg-white border border-gray-300 rounded-md shadow-lg max-h-48 overflow-y-auto mt-1">
//                                                             {filteredNationalities.map((nationality) => (
//                                                                 <div
//                                                                     key={nationality}
//                                                                     className="px-3 py-2 hover:bg-gray-100 cursor-pointer"
//                                                                     onMouseDown={() => {
//                                                                         update("individualNationality", nationality);
//                                                                         setNationalitySearch(nationality);
//                                                                         setShowNationalityDropdown(false); // 👈 closes dropdown
//                                                                     }}
//                                                                 >
//                                                                     {nationality}
//                                                                 </div>
//                                                             ))}
//                                                         </div>
//                                                     )}


//                                                     {/* Hidden select for form submission */}
//                                                     <select
//                                                         value={customer.individualNationality}
//                                                         onChange={(e) => {
//                                                             update("individualNationality", e.target.value);
//                                                             setNationalitySearch(e.target.value);
//                                                         }}
//                                                         className="hidden"
//                                                     >
//                                                         <option value="">Select Nationality</option>
//                                                         {filteredNationalities.map((nationality) => (
//                                                             <option key={nationality} value={nationality}>
//                                                                 {nationality}
//                                                             </option>
//                                                         ))}
//                                                     </select>

//                                                     {customer.individualNationality && (
//                                                         <p className="text-xs text-gray-500 mt-1">
//                                                             Selected: {customer.individualNationality}
//                                                         </p>
//                                                     )}
//                                                 </div>
//                                             </div>

//                                             <div>
//                                                 <Label>Payroll Number</Label>
//                                                 <Input
//                                                     value={customer.individualPayrollNumbers}
//                                                     onChange={(e) => update("individualPayrollNumbers", e.target.value)}
//                                                     placeholder="Enter payroll number"
//                                                 />
//                                             </div>

//                                             <div>
//                                                 <Label>Branch</Label>
//                                                 <Select
//                                                     onValueChange={(value) => update("branchId", value)}
//                                                     value={customer.branchId}
//                                                 >
//                                                     <SelectTrigger>
//                                                         <SelectValue placeholder="Select branch" />
//                                                     </SelectTrigger>

//                                                     <SelectContent>
//                                                         {branches.map((b) => (
//                                                             <SelectItem key={b.Id} value={b.Id}>
//                                                                 {b.Description}
//                                                             </SelectItem>
//                                                         ))}
//                                                     </SelectContent>
//                                                 </Select>
//                                             </div>

//                                             <div>
//                                                 <Label>Station</Label>
//                                                 <Select
//                                                     onValueChange={(value) => update("stationId", value)}
//                                                     value={customer.stationId}
//                                                 >
//                                                     <SelectTrigger>
//                                                         <SelectValue placeholder="Select station" />
//                                                     </SelectTrigger>

//                                                     <SelectContent>
//                                                         {stations.map((s) => (
//                                                             <SelectItem key={s.Id} value={s.Id}>
//                                                                 {s.Description}
//                                                             </SelectItem>
//                                                         ))}
//                                                     </SelectContent>
//                                                 </Select>
//                                             </div>

//                                             <div>
//                                                 <Label>Designation</Label>
//                                                 <Input
//                                                     value={customer.individualEmploymentDesignation}
//                                                     onChange={e => update("individualEmploymentDesignation", e.target.value)}
//                                                     placeholder="Enter designation"
//                                                 />
//                                             </div>

//                                             <div>
//                                                 <Label>Terms of Service</Label>
//                                                 <select
//                                                     value={customer.individualEmploymentTermsOfService}
//                                                     onChange={e => update("individualEmploymentTermsOfService", e.target.value)}
//                                                     className="w-full border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
//                                                 >
//                                                     <option value="">Select Terms of Service</option>
//                                                     <option value="1">Permanent</option>
//                                                     <option value="2">Contract</option>
//                                                     <option value="3">Casual</option>
//                                                     <option value="4">Self-Employed</option>
//                                                     <option value="5">Unemployed</option>
//                                                 </select>
//                                             </div>
//                                             <div>
//                                                 <Label>Registration Date</Label>
//                                                 <Input
//                                                     type="date"
//                                                     value={customer.registrationDate}
//                                                     onChange={e => update("registrationDate", e.target.value)}
//                                                     max={today}
//                                                 />
//                                                 <p className="text-xs text-gray-500 mt-1">
//                                                     Cannot select future dates
//                                                 </p>
//                                             </div>
//                                             <div>
//                                                 <Label>Bank Account Number</Label>
//                                                 <Input
//                                                     value={customer.reference1}
//                                                     onChange={e => update("reference1", e.target.value)}
//                                                     placeholder="Enter bank account number"
//                                                 />
//                                             </div>

//                                             {/* FIXED: Bank Name Field with Auto-Population */}
//                                             <div>
//                                                 <Label>Bank Name</Label>
//                                                 <div className="relative">
//                                                     <Input
//                                                         type="text"
//                                                         value={bankSearch}
//                                                         onChange={(e) => {
//                                                             const value = e.target.value;
//                                                             setBankSearch(value);
//                                                             // If user types something different from current selection, clear selection
//                                                             if (value !== customer.bankName) {
//                                                                 update("bankName", "");
//                                                             }
//                                                         }}
//                                                         onFocus={() => {
//                                                             if (customer.bankName) {
//                                                                 setBankSearch(customer.bankName);
//                                                             } else {
//                                                                 setBankSearch("");
//                                                             }
//                                                         }}
//                                                         placeholder="Search bank..."
//                                                         className="w-full border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
//                                                     />

//                                                     {/* Dropdown list */}
//                                                     {bankSearch && filteredBanks.length > 0 && (
//                                                         <div className="absolute z-10 w-full bg-white border border-gray-300 rounded-md shadow-lg max-h-48 overflow-y-auto mt-1">
//                                                             {filteredBanks.map((bank) => (
//                                                                 <div
//                                                                     key={bank}
//                                                                     className="px-3 py-2 hover:bg-gray-100 cursor-pointer"
//                                                                     onClick={() => {
//                                                                         update("bankName", bank);
//                                                                         setBankSearch(bank);
//                                                                     }}
//                                                                 >
//                                                                     {bank}
//                                                                 </div>
//                                                             ))}
//                                                         </div>
//                                                     )}

//                                                     {/* Hidden select for form submission */}
//                                                     <select
//                                                         value={customer.bankName}
//                                                         onChange={(e) => {
//                                                             update("bankName", e.target.value);
//                                                             setBankSearch(e.target.value);
//                                                         }}
//                                                         className="hidden"
//                                                     >
//                                                         <option value="">Select Bank</option>
//                                                         {filteredBanks.map((bank) => (
//                                                             <option key={bank} value={bank}>
//                                                                 {bank}
//                                                             </option>
//                                                         ))}
//                                                     </select>

//                                                     {customer.bankName && (
//                                                         <p className="text-xs text-gray-500 mt-1">
//                                                             Selected: {customer.bankName}
//                                                         </p>
//                                                     )}
//                                                 </div>
//                                             </div>

//                                             <div>
//                                                 <Label>Branch Name</Label>
//                                                 <Input
//                                                     value={customer.branchName}
//                                                     onChange={e => update("branchName", e.target.value)}
//                                                     placeholder="Enter branch name"
//                                                 />
//                                             </div>

//                                         </div>
//                                     </section>
//                                 )}

//                                 {/* STEP 2 – NEXT OF KIN */}
//                                 {step === 2 && (
//                                     <section>
//                                         <h3 className="text-lg font-semibold mb-2 bg-indigo-700 text-white p-3 rounded-2xl">Next of Kin</h3>
//                                         <div className="flex justify-end items-center p-2">
//                                             <p className={`mt-4 font-semibold ${totalNokPercentage === 100 ? "text-green-600" : "text-red-600"
//                                                 }`}>
//                                                 Total Allocation: {totalNokPercentage}% / 100%
//                                             </p>

//                                         </div>

//                                         {nextOfKins.map((nok, index) => (
//                                             <div
//                                                 key={index}
//                                                 className=" mb-6 p-4 border rounded-lg"
//                                             >
//                                                 {/* REMOVE BUTTON */}
//                                                 {nextOfKins.length > 1 && (
//                                                     <div className="flex justify-between items-center bg-gray-200 rounded-md p-2 px-4 mb-3">
//                                                         <h3 className="font-medium">Next of Kin {index + 1}</h3>
//                                                         <Button
//                                                             onClick={() => removeNextOfKin(index)}
//                                                             className="text-sm bg-red-600 hover:bg-red-800 text-red-100 hover:text-red-100"
//                                                         >
//                                                             Remove
//                                                         </Button>
//                                                     </div>
//                                                 )}
//                                                 <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
//                                                     <div>
//                                                         <Label>First Name</Label>
//                                                         <Input
//                                                             value={nok.firstName}
//                                                             onChange={(e) =>
//                                                                 updateNextOfKin(index, "firstName", e.target.value)
//                                                             }
//                                                         />
//                                                     </div>

//                                                     <div>
//                                                         <Label>Last Name</Label>
//                                                         <Input
//                                                             value={nok.lastName}
//                                                             onChange={(e) =>
//                                                                 updateNextOfKin(index, "lastName", e.target.value)
//                                                             }
//                                                         />
//                                                     </div>
//                                                     <div>
//                                                         <Label>Gender</Label>
//                                                         <select
//                                                             value={nok.gender}
//                                                             onChange={(e) =>
//                                                                 updateNextOfKin(index, "gender", e.target.value)
//                                                             }
//                                                             className="w-full border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
//                                                         >
//                                                             <option value="">Select Gender</option>
//                                                             <option value="1">Male</option>
//                                                             <option value="2">Female</option>
//                                                         </select>
//                                                     </div>

//                                                     <div>
//                                                         <Label>Relationship</Label>
//                                                         <select
//                                                             value={nok.relationship}
//                                                             onChange={(e) =>
//                                                                 updateNextOfKin(index, "relationship", e.target.value)
//                                                             }
//                                                             className="w-full border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
//                                                         >
//                                                             <option value="">Select Relationship</option>
//                                                             <option value="1">Spouse</option>
//                                                             <option value="2">Parent</option>
//                                                             <option value="3">Guardian</option>
//                                                             <option value="4">Child</option>
//                                                             <option value="5">Sibling</option>
//                                                             <option value="6">Other</option>
//                                                         </select>
//                                                     </div>

//                                                     <div>
//                                                         <Label>Percentage</Label>
//                                                         <Input
//                                                             type="number"
//                                                             min={0}
//                                                             max={100}
//                                                             value={nok.nominatedPercentage}
//                                                             onChange={(e) => {
//                                                                 const newValue = Number(e.target.value);

//                                                                 // total without current row
//                                                                 const otherTotal = nextOfKins.reduce(
//                                                                     (sum, k, i) =>
//                                                                         i === index ? sum : sum + Number(k.nominatedPercentage || 0),
//                                                                     0
//                                                                 );

//                                                                 if (otherTotal + newValue > 100) {
//                                                                     Swal.fire({
//                                                                         icon: "warning",
//                                                                         title: "Invalid Percentage",
//                                                                         text: `Total percentage cannot exceed 100%. Remaining: ${100 - otherTotal}%`,
//                                                                     });
//                                                                     return;
//                                                                 }

//                                                                 updateNextOfKin(index, "nominatedPercentage", newValue);
//                                                             }}
//                                                         />

//                                                     </div>
//                                                 </div>
//                                             </div>
//                                         ))}

//                                         <Button variant="outline" className="bg-indigo-600 text-white" onClick={addNextOfKin}>
//                                             + Add Next of Kin
//                                         </Button>
//                                     </section>
//                                 )}

//                                 {/* STEP 3 – UPLOADS */}
//                                 {step === 3 && (
//                                     <section>
//                                         <h3 className="text-lg font-semibold mb-3">Uploads</h3>

//                                         <div className="grid grid-cols-2 gap-4">
//                                             <div>
//                                                 <Label>ID Front Image</Label>
//                                                 <Input
//                                                     type="file"
//                                                     accept="image/*"
//                                                     onChange={(e) => handleImageUpload(e, "identityCardFrontSideImageId")}
//                                                 />
//                                                 {customer.identityCardFrontSideImageId && (
//                                                     <p className="text-green-600 text-sm mt-1">Uploaded ✓</p>
//                                                 )}
//                                             </div>

//                                             <div>
//                                                 <Label>ID Back Image</Label>
//                                                 <Input
//                                                     type="file"
//                                                     accept="image/*"
//                                                     onChange={(e) => handleImageUpload(e, "identityCardBackSideImageId")}
//                                                 />
//                                                 {customer.identityCardBackSideImageId && (
//                                                     <p className="text-green-600 text-sm mt-1">Uploaded ✓</p>
//                                                 )}
//                                             </div>

//                                             {/* PASSPORT IMAGE */}
//                                             <div>
//                                                 <Label>Passport Image</Label>
//                                                 <Input
//                                                     type="file"
//                                                     accept="image/*"
//                                                     onChange={(e) => handleImageUpload(e, "passportImageId")}
//                                                 />
//                                                 {customer.passportImageId && (
//                                                     <p className="text-green-600 text-sm mt-1">Uploaded ✓</p>
//                                                 )}
//                                             </div>

//                                             {/* SIGNATURE IMAGE */}
//                                             <div>
//                                                 <Label>Signature Image</Label>
//                                                 <Input
//                                                     type="file"
//                                                     accept="image/*"
//                                                     onChange={(e) => handleImageUpload(e, "signatureImageId")}
//                                                 />
//                                                 {customer.signatureImageId && (
//                                                     <p className="text-green-600 text-sm mt-1">Uploaded ✓</p>
//                                                 )}
//                                             </div>

//                                             {/* REMARKS */}
//                                             <div className="col-span-2">
//                                                 <Label>Remarks</Label>
//                                                 <Input
//                                                     value={customer.remarks}
//                                                     onChange={(e) => update("remarks", e.target.value)}
//                                                     placeholder="Additional notes..."
//                                                 />
//                                             </div>

//                                         </div>
//                                     </section>
//                                 )}

//                                 {/* NAVIGATION BUTTONS */}
//                                 <div className="flex justify-between mt-10">
//                                     {step > 1 ? (
//                                         <Button variant="outline" onClick={back} disabled={loading}>
//                                             Back
//                                         </Button>

//                                     ) : <span></span>}

//                                     {step < 3 ? (
//                                         <Button
//                                             onClick={() => {
//                                                 if (step === 2 && totalNokPercentage > 100) {
//                                                     Swal.fire(
//                                                         "Invalid Allocation",
//                                                         `Next of Kin percentages cannot exceed 100%. Current: ${totalNokPercentage}%`,
//                                                         "error"
//                                                     );
//                                                     return;
//                                                 }
//                                                 next();
//                                             }}
//                                             disabled={loading}
//                                         >
//                                             Next
//                                         </Button>
//                                     ) : (
//                                         <Button onClick={handleSubmit} disabled={loading || idExists}>
//                                             {loading ? "Submitting..." : "Submit"}
//                                         </Button>

//                                     )}
//                                 </div>
//                             </main>

//                         </div>
//                     </motion.div>
//                 </>
//             )}
//         </AnimatePresence>
//     );
// }




import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import Swal from "sweetalert2";
import {
    Select,
    SelectTrigger,
    SelectValue,
    SelectContent,
    SelectItem,
} from "@/components/ui/select";
import { nationalities, banks } from "./Selectdata";

const DRAFTS_KEY = "member_registration_drafts";

// ── LocalStorage helpers ──────────────────────────────────────
const getAllDrafts = () => {
    try {
        return JSON.parse(localStorage.getItem(DRAFTS_KEY)) || [];
    } catch {
        return [];
    }
};

const saveDraftToStorage = (draft) => {
    const drafts = getAllDrafts();
    const index = drafts.findIndex((d) => d.id === draft.id);
    if (index >= 0) {
        drafts[index] = draft;
    } else {
        drafts.push(draft);
    }
    localStorage.setItem(DRAFTS_KEY, JSON.stringify(drafts));
};

const deleteDraftFromStorage = (draftId) => {
    const drafts = getAllDrafts().filter((d) => d.id !== draftId);
    localStorage.setItem(DRAFTS_KEY, JSON.stringify(drafts));
};

const emptyNextOfKin = {
    salutation: "",
    gender: "",
    relationship: "",
    firstName: "",
    lastName: "",
    identityCardType: 1,
    identityCardNumber: "",
    addressAddressLine1: "",
    addressStreet: "",
    addressPostalCode: "",
    addressCity: "",
    addressEmail: "",
    addressMobileLine: "",
    nominatedPercentage: 0,
    remarks: "",
    createdBy: "SYSTEM",
};

export default function MemberRegistrationDrawer({ open, onClose, refresh }) {
    const [branches, setBranches] = useState([]);
    const [stations, setStations] = useState([]);
    const [loading, setLoading] = useState(false);
    const [checkingId, setCheckingId] = useState(false);
    const [idExists, setIdExists] = useState(false);
    const [showNationalityDropdown, setShowNationalityDropdown] = useState(false);
    const [administrativeDivision, setAdministrativeDivision] = useState([]);
    const [errors, setErrors] = useState({
        addressEmail: "",
        addressMobileLine: "",
        personalIdentificationNumber: "",
        individualIdentityCardNumber: "",
    });

    // ── Draft state ──────────────────────────────────────────
    const [allDrafts, setAllDrafts] = useState([]);
    const [activeDraftId, setActiveDraftId] = useState(null);
    const [showDraftPicker, setShowDraftPicker] = useState(false);

    const initialCustomerState = {
        stationId: "",
        branchId: "",
        type: "",
        serialNumber: 0,
        personalIdentificationNumber: "",
        individualType: 1,
        individualFirstName: "",
        individualLastName: "",
        individualIdentityCardType: 1,
        individualIdentityCardNumber: "",
        individualPayrollNumbers: "",
        individualSalutation: 1,
        individualGender: "",
        individualMaritalStatus: "",
        individualNationality: "",
        individualBirthDate: "",
        individualEmploymentDesignation: "",
        individualEmploymentTermsOfService: "",
        individualEmploymentDate: "",
        addressAddressLine1: "",
        addressAddressLine2: "",
        addressStreet: "",
        addressPostalCode: "",
        addressCity: "",
        addressEmail: "",
        addressLandLine: "",
        addressMobileLine: "",
        passportImageId: null,
        signatureImageId: null,
        identityCardFrontSideImageId: null,
        identityCardBackSideImageId: null,
        remarks: "",
        recruitedBy: "SYSTEM",
        recordStatus: 1,
        createdBy: "SYSTEM",
        createdDate: new Date().toISOString().split("T")[0],
        reference1: "",
        bankName: "",
        branchName: "",
        registrationDate: new Date().toISOString().split("T")[0],
    };

    const [customer, setCustomer] = useState(initialCustomerState);
    const [nextOfKins, setNextOfKins] = useState([{ ...emptyNextOfKin }]);
    const [step, setStep] = useState(1);

    const isLoaded = React.useRef(false);

    // ── Nationality / Bank search ────────────────────────────
    const [nationalitySearch, setNationalitySearch] = useState("");
    const [bankSearch, setBankSearch] = useState("");

    const filteredNationalities = nationalities.filter((n) =>
        n.toLowerCase().includes(nationalitySearch.toLowerCase())
    );
    const filteredBanks = banks.filter((b) =>
        b.toLowerCase().includes(bankSearch.toLowerCase())
    );

    const today = new Date().toISOString().split("T")[0];
    const totalNokPercentage = nextOfKins.reduce(
        (sum, k) => sum + Number(k.nominatedPercentage || 0),
        0
    );

    // ── Load draft list when drawer opens ───────────────────
    useEffect(() => {
        if (open) {
            setAllDrafts(getAllDrafts());
        }
    }, [open]);

    // ── Auto-save active draft on every change ───────────────
    useEffect(() => {
        if (!isLoaded.current || !open || !activeDraftId) return;

        const currentDraft = getAllDrafts().find((d) => d.id === activeDraftId);
        const draft = {
            id: activeDraftId,
            label:
                customer.individualFirstName || customer.individualLastName
                    ? `${customer.individualLastName} ${customer.individualFirstName}`.trim()
                    : currentDraft?.label || `Draft ${new Date().toLocaleString()}`,
            savedAt: new Date().toISOString(),
            step,
            customer,
            nextOfKins,
        };

        saveDraftToStorage(draft);
        setAllDrafts(getAllDrafts());
    }, [customer, nextOfKins, step, open]);

    // ── Helpers ──────────────────────────────────────────────
    const update = (key, value) => setCustomer((prev) => ({ ...prev, [key]: value }));

    const updateNextOfKin = (index, key, value) => {
        const updated = [...nextOfKins];
        updated[index][key] = value;
        setNextOfKins(updated);
    };

    const next = () => setStep((s) => s + 1);
    const back = () => setStep((s) => s - 1);

    // ── Draft actions ────────────────────────────────────────

    // Explicitly save current form as a named draft
    const handleSaveAsDraft = () => {
        const hasData =
            customer.individualFirstName ||
            customer.individualLastName ||
            customer.individualIdentityCardNumber;

        if (!hasData) {
            Swal.fire("Nothing to save", "Fill in at least one field first.", "info");
            return;
        }

        const draftId = activeDraftId || `draft_${Date.now()}`;
        const draft = {
            id: draftId,
            label:
                customer.individualLastName || customer.individualFirstName
                    ? `${customer.individualLastName} ${customer.individualFirstName}`.trim()
                    : `Draft ${new Date().toLocaleString()}`,
            savedAt: new Date().toISOString(),
            step,
            customer,
            nextOfKins,
        };

        saveDraftToStorage(draft);
        setActiveDraftId(draftId);
        isLoaded.current = true;
        setAllDrafts(getAllDrafts());

        Swal.fire({
            toast: true,
            position: "top-end",
            icon: "success",
            title: "Draft saved",
            showConfirmButton: false,
            timer: 2000,
        });
    };

    // Load a draft into the form
    const handleLoadDraft = (draft) => {
        setCustomer(draft.customer);
        setNextOfKins(draft.nextOfKins);
        setStep(draft.step || 1);
        setActiveDraftId(draft.id);
        setNationalitySearch(draft.customer.individualNationality || "");
        setBankSearch(draft.customer.bankName || "");
        setShowDraftPicker(false);
        isLoaded.current = true;
    };

    // Start a fresh form without touching existing drafts
    const handleNewForm = () => {
        setCustomer(initialCustomerState);
        setNextOfKins([{ ...emptyNextOfKin }]);
        setStep(1);
        setActiveDraftId(null);
        setNationalitySearch("");
        setBankSearch("");
        setShowDraftPicker(false);
        isLoaded.current = false;
    };

    // Delete one draft from the list
    const handleDeleteDraft = (draftId, e) => {
        e.stopPropagation();
        Swal.fire({
            title: "Delete this draft?",
            icon: "warning",
            showCancelButton: true,
            confirmButtonColor: "#d33",
            cancelButtonColor: "#6366f1",
            confirmButtonText: "Delete",
        }).then((result) => {
            if (result.isConfirmed) {
                deleteDraftFromStorage(draftId);
                const updated = getAllDrafts();
                setAllDrafts(updated);
                if (activeDraftId === draftId) {
                    handleNewForm();
                }
            }
        });
    };

    // Full reset after successful submit
    const clearDraft = () => {
        if (activeDraftId) deleteDraftFromStorage(activeDraftId);
        setAllDrafts(getAllDrafts());
        handleNewForm();
    };

    // ── ID check ─────────────────────────────────────────────
    const checkIfIdExists = async (idNumber) => {
        const trimmedId = idNumber?.trim();
        if (!trimmedId || trimmedId.length < 5) {
            setIdExists(false);
            return;
        }
        setCheckingId(true);
        try {
            const response = await fetch(
                `${import.meta.env.VITE_APP_MEMBERSHIP_URL}/api/customers/search/identity-card?identityCardNumber=${trimmedId}&exactMatch=true`,
            );
            if (response.ok) {
                const data = await response.json();
                const exists = Array.isArray(data?.data) && data.data.length > 0;
                setIdExists(exists);
                setErrors((prev) => ({
                    ...prev,
                    individualIdentityCardNumber: exists
                        ? "This ID number is already registered"
                        : "",
                }));
            }
        } catch (err) {
            console.error("Error checking ID:", err);
        } finally {
            setCheckingId(false);
        }
    };

    // ── Data fetches ─────────────────────────────────────────
    const loadStations = async () => {
        try {
            const res = await fetch(`${import.meta.env.VITE_APP_MEMBERSHIP_URL}/api/stations`);
            const json = await res.json();
            if (json.success) setStations(json.data);
        } catch (err) {
            console.error("Failed to load stations", err);
        }
    };

    const loadAdministrativeDivision = async () => {
        try {
            const res = await fetch(
                `${import.meta.env.VITE_APP_MEMBERSHIP_URL}/api/administrative-divisions`
            );
            const json = await res.json();
            if (json.success) setAdministrativeDivision(json.data);
        } catch (err) {
            console.error("Failed to load administrative divisions", err);
        }
    };

    const fetchBranches = async () => {
        try {
            const res = await fetch(`${import.meta.env.VITE_APP_MEMBERSHIP_URL}/api/branches`);
            const json = await res.json();
            setBranches(json.data || []);
        } catch (err) {
            console.error("Fetch Branches Error:", err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadStations();
        loadAdministrativeDivision();
        fetchBranches();
    }, []);

    // ── Image upload ─────────────────────────────────────────
    const toBase64 = (file) =>
        new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.readAsDataURL(file);
            reader.onload = () => resolve(reader.result.split(",")[1]);
            reader.onerror = reject;
        });

    const handleImageUpload = async (e, key) => {
        const file = e.target.files[0];
        if (!file) return;
        const base64 = await toBase64(file);
        update(key, base64);
    };

    // ── Safe close ───────────────────────────────────────────
    const handleSafeClose = () => {
        const hasData =
            customer.individualFirstName ||
            customer.individualLastName ||
            customer.individualIdentityCardNumber;

        if (hasData && !activeDraftId) {
            Swal.fire({
                title: "Save before closing?",
                text: "You have unsaved data. Save as draft so you can continue later?",
                icon: "warning",
                showDenyButton: true,
                showCancelButton: true,
                confirmButtonColor: "#4f46e5",
                confirmButtonText: "Save Draft & Close",
                denyButtonText: "Close Without Saving",
                cancelButtonText: "Stay",
            }).then((result) => {
                if (result.isConfirmed) {
                    handleSaveAsDraft();
                    onClose();
                } else if (result.isDenied) {
                    onClose();
                }
            });
        } else {
            onClose();
        }
    };

    console.log("Customer state:", { customer, nextOfKins });

    // ── Submit ───────────────────────────────────────────────
    const handleSubmit = async () => {
        if (!customer.individualFirstName || !customer.individualLastName) {
            Swal.fire("Error", "First name and last name are required", "error");
            return;
        }
        if (!customer.individualIdentityCardNumber) {
            Swal.fire("Error", "ID/Passport number is required", "error");
            return;
        }
        if (idExists) {
            Swal.fire("Error", "This ID number is already registered.", "error");
            return;
        }
        if (
            customer.addressEmail &&
            !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(customer.addressEmail)
        ) {
            Swal.fire("Error", "Please enter a valid email address", "error");
            return;
        }
        if (
            customer.addressMobileLine &&
            !/^\+254(7|1)\d{8}$/.test(customer.addressMobileLine)
        ) {
            Swal.fire("Error", "Phone must start with +254 and be 12 digits", "error");
            return;
        }
        if (
            customer.personalIdentificationNumber &&
            !/^[A-Z]\d{9}[A-Z]$/.test(customer.personalIdentificationNumber)
        ) {
            Swal.fire("Error", "KRA PIN must be in format A123456789B", "error");
            return;
        }

        setLoading(true);
        try {
            const response = await fetch(
                `${import.meta.env.VITE_APP_MEMBERSHIP_URL}/api/customers`,
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        "ngrok-skip-browser-warning": "true",
                    },
                    body: JSON.stringify({ customer, nextOfKins }),
                }
            );

            if (!response.ok) throw new Error("Failed to submit");
            const data = await response.json();

            if (data.success) {
                Swal.fire("Success", data.message, "success");
                clearDraft();
                if (refresh) refresh();
                if (onClose) onClose();
            } else {
                Swal.fire("Error", data.message, "error");
            }
        } catch (err) {
            Swal.fire("Error", "Failed to register member", "error");
        } finally {
            setLoading(false);
        }
    };

    // ── Next of Kin helpers ──────────────────────────────────
    const addNextOfKin = () => {
        if (totalNokPercentage >= 100) {
            Swal.fire("Limit reached", "Total nominated percentage is already 100%", "warning");
            return;
        }
        setNextOfKins([...nextOfKins, { ...emptyNextOfKin }]);
    };

    const removeNextOfKin = (index) => {
        if (nextOfKins.length === 1) return;
        setNextOfKins((prev) => prev.filter((_, i) => i !== index));
    };

    // ────────────────────────────────────────────────────────
    // RENDER
    // ────────────────────────────────────────────────────────
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
                        onClick={handleSafeClose}
                    />

                    {/* DRAWER */}
                    <motion.div
                        className="fixed top-3 right-3 w-[85vw] max-w-[1150px] bg-white shadow-2xl z-50 flex flex-col rounded-2xl"
                        initial={{ x: "100%" }}
                        animate={{ x: 0 }}
                        exit={{ x: "100%" }}
                        transition={{ type: "spring", stiffness: 280, damping: 28 }}
                    >
                        {/* HEADER */}
                        <div className="p-4 bg-indigo-700 rounded-2xl m-2">
                            <div className="flex justify-between items-center">
                                <div>
                                    <h2 className="font-bold text-xl text-white">
                                        Member Registration
                                    </h2>
                                    {activeDraftId && (
                                        <p className="text-indigo-200 text-xs mt-0.5">
                                            📝 Editing —{" "}
                                            {allDrafts.find((d) => d.id === activeDraftId)?.label ||
                                                "Draft"}
                                        </p>
                                    )}
                                </div>

                                <div className="flex gap-2 items-center">
                                    {/* Save as Draft button */}
                                    <Button
                                        type="button"
                                        onClick={handleSaveAsDraft}
                                        size="sm"
                                        className="bg-indigo-500 hover:bg-indigo-400 text-white text-xs"
                                    >
                                        Save Draft
                                    </Button>

                                    {/* Drafts picker toggle */}
                                    <button
                                        type="button"
                                        onClick={() => setShowDraftPicker((v) => !v)}
                                        className="relative text-white text-xs bg-indigo-500 hover:bg-indigo-400 px-3 py-1.5 rounded-lg"
                                    >
                                        Drafts
                                        {allDrafts.length > 0 && (
                                            <span className="absolute -top-1.5 -right-1.5 bg-red-500 text-white text-[10px] rounded-full w-4 h-4 flex items-center justify-center">
                                                {allDrafts.length}
                                            </span>
                                        )}
                                    </button>

                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={handleSafeClose}
                                    >
                                        Close
                                    </Button>
                                </div>
                            </div>

                            {/* DRAFT PICKER PANEL */}
                            <AnimatePresence>
                                {showDraftPicker && (
                                    <motion.div
                                        initial={{ opacity: 0, y: -8 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, y: -8 }}
                                        className="mt-3 bg-white rounded-xl p-3 shadow-lg"
                                    >
                                        <div className="flex justify-between items-center mb-2">
                                            <span className="text-indigo-700 font-semibold text-sm">
                                                Saved Drafts
                                            </span>
                                            <button
                                                type="button"
                                                onClick={handleNewForm}
                                                className="text-xs text-indigo-600 hover:underline"
                                            >
                                                + New Form
                                            </button>
                                        </div>

                                        {allDrafts.length === 0 ? (
                                            <p className="text-gray-400 text-xs text-center py-2">
                                                No drafts saved yet
                                            </p>
                                        ) : (
                                            <ul className="space-y-2 max-h-52 overflow-y-auto">
                                                {allDrafts.map((draft) => (
                                                    <li
                                                        key={draft.id}
                                                        onClick={() => handleLoadDraft(draft)}
                                                        className={`flex justify-between items-center p-2 rounded-lg cursor-pointer text-sm hover:bg-indigo-50 ${activeDraftId === draft.id
                                                            ? "bg-indigo-100 border border-indigo-300"
                                                            : "bg-gray-50"
                                                            }`}
                                                    >
                                                        <div>
                                                            <p className="font-medium text-gray-700">
                                                                {draft.label}
                                                            </p>
                                                            <p className="text-gray-400 text-[11px]">
                                                                Step {draft.step || 1} of 3 · Saved{" "}
                                                                {new Date(draft.savedAt).toLocaleString()}
                                                            </p>
                                                        </div>
                                                        <button
                                                            type="button"
                                                            onClick={(e) =>
                                                                handleDeleteDraft(draft.id, e)
                                                            }
                                                            className="text-red-400 hover:text-red-600 text-xs ml-3 shrink-0"
                                                        >
                                                            Delete
                                                        </button>
                                                    </li>
                                                ))}
                                            </ul>
                                        )}
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>

                        <div className="grid grid-cols-12 h-[88vh] overflow-hidden p-3">

                            {/* LEFT STEPS NAVIGATION */}
                            <aside className="col-span-3 bg-gray-200 p-3 rounded-lg">
                                {["Personal Details", "Next of Kin", "Uploads"].map(
                                    (label, index) => (
                                        <Card
                                            key={index}
                                            className={`p-3 mb-2 cursor-pointer border ${step === index + 1
                                                ? "bg-indigo-700 border-indigo-500 text-white"
                                                : "hover:bg-gray-100"
                                                }`}
                                            onClick={() => setStep(index + 1)}
                                        >
                                            <p className="font-medium text-sm">{label}</p>
                                        </Card>
                                    )
                                )}

                                {/* Draft list in sidebar for quick access */}
                                {allDrafts.length > 0 && (
                                    <div className="mt-4">
                                        <p className="text-xs font-semibold text-gray-500 mb-2 px-1">
                                            SAVED DRAFTS
                                        </p>
                                        {allDrafts.map((draft) => (
                                            <div
                                                key={draft.id}
                                                onClick={() => handleLoadDraft(draft)}
                                                className={`p-2 mb-1 rounded-lg cursor-pointer text-xs ${activeDraftId === draft.id
                                                    ? "bg-indigo-200 border border-indigo-400"
                                                    : "bg-white hover:bg-indigo-50"
                                                    }`}
                                            >
                                                <p className="font-medium text-gray-700 truncate">
                                                    {draft.label}
                                                </p>
                                                <p className="text-gray-400 text-[10px]">
                                                    Step {draft.step || 1}/3
                                                </p>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </aside>

                            {/* RIGHT CONTENT */}
                            <main className="col-span-9 p-6 overflow-y-auto">

                                {/* STEP 1 – PERSONAL INFO */}
                                {step === 1 && (
                                    <section>
                                        <h3 className="text-lg font-semibold mb-3 bg-indigo-700 text-white p-3 rounded-2xl">
                                            Personal Information
                                        </h3>

                                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                                            <div>
                                                <Label>Type</Label>
                                                <select
                                                    value={customer.type}
                                                    onChange={(e) => update("type", e.target.value)}
                                                    required
                                                    className="w-full border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                                                >
                                                    <option value="">Select Member Type</option>
                                                    <option value="1">Individual</option>
                                                    <option value="2">Partnership</option>
                                                    <option value="3">Corporation</option>
                                                    <option value="4">MicroCredit</option>
                                                </select>
                                            </div>

                                            <div>
                                                <Label>Surname *</Label>
                                                <Input
                                                    value={customer.individualLastName}
                                                    onChange={(e) =>
                                                        update("individualLastName", e.target.value)
                                                    }
                                                    required
                                                    placeholder="Enter surname"
                                                />
                                            </div>

                                            <div>
                                                <Label>Other Name *</Label>
                                                <Input
                                                    required
                                                    value={customer.individualFirstName}
                                                    onChange={(e) =>
                                                        update("individualFirstName", e.target.value)
                                                    }
                                                    placeholder="Enter other name"
                                                />
                                            </div>

                                            <div>
                                                <Label>ID / Passport Number *</Label>
                                                <div className="relative">
                                                    <Input
                                                        value={customer.individualIdentityCardNumber}
                                                        onChange={(e) => {
                                                            update(
                                                                "individualIdentityCardNumber",
                                                                e.target.value
                                                            );
                                                            setErrors((prev) => ({
                                                                ...prev,
                                                                individualIdentityCardNumber: "",
                                                            }));
                                                            setIdExists(false);
                                                        }}
                                                        onBlur={() => {
                                                            const trimmed =
                                                                customer.individualIdentityCardNumber?.trim();
                                                            update("individualIdentityCardNumber", trimmed);
                                                            if (trimmed && trimmed.length >= 5) {
                                                                checkIfIdExists(trimmed);
                                                            }
                                                        }}
                                                        className={
                                                            errors.individualIdentityCardNumber || idExists
                                                                ? "border-red-500 focus-visible:ring-red-500"
                                                                : ""
                                                        }
                                                        placeholder="Enter ID/Passport number"
                                                        required
                                                    />
                                                    {checkingId && (
                                                        <div className="absolute right-2 top-2">
                                                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-900"></div>
                                                        </div>
                                                    )}
                                                </div>
                                                {idExists && (
                                                    <p className="text-sm text-red-500 mt-1">
                                                        This ID number is already registered
                                                    </p>
                                                )}
                                                {errors.individualIdentityCardNumber && !idExists && (
                                                    <p className="text-sm text-red-500 mt-1">
                                                        {errors.individualIdentityCardNumber}
                                                    </p>
                                                )}
                                            </div>

                                            <div>
                                                <Label>Date of Birth</Label>
                                                <Input
                                                    type="date"
                                                    value={customer.individualBirthDate}
                                                    onChange={(e) =>
                                                        update("individualBirthDate", e.target.value)
                                                    }
                                                    max={today}
                                                />
                                            </div>

                                            <div>
                                                <Label>Mobile</Label>
                                                <Input
                                                    placeholder="+2547XXXXXXXX"
                                                    value={customer.addressMobileLine}
                                                    onChange={(e) => {
                                                        update("addressMobileLine", e.target.value);
                                                        setErrors((prev) => ({
                                                            ...prev,
                                                            addressMobileLine: "",
                                                        }));
                                                    }}
                                                    onBlur={() => {
                                                        if (
                                                            customer.addressMobileLine &&
                                                            !/^\+254(7|1)\d{8}$/.test(
                                                                customer.addressMobileLine
                                                            )
                                                        ) {
                                                            setErrors((prev) => ({
                                                                ...prev,
                                                                addressMobileLine:
                                                                    "Phone must start with +254 and be 12 digits",
                                                            }));
                                                        }
                                                    }}
                                                    className={
                                                        errors.addressMobileLine
                                                            ? "border-red-500 focus-visible:ring-red-500"
                                                            : ""
                                                    }
                                                />
                                                {errors.addressMobileLine && (
                                                    <p className="text-sm text-red-500 mt-1">
                                                        {errors.addressMobileLine}
                                                    </p>
                                                )}
                                            </div>

                                            <div>
                                                <Label>Landline</Label>
                                                <Input
                                                    value={customer.addressLandLine}
                                                    onChange={(e) =>
                                                        update("addressLandLine", e.target.value)
                                                    }
                                                    placeholder="0201234567"
                                                />
                                            </div>

                                            <div>
                                                <Label>Email</Label>
                                                <Input
                                                    type="email"
                                                    value={customer.addressEmail}
                                                    onChange={(e) => {
                                                        update("addressEmail", e.target.value);
                                                        setErrors((prev) => ({
                                                            ...prev,
                                                            addressEmail: "",
                                                        }));
                                                    }}
                                                    onBlur={() => {
                                                        if (
                                                            customer.addressEmail &&
                                                            !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(
                                                                customer.addressEmail
                                                            )
                                                        ) {
                                                            setErrors((prev) => ({
                                                                ...prev,
                                                                addressEmail: "Enter a valid email address",
                                                            }));
                                                        }
                                                    }}
                                                    className={
                                                        errors.addressEmail
                                                            ? "border-red-500 focus-visible:ring-red-500"
                                                            : ""
                                                    }
                                                    placeholder="email@example.com"
                                                />
                                                {errors.addressEmail && (
                                                    <p className="text-sm text-red-500 mt-1">
                                                        {errors.addressEmail}
                                                    </p>
                                                )}
                                            </div>

                                            <div>
                                                <Label>Marital Status</Label>
                                                <select
                                                    value={customer.individualMaritalStatus}
                                                    onChange={(e) =>
                                                        update("individualMaritalStatus", e.target.value)
                                                    }
                                                    className="w-full border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                                                >
                                                    <option value="">Select Marital Status</option>
                                                    <option value="1">Single</option>
                                                    <option value="2">Married</option>
                                                    <option value="3">Divorced</option>
                                                    <option value="4">Widowed</option>
                                                    <option value="5">Separated</option>
                                                </select>
                                            </div>

                                            <div>
                                                <Label>KRA PIN (Optional)</Label>
                                                <Input
                                                    placeholder="A123456789B"
                                                    value={customer.personalIdentificationNumber}
                                                    onChange={(e) => {
                                                        update(
                                                            "personalIdentificationNumber",
                                                            e.target.value.toUpperCase()
                                                        );
                                                        setErrors((prev) => ({
                                                            ...prev,
                                                            personalIdentificationNumber: "",
                                                        }));
                                                    }}
                                                    onBlur={() => {
                                                        if (
                                                            customer.personalIdentificationNumber &&
                                                            !/^[A-Z]\d{9}[A-Z]$/.test(
                                                                customer.personalIdentificationNumber
                                                            )
                                                        ) {
                                                            setErrors((prev) => ({
                                                                ...prev,
                                                                personalIdentificationNumber:
                                                                    "KRA PIN must be in format A123456789B",
                                                            }));
                                                        }
                                                    }}
                                                    className={
                                                        errors.personalIdentificationNumber
                                                            ? "border-red-500 focus-visible:ring-red-500"
                                                            : ""
                                                    }
                                                />
                                                {errors.personalIdentificationNumber && (
                                                    <p className="text-sm text-red-500 mt-1">
                                                        {errors.personalIdentificationNumber}
                                                    </p>
                                                )}
                                            </div>

                                            <div>
                                                <Label>Gender</Label>
                                                <select
                                                    value={customer.individualGender}
                                                    onChange={(e) =>
                                                        update("individualGender", e.target.value)
                                                    }
                                                    className="w-full border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                                                >
                                                    <option value="">Select gender</option>
                                                    <option value="1">Male</option>
                                                    <option value="2">Female</option>
                                                </select>
                                            </div>

                                            <div>
                                                <Label>City</Label>
                                                <Input
                                                    value={customer.addressCity}
                                                    onChange={(e) =>
                                                        update("addressCity", e.target.value)
                                                    }
                                                    placeholder="Enter city"
                                                />
                                            </div>

                                            <div>
                                                <Label>Postal Code</Label>
                                                <Input
                                                    value={customer.addressPostalCode}
                                                    onChange={(e) =>
                                                        update("addressPostalCode", e.target.value)
                                                    }
                                                    placeholder="00100"
                                                />
                                            </div>

                                            <div>
                                                <Label>Place Of Birth</Label>
                                                <Input
                                                    value={customer.addressStreet}
                                                    onChange={(e) =>
                                                        update("addressStreet", e.target.value)
                                                    }
                                                    placeholder="Enter place of birth"
                                                />
                                            </div>

                                            <div>
                                                <Label>Nationality</Label>
                                                <div className="relative">
                                                    <Input
                                                        type="text"
                                                        value={nationalitySearch}
                                                        onChange={(e) => {
                                                            const value = e.target.value;
                                                            setNationalitySearch(value);
                                                            setShowNationalityDropdown(true);
                                                            if (value !== customer.individualNationality) {
                                                                update("individualNationality", "");
                                                            }
                                                        }}
                                                        onFocus={() => {
                                                            setShowNationalityDropdown(true);
                                                            setNationalitySearch(
                                                                customer.individualNationality || ""
                                                            );
                                                        }}
                                                        onBlur={() => {
                                                            setTimeout(
                                                                () => setShowNationalityDropdown(false),
                                                                150
                                                            );
                                                        }}
                                                        placeholder="Search nationality..."
                                                        className="w-full border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                                                    />
                                                    {showNationalityDropdown &&
                                                        nationalitySearch &&
                                                        filteredNationalities.length > 0 && (
                                                            <div className="absolute z-10 w-full bg-white border border-gray-300 rounded-md shadow-lg max-h-48 overflow-y-auto mt-1">
                                                                {filteredNationalities.map((nationality) => (
                                                                    <div
                                                                        key={nationality}
                                                                        className="px-3 py-2 hover:bg-gray-100 cursor-pointer"
                                                                        onMouseDown={() => {
                                                                            update(
                                                                                "individualNationality",
                                                                                nationality
                                                                            );
                                                                            setNationalitySearch(nationality);
                                                                            setShowNationalityDropdown(false);
                                                                        }}
                                                                    >
                                                                        {nationality}
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        )}
                                                    {customer.individualNationality && (
                                                        <p className="text-xs text-gray-500 mt-1">
                                                            Selected: {customer.individualNationality}
                                                        </p>
                                                    )}
                                                </div>
                                            </div>

                                            <div>
                                                <Label>Payroll Number</Label>
                                                <Input
                                                    value={customer.individualPayrollNumbers}
                                                    onChange={(e) =>
                                                        update("individualPayrollNumbers", e.target.value)
                                                    }
                                                    placeholder="Enter payroll number"
                                                />
                                            </div>

                                            <div>
                                                <Label>Branch</Label>
                                                <Select
                                                    onValueChange={(value) => update("branchId", value)}
                                                    value={customer.branchId}
                                                >
                                                    <SelectTrigger>
                                                        <SelectValue placeholder="Select branch" />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        {branches.map((b) => (
                                                            <SelectItem key={b.Id} value={b.Id}>
                                                                {b.Description}
                                                            </SelectItem>
                                                        ))}
                                                    </SelectContent>
                                                </Select>
                                            </div>

                                            <div>
                                                <Label>Station</Label>
                                                <Select
                                                    onValueChange={(value) => update("stationId", value)}
                                                    value={customer.stationId}
                                                >
                                                    <SelectTrigger>
                                                        <SelectValue placeholder="Select station" />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        {stations.map((s) => (
                                                            <SelectItem key={s.Id} value={s.Id}>
                                                                {s.Description}
                                                            </SelectItem>
                                                        ))}
                                                    </SelectContent>
                                                </Select>
                                            </div>

                                            <div>
                                                <Label>Designation</Label>
                                                <Input
                                                    value={customer.individualEmploymentDesignation}
                                                    onChange={(e) =>
                                                        update(
                                                            "individualEmploymentDesignation",
                                                            e.target.value
                                                        )
                                                    }
                                                    placeholder="Enter designation"
                                                />
                                            </div>

                                            <div>
                                                <Label>Terms of Service</Label>
                                                <select
                                                    value={customer.individualEmploymentTermsOfService}
                                                    onChange={(e) =>
                                                        update(
                                                            "individualEmploymentTermsOfService",
                                                            e.target.value
                                                        )
                                                    }
                                                    className="w-full border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                                                >
                                                    <option value="">Select Terms of Service</option>
                                                    <option value="1">Permanent</option>
                                                    <option value="2">Contract</option>
                                                    <option value="3">Casual</option>
                                                    <option value="4">Self-Employed</option>
                                                    <option value="5">Unemployed</option>
                                                </select>
                                            </div>

                                            <div>
                                                <Label>Registration Date</Label>
                                                <Input
                                                    type="date"
                                                    value={customer.registrationDate}
                                                    onChange={(e) =>
                                                        update("registrationDate", e.target.value)
                                                    }
                                                    max={today}
                                                />
                                                <p className="text-xs text-gray-500 mt-1">
                                                    Cannot select future dates
                                                </p>
                                            </div>

                                            <div>
                                                <Label>Bank Account Number</Label>
                                                <Input
                                                    value={customer.reference1}
                                                    onChange={(e) =>
                                                        update("reference1", e.target.value)
                                                    }
                                                    placeholder="Enter bank account number"
                                                />
                                            </div>

                                            <div>
                                                <Label>Bank Name</Label>
                                                <div className="relative">
                                                    <Input
                                                        type="text"
                                                        value={bankSearch}
                                                        onChange={(e) => {
                                                            const value = e.target.value;
                                                            setBankSearch(value);
                                                            if (value !== customer.bankName) {
                                                                update("bankName", "");
                                                            }
                                                        }}
                                                        onFocus={() => {
                                                            setBankSearch(customer.bankName || "");
                                                        }}
                                                        placeholder="Search bank..."
                                                        className="w-full border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                                                    />
                                                    {bankSearch && filteredBanks.length > 0 && (
                                                        <div className="absolute z-10 w-full bg-white border border-gray-300 rounded-md shadow-lg max-h-48 overflow-y-auto mt-1">
                                                            {filteredBanks.map((bank) => (
                                                                <div
                                                                    key={bank}
                                                                    className="px-3 py-2 hover:bg-gray-100 cursor-pointer"
                                                                    onClick={() => {
                                                                        update("bankName", bank);
                                                                        setBankSearch(bank);
                                                                    }}
                                                                >
                                                                    {bank}
                                                                </div>
                                                            ))}
                                                        </div>
                                                    )}
                                                    {customer.bankName && (
                                                        <p className="text-xs text-gray-500 mt-1">
                                                            Selected: {customer.bankName}
                                                        </p>
                                                    )}
                                                </div>
                                            </div>

                                            <div>
                                                <Label>Branch Name</Label>
                                                <Input
                                                    value={customer.branchName}
                                                    onChange={(e) =>
                                                        update("branchName", e.target.value)
                                                    }
                                                    placeholder="Enter branch name"
                                                />
                                            </div>
                                        </div>
                                    </section>
                                )}

                                {/* STEP 2 – NEXT OF KIN */}
                                {step === 2 && (
                                    <section>
                                        <h3 className="text-lg font-semibold mb-2 bg-indigo-700 text-white p-3 rounded-2xl">
                                            Next of Kin
                                        </h3>
                                        <div className="flex justify-end items-center p-2">
                                            <p
                                                className={`mt-4 font-semibold ${totalNokPercentage === 100
                                                    ? "text-green-600"
                                                    : "text-red-600"
                                                    }`}
                                            >
                                                Total Allocation: {totalNokPercentage}% / 100%
                                            </p>
                                        </div>

                                        {nextOfKins.map((nok, index) => (
                                            <div key={index} className="mb-6 p-4 border rounded-lg">
                                                {nextOfKins.length > 1 && (
                                                    <div className="flex justify-between items-center bg-gray-200 rounded-md p-2 px-4 mb-3">
                                                        <h3 className="font-medium">
                                                            Next of Kin {index + 1}
                                                        </h3>
                                                        <Button
                                                            onClick={() => removeNextOfKin(index)}
                                                            className="text-sm bg-red-600 hover:bg-red-800 text-red-100"
                                                        >
                                                            Remove
                                                        </Button>
                                                    </div>
                                                )}
                                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                                                    <div>
                                                        <Label>First Name</Label>
                                                        <Input
                                                            value={nok.firstName}
                                                            onChange={(e) =>
                                                                updateNextOfKin(
                                                                    index,
                                                                    "firstName",
                                                                    e.target.value
                                                                )
                                                            }
                                                        />
                                                    </div>
                                                    <div>
                                                        <Label>Last Name</Label>
                                                        <Input
                                                            value={nok.lastName}
                                                            onChange={(e) =>
                                                                updateNextOfKin(
                                                                    index,
                                                                    "lastName",
                                                                    e.target.value
                                                                )
                                                            }
                                                        />
                                                    </div>
                                                    <div>
                                                        <Label>Gender</Label>
                                                        <select
                                                            value={nok.gender}
                                                            onChange={(e) =>
                                                                updateNextOfKin(
                                                                    index,
                                                                    "gender",
                                                                    e.target.value
                                                                )
                                                            }
                                                            className="w-full border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                                                        >
                                                            <option value="">Select Gender</option>
                                                            <option value="1">Male</option>
                                                            <option value="2">Female</option>
                                                        </select>
                                                    </div>
                                                    <div>
                                                        <Label>Relationship</Label>
                                                        <select
                                                            value={nok.relationship}
                                                            onChange={(e) =>
                                                                updateNextOfKin(
                                                                    index,
                                                                    "relationship",
                                                                    e.target.value
                                                                )
                                                            }
                                                            className="w-full border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                                                        >
                                                            <option value="">Select Relationship</option>
                                                            <option value="1">Spouse</option>
                                                            <option value="2">Parent</option>
                                                            <option value="3">Guardian</option>
                                                            <option value="4">Child</option>
                                                            <option value="5">Sibling</option>
                                                            <option value="6">Other</option>
                                                        </select>
                                                    </div>
                                                    <div>
                                                        <Label>Percentage</Label>
                                                        <Input
                                                            type="number"
                                                            min={0}
                                                            max={100}
                                                            value={nok.nominatedPercentage}
                                                            onChange={(e) => {
                                                                const newValue = Number(e.target.value);
                                                                const otherTotal = nextOfKins.reduce(
                                                                    (sum, k, i) =>
                                                                        i === index
                                                                            ? sum
                                                                            : sum +
                                                                            Number(k.nominatedPercentage || 0),
                                                                    0
                                                                );
                                                                if (otherTotal + newValue > 100) {
                                                                    Swal.fire({
                                                                        icon: "warning",
                                                                        title: "Invalid Percentage",
                                                                        text: `Total cannot exceed 100%. Remaining: ${100 - otherTotal
                                                                            }%`,
                                                                    });
                                                                    return;
                                                                }
                                                                updateNextOfKin(
                                                                    index,
                                                                    "nominatedPercentage",
                                                                    newValue
                                                                );
                                                            }}
                                                        />
                                                    </div>
                                                </div>
                                            </div>
                                        ))}

                                        <Button
                                            variant="outline"
                                            className="bg-indigo-600 text-white"
                                            onClick={addNextOfKin}
                                        >
                                            + Add Next of Kin
                                        </Button>
                                    </section>
                                )}

                                {/* STEP 3 – UPLOADS */}
                                {step === 3 && (
                                    <section>
                                        <h3 className="text-lg font-semibold mb-3">Uploads</h3>
                                        <div className="grid grid-cols-2 gap-4">
                                            <div>
                                                <Label>ID Front Image</Label>
                                                <Input
                                                    type="file"
                                                    accept="image/*"
                                                    onChange={(e) =>
                                                        handleImageUpload(
                                                            e,
                                                            "identityCardFrontSideImageId"
                                                        )
                                                    }
                                                />
                                                {customer.identityCardFrontSideImageId && (
                                                    <p className="text-green-600 text-sm mt-1">
                                                        Uploaded ✓
                                                    </p>
                                                )}
                                            </div>
                                            <div>
                                                <Label>ID Back Image</Label>
                                                <Input
                                                    type="file"
                                                    accept="image/*"
                                                    onChange={(e) =>
                                                        handleImageUpload(
                                                            e,
                                                            "identityCardBackSideImageId"
                                                        )
                                                    }
                                                />
                                                {customer.identityCardBackSideImageId && (
                                                    <p className="text-green-600 text-sm mt-1">
                                                        Uploaded ✓
                                                    </p>
                                                )}
                                            </div>
                                            <div>
                                                <Label>Passport Image</Label>
                                                <Input
                                                    type="file"
                                                    accept="image/*"
                                                    onChange={(e) =>
                                                        handleImageUpload(e, "passportImageId")
                                                    }
                                                />
                                                {customer.passportImageId && (
                                                    <p className="text-green-600 text-sm mt-1">
                                                        Uploaded ✓
                                                    </p>
                                                )}
                                            </div>
                                            <div>
                                                <Label>Signature Image</Label>
                                                <Input
                                                    type="file"
                                                    accept="image/*"
                                                    onChange={(e) =>
                                                        handleImageUpload(e, "signatureImageId")
                                                    }
                                                />
                                                {customer.signatureImageId && (
                                                    <p className="text-green-600 text-sm mt-1">
                                                        Uploaded ✓
                                                    </p>
                                                )}
                                            </div>
                                            <div className="col-span-2">
                                                <Label>Remarks</Label>
                                                <Input
                                                    value={customer.remarks}
                                                    onChange={(e) => update("remarks", e.target.value)}
                                                    placeholder="Additional notes..."
                                                />
                                            </div>
                                        </div>
                                    </section>
                                )}

                                {/* NAVIGATION */}
                                <div className="flex justify-between mt-10">
                                    {step > 1 ? (
                                        <Button
                                            variant="outline"
                                            onClick={back}
                                            disabled={loading}
                                        >
                                            Back
                                        </Button>
                                    ) : (
                                        <span />
                                    )}

                                    {step < 3 ? (
                                        <Button
                                            onClick={() => {
                                                if (step === 2 && totalNokPercentage > 100) {
                                                    Swal.fire(
                                                        "Invalid Allocation",
                                                        `Next of Kin percentages cannot exceed 100%. Current: ${totalNokPercentage}%`,
                                                        "error"
                                                    );
                                                    return;
                                                }
                                                next();
                                            }}
                                            disabled={loading}
                                        >
                                            Next
                                        </Button>
                                    ) : (
                                        <Button
                                            onClick={handleSubmit}
                                            disabled={loading || idExists}
                                        >
                                            {loading ? "Submitting..." : "Submit"}
                                        </Button>
                                    )}
                                </div>
                            </main>
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
}