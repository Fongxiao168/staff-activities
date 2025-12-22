import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import DashboardClient from "./DashboardClient"

export default async function DashboardPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/auth/login")
  "use client"
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
  // Fetch trend records (for now, same as initialRecords)
  const trendRecords = initialRecords

  return (
    <DashboardClient
      userEmail={user.email}
      staff={staff}
      initialRecords={initialRecords}
      trendRecords={trendRecords}
    />
  )
}
