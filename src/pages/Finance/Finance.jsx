

import React from "react"
import { motion } from "framer-motion"
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Progress } from "@/components/ui/progress"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  Download,
  Upload,
  Search,
  TrendingUp,
  TrendingDown,
  Banknote,
  Wallet,
  Recycle,
  Layers,
  Landmark,
  ReceiptText,
  Clock,
  CheckCircle2,
} from "lucide-react"
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts"

const incomeData = [
  { name: "M", value: 12 },
  { name: "T", value: 18 },
  { name: "W", value: 10 },
  { name: "T", value: 22 },
  { name: "F", value: 14 },
  { name: "S", value: 26 },
  { name: "S", value: 20 },
]

const ledgerRows = [
  { date: "2025-09-01", doc: "JV-1023", account: "4001 · Sales – Retail", debit: 0, credit: 54000, cc: "Nairobi" },
  { date: "2025-09-01", doc: "BP-8802", account: "5002 · COGS", debit: 32000, credit: 0, cc: "Mombasa" },
  { date: "2025-09-02", doc: "RV-3310", account: "1100 · Accounts Receivable", debit: 0, credit: 18000, cc: "Kisumu" },
  { date: "2025-09-03", doc: "JV-1024", account: "7001 · Marketing Expense", debit: 2500, credit: 0, cc: "Digital" },
]

const costCenters = [
  { name: "Head Office", spend: 72 },
  { name: "Retail Stores", spend: 58 },
  { name: "Logistics", spend: 34 },
  { name: "R&D", spend: 49 },
]

const banks = [
  { name: "Equity Bank", number: "***1029", balance: 1254300.23 },
  { name: "KCB", number: "***7761", balance: 842300.0 },
  { name: "Co-operative", number: "***5539", balance: 303420.5 },
]

const reconciles = [
  { bank: "Equity Bank", period: "Aug 2025", status: 88 },
  { bank: "KCB", period: "Aug 2025", status: 64 },
  { bank: "Co-operative", period: "Aug 2025", status: 97 },
]

export default function Finance() {
  return (
    <div className="min-h-screen m-1 p-1 md:p-3">
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="mx-auto max-w-7xl"
      >
        {/* Top bar */}
        <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between bg-indigo-700 p-4 rounded-xl">
          <div>
            <h1 className="text-2xl font-semibold tracking-tigh text-white">Finance Dashboard</h1>
            <p className="text-sm text-white">General Ledger · Cost Centers · Banks · Reconciliations</p>
          </div>
          
        </div>

        {/* Grid */}
        <div className="grid gap-6 lg:grid-cols-3">
          {/* LEFT COLUMN */}
          <div className="lg:col-span-2 space-y-6">
            {/* Income / KPI card */}
            <Card className="shadow-sm">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <div>
                  <CardTitle className="text-lg">Income Tracker</CardTitle>
                  <CardDescription>Track weekly inflows vs last week</CardDescription>
                </div>
                <Tabs defaultValue="week" className="w-auto">
                  <TabsList>
                    <TabsTrigger value="week">Week</TabsTrigger>
                    <TabsTrigger value="month">Month</TabsTrigger>
                    <TabsTrigger value="quarter">Quarter</TabsTrigger>
                  </TabsList>
                </Tabs>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 md:grid-cols-4">
                  <KPI label="Revenue" value="KES 2.65M" trend="up" delta="+12%" icon={<TrendingUp className="h-4 w-4"/>}/>
                  <KPI label="Expenses" value="KES 1.38M" trend="down" delta="-3%" icon={<TrendingDown className="h-4 w-4"/>}/>
                  <KPI label="Gross Margin" value="48%" trend="up" delta="+2.1%" icon={<Layers className="h-4 w-4"/>}/>
                  <KPI label="Cash on Hand" value="KES 2.1M" trend="up" delta="+5%" icon={<Wallet className="h-4 w-4"/>}/>
                </div>

                <div className="mt-6 h-48 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={incomeData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                      <defs>
                        <linearGradient id="income" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#4f46e5" stopOpacity={0.35}/>
                          <stop offset="95%" stopColor="#4f46e5" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <XAxis dataKey="name" tickLine={false} axisLine={false} />
                      <YAxis tickLine={false} axisLine={false} />
                      <Tooltip contentStyle={{ borderRadius: 12 }} />
                      <Area type="monotone" dataKey="value" stroke="#4f46e5" fill="url(#income)" strokeWidth={2} />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            {/* General Ledger */}
            <Card className="shadow-sm">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-lg">General Ledger</CardTitle>
                    <CardDescription>Latest journal activity</CardDescription>
                  </div>
                  <div className="flex items-center gap-2">
                    <Select defaultValue="all">
                      <SelectTrigger className="w-[160px]"><SelectValue placeholder="Cost Center"/></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Centers</SelectItem>
                        {costCenters.map((c) => (
                          <SelectItem key={c.name} value={c.name}>{c.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Button variant="outline" size="sm" className="gap-2"><ReceiptText className="h-4 w-4"/>Post Entry</Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Document</TableHead>
                      <TableHead>Account</TableHead>
                      <TableHead className="text-right">Debit</TableHead>
                      <TableHead className="text-right">Credit</TableHead>
                      <TableHead>Cost Center</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {ledgerRows.map((r, i) => (
                      <TableRow key={i} className="hover:bg-muted/40">
                        <TableCell className="whitespace-nowrap">{r.date}</TableCell>
                        <TableCell>{r.doc}</TableCell>
                        <TableCell className="max-w-[260px] truncate">{r.account}</TableCell>
                        <TableCell className="text-right">{r.debit ? r.debit.toLocaleString() : "—"}</TableCell>
                        <TableCell className="text-right">{r.credit ? r.credit.toLocaleString() : "—"}</TableCell>
                        <TableCell>
                          <Badge variant="secondary">{r.cc}</Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
              <CardFooter className="justify-between">
                <p className="text-xs text-muted-foreground">Showing {ledgerRows.length} of 4 recent entries</p>
                <Button size="sm" variant="ghost">View all</Button>
              </CardFooter>
            </Card>

            {/* Cost Centers */}
            <Card className="shadow-sm">
              <CardHeader>
                <CardTitle className="text-lg">Cost Centers</CardTitle>
                <CardDescription>Budget consumption this month</CardDescription>
              </CardHeader>
              <CardContent className="grid gap-4 md:grid-cols-2">
                {costCenters.map((c) => (
                  <div key={c.name} className="rounded-2xl border bg-background p-4">
                    <div className="mb-3 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Layers className="h-4 w-4"/>
                        <span className="font-medium">{c.name}</span>
                      </div>
                      <span className="text-sm tabular-nums">{c.spend}%</span>
                    </div>
                    <Progress value={c.spend} className="h-2" />
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>

          {/* RIGHT COLUMN */}
          <div className="space-y-6">
            {/* Banks */}
            <Card className="shadow-sm bg-indigo-600">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-lg text-white">Banks</CardTitle>
                    <CardDescription className="text-white">Cash & equivalents</CardDescription>
                  </div>
                  <Button variant="outline" size="sm" className="gap-2"><Landmark className="h-4 w-4"/>View More</Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                {banks.map((b) => (
                  <div key={b.name} className="flex items-center justify-between rounded-xl border p-3 bg-white">
                    <div className="flex items-center gap-3 ">
                      <div className="grid h-10 w-10 place-items-center rounded-xl bg-primary/10">
                        <Banknote className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <div className="font-medium">{b.name}</div>
                        <div className="text-xs text-muted-foreground">{b.number}</div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-semibold tabular-nums">KES {b.balance.toLocaleString()}</div>
                      <div className="text-xs text-muted-foreground">Available</div>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Bank Reconciliation */}
            <Card className="shadow-sm bg-indigo-600">
              <CardHeader>
                <CardTitle className="text-lg text-white">Bank Reconciliation</CardTitle>
                <CardDescription className="text-white">Match statements & ledger</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {reconciles.map((r) => (
                  <div key={r.bank} className="rounded-2xl border p-4 bg-white">
                    <div className="mb-2 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Recycle className="h-4 w-4"/>
                        <span className="font-medium">{r.bank}</span>
                      </div>
                      <Badge variant="secondary">{r.period}</Badge>
                    </div>
                    <Progress value={r.status} className="h-2"/>
                    <div className="mt-2 flex items-center justify-between text-xs text-muted-foreground">
                      <span>{r.status}% reconciled</span>
                      {r.status >= 95 ? (
                        <span className="inline-flex items-center gap-1 text-emerald-600"><CheckCircle2 className="h-3.5 w-3.5"/>Ready to close</span>
                      ) : (
                        <span className="inline-flex items-center gap-1"><Clock className="h-3.5 w-3.5"/>In progress</span>
                      )}
                    </div>
                  </div>
                ))}
              </CardContent>
              <CardFooter className="justify-end">
                <Button size="sm" className="gap-2"><Upload className="h-4 w-4"/>Import Statement</Button>
              </CardFooter>
            </Card>

            {/* Team / Contacts */}
            <Card className="shadow-sm">
              <CardHeader className="pb-2">
                <CardTitle className="text-lg">Finance Contacts</CardTitle>
                <CardDescription>Reach out quickly</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <Contact name="Remy Gikone" role="Chief Accountant" tag="Online" />
                <Contact name="Gloria Soicher" role="AP Specialist" tag="Away" />
                <Contact name="Peter Oduor" role="Treasury" tag="Online" />
              </CardContent>
            </Card>

            {/* Proposals / Invoices widget */}
            <Card className="shadow-sm">
              <CardHeader>
                <CardTitle className="text-lg">Invoices Snapshot</CardTitle>
                <CardDescription>Current cycle</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-3 gap-3">
                  <MiniStat label="Issued" value={64} />
                  <MiniStat label="Overdue" value={12} />
                  <MiniStat label="Due Today" value={10} />
                </div>
                <div className="mt-4 h-3 rounded-full bg-muted">
                  <div className="h-3 rounded-full bg-primary" style={{ width: "64%" }} />
                </div>
                <div className="mt-2 flex justify-between text-xs text-muted-foreground">
                  <span>0</span>
                  <span>64</span>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </motion.div>
    </div>
  )
}

function KPI({ label, value, trend, delta, icon }) {
  return (
    <div className="flex items-center justify-between rounded-2xl border p-4">
      <div>
        <div className="text-sm text-muted-foreground">{label}</div>
        <div className="text-lg font-semibold">{value}</div>
      </div>
      <div className="text-right">
        <div className={`text-xs ${trend === "up" ? "text-emerald-600" : "text-rose-600"}`}>{delta}</div>
        <div className="mt-1 grid h-9 w-9 place-items-center rounded-xl bg-muted">{icon}</div>
      </div>
    </div>
  )
}

function Contact({ name, role, tag }) {
  const tagColor = tag === "Online" ? "bg-emerald-500" : tag === "Away" ? "bg-amber-500" : "bg-muted-foreground"
  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-3">
        <Avatar className="h-9 w-9">
          <AvatarImage src={"https://i.pravatar.cc/100?img=" + name.length} alt={name}/>
          <AvatarFallback>{name.split(" ").map((n) => n[0]).join("")}</AvatarFallback>
        </Avatar>
        <div>
          <div className="font-medium leading-none">{name}</div>
          <div className="text-xs text-muted-foreground">{role}</div>
        </div>
      </div>
      <span className={`inline-flex items-center gap-2 rounded-full px-2 py-1 text-xs text-white ${tagColor}`}>
        <span className="h-2 w-2 rounded-full bg-white/80"/> {tag}
      </span>
    </div>
  )
}

function MiniStat({ label, value }) {
  return (
    <div className="rounded-2xl border p-3 text-center">
      <div className="text-2xl font-semibold tabular-nums">{value}</div>
      <div className="text-xs text-muted-foreground">{label}</div>
    </div>
  )
}

