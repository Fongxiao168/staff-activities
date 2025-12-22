import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { DashboardLayout } from "@/components/dashboard-layout"
import { HistoryContent } from "@/components/history-content"

export default async function HistoryPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/auth/login")
  }

  // Fetch staff for this admin only
  const { data: staff = [] } = await supabase.from("staff").select("*").eq("admin_id", user.id)
  // Fetch daily records for this admin's staff
  const staffIds = staff.map((s) => s.id)
  let initialRecords = []
  if (staffIds.length > 0) {
    const { data } = await supabase.from("daily_records").select("*").in("staff_id", staffIds)
    initialRecords = data || []
  }

  return (
    <DashboardLayout userEmail={user.email}>
      <HistoryContent staff={staff} initialRecords={initialRecords} />
    </DashboardLayout>
  )
}
