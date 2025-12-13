"use client"

import { SWRConfig } from "swr"
import type { ReactNode } from "react"

export function SWRProvider({ children }: { children: ReactNode }) {
  return (
    <SWRConfig
      value={{
        revalidateOnFocus: false,
        revalidateIfStale: false,
        dedupingInterval: 60000, // 1 minute deduplication
        errorRetryCount: 2,
      }}
    >
      {children}
    </SWRConfig>
  )
}
