import { PrismaClient, ProductCategory, ProductSubcategory } from "@prisma/client"
import { type NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { z } from "zod"

const prisma = new PrismaClient()

const updateProductSchema = z.object({
  name: z.string().optional(),
  description: z.string().optional(),
  videoUrl: z.string().optional(),
  category: z.string().optional() as z.ZodType<ProductCategory>,
  subcategory: z.string().optional() as z.ZodType<ProductSubcategory>,
  weight: z.string().optional(),
  potency: z.string().optional(),
  priceGold: z.number().optional(),
  pricePlatinum: z.number().optional(),
  priceDiamond: z.number().optional(),
  suggestedRetail: z.string().optional(),
  status: z.enum(["ACTIVE", "INACTIVE", "ARCHIVED"]).optional(),
  minimumQty: z.number().min(1).optional(),
})

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth.api.getSession({ headers: request.headers })

    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 })
    }

    const body = await request.json()
    const updates = updateProductSchema.parse(body)

    const product = await prisma.product.update({
      where: { id: (await params).id },
      data: updates,
    })

    // Log audit
    await prisma.auditLog.create({
      data: {
        actorId: session.user.id,
        actorRole: session.user.role,
        action: "UPDATE_PRODUCT",
        entity: "Product",
        entityId: (await params).id,
        meta: updates,
      },
    })

    return NextResponse.json(product)
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors }, { status: 400 })
    }
    return NextResponse.json({ error: "Failed to update product" }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth.api.getSession({ headers: request.headers })

    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 })
    }

    await prisma.product.delete({
      where: { id: (await params).id },
    })

    // Log audit
    await prisma.auditLog.create({
      data: {
        actorId: session.user.id,
        actorRole: session.user.role,
        action: "DELETE_PRODUCT",
        entity: "Product",
        entityId: (await params).id,
        meta: {},
      },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json({ error: "Failed to delete product" }, { status: 500 })
  }
}
