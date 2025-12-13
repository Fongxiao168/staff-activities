"use client"

import useSWR from "swr"
import { createClient } from "@/lib/supabase/client"
import type { Staff } from "@/lib/types"

const fetcher = async () => {
  const supabase = createClient()
  const { data, error } = await supabase
    .from("staff")
    .select("*")
    .eq("is_active", true)
    .order("name", { ascending: true })

  if (error) throw error
  return data as Staff[]
}

export function useStaff() {
  const { data, error, isLoading, mutate } = useSWR("staff-list", fetcher, {
    revalidateOnMount: true,
    dedupingInterval: 30000, // Cache for 30 seconds
  })

  return {
    staff: data || [],
    isLoading,
    isError: error,
    mutate,
  }
}
