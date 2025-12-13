"use client"

import type React from "react"

import { useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
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
import { Search, Pencil, Trash2, Loader2, FileX, Calendar, User } from "lucide-react"
import type { Staff, DailyRecord } from "@/lib/types"
import { format, parseISO } from "date-fns"

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

interface HistoryContentProps {
  staff: Staff[]
  initialRecords: DailyRecord[]
}

export function HistoryContent({ staff = [], initialRecords }: HistoryContentProps) {
  const [selectedStaff, setSelectedStaff] = useState<string>("")
  const [selectedDate, setSelectedDate] = useState("")
  const [isSearching, setIsSearching] = useState(false)
  const [record, setRecord] = useState<DailyRecord | null>(null)
  const [hasSearched, setHasSearched] = useState(false)

  const [isEditOpen, setIsEditOpen] = useState(false)
  const [isDeleteOpen, setIsDeleteOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [editFormData, setEditFormData] = useState<Record<string, number>>({})

  const handleSearch = async () => {
    if (!selectedStaff || !selectedDate) {
      setError("Please select both staff member and date")
      return
    }

    setIsSearching(true)
    setError(null)
    setHasSearched(true)
    const supabase = createClient()

    const { data, error: fetchError } = await supabase
      .from("daily_records")
      .select("*, staff(*)")
      .eq("staff_id", selectedStaff)
      .eq("record_date", selectedDate)
      .single()

    setIsSearching(false)

    if (fetchError && fetchError.code !== "PGRST116") {
      setError(fetchError.message)
      setRecord(null)
      return
    }

    setRecord(data as DailyRecord | null)
  }

  const handleClearFilters = () => {
    setSelectedStaff("")
    setSelectedDate("")
    setRecord(null)
    setHasSearched(false)
    setError(null)
  }

  const openEdit = () => {
    if (!record) return
    const formData: Record<string, number> = {}
    ORDERED_ACTIVITIES.forEach((activity) => {
      formData[activity.key] = Number(record[activity.key as keyof DailyRecord]) || 0
    })
    setEditFormData(formData)
    setIsEditOpen(true)
  }

  const openDelete = () => {
    setIsDeleteOpen(true)
  }

  const handleEditInputChange = (field: string, value: string) => {
    const numValue = value === "" ? 0 : Number.parseFloat(value)
    setEditFormData((prev) => ({ ...prev, [field]: Number.isNaN(numValue) ? 0 : numValue }))
  }

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!record) return

    setIsLoading(true)
    setError(null)

    const supabase = createClient()

    const { error: dbError } = await supabase.from("daily_records").update(editFormData).eq("id", record.id)

    setIsLoading(false)

    if (dbError) {
      setError(dbError.message)
      return
    }

    // Refresh record
    await handleSearch()
    setIsEditOpen(false)
  }

  const handleDelete = async () => {
    if (!record) return

    setIsLoading(true)
    const supabase = createClient()
    const { error: dbError } = await supabase.from("daily_records").delete().eq("id", record.id)

    setIsLoading(false)

    if (dbError) {
      setError(dbError.message)
      return
    }

    setRecord(null)
    setHasSearched(false)
    setIsDeleteOpen(false)
  }

  const getStaffName = (rec: DailyRecord) => {
    if (rec.staff && typeof rec.staff === "object" && "name" in rec.staff) {
      return rec.staff.name
    }
    const staffMember = staff.find((s) => s.id === rec.staff_id)
    return staffMember?.name || "Unknown"
  }

  const getSelectedStaffName = () => {
    const staffMember = staff.find((s) => s.id === selectedStaff)
    return staffMember?.name || ""
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      <div>
        <h1 className="text-xl sm:text-2xl font-bold tracking-tight">Activity History</h1>
        <p className="text-sm text-muted-foreground">View activity record by staff and date</p>
      </div>

      <Card>
        <CardHeader className="pb-2 sm:pb-4">
          <CardTitle className="text-base sm:text-lg">Find Record</CardTitle>
          <CardDescription className="text-xs sm:text-sm">
            Select a staff member and date to view their activity record
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row sm:flex-wrap sm:items-end gap-3 sm:gap-4">
            <div className="space-y-2 w-full sm:w-auto">
              <Label className="flex items-center gap-2 text-sm">
                <User className="h-4 w-4" />
                Staff Member
              </Label>
              <Select value={selectedStaff} onValueChange={setSelectedStaff}>
                <SelectTrigger className="w-full sm:w-[200px]">
                  <SelectValue placeholder="Select staff" />
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
            <div className="space-y-2 w-full sm:w-auto">
              <Label className="flex items-center gap-2 text-sm">
                <Calendar className="h-4 w-4" />
                Date
              </Label>
              <Input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="w-full sm:w-[200px]"
              />
            </div>
            <div className="flex gap-2 w-full sm:w-auto">
              <Button
                onClick={handleSearch}
                disabled={isSearching || !selectedStaff || !selectedDate}
                className="flex-1 sm:flex-none"
              >
                {isSearching ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Search className="mr-2 h-4 w-4" />}
                Search
              </Button>
              <Button variant="outline" onClick={handleClearFilters} className="flex-1 sm:flex-none bg-transparent">
                Clear
              </Button>
            </div>
          </div>
          {error && <p className="mt-4 text-sm text-destructive">{error}</p>}
        </CardContent>
      </Card>

      {hasSearched && (
        <Card>
          <CardHeader className="pb-2 sm:pb-4">
            <CardTitle className="text-base sm:text-lg">
              {record ? (
                <>
                  Record for {getStaffName(record)} - {format(parseISO(record.record_date), "MMMM d, yyyy")}
                </>
              ) : (
                "No Record Found"
              )}
            </CardTitle>
            {record && (
              <CardDescription className="text-xs sm:text-sm">
                All 21 activity metrics for the selected date
              </CardDescription>
            )}
          </CardHeader>
          <CardContent>
            {!record ? (
              <div className="flex flex-col items-center justify-center py-8 sm:py-12">
                <div className="rounded-full bg-muted p-3 sm:p-4">
                  <FileX className="h-6 w-6 sm:h-8 sm:w-8 text-muted-foreground" />
                </div>
                <h3 className="mt-4 font-semibold text-sm sm:text-base">No Record Found</h3>
                <p className="mt-1 text-xs sm:text-sm text-muted-foreground text-center px-4">
                  No activity record exists for {getSelectedStaffName()} on{" "}
                  {selectedDate ? format(parseISO(selectedDate), "MMMM d, yyyy") : "selected date"}
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="grid gap-2 sm:gap-3 grid-cols-2 lg:grid-cols-3">
                  {ORDERED_ACTIVITIES.map((activity) => (
                    <div
                      key={activity.key}
                      className={`p-2 sm:p-3 rounded-lg ${
                        activity.isTotal ? "bg-muted/50 border border-dashed" : "bg-background border"
                      }`}
                    >
                      <p className="text-[10px] sm:text-xs text-muted-foreground line-clamp-2">{activity.label}</p>
                      <p className="text-sm sm:text-lg font-semibold mt-1">
                        {activity.isMoney
                          ? Number(record[activity.key as keyof DailyRecord] || 0)
                          : record[activity.key as keyof DailyRecord] || 0}
                      </p>
                    </div>
                  ))}
                </div>

                <div className="flex flex-col sm:flex-row gap-2 pt-4 border-t">
                  <Button variant="outline" onClick={openEdit} className="w-full sm:w-auto bg-transparent">
                    <Pencil className="mr-2 h-4 w-4" />
                    Edit Record
                  </Button>
                  <Button variant="destructive" onClick={openDelete} className="w-full sm:w-auto">
                    <Trash2 className="mr-2 h-4 w-4" />
                    Delete Record
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Edit Dialog */}
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Record</DialogTitle>
            <DialogDescription>
              {record && `${getStaffName(record)} - ${format(parseISO(record.record_date), "MMMM d, yyyy")}`}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSaveEdit}>
            <div className="grid gap-3 py-4 sm:grid-cols-2 max-h-[60vh] overflow-y-auto pr-2">
              {ORDERED_ACTIVITIES.map((activity) => (
                <div key={activity.key} className={`space-y-1 p-2 rounded ${activity.isTotal ? "bg-muted/50" : ""}`}>
                  <Label className="text-xs">{activity.label}</Label>
                  <Input
                    type="number"
                    step={activity.isMoney ? "0.01" : "1"}
                    min="0"
                    value={editFormData[activity.key] || ""}
                    onChange={(e) => handleEditInputChange(activity.key, e.target.value)}
                  />
                </div>
              ))}
            </div>
            {error && <p className="text-sm text-destructive mb-4">{error}</p>}
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsEditOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={isLoading}>
                {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                Save Changes
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <AlertDialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Record</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this record? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={isLoading}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
