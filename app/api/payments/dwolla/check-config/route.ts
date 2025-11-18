import { type NextRequest, NextResponse } from "next/server"

const DWOLLA_ENV = process.env.DWOLLA_ENV || "sandbox"
const DWOLLA_TOKEN = process.env.DWOLLA_TOKEN
const DWOLLA_KEY = process.env.DWOLLA_KEY
const DWOLLA_SECRET = process.env.DWOLLA_SECRET

export async function GET(request: NextRequest) {
  try {
    if (!DWOLLA_TOKEN && (!DWOLLA_KEY || !DWOLLA_SECRET)) {
      return NextResponse.json({
        configured: false,
        error: "Missing Dwolla credentials. Need either DWOLLA_TOKEN or DWOLLA_KEY + DWOLLA_SECRET"
      }, { status: 500 })
    }

    const baseUrl = DWOLLA_ENV === "production" ? "https://api.dwolla.com" : "https://api-sandbox.dwolla.com"
    
    // Test the token by making a simple API call
    const testResponse = await fetch(`${baseUrl}/`, {
      headers: {
        "Authorization": `Bearer ${DWOLLA_TOKEN}`,
      },
    })

    return NextResponse.json({
      configured: true,
      environment: DWOLLA_ENV,
      tokenExists: !!DWOLLA_TOKEN,
      keyExists: !!DWOLLA_KEY,
      secretExists: !!DWOLLA_SECRET,
      apiTest: testResponse.status
    })

  } catch (error) {
    return NextResponse.json({
      configured: false,
      error: error instanceof Error ? error.message : "Unknown error"
    }, { status: 500 })
  }
}