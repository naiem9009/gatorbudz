"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Select } from "@/components/ui/select"
import { Trash2 } from "lucide-react"

interface User {
  id: string
  email: string
  name: string
  company: string
  role: string
  tier: string
  createdAt: string
}

export default function AdminUsersTab() {
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedUser, setSelectedUser] = useState<User | null>(null)
  const [editRole, setEditRole] = useState("")
  const [editTier, setEditTier] = useState("")

  useEffect(() => {
    fetchUsers()
  }, [])

  const fetchUsers = async () => {
    try {
      const response = await fetch("/api/users")
      const data = await response.json()
      setUsers(data)
    } catch (error) {
      console.error("Failed to fetch users:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleUpdateUser = async () => {
    if (!selectedUser) return

    try {
      const response = await fetch(`/api/admin/users/${selectedUser.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          role: editRole || undefined,
          tier: editTier || undefined,
        }),
      })

      if (response.ok) {
        setSelectedUser(null)
        await fetchUsers()
      }
    } catch (error) {
      console.error("Failed to update user:", error)
    }
  }

  const handleDeleteUser = async (userId: string) => {
    if (!confirm("Are you sure you want to delete this user?")) return

    try {
      const response = await fetch(`/api/admin/users/${userId}`, {
        method: "DELETE",
      })

      if (response.ok) {
        await fetchUsers()
      }
    } catch (error) {
      console.error("Failed to delete user:", error)
    }
  }

  if (loading) {
    return <div className="text-center py-12 text-muted-foreground">Loading users...</div>
  }

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-bold text-foreground mb-6">Manage Users</h2>

      {users.length > 0 ? (
        <div className="space-y-3">
          {users.map((user) => (
            <div
              key={user.id}
              className="bg-card border border-border p-4 rounded-lg flex items-center justify-between"
            >
              <div className="flex-1">
                <p className="font-medium text-foreground">{user.name || user.email}</p>
                <p className="text-xs text-muted-foreground">{user.company || "No company"}</p>
              </div>

              <div className="flex items-center gap-4">
                <div className="text-right">
                  <p className="text-xs text-muted-foreground">Role / Tier</p>
                  <p className="font-semibold text-accent">
                    {user.role} / {user.tier}
                  </p>
                </div>

                <Dialog>
                  <DialogTrigger asChild>
                    <Button
                      variant="outline"
                      size="sm"
                      className="bg-transparent"
                      onClick={() => {
                        setSelectedUser(user)
                        setEditRole(user.role)
                        setEditTier(user.tier)
                      }}
                    >
                      Edit
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Edit User</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-foreground mb-2">Email</label>
                        <p className="text-foreground">{selectedUser?.email}</p>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-foreground mb-2">Role</label>
                        <Select value={editRole} onValueChange={setEditRole}>
                          <option value="PUBLIC">Public</option>
                          <option value="VERIFIED">Verified</option>
                          <option value="MANAGER">Manager</option>
                          <option value="ADMIN">Admin</option>
                        </Select>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-foreground mb-2">Tier</label>
                        <Select value={editTier} onValueChange={setEditTier}>
                          <option value="GOLD">Gold</option>
                          <option value="PLATINUM">Platinum</option>
                          <option value="DIAMOND">Diamond</option>
                        </Select>
                      </div>

                      <Button
                        onClick={handleUpdateUser}
                        className="w-full bg-accent text-accent-foreground hover:opacity-90"
                      >
                        Save Changes
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>

                <Button
                  variant="outline"
                  size="sm"
                  className="bg-transparent border-destructive text-destructive hover:bg-destructive/10"
                  onClick={() => handleDeleteUser(user.id)}
                >
                  <Trash2 size={16} />
                </Button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-12">
          <p className="text-muted-foreground">No users found</p>
        </div>
      )}
    </div>
  )
}
