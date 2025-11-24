import {prisma} from "@/lib/db"
import { type NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { z } from "zod"
import { generateProductSlug } from "@/lib/utils"


const createProductSchema = z.object({
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

// GET all products
export async function GET(request: NextRequest) {
  try {
    const session = await auth.api.getSession({ headers: request.headers })
    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const includeVariants = searchParams.get('includeVariants') === 'true'

    const products = await prisma.product.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        variants: includeVariants
      }
    })

    return NextResponse.json({ products })
  } catch (error) {
    console.error("Error fetching products:", error)
    return NextResponse.json({ error: "Failed to fetch products" }, { status: 500 })
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

// POST create product
// export async function POST(request: NextRequest) {
//   try {
//     const session = await auth.api.getSession({ headers: request.headers })
//     if (!session || session.user.role !== "ADMIN") {
//       return NextResponse.json({ error: "Unauthorized" }, { status: 403 })
//     }

//     const body = await request.json()
//     const data = createProductSchema.parse(body)

//     // generate product slug
//     const slug = generateProductSlug(data.name)

//     const product = await prisma.product.create({
//       data: {
//         ...data,
//         videoUrl: data.videoUrl || "",
//         slug
//       }
//     })

//     // Log audit
//     await prisma.auditLog.create({
//       data: {
//         actorId: session.user.id,
//         actorRole: session.user.role,
//         action: "CREATE_PRODUCT",
//         entity: "Product",
//         entityId: product.id,
//         meta: data,
//       },
//     })

//     return NextResponse.json(product, { status: 201 })
//   } catch (error) {
//     if (error instanceof z.ZodError) {
//       return NextResponse.json({ error: error.errors }, { status: 400 })
//     }
//     console.error("Error creating product:", error)
//     return NextResponse.json({ error: "Failed to create product" }, { status: 500 })
//   }
// }


export async function POST(request: NextRequest) {
  try {
    const session = await auth.api.getSession({ headers: request.headers })
    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 })
    }

    const body = await request.json()
    const data = createProductSchema.parse(body)

    // Generate product slug
    const slug = generateProductSlug(data.name)

    // Create product with variants
    const product = await prisma.product.create({
      data: {
        name: data.name,
        description: data.description,
        videoUrl: data.videoUrl || "",
        category: data.category,
        weight: data.weight,
        potency: data.potency,
        minimumQty: data.minimumQty,
        status: data.status,
        slug,
        variants: {
          create: data.variants.map(variant => ({
            subcategory: variant.subcategory,
            priceGold: variant.priceGold,
            pricePlatinum: variant.pricePlatinum,
            priceDiamond: variant.priceDiamond,
          }))
        }
      },
      include: {
        variants: true
      }
    })

    // Log audit
    await prisma.auditLog.create({
      data: {
        actorId: session.user.id,
        actorRole: session.user.role,
        action: "CREATE_PRODUCT",
        entity: "Product",
        entityId: product.id,
        meta: data,
      },
    })

    return NextResponse.json(product, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors }, { status: 400 })
    }
    console.error("Error creating product:", error)
    return NextResponse.json({ error: "Failed to create product" }, { status: 500 })
  }
}