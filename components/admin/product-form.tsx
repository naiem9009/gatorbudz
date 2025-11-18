"use client"

import type React from "react"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

interface ProductFormProps {
  product?: any
  onSubmit: (data: any) => Promise<void>
  onCancel: () => void
  isLoading?: boolean
}

export default function ProductForm({ product, onSubmit, onCancel, isLoading }: ProductFormProps) {
  const [formData, setFormData] = useState({
    name: product?.name || "",
    description: product?.description || "",
    videoUrl: product?.videoUrl || "",
    category: product?.category || "",
    subcategory: product?.subcategory || "",
    weight: product?.weight || "",
    potency: product?.potency || "",
    priceGold: product?.priceGold || "",
    pricePlatinum: product?.pricePlatinum || "",
    priceDiamond: product?.priceDiamond || "",
    suggestedRetail: product?.suggestedRetail || "",
    minimumQty: product?.minimumQty || 10,
    status: product?.status || "ACTIVE",
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    await onSubmit(formData)
  }

  const categories = [
    "SUPER_EXOTICS",
    "PREMIUM_EXOTICS",
    "EXOTICS",
    "LIVING_SOIL",
    "COMMERCIAL_INDOORS",
    "FRESH_DEPS",
    "DEPS",
  ]

  const subcategories = ["GLADES", "CYPRESS", "SEAGLASS", "SANDBAR"]

  return (
    <Card className="bg-card border-border/50 shadow-lg">
      <CardHeader className="bg-gradient-to-r from-card to-card/80 border-b border-border/30">
        <CardTitle className="text-accent flex items-center gap-2">
          {product ? "✏️ Edit Product" : "➕ Add New Product"}
        </CardTitle>
        <CardDescription>{product ? "Update product details" : "Create a new premium product"}</CardDescription>
      </CardHeader>
      <CardContent className="pt-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Product Basic Info */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-accent/80 uppercase tracking-wider">Product Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name" className="text-foreground font-medium">
                  Product Name *
                </Label>
                <Input
                  id="name"
                  placeholder="e.g., Super Exotic Glades"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="bg-primary/50 border-border/50 focus:border-accent/50"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="category" className="text-foreground font-medium">
                  Category *
                </Label>
                <Select value={formData.category} onValueChange={(v) => setFormData({ ...formData, category: v })}>
                  <SelectTrigger className="bg-primary/50 border-border/50">
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((cat) => (
                      <SelectItem key={cat} value={cat}>
                        {cat.replace(/_/g, " ")}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="subcategory" className="text-foreground font-medium">
                  Strain *
                </Label>
                <Select value={formData.subcategory} onValueChange={(v) => setFormData({ ...formData, subcategory: v })}>
                  <SelectTrigger className="bg-primary/50 border-border/50">
                    <SelectValue placeholder="Select strain" />
                  </SelectTrigger>
                  <SelectContent>
                    {subcategories.map((sub) => (
                      <SelectItem key={sub} value={sub}>
                        {sub}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="weight" className="text-foreground font-medium">
                  Weight
                </Label>
                <Input
                  id="weight"
                  placeholder="e.g., 3.5G"
                  value={formData.weight}
                  onChange={(e) => setFormData({ ...formData, weight: e.target.value })}
                  className="bg-primary/50 border-border/50 focus:border-accent/50"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="potency" className="text-foreground font-medium">
                  Potency
                </Label>
                <Input
                  id="potency"
                  placeholder="e.g., 60-70%"
                  value={formData.potency}
                  onChange={(e) => setFormData({ ...formData, potency: e.target.value })}
                  className="bg-primary/50 border-border/50 focus:border-accent/50"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="minimumQty" className="text-foreground font-medium">
                  Minimum Order Qty
                </Label>
                <Input
                  id="minimumQty"
                  type="number"
                  placeholder="10"
                  value={formData.minimumQty}
                  onChange={(e) => setFormData({ ...formData, minimumQty: Number.parseInt(e.target.value) })}
                  className="bg-primary/50 border-border/50 focus:border-accent/50"
                />
              </div>
            </div>
          </div>

          {/* Pricing */}
          <div className="space-y-4 p-4 bg-primary/30 rounded-lg border border-accent/20">
            <h3 className="text-sm font-semibold text-accent/80 uppercase tracking-wider">Tier Pricing</h3>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="space-y-2">
                <Label htmlFor="priceGold" className="text-yellow-400 font-semibold">
                  Gold Price *
                </Label>
                <Input
                  id="priceGold"
                  type="number"
                  placeholder="0.00"
                  step="0.01"
                  value={formData.priceGold}
                  onChange={(e) => setFormData({ ...formData, priceGold: Number.parseFloat(e.target.value) })}
                  className="bg-primary/50 border-border/50 focus:border-yellow-400/50"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="pricePlatinum" className="text-purple-400 font-semibold">
                  Platinum Price *
                </Label>
                <Input
                  id="pricePlatinum"
                  type="number"
                  placeholder="0.00"
                  step="0.01"
                  value={formData.pricePlatinum}
                  onChange={(e) => setFormData({ ...formData, pricePlatinum: Number.parseFloat(e.target.value) })}
                  className="bg-primary/50 border-border/50 focus:border-purple-400/50"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="priceDiamond" className="text-blue-400 font-semibold">
                  Diamond Price *
                </Label>
                <Input
                  id="priceDiamond"
                  type="number"
                  placeholder="0.00"
                  step="0.01"
                  value={formData.priceDiamond}
                  onChange={(e) => setFormData({ ...formData, priceDiamond: Number.parseFloat(e.target.value) })}
                  className="bg-primary/50 border-border/50 focus:border-blue-400/50"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="suggestedRetail" className="text-accent font-semibold">
                  Suggested Retail
                </Label>
                <Input
                  id="suggestedRetail"
                  type="text"
                  placeholder="0.00-0.50"
                  value={formData.suggestedRetail}
                  onChange={(e) => setFormData({ ...formData, suggestedRetail: e.target.value })}
                  className="bg-primary/50 border-border/50 focus:border-accent/50"
                />
              </div>
            </div>
          </div>

          {/* Video & Status */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="videoUrl" className="text-foreground font-medium">
                Video URL
              </Label>
              <Input
                id="videoUrl"
                placeholder="https://..."
                value={formData.videoUrl}
                onChange={(e) => setFormData({ ...formData, videoUrl: e.target.value })}
                className="bg-primary/50 border-border/50 focus:border-accent/50"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="status" className="text-foreground font-medium">
                Status *
              </Label>
              <Select value={formData.status} onValueChange={(v) => setFormData({ ...formData, status: v })}>
                <SelectTrigger className="bg-primary/50 border-border/50">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ACTIVE">
                    <span className="text-green-400">● Active</span>
                  </SelectItem>
                  <SelectItem value="INACTIVE">
                    <span className="text-yellow-400">● Inactive</span>
                  </SelectItem>
                  <SelectItem value="ARCHIVED">
                    <span className="text-red-400">● Archived</span>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description" className="text-foreground font-medium">
              Description
            </Label>
            <Textarea
              id="description"
              placeholder="Enter detailed product description..."
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={4}
              className="bg-primary/50 border-border/50 focus:border-accent/50 resize-none"
            />
          </div>

          {/* Actions */}
          <div className="flex gap-3 justify-end pt-4 border-t border-border/30">
            <Button type="button" variant="outline" onClick={onCancel} className="border-border/50">
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isLoading}
              className="bg-accent text-accent-foreground hover:bg-accent/90 shadow-lg shadow-accent/20"
            >
              {isLoading ? "Saving..." : product ? "Update Product" : "Create Product"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}
