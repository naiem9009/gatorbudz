"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import DataTable from "@/components/admin/data-table"
import { useAuth } from "@/lib/auth-context"

export default function UsersPage() {
  const router = useRouter()
  const [users, setUsers] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const { user } = useAuth()

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

  const handleViewUser = (user: any) => {
    router.push(`/admin-dashboard/users/${user.id}`)
  }

  const isCurrentUser = (userId: string) => {
    return user?.id === userId
  }

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
      NONE: "bg-gray-500/10 text-gray-500 border-gray-500/30",
    }
    return colors[tier] || colors.NONE
  }

  const getStatusBadge = (status: string) => {
    const colors: any = {
      ACTIVE: "bg-green-500/10 text-green-500 border-green-500/30",
      PENDING_REVIEW: "bg-yellow-500/10 text-yellow-500 border-yellow-500/30",
      SUSPENDED: "bg-red-500/10 text-red-500 border-red-500/30",
    }
    return colors[status] || colors.PENDING_REVIEW
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
      key: "company",
      label: "Company",
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
        description={`Total: ${users.length} users`}
        columns={columns}
        data={users.filter(
          (u) =>
            u.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
            u.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            u.company?.toLowerCase().includes(searchTerm.toLowerCase())
        )}
        searchPlaceholder="Search by email, name, or company..."
        onSearch={setSearchTerm}
        // loading={loading}
        actions={(row) => (
          <div className="flex items-center justify-end gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleViewUser(row)}
              className="text-blue-600 hover:bg-blue-50"
            >
              View Details
            </Button>
          </div>
        )}
      />
    </div>
  )
}