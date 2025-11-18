import { type NextRequest, NextResponse } from "next/server"
import { PrismaClient } from "@prisma/client"

const prisma = new PrismaClient()

const PLAID_CLIENT_ID = process.env.PLAID_CLIENT_ID
const PLAID_SECRET = process.env.PLAID_SECRET
const PLAID_ENV = process.env.PLAID_ENV || "sandbox"

export async function POST(request: NextRequest) {
  try {
    const { userId } = await request.json()

    if (!userId) {
      return NextResponse.json({ error: "Missing userId" }, { status: 400 })
    }

    if (!PLAID_CLIENT_ID || !PLAID_SECRET) {
      return NextResponse.json({ error: "Plaid credentials not configured" }, { status: 500 })
    }

    // Create Plaid Link token
    const response = await fetch(`https://${PLAID_ENV}.plaid.com/link/token/create`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        client_id: PLAID_CLIENT_ID,
        secret: PLAID_SECRET,
        user: { client_user_id: userId },
        client_name: "Gator Budz",
        language: "en",
        products: ["auth"],
        country_codes: ["US"],
      }),
    })

    const data = await response.json()

    if (!response.ok || data.error) {
      return NextResponse.json({ error: data.error_message || "Failed to create link token" }, { status: 400 })
    }

    // Save link token to database
    await prisma.plaidLinkToken.create({
      data: {
        userId,
        linkToken: data.link_token,
        expiresAt: new Date(data.expiration),
      },
    })

    return NextResponse.json({ linkToken: data.link_token })
  } catch (error) {
    console.error("Plaid link token error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
