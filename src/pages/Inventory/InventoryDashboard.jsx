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
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
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
  Layers,
  Boxes,
  Warehouse,
  Truck,
  ClipboardCheck,
  AlertTriangle,
  PackageOpen,
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

const stockFlow = [
  { name: "M", value: 1200 },
  { name: "T", value: 800 },
  { name: "W", value: 950 },
  { name: "T", value: 1100 },
  { name: "F", value: 700 },
  { name: "S", value: 1300 },
  { name: "S", value: 900 },
]

const stockMovements = [
  { date: "2025-09-01", doc: "GRN-1023", type: "Receipt", item: "Steel Rods", qty: 120, warehouse: "Main" },
  { date: "2025-09-01", doc: "ISS-8802", type: "Issue", item: "Cement Bags", qty: -50, warehouse: "Branch A" },
  { date: "2025-09-02", doc: "TRF-3310", type: "Transfer", item: "Wood Panels", qty: -30, warehouse: "Branch B" },
  { date: "2025-09-03", doc: "ADJ-1024", type: "Adjustment", item: "Paint Cans", qty: 5, warehouse: "Production" },
]

const warehouses = [
  { name: "Main Warehouse", stock: 8500 },
  { name: "Branch A", stock: 2300 },
  { name: "Branch B", stock: 1540 },
  { name: "Production", stock: 1000 },
]

const alerts = [
  { warehouse: "Main Warehouse", item: "Cement Bags", status: 88 },
  { warehouse: "Branch A", item: "Steel Rods", status: 64 },
  { warehouse: "Branch B", item: "Paint Cans", status: 97 },
]

export default function InventoryDashboard() {
  return (
    <div className="min-h-screen p-3 m-8 md:p-10 bg-white rounded-2xl">
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="mx-auto max-w-7xl"
      >
        {/* Top bar */}
        <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between bg-indigo-600 p-4 rounded-xl">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-white">Inventory Dashboard</h1>
            <p className="text-sm text-white">Stock Receipts · Issues · Transfers · Adjustments</p>
          </div>

        </div>

        {/* Grid */}
        <div className="grid gap-6 lg:grid-cols-3">
          {/* LEFT COLUMN */}
          <div className="lg:col-span-2 space-y-6">
            {/* Stock KPIs */}
            <Card className="shadow-sm">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <div>
                  <CardTitle className="text-lg">Stock Flow</CardTitle>
                  <CardDescription>Track weekly inflow/outflow</CardDescription>
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
                  <KPI label="Receipts" value="1,200" trend="up" delta="+8%" icon={<TrendingUp className="h-4 w-4" />} className="bg-indigo-600" />
                  <KPI label="Issues" value="980" trend="down" delta="-3%" icon={<TrendingDown className="h-4 w-4" />} />
                  <KPI label="Transfers" value="320" trend="up" delta="+5%" icon={<Truck className="h-4 w-4" />} />
                  <KPI label="Adjustments" value="45" trend="neutral" delta="~" icon={<ClipboardCheck className="h-4 w-4 text-indigo-600" />} />

                </div>

                <div className="mt-6 h-48 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={stockFlow} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                      <defs>
                        <linearGradient id="stock" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#4f39f6" stopOpacity={0.35} />
                          <stop offset="95%" stopColor="#4f39f6" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <XAxis dataKey="name" tickLine={false} axisLine={false} />
                      <YAxis tickLine={false} axisLine={false} />
                      <Tooltip contentStyle={{ borderRadius: 12 }} />
                      <Area type="monotone" dataKey="value" stroke="#4f39f6" fill="url(#stock)" strokeWidth={2} />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            {/* Stock Movements */}
            <Card className="shadow-sm">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-lg">Stock Movements Log</CardTitle>
                    <CardDescription>Recent receipts, issues, transfers & adjustments</CardDescription>
                  </div>
                  <Button variant="outline" size="sm" className="gap-2"><PackageOpen className="h-4 w-4" />New Entry</Button>
                </div>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Document</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Item</TableHead>
                      <TableHead className="text-right">Qty</TableHead>
                      <TableHead>Warehouse</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {stockMovements.map((r, i) => (
                      <TableRow key={i} className="hover:bg-muted/40">
                        <TableCell className="whitespace-nowrap">{r.date}</TableCell>
                        <TableCell>{r.doc}</TableCell>
                        <TableCell>{r.type}</TableCell>
                        <TableCell className="max-w-[160px] truncate">{r.item}</TableCell>
                        <TableCell className="text-right">{r.qty}</TableCell>
                        <TableCell>
                          <Badge variant="secondary">{r.warehouse}</Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
              <CardFooter className="justify-between">
                <p className="text-xs text-muted-foreground">Showing {stockMovements.length} of 4 recent entries</p>
                <Button size="sm" variant="ghost">View all</Button>
              </CardFooter>
            </Card>

            {/* Warehouses */}
            <Card className="shadow-sm">
              <CardHeader>
                <CardTitle className="text-lg">Warehouses</CardTitle>
                <CardDescription>Current stock by location</CardDescription>
              </CardHeader>
              <CardContent className="grid gap-4 md:grid-cols-2">
                {warehouses.map((w) => (
                  <div key={w.name} className="rounded-2xl border bg-background p-4">
                    <div className="mb-3 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Warehouse className="h-4 w-4" />
                        <span className="font-medium">{w.name}</span>
                      </div>
                      <span className="text-sm tabular-nums">{w.stock}</span>
                    </div>
                    <Progress value={(w.stock / 10000) * 100} className="h-2" />
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>

          {/* RIGHT COLUMN */}
          <div className="space-y-6">
            {/* Alerts */}
            <Card className="shadow-sm bg-indigo-700">
              <CardHeader className="bg-indigo-500 m-2 rounded-t-2xl">
                <CardTitle className="text-lg text-white">Stock Alerts</CardTitle>
                <CardDescription className="text-white">Critical levels by item</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {alerts.map((a) => (
                  <div key={a.item} className="rounded-2xl border p-4 bg-white">
                    <div className="mb-2 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <AlertTriangle className="h-4 w-4 text-amber-600" />
                        <span className="font-medium">{a.item}</span>
                      </div>
                      <Badge variant="secondary">{a.warehouse}</Badge>
                    </div>
                    <Progress value={a.status} className="h-2 bg-gray-300 [&>div]:bg-indigo-700" />
                    <div className="mt-2 flex items-center justify-between text-xs text-muted-foreground">
                      <span>{a.status}% capacity</span>
                      {a.status >= 95 ? (
                        <span className="inline-flex items-center gap-1 text-emerald-600"><CheckCircle2 className="h-3.5 w-3.5" />Healthy</span>
                      ) : (
                        <span className="inline-flex items-center gap-1"><Clock className="h-3.5 w-3.5" />Monitor</span>
                      )}
                    </div>
                  </div>
                ))}
              </CardContent>
              <CardFooter className="justify-end">
                <Button size="sm" className="gap-2"><Upload className="h-4 w-4" />View More</Button>
              </CardFooter>
            </Card>

            {/* Quick Actions */}
            <Card className="shadow-sm">
              <CardHeader className="pb-2">
                <CardTitle className="text-lg">Quick Actions</CardTitle>
                <CardDescription>Manage inventory tasks</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button className="w-full">New Stock Receipt</Button>
                <Button className="w-full">Issue Stock</Button>
                <Button className="w-full">Transfer Stock</Button>
                <Button className="w-full">Adjust Stock</Button>
                <Button variant="outline" className="w-full">Download Report</Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </motion.div>
    </div>
  )
}

function KPI({ label, value, trend, delta, icon }) {
  let color = trend === "up" ? "text-emerald-600" : trend === "down" ? "text-rose-600" : "text-gray-500"
  return (
    <div className="flex items-center justify-between rounded-2xl border p-4">
      <div>
        <div className="text-sm text-muted-foreground">{label}</div>
        <div className="text-lg font-semibold">{value}</div>
      </div>
      <div className="text-right">
        <div className={`text-xs ${color}`}>{delta}</div>
        <div className="mt-1 grid h-9 w-9 place-items-center rounded-xl bg-muted">{icon}</div>
      </div>
    </div>
  )
}
