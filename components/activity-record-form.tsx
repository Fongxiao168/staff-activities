"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Loader2, Save, UserX } from "lucide-react"
import type { Staff, DailyRecord } from "@/lib/types"
import { format } from "date-fns"

interface ActivityRecordFormProps {
  staff: Staff[]
  userId: string
  existingRecord?: DailyRecord
}

const defaultFormData = {
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
}

const ORDERED_ACTIVITIES = [
  { num: 1, key: "new_clients", label: "Today Added New Clients", type: "number", isInput: true },
  { num: 2, key: "today_trust_love", label: "Today's Trust/Love", type: "number", isInput: true },
  { num: 3, key: "total_trust_love", label: "Total Trust/Love", type: "number", isInput: false },
  { num: 4, key: "today_hot_chat", label: "Today's Hot Chat", type: "number", isInput: true },
  { num: 5, key: "total_hot_chat", label: "Total Hot Chat", type: "number", isInput: false },
  { num: 6, key: "today_test_size_cut", label: "Today's Test Size Cut", type: "number", isInput: true },
  { num: 7, key: "today_size_cut", label: "Today's Size Cut", type: "number", isInput: true },
  { num: 8, key: "today_new_free_task", label: "Today's New Free Task", type: "number", isInput: true },
  { num: 9, key: "total_free_task", label: "Total Free Task", type: "number", isInput: false },
  { num: 10, key: "today_promote_topup", label: "Today's Promote Top-Up", type: "number", isInput: true },
  { num: 11, key: "today_promote_success", label: "Today's Promote Success", type: "number", isInput: true },
  {
    num: 12,
    key: "today_new_interesting_clients",
    label: "Today's New Interesting Clients",
    type: "number",
    isInput: true,
  },
  { num: 13, key: "total_interest_topup", label: "Total Interest Top-Up", type: "currency", isInput: false },
  { num: 14, key: "today_register", label: "Today's Register", type: "number", isInput: true },
  { num: 15, key: "total_register_bonus", label: "Total Register Get Bonus", type: "number", isInput: false },
  { num: 16, key: "today_send_voice", label: "Today Send Voice", type: "number", isInput: true },
  { num: 17, key: "today_voice_call", label: "Today Voice Call", type: "number", isInput: true },
  { num: 18, key: "today_video_call", label: "Today Video Call", type: "number", isInput: true },
  { num: 19, key: "first_recharge_amount", label: "First Recharge Amount", type: "currency", isInput: true },
  { num: 20, key: "today_topup_amount", label: "Total Top-Up Amount (today)", type: "currency", isInput: true },
  { num: 21, key: "client_withdraw_amount", label: "Client Withdraw Amount (today)", type: "currency", isInput: true },
] as const

export function ActivityRecordForm({ staff, userId, existingRecord }: ActivityRecordFormProps) {
  const router = useRouter()
  const [selectedStaffId, setSelectedStaffId] = useState(existingRecord?.staff_id || "")
  const [selectedDate, setSelectedDate] = useState(existingRecord?.record_date || format(new Date(), "yyyy-MM-dd"))
  const [formData, setFormData] = useState(defaultFormData)
  const [previousTotals, setPreviousTotals] = useState({
    total_trust_love: 0,
    total_hot_chat: 0,
    total_free_task: 0,
    total_interest_topup: 0,
    total_register_bonus: 0,
  })
  const [isLoading, setIsLoading] = useState(false)
  const [isFetching, setIsFetching] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  // Fetch existing record when staff/date changes
  useEffect(() => {
    if (!selectedStaffId || !selectedDate) return

    const fetchRecord = async () => {
      setIsFetching(true)
      setError(null)
      const supabase = createClient()

      // Check for existing record on this date
      const { data: existingData } = await supabase
        .from("daily_records")
        .select("*")
        .eq("staff_id", selectedStaffId)
        .eq("record_date", selectedDate)
        .single()

      if (existingData) {
        // Load existing record
        setFormData({
          new_clients: existingData.new_clients || 0,
          today_trust_love: existingData.today_trust_love || 0,
          today_hot_chat: existingData.today_hot_chat || 0,
          today_test_size_cut: existingData.today_test_size_cut || 0,
          today_size_cut: existingData.today_size_cut || 0,
          today_new_free_task: existingData.today_new_free_task || 0,
          today_promote_topup: existingData.today_promote_topup || 0,
          today_promote_success: existingData.today_promote_success || 0,
          today_new_interesting_clients: existingData.today_new_interesting_clients || 0,
          today_register: existingData.today_register || 0,
          today_send_voice: existingData.today_send_voice || 0,
          today_voice_call: existingData.today_voice_call || 0,
          today_video_call: existingData.today_video_call || 0,
          first_recharge_amount: existingData.first_recharge_amount || 0,
          today_topup_amount: existingData.today_topup_amount || 0,
          client_withdraw_amount: existingData.client_withdraw_amount || 0,
        })
        setPreviousTotals({
          total_trust_love: (existingData.total_trust_love || 0) - (existingData.today_trust_love || 0),
          total_hot_chat: (existingData.total_hot_chat || 0) - (existingData.today_hot_chat || 0),
          total_free_task: (existingData.total_free_task || 0) - (existingData.today_new_free_task || 0),
          total_interest_topup: (existingData.total_interest_topup || 0) - (existingData.today_topup_amount || 0),
          total_register_bonus: (existingData.total_register_bonus || 0) - (existingData.today_register || 0),
        })
      } else {
        // Fetch previous totals from most recent record
        setFormData(defaultFormData)
        const { data: prevRecord } = await supabase
          .from("daily_records")
          .select("total_trust_love, total_hot_chat, total_free_task, total_interest_topup, total_register_bonus")
          .eq("staff_id", selectedStaffId)
          .lt("record_date", selectedDate)
          .order("record_date", { ascending: false })
          .limit(1)
          .single()

        if (prevRecord) {
          setPreviousTotals({
            total_trust_love: prevRecord.total_trust_love || 0,
            total_hot_chat: prevRecord.total_hot_chat || 0,
            total_free_task: prevRecord.total_free_task || 0,
            total_interest_topup: prevRecord.total_interest_topup || 0,
            total_register_bonus: prevRecord.total_register_bonus || 0,
          })
        } else {
          setPreviousTotals({
            total_trust_love: 0,
            total_hot_chat: 0,
            total_free_task: 0,
            total_interest_topup: 0,
            total_register_bonus: 0,
          })
        }
      }

      setIsFetching(false)
    }

    fetchRecord()
  }, [selectedStaffId, selectedDate])

  const handleInputChange = (field: keyof typeof formData, value: string) => {
    const numValue = value === "" ? 0 : Number.parseFloat(value)
    setFormData((prev) => ({ ...prev, [field]: Number.isNaN(numValue) ? 0 : numValue }))
  }

  const computedTotals = {
    total_trust_love: previousTotals.total_trust_love + formData.today_trust_love,
    total_hot_chat: previousTotals.total_hot_chat + formData.today_hot_chat,
    total_free_task: previousTotals.total_free_task + formData.today_new_free_task,
    total_interest_topup: previousTotals.total_interest_topup + formData.today_topup_amount,
    total_register_bonus: previousTotals.total_register_bonus + formData.today_register,
  }

  const getFieldValue = (key: string) => {
    if (key in formData) {
      return formData[key as keyof typeof formData]
    }
    if (key in computedTotals) {
      return computedTotals[key as keyof typeof computedTotals]
    }
    return 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedStaffId) {
      setError("Please select a staff member")
      return
    }

    setIsLoading(true)
    setError(null)
    setSuccess(false)

    const supabase = createClient()

    // Calculate new totals
    const recordData = {
      staff_id: selectedStaffId,
      record_date: selectedDate,
      ...formData,
      total_trust_love: computedTotals.total_trust_love,
      total_hot_chat: computedTotals.total_hot_chat,
      total_free_task: computedTotals.total_free_task,
      total_interest_topup: computedTotals.total_interest_topup,
      total_register_bonus: computedTotals.total_register_bonus,
      created_by: userId,
    }

    // Upsert the record (insert or update if exists)
    const { error: dbError } = await supabase.from("daily_records").upsert(recordData, {
      onConflict: "staff_id,record_date",
    })

    setIsLoading(false)

    if (dbError) {
      setError(dbError.message)
      return
    }

    setSuccess(true)
    setTimeout(() => setSuccess(false), 3000)
  }

  if (staff.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12">
          <div className="rounded-full bg-muted p-4">
            <UserX className="h-8 w-8 text-muted-foreground" />
          </div>
          <h3 className="mt-4 font-semibold">No Active Staff Members</h3>
          <p className="mt-1 text-center text-sm text-muted-foreground">
            Add staff members first before recording activities
          </p>
          <Button className="mt-4" onClick={() => router.push("/staff")}>
            Go to Staff Management
          </Button>
        </CardContent>
      </Card>
    )
  }

  return (
    <form onSubmit={handleSubmit}>
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Selection Panel */}
        <Card>
          <CardHeader>
            <CardTitle>Select Staff & Date</CardTitle>
            <CardDescription>Choose who and when to record</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="staff">Staff Member</Label>
              <Select value={selectedStaffId} onValueChange={setSelectedStaffId}>
                <SelectTrigger id="staff">
                  <SelectValue placeholder="Select staff member" />
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
              <Label htmlFor="date">Date</Label>
              <Input id="date" type="date" value={selectedDate} onChange={(e) => setSelectedDate(e.target.value)} />
            </div>

            {isFetching && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" />
                Loading record...
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Daily Activities (1-21)</CardTitle>
            <CardDescription>
              Enter the activity values in order. Gray fields are auto-calculated totals.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {ORDERED_ACTIVITIES.map((activity) => (
                <div key={activity.key} className="space-y-2">
                  <Label htmlFor={activity.key} className={!activity.isInput ? "text-muted-foreground" : ""}>
                    {activity.num}. {activity.label}
                  </Label>
                  {activity.isInput ? (
                    <Input
                      id={activity.key}
                      type="number"
                      min="0"
                      step={activity.type === "currency" ? "0.01" : "1"}
                      value={formData[activity.key as keyof typeof formData] || ""}
                      onChange={(e) => handleInputChange(activity.key as keyof typeof formData, e.target.value)}
                      placeholder={activity.type === "currency" ? "0.00" : "0"}
                    />
                  ) : (
                    <div className="flex h-10 items-center rounded-md border border-input bg-muted px-3 text-sm font-medium">
                      {activity.type === "currency"
                        ? `$${getFieldValue(activity.key).toFixed(2)}`
                        : getFieldValue(activity.key)}
                    </div>
                  )}
                </div>
              ))}
            </div>

            {error && <p className="mt-4 text-sm text-destructive">{error}</p>}
            {success && <p className="mt-4 text-sm text-green-600">Record saved successfully!</p>}

            <div className="mt-6 flex justify-end gap-3">
              <Button type="button" variant="outline" onClick={() => router.push("/history")}>
                View History
              </Button>
              <Button type="submit" disabled={isLoading || !selectedStaffId}>
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="mr-2 h-4 w-4" />
                    Save Record
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </form>
  )
}
