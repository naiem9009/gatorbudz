import { betterAuth } from "better-auth"
import { prismaAdapter } from "better-auth/adapters/prisma"
import { PrismaClient } from "@prisma/client"
import { customSession } from "better-auth/plugins"

const prisma = new PrismaClient()

export const auth = betterAuth({
  database: prismaAdapter(prisma, { provider: "postgresql" }),
  emailAndPassword: { enabled: true },
  socialProviders: {
    google: {
      clientId: process.env.GOOGLE_CLIENT_ID || "",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || "",
    }
  },
  plugins: [
    customSession(async ({ user, session }) => {
      const dbUser = await prisma.user.findUnique({
        where: { id: session.userId },
        select: { role: true, tier: true, company: true, image: true },
      })

      return {
        user: {
          ...user,                       
          role: dbUser?.role ?? "PUBLIC",
          tier: dbUser?.tier ?? null,
          company: dbUser?.company ?? null,
          image: dbUser?.image ?? null,
        },
        session,
      }
    }),
  ],
  extendUser: {
    role:   { type: "string", required: false },
    tier:   { type: "string", required: false },
    company:{ type: "string", required: false },
    image:{ type: "string", required: false },
  },
})

export type Session = typeof auth.$Infer.Session
export type User = typeof auth.$Infer.Session.user
