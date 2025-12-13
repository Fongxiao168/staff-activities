import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { DashboardLayout } from "@/components/dashboard-layout"
import { FinancialContent } from "@/components/financial-content"

export default async function FinancialPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/auth/login")
  }

  // Fetch staff
  const { data: staff = [] } = await supabase.from("staff").select("*")

  return (
    <DashboardLayout userEmail={user.email}>
      <FinancialContent userId={user.id} staff={staff} />
    </DashboardLayout>
  )
}
