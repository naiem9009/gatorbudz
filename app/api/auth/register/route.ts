// app/api/auth/register/route.ts
import { type NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { PrismaClient, Prisma } from "@prisma/client"
import { auth } from "@/lib/auth"


export const runtime = "nodejs"


const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient }
export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["query", "error", "warn"] : ["error"],
  })
if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma

const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8, "Password must be at least 8 characters"),
  name: z.string().min(2, "Name must be at least 2 characters"),
  company: z.string().optional(),
})

export async function POST(request: NextRequest) {
  try {
    const json = await request.json()
    const { email, password, name, company } = registerSchema.parse(json)

    const normalizedEmail = email.trim().toLowerCase()


    const existing = await prisma.user.findUnique({
      where: { email: normalizedEmail },
      select: { id: true },
    })
    if (existing) {
      return NextResponse.json({ error: "User already exists" }, { status: 400 })
    }


    const res = await auth.api.signUpEmail({
      body: {
        email: normalizedEmail,
        password,
        name,
      },
    })


    if (!res?.user) {
      return NextResponse.json({ error: "Sign up failed" }, { status: 400 })
    }


    await prisma.user.update({
      where: { id: res.user.id },
      data: {
        role: "PUBLIC",
        tier: "GOLD",
        company: company ?? null,
      },
    })

    return NextResponse.json(
      {
        user: {
          id: res.user.id,
          email: res.user.email,
          name: res.user.name,
          company: company ?? null,
          role: "PUBLIC",
          tier: "GOLD",
        },
      },
      { status: 201 }
    )
  } catch (err: any) {
    if (err?.issues) {
      return NextResponse.json({ error: err.issues }, { status: 400 })
    }
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002") {
      return NextResponse.json({ error: "User already exists" }, { status: 400 })
    }
    console.error("Registration failed:", err)
    return NextResponse.json({ error: "Registration failed" }, { status: 500 })
  }
}
