"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Select } from "@/components/ui/select"

interface User {
  id: string
  email: string
  name: string
  company: string
  tier: string
  createdAt: string
}

export default function ManagerUsersTab() {
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedUser, setSelectedUser] = useState<User | null>(null)
  const [proposedTier, setProposedTier] = useState("GOLD")
  const [reason, setReason] = useState("")

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

  const handleProposeTierChange = async () => {
    if (!selectedUser) return

    try {
      const response = await fetch("/api/tier-proposals", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: selectedUser.id,
          proposedTier,
          reason,
        }),
      })

      if (response.ok) {
        setSelectedUser(null)
        setProposedTier("GOLD")
        setReason("")
        // Show success toast
      }
    } catch (error) {
      console.error("Failed to propose tier change:", error)
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
                  <p className="text-xs text-muted-foreground">Tier</p>
                  <p className="font-semibold text-accent">{user.tier}</p>
                </div>

                <Dialog>
                  <DialogTrigger asChild>
                    <Button
                      variant="outline"
                      size="sm"
                      className="bg-transparent"
                      onClick={() => setSelectedUser(user)}
                    >
                      Propose Change
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Propose Tier Change</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-foreground mb-2">User</label>
                        <p className="text-foreground">{selectedUser?.name || selectedUser?.email}</p>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-foreground mb-2">Current Tier</label>
                        <p className="text-foreground">{selectedUser?.tier}</p>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-foreground mb-2">Proposed Tier</label>
                        <Select value={proposedTier} onValueChange={setProposedTier}>
                          <option value="GOLD">Gold</option>
                          <option value="PLATINUM">Platinum</option>
                          <option value="DIAMOND">Diamond</option>
                        </Select>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-foreground mb-2">Reason</label>
                        <textarea
                          value={reason}
                          onChange={(e) => setReason(e.target.value)}
                          className="w-full px-4 py-2 bg-muted border border-border rounded-lg text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-accent"
                          placeholder="Why should this user be upgraded?"
                          rows={4}
                        />
                      </div>

                      <Button
                        onClick={handleProposeTierChange}
                        className="w-full bg-accent text-accent-foreground hover:opacity-90"
                      >
                        Submit Proposal
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>
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
