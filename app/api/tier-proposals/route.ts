import { PrismaClient } from "@prisma/client"
import { type NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { z } from "zod"

const prisma = new PrismaClient()

const createProposalSchema = z.object({
  proposedTier: z.enum(["GOLD", "PLATINUM", "DIAMOND"]),
  reason: z.string(),
})

export async function GET(request: NextRequest) {
  try {
    const session = await auth.api.getSession({ headers: request.headers })

    if (!session || !["MANAGER", "ADMIN"].includes(session.user.role)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const status = searchParams.get("status")

    const where: any = {}
    if (status) where.status = status

    const proposals = await prisma.tierChangeProposal.findMany({
      where,
      include: {
        user: { select: { id: true, email: true, name: true, tier: true } },
        proposer: { select: { id: true, email: true, name: true } },
      },
      orderBy: { createdAt: "desc" },
    })

    return NextResponse.json(proposals)
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch proposals" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth.api.getSession({ headers: request.headers })

    if (!session || !["MANAGER", "ADMIN"].includes(session.user.role)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 })
    }

    const body = await request.json()
    const { proposedTier, reason } = createProposalSchema.parse(body)
    const userId = session.user.id;

    const proposal = await prisma.tierChangeProposal.create({
      data: {
        userId,
        proposedTier,
        reason,
        createdBy: session.user.id,
        status: "PENDING",
      },
      include: {
        user: true,
        proposer: true,
      },
    })

    // Log audit
    await prisma.auditLog.create({
      data: {
        actorId: session.user.id,
        actorRole: session.user.role,
        action: "CREATE_TIER_PROPOSAL",
        entity: "TierChangeProposal",
        entityId: proposal.id,
        meta: { userId, proposedTier, reason },
      },
    })

    return NextResponse.json(proposal, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors }, { status: 400 })
    }
    return NextResponse.json({ error: "Failed to create proposal" }, { status: 500 })
  }
}
