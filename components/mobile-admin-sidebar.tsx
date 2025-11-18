"use client"

import { useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  LayoutDashboard,
  Users,
  Package,
  BarChart3,
  Settings,
  LogOut,
  ClipboardList,
  FileText,
  Menu,
  X,
} from "lucide-react"
import { useAuth } from "@/lib/auth-context"
import { Button } from "@/components/ui/button"

const menuItems = [
  { label: "Dashboard", href: "/admin-dashboard", icon: LayoutDashboard },
  { label: "Users", href: "/admin-dashboard/users", icon: Users },
  { label: "Products", href: "/admin-dashboard/products", icon: Package },
  { label: "Tier Proposals", href: "/admin-dashboard/tier-proposals", icon: ClipboardList },
  { label: "Audit Logs", href: "/admin-dashboard/audit-logs", icon: FileText },
  { label: "Analytics", href: "/admin-dashboard/analytics", icon: BarChart3 },
  { label: "Settings", href: "/admin-dashboard/settings", icon: Settings },
]

export default function MobileAdminSidebar() {
  const pathname = usePathname()
  const { logout } = useAuth()
  const [isOpen, setIsOpen] = useState(false)

  const handleLogout = async () => {
    await logout()
    window.location.href = "/login"
  }

  return (
    <>
      {/* Mobile Menu Button */}
      <button
        className="fixed bottom-6 right-6 z-40 md:hidden w-14 h-14 bg-accent text-accent-foreground rounded-full flex items-center justify-center shadow-lg"
        onClick={() => setIsOpen(!isOpen)}
      >
        {isOpen ? <X size={24} /> : <Menu size={24} />}
      </button>

      {/* Mobile Sidebar */}
      {isOpen && (
        <>
          {/* Backdrop */}
          <div className="fixed inset-0 z-30 bg-black/50 md:hidden" onClick={() => setIsOpen(false)} />

          {/* Sidebar */}
          <aside className="fixed left-0 top-0 z-40 w-64 h-screen bg-sidebar border-r border-sidebar-border flex flex-col md:hidden overflow-y-auto">
            {/* Logo */}
            <div className="p-6 border-b border-sidebar-border">
              <h1 className="text-xl font-bold text-sidebar-foreground">Gator Budz</h1>
              <p className="text-xs text-sidebar-accent-foreground mt-1">Admin Panel</p>
            </div>

            {/* Navigation */}
            <nav className="flex-1 p-4 space-y-2">
              {menuItems.map((item) => {
                const Icon = item.icon
                const isActive = pathname === item.href
                return (
                  <Link key={item.href} href={item.href} onClick={() => setIsOpen(false)}>
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
        </>
      )}
    </>
  )
}
