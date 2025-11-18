"use client"

import AdminAuditLogs from "@/components/admin-audit-logs"

export default function AdminAuditLogsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Audit Logs</h1>
        <p className="text-muted-foreground mt-2">System activity and user actions</p>
      </div>
      <AdminAuditLogs />
    </div>

  )
}
