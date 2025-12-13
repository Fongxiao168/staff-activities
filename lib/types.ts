// Type definitions for the Staff Activity Tracker

export interface Staff {
  id: string
  name: string
  email: string | null
  department: string | null
  position: string | null
  date_of_joining: string // ISO date string (YYYY-MM-DD)
  created_at: string
  updated_at: string
  is_active: boolean
}

export interface DailyRecord {
  id: string
  staff_id: string
  record_date: string

  // Today's metrics
  new_clients: number
  today_trust_love: number
  today_hot_chat: number
  today_test_size_cut: number
  today_size_cut: number
  today_new_free_task: number
  today_promote_topup: number
  today_promote_success: number
  today_new_interesting_clients: number
  today_register: number
  today_send_voice: number
  today_voice_call: number
  today_video_call: number
  first_recharge_amount: number
  today_topup_amount: number
  client_withdraw_amount: number

  // Cumulative totals
  total_trust_love: number
  total_hot_chat: number
  total_free_task: number
  total_interest_topup: number
  total_register_bonus: number

  created_at: string
  updated_at: string
  created_by: string | null

  // Joined data
  staff?: Staff
}

export interface DailyRecordInput {
  staff_id: string
  record_date: string
  new_clients: number
  today_trust_love: number
  today_hot_chat: number
  today_test_size_cut: number
  today_size_cut: number
  today_new_free_task: number
  today_promote_topup: number
  today_promote_success: number
  today_new_interesting_clients: number
  today_register: number
  today_send_voice: number
  today_voice_call: number
  today_video_call: number
  first_recharge_amount: number
  today_topup_amount: number
  client_withdraw_amount: number
}

export interface WeeklyAggregate {
  week_start: string
  week_end: string
  staff_id: string
  staff_name: string
  total_new_clients: number
  total_trust_love_added: number
  total_hot_chat_added: number
  total_test_size_cut: number
  total_size_cut: number
  total_new_free_task: number
  total_promote_topup: number
  total_promote_success: number
  total_new_interesting_clients: number
  total_register: number
  total_first_recharge: number
  total_topup: number
  total_withdraw: number
  latest_total_trust_love: number
  latest_total_hot_chat: number
  latest_total_free_task: number
  latest_total_interest_topup: number
  latest_total_register_bonus: number
}

export interface MonthlyAggregate {
  month: string
  year: number
  staff_id: string
  staff_name: string
  total_new_clients: number
  total_trust_love_added: number
  total_hot_chat_added: number
  total_test_size_cut: number
  total_size_cut: number
  total_new_free_task: number
  total_promote_topup: number
  total_promote_success: number
  total_new_interesting_clients: number
  total_register: number
  total_first_recharge: number
  total_topup: number
  total_withdraw: number
  latest_total_trust_love: number
  latest_total_hot_chat: number
  latest_total_free_task: number
  latest_total_interest_topup: number
  latest_total_register_bonus: number
}

// Activity field metadata for forms and display
export const ACTIVITY_FIELDS = [
  { key: "new_clients", label: "Today Added New Clients", type: "number", isDaily: true },
  { key: "today_trust_love", label: "Today's Trust/Love", type: "number", isDaily: true },
  { key: "total_trust_love", label: "Total Trust/Love", type: "number", isDaily: false },
  { key: "today_hot_chat", label: "Today's Hot Chat", type: "number", isDaily: true },
  { key: "total_hot_chat", label: "Total Hot Chat", type: "number", isDaily: false },
  { key: "today_test_size_cut", label: "Today's Test Size Cut", type: "number", isDaily: true },
  { key: "today_size_cut", label: "Today's Size Cut", type: "number", isDaily: true },
  { key: "today_new_free_task", label: "Today's New Free Task", type: "number", isDaily: true },
  { key: "total_free_task", label: "Total Free Task", type: "number", isDaily: false },
  { key: "today_promote_topup", label: "Today's Promote Top-Up", type: "number", isDaily: true },
  { key: "today_promote_success", label: "Today's Promote Success", type: "number", isDaily: true },
  { key: "today_new_interesting_clients", label: "Today's New Interesting Clients", type: "number", isDaily: true },
  { key: "total_interest_topup", label: "Total Interest Top-Up", type: "currency", isDaily: false },
  { key: "today_register", label: "Today's Register", type: "number", isDaily: true },
  { key: "total_register_bonus", label: "Total Register Get Bonus", type: "number", isDaily: false },
  { key: "first_recharge_amount", label: "First Recharge Amount", type: "currency", isDaily: true },
  { key: "today_topup_amount", label: "Total Top-Up Amount (today)", type: "currency", isDaily: true },
  { key: "client_withdraw_amount", label: "Client Withdraw Amount (today)", type: "currency", isDaily: true },
  { key: "today_send_voice", label: "Today's Send Voice", type: "number", isDaily: true },
  { key: "today_voice_call", label: "Today's Voice Call", type: "number", isDaily: true },
  { key: "today_video_call", label: "Today's Video Call", type: "number", isDaily: true },
] as const

export type ActivityFieldKey = (typeof ACTIVITY_FIELDS)[number]["key"]
