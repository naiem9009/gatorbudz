"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Edit2, Search } from "lucide-react"

interface User {
  id: string
  email: string
  name: string | null
  company: string | null
  role: string
  tier: string
  emailVerified: boolean
  createdAt: string
}

export default function AdminUsersTable() {
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [roleFilter, setRoleFilter] = useState("all")
  const [tierFilter, setTierFilter] = useState("all")

  useEffect(() => {
    fetchUsers()
  }, [search, roleFilter, tierFilter])

  async function fetchUsers() {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (search) params.append("search", search)
      if (roleFilter !== "all") params.append("role", roleFilter)
      if (tierFilter !== "all") params.append("tier", tierFilter)

      const res = await fetch(`/api/users/list?${params}`)
      const json = await res.json()
      setUsers(json.data || [])
    } catch (error) {
      console.error("Error fetching users:", error)
    } finally {
      setLoading(false)
    }
  }

  const roleColors: Record<string, string> = {
    ADMIN: "bg-red-500/10 text-red-700",
    MANAGER: "bg-blue-500/10 text-blue-700",
    VERIFIED: "bg-green-500/10 text-green-700",
    PUBLIC: "bg-gray-500/10 text-gray-700",
  }

  const tierColors: Record<string, string> = {
    DIAMOND: "bg-purple-500/10 text-purple-700",
    PLATINUM: "bg-slate-500/10 text-slate-700",
    GOLD: "bg-yellow-500/10 text-yellow-700",
  }

  return (
    <Card className="bg-card border-border">
      <CardHeader>
        <CardTitle>Users</CardTitle>
        <CardDescription>Manage and view all users</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Filters */}
        <div className="flex flex-col gap-4 md:flex-row md:items-end">
          <div className="flex-1">
            <label className="text-sm font-medium text-foreground mb-2 block">Search</label>
            <div className="relative">
              <Search className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search by email, name, or company"
                className="pl-10"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
          </div>
          <div className="flex-1">
            <label className="text-sm font-medium text-foreground mb-2 block">Role</label>
            <Select value={roleFilter} onValueChange={setRoleFilter}>
              <SelectTrigger>
                <SelectValue placeholder="All roles" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All roles</SelectItem>
                <SelectItem value="ADMIN">Admin</SelectItem>
                <SelectItem value="MANAGER">Manager</SelectItem>
                <SelectItem value="VERIFIED">Verified</SelectItem>
                <SelectItem value="PUBLIC">Public</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex-1">
            <label className="text-sm font-medium text-foreground mb-2 block">Tier</label>
            <Select value={tierFilter} onValueChange={setTierFilter}>
              <SelectTrigger>
                <SelectValue placeholder="All tiers" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All tiers</SelectItem>
                <SelectItem value="GOLD">Gold</SelectItem>
                <SelectItem value="PLATINUM">Platinum</SelectItem>
                <SelectItem value="DIAMOND">Diamond</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto rounded-lg border border-border">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted">
                <TableHead>Email</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Company</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Tier</TableHead>
                <TableHead>Joined</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                    Loading...
                  </TableCell>
                </TableRow>
              ) : users.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                    No users found
                  </TableCell>
                </TableRow>
              ) : (
                users.map((user) => (
                  <TableRow key={user.id} className="hover:bg-muted/50">
                    <TableCell className="font-mono text-sm">{user.email}</TableCell>
                    <TableCell>{user.name || "-"}</TableCell>
                    <TableCell>{user.company || "-"}</TableCell>
                    <TableCell>
                      <Badge className={`${roleColors[user.role] || ""}`}>{user.role}</Badge>
                    </TableCell>
                    <TableCell>
                      <Badge className={`${tierColors[user.tier] || ""}`}>{user.tier}</Badge>
                    </TableCell>
                    <TableCell className="text-sm">{new Date(user.createdAt).toLocaleDateString()}</TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="sm" className="gap-2">
                        <Edit2 className="w-4 h-4" />
                        Edit
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  )
}
