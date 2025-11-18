import { type NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { PrismaClient } from "@prisma/client"

const prisma = new PrismaClient()

async function getDwollaToken() {
  const DWOLLA_TOKEN = process.env.DWOLLA_TOKEN
  const DWOLLA_KEY = process.env.DWOLLA_KEY
  const DWOLLA_SECRET = process.env.DWOLLA_SECRET
  const DWOLLA_ENV = process.env.DWOLLA_ENV || "sandbox"

  if (!DWOLLA_TOKEN && (!DWOLLA_KEY || !DWOLLA_SECRET)) {
    throw new Error(
      "Dwolla credentials not configured. Add DWOLLA_KEY and DWOLLA_SECRET to your environment variables in the Vars section.",
    )
  }

  if (DWOLLA_TOKEN) {
    return DWOLLA_TOKEN
  }

  const authString = Buffer.from(`${DWOLLA_KEY}:${DWOLLA_SECRET}`).toString("base64")
  const response = await fetch(`https://${DWOLLA_ENV === "production" ? "api" : "api-sandbox"}.dwolla.com/token`, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Authorization: `Basic ${authString}`,
    },
    body: "grant_type=client_credentials",
  })

  if (!response.ok) {
    const error = await response.text()
    throw new Error(`Failed to generate Dwolla token: ${error}`)
  }

  const data = await response.json()
  return data.access_token
}

export async function GET(request: NextRequest) {
  try {
    const session = await auth.api.getSession({ headers: request.headers })

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const fundingSources = await prisma.dwollaFundingSource.findMany({
      where: {
        userId: session.user.id,
        removed: false,
      },
    })

    return NextResponse.json({
      success: true,
      fundingSources,
    })
  } catch (error) {
    console.error("Fetch funding sources error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth.api.getSession({ headers: request.headers })

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { routingNumber, accountNumber, accountType, accountName } = await request.json()

    const dwollaCustomer = await prisma.dwollaCustomer.findUnique({
      where: { userId: session.user.id },
    })

    if (!dwollaCustomer) {
      return NextResponse.json({ error: "Dwolla customer not created" }, { status: 400 })
    }

    const DWOLLA_ENV = process.env.DWOLLA_ENV || "sandbox"

    let token
    try {
      token = await getDwollaToken()
    } catch (error) {
      console.error("[Dwolla] Auth error:", error)
      return NextResponse.json(
        {
          error: "Dwolla not configured. Please add DWOLLA_TOKEN or DWOLLA_KEY + DWOLLA_SECRET env vars",
        },
        { status: 500 },
      )
    }

    const baseUrl = DWOLLA_ENV === "production" ? "https://api.dwolla.com" : "https://api-sandbox.dwolla.com"

    const fundingSourceResponse = await fetch(`${baseUrl}/customers/${dwollaCustomer.dwollaId}/funding-sources`, {
      method: "POST",
      headers: {
        "Content-Type": "application/vnd.dwolla.v1.hal+json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        routingNumber,
        accountNumber,
        bankAccountType: accountType,
        name: accountName,
      }),
    })

    if (!fundingSourceResponse.ok) {
      const error = await fundingSourceResponse.text()
      console.error("Dwolla funding source error:", error)
      return NextResponse.json({ error: "Failed to add funding source" }, { status: 500 })
    }

    const fundingSourceId = fundingSourceResponse.headers.get("location")?.split("/").pop()

    if (!fundingSourceId) {
      return NextResponse.json({ error: "Failed to extract funding source ID" }, { status: 500 })
    }

    // Store in database
    const accountMask = accountNumber.slice(-4)
    const bankName = "Bank" // In production, you'd resolve the bank name

    await prisma.dwollaFundingSource.create({
      data: {
        userId: session.user.id,
        dwollaId: fundingSourceId,
        dwollaCustomerId: dwollaCustomer.dwollaId,
        bankName,
        accountName,
        accountMask,
        bankAccountType: accountType,
      },
    })

    return NextResponse.json({
      success: true,
      fundingSourceId,
    })
  } catch (error) {
    console.error("Add funding source error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
