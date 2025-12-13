import useSWR from "swr"
import { createClient } from "@/lib/supabase/client"

export interface FinancialRecord {
  id: string
  staff_id: string
  record_month: string
  monthly_earning: number
  new_customers_developed: number
  total_customer_investment: number
  notes: string | null
  staff?: { name: string }
}

export function useFinancialRecords({ staffId, year, month }: { staffId?: string; year: string; month: string }) {
  const key = ["financial-records", staffId || "all", year, month]
  const fetcher = async () => {
    const supabase = createClient()
    let startDate: string
    let endDate: string
    if (month === "all") {
      startDate = `${year}-01-01`
      endDate = `${year}-12-31`
    } else {
      const lastDay = new Date(Number.parseInt(year), Number.parseInt(month), 0).getDate()
      startDate = `${year}-${month}-01`
      endDate = `${year}-${month}-${lastDay}`
    }
    let query = supabase
      .from("financial_records")
      .select("*, staff(name)")
      .gte("record_month", startDate)
      .lte("record_month", endDate)
      .order("record_month", { ascending: false })
    if (staffId && staffId !== "all") {
      query = query.eq("staff_id", staffId)
    }
    const { data, error } = await query
    if (error) throw error
    return data || []
  }
  const { data, error, isLoading, mutate } = useSWR(key, fetcher, {
    revalidateOnFocus: false,
    dedupingInterval: 60000, // 1 minute cache
  })
  return {
    records: data || [],
    isLoading,
    isError: error,
    mutate,
  }
}
