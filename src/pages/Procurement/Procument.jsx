
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
import {
  TrendingUp,
  TrendingDown,
  Package,
  ClipboardList,
  Truck,
  Building2,
  FileText,
  Receipt,
  Users2,
  CheckCircle2,
  Clock,
} from "lucide-react"
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts"

const spendData = [
  { name: "M", value: 8 },
  { name: "T", value: 14 },
  { name: "W", value: 12 },
  { name: "T", value: 20 },
  { name: "F", value: 15 },
  { name: "S", value: 18 },
  { name: "S", value: 11 },
]

const requisitions = [
  { date: "2025-10-12", reqNo: "REQ-1054", dept: "IT", amount: 42000, status: "Approved" },
  { date: "2025-10-13", reqNo: "REQ-1055", dept: "Maintenance", amount: 27000, status: "Pending" },
  { date: "2025-10-14", reqNo: "REQ-1056", dept: "Production", amount: 89500, status: "Rejected" },
  { date: "2025-10-15", reqNo: "REQ-1057", dept: "Logistics", amount: 125000, status: "Approved" },
]

const rfqs = [
  { rfqNo: "RFQ-2025-003", project: "Machinery Upgrade", vendors: 5, status: "Open" },
  { rfqNo: "RFQ-2025-004", project: "Vehicle Lease", vendors: 3, status: "Closed" },
  { rfqNo: "RFQ-2025-005", project: "IT Equipment", vendors: 7, status: "Awarded" },
]

const vendors = [
  { name: "Jambo Suppliers Ltd", reliability: 92 },
  { name: "Techline Systems", reliability: 81 },
  { name: "Prime Logistics", reliability: 74 },
  { name: "Elite Distributors", reliability: 88 },
]

const purchaseOrders = [
  { no: "PO-2210", vendor: "Jambo Suppliers Ltd", value: 72000, status: "Delivered" },
  { no: "PO-2211", vendor: "Techline Systems", value: 48000, status: "Pending" },
  { no: "PO-2212", vendor: "Prime Logistics", value: 126000, status: "Delivered" },
  { no: "PO-2213", vendor: "Elite Distributors", value: 39500, status: "In Transit" },
]

export default function Procurement() {
  return (
    <div className="min-h-screen m-1 p-1 md:p-3">
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="mx-auto max-w-7xl"
      >
        {/* Top Bar */}
        <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between bg-indigo-700 p-4 rounded-xl">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-white">Procurement Dashboard</h1>
            <p className="text-sm text-white">
              Projects · Requisitions · RFQs · Vendors · Purchase Orders
            </p>
          </div>
        </div>

        {/* Grid */}
        <div className="grid gap-6 lg:grid-cols-3">
          {/* LEFT COLUMN */}
          <div className="lg:col-span-2 space-y-6">
            {/* KPIs */}
            <Card className="shadow-sm">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <div>
                  <CardTitle className="text-lg">Procurement Overview</CardTitle>
                  <CardDescription>Weekly purchasing and sourcing activity</CardDescription>
                </div>
                <Tabs defaultValue="week" className="w-auto">
                  <TabsList>
                    <TabsTrigger value="week">Week</TabsTrigger>
                    <TabsTrigger value="month">Month</TabsTrigger>
                  </TabsList>
                </Tabs>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 md:grid-cols-4">
                  <KPI label="Total Vendors" value="48" trend="up" delta="+4%" icon={<Users2 className="h-4 w-4" />} />
                  <KPI label="Active Projects" value="9" trend="up" delta="+2" icon={<Building2 className="h-4 w-4" />} />
                  <KPI label="RFQs Issued" value="27" trend="down" delta="-1" icon={<ClipboardList className="h-4 w-4" />} />
                  <KPI label="POs Approved" value="18" trend="up" delta="+3" icon={<FileText className="h-4 w-4" />} />
                </div>

                <div className="mt-6 h-48 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={spendData}>
                      <defs>
                        <linearGradient id="spend" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#4f46e5" stopOpacity={0.35} />
                          <stop offset="95%" stopColor="#4f46e5" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <XAxis dataKey="name" tickLine={false} axisLine={false} />
                      <YAxis tickLine={false} axisLine={false} />
                      <Tooltip contentStyle={{ borderRadius: 12 }} />
                      <Area type="monotone" dataKey="value" stroke="#4f46e5" fill="url(#spend)" strokeWidth={2} />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            {/* Requisitions */}
            <Card className="shadow-sm">
              <CardHeader>
                <CardTitle className="text-lg">Recent Requisitions</CardTitle>
                <CardDescription>Latest internal purchase requests</CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Request No</TableHead>
                      <TableHead>Department</TableHead>
                      <TableHead>Amount (KES)</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {requisitions.map((r, i) => (
                      <TableRow key={i} className="hover:bg-muted/40">
                        <TableCell>{r.date}</TableCell>
                        <TableCell>{r.reqNo}</TableCell>
                        <TableCell>{r.dept}</TableCell>
                        <TableCell>{r.amount.toLocaleString()}</TableCell>
                        <TableCell>
                          <Badge
                            variant={
                              r.status === "Approved"
                                ? "default"
                                : r.status === "Pending"
                                  ? "secondary"
                                  : "destructive"
                            }
                          >
                            {r.status}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
              <CardFooter className="justify-end">
                <Button size="sm" variant="ghost">
                  View All
                </Button>
              </CardFooter>
            </Card>

            {/* RFQ Overview */}
            <Card className="shadow-sm">
              <CardHeader>
                <CardTitle className="text-lg">RFQs Overview</CardTitle>
                <CardDescription>Requests for Quotation activity</CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>RFQ No</TableHead>
                      <TableHead>Project</TableHead>
                      <TableHead>Vendors</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {rfqs.map((r, i) => (
                      <TableRow key={i} className="hover:bg-muted/40">
                        <TableCell>{r.rfqNo}</TableCell>
                        <TableCell>{r.project}</TableCell>
                        <TableCell>{r.vendors}</TableCell>
                        <TableCell>
                          <Badge
                            variant={
                              r.status === "Open"
                                ? "default"
                                : r.status === "Closed"
                                  ? "secondary"
                                  : "outline"
                            }
                          >
                            {r.status}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </div>

          {/* RIGHT COLUMN */}
          <div className="space-y-6">
            {/* Vendor Performance */}
            <Card className="shadow-sm bg-indigo-600">
              <CardHeader>
                <CardTitle className="text-lg text-white">Vendor Performance</CardTitle>
                <CardDescription className="text-white">Reliability and delivery rates</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3 bg-white rounded-2xl p-4 m-2">
                {vendors.map((v) => (
                  <div key={v.name}>
                    <div className="mb-1 flex justify-between text-sm">
                      <span className="font-medium">{v.name}</span>
                      <span>{v.reliability}%</span>
                    </div>
                    <Progress value={v.reliability} className="h-2" />
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Purchase Orders */}
            <Card className="shadow-sm">
              <CardHeader>
                <CardTitle className="text-lg">Purchase Orders</CardTitle>
                <CardDescription>Recent procurement orders</CardDescription>
              </CardHeader>
              <CardContent>
                {purchaseOrders.map((po) => (
                  <div key={po.no} className="mb-3 flex items-center justify-between rounded-lg border p-3">
                    <div>
                      <div className="font-medium">{po.no}</div>
                      <div className="text-xs text-muted-foreground">{po.vendor}</div>
                    </div>
                    <div className="text-right">
                      <div className="font-semibold">KES {po.value.toLocaleString()}</div>
                      <Badge
                        variant={
                          po.status === "Delivered"
                            ? "default"
                            : po.status === "Pending"
                              ? "secondary"
                              : "outline"
                        }
                      >
                        {po.status}
                      </Badge>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Procurement Contacts */}
            <Card className="shadow-sm">
              <CardHeader>
                <CardTitle className="text-lg">Procurement Officers</CardTitle>
                <CardDescription>Reach out directly</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <Contact name="Susan Mwangi" role="Head of Procurement" tag="Online" />
                <Contact name="Brian Ouma" role="Requisition Manager" tag="Away" />
                <Contact name="Jane Mutua" role="Vendor Relations" tag="Online" />
              </CardContent>
            </Card>

            {/* Quotation Summary */}
            <Card className="shadow-sm">
              <CardHeader>
                <CardTitle className="text-lg">Quotation Summary</CardTitle>
                <CardDescription>Current evaluation cycle</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-3 gap-3">
                  <MiniStat label="Submitted" value={42} />
                  <MiniStat label="Under Review" value={18} />
                  <MiniStat label="Awarded" value={9} />
                </div>
                <div className="mt-4 h-3 rounded-full bg-muted">
                  <div className="h-3 rounded-full bg-indigo-600" style={{ width: "68%" }} />
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </motion.div>
    </div>
  )
}

// ---- Reusable Subcomponents ----

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
  const tagColor =
    tag === "Online"
      ? "bg-emerald-500"
      : tag === "Away"
        ? "bg-amber-500"
        : "bg-muted-foreground"
  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-3">
        <Avatar className="h-9 w-9">
          <AvatarImage src={"https://i.pravatar.cc/100?img=" + name.length} alt={name} />
          <AvatarFallback>{name.split(" ").map((n) => n[0]).join("")}</AvatarFallback>
        </Avatar>
        <div>
          <div className="font-medium leading-none">{name}</div>
          <div className="text-xs text-muted-foreground">{role}</div>
        </div>
      </div>
      <span className={`inline-flex items-center gap-2 rounded-full px-2 py-1 text-xs text-white ${tagColor}`}>
        <span className="h-2 w-2 rounded-full bg-white/80" /> {tag}
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
