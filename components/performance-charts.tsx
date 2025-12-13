"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  Legend,
} from "recharts"
import type { DailyRecord } from "@/lib/types"
import { format, parseISO } from "date-fns"

interface PerformanceChartsProps {
  records: DailyRecord[]
}

export function PerformanceCharts({ records }: PerformanceChartsProps) {
  // Aggregate records by date
  const dailyData = records.reduce(
    (acc, record) => {
      const date = record.record_date
      if (!acc[date]) {
        acc[date] = {
          date,
          new_clients: 0,
          trust_love: 0,
          hot_chat: 0,
          topup: 0,
          withdraw: 0,
          registrations: 0,
        }
      }
      acc[date].new_clients += record.new_clients || 0
      acc[date].trust_love += record.today_trust_love || 0
      acc[date].hot_chat += record.today_hot_chat || 0
      acc[date].topup += Number(record.today_topup_amount) || 0
      acc[date].withdraw += Number(record.client_withdraw_amount) || 0
      acc[date].registrations += record.today_register || 0
      return acc
    },
    {} as Record<
      string,
      {
        date: string
        new_clients: number
        trust_love: number
        hot_chat: number
        topup: number
        withdraw: number
        registrations: number
      }
    >,
  )

  const chartData = Object.values(dailyData)
    .sort((a, b) => a.date.localeCompare(b.date))
    .map((d) => ({
      ...d,
      dateLabel: format(parseISO(d.date), "MMM d"),
    }))

  // Calculate cumulative totals for trend line
  let cumulativeTrustLove = 0
  let cumulativeHotChat = 0
  const trendData = chartData.map((d) => {
    cumulativeTrustLove += d.trust_love
    cumulativeHotChat += d.hot_chat
    return {
      ...d,
      cumulative_trust_love: cumulativeTrustLove,
      cumulative_hot_chat: cumulativeHotChat,
    }
  })

  if (records.length === 0) {
    return (
      <Card>
        <CardHeader className="pb-2 sm:pb-4">
          <CardTitle className="text-base sm:text-lg">Performance Trends</CardTitle>
          <CardDescription className="text-xs sm:text-sm">No data available for the selected period</CardDescription>
        </CardHeader>
        <CardContent className="flex h-[200px] sm:h-[300px] items-center justify-center text-sm text-muted-foreground">
          Record some activities to see trends here
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="grid gap-4 sm:gap-6 grid-cols-1 lg:grid-cols-2">
      {/* Cumulative Trends */}
      <Card>
        <CardHeader className="pb-2 sm:pb-4">
          <CardTitle className="text-base sm:text-lg">Cumulative Trends</CardTitle>
          <CardDescription className="text-xs sm:text-sm">Total Trust/Love and Hot Chat over time</CardDescription>
        </CardHeader>
        <CardContent className="pl-0 sm:pl-2">
          <ResponsiveContainer width="100%" height={220} className="sm:!h-[300px]">
            <LineChart data={trendData} margin={{ top: 5, right: 10, left: -10, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis
                dataKey="dateLabel"
                className="text-[10px] sm:text-xs"
                tick={{ fill: "currentColor", fontSize: 10 }}
              />
              <YAxis className="text-[10px] sm:text-xs" tick={{ fill: "currentColor", fontSize: 10 }} width={30} />
              <Tooltip
                contentStyle={{
                  backgroundColor: "hsl(var(--card))",
                  border: "1px solid hsl(var(--border))",
                  borderRadius: "var(--radius)",
                  fontSize: "12px",
                }}
                labelStyle={{ color: "hsl(var(--foreground))" }}
              />
              <Legend wrapperStyle={{ fontSize: "10px" }} />
              <Line
                type="monotone"
                dataKey="cumulative_trust_love"
                name="Total Trust/Love"
                stroke="hsl(var(--chart-1))"
                strokeWidth={2}
                dot={false}
              />
              <Line
                type="monotone"
                dataKey="cumulative_hot_chat"
                name="Total Hot Chat"
                stroke="hsl(var(--chart-2))"
                strokeWidth={2}
                dot={false}
              />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Daily New Clients */}
      <Card>
        <CardHeader className="pb-2 sm:pb-4">
          <CardTitle className="text-base sm:text-lg">Daily New Clients</CardTitle>
          <CardDescription className="text-xs sm:text-sm">New clients added each day</CardDescription>
        </CardHeader>
        <CardContent className="pl-0 sm:pl-2">
          <ResponsiveContainer width="100%" height={220} className="sm:!h-[300px]">
            <BarChart data={chartData} margin={{ top: 5, right: 10, left: -10, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis
                dataKey="dateLabel"
                className="text-[10px] sm:text-xs"
                tick={{ fill: "currentColor", fontSize: 10 }}
              />
              <YAxis className="text-[10px] sm:text-xs" tick={{ fill: "currentColor", fontSize: 10 }} width={30} />
              <Tooltip
                contentStyle={{
                  backgroundColor: "hsl(var(--card))",
                  border: "1px solid hsl(var(--border))",
                  borderRadius: "var(--radius)",
                  fontSize: "12px",
                }}
                labelStyle={{ color: "hsl(var(--foreground))" }}
              />
              <Bar dataKey="new_clients" name="New Clients" fill="hsl(var(--chart-3))" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Financial Overview */}
      <Card>
        <CardHeader className="pb-2 sm:pb-4">
          <CardTitle className="text-base sm:text-lg">Financial Overview</CardTitle>
          <CardDescription className="text-xs sm:text-sm">Top-ups vs Withdrawals</CardDescription>
        </CardHeader>
        <CardContent className="pl-0 sm:pl-2">
          <ResponsiveContainer width="100%" height={220} className="sm:!h-[300px]">
            <BarChart data={chartData} margin={{ top: 5, right: 10, left: -10, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis
                dataKey="dateLabel"
                className="text-[10px] sm:text-xs"
                tick={{ fill: "currentColor", fontSize: 10 }}
              />
              <YAxis
                className="text-[10px] sm:text-xs"
                tick={{ fill: "currentColor", fontSize: 10 }}
                width={35}
                tickFormatter={(v) => `$${v}`}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: "hsl(var(--card))",
                  border: "1px solid hsl(var(--border))",
                  borderRadius: "var(--radius)",
                  fontSize: "12px",
                }}
                labelStyle={{ color: "hsl(var(--foreground))" }}
                formatter={(value: number) => [`$${value.toFixed(2)}`, ""]}
              />
              <Legend wrapperStyle={{ fontSize: "10px" }} />
              <Bar dataKey="topup" name="Top-Up" fill="hsl(var(--chart-4))" radius={[4, 4, 0, 0]} />
              <Bar dataKey="withdraw" name="Withdraw" fill="hsl(var(--chart-5))" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Daily Activity */}
      <Card>
        <CardHeader className="pb-2 sm:pb-4">
          <CardTitle className="text-base sm:text-lg">Daily Activity</CardTitle>
          <CardDescription className="text-xs sm:text-sm">Trust/Love and Hot Chat per day</CardDescription>
        </CardHeader>
        <CardContent className="pl-0 sm:pl-2">
          <ResponsiveContainer width="100%" height={220} className="sm:!h-[300px]">
            <LineChart data={chartData} margin={{ top: 5, right: 10, left: -10, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis
                dataKey="dateLabel"
                className="text-[10px] sm:text-xs"
                tick={{ fill: "currentColor", fontSize: 10 }}
              />
              <YAxis className="text-[10px] sm:text-xs" tick={{ fill: "currentColor", fontSize: 10 }} width={30} />
              <Tooltip
                contentStyle={{
                  backgroundColor: "hsl(var(--card))",
                  border: "1px solid hsl(var(--border))",
                  borderRadius: "var(--radius)",
                  fontSize: "12px",
                }}
                labelStyle={{ color: "hsl(var(--foreground))" }}
              />
              <Legend wrapperStyle={{ fontSize: "10px" }} />
              <Line
                type="monotone"
                dataKey="trust_love"
                name="Trust/Love"
                stroke="hsl(var(--chart-1))"
                strokeWidth={2}
              />
              <Line type="monotone" dataKey="hot_chat" name="Hot Chat" stroke="hsl(var(--chart-2))" strokeWidth={2} />
              <Line
                type="monotone"
                dataKey="registrations"
                name="Registrations"
                stroke="hsl(var(--chart-3))"
                strokeWidth={2}
              />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  )
}
