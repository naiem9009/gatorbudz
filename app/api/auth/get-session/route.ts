import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { PrismaClient } from "@prisma/client"

export const runtime = "nodejs"

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient }
const prisma =
  globalForPrisma.prisma ?? new PrismaClient()
if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma

export async function GET(req: Request) {
  try {
    const session = await auth.api.getSession({ headers: req.headers })
    if (!session?.user?.id) {
      return NextResponse.json({ user: null }, { status: 200 })
    }

    const dbUser = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { role: true, tier: true, company: true },
    })

    const user = {
      id: session.user.id,
      email: session.user.email,
      name: session.user.name,
      role: (dbUser?.role as any) ?? "PUBLIC",
      tier: (dbUser?.tier as any) ?? "GOLD",
      company: dbUser?.company ?? null,
    }

    return NextResponse.json({ user }, { status: 200 })
  } catch (e) {
    console.error("get-session route error", e)
    return NextResponse.json({ user: null }, { status: 200 })
  }
}
