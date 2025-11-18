import { Prisma, PrismaClient, ProductCategory, ProductStatus } from "@prisma/client"
import { type NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { generateProductSlug } from "@/lib/utils"

// Use a single Prisma client instance (better for serverless environments)
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

const prisma = globalForPrisma.prisma ?? new PrismaClient()

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma

// Cache for public products (1 minute cache)
const cache = new Map()
const CACHE_TTL = 60 * 1000 // 1 minute

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const category = searchParams.get("category") as ProductCategory | "All" | null
    const session = await auth.api.getSession({ headers: request.headers })

    // Create cache key
    const cacheKey = `products:${category}:${session?.user?.role || 'public'}`

    // Check cache for public requests
    if (!session && cache.has(cacheKey)) {
      const cached = cache.get(cacheKey)
      if (Date.now() - cached.timestamp < CACHE_TTL) {
        return NextResponse.json(cached.data)
      }
    }

    // Build optimized where clause
    const where: Prisma.ProductWhereInput = {
      status: { equals: ProductStatus.ACTIVE }, 
      ...(category && category !== 'All' && {
        category: { equals: category }, 
      }),
    };

    // Select only needed fields
    const baseSelect = {
      id: true,
      name: true,
      description: true,
      videoUrl: true,
      category: true,
      slug: true,
      subcategory: true,
    }

    const priceSelect = session && ["VERIFIED", "MANAGER", "ADMIN"].includes(session.user.role) ? {
      priceGold: true,
      pricePlatinum: true,
      priceDiamond: true,
    } : {}

    const products = await prisma.product.findMany({
      where,
      select: {
        ...baseSelect,
        ...priceSelect,
      },
      // Use cursor-based pagination for better performance
      orderBy: { id: "asc" },
    })

    // Cache public responses
    if (!session) {
      cache.set(cacheKey, {
        data: products,
        timestamp: Date.now()
      })
    }
    

    return NextResponse.json(products)
  } catch (error) {
    console.error("Products API Error:", error)
    return NextResponse.json(
      { error: "Failed to fetch products" }, 
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth.api.getSession({ headers: request.headers })

    if (!session?.user?.role || !["MANAGER", "ADMIN"].includes(session.user.role)) {
      return NextResponse.json(
        { error: "Unauthorized" }, 
        { status: 403 }
      )
    }

    const body = await request.json()
    const { 
      name, 
      description, 
      videoUrl, 
      category, 
      priceGold, 
      pricePlatinum, 
      priceDiamond 
    } = body

    // Input validation
    if (!name?.trim() || !category?.trim()) {
      return NextResponse.json(
        { error: "Name and category are required" }, 
        { status: 400 }
      )
    }

    if (typeof priceGold !== 'number' || priceGold < 0 ||
        typeof pricePlatinum !== 'number' || pricePlatinum < 0 ||
        typeof priceDiamond !== 'number' || priceDiamond < 0) {
      return NextResponse.json(
        { error: "Valid prices are required" }, 
        { status: 400 }
      )
    }

    // generate product slug
    const slug = generateProductSlug(name)

    const product = await prisma.product.create({
      data: {
        name: name.trim(),
        description: description?.trim(),
        videoUrl: videoUrl?.trim(),
        category: category.trim(),
        priceGold,
        pricePlatinum,
        priceDiamond,
        slug,
        status: "ACTIVE",
      },
      select: {
        id: true,
        name: true,
        description: true,
        videoUrl: true,
        category: true,
        priceGold: true,
        pricePlatinum: true,
        priceDiamond: true,
        slug: true,
      }
    })

    // Clear cache on new product creation
    cache.clear()

    return NextResponse.json(product, { status: 201 })
  } catch (error) {
    console.error("Create Product Error:", error)
    
    // Handle Prisma errors
    if (error instanceof Error) {
      if (error.message.includes('Unique constraint')) {
        return NextResponse.json(
          { error: "Product with this name already exists" }, 
          { status: 409 }
        )
      }
    }

    return NextResponse.json(
      { error: "Failed to create product" }, 
      { status: 500 }
    )
  }
}
