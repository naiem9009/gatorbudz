"use client"

import { useAuth } from "@/lib/auth-context"
import { Bell, Search } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"

export default function ManagerHeader() {
  const { user } = useAuth()

  return (
    <header className="bg-card border-b border-border px-6 py-4 flex items-center justify-between">
      <div className="flex-1 max-w-md">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input placeholder="Search orders..." className="pl-10 bg-background border-border" />
        </div>
      </div>

      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" className="text-foreground">
          <Bell className="w-5 h-5" />
        </Button>

        <div className="flex items-center gap-3 pl-4 border-l border-border">
          <div className="text-right">
            <p className="text-sm font-medium text-foreground">{user?.email}</p>
            <p className="text-xs text-muted-foreground">Manager</p>
          </div>
          <div className="w-10 h-10 rounded-full bg-accent/20 flex items-center justify-center">
            <span className="text-sm font-bold text-accent">{user?.email?.[0].toUpperCase()}</span>
          </div>
        </div>
      </div>
    </header>
  )
}
