"use client"

import type { ReactNode } from "react"
import { useAuth } from "@/lib/auth-context"
import { redirect } from "next/navigation"
import ManagerSidebar from "@/components/manager-sidebar"
import ManagerHeader from "@/components/manager-header"

export default function ManagerDashboardLayout({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth()

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <div className="text-muted-foreground">Loading...</div>
      </div>
    )
  }

  // if (!user || !["MANAGER", "ADMIN"].includes(user.role)) {
  //   redirect("/login")
  // }

  return (
    <div className="flex h-screen bg-background">
      {/* Sidebar */}
      <ManagerSidebar />

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <ManagerHeader />
        <main className="flex-1 overflow-auto">
          <div className="p-6 md:p-8">{children}</div>
        </main>
      </div>
    </div>
  )
}
