"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Header from "@/components/header"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { useAuth } from "@/lib/auth-context"
import Link from "next/link"
import { ArrowLeft, User, Lock, Clock } from "lucide-react"

export default function AccountSettingsPage() {
  const { user, loading } = useAuth()
  const router = useRouter()
  const [formData, setFormData] = useState({
    name: user?.name || "",
    company: user?.company || "",
    email: user?.email || "",
  })
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState("")

  if (loading) {
    return (
      <main className="min-h-screen bg-background">
        <Header />
        <div className="max-w-3xl mx-auto px-4 md:px-8 py-16">
          <div className="animate-pulse space-y-4">
            <div className="h-8 bg-muted rounded w-1/4" />
            <div className="h-4 bg-muted rounded w-1/3" />
          </div>
        </div>
      </main>
    )
  }

  if (!user) {
    return (
      <main className="min-h-screen bg-background">
        <Header />
        <div className="max-w-3xl mx-auto px-4 md:px-8 py-16 text-center">
          <p className="text-muted-foreground mb-4">Please log in to access account settings</p>
          <Link href="/login">
            <Button className="bg-accent text-accent-foreground hover:opacity-90">Go to Login</Button>
          </Link>
        </div>
      </main>
    )
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    setMessage("")

    try {
      const res = await fetch("/api/users/profile/update", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      })

      if (res.ok) {
        setMessage("Profile updated successfully!")
        setTimeout(() => setMessage(""), 3000)
      } else {
        setMessage("Failed to update profile")
      }
    } catch (error) {
      setMessage("An error occurred")
    } finally {
      setSaving(false)
    }
  }

  return (
    <main className="min-h-screen bg-background">
      <Header />

      <div className="max-w-3xl mx-auto px-4 md:px-8 py-8">
        {/* Back Button */}
        <Link href="/dashboard" className="inline-flex items-center gap-2 text-accent hover:opacity-80 transition mb-8">
          <ArrowLeft size={20} />
          Back to Dashboard
        </Link>

        <div className="space-y-6">
          {/* Page Header */}
          <div>
            <h1 className="text-3xl font-bold text-foreground mb-2">Account Settings</h1>
            <p className="text-muted-foreground">Manage your profile and account preferences</p>
          </div>

          {/* Profile Information */}
          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="w-5 h-5" />
                Profile Information
              </CardTitle>
              <CardDescription>Update your personal details</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSave} className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-foreground mb-2 block">Full Name</label>
                  <Input
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="John Doe"
                  />
                </div>

                <div>
                  <label className="text-sm font-medium text-foreground mb-2 block">Company</label>
                  <Input
                    value={formData.company}
                    onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                    placeholder="Your Company"
                  />
                </div>

                <div>
                  <label className="text-sm font-medium text-foreground mb-2 block">Email</label>
                  <Input type="email" value={formData.email} disabled className="bg-muted" />
                  <p className="text-xs text-muted-foreground mt-1">Email cannot be changed</p>
                </div>

                {message && (
                  <div
                    className={`p-3 rounded text-sm ${
                      message.includes("success") ? "bg-green-500/10 text-green-700" : "bg-red-500/10 text-red-700"
                    }`}
                  >
                    {message}
                  </div>
                )}

                <Button
                  type="submit"
                  disabled={saving}
                  className="w-full bg-accent text-accent-foreground hover:opacity-90"
                >
                  {saving ? "Saving..." : "Save Changes"}
                </Button>
              </form>
            </CardContent>
          </Card>

          {/* Account Tier */}
          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle>Account Tier</CardTitle>
              <CardDescription>Your current subscription level</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-semibold text-foreground mb-1">Current Tier</p>
                  <p className="text-sm text-muted-foreground">Tier: {user.tier}</p>
                </div>
                <Badge className="bg-blue-500/10 text-blue-700 text-base px-3 py-1">{user.tier}</Badge>
              </div>

              <div className="pt-4 border-t border-border">
                <p className="text-sm text-muted-foreground mb-3">Want to upgrade your tier?</p>
                <Button
                  onClick={() => router.push("/dashboard/tier-upgrade")}
                  variant="outline"
                  className="w-full bg-transparent"
                >
                  Request Tier Upgrade
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Security */}
          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Lock className="w-5 h-5" />
                Security
              </CardTitle>
              <CardDescription>Manage your account security</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Button variant="outline" className="w-full justify-start bg-transparent text-foreground">
                Change Password
              </Button>
            </CardContent>
          </Card>

          {/* Account Activity */}
          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="w-5 h-5" />
                Account Activity
              </CardTitle>
              <CardDescription>Recent login activity</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex justify-between items-center pb-3 border-b border-border last:border-0">
                  <div>
                    <p className="text-sm font-medium text-foreground">Current Session</p>
                    <p className="text-xs text-muted-foreground">Browser/Device</p>
                  </div>
                  <Badge className="bg-green-500/10 text-green-700">Active</Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

    </main>
  )
}
