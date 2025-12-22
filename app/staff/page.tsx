import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { DashboardLayout } from "@/components/dashboard-layout"
import { StaffList } from "@/components/staff-list"

export default async function StaffPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/auth/login")
  }

<<<<<<< HEAD
  // Fetch staff for this admin only
  const { data: staff = [] } = await supabase.from("staff").select("*").eq("admin_id", user.id)
=======
  // Fetch staff for the current user only
  const { data: staff = [] } = await supabase
    .from("staff")
    .select("*")
    .eq("owner_id", user.id)
>>>>>>> 344105cb890f3d6d626a94213c40109298ac427f

  return (
    <DashboardLayout userEmail={user.email}>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Staff Members</h1>
          <p className="text-muted-foreground">Manage your team members and their information</p>
        </div>
        <StaffList initialStaff={staff} adminId={user.id} />
      </div>
    </DashboardLayout>
  )
}
