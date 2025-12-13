"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { DashboardLayout } from "./dashboard-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Wand2, FileText, Check, Loader2, AlertCircle, Info, Plus } from "lucide-react"
import { createClient } from "@/lib/supabase/client"

interface SmartEntryFormProps {
  staff: { id: string; name: string }[]
}

const ORDERED_ACTIVITIES = [
  { key: "new_clients", label: "1. Today Added New Clients", isTotal: false },
  { key: "today_trust_love", label: "2. Today's Trust/Love", isTotal: false },
  { key: "total_trust_love", label: "3. Total Trust/Love", isTotal: true },
  { key: "today_hot_chat", label: "4. Today's Hot Chat", isTotal: false },
  { key: "total_hot_chat", label: "5. Total Hot Chat", isTotal: true },
  { key: "today_test_size_cut", label: "6. Today's Test Size Cut", isTotal: false },
  { key: "today_size_cut", label: "7. Today's Size Cut", isTotal: false },
  { key: "today_new_free_task", label: "8. Today's New Free Task", isTotal: false },
  { key: "total_free_task", label: "9. Total Free Task", isTotal: true },
  { key: "today_promote_topup", label: "10. Today's Promote Top-Up", isTotal: false },
  { key: "today_promote_success", label: "11. Today's Promote Success", isTotal: false },
  { key: "today_new_interesting_clients", label: "12. Today's New Interesting Clients", isTotal: false },
  { key: "total_interest_topup", label: "13. Total Interest Top-Up", isTotal: true },
  { key: "today_register", label: "14. Today's Register", isTotal: false },
  { key: "total_register_bonus", label: "15. Total Register Get Bonus", isTotal: true },
  { key: "today_send_voice", label: "16. Today Send Voice", isTotal: false },
  { key: "today_voice_call", label: "17. Today Voice Call", isTotal: false },
  { key: "today_video_call", label: "18. Today Video Call", isTotal: false },
  { key: "first_recharge_amount", label: "19. First Recharge Amount", isTotal: false, isMoney: true },
  { key: "today_topup_amount", label: "20. Total Top-Up Amount (today)", isTotal: false, isMoney: true },
  { key: "client_withdraw_amount", label: "21. Client Withdraw Amount (today)", isTotal: false, isMoney: true },
]

const supabase = createClient()

export function SmartEntryForm({ staff = [] }: SmartEntryFormProps) {
  const router = useRouter()
  const [selectedStaff, setSelectedStaff] = useState("")
  const [recordDate, setRecordDate] = useState(new Date().toISOString().split("T")[0])
  const [pastedText, setPastedText] = useState("")
  const [isProcessing, setIsProcessing] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [extractedData, setExtractedData] = useState<Record<string, number> | null>(null)

  const processData = async () => {
    if (!selectedStaff) {
      setError("Please select a staff member first")
      return
    }

    if (!pastedText.trim()) {
      setError("Please paste some data to process")
      return
    }

    setIsProcessing(true)
    setError(null)

    try {
      const response = await fetch("/api/extract-activities", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: pastedText }),
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || "Failed to process data")
      }

      setExtractedData(result.activities)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to process data")
    } finally {
      setIsProcessing(false)
    }
  }

  const saveRecord = async () => {
    if (!extractedData || !selectedStaff) return

    setIsSaving(true)
    setError(null)

    try {
      const { data: existing } = await supabase
        .from("daily_records")
        .select("id")
        .eq("staff_id", selectedStaff)
        .eq("record_date", recordDate)
        .single()

      const recordData = {
        staff_id: selectedStaff,
        record_date: recordDate,
        new_clients: extractedData.new_clients || 0,
        today_trust_love: extractedData.today_trust_love || 0,
        total_trust_love: extractedData.total_trust_love || 0,
        today_hot_chat: extractedData.today_hot_chat || 0,
        total_hot_chat: extractedData.total_hot_chat || 0,
        today_test_size_cut: extractedData.today_test_size_cut || 0,
        today_size_cut: extractedData.today_size_cut || 0,
        today_new_free_task: extractedData.today_new_free_task || 0,
        total_free_task: extractedData.total_free_task || 0,
        today_promote_topup: extractedData.today_promote_topup || 0,
        today_promote_success: extractedData.today_promote_success || 0,
        today_new_interesting_clients: extractedData.today_new_interesting_clients || 0,
        total_interest_topup: extractedData.total_interest_topup || 0,
        today_register: extractedData.today_register || 0,
        total_register_bonus: extractedData.total_register_bonus || 0,
        today_send_voice: extractedData.today_send_voice || 0,
        today_voice_call: extractedData.today_voice_call || 0,
        today_video_call: extractedData.today_video_call || 0,
        first_recharge_amount: extractedData.first_recharge_amount || 0,
        today_topup_amount: extractedData.today_topup_amount || 0,
        client_withdraw_amount: extractedData.client_withdraw_amount || 0,
      }

      if (existing) {
        const { error: updateError } = await supabase.from("daily_records").update(recordData).eq("id", existing.id)
        if (updateError) throw updateError
      } else {
        const { error: insertError } = await supabase.from("daily_records").insert(recordData)
        if (insertError) throw insertError
      }

      setSuccess(true)
      setTimeout(() => {
        setSuccess(false)
      }, 3000)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save record")
    } finally {
      setIsSaving(false)
    }
  }

  const updateExtractedValue = (key: string, value: number) => {
    if (extractedData) {
      setExtractedData({ ...extractedData, [key]: value })
    }
  }

  const resetForNewEntry = () => {
    setPastedText("")
    setExtractedData(null)
    setError(null)
    setSuccess(false)
  }

  return (
    <DashboardLayout>
      <div className="space-y-4 sm:space-y-6">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-foreground">Smart Data Entry</h1>
          <p className="text-sm text-muted-foreground">
            Paste your activity data and it will automatically extract all 21 metrics
          </p>
        </div>

        {success && (
          <Alert className="bg-green-50 border-green-200">
            <Check className="h-4 w-4 text-green-600" />
            <AlertDescription className="text-green-800">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                <span>Record saved successfully!</span>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={resetForNewEntry}>
                    <Plus className="h-4 w-4 mr-1" />
                    Add Another
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => router.push("/history")}>
                    View History
                  </Button>
                </div>
              </div>
            </AlertDescription>
          </Alert>
        )}

        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <div className="grid gap-4 sm:gap-6 grid-cols-1 lg:grid-cols-2">
          {/* Left Column - Input */}
          <div className="space-y-4">
            <Card>
              <CardHeader className="pb-2 sm:pb-4">
                <CardTitle className="text-base sm:text-lg">Step 1: Select Staff & Date</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label className="text-sm">Staff Member</Label>
                  <Select value={selectedStaff} onValueChange={setSelectedStaff}>
                    <SelectTrigger>
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
                  <Label className="text-sm">Record Date</Label>
                  <Input type="date" value={recordDate} onChange={(e) => setRecordDate(e.target.value)} />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2 sm:pb-4">
                <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                  <FileText className="h-4 w-4 sm:h-5 sm:w-5" />
                  Step 2: Paste Your Data
                </CardTitle>
                <CardDescription className="text-xs sm:text-sm">
                  Paste your activity report - the system will extract the numbers automatically
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <Alert className="bg-blue-50 border-blue-200">
                  <Info className="h-4 w-4 text-blue-600" />
                  <AlertDescription className="text-blue-800 text-xs sm:text-sm">
                    <strong>Supported formats:</strong>
                    <ul className="list-disc ml-4 mt-1 space-y-0.5">
                      <li>Numbered list: "1. 5" or "1) 5" or "1: 5"</li>
                      <li>Labeled: "New Clients: 5" or "Today Added New Clients = 5"</li>
                      <li>Simple numbers: Just paste 21 numbers in order, one per line</li>
                    </ul>
                  </AlertDescription>
                </Alert>

                <div className="space-y-2">
                  <Label className="text-sm">Paste your activity data</Label>
                  <Textarea
                    placeholder={`Example formats:

1. 5
2. 3
3. 45
...up to 21

OR

Today Added New Clients: 5
Today's Trust/Love: 3
Total Trust/Love: 45
...

OR just numbers:
5
3
45
...`}
                    className="min-h-[180px] sm:min-h-[250px] font-mono text-xs sm:text-sm"
                    value={pastedText}
                    onChange={(e) => {
                      setPastedText(e.target.value)
                      setExtractedData(null)
                      setError(null)
                    }}
                  />
                </div>

                <Button onClick={processData} disabled={isProcessing || !selectedStaff} className="w-full">
                  {isProcessing ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    <>
                      <Wand2 className="mr-2 h-4 w-4" />
                      Extract Data
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* Right Column - Extracted Data */}
          <Card>
            <CardHeader className="pb-2 sm:pb-4">
              <CardTitle className="text-base sm:text-lg">Step 3: Review & Save</CardTitle>
              <CardDescription className="text-xs sm:text-sm">
                {extractedData
                  ? "Review the extracted data below. You can edit any values before saving."
                  : "Extracted activity data will appear here"}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {extractedData ? (
                <div className="space-y-4">
                  <div className="grid gap-2 sm:gap-3 max-h-[400px] sm:max-h-[500px] overflow-y-auto pr-2">
                    {ORDERED_ACTIVITIES.map((activity) => (
                      <div
                        key={activity.key}
                        className={`flex items-center justify-between p-2 sm:p-3 rounded-lg ${
                          activity.isTotal ? "bg-muted/50 border border-dashed" : "bg-background border"
                        }`}
                      >
                        <span className="text-xs sm:text-sm font-medium pr-2">{activity.label}</span>
                        <div className="flex items-center gap-1 sm:gap-2 flex-shrink-0">
                          {activity.isMoney && <span className="text-muted-foreground text-xs sm:text-sm">$</span>}
                          <Input
                            type="number"
                            step={activity.isMoney ? "0.01" : "1"}
                            value={extractedData[activity.key] || 0}
                            onChange={(e) => updateExtractedValue(activity.key, Number.parseFloat(e.target.value) || 0)}
                            className="w-16 sm:w-24 text-right h-8 text-xs sm:text-sm"
                          />
                        </div>
                      </div>
                    ))}
                  </div>

                  <Button onClick={saveRecord} disabled={isSaving} className="w-full" size="lg">
                    {isSaving ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      <>
                        <Check className="mr-2 h-4 w-4" />
                        Save Record
                      </>
                    )}
                  </Button>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-8 sm:py-12 text-center text-muted-foreground">
                  <Wand2 className="h-8 w-8 sm:h-12 sm:w-12 mb-4 opacity-50" />
                  <p className="text-sm">No data extracted yet</p>
                  <p className="text-xs">Paste your activity data and click "Extract Data"</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  )
}
