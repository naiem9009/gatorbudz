import { type NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/db"
import { z } from "zod"
import { generateOrderNumber } from "@/lib/utils"

const orderItemSchema = z.object({
  productId: z.string(),
  quantity: z.coerce.number().int().positive(),
  unitPrice: z.coerce.number().positive(),
  notes: z.string().optional(),
})

const cartItemSchema = z.object({
  id: z.string(),
  quantity: z.coerce.number().int().positive(),
  price: z.coerce.number().positive(),
  notes: z.string().optional(),
})

export async function GET(request: NextRequest) {
  try {
    const session = await auth.api.getSession({ headers: request.headers })

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const status = searchParams.get("status")
    const userId = searchParams.get("userId")

    const where: any = {}

    // Users can only see their own orders
    if (session.user.role === "VERIFIED") {
      where.userId = session.user.id
    } else if (userId && ["MANAGER", "ADMIN"].includes(session.user.role)) {
      where.userId = userId
    }

    if (status) {
      where.status = status
    }

    const orders = await prisma.orderRequest.findMany({
      where,
      include: {
        user: { select: { id: true, email: true, name: true, company: true, tier: true } },
        items: {
          include: {
            product: { select: { id: true, name: true, category: true } },
          },
        },
      },
      orderBy: { createdAt: "desc" },
    })

    const normalized = orders.map((order) => ({
      ...order,
      totalAmount: order.totalPrice,
    }))

    return NextResponse.json(normalized)
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch orders" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth.api.getSession({ headers: request.headers })

    if (!session || !["VERIFIED", "MANAGER", "ADMIN"].includes(session.user.role)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const rawBody = await request.json()
    const sharedNotes =
      typeof rawBody?.notes === "string" && rawBody.notes.trim().length > 0 ? rawBody.notes.trim() : undefined

    let orderPayload: unknown[] = []

    if (Array.isArray(rawBody)) {
      orderPayload = rawBody
    } else if (Array.isArray(rawBody?.items)) {
      orderPayload = rawBody.items
    } else if (Array.isArray(rawBody?.orders)) {
      orderPayload = rawBody.orders
    } else if (Array.isArray(rawBody?.cartItems)) {
      const parsedCartItems = z.array(cartItemSchema).parse(rawBody.cartItems)
      orderPayload = parsedCartItems.map((item) => ({
        productId: item.id,
        quantity: item.quantity,
        unitPrice: item.price,
        notes: item.notes ?? sharedNotes,
      }))
    } else if (rawBody && typeof rawBody === "object" && "productId" in rawBody) {
      orderPayload = [rawBody]
    }

    if (orderPayload.length === 0) {
      return NextResponse.json({ error: "Invalid payload: no order items provided" }, { status: 400 })
    }

    const parseResult = z
      .array(orderItemSchema)
      .min(1, { message: "At least one order item is required" })
      .safeParse(
        orderPayload.map((item: any) => ({
          ...item,
          notes: item?.notes ?? sharedNotes,
        })),
      )

    if (!parseResult.success) {
      return NextResponse.json({ error: parseResult.error.issues }, { status: 400 })
    }

    const orderItems = parseResult.data
    const uniqueProductIds = Array.from(new Set(orderItems.map((item) => item.productId)))

    const products = await prisma.product.findMany({
      where: { id: { in: uniqueProductIds } },
      select: { id: true },
    })

    if (products.length !== uniqueProductIds.length) {
      const existingIds = new Set(products.map((product) => product.id))
      const missing = uniqueProductIds.filter((id) => !existingIds.has(id))
      return NextResponse.json({ error: `Product(s) not found: ${missing.join(", ")}` }, { status: 404 })
    }

    const totalOrderPrice = orderItems.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0)
    const orderId = generateOrderNumber()

    const order = await prisma.orderRequest.create({
      data: {
        userId: session.user.id,
        orderId: orderId,
        totalPrice: totalOrderPrice,
        notes: sharedNotes,
        status: "PENDING",
        lastActorId: session.user.id,
        lastActorRole: session.user.role,
        items: {
          create: orderItems.map((item) => ({
            productId: item.productId,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            totalPrice: item.unitPrice * item.quantity,
            notes: item.notes,
          })),
        },
      },
      include: {
        user: { select: { id: true, email: true, name: true, company: true, tier: true } },
        items: {
          include: {
            product: { select: { id: true, name: true, category: true } },
          },
        },
      },
    })

    await prisma.auditLog.create({
      data: {
        actorId: session.user.id,
        actorRole: session.user.role,
        action: "CREATE_ORDER",
        entity: "OrderRequest",
        entityId: order.id,
        meta: {
          totalPrice: totalOrderPrice,
          itemCount: orderItems.length,
          productIds: orderItems.map((item) => item.productId),
        },
      },
    })

    return NextResponse.json({ success: true, data: { ...order, totalAmount: order.totalPrice } }, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors }, { status: 400 })
    }
    return NextResponse.json({ error: "Failed to create order" }, { status: 500 })
  }
}
