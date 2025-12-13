import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { SmartEntryForm } from "@/components/smart-entry-form"

export default async function SmartEntryPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/auth/login")
  }

  // Fetch staff
  const { data: staff = [] } = await supabase.from("staff").select("*")

  return <SmartEntryForm staff={staff} />
}
