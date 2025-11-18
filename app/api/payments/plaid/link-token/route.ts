import { type NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"

export async function POST(request: NextRequest) {
  try {
    const session = await auth.api.getSession({ headers: request.headers })

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const PLAID_CLIENT_ID = process.env.PLAID_CLIENT_ID
    const PLAID_SECRET = process.env.PLAID_SECRET
    const PLAID_ENV = process.env.PLAID_ENV || "sandbox"

    if (!PLAID_CLIENT_ID || !PLAID_SECRET) {
      return NextResponse.json({ error: "Plaid credentials not configured" }, { status: 500 })
    }

    const response = await fetch(`https://${PLAID_ENV}.plaid.com/link/token/create`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        client_id: PLAID_CLIENT_ID,
        secret: PLAID_SECRET,
        client_name: "Gator Budz - Invoice Payment",
        user: {
          client_user_id: session.user.id,
        },
        client_ip: request.headers.get("x-forwarded-for") || "127.0.0.1",
        language: "en",
        country_codes: ["US"],
        products: ["auth"],
        account_subtypes: ["checking", "savings"],
      }),
    })

    const data = await response.json()

    if (!response.ok) {
      console.error("Plaid error:", data)
      return NextResponse.json({ error: "Failed to create link token" }, { status: 500 })
    }

    return NextResponse.json({ linkToken: data.link_token, expiration: data.expiration })
  } catch (error) {
    console.error("Link token error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
