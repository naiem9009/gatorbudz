"use client"

import { useEffect, useState } from "react"

interface AuditLog {
  id: string
  action: string
  entity: string
  entityId: string
  actorRole: string
  createdAt: string
  actor: {
    id: string
    email: string
    name: string
  }
}

export default function AdminAuditTab() {
  const [logs, setLogs] = useState<AuditLog[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchLogs()
  }, [])

  const fetchLogs = async () => {
    try {
      const response = await fetch("/api/admin/audit-logs?limit=50")
      const data = await response.json()
      setLogs(data)
    } catch (error) {
      console.error("Failed to fetch audit logs:", error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return <div className="text-center py-12 text-muted-foreground">Loading audit logs...</div>
  }

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-bold text-foreground mb-6">Audit Logs</h2>

      {logs.length > 0 ? (
        <div className="space-y-2">
          {logs.map((log) => (
            <div key={log.id} className="bg-card border border-border p-3 rounded-lg text-sm">
              <div className="flex items-center justify-between mb-2">
                <p className="font-medium text-foreground">{log.action}</p>
                <p className="text-xs text-muted-foreground">{new Date(log.createdAt).toLocaleString()}</p>
              </div>
              <p className="text-xs text-muted-foreground">
                {log.actor.name || log.actor.email} ({log.actorRole}) • {log.entity} {log.entityId}
              </p>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-12">
          <p className="text-muted-foreground">No audit logs found</p>
        </div>
      )}
    </div>
  )
}
