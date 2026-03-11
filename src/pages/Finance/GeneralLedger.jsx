// src/pages/GeneralLedger.jsx
import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { FiArrowUpCircle, FiArrowDownCircle, FiDollarSign, FiSearch } from "react-icons/fi";

export default function GeneralLedger() {
  const [search, setSearch] = useState("");

  // Dummy ledger entries
  const ledger = [
    { id: 1, date: "2025-08-01", account: "Cash", debit: 5000, credit: 0, balance: 5000 },
    { id: 2, date: "2025-08-02", account: "Accounts Payable", debit: 0, credit: 2000, balance: 3000 },
    { id: 3, date: "2025-08-05", account: "Sales Revenue", debit: 0, credit: 3500, balance: 6500 },
    { id: 4, date: "2025-08-07", account: "Office Supplies", debit: 1500, credit: 0, balance: 5000 },
  ];

  const filteredLedger = ledger.filter((entry) =>
    entry.account.toLowerCase().includes(search.toLowerCase())
  );

  const totalDebit = ledger.reduce((sum, e) => sum + e.debit, 0);
  const totalCredit = ledger.reduce((sum, e) => sum + e.credit, 0);
  const netBalance = totalDebit - totalCredit;

  return (
    <div className="p-6 space-y-6 bg-white rounded-2xl shadow-2xl">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight">General Ledger</h1>
        <Button className="rounded-2xl shadow">+ New Entry</Button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="rounded-2xl shadow-md border border-gray-100">
          <CardContent className="p-6 flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Total Debit</p>
              <h2 className="text-xl font-bold text-green-600">
                {totalDebit.toLocaleString()}
              </h2>
            </div>
            <FiArrowUpCircle className="text-green-500 w-8 h-8" />
          </CardContent>
        </Card>

        <Card className="rounded-2xl shadow-md border border-gray-100">
          <CardContent className="p-6 flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Total Credit</p>
              <h2 className="text-xl font-bold text-red-600">
                {totalCredit.toLocaleString()}
              </h2>
            </div>
            <FiArrowDownCircle className="text-red-500 w-8 h-8" />
          </CardContent>
        </Card>

        <Card className="rounded-2xl shadow-md border border-gray-100">
          <CardContent className="p-6 flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Net Balance</p>
              <h2 className="text-xl font-bold text-indigo-600">
                {netBalance.toLocaleString()}
              </h2>
            </div>
            <FiDollarSign className="text-indigo-500 w-8 h-8" />
          </CardContent>
        </Card>
      </div>

      {/* Search */}
      <div className="flex items-center gap-2 max-w-sm">
        <FiSearch className="w-5 h-5 text-gray-500" />
        <Input
          placeholder="Search account..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {/* Ledger Table */}
      <Card className="shadow-md rounded-2xl">
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Account</TableHead>
                <TableHead className="text-right">Debit</TableHead>
                <TableHead className="text-right">Credit</TableHead>
                <TableHead className="text-right">Balance</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredLedger.map((entry) => (
                <TableRow key={entry.id} className="hover:bg-gray-50 transition">
                  <TableCell>{entry.date}</TableCell>
                  <TableCell className="font-medium">{entry.account}</TableCell>
                  <TableCell className="text-right text-green-600 flex items-center justify-end gap-1">
                    {entry.debit > 0 && <FiArrowUpCircle className="w-4 h-4" />}
                    {entry.debit > 0 ? entry.debit.toLocaleString() : "-"}
                  </TableCell>
                  <TableCell className="text-right text-red-600 flex items-center justify-end gap-1">
                    {entry.credit > 0 && <FiArrowDownCircle className="w-4 h-4" />}
                    {entry.credit > 0 ? entry.credit.toLocaleString() : "-"}
                  </TableCell>
                  <TableCell className="text-right font-semibold">
                    {entry.balance.toLocaleString()}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}













