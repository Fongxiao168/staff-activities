import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { DashboardLayout } from "@/components/dashboard-layout"
import { DashboardContent } from "@/components/dashboard-content"

export default async function DashboardPage() {
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
  // Fetch trend records (for now, same as initialRecords)
  const trendRecords = initialRecords

  return (
    <DashboardLayout userEmail={user.email}>
      <DashboardContent staff={staff} initialRecords={initialRecords} trendRecords={trendRecords} />
    </DashboardLayout>
  )
}
