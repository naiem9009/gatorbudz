import { PrismaClient } from "@prisma/client"
import { type NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { z } from "zod"

const prisma = new PrismaClient()

const updateUserSchema = z.object({
  role: z.enum(["PUBLIC", "VERIFIED", "MANAGER", "ADMIN"]).optional(),
  tier: z.enum(["GOLD", "PLATINUM", "DIAMOND"]).optional(),
  name: z.string().optional(),
  company: z.string().optional(),
})

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth.api.getSession({ headers: request.headers })

    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 })
    }

    const body = await request.json()
    const updates = updateUserSchema.parse(body)

    if (updates.role === "VERIFIED") {
      await prisma.user.update({
        where: { id: (await params).id },
        data: {licenseVerified: true}
      })
    }

    const user = await prisma.user.update({
      where: { id: (await params).id },
      data: updates,
    })

    // Log audit
    await prisma.auditLog.create({
      data: {
        actorId: session.user.id,
        actorRole: session.user.role,
        action: "UPDATE_USER",
        entity: "User",
        entityId: (await params).id,
        meta: updates,
      },
    })

    return NextResponse.json(user)
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors }, { status: 400 })
    }
    return NextResponse.json({ error: "Failed to update user" }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth.api.getSession({ headers: request.headers })

    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 })
    }

    await prisma.user.delete({
      where: { id: (await params).id },
    })

    // Log audit
    await prisma.auditLog.create({
      data: {
        actorId: session.user.id,
        actorRole: session.user.role,
        action: "DELETE_USER",
        entity: "User",
        entityId: (await params).id,
      },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json({ error: "Failed to delete user" }, { status: 500 })
  }
}



export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth.api.getSession({ headers: request.headers })
    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 })
    }

    const user = await prisma.user.findUnique({
      where: { id: (await params).id },
      select: {
        id: true,
        email: true,
        name: true,
        company: true,
        phone: true,
        role: true,
        tier: true,
        emailVerified: true,
        licenseVerified: true,
        accountStatus: true,
        billingAddress1: true,
        billingAddress2: true,
        billingCity: true,
        billingState: true,
        billingPostalCode: true,
        billingCountry: true,
        shippingAddress1: true,
        shippingAddress2: true,
        shippingCity: true,
        shippingState: true,
        shippingPostalCode: true,
        shippingCountry: true,
        createdAt: true,
        updatedAt: true,
        _count: {
          select: {
            orderRequests: true,
            invoices: true,
            userFiles: true,
          }
        }
      }
    })

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    return NextResponse.json({ user })
  } catch (error) {
    console.error("Error fetching user:", error)
    return NextResponse.json({ error: "Failed to fetch user" }, { status: 500 })
  }
}
