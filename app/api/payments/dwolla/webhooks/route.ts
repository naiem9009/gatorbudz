import { type NextRequest, NextResponse } from "next/server"
import { PrismaClient } from "@prisma/client"

const prisma = new PrismaClient()

export async function POST(request: NextRequest) {
  try {
    console.log("[v0] Dwolla webhook received")

    const body = await request.json()
    const event = body.event
    const resource = body.resource

    // Log for debugging
    console.log("[v0] Webhook event:", event)
    console.log("[v0] Resource:", resource)

    // Handle transfer completed event
    if (event === "transfer_completed") {
      const transferId = resource.id
      const transferStatus = resource.status

      // Find payment by transfer ID
      const payment = await prisma.payment.findFirst({
        where: {
          dwollaTransferId: transferId,
        },
        include: { invoice: true },
      })

      if (payment) {
        console.log("[v0] Payment found:", payment.id)

        // Update payment status
        await prisma.payment.update({
          where: { id: payment.id },
          data: {
            status: transferStatus === "completed" ? "COMPLETED" : "FAILED",
            paidAt: transferStatus === "completed" ? new Date() : null,
          },
        })

        // Update invoice status if payment completed
        if (transferStatus === "completed" && payment.invoice) {
          await prisma.invoice.update({
            where: { id: payment.invoice.id },
            data: {
              status: "PAID",
              paidAt: new Date(),
              dwollaStatus: "COMPLETED",
            },
          })

          console.log("[v0] Invoice marked as paid:", payment.invoice.id)
        }
      }
    }

    // Handle transfer failed event
    if (event === "transfer_failed") {
      const transferId = resource.id

      const payment = await prisma.payment.findFirst({
        where: {
          dwollaTransferId: transferId,
        },
      })

      if (payment) {
        await prisma.payment.update({
          where: { id: payment.id },
          data: {
            status: "FAILED",
          },
        })

        console.log("[v0] Payment marked as failed:", payment.id)
      }
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("[v0] Webhook error:", error)
    return NextResponse.json({ error: "Webhook processing failed" }, { status: 500 })
  }
}
