"use client"

import type React from "react"
import { useState } from "react"
import { X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useCart } from "@/lib/cart-context"
import { useAuth } from "@/lib/auth-context"

interface ApplyModalProps {
  isOpen: boolean
  onClose: () => void
}

export default function ApplyModal({ isOpen, onClose }: ApplyModalProps) {
  const { items, clearCart } = useCart()
  const { user } = useAuth()
  const [formData, setFormData] = useState({
    name: user?.name || "",
    company: user?.company || "",
    email: user?.email || "",
    phone: "",
    notes: "",
  })
  const [loading, setLoading] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [error, setError] = useState("")

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError("")

    try {
      const response = await fetch("/api/order-requests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          productName: items.map((item) => item.name).join(", "),
          cartItems: items,
          totalAmount: items.reduce((sum, item) => sum + item.price * item.quantity, 0),
        }),
      })

      const data = await response.json()

      if (response.ok) {
        setSubmitted(true)
        setTimeout(() => {
          onClose()
          clearCart()
          setSubmitted(false)
          setFormData({
            name: user?.name || "",
            company: user?.company || "",
            email: user?.email || "",
            phone: "",
            notes: "",
          })
        }, 2000)
      } else {
        setError(data.error || "Failed to submit application")
      }
    } catch (error) {
      console.error("Failed to submit application:", error)
      setError("An error occurred. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-card rounded-lg max-w-2xl w-full border border-border my-8">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-border">
          <h2 className="text-xl font-bold text-foreground">Complete Your Order</h2>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground transition">
            <X size={24} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {submitted ? (
            <div className="text-center py-8">
              <div className="w-12 h-12 bg-accent rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-accent-foreground text-xl">✓</span>
              </div>
              <h3 className="text-lg font-bold text-foreground mb-2">Order Submitted</h3>
              <p className="text-muted-foreground">We'll review your order and contact you soon.</p>
            </div>
          ) : (
            <div className="space-y-6">
              <div className="bg-muted p-4 rounded-lg">
                <h3 className="font-semibold text-foreground mb-3">Order Summary</h3>
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {items.map((item) => (
                    <div key={item.id} className="flex justify-between text-sm">
                      <span className="text-muted-foreground">
                        {item.name} x {item.quantity}
                      </span>
                      <span className="font-medium text-foreground">${item.price * item.quantity}</span>
                    </div>
                  ))}
                </div>
                <div className="border-t border-border mt-3 pt-3 flex justify-between font-bold">
                  <span className="text-foreground">Total:</span>
                  <span className="text-accent">
                    ${items.reduce((sum, item) => sum + item.price * item.quantity, 0)}
                  </span>
                </div>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1">Full Name *</label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    required
                    className="w-full px-3 py-2 bg-muted border border-border rounded-lg text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-accent"
                    placeholder="John Doe"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-foreground mb-1">Company *</label>
                  <input
                    type="text"
                    name="company"
                    value={formData.company}
                    onChange={handleChange}
                    required
                    className="w-full px-3 py-2 bg-muted border border-border rounded-lg text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-accent"
                    placeholder="Your Company"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-foreground mb-1">Email *</label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    required
                    className="w-full px-3 py-2 bg-muted border border-border rounded-lg text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-accent"
                    placeholder="john@company.com"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-foreground mb-1">Phone</label>
                  <input
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    className="w-full px-3 py-2 bg-muted border border-border rounded-lg text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-accent"
                    placeholder="(555) 123-4567"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-foreground mb-1">Additional Notes</label>
                  <textarea
                    name="notes"
                    value={formData.notes}
                    onChange={handleChange}
                    rows={3}
                    className="w-full px-3 py-2 bg-muted border border-border rounded-lg text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-accent resize-none"
                    placeholder="Tell us about your business..."
                  />
                </div>

                {error && (
                  <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-500 text-sm">
                    {error}
                  </div>
                )}

                <div className="flex gap-3 pt-4">
                  <Button type="button" variant="outline" onClick={onClose} className="flex-1 bg-transparent">
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    disabled={loading}
                    className="flex-1 bg-accent text-accent-foreground hover:bg-white"
                  >
                    {loading ? "Submitting..." : "Submit Order"}
                  </Button>
                </div>
              </form>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
