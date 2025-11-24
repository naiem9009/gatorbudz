import { type NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import {prisma} from "@/lib/db"
import { z } from "zod"
import { generateOrderNumber } from "@/lib/utils"

const orderItemSchema = z.object({
  productId: z.string(),
  variantId: z.string(), 
  quantity: z.coerce.number().int().positive(),
  unitPrice: z.coerce.number().positive(),
  strain: z.string(), 
  notes: z.string().optional(),
})

const cartItemSchema = z.object({
  id: z.string(),
  productId: z.string(),
  variantId: z.string(),
  quantity: z.coerce.number().int().positive(),
  price: z.coerce.number().positive(),
  strain: z.string(),
  notes: z.string().optional(),
})

// GET all orders
export async function GET(request: NextRequest) {
  try {
    const session = await auth.api.getSession({ headers: request.headers })
    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 })
    }

    const orders = await prisma.orderRequest.findMany({
      include: {
        user: { 
          select: { 
            id: true, 
            email: true, 
            name: true, 
            company: true,
            tier: true 
          } 
        },
        items: {
          include: { 
            product: {
              select: {
                id: true,
                name: true,
                category: true,
                weight: true,
                potency: true,
                slug: true
              }
            }
          },
        },
      },
      orderBy: { createdAt: "desc" },
    })

    const normalized = orders.map((order) => ({
      ...order,
      totalAmount: order.totalPrice,
    }))

    return NextResponse.json({ orders: normalized })
  } catch (error) {
    console.error("Error fetching orders:", error)
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

    // check company name exist or not
    const userRecord = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { company: true },
    })

    // create company name if not exist
    if (!userRecord?.company || userRecord.company.trim() === "") {
      await prisma.user.update({
        where: { id: session.user.id },
        data: { company: rawBody.company },
      })
    }
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
        productId: item.productId,
        variantId: item.variantId,
        quantity: item.quantity,
        unitPrice: item.price,
        strain: item.strain,
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
    const uniqueVariantIds = Array.from(new Set(orderItems.map((item) => item.variantId)))

    // Verify products exist
    const products = await prisma.product.findMany({
      where: { id: { in: uniqueProductIds } },
      select: { id: true, name: true },
    })

    if (products.length !== uniqueProductIds.length) {
      const existingIds = new Set(products.map((product) => product.id))
      const missing = uniqueProductIds.filter((id) => !existingIds.has(id))
      return NextResponse.json({ error: `Product(s) not found: ${missing.join(", ")}` }, { status: 404 })
    }

    // Verify variants exist and belong to the products
    const variants = await prisma.productVariant.findMany({
      where: { 
        id: { in: uniqueVariantIds },
        productId: { in: uniqueProductIds }
      },
      select: { id: true, subcategory: true, productId: true },
    })

    if (variants.length !== uniqueVariantIds.length) {
      const existingVariantIds = new Set(variants.map((variant) => variant.id))
      const missing = uniqueVariantIds.filter((id) => !existingVariantIds.has(id))
      return NextResponse.json({ error: `Variant(s) not found: ${missing.join(", ")}` }, { status: 404 })
    }

    // Verify that the strains match the variants
    for (const item of orderItems) {
      const variant = variants.find(v => v.id === item.variantId)
      if (variant && variant.subcategory !== item.strain) {
        return NextResponse.json({ 
          error: `Strain mismatch for variant ${item.variantId}: expected "${variant.subcategory}" but got "${item.strain}"` 
        }, { status: 400 })
      }
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
            variantId: item.variantId,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            totalPrice: item.unitPrice * item.quantity,
            strain: item.strain, 
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
          variantIds: orderItems.map((item) => item.variantId),
          strains: orderItems.map((item) => item.strain),
        },
      },
    })

    return NextResponse.json({ success: true, data: { ...order, totalAmount: order.totalPrice } }, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors }, { status: 400 })
    }
    console.error("Error creating order:", error)
    return NextResponse.json({ error: "Failed to create order" }, { status: 500 })
  }
}