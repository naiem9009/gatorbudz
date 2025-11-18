"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Trash2, Eye } from "lucide-react"
import DataTable from "@/components/admin/data-table"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { useAuth } from "@/lib/auth-context"

export default function UsersPage() {
  const [users, setUsers] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedUser, setSelectedUser] = useState<any>(null)
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null)
  const [updating, setUpdating] = useState(false)
  const { isAuthenticated, user } = useAuth()

  useEffect(() => {
    fetchUsers()
  }, [])

  const fetchUsers = async () => {
    try {
      setLoading(true)
      const response = await fetch("/api/admin/users")
      if (!response.ok) throw new Error("Failed to fetch users")
      const data = await response.json()
      setUsers(data.users)
    } catch (error) {
      console.error("Error fetching users:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleUpdateUser = async (userId: string, updates: any) => {
    try {
      setUpdating(true)
      const response = await fetch(`/api/admin/users/${userId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updates),
      })

      if (!response.ok) throw new Error("Failed to update user")

      await fetchUsers()
      setSelectedUser(null)
    } catch (error) {
      console.error("Error updating user:", error)
    } finally {
      setUpdating(false)
    }
  }

  const handleDeleteUser = async (userId: string) => {
    try {
      const response = await fetch(`/api/admin/users/${userId}`, { method: "DELETE" })
      if (!response.ok) throw new Error("Failed to delete user")

      await fetchUsers()
      setDeleteConfirm(null)
    } catch (error) {
      console.error("Error deleting user:", error)
    }
  }

  // Check if current user is viewing their own profile
  const isCurrentUser = (userId: string) => {
    return user?.id === userId
  }

  // Check if user can be deleted (not current user)
  const canDeleteUser = (userId: string) => {
    return !isCurrentUser(userId)
  }

  const filteredUsers = users.filter(
    (u) =>
      u.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.name?.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  const getRoleBadge = (role: string) => {
    const colors: any = {
      ADMIN: "bg-red-500/10 text-red-500 border-red-500/30",
      MANAGER: "bg-purple-500/10 text-purple-500 border-purple-500/30",
      VERIFIED: "bg-green-500/10 text-green-500 border-green-500/30",
      PUBLIC: "bg-gray-500/10 text-gray-500 border-gray-500/30",
    }
    return colors[role] || colors.PUBLIC
  }

  const getTierBadge = (tier: string) => {
    const colors: any = {
      DIAMOND: "bg-blue-500/10 text-blue-500 border-blue-500/30",
      PLATINUM: "bg-slate-500/10 text-slate-500 border-slate-500/30",
      GOLD: "bg-yellow-500/10 text-yellow-500 border-yellow-500/30",
    }
    return colors[tier] || colors.GOLD
  }

  const columns = [
    {
      key: "email",
      label: "Email",
    },
    {
      key: "name",
      label: "Name",
      render: (value: any) => value || "N/A",
    },
    {
      key: "role",
      label: "Role",
      render: (value: any, row: any) => (
        <div className="flex items-center gap-2">
          <Badge variant="outline" className={getRoleBadge(value)}>
            {value}
          </Badge>
          {isCurrentUser(row.id) && (
            <Badge variant="secondary" className="text-xs">
              You
            </Badge>
          )}
        </div>
      ),
    },
    {
      key: "tier",
      label: "Tier",
      render: (value: any) => (
        <Badge variant="outline" className={getTierBadge(value)}>
          {value}
        </Badge>
      ),
    },
    {
      key: "createdAt",
      label: "Joined",
      render: (value: any) => new Date(value).toLocaleDateString(),
    },
  ]

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-foreground">Users</h1>
        <p className="text-muted-foreground mt-2">Manage user accounts and permissions</p>
      </div>

      {/* Table */}
      <DataTable
        title="All Users"
        description={`Total: ${filteredUsers.length} users`}
        columns={columns}
        data={filteredUsers}
        searchPlaceholder="Search by email or name..."
        onSearch={setSearchTerm}
        actions={(row) => (
          <div className="flex items-center justify-end gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setSelectedUser(row)}
              className="text-accent hover:bg-accent/10"
            >
              <Eye className="w-4 h-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setDeleteConfirm(row.id)}
              disabled={!canDeleteUser(row.id)}
              className="text-destructive hover:bg-destructive/10 disabled:opacity-50 disabled:cursor-not-allowed"
              title={!canDeleteUser(row.id) ? "Cannot delete your own account" : "Delete user"}
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          </div>
        )}
      />

      {/* User Details Dialog */}
      <Dialog open={!!selectedUser} onOpenChange={(open) => !open && setSelectedUser(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>User Details</DialogTitle>
            <DialogDescription>
              {selectedUser && isCurrentUser(selectedUser.id) 
                ? "Your account details (some actions are restricted)" 
                : "View and manage user information"}
            </DialogDescription>
          </DialogHeader>

          {selectedUser && (
            <div className="space-y-4">
              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-wide">Email</p>
                <p className="text-foreground font-medium mt-1">{selectedUser.email}</p>
              </div>

              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-wide">Name</p>
                <p className="text-foreground font-medium mt-1">{selectedUser.name || "N/A"}</p>
              </div>

              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-wide mb-2">Role</p>
                <Select
                  value={selectedUser.role}
                  onValueChange={(newRole) => setSelectedUser({ ...selectedUser, role: newRole })}
                  disabled={updating || (isCurrentUser(selectedUser.id) && selectedUser.role === "ADMIN")}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="PUBLIC">Public</SelectItem>
                    <SelectItem value="VERIFIED">Verified</SelectItem>
                    <SelectItem value="MANAGER">Manager</SelectItem>
                    <SelectItem value="ADMIN">Admin</SelectItem>
                  </SelectContent>
                </Select>
                {isCurrentUser(selectedUser.id) && selectedUser.role === "ADMIN" && (
                  <p className="text-xs text-muted-foreground mt-1">
                    You cannot change your own admin role
                  </p>
                )}
              </div>

              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-wide mb-2">Tier</p>
                <Select
                  value={selectedUser.tier}
                  onValueChange={(newTier) => setSelectedUser({ ...selectedUser, tier: newTier })}
                  disabled={updating}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="GOLD">Gold</SelectItem>
                    <SelectItem value="PLATINUM">Platinum</SelectItem>
                    <SelectItem value="DIAMOND">Diamond</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="text-xs text-muted-foreground">
                <p>Email Verified: {selectedUser.emailVerified ? "Yes" : "No"}</p>
                <p>Joined: {new Date(selectedUser.createdAt).toLocaleString()}</p>
                {isCurrentUser(selectedUser.id) && (
                  <p className="text-amber-500 mt-2">
                    ⚠️ This is your account. Some actions are restricted for security.
                  </p>
                )}
              </div>

              <Button
                onClick={() =>
                  handleUpdateUser(selectedUser.id, {
                    role: selectedUser.role,
                    tier: selectedUser.tier,
                  })
                }
                disabled={updating}
                className="w-full bg-accent hover:opacity-90"
              >
                {updating ? "Saving..." : "Save Changes"}
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteConfirm} onOpenChange={(open) => !open && setDeleteConfirm(null)}>
        <AlertDialogContent>
          <AlertDialogTitle>Delete User</AlertDialogTitle>
          <AlertDialogDescription>
            {deleteConfirm && isCurrentUser(deleteConfirm) ? (
              <div className="text-destructive">
                <p className="font-semibold">You cannot delete your own account.</p>
                <p className="mt-2">For security reasons, please ask another administrator to perform this action.</p>
              </div>
            ) : (
              "Are you sure you want to delete this user? This action cannot be undone and will delete all associated data."
            )}
          </AlertDialogDescription>
          <div className="flex gap-3 justify-end">
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            {deleteConfirm && !isCurrentUser(deleteConfirm) && (
              <AlertDialogAction
                onClick={() => handleDeleteUser(deleteConfirm)}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                Delete
              </AlertDialogAction>
            )}
          </div>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}