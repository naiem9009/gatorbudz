import { PrismaClient } from "@prisma/client"
import { type NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { z } from "zod"

const prisma = new PrismaClient()

const updateProposalSchema = z.object({
  status: z.enum(["APPROVED", "REJECTED"]),
  decisionNote: z.string().optional(),
})

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth.api.getSession({ headers: request.headers })

    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 })
    }

    const body = await request.json()
    const { status, decisionNote } = updateProposalSchema.parse(body)

    const proposal = await prisma.tierChangeProposal.findUnique({
      where: { id: (await params).id },
    })

    if (!proposal) {
      return NextResponse.json({ error: "Proposal not found" }, { status: 404 })
    }

    const updatedProposal = await prisma.tierChangeProposal.update({
      where: { id: (await params).id },
      data: {
        status,
        decidedBy: session.user.id,
        decidedAt: new Date(),
        decisionNote,
      },
      include: {
        user: true,
        proposer: true,
      },
    })

    // If approved, update user tier
    if (status === "APPROVED") {
      await prisma.user.update({
        where: { id: proposal.userId },
        data: { tier: proposal.proposedTier },
      })
    }

    // Log audit
    await prisma.auditLog.create({
      data: {
        actorId: session.user.id,
        actorRole: session.user.role,
        action: `${status}_TIER_PROPOSAL`,
        entity: "TierChangeProposal",
        entityId: (await params).id,
      },
    })

    return NextResponse.json(updatedProposal)
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors }, { status: 400 })
    }
    return NextResponse.json({ error: "Failed to update proposal" }, { status: 500 })
  }
}
