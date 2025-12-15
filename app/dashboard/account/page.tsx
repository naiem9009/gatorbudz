"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Header from "@/components/header"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { useAuth } from "@/lib/auth-context"
import Link from "next/link"
import { 
  ArrowLeft, 
  User, 
  Lock, 
  Clock, 
  Phone, 
  Mail, 
  Building, 
  MapPin, 
  Truck,
  CreditCard,
  Home
} from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Loader2 } from "lucide-react"
import { Separator } from "@/components/ui/separator"
import { Label } from "@/components/ui/label"

export default function AccountSettingsPage() {
  const { user, loading, updateUser } = useAuth()
  const router = useRouter()
  
  // Profile form data
  const [profileForm, setProfileForm] = useState({
    name: "",
    company: "",
    email: "",
    phone: "",
  })
  
  // Billing address form data
  const [billingForm, setBillingForm] = useState({
    billingAddress1: "",
    billingAddress2: "",
    billingCity: "",
    billingState: "",
    billingPostalCode: "",
    billingCountry: "",
  })
  
  // Shipping address form data
  const [shippingForm, setShippingForm] = useState({
    shippingAddress1: "",
    shippingAddress2: "",
    shippingCity: "",
    shippingState: "",
    shippingPostalCode: "",
    shippingCountry: "",
  })
  
  const [savingProfile, setSavingProfile] = useState(false)
  const [savingBilling, setSavingBilling] = useState(false)
  const [savingShipping, setSavingShipping] = useState(false)
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string; section: string } | null>(null)
  const [initialLoading, setInitialLoading] = useState(true)
  const [addresses, setAddresses] = useState<any>(null)

  // Load user data when component mounts
  useEffect(() => {
    const loadUserData = async () => {
      if (user && !loading) {
        try {
          // Load profile data
          setProfileForm({
            name: user.name || "",
            company: user.company || "",
            email: user.email || "",
            phone: (user as any).phone || "",
          })
          
          // Load addresses from API
          const res = await fetch("/api/users/profile/addresses", {
            method: "GET",
            headers: { "Content-Type": "application/json" },
          })
          
          if (res.ok) {
            const data = await res.json()
            if (data.success) {
              setAddresses(data.data)
              
              // Set billing address
              setBillingForm({
                billingAddress1: data.data.billingAddress1 || "",
                billingAddress2: data.data.billingAddress2 || "",
                billingCity: data.data.billingCity || "",
                billingState: data.data.billingState || "",
                billingPostalCode: data.data.billingPostalCode || "",
                billingCountry: data.data.billingCountry || "",
              })
              
              // Set shipping address
              setShippingForm({
                shippingAddress1: data.data.shippingAddress1 || "",
                shippingAddress2: data.data.shippingAddress2 || "",
                shippingCity: data.data.shippingCity || "",
                shippingState: data.data.shippingState || "",
                shippingPostalCode: data.data.shippingPostalCode || "",
                shippingCountry: data.data.shippingCountry || "",
              })
            }
          }
        } catch (error) {
          console.error("Error loading addresses:", error)
        } finally {
          setInitialLoading(false)
        }
      }
    }
    
    loadUserData()
  }, [user, loading])

  if (loading || initialLoading) {
    return (
      <main className="min-h-screen bg-background">
        <Header />
        <div className="max-w-4xl mx-auto px-4 md:px-8 py-16">
          <div className="flex items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-accent" />
            <span className="ml-2">Loading account settings...</span>
          </div>
        </div>
      </main>
    )
  }

  if (!user) {
    return (
      <main className="min-h-screen bg-background">
        <Header />
        <div className="max-w-4xl mx-auto px-4 md:px-8 py-16 text-center">
          <p className="text-muted-foreground mb-4">Please log in to access account settings</p>
          <Link href="/login">
            <Button className="bg-accent text-accent-foreground hover:opacity-90">Go to Login</Button>
          </Link>
        </div>
      </main>
    )
  }

  async function handleSaveProfile(e: React.FormEvent) {
    e.preventDefault()
    setSavingProfile(true)
    setMessage(null)

    try {
      const res = await fetch("/api/users/profile/update", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: profileForm.name.trim(),
          company: profileForm.company.trim(),
          phone: profileForm.phone.trim(),
        }),
      })

      const data = await res.json()

      if (res.ok && data.success) {
        setMessage({ 
          type: "success", 
          text: "Profile updated successfully!", 
          section: "profile" 
        })
        
        // Update the user context with new data
        if (updateUser && data.data) {
          updateUser(data.data)
        }
        
        setTimeout(() => setMessage(null), 3000)
      } else {
        setMessage({ 
          type: "error", 
          text: data.error || "Failed to update profile. Please try again.", 
          section: "profile" 
        })
      }
    } catch (error) {
      console.error("Save error:", error)
      setMessage({ 
        type: "error", 
        text: "An error occurred while saving. Please check your connection.", 
        section: "profile" 
      })
    } finally {
      setSavingProfile(false)
    }
  }

  async function handleSaveBilling(e: React.FormEvent) {
    e.preventDefault()
    setSavingBilling(true)
    setMessage(null)

    try {
      const res = await fetch("/api/users/profile/addresses", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "billing",
          ...billingForm,
        }),
      })

      const data = await res.json()

      if (res.ok && data.success) {
        setMessage({ 
          type: "success", 
          text: "Billing address updated successfully!", 
          section: "billing" 
        })
        setTimeout(() => setMessage(null), 3000)
      } else {
        setMessage({ 
          type: "error", 
          text: data.error || "Failed to update billing address. Please try again.", 
          section: "billing" 
        })
      }
    } catch (error) {
      console.error("Save error:", error)
      setMessage({ 
        type: "error", 
        text: "An error occurred while saving. Please check your connection.", 
        section: "billing" 
      })
    } finally {
      setSavingBilling(false)
    }
  }

  async function handleSaveShipping(e: React.FormEvent) {
    e.preventDefault()
    setSavingShipping(true)
    setMessage(null)

    try {
      const res = await fetch("/api/users/profile/addresses", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "shipping",
          ...shippingForm,
        }),
      })

      const data = await res.json()

      if (res.ok && data.success) {
        setMessage({ 
          type: "success", 
          text: "Shipping address updated successfully!", 
          section: "shipping" 
        })
        setTimeout(() => setMessage(null), 3000)
      } else {
        setMessage({ 
          type: "error", 
          text: data.error || "Failed to update shipping address. Please try again.", 
          section: "shipping" 
        })
      }
    } catch (error) {
      console.error("Save error:", error)
      setMessage({ 
        type: "error", 
        text: "An error occurred while saving. Please check your connection.", 
        section: "shipping" 
      })
    } finally {
      setSavingShipping(false)
    }
  }

  // Check if forms have changes
  const hasProfileChanges = 
    profileForm.name !== (user.name || "") ||
    profileForm.company !== (user.company || "") ||
    profileForm.phone !== ((user as any).phone || "")

  const hasBillingChanges = addresses ? (
    billingForm.billingAddress1 !== (addresses.billingAddress1 || "") ||
    billingForm.billingAddress2 !== (addresses.billingAddress2 || "") ||
    billingForm.billingCity !== (addresses.billingCity || "") ||
    billingForm.billingState !== (addresses.billingState || "") ||
    billingForm.billingPostalCode !== (addresses.billingPostalCode || "") ||
    billingForm.billingCountry !== (addresses.billingCountry || "")
  ) : true

  const hasShippingChanges = addresses ? (
    shippingForm.shippingAddress1 !== (addresses.shippingAddress1 || "") ||
    shippingForm.shippingAddress2 !== (addresses.shippingAddress2 || "") ||
    shippingForm.shippingCity !== (addresses.shippingCity || "") ||
    shippingForm.shippingState !== (addresses.shippingState || "") ||
    shippingForm.shippingPostalCode !== (addresses.shippingPostalCode || "") ||
    shippingForm.shippingCountry !== (addresses.shippingCountry || "")
  ) : true

  // Use same address for shipping
  const handleUseSameAddress = () => {
    setShippingForm({
      shippingAddress1: billingForm.billingAddress1,
      shippingAddress2: billingForm.billingAddress2,
      shippingCity: billingForm.billingCity,
      shippingState: billingForm.billingState,
      shippingPostalCode: billingForm.billingPostalCode,
      shippingCountry: billingForm.billingCountry,
    })
  }

  return (
    <main className="min-h-screen bg-background">
      <Header />

      <div className="max-w-4xl mx-auto px-4 md:px-8 py-8">
        {/* Back Button */}
        <Link href="/dashboard" className="inline-flex items-center gap-2 text-accent hover:opacity-80 transition mb-8">
          <ArrowLeft size={20} />
          Back to Dashboard
        </Link>

        <div className="space-y-8">
          {/* Page Header */}
          <div>
            <h1 className="text-3xl font-bold text-foreground mb-2">Account Settings</h1>
            <p className="text-muted-foreground">Manage your profile, addresses, and account preferences</p>
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
              <form onSubmit={handleSaveProfile} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="email" className="flex items-center gap-2">
                      <Mail className="w-4 h-4" />
                      Email Address
                    </Label>
                    <Input 
                      id="email"
                      type="email" 
                      value={profileForm.email} 
                      disabled 
                      className="bg-muted cursor-not-allowed"
                    />
                    <p className="text-xs text-muted-foreground">Email cannot be changed</p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="name" className="flex items-center gap-2">
                      <User className="w-4 h-4" />
                      Full Name
                    </Label>
                    <Input
                      id="name"
                      value={profileForm.name}
                      onChange={(e) => setProfileForm({ ...profileForm, name: e.target.value })}
                      placeholder="John Doe"
                      maxLength={100}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="company" className="flex items-center gap-2">
                      <Building className="w-4 h-4" />
                      Company
                    </Label>
                    <Input
                      id="company"
                      value={profileForm.company}
                      onChange={(e) => setProfileForm({ ...profileForm, company: e.target.value })}
                      placeholder="Your Company"
                      maxLength={100}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="phone" className="flex items-center gap-2">
                      <Phone className="w-4 h-4" />
                      Phone Number
                    </Label>
                    <Input
                      id="phone"
                      value={profileForm.phone}
                      onChange={(e) => setProfileForm({ ...profileForm, phone: e.target.value })}
                      placeholder="+1 (555) 123-4567"
                      maxLength={20}
                    />
                  </div>
                </div>

                {message && message.section === "profile" && (
                  <Alert variant={message.type === "success" ? "default" : "destructive"}>
                    <AlertDescription>
                      {message.text}
                    </AlertDescription>
                  </Alert>
                )}

                <div className="flex gap-3 pt-2">
                  <Button
                    type="submit"
                    disabled={savingProfile || !hasProfileChanges}
                    className="bg-accent text-accent-foreground hover:opacity-90 flex-1"
                  >
                    {savingProfile ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      "Save Profile"
                    )}
                  </Button>
                  
                  {hasProfileChanges && (
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => {
                        setProfileForm({
                          name: user.name || "",
                          company: user.company || "",
                          email: user.email || "",
                          phone: (user as any).phone || "",
                        })
                      }}
                      disabled={savingProfile}
                      className="flex-1"
                    >
                      Discard Changes
                    </Button>
                  )}
                </div>
              </form>
            </CardContent>
          </Card>

          {/* Billing Address */}
          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="w-5 h-5" />
                Billing Address
              </CardTitle>
              <CardDescription>Update your billing address for invoices and payments</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSaveBilling} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="billingAddress1">Address Line 1</Label>
                    <Input
                      id="billingAddress1"
                      value={billingForm.billingAddress1}
                      onChange={(e) => setBillingForm({ ...billingForm, billingAddress1: e.target.value })}
                      placeholder="123 Main St"
                      maxLength={100}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="billingAddress2">Address Line 2 (Optional)</Label>
                    <Input
                      id="billingAddress2"
                      value={billingForm.billingAddress2}
                      onChange={(e) => setBillingForm({ ...billingForm, billingAddress2: e.target.value })}
                      placeholder="Apt, Suite, Unit"
                      maxLength={100}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="billingCity">City</Label>
                    <Input
                      id="billingCity"
                      value={billingForm.billingCity}
                      onChange={(e) => setBillingForm({ ...billingForm, billingCity: e.target.value })}
                      placeholder="New York"
                      maxLength={50}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="billingState">State/Province</Label>
                    <Input
                      id="billingState"
                      value={billingForm.billingState}
                      onChange={(e) => setBillingForm({ ...billingForm, billingState: e.target.value })}
                      placeholder="NY"
                      maxLength={50}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="billingPostalCode">Postal Code</Label>
                    <Input
                      id="billingPostalCode"
                      value={billingForm.billingPostalCode}
                      onChange={(e) => setBillingForm({ ...billingForm, billingPostalCode: e.target.value })}
                      placeholder="10001"
                      maxLength={20}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="billingCountry">Country</Label>
                    <Input
                      id="billingCountry"
                      value={billingForm.billingCountry}
                      onChange={(e) => setBillingForm({ ...billingForm, billingCountry: e.target.value })}
                      placeholder="United States"
                      maxLength={50}
                    />
                  </div>
                </div>

                {message && message.section === "billing" && (
                  <Alert variant={message.type === "success" ? "default" : "destructive"}>
                    <AlertDescription>
                      {message.text}
                    </AlertDescription>
                  </Alert>
                )}

                <div className="flex gap-3 pt-2">
                  <Button
                    type="submit"
                    disabled={savingBilling || !hasBillingChanges}
                    className="bg-accent text-accent-foreground hover:opacity-90 flex-1"
                  >
                    {savingBilling ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      "Save Billing Address"
                    )}
                  </Button>
                  
                  {hasBillingChanges && addresses && (
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => {
                        setBillingForm({
                          billingAddress1: addresses.billingAddress1 || "",
                          billingAddress2: addresses.billingAddress2 || "",
                          billingCity: addresses.billingCity || "",
                          billingState: addresses.billingState || "",
                          billingPostalCode: addresses.billingPostalCode || "",
                          billingCountry: addresses.billingCountry || "",
                        })
                      }}
                      disabled={savingBilling}
                      className="flex-1"
                    >
                      Discard Changes
                    </Button>
                  )}
                </div>
              </form>
            </CardContent>
          </Card>

          {/* Shipping Address */}
          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Truck className="w-5 h-5" />
                Shipping Address
              </CardTitle>
              <CardDescription>Update your shipping address for orders and deliveries</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="mb-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleUseSameAddress}
                  className="mb-2"
                >
                  <Home className="w-4 h-4 mr-2" />
                  Use Same as Billing Address
                </Button>
                <p className="text-xs text-muted-foreground">
                  Click to copy billing address to shipping address
                </p>
              </div>

              <Separator className="my-4" />

              <form onSubmit={handleSaveShipping} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="shippingAddress1">Address Line 1</Label>
                    <Input
                      id="shippingAddress1"
                      value={shippingForm.shippingAddress1}
                      onChange={(e) => setShippingForm({ ...shippingForm, shippingAddress1: e.target.value })}
                      placeholder="123 Main St"
                      maxLength={100}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="shippingAddress2">Address Line 2 (Optional)</Label>
                    <Input
                      id="shippingAddress2"
                      value={shippingForm.shippingAddress2}
                      onChange={(e) => setShippingForm({ ...shippingForm, shippingAddress2: e.target.value })}
                      placeholder="Apt, Suite, Unit"
                      maxLength={100}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="shippingCity">City</Label>
                    <Input
                      id="shippingCity"
                      value={shippingForm.shippingCity}
                      onChange={(e) => setShippingForm({ ...shippingForm, shippingCity: e.target.value })}
                      placeholder="New York"
                      maxLength={50}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="shippingState">State/Province</Label>
                    <Input
                      id="shippingState"
                      value={shippingForm.shippingState}
                      onChange={(e) => setShippingForm({ ...shippingForm, shippingState: e.target.value })}
                      placeholder="NY"
                      maxLength={50}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="shippingPostalCode">Postal Code</Label>
                    <Input
                      id="shippingPostalCode"
                      value={shippingForm.shippingPostalCode}
                      onChange={(e) => setShippingForm({ ...shippingForm, shippingPostalCode: e.target.value })}
                      placeholder="10001"
                      maxLength={20}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="shippingCountry">Country</Label>
                    <Input
                      id="shippingCountry"
                      value={shippingForm.shippingCountry}
                      onChange={(e) => setShippingForm({ ...shippingForm, shippingCountry: e.target.value })}
                      placeholder="United States"
                      maxLength={50}
                    />
                  </div>
                </div>

                {message && message.section === "shipping" && (
                  <Alert variant={message.type === "success" ? "default" : "destructive"}>
                    <AlertDescription>
                      {message.text}
                    </AlertDescription>
                  </Alert>
                )}

                <div className="flex gap-3 pt-2">
                  <Button
                    type="submit"
                    disabled={savingShipping || !hasShippingChanges}
                    className="bg-accent text-accent-foreground hover:opacity-90 flex-1"
                  >
                    {savingShipping ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      "Save Shipping Address"
                    )}
                  </Button>
                  
                  {hasShippingChanges && addresses && (
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => {
                        setShippingForm({
                          shippingAddress1: addresses.shippingAddress1 || "",
                          shippingAddress2: addresses.shippingAddress2 || "",
                          shippingCity: addresses.shippingCity || "",
                          shippingState: addresses.shippingState || "",
                          shippingPostalCode: addresses.shippingPostalCode || "",
                          shippingCountry: addresses.shippingCountry || "",
                        })
                      }}
                      disabled={savingShipping}
                      className="flex-1"
                    >
                      Discard Changes
                    </Button>
                  )}
                </div>
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
                  <p className="text-sm text-muted-foreground">Access level and features</p>
                </div>
                <Badge 
                  variant="outline" 
                  className="text-base px-3 py-1 border-accent text-accent"
                >
                  {user.tier || "GOLD"}
                </Badge>
              </div>

              <div className="pt-4 border-t border-border">
                <p className="text-sm text-muted-foreground mb-3">
                  Want to upgrade your tier? Contact support for more information.
                </p>
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
              <Button 
                variant="outline" 
                className="w-full justify-start bg-transparent text-foreground"
                onClick={() => router.push("/change-password")}
              >
                Change Password
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </main>
  )
}