"use client"

import type { ReactNode } from "react"
import { useAuth } from "@/lib/auth-context"
import { redirect } from "next/navigation"
import AdminSidebar from "@/components/admin-sidebar"
import AdminHeader from "@/components/admin-header"

export default function AdminDashboardLayout({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth()

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <div className="text-muted-foreground">Loading...</div>
      </div>
    )
  }

  // if (!user || user.role !== "ADMIN") {
  //   redirect("/login")
  // }

  return (
    <div className="flex h-screen bg-background">
      {/* Sidebar */}
      <AdminSidebar />

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <AdminHeader />
        <main className="flex-1 overflow-auto">
          <div className="p-6 md:p-8">{children}</div>
        </main>
      </div>
    </div>
  )
}
