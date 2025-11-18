import { type NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/db"
import { z } from "zod"
import { generateOrderNumber } from "@/lib/utils"

export const runtime = "nodejs"

const itemSchema = z.object({
  productId: z.string(),
  quantity: z.coerce.number().int().positive(),
  unitPrice: z.coerce.number().positive(),
  notes: z.string().optional(),
})

export async function POST(request: NextRequest) {
  try {
    const session = await auth.api.getSession({ headers: request.headers })

    if (!session || !["VERIFIED", "MANAGER", "ADMIN"].includes(session.user.role)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const sharedNotes =
      typeof body?.notes === "string" && body.notes.trim().length > 0 ? body.notes.trim() : undefined

    let rawItems: unknown[] = []

    if (Array.isArray(body?.items)) {
      rawItems = body.items
    } else if (Array.isArray(body?.orders)) {
      rawItems = body.orders
    } else if (Array.isArray(body?.cartItems)) {
      rawItems = body.cartItems.map((item: any) => ({
        productId: item.id,
        quantity: item.quantity,
        unitPrice: item.price,
        notes: item.notes,
      }))
    } else if (body && typeof body === "object" && "productId" in body) {
      rawItems = [body]
    }

    if (rawItems.length === 0) {
      return NextResponse.json({ error: "Missing order items" }, { status: 400 })
    }

    const parseResult = z
      .array(itemSchema)
      .min(1, { message: "At least one item is required" })
      .safeParse(
        rawItems.map((item: any) => ({
          ...item,
          notes: item?.notes ?? sharedNotes,
        })),
      )

    if (!parseResult.success) {
      return NextResponse.json({ error: parseResult.error.issues }, { status: 400 })
    }

    const items = parseResult.data
    const productIds = Array.from(new Set(items.map((item) => item.productId)))

    const products = await prisma.product.findMany({
      where: { id: { in: productIds } },
      select: { id: true },
    })

    if (products.length !== productIds.length) {
      const existingIds = new Set(products.map((product) => product.id))
      const missing = productIds.filter((id) => !existingIds.has(id))
      return NextResponse.json({ error: `Product(s) not found: ${missing.join(", ")}` }, { status: 404 })
    }

    const totalPrice = items.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0)

    const oderNumber = generateOrderNumber()

    const orderRequest = await prisma.orderRequest.create({
      data: {
        orderId: oderNumber,
        userId: session.user.id,
        totalPrice,
        notes: sharedNotes,
        status: "PENDING",
        lastActorId: session.user.id,
        lastActorRole: session.user.role,
        items: {
          create: items.map((item) => ({
            productId: item.productId,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            totalPrice: item.unitPrice * item.quantity,
            notes: item.notes,
          })),
        },
      },
      include: {
        user: { select: { id: true, email: true, name: true, tier: true } },
        items: {
          include: {
            product: true,
          },
        },
      },
    })

    await prisma.auditLog.create({
      data: {
        actorId: session.user.id,
        actorRole: session.user.role,
        action: "ORDER_REQUEST_CREATED",
        entity: "OrderRequest",
        entityId: orderRequest.id,
        meta: {
          totalPrice,
          itemCount: items.length,
          productIds,
        },
      },
    })

    return NextResponse.json(
      { success: true, data: { ...orderRequest, totalAmount: orderRequest.totalPrice } },
      { status: 201 },
    )
  } catch (error) {
    console.error("Error creating order request:", error)
    return NextResponse.json({ error: "Failed to create order request" }, { status: 500 })
  }
}
