"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { useRouter } from "next/navigation"

interface Product {
  id: string
  name: string
  priceGold: number
  pricePlatinum: number
  priceDiamond: number
}

interface ProductRequestModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  product: Product
  userTier: string
  minimumQty?: number
  onSuccess: () => void
}

export default function ProductRequestModal({
  open,
  onOpenChange,
  product,
  userTier,
  onSuccess,
  minimumQty,
}: ProductRequestModalProps) {
  const [quantity, setQuantity] = useState(minimumQty || 1)
  const [notes, setNotes] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const route = useRouter()

  const tierPrices: Record<string, number> = {
    GOLD: product.priceGold,
    PLATINUM: product.pricePlatinum,
    DIAMOND: product.priceDiamond,
  }

  const unitPrice = tierPrices[userTier] || product.priceGold
  const totalPrice = unitPrice * quantity

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError("")

    try {
      const res = await fetch("/api/order-requests/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          productId: product.id,
          quantity,
          unitPrice,
          totalPrice,
          notes,
        }),
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || "Failed to create order request")
      }

      onSuccess()
      onOpenChange(false)
      setQuantity(1)
      setNotes("")
      route.push("/dashboard")

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
          <DialogDescription>Submit your request for {product.name}</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Product Info */}
          <div className="bg-muted p-4 rounded-lg">
            <div className="flex justify-between items-start mb-3">
              <div>
                <h3 className="font-semibold text-foreground">{product.name}</h3>
                <Badge className="mt-2 bg-blue-500/10 text-blue-700">{userTier}</Badge>
              </div>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Unit Price:</span>
              <span className="font-semibold text-foreground">${unitPrice.toFixed(2)}</span>
            </div>
          </div>

          {/* Quantity */}
          <div>
            <label className="text-sm font-medium text-foreground mb-2 block">Quantity</label>
            <div className="flex items-center gap-2">
              <Button type="button" variant="outline" size="sm" onClick={() => setQuantity(Math.max(1, quantity - 1))}>
                −
              </Button>
              <Input
                type="number"
                min={1}
                value={quantity}
                onChange={(e) => setQuantity(Math.max(1, Number.parseInt(e.target.value) || 1))}
                className="w-20 text-center"
              />
              <Button type="button" variant="outline" size="sm" onClick={() => setQuantity(quantity + 1)}>
                +
              </Button>
              <div className="flex-1 text-right">
                <p className="text-sm text-muted-foreground">Total:</p>
                <p className="text-lg font-bold text-accent">${totalPrice.toFixed(2)}</p>
              </div>
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="text-sm font-medium text-foreground mb-2 block">Additional Notes (Optional)</label>
            <Textarea
              placeholder="Add any special requests or questions..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={4}
            />
          </div>

          {/* Error */}
          {error && <div className="bg-red-500/10 text-red-700 p-3 rounded text-sm">{error}</div>}

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
              className="flex-1 bg-accent text-accent-foreground hover:bg-white cursor-pointer"
              disabled={loading}
            >
              {loading ? "Submitting..." : "Submit Request"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
