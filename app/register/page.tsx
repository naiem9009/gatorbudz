"use client"

import type React from "react"
import { useState, useRef } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { Upload, X, MapPin, Building } from "lucide-react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

// US states for dropdown
const US_STATES = [
  "AL", "AK", "AZ", "AR", "CA", "CO", "CT", "DE", "FL", "GA", 
  "HI", "ID", "IL", "IN", "IA", "KS", "KY", "LA", "ME", "MD", 
  "MA", "MI", "MN", "MS", "MO", "MT", "NE", "NV", "NH", "NJ", 
  "NM", "NY", "NC", "ND", "OH", "OK", "OR", "PA", "RI", "SC", 
  "SD", "TN", "TX", "UT", "VT", "VA", "WA", "WV", "WI", "WY"
]

export default function RegisterPage() {
  const router = useRouter()
  const [formData, setFormData] = useState({
    name: "",
    company: "",
    email: "",
    phone: "",
    password: "",
    confirmPassword: "",
    
    // Billing address fields
    billingAddress1: "",
    billingAddress2: "",
    billingCity: "",
    billingState: "",
    billingPostalCode: "",
    billingCountry: "US",
    
    // Shipping address fields
    shippingAddress1: "",
    shippingAddress2: "",
    shippingCity: "",
    shippingState: "",
    shippingPostalCode: "",
    shippingCountry: "US",
  })
  
  const [useSameAddress, setUseSameAddress] = useState(true)
  const [licenseFile, setLicenseFile] = useState<File | null>(null)
  const [licensePreview, setLicensePreview] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
    
    // If using same address and billing address is updated, update shipping too
    if (useSameAddress && name.startsWith("billing")) {
      const shippingField = name.replace("billing", "shipping")
      setFormData((prev) => ({ ...prev, [shippingField]: value }))
    }
  }

  const handleSelectChange = (name: string, value: string) => {
    setFormData((prev) => ({ ...prev, [name]: value }))
    
    // If using same address and billing state/country is updated, update shipping too
    if (useSameAddress && (name === "billingState" || name === "billingCountry")) {
      const shippingField = name.replace("billing", "shipping")
      setFormData((prev) => ({ ...prev, [shippingField]: value }))
    }
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      // Validate file type
      const validTypes = ["image/jpeg", "image/png", "image/jpg", "application/pdf"]
      if (!validTypes.includes(file.type)) {
        setError("Please upload a JPG, PNG, or PDF file")
        return
      }

      // Validate file size (5MB max)
      if (file.size > 5 * 1024 * 1024) {
        setError("File size should be less than 5MB")
        return
      }

      setLicenseFile(file)
      if (file.type.startsWith("image/")) {
        const reader = new FileReader()
        reader.onloadend = () => {
          setLicensePreview(reader.result as string)
        }
        reader.readAsDataURL(file)
      } else {
        setLicensePreview(null)
      }
    }
  }

  const removeFile = () => {
    setLicenseFile(null)
    setLicensePreview(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ""
    }
  }

  const handleUseSameAddressChange = (checked: boolean) => {
    setUseSameAddress(checked)
    if (checked) {
      // Copy billing address to shipping address
      setFormData((prev) => ({
        ...prev,
        shippingAddress1: prev.billingAddress1,
        shippingAddress2: prev.billingAddress2,
        shippingCity: prev.billingCity,
        shippingState: prev.billingState,
        shippingPostalCode: prev.billingPostalCode,
        shippingCountry: prev.billingCountry,
      }))
    }
  }

  const validateForm = () => {
    // Basic required fields
    if (!formData.name.trim()) {
      setError("Full name is required")
      return false
    }

    if (!formData.company.trim()) {
      setError("Company name is required")
      return false
    }

    if (!formData.email.trim()) {
      setError("Email is required")
      return false
    }

    if (!formData.phone.trim()) {
      setError("Phone number is required")
      return false
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(formData.email)) {
      setError("Please enter a valid email address")
      return false
    }

    // Validate phone format (basic)
    const phoneRegex = /^[\+]?[1-9][\d]{0,15}$/
    const cleanPhone = formData.phone.replace(/\D/g, '')
    if (!phoneRegex.test(cleanPhone)) {
      setError("Please enter a valid phone number")
      return false
    }

    // Billing address validation
    if (!formData.billingAddress1.trim()) {
      setError("Billing address line 1 is required")
      return false
    }

    if (!formData.billingCity.trim()) {
      setError("Billing city is required")
      return false
    }

    if (!formData.billingState.trim()) {
      setError("Billing state is required")
      return false
    }

    if (!formData.billingPostalCode.trim()) {
      setError("Billing postal code is required")
      return false
    }

    if (!formData.billingCountry.trim()) {
      setError("Billing country is required")
      return false
    }

    // Shipping address validation if not using same address
    if (!useSameAddress) {
      if (!formData.shippingAddress1.trim()) {
        setError("Shipping address line 1 is required")
        return false
      }

      if (!formData.shippingCity.trim()) {
        setError("Shipping city is required")
        return false
      }

      if (!formData.shippingState.trim()) {
        setError("Shipping state is required")
        return false
      }

      if (!formData.shippingPostalCode.trim()) {
        setError("Shipping postal code is required")
        return false
      }

      if (!formData.shippingCountry.trim()) {
        setError("Shipping country is required")
        return false
      }
    }

    // Password validation
    if (formData.password !== formData.confirmPassword) {
      setError("Passwords do not match")
      return false
    }

    if (formData.password.length < 8) {
      setError("Password must be at least 8 characters")
      return false
    }

    if (!licenseFile) {
      setError("Please upload your resale/tax license")
      return false
    }

    return true
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")

    if (!validateForm()) {
      return
    }

    setLoading(true)

    try {
      // Create FormData to handle file upload
      const formDataToSend = new FormData()
      
      // Basic info
      formDataToSend.append("name", formData.name.trim())
      formDataToSend.append("company", formData.company.trim())
      formDataToSend.append("email", formData.email.trim())
      formDataToSend.append("phone", formData.phone.trim())
      formDataToSend.append("password", formData.password)
      
      // Billing address
      formDataToSend.append("billingAddress1", formData.billingAddress1.trim())
      formDataToSend.append("billingAddress2", formData.billingAddress2.trim())
      formDataToSend.append("billingCity", formData.billingCity.trim())
      formDataToSend.append("billingState", formData.billingState.trim())
      formDataToSend.append("billingPostalCode", formData.billingPostalCode.trim())
      formDataToSend.append("billingCountry", formData.billingCountry.trim())
      
      // Shipping address
      if (useSameAddress) {
        // Use billing address for shipping
        formDataToSend.append("shippingAddress1", formData.billingAddress1.trim())
        formDataToSend.append("shippingAddress2", formData.billingAddress2.trim())
        formDataToSend.append("shippingCity", formData.billingCity.trim())
        formDataToSend.append("shippingState", formData.billingState.trim())
        formDataToSend.append("shippingPostalCode", formData.billingPostalCode.trim())
        formDataToSend.append("shippingCountry", formData.billingCountry.trim())
      } else {
        formDataToSend.append("shippingAddress1", formData.shippingAddress1.trim())
        formDataToSend.append("shippingAddress2", formData.shippingAddress2.trim())
        formDataToSend.append("shippingCity", formData.shippingCity.trim())
        formDataToSend.append("shippingState", formData.shippingState.trim())
        formDataToSend.append("shippingPostalCode", formData.shippingPostalCode.trim())
        formDataToSend.append("shippingCountry", formData.shippingCountry.trim())
      }
      
      // License file
      if (licenseFile) {
        formDataToSend.append("license", licenseFile)
      }

      const response = await fetch("/api/auth/register", {
        method: "POST",
        body: formDataToSend,
      })

      const data = await response.json()

      if (response.ok) {
        // Registration successful
        localStorage.setItem("authToken", data.token)
        localStorage.setItem("user", JSON.stringify(data.user))
        
        // Redirect based on user role
        if (data.user.role === "PUBLIC") {
          router.push("/dashboard")
        } else {
          router.push("/pending-verification")
        }
      } else {
        setError(data.error || "Registration failed. Please try again.")
      }
    } catch (err) {
      console.error("Registration error:", err)
      setError("An error occurred. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="min-h-screen bg-background flex items-center justify-center px-4 py-8">
      <Card className="w-full max-w-4xl">
        <CardHeader>
          <CardTitle className="text-3xl font-bold">Create Business Account</CardTitle>
          <CardDescription>Register for wholesale buyer access. All fields marked with * are required.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-8">
            {/* Contact Information */}
            <div className="space-y-6">
              <div className="flex items-center gap-2">
                <Building className="w-5 h-5" />
                <h3 className="text-lg font-semibold">Contact Information</h3>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Full Name *</Label>
                    <Input
                      id="name"
                      name="name"
                      value={formData.name}
                      onChange={handleChange}
                      required
                      placeholder="John Doe"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="company">Company Name *</Label>
                    <Input
                      id="company"
                      name="company"
                      value={formData.company}
                      onChange={handleChange}
                      required
                      placeholder="Your Company LLC"
                    />
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="email">Email Address *</Label>
                    <Input
                      id="email"
                      name="email"
                      type="email"
                      value={formData.email}
                      onChange={handleChange}
                      required
                      placeholder="buyer@company.com"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="phone">Phone Number *</Label>
                    <Input
                      id="phone"
                      name="phone"
                      type="tel"
                      value={formData.phone}
                      onChange={handleChange}
                      required
                      placeholder="(123) 456-7890"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Billing Address */}
            <div className="space-y-6">
              <div className="flex items-center gap-2">
                <MapPin className="w-5 h-5" />
                <h3 className="text-lg font-semibold">Billing Address *</h3>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="billingAddress1">Address Line 1 *</Label>
                    <Input
                      id="billingAddress1"
                      name="billingAddress1"
                      value={formData.billingAddress1}
                      onChange={handleChange}
                      required
                      placeholder="123 Main St"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="billingAddress2">Address Line 2 (Optional)</Label>
                    <Input
                      id="billingAddress2"
                      name="billingAddress2"
                      value={formData.billingAddress2}
                      onChange={handleChange}
                      placeholder="Suite, Apt, Unit"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="billingCity">City *</Label>
                    <Input
                      id="billingCity"
                      name="billingCity"
                      value={formData.billingCity}
                      onChange={handleChange}
                      required
                      placeholder="New York"
                    />
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="billingState">State *</Label>
                    <Select
                      value={formData.billingState}
                      onValueChange={(value) => handleSelectChange("billingState", value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select state" />
                      </SelectTrigger>
                      <SelectContent>
                        {US_STATES.map((state) => (
                          <SelectItem key={state} value={state}>
                            {state}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="billingPostalCode">Postal Code *</Label>
                    <Input
                      id="billingPostalCode"
                      name="billingPostalCode"
                      value={formData.billingPostalCode}
                      onChange={handleChange}
                      required
                      placeholder="10001"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="billingCountry">Country *</Label>
                    <Select
                      value={formData.billingCountry}
                      onValueChange={(value) => handleSelectChange("billingCountry", value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select country" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="US">United States</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
            </div>

            {/* Shipping Address */}
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <MapPin className="w-5 h-5" />
                  <h3 className="text-lg font-semibold">Shipping Address</h3>
                </div>
                
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="useSameAddress"
                    checked={useSameAddress}
                    onCheckedChange={handleUseSameAddressChange}
                  />
                  <Label htmlFor="useSameAddress" className="text-sm cursor-pointer">
                    Same as billing address
                  </Label>
                </div>
              </div>
              
              {!useSameAddress && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="shippingAddress1">Address Line 1 *</Label>
                      <Input
                        id="shippingAddress1"
                        name="shippingAddress1"
                        value={formData.shippingAddress1}
                        onChange={handleChange}
                        required
                        placeholder="123 Main St"
                        disabled={useSameAddress}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="shippingAddress2">Address Line 2 (Optional)</Label>
                      <Input
                        id="shippingAddress2"
                        name="shippingAddress2"
                        value={formData.shippingAddress2}
                        onChange={handleChange}
                        placeholder="Suite, Apt, Unit"
                        disabled={useSameAddress}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="shippingCity">City *</Label>
                      <Input
                        id="shippingCity"
                        name="shippingCity"
                        value={formData.shippingCity}
                        onChange={handleChange}
                        required
                        placeholder="New York"
                        disabled={useSameAddress}
                      />
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="shippingState">State *</Label>
                      <Select
                        value={formData.shippingState}
                        onValueChange={(value) => handleSelectChange("shippingState", value)}
                        disabled={useSameAddress}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select state" />
                        </SelectTrigger>
                        <SelectContent>
                          {US_STATES.map((state) => (
                            <SelectItem key={state} value={state}>
                              {state}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="shippingPostalCode">Postal Code *</Label>
                      <Input
                        id="shippingPostalCode"
                        name="shippingPostalCode"
                        value={formData.shippingPostalCode}
                        onChange={handleChange}
                        required
                        placeholder="10001"
                        disabled={useSameAddress}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="shippingCountry">Country *</Label>
                      <Select
                        value={formData.shippingCountry}
                        onValueChange={(value) => handleSelectChange("shippingCountry", value)}
                        disabled={useSameAddress}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select country" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="US">United States</SelectItem>
                          <SelectItem value="CA">Canada</SelectItem>
                          <SelectItem value="MX">Mexico</SelectItem>
                          <SelectItem value="other">Other</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>
              )}
              
              {useSameAddress && (
                <div className="p-4 bg-muted/30 rounded-lg">
                  <p className="text-sm text-muted-foreground">
                    Shipping address will be the same as billing address.
                  </p>
                </div>
              )}
            </div>

            {/* Password Fields */}
            <div className="space-y-6">
              <h3 className="text-lg font-semibold">Account Security</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="password">Password *</Label>
                  <Input
                    id="password"
                    name="password"
                    type="password"
                    value={formData.password}
                    onChange={handleChange}
                    required
                    placeholder="At least 8 characters"
                  />
                  <p className="text-xs text-muted-foreground">
                    Minimum 8 characters
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="confirmPassword">Confirm Password *</Label>
                  <Input
                    id="confirmPassword"
                    name="confirmPassword"
                    type="password"
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    required
                    placeholder="Confirm your password"
                  />
                </div>
              </div>
            </div>

            {/* License Upload */}
            <div className="space-y-6">
              <h3 className="text-lg font-semibold">Business Verification</h3>
              
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="license">Resale/Tax License *</Label>
                  <div className="border-2 border-dashed border-border rounded-lg p-6">
                    <input
                      type="file"
                      id="license"
                      ref={fileInputRef}
                      onChange={handleFileChange}
                      accept=".jpg,.jpeg,.png,.pdf"
                      className="hidden"
                    />
                    
                    {licenseFile ? (
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          {licensePreview ? (
                            <div className="relative w-16 h-16">
                              <img
                                src={licensePreview}
                                alt="License preview"
                                className="w-full h-full object-cover rounded"
                              />
                            </div>
                          ) : (
                            <div className="w-16 h-16 bg-muted rounded flex items-center justify-center">
                              <span className="text-sm">PDF</span>
                            </div>
                          )}
                          <div>
                            <p className="font-medium">{licenseFile.name}</p>
                            <p className="text-sm text-muted-foreground">
                              {(licenseFile.size / 1024 / 1024).toFixed(2)} MB
                            </p>
                          </div>
                        </div>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={removeFile}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    ) : (
                      <div className="text-center">
                        <Upload className="h-12 w-12 mx-auto text-muted-foreground mb-2" />
                        <p className="text-sm text-muted-foreground mb-2">
                          Upload your resale or tax license
                        </p>
                        <p className="text-xs text-muted-foreground mb-4">
                          JPG, PNG, or PDF (Max 5MB)
                        </p>
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => fileInputRef.current?.click()}
                        >
                          Choose File
                        </Button>
                      </div>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Required for wholesale buyer verification. Your account will be reviewed within 24-48 hours.
                  </p>
                </div>
              </div>
            </div>

            {error && (
              <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-500 text-sm">
                {error}
              </div>
            )}

            <Button
              type="submit"
              disabled={loading}
              className="w-full bg-accent text-accent-foreground hover:opacity-90"
            >
              {loading ? (
                <>
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent mr-2" />
                  Creating account...
                </>
              ) : (
                "Create Business Account"
              )}
            </Button>

            <p className="text-center text-muted-foreground mt-6">
              Already have an account?{" "}
              <Link href="/login" className="text-accent hover:underline font-medium">
                Sign in here
              </Link>
            </p>
          </form>
        </CardContent>
      </Card>
    </main>
  )
}