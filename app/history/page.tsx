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

  // Fetch staff
  const { data: staff = [] } = await supabase.from("staff").select("*")
  // Fetch daily records
  const { data: initialRecords = [] } = await supabase.from("daily_records").select("*")

  return (
    <DashboardLayout userEmail={user.email}>
      <HistoryContent staff={staff} initialRecords={initialRecords} />
    </DashboardLayout>
  )
}
