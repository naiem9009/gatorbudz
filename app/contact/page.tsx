"use client"

import type React from "react"

import { useState } from "react"
import Header from "@/components/header"
import Footer from "@/components/footer"
import { Button } from "@/components/ui/button"
import { Mail, Phone, MapPin, Clock } from "lucide-react"

export default function ContactPage() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    company: "",
    subject: "",
    message: "",
  })
  const [submitted, setSubmitted] = useState(false)
  const [loading, setLoading] = useState(false)

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      // Send email via API
      const response = await fetch("/api/contact", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      })

      if (response.ok) {
        setSubmitted(true)
        setFormData({
          name: "",
          email: "",
          phone: "",
          company: "",
          subject: "",
          message: "",
        })
        setTimeout(() => setSubmitted(false), 5000)
      }
    } catch (error) {
      console.error("Failed to send message:", error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="min-h-screen bg-background">
      <Header />

      {/* Hero Section */}
      <section className="bg-primary text-primary-foreground py-12 md:py-20">
        <div className="max-w-7xl mx-auto px-4 md:px-8">
          <h1 className="text-4xl md:text-5xl font-bold mb-4 text-balance">Get in Touch</h1>
          <p className="text-lg md:text-xl opacity-90 max-w-2xl">
            Have questions about our products or services? We'd love to hear from you. Contact us today.
          </p>
        </div>
      </section>

      <div className="max-w-7xl mx-auto px-4 md:px-8 py-12 md:py-20">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 md:gap-12">
          {/* Contact Information */}
          <div className="lg:col-span-1">
            <h2 className="text-2xl font-bold text-foreground mb-8">Contact Information</h2>

            <div className="space-y-6">
              {/* Email */}
              <div className="flex gap-4">
                <Mail className="text-accent flex-shrink-0 mt-1" size={24} />
                <div>
                  <h3 className="font-semibold text-foreground mb-1">Email</h3>
                  <a href="mailto:info@gatorbudz.com" className="text-accent hover:underline">
                    support@gatorbudz.com
                  </a>
                  <p className="text-sm text-muted-foreground mt-1">We'll respond within 24 hours</p>
                </div>
              </div>

              {/* Phone */}
              <div className="flex gap-4">
                <Phone className="text-accent flex-shrink-0 mt-1" size={24} />
                <div>
                  <h3 className="font-semibold text-foreground mb-1">Phone</h3>
                  <a href="tel:+0000" className="text-accent hover:underline">
                    0000
                  </a>
                  <p className="text-sm text-muted-foreground mt-1">Mon-Fri, 9am-5pm EST</p>
                </div>
              </div>

              {/* Address */}
              <div className="flex gap-4">
                <MapPin className="text-accent flex-shrink-0 mt-1" size={24} />
                <div>
                  <h3 className="font-semibold text-foreground mb-1">Address</h3>
                  <p className="text-muted-foreground">
                    
                    <br />
                    
                  </p>
                </div>
              </div>

              {/* Hours */}
              <div className="flex gap-4">
                <Clock className="text-accent flex-shrink-0 mt-1" size={24} />
                <div>
                  <h3 className="font-semibold text-foreground mb-1">Business Hours</h3>
                  <p className="text-sm text-muted-foreground">
                    
                    <br />
                    
                  </p>
                </div>
              </div>
            </div>

            {/* FAQ Link */}
            <div className="mt-8 p-4 bg-card border border-border rounded-lg">
              <h3 className="font-semibold text-foreground mb-2">Quick Help</h3>
              <p className="text-sm text-muted-foreground mb-3">Check our FAQ for common questions</p>
              <Button variant="outline" className="w-full bg-transparent">
                View FAQ
              </Button>
            </div>
          </div>

          {/* Contact Form */}
          <div className="lg:col-span-2">
            <div className="bg-card border border-border rounded-lg p-6 md:p-8">
              <h2 className="text-2xl font-bold text-foreground mb-6">Send us a Message</h2>

              {submitted && (
                <div className="mb-6 p-4 bg-accent/10 border border-accent rounded-lg">
                  <p className="text-accent font-semibold">Thank you for your message!</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    We've received your inquiry and will get back to you shortly.
                  </p>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Name */}
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">Full Name *</label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    required
                    className="w-full px-4 py-3 bg-background border border-border rounded-lg text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-accent"
                    placeholder="John Doe"
                  />
                </div>

                {/* Email */}
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">Email Address *</label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    required
                    className="w-full px-4 py-3 bg-background border border-border rounded-lg text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-accent"
                    placeholder="john@example.com"
                  />
                </div>

                {/* Phone */}
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">Phone Number</label>
                  <input
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    className="w-full px-4 py-3 bg-background border border-border rounded-lg text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-accent"
                    placeholder="+1 (800) 555-1234"
                  />
                </div>

                {/* Company */}
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">Company Name</label>
                  <input
                    type="text"
                    name="company"
                    value={formData.company}
                    onChange={handleChange}
                    className="w-full px-4 py-3 bg-background border border-border rounded-lg text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-accent"
                    placeholder="Your Company"
                  />
                </div>

                {/* Subject */}
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">Subject *</label>
                  <select
                    name="subject"
                    value={formData.subject}
                    onChange={handleChange}
                    required
                    className="w-full px-4 py-3 bg-background border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-accent"
                  >
                    <option value="">Select a subject</option>
                    <option value="product-inquiry">Product Inquiry</option>
                    <option value="bulk-order">Bulk Order</option>
                    <option value="partnership">Partnership Opportunity</option>
                    <option value="support">Customer Support</option>
                    <option value="other">Other</option>
                  </select>
                </div>

                {/* Message */}
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">Message *</label>
                  <textarea
                    name="message"
                    value={formData.message}
                    onChange={handleChange}
                    required
                    rows={6}
                    className="w-full px-4 py-3 bg-background border border-border rounded-lg text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-accent resize-none"
                    placeholder="Tell us how we can help..."
                  />
                </div>

                {/* Submit Button */}
                <Button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-accent text-accent-foreground hover:opacity-90 py-3 text-base"
                >
                  {loading ? "Sending..." : "Send Message"}
                </Button>

                <p className="text-xs text-muted-foreground text-center">
                  We respect your privacy. Your information will only be used to respond to your inquiry.
                </p>
              </form>
            </div>
          </div>
        </div>
      </div>

      <Footer />
    </main>
  )
}
