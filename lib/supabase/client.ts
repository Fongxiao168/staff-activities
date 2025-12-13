import { createBrowserClient } from "@supabase/ssr"
import type { SupabaseClient } from "@supabase/supabase-js"

const SUPABASE_CLIENT_KEY = "__supabase_client__"

let client: ReturnType<typeof createBrowserClient> | null = null

export function createClient(): SupabaseClient {
  // Check if we're in browser environment
  if (typeof window !== "undefined") {
    // Return existing client if already created
    if ((window as any)[SUPABASE_CLIENT_KEY]) {
      return (window as any)[SUPABASE_CLIENT_KEY]
    }

    // Create new client and store globally
    client = createBrowserClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)
    ;(window as any)[SUPABASE_CLIENT_KEY] = client
    return client
  }

  // Server-side fallback (shouldn't happen for browser client)
  return createBrowserClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)
}
