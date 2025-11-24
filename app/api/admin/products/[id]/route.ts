import { PrismaClient, ProductCategory, ProductSubcategory } from "@prisma/client"
import { type NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { z } from "zod"

const prisma = new PrismaClient()

const updateProductSchema = z.object({
  id: z.string(),
  name: z.string().min(1, "Product name is required"),
  description: z.string().optional(),
  videoUrl: z.string().optional(),
  category: z.enum(["SUPER_EXOTICS", "PREMIUM_EXOTICS", "EXOTICS", "LIVING_SOIL", "COMMERCIAL_INDOORS", "FRESH_DEPS", "DEPS"]),
  weight: z.string().optional(),
  potency: z.string().optional(),
  minimumQty: z.number().int().min(1).default(10),
  status: z.enum(["ACTIVE", "INACTIVE", "ARCHIVED"]).default("ACTIVE"),
  variants: z.array(
    z.object({
      subcategory: z.enum(["GLADES", "CYPRESS", "SEAGLASS", "SANDBAR"]),
      priceGold: z.number().nullable().optional(),
      pricePlatinum: z.number().nullable().optional(),
      priceDiamond: z.number().nullable().optional(),
    })
  ).min(1, "At least one variant is required")
})

// export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
//   try {
//     const session = await auth.api.getSession({ headers: request.headers })

//     if (!session || session.user.role !== "ADMIN") {
//       return NextResponse.json({ error: "Unauthorized" }, { status: 403 })
//     }

//     const body = await request.json()
//     const updates = updateProductSchema.parse(body)

//     const product = await prisma.product.update({
//       where: { id: (await params).id },
//       data: updates,
//     })

//     // Log audit
//     await prisma.auditLog.create({
//       data: {
//         actorId: session.user.id,
//         actorRole: session.user.role,
//         action: "UPDATE_PRODUCT",
//         entity: "Product",
//         entityId: (await params).id,
//         meta: updates,
//       },
//     })

//     return NextResponse.json(product)
//   } catch (error) {
//     if (error instanceof z.ZodError) {
//       return NextResponse.json({ error: error.errors }, { status: 400 })
//     }
//     return NextResponse.json({ error: "Failed to update product" }, { status: 500 })
//   }
// }

export async function PUT(request: NextRequest) {
  try {
    const session = await auth.api.getSession({ headers: request.headers })
    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 })
    }

    const body = await request.json()
    console.log(body);
    
    const data = updateProductSchema.parse(body)
    const { id, variants = [], ...productData } = data

    console.log({body});
    

    // Update product and variants in a transaction
    const result = await prisma.$transaction(async (tx) => {
      // Update product
      const product = await tx.product.update({
        where: { id },
        data: {
          ...productData,
          videoUrl: productData.videoUrl || "",
        },
        include: { variants: true }
      })

      // Delete existing variants
      await tx.productVariant.deleteMany({
        where: { productId: id }
      })

      // Create new variants
      const updatedVariants = await Promise.all(
        variants.map(variant =>
          tx.productVariant.create({
            data: {
              ...variant,
              productId: id,
            }
          })
        )
      )

      return { ...product, variants: updatedVariants }
    })

    // Log audit
    await prisma.auditLog.create({
      data: {
        actorId: session.user.id,
        actorRole: session.user.role,
        action: "UPDATE_PRODUCT",
        entity: "Product",
        entityId: result.id,
        meta: data,
      },
    })

    return NextResponse.json(result)
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors }, { status: 400 })
    }
    console.error("Error updating product:", error)
    return NextResponse.json({ error: "Failed to update product" }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth.api.getSession({ headers: request.headers })

    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 })
    }

    const productId = (await params).id

    // Use transaction to delete product and its variants
    await prisma.$transaction(async (tx) => {
      // First delete variants (due to foreign key constraint)
      await tx.productVariant.deleteMany({
        where: { productId }
      })

      // Then delete the product
      await tx.product.delete({
        where: { id: productId }
      })
    })

    // Log audit
    await prisma.auditLog.create({
      data: {
        actorId: session.user.id,
        actorRole: session.user.role,
        action: "DELETE_PRODUCT",
        entity: "Product",
        entityId: productId,
        meta: {},
      },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error deleting product:", error)
    return NextResponse.json({ error: "Failed to delete product" }, { status: 500 })
  }
}
