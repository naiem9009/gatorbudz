import { type NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/db"
import { z } from "zod"
import { InvoiceStatus } from "@prisma/client"
import { generateInvoiceNumber } from "@/lib/utils"
import { sendInvoiceEmail } from "@/lib/email"

const updateOrderSchema = z.object({
  status: z.enum(["PENDING", "APPROVED", "PAID", "REJECTED", "FULFILLED"]).optional(),
  notes: z.string().optional(),
})


export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await auth.api.getSession({ headers: request.headers })

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const order = await prisma.orderRequest.findUnique({
      where: { id: params.id },
      include: {
        user: true,
        items: {
          include: {
            product: true,
          },
        },
      },
    })

    if (!order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 })
    }

    // Users can only see their own orders
    if (session.user.role === "VERIFIED" && order.userId !== session.user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    return NextResponse.json({ ...order, totalAmount: order.totalPrice })
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch order" }, { status: 500 })
  }
}

// export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
//   try {
//     const session = await auth.api.getSession({ headers: request.headers })

//     if (!session || !["MANAGER", "ADMIN"].includes(session.user.role)) {
//       return NextResponse.json({ error: "Unauthorized" }, { status: 403 })
//     }

//     const body = await request.json()
//     const { status, notes } = updateOrderSchema.parse(body)

//     const order = await prisma.orderRequest.findUnique({
//       where: { id: params.id },
//     })

//     if (!order) {
//       return NextResponse.json({ error: "Order not found" }, { status: 404 })
//     }

//     const updatedOrder = await prisma.orderRequest.update({
//       where: { id: params.id },
//       data: {
//         ...(status && { status }),
//         ...(notes && { notes }),
//         lastActorId: session.user.id,
//         lastActorRole: session.user.role,
//         updatedAt: new Date(),
//       },
//       include: {
//         user: true,
//         items: {
//           include: {
//             product: true,
//           },
//         },
//       },
//     })

//     // Log audit
//     await prisma.auditLog.create({
//       data: {
//         actorId: session.user.id,
//         actorRole: session.user.role,
//         action: `UPDATE_ORDER_${status || "NOTES"}`,
//         entity: "OrderRequest",
//         entityId: params.id,
//         meta: { previousStatus: order.status, newStatus: status },
//       },
//     })

//     return NextResponse.json({ ...updatedOrder, totalAmount: updatedOrder.totalPrice })
//   } catch (error) {
//     if (error instanceof z.ZodError) {
//       return NextResponse.json({ error: error.errors }, { status: 400 })
//     }
//     return NextResponse.json({ error: "Failed to update order" }, { status: 500 })
//   }
// }

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await auth.api.getSession({ headers: request.headers })

    if (!session || !["MANAGER", "ADMIN"].includes(session.user.role)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 })
    }

    const body = await request.json()
    const { status, notes } = updateOrderSchema.parse(body)

    // Start a transaction to ensure data consistency
    const result = await prisma.$transaction(async (tx) => {
      const order = await tx.orderRequest.findUnique({
        where: { id: params.id },
        include: {
          user: true,
          items: {
            include: {
              product: true,
            },
          },
          invoice: {
            include: {
              payments: true
            }
          },
        },
      })

      if (!order) {
        throw new Error("Order not found")
      }

      const updateData: any = {
        ...(status && { status }),
        ...(notes && { notes }),
        lastActorId: session.user.id,
        lastActorRole: session.user.role,
        updatedAt: new Date(),
      }

      let invoice = order.invoice

      // If order is being approved and doesn't have an invoice yet, create one
      if (status === "APPROVED" && order.status !== "APPROVED" && !order.invoice) {
        const invoiceNumber = generateInvoiceNumber()
        const dueDate = new Date()
        dueDate.setDate(dueDate.getDate() + 15) // 15 days from now

        invoice = await tx.invoice.create({
          data: {
            userId: order.userId,
            orderRequestId: order.id,
            invoiceNumber,
            total: order.totalPrice,
            dueDate,
            status: InvoiceStatus.PENDING,
          },
          include: {
            payments: true
          }
        })

        // Update order with new status
        await tx.orderRequest.update({
          where: { id: params.id },
          data: { ...updateData, status: "APPROVED" },
        })

        // Log audit
        await tx.auditLog.create({
          data: {
            actorId: session.user.id,
            actorRole: session.user.role,
            action: "ORDER_APPROVED",
            entity: "OrderRequest",
            entityId: params.id,
            meta: { 
              previousStatus: order.status, 
              newStatus: "APPROVED",
              invoiceNumber 
            },
          },
        })

        return { 
          order: { ...order, ...updateData, status: "APPROVED", invoice }, 
          invoice,
          isNewInvoice: true 
        }
      } else {
        // Regular update without invoice creation
        const updatedOrder = await tx.orderRequest.update({
          where: { id: params.id },
          data: updateData,
          include: {
            user: true,
            items: {
              include: {
                product: true,
              },
            },
            invoice: {
              include: {
                payments: true
              }
            },
          },
        })

        // Log audit
        await tx.auditLog.create({
          data: {
            actorId: session.user.id,
            actorRole: session.user.role,
            action: `UPDATE_ORDER_${status || "NOTES"}`,
            entity: "OrderRequest",
            entityId: params.id,
            meta: { previousStatus: order.status, newStatus: status },
          },
        })

        return { 
          order: updatedOrder, 
          invoice: updatedOrder.invoice,
          isNewInvoice: false 
        }
      }
    })

    // Send email notification if new invoice was created
    if (result.isNewInvoice && result.invoice) {
      try {
        await sendInvoiceEmail({
          to: result.order.user.email,
          invoiceNumber: result.invoice.invoiceNumber,
          customerName: result.order.user.name || result.order.user.email,
          orderId: result.order.id,
          totalAmount: result.order.totalPrice,
          dueDate: result.invoice.dueDate,
          items: result.order.items.map((item:any) => ({
            name: item.product?.name || "Product",
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            totalPrice: item.totalPrice,
          })),
        })

        // Update invoice status to PENDING after email is sent
        await prisma.invoice.update({
          where: { id: result.invoice.id },
          data: { status: InvoiceStatus.PENDING }
        })

      } catch (emailError) {
        console.error("Failed to send invoice email:", emailError)
        // Don't fail the request if email fails
      }
    }

    return NextResponse.json({ 
      ...result.order, 
      totalAmount: result.order.totalPrice 
    })

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors }, { status: 400 })
    }
    
    if (error instanceof Error && error.message === "Order not found") {
      return NextResponse.json({ error: "Order not found" }, { status: 404 })
    }
    
    console.error("Update order error:", error)
    return NextResponse.json({ error: "Failed to update order" }, { status: 500 })
  }
}


export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await auth.api.getSession({ headers: request.headers })

    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 })
    }

    const order = await prisma.orderRequest.findUnique({
      where: { id: params.id },
    })

    if (!order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 })
    }

    await prisma.orderRequest.delete({
      where: { id: params.id },
    })

    // Log audit
    await prisma.auditLog.create({
      data: {
        actorId: session.user.id,
        actorRole: session.user.role,
        action: "DELETE_ORDER",
        entity: "OrderRequest",
        entityId: params.id,
      },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json({ error: "Failed to delete order" }, { status: 500 })
  }
}
