import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { DashboardLayout } from "@/components/dashboard-layout"
import { ActivityRecordForm } from "@/components/activity-record-form"
import type { Staff } from "@/lib/types"

export default async function NewRecordPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/auth/login")
  }

  const { data: staff } = await supabase
    .from("staff")
    .select("*")
    .eq("is_active", true)
    .order("name", { ascending: true })

  return (
    <DashboardLayout userEmail={user.email}>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Record Daily Activity</h1>
          <p className="text-muted-foreground">Enter the daily work activities for a staff member</p>
        </div>
        <ActivityRecordForm staff={(staff as Staff[]) || []} userId={user.id} />
      </div>
    </DashboardLayout>
  )
}
