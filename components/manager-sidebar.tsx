"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { LayoutDashboard, ShoppingCart, Users, BarChart3, Settings, LogOut, FileText } from "lucide-react"
import { useAuth } from "@/lib/auth-context"
import { Button } from "@/components/ui/button"

const menuItems_display = [
  { label: "Dashboard", href: "/manager-dashboard", icon: LayoutDashboard },
  { label: "Orders", href: "/manager-dashboard/orders", icon: ShoppingCart },
  { label: "Customers", href: "/manager-dashboard/customers", icon: Users },
  { label: "Invoices", href: "/manager-dashboard/invoices", icon: FileText },
  { label: "Reports", href: "/manager-dashboard/reports", icon: BarChart3 },
  { label: "Settings", href: "/manager-dashboard/settings", icon: Settings },
]

export default function ManagerSidebar() {
  const pathname = usePathname()
  const { logout } = useAuth()

  const handleLogout = async () => {
    await logout()
    window.location.href = "/login"
  }

  return (
    <aside className="w-64 bg-sidebar border-r border-sidebar-border flex flex-col">
      {/* Logo */}
      <div className="p-6 border-b border-sidebar-border">
        <h1 className="text-xl font-bold text-sidebar-foreground">Gator Budz</h1>
        <p className="text-xs text-sidebar-accent-foreground mt-1">Manager Panel</p>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
        {menuItems_display.map((item) => {
          const Icon = item.icon
          const isActive = pathname === item.href
          return (
            <Link key={item.href} href={item.href}>
              <div
                className={`flex items-center gap-3 px-4 py-3 rounded-lg transition ${
                  isActive
                    ? "bg-sidebar-primary text-sidebar-primary-foreground"
                    : "text-sidebar-foreground hover:bg-sidebar-accent"
                }`}
              >
                <Icon className="w-5 h-5" />
                <span className="text-sm font-medium">{item.label}</span>
              </div>
            </Link>
          )
        })}
      </nav>

      {/* Logout */}
      <div className="p-4 border-t border-sidebar-border">
        <Button
          onClick={handleLogout}
          variant="outline"
          className="w-full justify-start gap-2 bg-transparent text-sidebar-foreground hover:bg-sidebar-accent"
        >
          <LogOut className="w-4 h-4" />
          Logout
        </Button>
      </div>
    </aside>
  )
}
