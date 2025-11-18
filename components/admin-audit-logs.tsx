"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Search } from "lucide-react"

interface AuditLog {
  id: string
  actor: { id: string; email: string; name: string | null }
  actorRole: string
  action: string
  entity: string
  entityId: string
  createdAt: string
}

export default function AdminAuditLogs() {
  const [logs, setLogs] = useState<AuditLog[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")

  useEffect(() => {
    fetchLogs()
  }, [search])

  async function fetchLogs() {
    setLoading(true)
    try {
      const params = search ? `?action=${search}` : ""
      const res = await fetch(`/api/audit-logs${params}`)
      const json = await res.json()
      setLogs(json.data || [])
    } catch (error) {
      console.error("Error fetching audit logs:", error)
    } finally {
      setLoading(false)
    }
  }

  const actionColors: Record<string, string> = {
    APPROVE_ORDER: "bg-blue-500/10 text-blue-700",
    REJECT_ORDER: "bg-red-500/10 text-red-700",
    UPDATE_TIER: "bg-purple-500/10 text-purple-700",
    UPDATE_ORDER_STATUS: "bg-yellow-500/10 text-yellow-700",
  }

  return (
    <Card className="bg-card border-border">
      <CardHeader>
        <CardTitle>Audit Logs</CardTitle>
        <CardDescription>System activity and user actions</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search by action..."
            className="pl-10"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <div className="overflow-x-auto rounded-lg border border-border">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted">
                <TableHead>Actor</TableHead>
                <TableHead>Action</TableHead>
                <TableHead>Entity</TableHead>
                <TableHead>Timestamp</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">
                    Loading...
                  </TableCell>
                </TableRow>
              ) : logs.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">
                    No audit logs found
                  </TableCell>
                </TableRow>
              ) : (
                logs.map((log) => (
                  <TableRow key={log.id} className="hover:bg-muted/50">
                    <TableCell>
                      <div>
                        <p className="font-medium text-sm">{log.actor.name || log.actor.email}</p>
                        <p className="text-xs text-muted-foreground">{log.actorRole}</p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge className={`${actionColors[log.action] || "bg-gray-500/10 text-gray-700"}`}>
                        {log.action}
                      </Badge>
                    </TableCell>
                    <TableCell className="font-mono text-sm">{log.entity}</TableCell>
                    <TableCell className="text-sm">{new Date(log.createdAt).toLocaleString()}</TableCell>
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
