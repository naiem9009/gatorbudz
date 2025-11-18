import {prisma} from "@/lib/db"
import { type NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { z } from "zod"
import { generateProductSlug } from "@/lib/utils"
import { ProductCategory, ProductSubcategory } from "@prisma/client"


const createProductSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  videoUrl: z.string().optional(),
  category: z.string().min(1) as z.ZodType<ProductCategory>,
  subcategory: z.string().optional() as z.ZodType<ProductSubcategory>,
  weight: z.string().optional(),
  potency: z.string().optional(),
  priceGold: z.number().min(0),
  pricePlatinum: z.number().min(0),
  priceDiamond: z.number().min(0),
  suggestedRetail: z.string().optional(),
  status: z.enum(["ACTIVE", "INACTIVE", "ARCHIVED"]).default("ACTIVE"),
})

// GET all products
export async function GET(request: NextRequest) {
  try {
    const session = await auth.api.getSession({ headers: request.headers })
    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 })
    }

    const products = await prisma.product.findMany({
      orderBy: { createdAt: "desc" },
    })

    return NextResponse.json({ products })
  } catch (error) {
    console.error("Error fetching products:", error)
    return NextResponse.json({ error: "Failed to fetch products" }, { status: 500 })
  }
}

// POST create product
export async function POST(request: NextRequest) {
  try {
    const session = await auth.api.getSession({ headers: request.headers })
    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 })
    }

    const body = await request.json()
    const data = createProductSchema.parse(body)

    // generate product slug
    const slug = generateProductSlug(data.name)

    const product = await prisma.product.create({
      data: {
        ...data,
        videoUrl: data.videoUrl || "",
        slug
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
