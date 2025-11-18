"use client"

import type React from "react"
import { createContext, useContext, useEffect, useState } from "react"
import { useSession, signOut } from "@/lib/auth-client"

export type Role = "PUBLIC" | "VERIFIED" | "MANAGER" | "ADMIN"
export type Tier = "GOLD" | "PLATINUM" | "DIAMOND"

export interface AuthUser {
  id: string
  email: string
  name?: string
  company?: string
  role: Role
  tier: Tier
  image?: string | null
}

interface AuthContextType {
  user: AuthUser | null
  loading: boolean
  isAuthenticated: boolean
  logout: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const { data: session, isPending } = useSession()
  const [user, setUser] = useState<AuthUser | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (session?.user) {
      const u = session.user as any
      setUser({
        id: u.id,
        email: u.email,
        name: u.name,
        company: u.company,
        role: (u.role as Role) ?? "VERIFIED",
        tier: (u.tier as Tier) ?? "GOLD",
        image: u.image ?? null,
      })
    } else {
      setUser(null)
    }
    setLoading(!!isPending)
  }, [session, isPending])

  const logout = async () => {
    try {
      await signOut()
      setUser(null)
    } catch (error) {
      console.error("Logout failed:", error)
    }
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        isAuthenticated: !!user,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}
