// import { type NextRequest, NextResponse } from "next/server"
// import { auth } from "@/lib/auth"
// import { PrismaClient } from "@prisma/client"

// const prisma = new PrismaClient()

// async function getDwollaToken() {
//   const DWOLLA_TOKEN = process.env.DWOLLA_TOKEN
//   const DWOLLA_KEY = process.env.DWOLLA_KEY
//   const DWOLLA_SECRET = process.env.DWOLLA_SECRET
//   const DWOLLA_ENV = process.env.DWOLLA_ENV || "sandbox"

//   if (!DWOLLA_TOKEN && (!DWOLLA_KEY || !DWOLLA_SECRET)) {
//     throw new Error(
//       "Dwolla credentials not configured. Add DWOLLA_KEY and DWOLLA_SECRET to your environment variables in the Vars section.",
//     )
//   }

//   if (DWOLLA_TOKEN) {
//     return DWOLLA_TOKEN
//   }

//   const authString = Buffer.from(`${DWOLLA_KEY}:${DWOLLA_SECRET}`).toString("base64")
//   const response = await fetch(`https://${DWOLLA_ENV === "production" ? "api" : "api-sandbox"}.dwolla.com/token`, {
//     method: "POST",
//     headers: {
//       "Content-Type": "application/x-www-form-urlencoded",
//       Authorization: `Basic ${authString}`,
//     },
//     body: "grant_type=client_credentials",
//   })

//   if (!response.ok) {
//     throw new Error("Failed to generate Dwolla token")
//   }

//   const data = await response.json()
//   return data.access_token
// }

// async function makeDwollaRequest(url: string, options: RequestInit) {
//   let token
//   try {
//     token = await getDwollaToken()
//   } catch (error) {
//     throw new Error(`Dwolla authentication failed: ${error instanceof Error ? error.message : "Unknown error"}`)
//   }

//   const defaultHeaders = {
//     Accept: "application/vnd.dwolla.v1.hal+json",
//     "Content-Type": "application/vnd.dwolla.v1.hal+json",
//     Authorization: `Bearer ${token}`,
//   }

//   const response = await fetch(url, {
//     ...options,
//     headers: {
//       ...defaultHeaders,
//       ...options.headers,
//     },
//   })

//   return response
// }

// export async function POST(request: NextRequest) {
//   try {
//     const session = await auth.api.getSession({ headers: request.headers })

//     if (!session) {
//       return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
//     }

//     const { invoiceId, fundingSourceId, amount } = await request.json()

//     console.log("[Transfer] Starting payment:", {
//       userId: session.user.id,
//       invoiceId,
//       fundingSourceId,
//       amount,
//     })

//     // Get invoice and verify ownership
//     const invoice = await prisma.invoice.findFirst({
//       where: {
//         id: invoiceId,
//         userId: session.user.id,
//       },
//     })

//     if (!invoice) {
//       console.log("[Transfer] Invoice not found:", invoiceId)
//       return NextResponse.json({ error: "Invoice not found" }, { status: 404 })
//     }

//     // Get user's funding source
//     const fundingSource = await prisma.dwollaFundingSource.findFirst({
//       where: {
//         userId: session.user.id,
//         id: fundingSourceId, // Added explicit ID match for clarity
//         verified: true, // Only look for verified funding sources
//         removed: false, // Exclude removed funding sources
//       },
//     })

//     console.log("[Transfer] Funding source lookup:", {
//       fundingSourceId,
//       userId: session.user.id,
//       found: !!fundingSource,
//       fundingSource: fundingSource
//         ? {
//             id: fundingSource.id,
//             dwollaId: fundingSource.dwollaId,
//             accountName: fundingSource.accountName,
//             verified: fundingSource.verified,
//           }
//         : null,
//     })

//     // Get business account (where money will be sent TO)
//     const businessAccount = await prisma.businessAccount.findFirst({
//       where: { status: "verified" },
//     })

//     console.log("[Transfer] Business account lookup:", {
//       found: !!businessAccount,
//       businessAccount,
//     })

//     if (!fundingSource) {
//       return NextResponse.json(
//         {
//           error: "Payment method not found. Please link a bank account first.",
//         },
//         { status: 404 },
//       )
//     }

//     if (!businessAccount) {
//       return NextResponse.json(
//         {
//           error: "Payment system not configured. Please contact support.",
//         },
//         { status: 500 },
//       )
//     }

//     let businessFundingSource = await prisma.dwollaFundingSource.findFirst({
//       where: {
//         dwollaCustomerId: businessAccount.dwollaId,
//         removed: false,
//       },
//     })

//     // If business doesn't have a funding source yet, we need to fetch it from Dwolla
//     if (!businessFundingSource) {
//       // Fetch the business's funding sources from Dwolla
//       const baseUrl =
//         process.env.DWOLLA_ENV === "production" ? "https://api.dwolla.com" : "https://api-sandbox.dwolla.com"

//       let token
//       try {
//         token = await getDwollaToken()
//       } catch (error) {
//         console.error("[Transfer] Failed to get token for funding source lookup:", error)
//         return NextResponse.json(
//           {
//             error: "Payment system error. Please contact support.",
//           },
//           { status: 500 },
//         )
//       }

//       const fundingSourcesResponse = await fetch(`${baseUrl}/customers/${businessAccount.dwollaId}/funding-sources`, {
//         headers: {
//           Accept: "application/vnd.dwolla.v1.hal+json",
//           Authorization: `Bearer ${token}`,
//         },
//       })

//       if (fundingSourcesResponse.ok) {
//         const fundingSourcesData = await fundingSourcesResponse.json()
//         const sources = fundingSourcesData._embedded?.["funding-sources"] || []

//         // Find the first verified bank funding source (not balance)
//         const bankSource = sources.find((source: any) => source.type === "bank" && source.status === "verified")

//         if (bankSource) {
//           const sourceId = bankSource._links?.self?.href?.split("/").pop()
//           if (sourceId) {
//             // Store in database for future use
//             businessFundingSource = await prisma.dwollaFundingSource.create({
//               data: {
//                 dwollaId: sourceId,
//                 dwollaCustomerId: businessAccount.dwollaId,
//                 bankName: bankSource.bankName || "Business Bank",
//                 accountName: bankSource.name || "Business Account",
//                 accountMask: bankSource.bankAccountNumber?.slice(-4) || "****",
//                 bankAccountType: "checking",
//                 verified: true,
//                 userId: null as any, // Business account, no user
//               },
//             })
//           }
//         }
//       }
//     }

//     if (!businessFundingSource) {
//       console.error("[Transfer] No verified funding source found for business account")
//       return NextResponse.json(
//         {
//           error: "Business payment account not configured. Please contact support.",
//         },
//         { status: 500 },
//       )
//     }

//     console.log("[Transfer] Using business funding source:", {
//       id: businessFundingSource.id,
//       dwollaId: businessFundingSource.dwollaId,
//       accountName: businessFundingSource.accountName,
//     })

//     const baseUrl =
//       process.env.DWOLLA_ENV === "production" ? "https://api.dwolla.com" : "https://api-sandbox.dwolla.com"

//     console.log("[Transfer] Creating transfer:", {
//       source: fundingSource.dwollaId,
//       destination: businessFundingSource.dwollaId,
//       amount,
//     })

//     // This creates a transfer from customer's verified bank account (via Plaid processor token) to business
//     const transferResponse = await makeDwollaRequest(`${baseUrl}/transfers`, {
//       method: "POST",
//       body: JSON.stringify({
//         _links: {
//           source: {
//             href: `${baseUrl}/funding-sources/${fundingSource.dwollaId}`,
//           },
//           destination: {
//             href: `${baseUrl}/funding-sources/${businessFundingSource.dwollaId}`,
//           },
//         },
//         amount: {
//           value: amount.toString(),
//           currency: "USD",
//         },
//       }),
//     })

//     if (!transferResponse.ok) {
//       const errorText = await transferResponse.text()
//       console.error("[Dwolla] Transfer failed:", {
//         status: transferResponse.status,
//         error: errorText,
//       })
//       return NextResponse.json(
//         {
//           error: "Payment failed. Please try again.",
//         },
//         { status: 500 },
//       )
//     }

//     const transferLocation = transferResponse.headers.get("location")
//     const transferId = transferLocation?.split("/").pop()

//     console.log("[Transfer] Transfer created successfully:", transferId)

//     // Update invoice as paid
//     await prisma.invoice.update({
//       where: { id: invoiceId },
//       data: {
//         status: "PAID",
//         paidAt: new Date(),
//         paymentMethod: "DWOLLA",
//         dwollaTransferId: transferId,
//         dwollaFundingSourceId: fundingSourceId,
//         businessAccountId: businessAccount.id,
//       },
//     })

//     // Create payment record
//     await prisma.payment.create({
//       data: {
//         invoiceId: invoiceId,
//         amount: amount,
//         method: "DWOLLA",
//         status: "COMPLETED",
//         dwollaTransferId: transferId,
//         paidAt: new Date(),
//       },
//     })

//     return NextResponse.json({
//       success: true,
//       transferId: transferId,
//       message: "Payment completed successfully",
//     })
//   } catch (error) {
//     console.error("[API] Transfer error:", error)
//     return NextResponse.json(
//       {
//         error: "Internal server error. Please try again.",
//       },
//       { status: 500 },
//     )
//   }
// }



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
    throw new Error("Failed to generate Dwolla token")
  }

  const data = await response.json()
  return data.access_token
}

async function makeDwollaRequest(url: string, options: RequestInit) {
  let token
  try {
    token = await getDwollaToken()
  } catch (error) {
    throw new Error(`Dwolla authentication failed: ${error instanceof Error ? error.message : "Unknown error"}`)
  }

  const defaultHeaders = {
    Accept: "application/vnd.dwolla.v1.hal+json",
    "Content-Type": "application/vnd.dwolla.v1.hal+json",
    Authorization: `Bearer ${token}`,
  }

  const response = await fetch(url, {
    ...options,
    headers: {
      ...defaultHeaders,
      ...options.headers,
    },
  })

  return response
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth.api.getSession({ headers: request.headers })

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { invoiceId, fundingSourceId, amount } = await request.json()

    console.log("[Transfer] Starting payment:", {
      userId: session.user.id,
      invoiceId,
      fundingSourceId,
      amount,
    })

    // Get invoice and verify ownership
    const invoice = await prisma.invoice.findFirst({
      where: {
        id: invoiceId,
        userId: session.user.id,
      },
    })

    if (!invoice) {
      console.log("[Transfer] Invoice not found:", invoiceId)
      return NextResponse.json({ error: "Invoice not found" }, { status: 404 })
    }

    // Get user's funding source
    const fundingSource = await prisma.dwollaFundingSource.findFirst({
      where: {
        userId: session.user.id,
        id: fundingSourceId, // Added explicit ID match for clarity
        verified: true, // Only look for verified funding sources
        removed: false, // Exclude removed funding sources
      },
    })

    console.log("[Transfer] Funding source lookup:", {
      fundingSourceId,
      userId: session.user.id,
      found: !!fundingSource,
      fundingSource: fundingSource
        ? {
            id: fundingSource.id,
            dwollaId: fundingSource.dwollaId,
            accountName: fundingSource.accountName,
            verified: fundingSource.verified,
          }
        : null,
    })

    if (!fundingSource) {
      return NextResponse.json(
        {
          error: "Payment method not found. Please link a bank account first.",
        },
        { status: 404 },
      )
    }

    const receivingFundingSourceUrl = process.env.DWOLLA_RECEIVING_FUNDING_SOURCE_URL

    if (!receivingFundingSourceUrl) {
      return NextResponse.json(
        {
          error: "Payment system not configured. Please add DWOLLA_RECEIVING_FUNDING_SOURCE_URL to Vars section.",
        },
        { status: 500 },
      )
    }

    const baseUrl =
      process.env.DWOLLA_ENV === "production" ? "https://api.dwolla.com" : "https://api-sandbox.dwolla.com"

    console.log("[Transfer] Creating transfer:", {
      source: fundingSource.dwollaId,
      destination: receivingFundingSourceUrl,
      amount,
    })

    // Create transfer from customer's funding source to your verified funding source
    const transferResponse = await makeDwollaRequest(`${baseUrl}/transfers`, {
      method: "POST",
      body: JSON.stringify({
        _links: {
          source: {
            href: `${baseUrl}/funding-sources/${fundingSource.dwollaId}`,
          },
          destination: {
            href: receivingFundingSourceUrl,
          },
        },
        amount: {
          value: amount.toString(),
          currency: "USD",
        },
      }),
    })

    if (!transferResponse.ok) {
      const errorText = await transferResponse.text()
      console.error("[Dwolla] Transfer failed:", {
        status: transferResponse.status,
        error: errorText,
      })
      return NextResponse.json(
        {
          error: "Payment failed. Please try again.",
        },
        { status: 500 },
      )
    }

    const transferLocation = transferResponse.headers.get("location")
    const transferId = transferLocation?.split("/").pop()

    console.log("[Transfer] Transfer created successfully:", transferId)

    // Update invoice as paid
    await prisma.invoice.update({
      where: { id: invoiceId },
      data: {
        status: "PAID",
        paidAt: new Date(),
        paymentMethod: "DWOLLA",
        dwollaTransferId: transferId,
        dwollaFundingSourceId: fundingSourceId,
      },
    })

    // Create payment record
    await prisma.payment.create({
      data: {
        invoiceId: invoiceId,
        amount: amount,
        method: "DWOLLA",
        status: "COMPLETED",
        dwollaTransferId: transferId,
        paidAt: new Date(),
      },
    })

    return NextResponse.json({
      success: true,
      transferId: transferId,
      message: "Payment completed successfully",
    })
  } catch (error) {
    console.error("[API] Transfer error:", error)
    return NextResponse.json(
      {
        error: "Internal server error. Please try again.",
      },
      { status: 500 },
    )
  }
}
