"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Plus, Trash2, Edit2 } from "lucide-react"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"

export default function CategoriesPage() {
  const [categories, setCategories] = useState<string[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingCategory, setEditingCategory] = useState<string | null>(null)
  const [categoryName, setCategoryName] = useState("")
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null)
  const [productCount, setProductCount] = useState<Record<string, number>>({})

  useEffect(() => {
    fetchCategories()
  }, [])

  const fetchCategories = async () => {
    try {
      setLoading(true)
      const response = await fetch("/api/admin/categories")
      if (!response.ok) throw new Error("Failed to fetch categories")
      const data = await response.json()
      setCategories(data.categories)

      // Fetch product count for each category
      const productsResponse = await fetch("/api/admin/products")
      if (productsResponse.ok) {
        const productsData = await productsResponse.json()
        const counts: Record<string, number> = {}
        productsData.products.forEach((product: any) => {
          counts[product.category] = (counts[product.category] || 0) + 1
        })
        setProductCount(counts)
      }
    } catch (error) {
      console.error("Error fetching categories:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleAddCategory = async () => {
    if (!categoryName.trim()) return

    try {
      // Create a dummy product with new category to add it
      const response = await fetch("/api/admin/products", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: `${categoryName} - Sample`,
          category: categoryName,
          priceGold: 0,
          pricePlatinum: 0,
          priceDiamond: 0,
          status: "INACTIVE",
        }),
      })

      if (!response.ok) throw new Error("Failed to add category")

      await fetchCategories()
      setShowForm(false)
      setCategoryName("")
    } catch (error) {
      console.error("Error adding category:", error)
    }
  }

  const handleDeleteCategory = async (category: string) => {
    try {
      // Note: In a production app, you'd want a dedicated endpoint to handle this
      // For now, this serves as a placeholder showing category management logic
      console.log("Delete category:", category)
      setDeleteConfirm(null)
    } catch (error) {
      console.error("Error deleting category:", error)
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Categories</h1>
          <p className="text-muted-foreground mt-2">Manage product categories</p>
        </div>
        {!showForm && (
          <Button onClick={() => setShowForm(true)} className="bg-accent text-accent-foreground hover:opacity-90 gap-2">
            <Plus className="w-4 h-4" />
            Add Category
          </Button>
        )}
      </div>

      {/* Add Category Form */}
      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add New Category</DialogTitle>
            <DialogDescription>Create a new product category</DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="categoryName">Category Name *</Label>
              <Input
                id="categoryName"
                placeholder="e.g., Flower, Concentrate, Edibles"
                value={categoryName}
                onChange={(e) => setCategoryName(e.target.value)}
              />
            </div>

            <div className="flex gap-3 justify-end">
              <Button variant="outline" onClick={() => setShowForm(false)}>
                Cancel
              </Button>
              <Button
                onClick={handleAddCategory}
                disabled={!categoryName.trim()}
                className="bg-accent hover:opacity-90"
              >
                Add Category
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Categories Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {loading ? (
          <div className="col-span-full text-center text-muted-foreground py-12">Loading categories...</div>
        ) : categories.length === 0 ? (
          <div className="col-span-full text-center text-muted-foreground py-12">
            No categories yet. Create one to get started.
          </div>
        ) : (
          categories.map((category) => (
            <Card key={category} className="bg-card border-border hover:shadow-lg transition">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <CardTitle className="text-lg">{category}</CardTitle>
                    <CardDescription className="mt-2">{productCount[category] || 0} products</CardDescription>
                  </div>
                  <Badge variant="outline" className="bg-accent/10 text-accent border-accent/30">
                    {productCount[category] || 0}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1 text-accent hover:bg-accent/10 bg-transparent"
                    onClick={() => {
                      setCategoryName(category)
                      setEditingCategory(category)
                    }}
                  >
                    <Edit2 className="w-4 h-4 mr-2" />
                    Edit
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1 text-destructive hover:bg-destructive/10 bg-transparent"
                    onClick={() => setDeleteConfirm(category)}
                  >
                    <Trash2 className="w-4 h-4 mr-2" />
                    Delete
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteConfirm} onOpenChange={(open) => !open && setDeleteConfirm(null)}>
        <AlertDialogContent>
          <AlertDialogTitle>Delete Category</AlertDialogTitle>
          <AlertDialogDescription>
            Are you sure you want to delete this category? This will not delete products in this category.
          </AlertDialogDescription>
          <div className="flex gap-3 justify-end">
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteConfirm && handleDeleteCategory(deleteConfirm)}
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
