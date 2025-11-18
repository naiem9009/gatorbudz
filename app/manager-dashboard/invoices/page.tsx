"use client"

import ManagerSidebar from "@/components/manager-sidebar"
import ManagerHeader from "@/components/manager-header"
import DashboardInvoices from "@/components/dashboard-invoices"

export default function ManagerInvoicesPage() {
  return (
    <div className="flex h-screen bg-background">
      <div className="hidden md:block">
        <ManagerSidebar />
      </div>
      <div className="flex-1 flex flex-col overflow-hidden">
        <ManagerHeader />
        <main className="flex-1 overflow-y-auto p-4 md:p-8">
          <div className="space-y-6">
            <div>
              <h1 className="text-3xl font-bold text-foreground">Invoices</h1>
              <p className="text-muted-foreground mt-2">Manage customer invoices</p>
            </div>
            <DashboardInvoices />
          </div>
        </main>
      </div>
    </div>
  )
}
