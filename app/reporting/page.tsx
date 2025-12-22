"use client"

import React, { useEffect, useState } from "react"
import { Table, TableHeader, TableBody, TableHead, TableRow, TableCell } from "@/components/ui/table"
import { Card } from "@/components/ui/card"
import { PerformanceCharts } from "@/components/performance-charts"
import { TableSkeleton } from "@/components/loading-skeleton"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select"
import { Calendar } from "@/components/ui/calendar"
import { createClient } from "@/lib/supabase/client"
import { useStaff } from "@/hooks/use-staff"
import { useEffect as useEffectOrig } from "react"
import type { DailyRecord } from "@/lib/types"

const ALL_COLUMNS = [
	{ key: "record_date", label: "Date" },
	{ key: "staff", label: "Staff" },
	{ key: "new_clients", label: "New Clients" },
	{ key: "today_topup_amount", label: "Top-Up Amount" },
	{ key: "client_withdraw_amount", label: "Withdraw Amount" },
	{ key: "today_promote_success", label: "Promote Success" },
	{ key: "today_voice_call", label: "Voice Call" },
	{ key: "today_video_call", label: "Video Call" },
]



const ReportingPage = () => {
	const [showCalendar, setShowCalendar] = useState(false);
	// --- Export to CSV ---
	function exportToCSV() {
		const headers = columnsToShow.map(col => col.label)
		const rows = sortedRecords.map(record =>
			columnsToShow.map(col => {
				if (col.key === "staff") return record.staff?.name || "-"
				return (record as any)[col.key]
			})
		)
		const csvContent = [headers, ...rows]
			.map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(","))
			.join("\n")
		const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" })
		const url = URL.createObjectURL(blob)
		const link = document.createElement("a")
		link.href = url
		link.setAttribute("download", `report-${new Date().toISOString().slice(0, 10)}.csv`)
		document.body.appendChild(link)
		link.click()
		document.body.removeChild(link)
		URL.revokeObjectURL(url)
	}
	const [records, setRecords] = useState<DailyRecord[]>([])
	const [loading, setLoading] = useState(true)
	const [error, setError] = useState<string | null>(null)

	const [search, setSearch] = useState("")
	const [selectedColumns, setSelectedColumns] = useState(ALL_COLUMNS.map(col => col.key))
	// Advanced filters
	const { staff } = useStaff()
	const [selectedStaff, setSelectedStaff] = useState<string>("all")
	const [dateRange, setDateRange] = useState<{ from: Date | undefined; to: Date | undefined }>({ from: undefined, to: undefined })

	// Only show records for staff belonging to this admin
	useEffect(() => {
		const fetchData = async () => {
			setLoading(true)
			setError(null)
			try {
				const supabase = createClient()
				// Wait for staff to load
				if (!staff || staff.length === 0) {
					setRecords([])
					setLoading(false)
					return
				}
				const staffIds = staff.map((s) => s.id)
				let data: DailyRecord[] = []
				if (staffIds.length > 0) {
					const res = await supabase
						.from("daily_records")
						.select("*, staff(name)")
						.in("staff_id", staffIds)
						.order("record_date", { ascending: false })
					if (res.error) throw res.error
					data = res.data || []
				}
				setRecords(data)
			} catch (err: any) {
				setError(err.message || "Failed to fetch data")
			} finally {
				setLoading(false)
			}
		}
		fetchData()
	}, [staff])



	const columnsToShow = ALL_COLUMNS.filter(col => selectedColumns.includes(col.key))
	// Sorting
	const [sortKey, setSortKey] = useState<string>("record_date")
	const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc")
	// Pagination
	const [page, setPage] = useState(1)
	const pageSize = 15

	const filteredRecords = records.filter(record => {
		if (selectedStaff !== "all" && record.staff_id !== selectedStaff) return false
		if (dateRange.from && new Date(record.record_date) < dateRange.from) return false
		if (dateRange.to && new Date(record.record_date) > dateRange.to) return false
		if (!search) return true
		return columnsToShow.some(col => {
			const value = col.key === "staff" ? record.staff?.name : (record as any)[col.key]
			return value?.toString().toLowerCase().includes(search.toLowerCase())
		})
	})

	// Sort records
	const sortedRecords = [...filteredRecords].sort((a, b) => {
		const aValue = sortKey === "staff" ? a.staff?.name : (a as any)[sortKey]
		const bValue = sortKey === "staff" ? b.staff?.name : (b as any)[sortKey]
		if (aValue == null) return 1
		if (bValue == null) return -1
		if (aValue === bValue) return 0
		if (sortOrder === "asc") {
			return aValue > bValue ? 1 : -1
		} else {
			return aValue < bValue ? 1 : -1
		}
	})

	// Pagination
	const totalPages = Math.ceil(sortedRecords.length / pageSize) || 1
	const paginatedRecords = sortedRecords.slice((page - 1) * pageSize, page * pageSize)

	// Handle sort click
	const handleSort = (key: string) => {
		if (sortKey === key) {
			setSortOrder(order => (order === "asc" ? "desc" : "asc"))
		} else {
			setSortKey(key)
			setSortOrder("asc")
		}
		setPage(1)
	}

	// --- Summary cards ---
	const totalTransactions = records.length
	const totalTopup = records.reduce((sum, r) => sum + (Number((r as any).today_topup_amount) || 0), 0)
	const totalWithdraw = records.reduce((sum, r) => sum + (Number((r as any).client_withdraw_amount) || 0), 0)
	const totalNewClients = records.reduce((sum, r) => sum + (Number((r as any).new_clients) || 0), 0)

	return (
		<main className="p-4 sm:p-8 space-y-6">
			<h1 className="text-2xl font-bold mb-2">Report Dashboard</h1>
			<p className="text-muted-foreground mb-4">Comprehensive reporting for all staff activities and transactions. Use filters, search, and export for detailed insights.</p>

			{/* Summary cards */}
			<div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 mb-6">
				<Card className="p-4 flex flex-col items-center">
					<span className="text-lg font-semibold">{totalTransactions}</span>
					<span className="text-xs text-muted-foreground">Total Records</span>
				</Card>
				<Card className="p-4 flex flex-col items-center">
					<span className="text-lg font-semibold">{totalTopup.toLocaleString()}</span>
					<span className="text-xs text-muted-foreground">Total Top-Up</span>
				</Card>
				<Card className="p-4 flex flex-col items-center">
					<span className="text-lg font-semibold">{totalWithdraw.toLocaleString()}</span>
					<span className="text-xs text-muted-foreground">Total Withdraw</span>
				</Card>
				<Card className="p-4 flex flex-col items-center">
					<span className="text-lg font-semibold">{totalNewClients}</span>
					<span className="text-xs text-muted-foreground">New Clients</span>
				</Card>
			</div>

			{/* Sticky Filters and search */}
			<div className="sticky top-0 z-20 bg-white/95 backdrop-blur flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-3 mb-4 border-b border-muted px-1 py-3 shadow-sm">
				<Input
					placeholder="Search records..."
					value={search}
					onChange={e => setSearch(e.target.value)}
					className="w-full sm:max-w-xs"
				/>
				{/* Staff filter */}
				<Select value={selectedStaff} onValueChange={setSelectedStaff}>
					<SelectTrigger className="w-full sm:w-[160px]">
						<SelectValue placeholder="All staff" />
					</SelectTrigger>
					<SelectContent>
						<SelectItem value="all">All staff</SelectItem>
						{staff.map((s) => (
							<SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
						))}
					</SelectContent>
				</Select>
				{/* Date range filter */}
				<div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 w-full sm:w-auto">
					<span className="text-xs text-muted-foreground">Date range:</span>
					<div className="relative">
						<Button
							variant="outline"
							className="w-full sm:min-w-[170px] flex justify-between items-center"
							type="button"
							onClick={() => setShowCalendar(s => !s)}
						>
							{dateRange.from ? `${dateRange.from.toLocaleDateString()}${dateRange.to ? ' - ' + dateRange.to.toLocaleDateString() : ''}` : 'Select range'}
							<span className="ml-2">📅</span>
						</Button>
						{showCalendar && (
							<div className="absolute z-30 mt-2 left-0 bg-white border rounded shadow-lg p-2">
								<Calendar
									mode="range"
									selected={dateRange}
									onSelect={setDateRange}
									numberOfMonths={2}
									className="border-none shadow-none"
								/>
								<div className="flex justify-end mt-2">
									<Button size="sm" onClick={() => setShowCalendar(false)}>Close</Button>
								</div>
							</div>
						)}
					</div>
				</div>
					const [showCalendar, setShowCalendar] = useState(false);
				<div className="w-full sm:ml-auto sm:min-w-[200px]">
					<Select
						value="columns-dropdown"
						open={undefined}
						onOpenChange={() => {}}
						// Dummy props to use Select UI, actual dropdown below
					>
						<SelectTrigger className="w-full">
							<SelectValue placeholder="Select columns" />
						</SelectTrigger>
						<SelectContent>
							<div className="flex flex-col gap-1 p-2">
								{ALL_COLUMNS.map(col => (
									<label key={col.key} className="flex items-center gap-2 text-xs cursor-pointer">
										<input
											type="checkbox"
											checked={selectedColumns.includes(col.key)}
											onChange={() => setSelectedColumns(cols =>
												cols.includes(col.key)
													? cols.filter(c => c !== col.key)
													: [...cols, col.key]
											)}
											className="accent-primary h-4 w-4"
										/>
										{col.label}
									</label>
								))}
							</div>
						</SelectContent>
					</Select>
				</div>
				<div className="flex flex-col sm:flex-row gap-2 sm:gap-2 w-full sm:w-auto sm:ml-2">
					<Button variant="outline" className="w-full sm:w-auto" onClick={() => window.print()}>
						Print
					</Button>
					<Button variant="outline" className="w-full sm:w-auto" onClick={exportToCSV}>
						Export CSV
					</Button>
				</div>
			</div>

			{/* Interactive Charts */}
			<div className="mb-6">
				<PerformanceCharts records={filteredRecords} />
			</div>

			{/* Detailed table with sorting and pagination */}
			<div className="bg-white rounded shadow p-2 sm:p-4 overflow-x-auto">
				{loading ? (
					<TableSkeleton rows={pageSize} />
				) : error ? (
					<div className="flex flex-col items-center justify-center py-8">
						<span className="text-red-600 font-semibold mb-2">{error}</span>
						<span className="text-muted-foreground">Please try again or check your connection.</span>
					</div>
				) : paginatedRecords.length === 0 ? (
					<div className="flex flex-col items-center justify-center py-8">
						<span className="text-lg font-semibold mb-2">No records found</span>
						<span className="text-muted-foreground">Try adjusting your filters or date range.</span>
					</div>
				) : (
					<div className="min-w-[700px]">
						<Table className="min-w-full text-xs sm:text-sm">
							<TableHeader>
								<TableRow>
									{columnsToShow.map((col) => (
										<TableHead
											key={col.key}
											className="whitespace-nowrap px-2 py-2 cursor-pointer select-none hover:underline"
											onClick={() => handleSort(col.key)}
										>
											{col.label}
											{sortKey === col.key && (
												<span className="ml-1 text-xs">{sortOrder === "asc" ? "▲" : "▼"}</span>
											)}
										</TableHead>
									))}
								</TableRow>
							</TableHeader>
							<TableBody>
								{paginatedRecords.map((record) => (
									<TableRow key={record.id}>
										{columnsToShow.map(col => (
											<TableCell key={col.key} className="whitespace-nowrap px-2 py-2">
												{col.key === "staff"
													? record.staff?.name || "-"
													: (record as any)[col.key]}
											</TableCell>
										))}
									</TableRow>
								))}
							</TableBody>
						</Table>
						{/* Pagination controls */}
						<div className="flex justify-between items-center mt-2 px-2">
							<span className="text-xs text-muted-foreground">
								Page {page} of {totalPages}
							</span>
							<div className="flex gap-1">
								<Button size="sm" variant="outline" onClick={() => setPage(1)} disabled={page === 1}>First</Button>
								<Button size="sm" variant="outline" onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}>Prev</Button>
								<Button size="sm" variant="outline" onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}>Next</Button>
								<Button size="sm" variant="outline" onClick={() => setPage(totalPages)} disabled={page === totalPages}>Last</Button>
							</div>
						</div>
					</div>
				)}
			</div>
		</main>
	)
}

export default ReportingPage
