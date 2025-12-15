"use client"

import type React from "react"
import { createContext, useContext, useEffect, useState } from "react"
import { useSession, signOut } from "@/lib/auth-client"
import { User } from "better-auth"

export type Role = "PUBLIC" | "VERIFIED" | "MANAGER" | "ADMIN"
export type Tier = "NONE" | "GOLD" | "PLATINUM" | "DIAMOND" // Added NONE based on your Prisma schema

export interface AuthUser {
  id: string
  email: string
  name?: string
  company?: string
  phone?: string
  role: Role
  tier: Tier
  image?: string | null
  updatedAt?: Date
}

interface AuthContextType {
  user: AuthUser | null
  loading: boolean
  isAuthenticated: boolean
  logout: () => Promise<void>
  updateUser: (userData: Partial<AuthUser>) => void
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
        phone: u.phone,
        role: (u.role as Role) || "VERIFIED",
        tier: (u.tier as Tier) || "NONE",
        image: u.image || null,
        updatedAt: u.updatedAt ? new Date(u.updatedAt) : undefined,
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

  const updateUser = (userData: Partial<AuthUser>) => {
    setUser(prev => prev ? { ...prev, ...userData } : null)
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        isAuthenticated: !!user,
        logout,
        updateUser,
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