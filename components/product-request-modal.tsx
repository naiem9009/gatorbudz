"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { useRouter } from "next/navigation"

interface ProductVariant {
  id: string
  subcategory: string
  priceGold?: number
  pricePlatinum?: number
  priceDiamond?: number
}

interface Product {
  id: string
  name: string
  variants: ProductVariant[]
}

interface ProductRequestModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  product: Product
  selectedVariant: ProductVariant
  userTier: string
  minimumQty?: number
  onSuccess: () => void
}

export default function ProductRequestModal({
  open,
  onOpenChange,
  product,
  selectedVariant,
  userTier,
  onSuccess,
  minimumQty,
}: ProductRequestModalProps) {
  const [quantity, setQuantity] = useState(minimumQty || 1)
  const [notes, setNotes] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const router = useRouter()

  const tierPrices: Record<string, number | undefined> = {
    GOLD: selectedVariant.priceGold,
    PLATINUM: selectedVariant.pricePlatinum,
    DIAMOND: selectedVariant.priceDiamond,
  }

  const unitPrice = tierPrices[userTier] || selectedVariant.priceGold || 0
  const totalPrice = unitPrice * quantity

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError("")

    // Validate that we have a price for the selected variant
    if (!unitPrice || unitPrice === 0) {
      setError("No price available for the selected strain. Please contact support.")
      setLoading(false)
      return
    }

    try {
      const res = await fetch("/api/order-requests/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          productId: product.id,
          variantId: selectedVariant.id,
          quantity,
          unitPrice,
          totalPrice,
          notes,
          strain: selectedVariant.subcategory,
        }),
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || "Failed to create order request")
      }

      onSuccess()
      onOpenChange(false)
      setQuantity(minimumQty || 1)
      setNotes("")
      router.push("/dashboard")

    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred")
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Request Quote</DialogTitle>
          <DialogDescription>
            Submit your request for {product.name}
            {product.variants.length > 1 && ` - ${selectedVariant.subcategory}`}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Product Info */}
          <div className="bg-muted p-4 rounded-lg">
            <div className="flex justify-between items-start mb-3">
              <div>
                <h3 className="font-semibold text-foreground">{product.name}</h3>
                <div className="flex flex-wrap gap-2 mt-2">
                  <Badge className="bg-blue-500/10 text-blue-700">{userTier} Tier</Badge>
                  {product.variants.length > 1 && (
                    <Badge variant="outline" className="bg-green-500/10 text-green-700">
                      {selectedVariant.subcategory}
                    </Badge>
                  )}
                </div>
              </div>
            </div>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Unit Price:</span>
                <span className="font-semibold text-foreground">
                  ${unitPrice.toFixed(2)}
                </span>
              </div>
              {minimumQty && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Minimum Quantity:</span>
                  <span className="font-semibold text-foreground">{minimumQty}</span>
                </div>
              )}
            </div>
          </div>

          {/* Quantity */}
          <div>
            <label className="text-sm font-medium text-foreground mb-2 block">Quantity</label>
            <div className="flex items-center gap-2">
              <Button 
                type="button" 
                variant="outline" 
                size="sm" 
                onClick={() => setQuantity(Math.max(minimumQty || 1, quantity - 1))}
                disabled={quantity <= (minimumQty || 1)}
              >
                −
              </Button>
              <Input
                type="number"
                min={minimumQty || 1}
                value={quantity}
                onChange={(e) => {
                  const value = Math.max(minimumQty || 1, Number.parseInt(e.target.value) || (minimumQty || 1))
                  setQuantity(value)
                }}
                className="w-20 text-center"
              />
              <Button 
                type="button" 
                variant="outline" 
                size="sm" 
                onClick={() => setQuantity(quantity + 1)}
              >
                +
              </Button>
              <div className="flex-1 text-right">
                <p className="text-sm text-muted-foreground">Total:</p>
                <p className="text-lg font-bold text-accent">${totalPrice.toFixed(2)}</p>
              </div>
            </div>
            {minimumQty && quantity < minimumQty && (
              <p className="text-sm text-yellow-600 mt-2">
                Minimum order quantity is {minimumQty} units
              </p>
            )}
          </div>

          {/* Notes */}
          <div>
            <label className="text-sm font-medium text-foreground mb-2 block">
              Additional Notes (Optional)
            </label>
            <Textarea
              placeholder="Add any special requests or questions..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={4}
            />
          </div>

          {/* Error */}
          {error && (
            <div className="bg-red-500/10 text-red-700 p-3 rounded text-sm">
              {error}
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              className="flex-1 bg-transparent"
              onClick={() => onOpenChange(false)}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              className="flex-1 bg-accent text-accent-foreground hover:bg-accent/90 cursor-pointer"
              disabled={loading || !unitPrice || unitPrice === 0 || quantity < (minimumQty || 1)}
            >
              {loading ? "Submitting..." : "Submit Request"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}