import { type NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/db"
import { z } from "zod"
import { generateInvoiceNumber } from "@/lib/utils"
import { InvoiceStatus } from "@prisma/client"
import { sendInvoiceEmail, sendOrderStatusEmail } from "@/lib/email"

const updateOrderSchema = z.object({
  status: z.enum(["PENDING", "APPROVED", "PAID", "REJECTED", "FULFILLED"]).optional(),
  notes: z.string().optional(),
})

// PUT update order status with email notifications for all status changes
export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
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
        where: { id: (await params).id },
        include: {
          user: true,
          items: {
            include: {
              product: {
                select: {
                  id: true,
                  name: true,
                  category: true,
                  weight: true,
                  potency: true
                }
              },
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
      let emailStatus = { sent: false, error: null as any }

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
          where: { id: (await params).id },
          data: { ...updateData, status: "APPROVED" },
        })

        // Send status change email
        if (status && order.status !== "PENDING") {
          try {
            await sendOrderStatusEmail({
              to: order.user.email,
              customerName: order.user.name || order.user.email,
              orderId: order.orderId || order.id.slice(0, 8),
              newStatus: status,
              items: order.items.map((item: any) => ({
                name: item.product?.name || "Product",
                strain: item.strain,
                quantity: item.quantity,
                unitPrice: item.unitPrice,
                totalPrice: item.totalPrice,
              })),
              totalAmount: order.totalPrice,
            })
            emailStatus.sent = true
          } catch (error) {
            emailStatus.error = error
            console.error("Failed to send status update email:", error)
          }
        }

        // Log audit
        await tx.auditLog.create({
          data: {
            actorId: session.user.id,
            actorRole: session.user.role,
            action: "ORDER_APPROVED",
            entity: "OrderRequest",
            entityId: (await params).id,
            meta: { 
              previousStatus: order.status, 
              newStatus: "APPROVED",
              invoiceNumber,
              itemCount: order.items.length,
              totalAmount: order.totalPrice,
              emailSent: emailStatus.sent,
              emailError: emailStatus.error?.toString()
            },
          },
        })

        return { 
          order: { ...order, ...updateData, status: "APPROVED", invoice }, 
          invoice,
          isNewInvoice: true,
          emailStatus
        }
      } else {
        // Regular update without invoice creation
        const updatedOrder = await tx.orderRequest.update({
          where: { id: (await params).id },
          data: updateData,
          include: {
            user: true,
            items: {
              include: {
                product: {
                  select: {
                    id: true,
                    name: true,
                    category: true,
                    weight: true,
                    potency: true
                  }
                },
              },
            },
            invoice: {
              include: {
                payments: true
              }
            },
          },
        })

        // Send status change email for ANY status change
        if (status && order.status !== status) {
          try {
            await sendOrderStatusEmail({
              to: order.user.email,
              customerName: order.user.name || order.user.email,
              orderId: order.orderId || order.id.slice(0, 8),
              newStatus: status,
              items: order.items.map((item: any) => ({
                name: item.product?.name || "Product",
                strain: item.strain,
                quantity: item.quantity,
                unitPrice: item.unitPrice,
                totalPrice: item.totalPrice,
              })),
              totalAmount: order.totalPrice,
            })
            emailStatus.sent = true
          } catch (error) {
            emailStatus.error = error
            console.error("Failed to send status update email:", error)
          }
        }

        // Log audit
        await tx.auditLog.create({
          data: {
            actorId: session.user.id,
            actorRole: session.user.role,
            action: `UPDATE_ORDER_${status || "NOTES"}`,
            entity: "OrderRequest",
            entityId: (await params).id,
            meta: { 
              previousStatus: order.status, 
              newStatus: status,
              itemCount: order.items.length,
              totalAmount: order.totalPrice,
              emailSent: emailStatus.sent,
              emailError: emailStatus.error?.toString(),
              notesUpdated: !!notes
            },
          },
        })

        return { 
          order: updatedOrder, 
          invoice: updatedOrder.invoice,
          isNewInvoice: false,
          emailStatus
        }
      }
    })

    // Send invoice email if new invoice was created (outside transaction)
    if (result.isNewInvoice && result.invoice) {
      try {
        // Prepare billToAddress from user data
        const u = result.order.user
        const billToAddressParts = []

        if (u.billingAddress1) billToAddressParts.push(u.billingAddress1)
        if (u.billingAddress2) billToAddressParts.push(u.billingAddress2)

        if (u.billingCity && u.billingState) billToAddressParts.push(`${u.billingCity}, ${u.billingState}`)
        else if (u.billingCity) billToAddressParts.push(u.billingCity)
        else if (u.billingState) billToAddressParts.push(u.billingState)

        if (u.billingPostalCode) billToAddressParts.push(u.billingPostalCode)
        if (u.billingCountry) billToAddressParts.push(u.billingCountry)

        const billToAddress = billToAddressParts.length ? billToAddressParts.join('\n') : undefined

        // Send invoice email with the new format
        await sendInvoiceEmail({
          to: result.order.user.email,
          invoiceNumber: result.invoice.invoiceNumber,
          customerName: result.order.user.name || result.order.user.email,
          companyName: result.order.user.company || undefined,
          totalAmount: result.order.totalPrice,
          invoiceDate: result.order.createdAt,
          items: result.order.items.map((item: any) => ({
            name: item.product?.name || "Product",
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            totalPrice: item.totalPrice,
            // Use product weight if available, otherwise use quantity as fallback
            weight: item.product?.weight || item.quantity,
          })),
          // You might want to add shipping cost as a field in your OrderRequest model
          shippingCost: result.order.shippingCost || 0,
          billToAddress: billToAddress,
        })

        // Update invoice status to PENDING after email is sent
        await prisma.invoice.update({
          where: { id: result.invoice.id },
          data: { 
            status: InvoiceStatus.PENDING,
           
          }
        })

        // Log invoice email sent in audit log
        await prisma.auditLog.create({
          data: {
            actorId: session.user.id,
            actorRole: session.user.role,
            action: "INVOICE_EMAIL_SENT",
            entity: "Invoice", 
            entityId: result.invoice.id,
            meta: { 
              invoiceNumber: result.invoice.invoiceNumber,
              recipient: result.order.user.email,
              orderId: result.order.orderId || result.order.id.slice(0, 8),
              totalAmount: result.order.totalPrice,
            },
          },
        })

      } catch (emailError) {
        console.error("Failed to send invoice email:", emailError)
        
        // Log the email error in audit log
        await prisma.auditLog.create({
          data: {
            actorId: session.user.id,
            actorRole: session.user.role,
            action: "INVOICE_EMAIL_FAILED",
            entity: "Invoice",
            entityId: result.invoice.id,
            meta: { 
              invoiceNumber: result.invoice.invoiceNumber,
              recipient: result.order.user.email,
              error: emailError instanceof Error ? emailError.message : String(emailError),
            },
          },
        })
      }
    }

    return NextResponse.json({ 
      ...result.order, 
      totalAmount: result.order.totalPrice,
      notificationSent: result.emailStatus.sent,
      notificationError: result.emailStatus.error ? "Failed to send status notification" : null,
      invoiceCreated: result.isNewInvoice,
      invoiceNumber: result.invoice?.invoiceNumber || null
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



export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth.api.getSession({ headers: request.headers })

    if (!session || !["MANAGER", "ADMIN"].includes(session.user.role)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 })
    }

    const order = await prisma.orderRequest.findUnique({
      where: { id: (await params).id },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            name: true,
            company: true,
            tier: true,
          },
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
              },
            },
          },
        },
        invoice: {
          select: {
            id: true,
            invoiceNumber: true,
            status: true,
            total: true,
            dueDate: true,
            payments: {
              select: {
                id: true,
                amount: true,
                method: true,
                status: true,
                createdAt: true,
              },
            },
          },
        },

      },
    })

    if (!order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 })
    }

    // Format the order data to match the frontend expectations
    const formattedOrder = {
      ...order,
      orderId: order.orderId || order.id.slice(0, 8), // Provide a fallback order ID
      totalAmount: order.totalPrice, // Alias totalPrice to totalAmount for consistency
      items: order.items.map(item => ({
        ...item,
        totalPrice: item.totalPrice || item.quantity * (item.unitPrice || 0),
      })),
    }

    // Log the view (optional)
    await prisma.auditLog.create({
      data: {
        actorId: session.user.id,
        actorRole: session.user.role,
        action: "VIEW_ORDER_DETAIL",
        entity: "OrderRequest",
        entityId: order.id,
      },
    })

    return NextResponse.json({ 
      order: formattedOrder,
      auditLog: {
        lastViewed: new Date().toISOString(),
        viewedBy: {
          id: session.user.id,
          name: session.user.name,
          role: session.user.role,
        },
      },
    })

  } catch (error) {
    console.error("Get order error:", error)
    
    if (error instanceof Error && error.message.includes("not found")) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 })
    }
    
    return NextResponse.json(
      { error: "Failed to fetch order details" }, 
      { status: 500 }
    )
  }
}