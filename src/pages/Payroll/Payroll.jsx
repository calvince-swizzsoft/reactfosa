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
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
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
  Users,
  Wallet,
  Banknote,
  CalendarDays,
  FileText,
  CheckCircle2,
  Clock,
  TrendingUp,
  TrendingDown,
} from "lucide-react"
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts"

const payrollTrend = [
  { name: "Jan", value: 420000 },
  { name: "Feb", value: 435000 },
  { name: "Mar", value: 410000 },
  { name: "Apr", value: 455000 },
  { name: "May", value: 470000 },
]

const payrollRuns = [
  { period: "May 2025", employees: 42, gross: 470000, status: "Completed" },
  { period: "Apr 2025", employees: 41, gross: 455000, status: "Completed" },
  { period: "Mar 2025", employees: 40, gross: 410000, status: "Completed" },
]

const employees = [
  { name: "Alice Mwangi", role: "Software Engineer", net: 120000, status: "Paid" },
  { name: "Brian Otieno", role: "Product Manager", net: 135000, status: "Paid" },
  { name: "Caroline Wanjiru", role: "HR Lead", net: 98000, status: "Pending" },
]

export default function Payroll() {
  return (
    <div className="min-h-screen m-1 p-1 md:p-3">
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="mx-auto max-w-7xl"
      >
        {/* Top bar */}
        <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between bg-emerald-700 p-4 rounded-xl">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-white">Payroll Dashboard</h1>
            <p className="text-sm text-white">Runs · Employees · Payslips · Compliance</p>
          </div>
          <Button variant="secondary" className="gap-2"><CalendarDays className="h-4 w-4" />Run Payroll</Button>
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          {/* LEFT */}
          <div className="lg:col-span-2 space-y-6">
            {/* KPI + Trend */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <div>
                  <CardTitle className="text-lg">Payroll Overview</CardTitle>
                  <CardDescription>Monthly payroll cost trend</CardDescription>
                </div>
                <Tabs defaultValue="month">
                  <TabsList>
                    <TabsTrigger value="month">Month</TabsTrigger>
                    <TabsTrigger value="quarter">Quarter</TabsTrigger>
                  </TabsList>
                </Tabs>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 md:grid-cols-4">
                  <KPI label="Employees" value="42" icon={<Users className="h-4 w-4" />} />
                  <KPI label="Gross Payroll" value="KES 470K" icon={<Wallet className="h-4 w-4" />} />
                  <KPI label="Net Paid" value="KES 392K" icon={<Banknote className="h-4 w-4" />} />
                  <KPI label="MoM Change" value="+3.2%" trend="up" icon={<TrendingUp className="h-4 w-4" />} />
                </div>

                <div className="mt-6 h-48">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={payrollTrend}>
                      <defs>
                        <linearGradient id="payroll" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#059669" stopOpacity={0.35} />
                          <stop offset="95%" stopColor="#059669" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <XAxis dataKey="name" />
                      <YAxis />
                      <Tooltip />
                      <Area type="monotone" dataKey="value" stroke="#059669" fill="url(#payroll)" />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            {/* Payroll Runs */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Payroll Runs</CardTitle>
                <CardDescription>Recent processed payrolls</CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Period</TableHead>
                      <TableHead>Employees</TableHead>
                      <TableHead className="text-right">Gross</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {payrollRuns.map((r) => (
                      <TableRow key={r.period}>
                        <TableCell>{r.period}</TableCell>
                        <TableCell>{r.employees}</TableCell>
                        <TableCell className="text-right">{r.gross.toLocaleString()}</TableCell>
                        <TableCell>
                          <Badge variant="secondary" className="gap-1">
                            <CheckCircle2 className="h-3.5 w-3.5" /> {r.status}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </div>

          {/* RIGHT */}
          <div className="space-y-6">
            {/* Employees */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Employees</CardTitle>
                <CardDescription>Latest payroll status</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {employees.map((e) => (
                  <div key={e.name} className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Avatar className="h-9 w-9">
                        <AvatarImage src={`https://i.pravatar.cc/100?u=${e.name}`} />
                        <AvatarFallback>{e.name.split(" ").map(n => n[0]).join("")}</AvatarFallback>
                      </Avatar>
                      <div>
                        <div className="font-medium leading-none">{e.name}</div>
                        <div className="text-xs text-muted-foreground">{e.role}</div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-semibold">KES {e.net.toLocaleString()}</div>
                      <Badge variant={e.status === "Paid" ? "secondary" : "outline"}>
                        {e.status === "Paid" ? <CheckCircle2 className="mr-1 h-3.5 w-3.5" /> : <Clock className="mr-1 h-3.5 w-3.5" />}
                        {e.status}
                      </Badge>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Compliance */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Compliance</CardTitle>
                <CardDescription>Statutory filings</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <ComplianceItem label="PAYE Filed" value={100} />
                <ComplianceItem label="NSSF Filed" value={90} />
                <ComplianceItem label="NHIF Filed" value={95} />
              </CardContent>
              <CardFooter className="justify-end">
                <Button size="sm" className="gap-2"><FileText className="h-4 w-4" />View Reports</Button>
              </CardFooter>
            </Card>
          </div>
        </div>
      </motion.div>
    </div>
  )
}

function KPI({ label, value, icon, trend }) {
  return (
    <div className="flex items-center justify-between rounded-2xl border p-4">
      <div>
        <div className="text-sm text-muted-foreground">{label}</div>
        <div className="text-lg font-semibold">{value}</div>
      </div>
      <div className="grid h-9 w-9 place-items-center rounded-xl bg-muted">{icon}</div>
    </div>
  )
}

function ComplianceItem({ label, value }) {
  return (
    <div className="rounded-2xl border p-3">
      <div className="mb-1 flex justify-between text-sm">
        <span>{label}</span>
        <span>{value}%</span>
      </div>
      <Progress value={value} className="h-2" />
    </div>
  )
}
