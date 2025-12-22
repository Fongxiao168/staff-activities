"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { TrendingUp, Calendar, BarChart3, FileText, Loader2 } from "lucide-react"
import type { Staff, DailyRecord } from "@/lib/types"
import { PerformanceCharts } from "@/components/performance-charts"
import { format, getDaysInMonth } from "date-fns"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover"
import { Checkbox } from "@/components/ui/checkbox"
import { createClient } from "@/lib/supabase/client"

interface DashboardContentProps {
  staff: Staff[]
  initialRecords: DailyRecord[]
  trendRecords: DailyRecord[]
}


const DASHBOARD_ACTIVITIES = [
  { num: 1, key: "new_clients", label: "Today Added New Clients", type: "number" },
  { num: 2, key: "today_trust_love", label: "Today's Trust/Love", type: "number" },
  { num: 3, key: "total_trust_love", label: "Total Trust/Love", type: "number" },
  { num: 4, key: "today_hot_chat", label: "Today's Hot Chat", type: "number" },
  { num: 5, key: "total_hot_chat", label: "Total Hot Chat", type: "number" },
  { num: 6, key: "today_test_size_cut", label: "Today's Test Size Cut", type: "number" },
  { num: 7, key: "today_size_cut", label: "Today's Size Cut", type: "number" },
  { num: 8, key: "today_new_free_task", label: "Today's New Free Task", type: "number" },
  { num: 9, key: "total_free_task", label: "Total Free Task", type: "number" },
  { num: 10, key: "today_promote_topup", label: "Today's Promote Top-Up", type: "number" },
  { num: 11, key: "today_promote_success", label: "Today's Promote Success", type: "number" },
  { num: 12, key: "today_new_interesting_clients", label: "Today's New Interesting Clients", type: "number" },
  { num: 13, key: "total_interest_topup", label: "Total Interest Top-Up", type: "number" },
  { num: 14, key: "today_register", label: "Today's Register", type: "number" },
  { num: 15, key: "total_register_bonus", label: "Total Register Get Bonus", type: "number" },
  { num: 16, key: "today_send_voice", label: "Today Send Voice", type: "number" },
  { num: 17, key: "today_voice_call", label: "Today Voice Call", type: "number" },
  { num: 18, key: "today_video_call", label: "Today Video Call", type: "number" },
  { num: 19, key: "first_recharge_amount", label: "First Recharge Amount", type: "number" },
  { num: 20, key: "today_topup_amount", label: "Total Top-Up Amount (today)", type: "number" },
  { num: 21, key: "client_withdraw_amount", label: "Client Withdraw Amount (today)", type: "number" },
] as const;

type DashboardActivityKey = typeof DASHBOARD_ACTIVITIES[number]["key"];

function aggregateRecords(records: DailyRecord[] = []) {
  const dailyAgg = records.reduce(
    (acc, record) => ({
      new_clients: acc.new_clients + (record.new_clients || 0),
      today_trust_love: acc.today_trust_love + (record.today_trust_love || 0),
      today_hot_chat: acc.today_hot_chat + (record.today_hot_chat || 0),
      today_test_size_cut: acc.today_test_size_cut + (record.today_test_size_cut || 0),
      today_size_cut: acc.today_size_cut + (record.today_size_cut || 0),
      today_new_free_task: acc.today_new_free_task + (record.today_new_free_task || 0),
      today_promote_topup: acc.today_promote_topup + (record.today_promote_topup || 0),
      today_promote_success: acc.today_promote_success + (record.today_promote_success || 0),
      today_new_interesting_clients: acc.today_new_interesting_clients + (record.today_new_interesting_clients || 0),
      today_register: acc.today_register + (record.today_register || 0),
      today_send_voice: acc.today_send_voice + (record.today_send_voice || 0),
      today_voice_call: acc.today_voice_call + (record.today_voice_call || 0),
      today_video_call: acc.today_video_call + (record.today_video_call || 0),
      first_recharge_amount: acc.first_recharge_amount + (Number(record.first_recharge_amount) || 0),
      today_topup_amount: acc.today_topup_amount + (Number(record.today_topup_amount) || 0),
      client_withdraw_amount: acc.client_withdraw_amount + (Number(record.client_withdraw_amount) || 0),
      total_trust_love: acc.total_trust_love + (record.total_trust_love || 0),
      total_hot_chat: acc.total_hot_chat + (record.total_hot_chat || 0),
      total_free_task: acc.total_free_task + (record.total_free_task || 0),
      total_interest_topup: acc.total_interest_topup + (Number(record.total_interest_topup) || 0),
      total_register_bonus: acc.total_register_bonus + (record.total_register_bonus || 0),
    }),
    {
      new_clients: 0,
      today_trust_love: 0,
      today_hot_chat: 0,
      today_test_size_cut: 0,
      today_size_cut: 0,
      today_new_free_task: 0,
      today_promote_topup: 0,
      today_promote_success: 0,
      today_new_interesting_clients: 0,
      today_register: 0,
      today_send_voice: 0,
      today_voice_call: 0,
      today_video_call: 0,
      first_recharge_amount: 0,
      today_topup_amount: 0,
      client_withdraw_amount: 0,
      total_trust_love: 0,
      total_hot_chat: 0,
      total_free_task: 0,
      total_interest_topup: 0,
      total_register_bonus: 0,
    },
  )
  return dailyAgg
}

function getLast30Days() {
  const days = []
  const today = new Date()
  for (let i = 0; i < 30; i++) {
    const date = new Date(today)
    date.setDate(today.getDate() - i)
    days.push({
      value: format(date, "yyyy-MM-dd"),
      label: format(date, "MMM d, yyyy"),
    })
  }
  return days
}

function getLast12Months() {
  const months = []
  const today = new Date()
  for (let i = 0; i < 12; i++) {
    const date = new Date(today.getFullYear(), today.getMonth() - i, 1)
    months.push({
      value: format(date, "yyyy-MM"),
      label: format(date, "MMMM yyyy"),
    })
  }
  return months
}

function getWeeksForMonth(yearMonth: string) {
  const [year, month] = yearMonth.split("-").map(Number)
  const daysInMonth = getDaysInMonth(new Date(year, month - 1))

  const weeks = [
    { value: "1", label: "Week 1 (1st - 7th)", startDay: 1, endDay: 7 },
    { value: "2", label: "Week 2 (8th - 14th)", startDay: 8, endDay: 14 },
    { value: "3", label: "Week 3 (15th - 21st)", startDay: 15, endDay: 21 },
    {
      value: "4",
      label: `Week 4 (22nd - ${daysInMonth}${daysInMonth === 31 ? "st" : daysInMonth === 28 || daysInMonth === 30 ? "th" : "nd"})`,
      startDay: 22,
      endDay: daysInMonth,
    },
  ]

  return weeks
}


export function DashboardContent({ staff = [], initialRecords, trendRecords }: DashboardContentProps) {
  const [selectedStaff, setSelectedStaff] = useState<string>("all")
  const [viewPeriod, setViewPeriod] = useState<"daily" | "weekly" | "monthly">("daily")

  const [selectedDate, setSelectedDate] = useState(format(new Date(), "yyyy-MM-dd"))
  const [selectedMonth, setSelectedMonth] = useState(format(new Date(), "yyyy-MM"))
  const [selectedWeek, setSelectedWeek] = useState("1")
  const [weeklyMonth, setWeeklyMonth] = useState(format(new Date(), "yyyy-MM"))

  const [records, setRecords] = useState<DailyRecord[]>(initialRecords || [])
  const [loading, setLoading] = useState(false)

  // Activity filter state
  const [selectedActivities, setSelectedActivities] = useState<DashboardActivityKey[]>(DASHBOARD_ACTIVITIES.map(a => a.key))

  const supabase = createClient()

  useEffect(() => {
    async function fetchRecords() {
      setLoading(true)
      // Only fetch records for staff belonging to this admin
      const staffIds = staff.map((s) => s.id)
      if (staffIds.length === 0) {
        setRecords([])
        setLoading(false)
        return
      }
      let query = supabase.from("daily_records").select("*, staff(name)").in("staff_id", staffIds)

      if (viewPeriod === "daily") {
        query = query.eq("record_date", selectedDate)
      } else if (viewPeriod === "weekly") {
        const [year, month] = weeklyMonth.split("-").map(Number)
        const weeks = getWeeksForMonth(weeklyMonth)
        const week = weeks.find((w) => w.value === selectedWeek)
        if (week) {
          const startDate = `${weeklyMonth}-${String(week.startDay).padStart(2, "0")}`
          const endDate = `${weeklyMonth}-${String(week.endDay).padStart(2, "0")}`
          query = query.gte("record_date", startDate).lte("record_date", endDate)
        }
      } else if (viewPeriod === "monthly") {
        const startDate = `${selectedMonth}-01`
        const [year, month] = selectedMonth.split("-").map(Number)
        const endDay = getDaysInMonth(new Date(year, month - 1))
        const endDate = `${selectedMonth}-${String(endDay).padStart(2, "0")}`
        query = query.gte("record_date", startDate).lte("record_date", endDate)
      }

      const { data, error } = await query
      if (!error && data) {
        setRecords(data as DailyRecord[])
      }
      setLoading(false)
    }

    fetchRecords()
  }, [viewPeriod, selectedDate, selectedMonth, selectedWeek, weeklyMonth, staff])

  const filterByStaff = (records: DailyRecord[] = []) => {
    if (selectedStaff === "all") return records
    return records.filter((r) => r.staff_id === selectedStaff)
  }

  const filteredRecords = filterByStaff(records || [])
  const filteredTrend = filterByStaff(trendRecords || [])

  const currentAgg = aggregateRecords(filteredRecords)

  // Activity filter handler
  const handleActivityToggle = (key: DashboardActivityKey) => {
    setSelectedActivities((prev) =>
      prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]
    )
  }

  const getPeriodLabel = () => {
    if (viewPeriod === "daily") {
      const days = getLast30Days()
      const day = days.find((d) => d.value === selectedDate)
      return day?.label || selectedDate
    } else if (viewPeriod === "weekly") {
      const weeks = getWeeksForMonth(weeklyMonth)
      const week = weeks.find((w) => w.value === selectedWeek)
      const monthLabel = format(new Date(weeklyMonth + "-01"), "MMMM yyyy")
      return `${week?.label || "Week"} of ${monthLabel}`
    } else {
      return format(new Date(selectedMonth + "-01"), "MMMM yyyy")
    }
  }

  const formatValue = (key: string, value: number, type: string) => {
    if (type === "currency") {
      return `$${value.toFixed(2)}`
    }
    return value.toString()
  }

  const last30Days = getLast30Days()
  const last12Months = getLast12Months()
  const weeksForMonth = getWeeksForMonth(weeklyMonth)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-sm text-muted-foreground">Overview of staff performance and activities</p>
        </div>
        {/* Buttons */}
        <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
          <Select value={selectedStaff} onValueChange={setSelectedStaff}>
            <SelectTrigger className="w-full sm:w-[180px]">
              <SelectValue placeholder="Filter by staff" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Staff</SelectItem>
              {staff.map((s) => (
                <SelectItem key={s.id} value={s.id}>
                  {s.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Link href="/records/smart-entry">
            <Button className="w-full sm:w-auto">
              <FileText className="mr-2 h-4 w-4" />
              Record Activity
            </Button>
          </Link>
        </div>
      </div>



      {/* Period Tabs */}
      <Tabs value={viewPeriod} onValueChange={(v) => setViewPeriod(v as "daily" | "weekly" | "monthly")}> 
        {/* Tabs List */}
        <TabsList className="w-full sm:w-auto flex overflow-x-auto">
          <TabsTrigger value="daily" className="flex-1 sm:flex-none">
            <Calendar className="mr-1 sm:mr-2 h-4 w-4" />
            <span className="hidden xs:inline">Daily</span>
          </TabsTrigger>
          <TabsTrigger value="weekly" className="flex-1 sm:flex-none">
            <BarChart3 className="mr-1 sm:mr-2 h-4 w-4" />
            <span className="hidden xs:inline">Weekly</span>
          </TabsTrigger>
          <TabsTrigger value="monthly" className="flex-1 sm:flex-none">
            <TrendingUp className="mr-1 sm:mr-2 h-4 w-4" />
            <span className="hidden xs:inline">Monthly</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value={viewPeriod} className="mt-4 sm:mt-6 space-y-4 sm:space-y-6">
          {/* Filter Dropdowns */}
          <div className="flex flex-col sm:flex-row sm:flex-wrap sm:items-center gap-2 sm:gap-3">
            {viewPeriod === "daily" && (
              <Select value={selectedDate} onValueChange={setSelectedDate}>
                <SelectTrigger className="w-full sm:w-[200px]">
                  <SelectValue placeholder="Select date" />
                </SelectTrigger>
                <SelectContent>
                  {last30Days.map((day) => (
                    <SelectItem key={day.value} value={day.value}>
                      {day.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}

            {viewPeriod === "weekly" && (
              <>
                <Select
                  value={weeklyMonth}
                  onValueChange={(v) => {
                    setWeeklyMonth(v)
                    setSelectedWeek("1")
                  }}
                >
                  <SelectTrigger className="w-full sm:w-[180px]">
                    <SelectValue placeholder="Select month" />
                  </SelectTrigger>
                  <SelectContent>
                    {last12Months.map((month) => (
                      <SelectItem key={month.value} value={month.value}>
                        {month.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select value={selectedWeek} onValueChange={setSelectedWeek}>
                  <SelectTrigger className="w-full sm:w-[200px]">
                    <SelectValue placeholder="Select week" />
                  </SelectTrigger>
                  <SelectContent>
                    {weeksForMonth.map((week) => (
                      <SelectItem key={week.value} value={week.value}>
                        {week.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </>
            )}

            {viewPeriod === "monthly" && (
              <Select value={selectedMonth} onValueChange={setSelectedMonth}>
                <SelectTrigger className="w-full sm:w-[200px]">
                  <SelectValue placeholder="Select month" />
                </SelectTrigger>
                <SelectContent>
                  {last12Months.map((month) => (
                    <SelectItem key={month.value} value={month.value}>
                      {month.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}

            {loading && <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />}
          </div>

          <p className="text-xs sm:text-sm text-muted-foreground">
            Showing data for: <span className="font-medium">{getPeriodLabel()}</span>
          </p>

          {/* Activity Filter Dropdown */}
          <div className="mb-2 flex justify-end">
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" size="sm" className="min-w-[180px]">
                  {selectedActivities.length === DASHBOARD_ACTIVITIES.length
                    ? "All Activities"
                    : selectedActivities.length === 0
                    ? "No Activities"
                    : `${selectedActivities.length} Selected`}
                </Button>
              </PopoverTrigger>
              <PopoverContent align="end" className="w-64 max-h-72 overflow-y-auto p-2">
                <div className="flex flex-col gap-1">
                  {DASHBOARD_ACTIVITIES.map(activity => (
                    <label key={activity.key} className="flex items-center gap-2 px-1 py-1 rounded hover:bg-muted cursor-pointer text-xs">
                      <Checkbox
                        checked={selectedActivities.includes(activity.key)}
                        onCheckedChange={() => handleActivityToggle(activity.key)}
                        className="h-4 w-4"
                      />
                      <span>{activity.label}</span>
                    </label>
                  ))}
                </div>
              </PopoverContent>
            </Popover>
          </div>
          <Card>
            <CardHeader className="pb-2 sm:pb-4">
              <CardTitle className="text-base sm:text-lg">All Activities (1-21)</CardTitle>
              <CardDescription className="text-xs sm:text-sm">
                Complete metrics for the selected period in order
              </CardDescription>
            </CardHeader>
            <CardContent>
              {/* Responsive Grid */}
              <div className="grid gap-2 sm:gap-4 grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-7">
                {DASHBOARD_ACTIVITIES.filter(a => selectedActivities.includes(a.key)).map((activity) => {
                  const value = currentAgg[activity.key as keyof typeof currentAgg] || 0
                  const isTotal = activity.key.startsWith("total_")
                  return (
                    <div
                      key={activity.key}
                      className={`rounded-lg border p-2 sm:p-4 ${isTotal ? "bg-muted/50 border-dashed" : "bg-card"}`}
                    >
                      <p className="text-[10px] sm:text-xs font-medium text-muted-foreground mb-1 line-clamp-2">
                        {activity.num}. {activity.label}
                      </p>
                      <p className={`text-base sm:text-xl font-bold ${isTotal ? "text-primary" : ""}`}>
                        {formatValue(activity.key, value, activity.type)}
                      </p>
                    </div>
                  )
                })}
              </div>
            </CardContent>
          </Card>

          {/* Summary Stats */}
          <div className="grid gap-3 sm:gap-4 grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="pb-1 sm:pb-2">
                <CardTitle className="text-xs sm:text-sm font-medium">Active Staff</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-xl sm:text-2xl font-bold">{staff.length}</div>
                <p className="text-[10px] sm:text-xs text-muted-foreground">Team members</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-1 sm:pb-2">
                <CardTitle className="text-xs sm:text-sm font-medium">Records This Period</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-xl sm:text-2xl font-bold">{filteredRecords.length}</div>
                <p className="text-[10px] sm:text-xs text-muted-foreground">Activity entries</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-1 sm:pb-2">
                <CardTitle className="text-xs sm:text-sm font-medium">Net Flow</CardTitle>
              </CardHeader>
              <CardContent>
                <div
                  className={`text-xl sm:text-2xl font-bold ${currentAgg.today_topup_amount - currentAgg.client_withdraw_amount >= 0 ? "text-green-600" : "text-red-600"}`}
                >
                  {(currentAgg.today_topup_amount - currentAgg.client_withdraw_amount).toFixed(2)}
                </div>
                <p className="text-[10px] sm:text-xs text-muted-foreground">Top-Up minus Withdrawals</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-1 sm:pb-2">
                <CardTitle className="text-xs sm:text-sm font-medium">Avg per Staff</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-xl sm:text-2xl font-bold">
                  {filteredRecords.length > 0 ? (currentAgg.new_clients / filteredRecords.length).toFixed(1) : 0}
                </div>
                <p className="text-[10px] sm:text-xs text-muted-foreground">New clients per record</p>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      <PerformanceCharts records={filteredTrend} />
    </div>
  )
}
