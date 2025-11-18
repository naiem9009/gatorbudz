import { type NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/db"

export const runtime = "nodejs"

export async function PATCH(request: NextRequest) {
  try {
    const session = await auth.api.getSession({ headers: request.headers })

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const { name, company } = body

    const updatedUser = await prisma.user.update({
      where: { id: session.user.id },
      data: {
        name: name || session.user.name,
        company: company || session.user.company,
      },
      select: {
        id: true,
        email: true,
        name: true,
        company: true,
        tier: true,
        role: true,
      },
    })

    // Log audit
    await prisma.auditLog.create({
      data: {
        actorId: session.user.id,
        actorRole: session.user.role,
        action: "USER_PROFILE_UPDATED",
        entity: "User",
        entityId: session.user.id,
        meta: { name, company },
      },
    })

    return NextResponse.json({ success: true, data: updatedUser })
  } catch (error) {
    console.error("Error updating profile:", error)
    return NextResponse.json({ error: "Failed to update profile" }, { status: 500 })
  }
}
