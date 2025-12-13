"use client"

import type React from "react"

import { useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Plus, Pencil, Trash2, Loader2, UserPlus } from "lucide-react"
import type { Staff } from "@/lib/types"

interface StaffListProps {
  initialStaff: Staff[]
}

export function StaffList({ initialStaff = [] }: StaffListProps) {
  const [staff, setStaff] = useState<Staff[]>(initialStaff)
  const [isAddOpen, setIsAddOpen] = useState(false)
  const [isEditOpen, setIsEditOpen] = useState(false)
  const [isDeleteOpen, setIsDeleteOpen] = useState(false)
  const [selectedStaff, setSelectedStaff] = useState<Staff | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    department: "",
    position: "",
    date_of_joining: "",
  })

  const resetForm = () => {
    setFormData({ name: "", email: "", department: "", position: "", date_of_joining: "" })
    setError(null)
  }

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.name.trim()) {
      setError("Name is required")
      return
    }
    if (!formData.date_of_joining) {
      setError("Date of joining is required")
      return
    }

    setIsLoading(true)
    setError(null)

    const supabase = createClient()
    const { data, error: dbError } = await supabase
      .from("staff")
      .insert({
        name: formData.name.trim(),
        email: formData.email.trim() || null,
        department: formData.department.trim() || null,
        position: formData.position.trim() || null,
        date_of_joining: formData.date_of_joining,
      })
      .select()
      .single()

    setIsLoading(false)

    if (dbError) {
      setError(dbError.message)
      return
    }

    setStaff([...staff, data as Staff])
    setIsAddOpen(false)
    resetForm()
  }

  const handleEdit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedStaff || !formData.name.trim()) {
      setError("Name is required")
      return
    }
    if (!formData.date_of_joining) {
      setError("Date of joining is required")
      return
    }

    setIsLoading(true)
    setError(null)

    const supabase = createClient()
    const { data, error: dbError } = await supabase
      .from("staff")
      .update({
        name: formData.name.trim(),
        email: formData.email.trim() || null,
        department: formData.department.trim() || null,
        position: formData.position.trim() || null,
        date_of_joining: formData.date_of_joining,
      })
      .eq("id", selectedStaff.id)
      .select()
      .single()

    setIsLoading(false)

    if (dbError) {
      setError(dbError.message)
      return
    }

    setStaff(staff.map((s) => (s.id === selectedStaff.id ? (data as Staff) : s)))
    setIsEditOpen(false)
    setSelectedStaff(null)
    resetForm()
  }

  const handleDelete = async () => {
    if (!selectedStaff) return

    setIsLoading(true)
    const supabase = createClient()
    const { error: dbError } = await supabase.from("staff").delete().eq("id", selectedStaff.id)

    setIsLoading(false)

    if (dbError) {
      setError(dbError.message)
      return
    }

    setStaff(staff.filter((s) => s.id !== selectedStaff.id))
    setIsDeleteOpen(false)
    setSelectedStaff(null)
  }

  const openEdit = (s: Staff) => {
    setSelectedStaff(s)
    setFormData({
      name: s.name,
      email: s.email || "",
      department: s.department || "",
      position: s.position || "",
      date_of_joining: s.date_of_joining || "",
    })
    setIsEditOpen(true)
  }

  const openDelete = (s: Staff) => {
    setSelectedStaff(s)
    setIsDeleteOpen(true)
  }

  return (
    <Card>
      <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-2 sm:space-y-0">
        <CardTitle className="text-base sm:text-lg font-medium">Team Members</CardTitle>
        <Dialog
          open={isAddOpen}
          onOpenChange={(open) => {
            setIsAddOpen(open)
            if (!open) resetForm()
          }}
        >
          <DialogTrigger asChild>
            <Button size="sm" className="w-full sm:w-auto">
              <Plus className="mr-2 h-4 w-4" />
              Add Staff
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add Staff Member</DialogTitle>
              <DialogDescription>Add a new team member to track their activities</DialogDescription>
            </DialogHeader>
            <form onSubmit={handleAdd}>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="name">Name *</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="John Doe"
                    required
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="john@example.com"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="department">Department</Label>
                  <Input
                    id="department"
                    value={formData.department}
                    onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                    placeholder="Sales"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="position">Position</Label>
                  <Input
                    id="position"
                    value={formData.position}
                    onChange={(e) => setFormData({ ...formData, position: e.target.value })}
                    placeholder="Sales Representative"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="date_of_joining">Date of Joining *</Label>
                  <Input
                    id="date_of_joining"
                    type="date"
                    value={formData.date_of_joining}
                    onChange={(e) => setFormData({ ...formData, date_of_joining: e.target.value })}
                    required
                  />
                </div>
                {error && <p className="text-sm text-destructive">{error}</p>}
              </div>
              <DialogFooter>
                <Button type="submit" disabled={isLoading}>
                  {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                  Add Staff
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </CardHeader>
      <CardContent>
        {staff.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 sm:py-12 text-center">
            <div className="rounded-full bg-muted p-3 sm:p-4">
              <UserPlus className="h-6 w-6 sm:h-8 sm:w-8 text-muted-foreground" />
            </div>
            <h3 className="mt-4 font-semibold text-sm sm:text-base">No staff members yet</h3>
            <p className="mt-1 text-xs sm:text-sm text-muted-foreground">
              Add your first team member to start tracking activities
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto -mx-2 sm:mx-0">
            <div className="min-w-full px-2 sm:px-0">
              <Table className="min-w-full text-xs sm:text-sm">
                <TableHeader>
                  <TableRow className="bg-muted">
                    <TableHead className="whitespace-nowrap px-2 py-2">Name</TableHead>
                    <TableHead className="whitespace-nowrap px-2 py-2">Email</TableHead>
                    <TableHead className="whitespace-nowrap px-2 py-2">Department</TableHead>
                    <TableHead className="whitespace-nowrap px-2 py-2">Position</TableHead>
                    <TableHead className="whitespace-nowrap px-2 py-2">Date Joined</TableHead>
                    <TableHead className="whitespace-nowrap px-2 py-2">Status</TableHead>
                    <TableHead className="whitespace-nowrap px-2 py-2 text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {staff.map((s) => (
                    <TableRow key={s.id} className="hover:bg-accent transition-colors">
                      <TableCell className="font-medium whitespace-nowrap px-2 py-2">{s.name}</TableCell>
                      <TableCell className="whitespace-nowrap px-2 py-2">{s.email || "-"}</TableCell>
                      <TableCell className="whitespace-nowrap px-2 py-2">{s.department || "-"}</TableCell>
                      <TableCell className="whitespace-nowrap px-2 py-2">{s.position || "-"}</TableCell>
                      <TableCell className="whitespace-nowrap px-2 py-2">{s.date_of_joining ? s.date_of_joining : "-"}</TableCell>
                      <TableCell className="whitespace-nowrap px-2 py-2">
                        <Badge variant={s.is_active ? "default" : "secondary"} className="text-[10px] sm:text-xs">
                          {s.is_active ? "Active" : "Inactive"}
                        </Badge>
                      </TableCell>
                      <TableCell className="whitespace-nowrap px-2 py-2 text-right">
                        <div className="flex justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 sm:h-8 sm:w-8"
                            onClick={() => openEdit(s)}
                          >
                            <Pencil className="h-3 w-3 sm:h-4 sm:w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 sm:h-8 sm:w-8"
                            onClick={() => openDelete(s)}
                          >
                            <Trash2 className="h-3 w-3 sm:h-4 sm:w-4 text-destructive" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>
        )}
      </CardContent>

      {/* Edit Dialog */}
      <Dialog
        open={isEditOpen}
        onOpenChange={(open) => {
          setIsEditOpen(open)
          if (!open) {
            setSelectedStaff(null)
            resetForm()
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Staff Member</DialogTitle>
            <DialogDescription>Update team member information</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleEdit}>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="edit-name">Name *</Label>
                <Input
                  id="edit-name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="edit-email">Email</Label>
                <Input
                  id="edit-email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="edit-department">Department</Label>
                <Input
                  id="edit-department"
                  value={formData.department}
                  onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="edit-position">Position</Label>
                <Input
                  id="edit-position"
                  value={formData.position}
                  onChange={(e) => setFormData({ ...formData, position: e.target.value })}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="edit-date_of_joining">Date of Joining *</Label>
                <Input
                  id="edit-date_of_joining"
                  type="date"
                  value={formData.date_of_joining}
                  onChange={(e) => setFormData({ ...formData, date_of_joining: e.target.value })}
                  required
                />
              </div>
              {error && <p className="text-sm text-destructive">{error}</p>}
            </div>
            <DialogFooter>
              <Button type="submit" disabled={isLoading}>
                {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                Save Changes
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Staff Member</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete {selectedStaff?.name}? This will also delete all their activity records.
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  )
}
