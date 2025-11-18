import { type NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/db"
import { z } from "zod"
import { generateInvoiceNumber } from "@/lib/utils"
import { InvoiceStatus, OrderStatus } from "@prisma/client"
import { sendInvoiceEmail } from "@/lib/email"

const updateOrderSchema = z.object({
  status: z.enum(["PENDING", "APPROVED", "PAID", "REJECTED", "FULFILLED"]).optional(),
  notes: z.string().max(1000).optional(),
})

// PUT update order status
export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth.api.getSession({ headers: request.headers })

    if (!session || !["MANAGER", "ADMIN"].includes(session.user.role)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 })
    }

    const body = await request.json()
    const { status, notes } = updateOrderSchema.parse(body)
    const resolvedParams = await params

    // Validate order exists and user has permission
    const existingOrder = await prisma.orderRequest.findUnique({
      where: { id: resolvedParams.id },
      include: {
        user: true,
        invoice: true,
      },
    })

    if (!existingOrder) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 })
    }

    // Start a transaction to ensure data consistency
    const result = await prisma.$transaction(async (tx) => {
      const order = await tx.orderRequest.findUnique({
        where: { id: resolvedParams.id },
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
        ...(notes !== undefined && { notes }),
        lastActorId: session.user.id,
        lastActorRole: session.user.role,
        updatedAt: new Date(),
      }

      let invoice = order.invoice

      // Validate status transitions
      if (status) {
        const validTransitions: Record<OrderStatus, OrderStatus[]> = {
          PENDING: ["APPROVED", "REJECTED"],
          APPROVED: ["PAID", "FULFILLED", "REJECTED"],
          PAID: ["FULFILLED", "REJECTED"],
          FULFILLED: [],
          REJECTED: [],
        }

        if (!validTransitions[order.status]?.includes(status as OrderStatus)) {
          throw new Error(`Invalid status transition from ${order.status} to ${status}`)
        }
      }

      // If order is being approved and doesn't have an invoice yet, create one
      if (status === "APPROVED" && order.status !== "APPROVED" && !order.invoice) {
        const invoiceNumber = await generateInvoiceNumber()
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
            createdAt: new Date(),
          },
          include: {
            payments: true
          }
        })

        // Update order with new status
        const updatedOrder = await tx.orderRequest.update({
          where: { id: resolvedParams.id },
          data: { ...updateData, status: "APPROVED" },
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
            action: "ORDER_APPROVED",
            entity: "ORDER_REQUEST",
            entityId: resolvedParams.id,
            meta: { 
              previousStatus: order.status, 
              newStatus: "APPROVED",
              invoiceNumber,
              invoiceId: invoice.id,
              totalAmount: order.totalPrice,
            },
          },
        })

        return { 
          order: updatedOrder, 
          invoice,
          isNewInvoice: true,
          statusChanged: true,
        }
      } else {
        // Regular update without invoice creation
        const updatedOrder = await tx.orderRequest.update({
          where: { id: resolvedParams.id },
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

        const statusChanged = status && status !== order.status

        // Log audit only if there were actual changes
        if (statusChanged || notes !== undefined) {
          await tx.auditLog.create({
            data: {
              actorId: session.user.id,
              actorRole: session.user.role,
              action: statusChanged ? `ORDER_${status}` : "UPDATE_ORDER_NOTES",
              entity: "ORDER_REQUEST",
              entityId: resolvedParams.id,
              meta: { 
                ...(statusChanged && { 
                  previousStatus: order.status, 
                  newStatus: status 
                }),
                ...(notes !== undefined && { notesUpdated: true }),
              },
            },
          })
        }

        return { 
          order: updatedOrder, 
          invoice: updatedOrder.invoice,
          isNewInvoice: false,
          statusChanged: !!statusChanged,
        }
      }
    })

    // Send email notification if new invoice was created
    if (result.isNewInvoice && result.invoice && result.order.user.email) {
      try {
        await sendInvoiceEmail({
          to: result.order.user.email,
          invoiceNumber: result.invoice.invoiceNumber,
          customerName: result.order.user.name || result.order.user.email.split('@')[0],
          companyName: result.order.user.company || undefined,
          orderId: result.order.id,
          totalAmount: result.order.totalPrice,
          dueDate: result.invoice.dueDate,
          items: result.order.items.map((item: any) => ({
            name: item.product?.name || "Product",
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            totalPrice: item.totalPrice,
          })),
        })

        console.log(`Invoice email sent for order ${result.order.id} to ${result.order.user.email}`)

      } catch (emailError) {
        console.error("Failed to send invoice email:", emailError)
        // Log the email failure but don't fail the request
        await prisma.auditLog.create({
          data: {
            actorId: session.user.id,
            actorRole: session.user.role,
            action: "EMAIL_FAILED",
            entity: "ORDER_REQUEST",
            entityId: resolvedParams.id,
            meta: { 
              error: String(emailError),
              invoiceNumber: result.invoice.invoiceNumber,
            },
          },
        })
      }
    }

    // Prepare response data
    const responseData = {
      id: result.order.id,
      status: result.order.status,
      notes: result.order.notes,
      totalAmount: result.order.totalPrice,
      userId: result.order.userId,
      createdAt: result.order.createdAt,
      updatedAt: result.order.updatedAt,
      items: result.order.items,
      user: {
        id: result.order.user.id,
        name: result.order.user.name,
        email: result.order.user.email,
        company: result.order.user.company,
      },
      invoice: result.invoice ? {
        id: result.invoice.id,
        invoiceNumber: result.invoice.invoiceNumber,
        status: result.invoice.status,
        total: result.invoice.total,
        dueDate: result.invoice.dueDate,
      } : null,
    }

    return NextResponse.json(responseData)

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ 
        error: "Invalid request data", 
        details: error.errors 
      }, { status: 400 })
    }
    
    if (error instanceof Error) {
      if (error.message === "Order not found") {
        return NextResponse.json({ error: "Order not found" }, { status: 404 })
      }
      if (error.message.includes("Invalid status transition")) {
        return NextResponse.json({ error: error.message }, { status: 400 })
      }
    }
    
    console.error("Update order error:", error)
    return NextResponse.json({ 
      error: "Internal server error" 
    }, { status: 500 })
  }
}

// GET order details
export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth.api.getSession({ headers: request.headers })

    if (!session || !["MANAGER", "ADMIN"].includes(session.user.role)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 })
    }

    const resolvedParams = await params
    const order = await prisma.orderRequest.findUnique({
      where: { id: resolvedParams.id },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            company: true,
          },
        },
        items: {
          include: {
            product: {
              select: {
                id: true,
                name: true,
                description: true,
                category: true,
              },
            },
          },
        },
        invoice: {
          include: {
            payments: {
              orderBy: {
                createdAt: 'desc',
              },
            },
          },
        },
      },
    })

    if (!order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 })
    }

    return NextResponse.json(order)

  } catch (error) {
    console.error("Get order error:", error)
    return NextResponse.json({ 
      error: "Internal server error" 
    }, { status: 500 })
  }
}