"use client"

import type React from "react"
import { useState, useCallback } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { signIn } from "@/lib/auth-client"
import { Eye, EyeOff, Mail, Lock, Chrome, ArrowRight } from "lucide-react"
import Image from "next/image"

export default function LoginPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const callback = searchParams.get("callback") || "/dashboard"

  const [formData, setFormData] = useState({ email: "", password: "" })
  const [loading, setLoading] = useState(false)
  const [oauthLoading, setOauthLoading] = useState<null | "google">(null)
  const [error, setError] = useState("")
  const [showPassword, setShowPassword] = useState(false)

  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
    if (error) setError("")
  }, [error])

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError("")
    
    try {
      const { error } = await signIn.email({
        email: formData.email,
        password: formData.password,
      })

      if (error) {
        setError(error.message || "Invalid email or password. Please try again.")
      } else {
        router.push(callback)
      }
    } catch {
      setError("An unexpected error occurred. Please try again.")
    } finally {
      setLoading(false)
    }
  }, [formData.email, formData.password, router, callback])

  // const handleOAuth = useCallback(
  //   async (provider: "google") => {
  //     setError("")
  //     setOauthLoading(provider)
  //     try {
  //       await signIn.social({
  //         provider,
  //       })
  //     } catch {
  //       setError(`Could not start ${provider} sign-in. Please try again.`)
  //       setOauthLoading(null)
  //     }
  //   },
  //   [callback, setError, setOauthLoading]
  // )

  const togglePasswordVisibility = useCallback(() => {
    setShowPassword(!showPassword)
  }, [showPassword])

  const isFormValid = formData.email && formData.password

  return (
    <main className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20 flex items-center justify-center px-4 py-8">
      <div className="w-full max-w-md space-y-8">
        {/* Brand Header */}
        <div className="text-center space-y-3">
          <Link href="/" className="inline-block">
            <Image src={'/my-logo.png'} width={300} height={300} alt="Gator Budz Logo" className="text-4xl font-bold bg-gradient-to-r from-foreground to-accent bg-clip-text text-transparent" />
          </Link>
        </div>

        <Card className="border-border shadow-xl">
          <CardHeader className="text-center space-y-2 pb-6">
            <CardTitle className="text-2xl font-bold">Welcome Back</CardTitle>
            <CardDescription className="text-base">
              Sign in to access your business account
            </CardDescription>
          </CardHeader>
          
          <CardContent className="space-y-6">
            {/* Social Sign-in Buttons */}
            {/* <div className="space-y-3">
              <Button
                type="button"
                variant="outline"
                onClick={() => handleOAuth("google")}
                disabled={!!oauthLoading || loading}
                className="w-full h-11 border-border hover:bg-muted/50 transition-all duration-200"
              >
                {oauthLoading === "google" ? (
                  <div className="flex items-center gap-3">
                    <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                    <span>Connecting to Google...</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-3">
                    <Chrome className="w-5 h-5" />
                    <span>Continue with Google</span>
                  </div>
                )}
              </Button>

            </div> */}

            {/* Divider */}
            {/* <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-border" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-card px-3 text-muted-foreground font-medium">Or with email</span>
              </div>
            </div> */}

            {/* Email + Password Form */}
            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="space-y-2">
                <label htmlFor="email" className="text-sm font-medium text-foreground">
                  Business Email
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                  <Input
                    id="email"
                    type="email"
                    name="email"
                    autoComplete="email"
                    value={formData.email}
                    onChange={handleChange}
                    required
                    className="pl-10 bg-background border-border focus:ring-2 focus:ring-accent/20 transition-all"
                    placeholder="your@company.com"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label htmlFor="password" className="text-sm font-medium text-foreground">
                    Password
                  </label>
                  <Link 
                    href="/forgot-password" 
                    className="text-xs text-accent hover:underline transition-colors"
                  >
                    Forgot password?
                  </Link>
                </div>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    name="password"
                    autoComplete="current-password"
                    value={formData.password}
                    onChange={handleChange}
                    required
                    className="pl-10 pr-10 bg-background border-border focus:ring-2 focus:ring-accent/20 transition-all"
                    placeholder="Enter your password"
                  />
                  <button
                    type="button"
                    onClick={togglePasswordVisibility}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors p-1"
                    aria-label={showPassword ? "Hide password" : "Show password"}
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Error Alert */}
              {error && (
                <Alert variant="destructive" className="animate-in fade-in duration-200">
                  <AlertDescription className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 bg-destructive rounded-full" />
                    {error}
                  </AlertDescription>
                </Alert>
              )}

              <Button
                type="submit"
                disabled={loading || !!oauthLoading || !isFormValid}
                className="w-full h-11 bg-gradient-to-r from-accent to-accent/90 text-accent-foreground hover:opacity-90 transition-all duration-200 shadow-lg"
              >
                {loading ? (
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                    <span>Signing in...</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <span>Sign In</span>
                    <ArrowRight className="w-4 h-4" />
                  </div>
                )}
              </Button>
            </form>

            {/* Sign Up Link */}
            <div className="text-center pt-4 border-t border-border">
              <p className="text-sm text-muted-foreground">
                Don&apos;t have a business account?{" "}
                <Link 
                  href="/register" 
                  className="text-accent font-semibold hover:underline transition-colors"
                >
                  Create account
                </Link>
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Footer Links */}
        <div className="text-center space-y-2">
          <p className="text-xs text-muted-foreground">
            By continuing, you agree to our{" "}
            <Link href="/terms" className="text-accent hover:underline">
              Terms of Service
            </Link>{" "}
            and{" "}
            <Link href="/privacy" className="text-accent hover:underline">
              Privacy Policy
            </Link>
          </p>
          <p className="text-xs text-muted-foreground">
            Need help?{" "}
            <Link href="/contact" className="text-accent hover:underline">
              Contact Support
            </Link>
          </p>
        </div>
      </div>
    </main>
  )
}
