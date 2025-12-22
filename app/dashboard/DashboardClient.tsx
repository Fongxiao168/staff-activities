"use client"

import { DashboardLayout } from "@/components/dashboard-layout"
import { DashboardContent } from "@/components/dashboard-content"
import type { Staff, DailyRecord } from "@/lib/types"

interface DashboardClientProps {
  userEmail: string
  staff: Staff[]
  initialRecords: DailyRecord[]
  trendRecords: DailyRecord[]
}

export default function DashboardClient({ userEmail, staff, initialRecords, trendRecords }: DashboardClientProps) {
  return (
    <DashboardLayout userEmail={userEmail}>
      <DashboardContent staff={staff} initialRecords={initialRecords} trendRecords={trendRecords} />
    </DashboardLayout>
  )
}
