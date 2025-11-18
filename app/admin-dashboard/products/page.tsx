"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Edit2, Trash2, Plus, Package, TrendingUp } from 'lucide-react'
import DataTable from "@/components/admin/data-table"
import ProductForm from "@/components/admin/product-form"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export default function ProductsPage() {
  const [products, setProducts] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingProduct, setEditingProduct] = useState<any>(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null)

  useEffect(() => {
    fetchProducts()
  }, [])

  const fetchProducts = async () => {
    try {
      setLoading(true)
      const response = await fetch("/api/admin/products")
      if (!response.ok) throw new Error("Failed to fetch products")
      const data = await response.json()
      setProducts(data.products)
    } catch (error) {
      console.error("Error fetching products:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (formData: any) => {
    try {
      const method = editingProduct ? "PUT" : "POST"
      const url = editingProduct ? `/api/admin/products/${editingProduct.id}` : "/api/admin/products"

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      })

      if (!response.ok) throw new Error("Failed to save product")

      await fetchProducts()
      setShowForm(false)
      setEditingProduct(null)
    } catch (error) {
      console.error("Error saving product:", error)
    }
  }

  const handleDelete = async (id: string) => {
    try {
      const response = await fetch(`/api/admin/products/${id}`, { method: "DELETE" })
      if (!response.ok) throw new Error("Failed to delete product")

      await fetchProducts()
      setDeleteConfirm(null)
    } catch (error) {
      console.error("Error deleting product:", error)
    }
  }

  const filteredProducts = products.filter(
    (p) =>
      p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.category.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  const stats = {
    total: products.length,
    active: products.filter((p) => p.status === "ACTIVE").length,
    inactive: products.filter((p) => p.status === "INACTIVE").length,
  }

  const columns = [
    {
      key: "name",
      label: "Product",
      render: (value: any, row: any) => (
        <div>
          <p className="font-semibold text-foreground">{value}</p>
          <p className="text-xs text-muted-foreground">{row.category}</p>
        </div>
      ),
    },
    {
      key: "subcategory",
      label: "Strain",
      render: (value: any) => <Badge variant="outline">{value || "N/A"}</Badge>,
    },
    {
      key: "priceGold",
      label: "Pricing",
      render: (value: any, row: any) => (
        <div className="text-xs space-y-1">
          <div className="text-yellow-400 font-semibold">Gold: ${value}</div>
          <div className="text-purple-400 font-semibold">Plat: ${row.pricePlatinum}</div>
          <div className="text-blue-400 font-semibold">Dia: ${row.priceDiamond}</div>
        </div>
      ),
    },
    {
      key: "status",
      label: "Status",
      render: (value: any) => (
        <Badge
          variant="outline"
          className={
            value === "ACTIVE"
              ? "bg-accent/20 text-accent border-accent/30"
              : value === "INACTIVE"
                ? "bg-yellow-500/20 text-yellow-400 border-yellow-500/30"
                : "bg-red-500/20 text-red-400 border-red-500/30"
          }
        >
          {value}
        </Badge>
      ),
    },
  ]

  return (
    <div className="space-y-6">
      {/* Header with Stats */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground flex items-center gap-2">
              <Package className="w-8 h-8 text-accent" />
              Products
            </h1>
            <p className="text-muted-foreground mt-2">Manage all products and inventory</p>
          </div>
          {!showForm && (
            <Button
              onClick={() => setShowForm(true)}
              className="bg-accent text-accent-foreground hover:bg-accent/90 gap-2 shadow-lg shadow-accent/20"
            >
              <Plus className="w-4 h-4" />
              Add Product
            </Button>
          )}
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="bg-card border-border/50">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total Products</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-accent">{stats.total}</div>
              <p className="text-xs text-muted-foreground mt-1">All products in catalog</p>
            </CardContent>
          </Card>

          <Card className="bg-card border-border/50">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-1">
                <TrendingUp className="w-4 h-4 text-green-400" />
                Active
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-accent">{stats.active}</div>
              <p className="text-xs text-muted-foreground mt-1">Currently selling</p>
            </CardContent>
          </Card>

          <Card className="bg-card border-border/50">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">Inactive</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-yellow-400">{stats.inactive}</div>
              <p className="text-xs text-muted-foreground mt-1">Not selling</p>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Form */}
      {showForm && (
        <ProductForm
          product={editingProduct}
          onSubmit={handleSubmit}
          onCancel={() => {
            setShowForm(false)
            setEditingProduct(null)
          }}
        />
      )}

      {/* Table */}
      {!showForm && (
        <DataTable
          title="All Products"
          description={`Total: ${filteredProducts.length} products`}
          columns={columns}
          data={filteredProducts}
          searchPlaceholder="Search by name or category..."
          onSearch={setSearchTerm}
          actions={(row) => (
            <div className="flex items-center justify-end gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setEditingProduct(row)
                  setShowForm(true)
                }}
                className="text-accent hover:bg-accent/10"
              >
                <Edit2 className="w-4 h-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setDeleteConfirm(row.id)}
                className="text-destructive hover:bg-destructive/10"
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
          )}
        />
      )}

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteConfirm} onOpenChange={(open) => !open && setDeleteConfirm(null)}>
        <AlertDialogContent>
          <AlertDialogTitle>Delete Product</AlertDialogTitle>
          <AlertDialogDescription>Are you sure you want to delete this product? This action cannot be undone.</AlertDialogDescription>
          <div className="flex gap-3 justify-end">
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteConfirm && handleDelete(deleteConfirm)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </div>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
