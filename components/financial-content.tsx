"use client"

import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Plus, Save, Trash2, Edit2, X, Check, Users, DollarSign, UserPlus, TrendingUp, Loader2 } from "lucide-react"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { ChartContainer } from "@/components/ui/chart"
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts"
import { ArrowUpRight, ArrowDownRight } from "lucide-react"

interface Staff {
  id: string
  name: string
}

interface FinancialRecord {
  id: string
  staff_id: string
  record_month: string
  monthly_earning: number
  new_customers_developed: number
  total_customer_investment: number
  notes: string | null
  staff?: { name: string }
}

interface EmployeeWithFinancials {
  id: string
  name: string
  record?: FinancialRecord
}

interface FinancialContentProps {
  staff: Staff[]
  userId: string
}

const MONTHS = [
  { value: "all", label: "All Months" },
  { value: "01", label: "January" },
  { value: "02", label: "February" },
  { value: "03", label: "March" },
  { value: "04", label: "April" },
  { value: "05", label: "May" },
  { value: "06", label: "June" },
  { value: "07", label: "July" },
  { value: "08", label: "August" },
  { value: "09", label: "September" },
  { value: "10", label: "October" },
  { value: "11", label: "November" },
  { value: "12", label: "December" },
]

export function FinancialContent({ staff = [], userId }: FinancialContentProps) {
  const [activeTab, setActiveTab] = useState("add")
  const [selectedStaff, setSelectedStaff] = useState("")
  const [selectedMonth, setSelectedMonth] = useState(() => {
    const now = new Date()
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`
  })
  const [monthlyEarning, setMonthlyEarning] = useState("")
  const [newCustomers, setNewCustomers] = useState("")
  const [totalInvestment, setTotalInvestment] = useState("")
  const [notes, setNotes] = useState("")
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null)

  // History state
  const [historyStaff, setHistoryStaff] = useState("all")
  const [historyYear, setHistoryYear] = useState(() => new Date().getFullYear().toString())
  const [historyMonth, setHistoryMonth] = useState("all")
  const [records, setRecords] = useState<FinancialRecord[]>([])
  const [employeesWithFinancials, setEmployeesWithFinancials] = useState<EmployeeWithFinancials[]>([])
  const [loading, setLoading] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editData, setEditData] = useState<Partial<FinancialRecord>>({})

  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [recordToDelete, setRecordToDelete] = useState<{ id: string; employeeName: string } | null>(null)
  const [deleting, setDeleting] = useState(false)

  // Generate month options for adding records (last 24 months)
  const monthOptions = Array.from({ length: 24 }, (_, i) => {
    const date = new Date()
    date.setMonth(date.getMonth() - i)
    const value = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`
    const label = date.toLocaleDateString("en-US", { year: "numeric", month: "long" })
    return { value, label }
  })

  // Generate year options
  const currentYear = new Date().getFullYear()
  const yearOptions = Array.from({ length: 5 }, (_, i) => currentYear - i)

  const displayData = historyStaff === "all" ? employeesWithFinancials : employeesWithFinancials.filter((e) => e.record)
  const totalEarnings = displayData.reduce((sum, e) => sum + (e.record?.monthly_earning || 0), 0)
  const totalCustomers = displayData.reduce((sum, e) => sum + (e.record?.new_customers_developed || 0), 0)
  const totalInvestments = displayData.reduce((sum, e) => sum + (e.record?.total_customer_investment || 0), 0)
  const employeesWithRecords = displayData.filter((e) => e.record).length

  const handleSave = async () => {
    if (!selectedStaff || !selectedMonth) {
      setMessage({ type: "error", text: "Please select staff and month" })
      return
    }

    setSaving(true)
    setMessage(null)

    const supabase = createClient()
    const recordMonth = `${selectedMonth}-01`

    const recordData = {
      staff_id: selectedStaff,
      record_month: recordMonth,
      monthly_earning: Number.parseFloat(monthlyEarning) || 0,
      new_customers_developed: Number.parseInt(newCustomers) || 0,
      total_customer_investment: Number.parseFloat(totalInvestment) || 0,
      notes: notes || null,
      created_by: userId,
    }

    const { data: existing } = await supabase
      .from("financial_records")
      .select("id")
      .eq("staff_id", selectedStaff)
      .eq("record_month", recordMonth)
      .single()

    let error
    if (existing) {
      const { error: updateError } = await supabase.from("financial_records").update(recordData).eq("id", existing.id)
      error = updateError
    } else {
      const { error: insertError } = await supabase.from("financial_records").insert(recordData)
      error = insertError
    }

    setSaving(false)

    if (error) {
      setMessage({ type: "error", text: error.message })
    } else {
      setMessage({ type: "success", text: "Financial record saved successfully!" })
      setMonthlyEarning("")
      setNewCustomers("")
      setTotalInvestment("")
      setNotes("")
    }
  }

  const fetchRecords = async () => {
    setLoading(true)
    const supabase = createClient()

    // Build date range based on year and month selection
    let startDate: string
    let endDate: string

    if (historyMonth === "all") {
      startDate = `${historyYear}-01-01`
      endDate = `${historyYear}-12-31`
    } else {
      const lastDay = new Date(Number.parseInt(historyYear), Number.parseInt(historyMonth), 0).getDate()
      startDate = `${historyYear}-${historyMonth}-01`
      endDate = `${historyYear}-${historyMonth}-${lastDay}`
    }

    let query = supabase
      .from("financial_records")
      .select("*, staff(name)")
      .gte("record_month", startDate)
      .lte("record_month", endDate)
      .order("record_month", { ascending: false })

    if (historyStaff && historyStaff !== "all") {
      query = query.eq("staff_id", historyStaff)
    }

    const { data, error } = await query

    setLoading(false)

    if (!error) {
      setRecords(data || [])

      const employeeMap = new Map<string, EmployeeWithFinancials>()

      // First, add all staff members
      staff.forEach((s) => {
        employeeMap.set(s.id, { id: s.id, name: s.name })
      })

      // Then, attach financial records to matching employees
      if (data) {
        data.forEach((record) => {
          const employee = employeeMap.get(record.staff_id)
          if (employee) {
            if (!employee.record) {
              employee.record = record
            }
          }
        })
      }

      // If filtering by specific employee, only show that one
      if (historyStaff && historyStaff !== "all") {
        const filtered = Array.from(employeeMap.values()).filter((e) => e.id === historyStaff)
        setEmployeesWithFinancials(filtered)
      } else {
        setEmployeesWithFinancials(Array.from(employeeMap.values()))
      }
    }
  }

  useEffect(() => {
    if (activeTab === "history") {
      fetchRecords()
    }
  }, [activeTab, historyStaff, historyYear, historyMonth])

  const handleDelete = (id: string, employeeName: string) => {
    setRecordToDelete({ id, employeeName })
    setDeleteDialogOpen(true)
  }

  const confirmDelete = async () => {
    if (!recordToDelete) return

    setDeleting(true)
    const supabase = createClient()
    const { error } = await supabase.from("financial_records").delete().eq("id", recordToDelete.id)

    setDeleting(false)
    setDeleteDialogOpen(false)
    setRecordToDelete(null)

    if (!error) {
      setRecords(records.filter((r) => r.id !== recordToDelete.id))
      fetchRecords() // Refresh the list
    }
  }

  const handleEdit = (record: FinancialRecord) => {
    setEditingId(record.id)
    setEditData({
      monthly_earning: record.monthly_earning,
      new_customers_developed: record.new_customers_developed,
      total_customer_investment: record.total_customer_investment,
      notes: record.notes,
    })
  }

  const handleSaveEdit = async (id: string) => {
    const supabase = createClient()
    const { error } = await supabase
      .from("financial_records")
      .update({
        monthly_earning: editData.monthly_earning || 0,
        new_customers_developed: editData.new_customers_developed || 0,
        total_customer_investment: editData.total_customer_investment || 0,
        notes: editData.notes,
      })
      .eq("id", id)

    if (!error) {
      fetchRecords() // Refresh the list
      setEditingId(null)
      setEditData({})
    }
  }

  const formatMonth = (dateStr: string) => {
    const date = new Date(dateStr)
    return date.toLocaleDateString("en-US", { year: "numeric", month: "long" })
  }

  return (
    <div className="space-y-4 sm:space-y-6 max-w-full">
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Financial Record</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete the financial record for{" "}
              <span className="font-semibold">{recordToDelete?.employeeName}</span>? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              disabled={deleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleting ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <div>
        <h1 className="text-xl sm:text-2xl font-bold break-words">Financial Records</h1>
        <p className="text-sm text-muted-foreground break-words">
          Record and view employee monthly earnings and customer development
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="w-full flex flex-col gap-2 sm:flex-row sm:gap-0 p-0 bg-transparent shadow-none border-none max-w-full">
          <TabsTrigger value="add" className="flex-1 sm:flex-none gap-1 sm:gap-2 text-xs sm:text-sm rounded-md sm:rounded-none border border-input sm:border-0 bg-background sm:bg-transparent shadow-sm sm:shadow-none">
            <Plus className="h-3 w-3 sm:h-4 sm:w-4" />
            Add Record
          </TabsTrigger>
          <TabsTrigger value="history" className="flex-1 sm:flex-none gap-1 sm:gap-2 text-xs sm:text-sm rounded-md sm:rounded-none border border-input sm:border-0 bg-background sm:bg-transparent shadow-sm sm:shadow-none">
            <Edit2 className="h-3 w-3 sm:h-4 sm:w-4" />
            View History
          </TabsTrigger>
        </TabsList>

        <TabsContent value="add" className="mt-4 sm:mt-6 max-w-full">
          <Card className="max-w-full">
            <CardHeader>
              <CardTitle className="text-base sm:text-lg">Add Financial Record</CardTitle>
              <CardDescription className="text-xs sm:text-sm">
                Record monthly earnings and customer development for an employee
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 sm:space-y-6 max-w-full">
              {message && (
                <div
                  className={`p-3 sm:p-4 rounded-lg text-sm ${
                    message.type === "success"
                      ? "bg-green-50 text-green-700 border border-green-200"
                      : "bg-red-50 text-red-700 border border-red-200"
                  }`}
                >
                  {message.text}
                </div>
              )}

              <div className="grid gap-4 sm:gap-6 grid-cols-1 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label className="text-sm">Select Employee</Label>
                  <Select value={selectedStaff} onValueChange={setSelectedStaff}>
                    <SelectTrigger>
                      <SelectValue placeholder="Choose employee" />
                    </SelectTrigger>
                    <SelectContent>
                      {staff.map((s) => (
                        <SelectItem key={s.id} value={s.id}>
                          {s.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label className="text-sm">Select Month</Label>
                  <Select value={selectedMonth} onValueChange={setSelectedMonth}>
                    <SelectTrigger>
                      <SelectValue placeholder="Choose month" />
                    </SelectTrigger>
                    <SelectContent>
                      {monthOptions.map((m) => (
                        <SelectItem key={m.value} value={m.value}>
                          {m.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid gap-4 sm:gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 max-w-full">
                <div className="space-y-2">
                  <Label className="text-sm">Monthly Earning</Label>
                  <Input
                    type="number"
                    placeholder="0"
                    value={monthlyEarning}
                    onChange={(e) => setMonthlyEarning(e.target.value)}
                  />
                  <p className="text-xs text-muted-foreground">Employee's total earnings this month</p>
                </div>

                <div className="space-y-2">
                  <Label className="text-sm">New Customers Developed</Label>
                  <Input
                    type="number"
                    placeholder="0"
                    value={newCustomers}
                    onChange={(e) => setNewCustomers(e.target.value)}
                  />
                  <p className="text-xs text-muted-foreground">Number of new investing customers</p>
                </div>

                <div className="space-y-2">
                  <Label className="text-sm">Total Customer Investment</Label>
                  <Input
                    type="number"
                    placeholder="0"
                    value={totalInvestment}
                    onChange={(e) => setTotalInvestment(e.target.value)}
                  />
                  <p className="text-xs text-muted-foreground">Total investment from new customers</p>
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-sm">Notes (Optional)</Label>
                <Textarea
                  placeholder="Add any additional notes..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={3}
                />
              </div>

              <Button onClick={handleSave} disabled={saving} className="w-full sm:w-auto gap-2">
                <Save className="h-4 w-4" />
                {saving ? "Saving..." : "Save Financial Record"}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="history" className="mt-4 sm:mt-6 max-w-full">
          <Card className="max-w-full">
            <CardHeader>
              <CardTitle className="text-base sm:text-lg">Financial History</CardTitle>
              <CardDescription className="text-xs sm:text-sm">
                View and manage employee financial records
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 sm:space-y-6 max-w-full">
              <div className="grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-3 max-w-full">
                <div className="space-y-2">
                  <Label className="text-xs sm:text-sm">Filter by Employee</Label>
                  <Select value={historyStaff} onValueChange={setHistoryStaff}>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="All employees" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All employees</SelectItem>
                      {staff.map((s) => (
                        <SelectItem key={s.id} value={s.id}>
                          {s.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label className="text-xs sm:text-sm">Year</Label>
                  <Select value={historyYear} onValueChange={setHistoryYear}>
                    <SelectTrigger className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {yearOptions.map((y) => (
                        <SelectItem key={y} value={y.toString()}>
                          {y}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label className="text-xs sm:text-sm">Month</Label>
                  <Select value={historyMonth} onValueChange={setHistoryMonth}>
                    <SelectTrigger className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {MONTHS.map((m) => (
                        <SelectItem key={m.value} value={m.value}>
                          {m.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-4 max-w-full">
                <Card className="bg-muted/50">
                  <CardContent className="p-3 sm:pt-4">
                    <div className="flex items-center gap-1 sm:gap-2 text-muted-foreground text-xs sm:text-sm">
                      <Users className="h-3 w-3 sm:h-4 sm:w-4" />
                      <span className="truncate">Total Employees</span>
                    </div>
                    <p className="text-lg sm:text-2xl font-bold mt-1">{staff.length}</p>
                    <p className="text-[10px] sm:text-xs text-muted-foreground">{employeesWithRecords} with records</p>
                  </CardContent>
                </Card>
                <Card className="bg-muted/50">
                  <CardContent className="p-3 sm:pt-4">
                    <div className="flex items-center gap-1 sm:gap-2 text-muted-foreground text-xs sm:text-sm">
                      <DollarSign className="h-3 w-3 sm:h-4 sm:w-4" />
                      <span className="truncate">Total Earnings</span>
                    </div>
                    <p className="text-lg sm:text-2xl font-bold mt-1">{totalEarnings.toLocaleString()}</p>
                  </CardContent>
                </Card>
                <Card className="bg-muted/50">
                  <CardContent className="p-3 sm:pt-4">
                    <div className="flex items-center gap-1 sm:gap-2 text-muted-foreground text-xs sm:text-sm">
                      <UserPlus className="h-3 w-3 sm:h-4 sm:w-4" />
                      <span className="truncate">New Customers</span>
                    </div>
                    <p className="text-lg sm:text-2xl font-bold mt-1">{totalCustomers.toLocaleString()}</p>
                  </CardContent>
                </Card>
                <Card className="bg-muted/50">
                  <CardContent className="p-3 sm:pt-4">
                    <div className="flex items-center gap-1 sm:gap-2 text-muted-foreground text-xs sm:text-sm">
                      <TrendingUp className="h-3 w-3 sm:h-4 sm:w-4" />
                      <span className="truncate">Total Investment</span>
                    </div>
                    <p className="text-lg sm:text-2xl font-bold mt-1">{totalInvestments.toLocaleString()}</p>
                  </CardContent>
                </Card>
              </div>

              {/* Forecast & Growth Report */}
              <div className="space-y-6">
                <div className="bg-white rounded-lg shadow p-2 sm:p-4 flex flex-col items-stretch">
                  <h2 className="text-base sm:text-lg font-semibold mb-2 break-words">Monthly Income Forecast & Growth</h2>
                  <div className="w-full overflow-x-auto">
                    <div className="min-w-[350px] sm:min-w-[700px]">
                      <ResponsiveContainer width="100%" height={320}>
                        <LineChart data={(() => {
                          // Build data: [{ month: '2025-11', staff1: 1000, staff2: 2000, ... }]
                          const months = Array.from(new Set(records.map(r => r.record_month.slice(0, 7)))).sort()
                          const staffIds = staff.map(s => s.id)
                          return months.map(month => {
                            const entry = { month }
                            staffIds.forEach(id => {
                              const rec = records.find(r => r.staff_id === id && r.record_month.startsWith(month))
                              entry[id] = rec ? rec.monthly_earning : 0
                            })
                            return entry
                          })
                        })()} margin={{ top: 20, right: 30, left: 0, bottom: 5 }}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="month" />
                          <YAxis />
                          <Tooltip />
                          <Legend />
                          {staff.map((s, idx) => (
                            <Line key={s.id} type="monotone" dataKey={s.id} name={s.name} stroke={`hsl(${idx * 60},70%,50%)`} />
                          ))}
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                </div>
                <div className="bg-white rounded-lg shadow p-2 sm:p-4 flex flex-col items-stretch">
                  <div className="overflow-x-auto">
                    <table className="min-w-[350px] sm:min-w-full text-xs sm:text-sm border rounded-lg">
                      <thead>
                        <tr className="bg-muted">
                          <th className="px-2 py-2 text-left whitespace-nowrap">Staff</th>
                          {Array.from(new Set(records.map(r => r.record_month.slice(0, 7)))).sort().map(month => (
                            <th key={month} className="px-2 py-2 text-center whitespace-nowrap">{month}</th>
                          ))}
                          <th className="px-2 py-2 text-center whitespace-nowrap">Growth</th>
                        </tr>
                      </thead>
                      <tbody>
                        {staff.map(s => {
                          const months = Array.from(new Set(records.map(r => r.record_month.slice(0, 7)))).sort()
                          const earnings = months.map(month => {
                            const rec = records.find(r => r.staff_id === s.id && r.record_month.startsWith(month))
                            return rec ? rec.monthly_earning : 0
                          })
                          const last = earnings[earnings.length - 1] || 0
                          const prev = earnings[earnings.length - 2] || 0
                          const growth = prev === 0 ? 0 : ((last - prev) / prev) * 100
                          return (
                            <tr key={s.id} className="border-t">
                              <td className="px-2 py-2 font-medium whitespace-nowrap">{s.name}</td>
                              {earnings.map((e, i) => (
                                <td key={i} className="px-2 py-2 text-center whitespace-nowrap">{e.toLocaleString()}</td>
                              ))}
                              <td className="px-2 py-2 text-center whitespace-nowrap">
                                {growth > 0 ? (
                                  <span className="text-green-600 flex items-center gap-1 justify-center font-semibold"><ArrowUpRight className="inline h-4 w-4" />{growth.toFixed(1)}%</span>
                                ) : growth < 0 ? (
                                  <span className="text-red-600 flex items-center gap-1 justify-center font-semibold"><ArrowDownRight className="inline h-4 w-4" />{growth.toFixed(1)}%</span>
                                ) : (
                                  <span className="text-muted-foreground">0%</span>
                                )}
                              </td>
                            </tr>
                          )
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
                <p className="text-xs text-muted-foreground px-2 sm:px-4">
                  This report shows monthly earnings for each staff member, with growth/decline indicators for the latest month.
                </p>
              </div>

              {loading ? (
                <div className="text-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin mx-auto text-muted-foreground" />
                  <p className="mt-2 text-sm text-muted-foreground">Loading records...</p>
                </div>
              ) : displayData.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-muted-foreground">No records found for the selected filters.</p>
                </div>
              ) : (
                /* Added horizontal scroll wrapper for table on mobile */
                <div className="overflow-x-auto -mx-4 sm:mx-0 mt-4">
                  <div className="min-w-[700px] px-4 sm:px-0">
                    <Table className="min-w-full text-xs sm:text-sm">
                      <TableHeader>
                        <TableRow>
                          <TableHead className="whitespace-nowrap px-2 py-2">Employee</TableHead>
                          <TableHead className="whitespace-nowrap px-2 py-2">Month</TableHead>
                          <TableHead className="whitespace-nowrap px-2 py-2 text-right">Monthly Earning</TableHead>
                          <TableHead className="whitespace-nowrap px-2 py-2 text-right">New Customers</TableHead>
                          <TableHead className="whitespace-nowrap px-2 py-2 text-right">Total Investment</TableHead>
                          <TableHead className="whitespace-nowrap px-2 py-2">Notes</TableHead>
                          <TableHead className="whitespace-nowrap px-2 py-2 text-right">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {displayData.map((employee) => {
                          const record = employee.record
                          const isEditing = editingId === record?.id

                          return (
                            <TableRow key={employee.id} className={!record ? "bg-muted/30 text-muted-foreground" : ""}>
                              <TableCell className="font-medium text-xs sm:text-sm">{employee.name}</TableCell>
                              <TableCell className="text-xs sm:text-sm">
                                {record ? formatMonth(record.record_month) : "-"}
                              </TableCell>
                              <TableCell className="text-right text-xs sm:text-sm">
                                {isEditing ? (
                                  <Input
                                    type="number"
                                    value={editData.monthly_earning || ""}
                                    onChange={(e) =>
                                      setEditData({ ...editData, monthly_earning: Number(e.target.value) })
                                    }
                                    className="w-20 sm:w-24 text-right h-8 text-xs sm:text-sm"
                                  />
                                ) : (
                                  (record?.monthly_earning || 0).toLocaleString()
                                )}
                              </TableCell>
                              <TableCell className="text-right text-xs sm:text-sm">
                                {isEditing ? (
                                  <Input
                                    type="number"
                                    value={editData.new_customers_developed || ""}
                                    onChange={(e) =>
                                      setEditData({ ...editData, new_customers_developed: Number(e.target.value) })
                                    }
                                    className="w-16 sm:w-20 text-right h-8 text-xs sm:text-sm"
                                  />
                                ) : (
                                  record?.new_customers_developed || 0
                                )}
                              </TableCell>
                              <TableCell className="text-right text-xs sm:text-sm">
                                {isEditing ? (
                                  <Input
                                    type="number"
                                    value={editData.total_customer_investment || ""}
                                    onChange={(e) =>
                                      setEditData({ ...editData, total_customer_investment: Number(e.target.value) })
                                    }
                                    className="w-20 sm:w-24 text-right h-8 text-xs sm:text-sm"
                                  />
                                ) : (
                                  (record?.total_customer_investment || 0).toLocaleString()
                                )}
                              </TableCell>
                              <TableCell className="text-xs sm:text-sm">
                                {isEditing ? (
                                  <Input
                                    value={editData.notes || ""}
                                    onChange={(e) => setEditData({ ...editData, notes: e.target.value })}
                                    className="w-20 sm:w-24 h-8 text-xs sm:text-sm"
                                  />
                                ) : (
                                  record?.notes || "-"
                                )}
                              </TableCell>
                              <TableCell className="text-right">
                                {record ? (
                                  isEditing ? (
                                    <div className="flex justify-end gap-1">
                                      <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-7 w-7 sm:h-8 sm:w-8"
                                        onClick={() => handleSaveEdit(record.id)}
                                      >
                                        <Check className="h-3 w-3 sm:h-4 sm:w-4 text-green-600" />
                                      </Button>
                                      <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-7 w-7 sm:h-8 sm:w-8"
                                        onClick={() => {
                                          setEditingId(null)
                                          setEditData({})
                                        }}
                                      >
                                        <X className="h-3 w-3 sm:h-4 sm:w-4" />
                                      </Button>
                                    </div>
                                  ) : (
                                    <div className="flex justify-end gap-1">
                                      <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-7 w-7 sm:h-8 sm:w-8"
                                        onClick={() => handleEdit(record)}
                                      >
                                        <Edit2 className="h-3 w-3 sm:h-4 sm:w-4" />
                                      </Button>
                                      <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-7 w-7 sm:h-8 sm:w-8"
                                        onClick={() => handleDelete(record.id, employee.name)}
                                      >
                                        <Trash2 className="h-3 w-3 sm:h-4 sm:w-4 text-destructive" />
                                      </Button>
                                    </div>
                                  )
                                ) : (
                                  <span className="text-[10px] sm:text-xs text-muted-foreground">No record</span>
                                )}
                              </TableCell>
                            </TableRow>
                          )
                        })}
                        {/* Totals row */}
                        <TableRow className="bg-muted/50 font-semibold">
                          <TableCell className="text-xs sm:text-sm">Total ({employeesWithRecords} records)</TableCell>
                          <TableCell></TableCell>
                          <TableCell className="text-right text-xs sm:text-sm">
                            {totalEarnings.toLocaleString()}
                          </TableCell>
                          <TableCell className="text-right text-xs sm:text-sm">{totalCustomers}</TableCell>
                          <TableCell className="text-right text-xs sm:text-sm">
                            {totalInvestments.toLocaleString()}
                          </TableCell>
                          <TableCell></TableCell>
                          <TableCell></TableCell>
                        </TableRow>
                      </TableBody>
                    </Table>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
