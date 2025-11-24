import { type NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/db"

export const runtime = "nodejs"

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth.api.getSession({ headers: request.headers })

    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 })
    }

    const body = await request.json()
    const { status, decisionNote } = body

    if (!["APPROVED", "REJECTED"].includes(status)) {
      return NextResponse.json({ error: "Invalid status" }, { status: 400 })
    }

    const proposal = await prisma.tierChangeProposal.update({
      where: { id: (await params).id },
      data: {
        status,
        decidedBy: session.user.id,
        decidedAt: new Date(),
        decisionNote,
      },
      include: {
        user: { select: { id: true, email: true, tier: true } },
      },
    })

    // If approved, update user tier
    if (status === "APPROVED") {
      await prisma.user.update({
        where: { id: proposal.user.id },
        data: { tier: proposal.proposedTier },
      })
    }

    // Log audit
    await prisma.auditLog.create({
      data: {
        actorId: session.user.id,
        actorRole: session.user.role,
        action: `TIER_PROPOSAL_${status}`,
        entity: "TierChangeProposal",
        entityId: proposal.id,
        meta: { userId: proposal.user.id, tier: proposal.proposedTier },
      },
    })

    return NextResponse.json({ success: true, data: proposal })
  } catch (error) {
    console.error("Error responding to proposal:", error)
    return NextResponse.json({ error: "Failed to respond to proposal" }, { status: 500 })
  }
}
