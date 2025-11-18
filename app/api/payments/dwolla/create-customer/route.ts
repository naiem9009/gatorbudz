import { type NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { PrismaClient } from "@prisma/client"

const prisma = new PrismaClient()

async function getDwollaToken() {
  const DWOLLA_ENV = process.env.DWOLLA_ENV || "sandbox"
  const DWOLLA_TOKEN = process.env.DWOLLA_TOKEN
  const DWOLLA_KEY = process.env.DWOLLA_KEY
  const DWOLLA_SECRET = process.env.DWOLLA_SECRET

  if (!DWOLLA_TOKEN && (!DWOLLA_KEY || !DWOLLA_SECRET)) {
    throw new Error(
      "Dwolla credentials not configured. Add DWOLLA_KEY and DWOLLA_SECRET to your environment variables in the Vars section.",
    )
  }

  // If static token exists and is valid, use it
  if (DWOLLA_TOKEN) {
    return DWOLLA_TOKEN
  }

  const authString = Buffer.from(`${DWOLLA_KEY}:${DWOLLA_SECRET}`).toString("base64")
  const tokenUrl = `https://${DWOLLA_ENV === "production" ? "api" : "api-sandbox"}.dwolla.com/token`

  const response = await fetch(tokenUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Authorization: `Basic ${authString}`,
    },
    body: "grant_type=client_credentials",
  })

  if (!response.ok) {
    const error = await response.text()
    console.error("[Dwolla] Token generation failed:", error)
    throw new Error(`Failed to generate Dwolla token: ${error}`)
  }

  const data = await response.json()
  return data.access_token
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth.api.getSession({ headers: request.headers })

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
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

    // Check if customer already exists
    const existingCustomer = await prisma.dwollaCustomer.findUnique({
      where: { userId: session.user.id },
    })

    if (existingCustomer) {
      return NextResponse.json({
        success: true,
        customerId: existingCustomer.dwollaId,
      })
    }

    const baseUrl = DWOLLA_ENV === "production" ? "https://api.dwolla.com" : "https://api-sandbox.dwolla.com"

    // Create Dwolla customer
    const customerResponse = await fetch(`${baseUrl}/customers`, {
      method: "POST",
      headers: {
        "Content-Type": "application/vnd.dwolla.v1.hal+json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        firstName: session.user.name?.split(" ")[0] || "Customer",
        lastName: session.user.name?.split(" ").slice(1).join(" ") || session.user.email,
        email: session.user.email,
        type: "unverified",
      }),
    })

    if (!customerResponse.ok) {
      const errorText = await customerResponse.text()
      console.error("[Dwolla] Customer creation error:", errorText)

      try {
        const errorJson = JSON.parse(errorText)
        if (
          errorJson.code === "ValidationError" &&
          errorJson._embedded?.errors?.[0]?.code === "Duplicate" &&
          errorJson._embedded.errors[0]._links?.about?.href
        ) {
          const existingCustomerUrl = errorJson._embedded.errors[0]._links.about.href
          const existingCustomerId = existingCustomerUrl.split("/").pop()

          console.log("[Dwolla] Found existing customer for email:", existingCustomerId)

          // Check if this customer is already in our database
          const dbCustomer = await prisma.dwollaCustomer.findFirst({
            where: {
              dwollaId: existingCustomerId,
            },
          })

          if (dbCustomer) {
            // Update the existing record to link to current user if different
            if (dbCustomer.userId !== session.user.id) {
              const updatedCustomer = await prisma.dwollaCustomer.update({
                where: { id: dbCustomer.id },
                data: { userId: session.user.id },
              })
              return NextResponse.json({
                success: true,
                customerId: updatedCustomer.dwollaId,
                message: "Linked to existing Dwolla customer",
              })
            }
            return NextResponse.json({
              success: true,
              customerId: dbCustomer.dwollaId,
            })
          } else {
            // Store the existing customer in our database
            const newDbCustomer = await prisma.dwollaCustomer.create({
              data: {
                userId: session.user.id,
                dwollaId: existingCustomerId,
                email: session.user.email,
                firstName: session.user.name?.split(" ")[0] || "Customer",
                lastName: session.user.name?.split(" ").slice(1).join(" ") || "",
              },
            })

            console.log("[Dwolla] Stored existing customer in database:", existingCustomerId)

            return NextResponse.json({
              success: true,
              customerId: newDbCustomer.dwollaId,
              message: "Linked to existing Dwolla customer",
            })
          }
        }
      } catch (parseError) {
        console.error("[Dwolla] Error parsing duplicate error:", parseError)
      }

      return NextResponse.json({ error: "Failed to create Dwolla customer" }, { status: 500 })
    }

    const dwollaId = customerResponse.headers.get("location")?.split("/").pop()

    if (!dwollaId) {
      return NextResponse.json({ error: "Failed to extract Dwolla customer ID" }, { status: 500 })
    }

    // Store in database
    await prisma.dwollaCustomer.create({
      data: {
        userId: session.user.id,
        dwollaId,
        email: session.user.email,
        firstName: session.user.name?.split(" ")[0] || "Customer",
        lastName: session.user.name?.split(" ").slice(1).join(" ") || "",
      },
    })

    return NextResponse.json({
      success: true,
      customerId: dwollaId,
    })
  } catch (error) {
    console.error("[API] Create customer error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
