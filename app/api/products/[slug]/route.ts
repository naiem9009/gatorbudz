import { PrismaClient } from "@prisma/client"
import { type NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"

const prisma = new PrismaClient()

export async function GET(request: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  try {
    const session = await auth.api.getSession({ headers: request.headers })
    const { slug } = await params

    const product = await prisma.product.findUnique({
      where: { slug },
      select: {
        id: true,
        name: true,
        description: true,
        videoUrl: true,
        category: true,
        slug: true,
        weight: true,
        potency: true,
        minimumQty: true,
        status: true,
        variants: {
          select: {
            id: true,
            subcategory: true,
            ...(session && ["VERIFIED", "MANAGER", "ADMIN"].includes(session.user.role)
              ? {
                  priceGold: true,
                  pricePlatinum: true,
                  priceDiamond: true,
                }
              : {}),
          },
          orderBy: {
            subcategory: 'asc'
          }
        },
      },
    })

    if (!product) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 })
    }

    return NextResponse.json(product)
  } catch (error) {
    console.error("Error fetching product:", error)
    return NextResponse.json({ error: "Failed to fetch product" }, { status: 500 })
  }
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  try {
    const session = await auth.api.getSession({ headers: request.headers })

    if (!session || !["MANAGER", "ADMIN"].includes(session.user.role)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 })
    }

    const body = await request.json()
    const { slug } = await params
    

    if (session.user.role === "MANAGER") {
      delete body.priceGold
      delete body.pricePlatinum
      delete body.priceDiamond
      delete body.stripePriceIdGold
      delete body.stripePriceIdPlatinum
      delete body.stripePriceIdDiamond
    }

    const product = await prisma.product.update({
      where: { slug },
      data: body,
    })

    return NextResponse.json(product)
  } catch (error) {
    return NextResponse.json({ error: "Failed to update product" }, { status: 500 })
  }
}
