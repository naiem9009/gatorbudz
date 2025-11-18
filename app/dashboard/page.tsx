"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Header from "@/components/header"
import Footer from "@/components/footer"
import { useAuth } from "@/lib/auth-context"
import { Button } from "@/components/ui/button"
import { FileText, LogOut, Settings2 } from "lucide-react"
import Link from "next/link"
import DashboardOrders from "@/components/dashboard-orders"
import DashboardInvoices from "@/components/dashboard-invoices"

export default function DashboardPage() {
  const router = useRouter()
  const { user, loading } = useAuth()
  const [activeTab, setActiveTab] = useState<"orders" | "invoices" | "files">("orders")

  // useEffect(() => {
  //   if (!loading && !user) {
  //     router.replace("/login?next=/dashboard")
  //   }
  // }, [loading, user, router])

  if (loading) {
    return (
      <main className="min-h-screen bg-background">
        <Header />
        <div className="max-w-7xl mx-auto px-4 md:px-8 py-16">
          <div className="h-8 w-56 bg-muted animate-pulse rounded mb-4" />
          <div className="h-5 w-72 bg-muted animate-pulse rounded mb-10" />
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="bg-card border border-border p-6 rounded-lg">
                <div className="h-4 w-28 bg-muted animate-pulse rounded mb-2" />
                <div className="h-8 w-40 bg-muted animate-pulse rounded" />
              </div>
            ))}
          </div>
        </div>
        <Footer />
      </main>
    )
  }

  if (!user) {
    return (
      <main className="min-h-screen bg-background">
        <Header />
        <div className="max-w-7xl mx-auto px-4 md:px-8 py-16 text-center">
          <p className="text-muted-foreground mb-4">Please log in to access your dashboard</p>
          <Link href="/login">
            <Button className="bg-accent text-accent-foreground hover:opacity-90">Go to Login</Button>
          </Link>
        </div>
        <Footer />
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-background">
      <Header />

      <div className="max-w-7xl mx-auto px-4 md:px-8 py-8">
        {/* Dashboard Header */}
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold text-foreground mb-2">Dashboard</h1>
            <p className="text-muted-foreground">
              Welcome back, {user.name || user.email} • Tier:{" "}
              <span className="font-semibold text-accent">{user.tier}</span>
            <Link href="/dashboard/tier-upgrade" className="ml-2 text-sm text-red-400 hover:underline">
              (Upgrade your tier)
            </Link>
            </p>

          </div>
          <div>
            <Button asChild variant="outline" className="bg-transparent mr-2">
              <Link href="/dashboard/account">
                <Settings2 size={20} />
                Account
              </Link>
            </Button>
            <Button asChild variant="outline" className="bg-transparent">
              <Link href="/dashboard/invoices-payment">
                <FileText size={20} />
                Invoice Manage
              </Link>
            </Button>
            
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <div className="bg-card border border-border p-6 rounded-lg">
            <p className="text-muted-foreground text-sm mb-2">Account Tier</p>
            <p className="text-3xl font-bold text-accent">{user.tier}</p>
          </div>
          <div className="bg-card border border-border p-6 rounded-lg">
            <p className="text-muted-foreground text-sm mb-2">Email</p>
            <p className="text-lg font-semibold text-foreground">{user.email}</p>
          </div>
          <div className="bg-card border border-border p-6 rounded-lg">
            <p className="text-muted-foreground text-sm mb-2">Company</p>
            <p className="text-lg font-semibold text-foreground">{user.company || "Not set"}</p>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-4 mb-8 border-b border-border">
          <button
            onClick={() => setActiveTab("orders")}
            className={`px-4 py-3 font-medium transition ${
              activeTab === "orders"
                ? "text-accent border-b-2 border-accent"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            Orders
          </button>
          <button
            onClick={() => setActiveTab("invoices")}
            className={`px-4 py-3 font-medium transition ${
              activeTab === "invoices"
                ? "text-accent border-b-2 border-accent"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            Invoices
          </button>
          {/* <button
            onClick={() => setActiveTab("files")}
            className={`px-4 py-3 font-medium transition ${
              activeTab === "files"
                ? "text-accent border-b-2 border-accent"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            Files

          </button> */}
        </div>

        {/* Tab Content */}
        {activeTab === "orders" && <DashboardOrders />}
        {activeTab === "invoices" && <DashboardInvoices />}
        {/* {activeTab === "files" && <DashboardFiles />} */}
      </div>

      <Footer />
    </main>
  )
}
