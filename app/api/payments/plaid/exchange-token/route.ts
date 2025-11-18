import { type NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { PrismaClient } from "@prisma/client"

const prisma = new PrismaClient()

const PLAID_CLIENT_ID = process.env.PLAID_CLIENT_ID
const PLAID_SECRET = process.env.PLAID_SECRET
const PLAID_ENV = process.env.PLAID_ENV || "sandbox"
const DWOLLA_ENV = process.env.DWOLLA_ENV || "sandbox"
const DWOLLA_TOKEN = process.env.DWOLLA_TOKEN

// Helper function to get Dwolla auth token
async function getDwollaAuthToken() {
  if (DWOLLA_TOKEN) {
    return DWOLLA_TOKEN
  }

  const DWOLLA_KEY = process.env.DWOLLA_KEY
  const DWOLLA_SECRET = process.env.DWOLLA_SECRET

  if (DWOLLA_KEY && DWOLLA_SECRET) {
    try {
      const authString = Buffer.from(`${DWOLLA_KEY}:${DWOLLA_SECRET}`).toString("base64")
      const tokenResponse = await fetch(`https://${DWOLLA_ENV}.dwolla.com/token`, {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
          Authorization: `Basic ${authString}`,
        },
        body: "grant_type=client_credentials",
      })

      if (tokenResponse.ok) {
        const tokenData = await tokenResponse.json()
        return tokenData.access_token
      }
    } catch (error) {
      console.error("[Dwolla] Token generation failed:", error)
    }
  }

  return null
}

// Helper function to make Dwolla API calls with proper headers
async function makeDwollaRequest(url: string, options: RequestInit) {
  const dwollaAuthToken = await getDwollaAuthToken()

  const defaultHeaders = {
    Accept: "application/vnd.dwolla.v1.hal+json",
    "Content-Type": "application/vnd.dwolla.v1.hal+json",
    Authorization: `Bearer ${dwollaAuthToken}`,
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

// Helper function to get or create RECEIVER account (your platform)
async function getOrCreateReceiverAccount() {
  // Check if receiver account already exists in our database
  let receiverAccount = await prisma.businessAccount.findFirst({
    where: { status: "verified" },
  })

  if (!receiverAccount) {
    const baseUrl = DWOLLA_ENV === "production" ? "https://api.dwolla.com" : "https://api-sandbox.dwolla.com"

    try {
      // For SANDBOX: Create a personal verified customer as the receiver
      const receiverResponse = await makeDwollaRequest(`${baseUrl}/customers`, {
        method: "POST",
        body: JSON.stringify({
          firstName: "Gator",
          lastName: "Budz",
          email: "admin@gatorbudz.com",
          type: "personal",
          // Sandbox test data
          address1: "123 Main St",
          city: "New York",
          state: "NY",
          postalCode: "10001",
          dateOfBirth: "1990-01-01",
          ssn: "1234",
        }),
      })

      if (receiverResponse.ok) {
        const receiverDwollaId = receiverResponse.headers.get("location")?.split("/").pop()

        // Store receiver account in database
        receiverAccount = await prisma.businessAccount.create({
          data: {
            name: "Platform Receiver",
            dwollaId: receiverDwollaId!,
            email: "admin@gatorbudz.com",
            type: "personal",
            status: "verified",
            businessName: "Gator Budz",
            businessType: "platform",
            businessAddress: {
              address1: "123 Main St",
              city: "New York",
              state: "NY",
              postalCode: "10001",
            },
          },
        })

        console.log("[Dwolla] Receiver account created:", receiverDwollaId)
      } else {
        const errorText = await receiverResponse.text()
        console.error("[Dwolla] Receiver account creation failed:", errorText)

        try {
          const errorJson = JSON.parse(errorText)
          if (
            errorJson.code === "ValidationError" &&
            errorJson._embedded?.errors?.[0]?.code === "Duplicate" &&
            errorJson._embedded.errors[0]._links?.about?.href
          ) {
            // Extract the existing customer ID from the error link
            const existingCustomerUrl = errorJson._embedded.errors[0]._links.about.href
            const existingCustomerId = existingCustomerUrl.split("/").pop()

            console.log("[Dwolla] Found existing receiver account:", existingCustomerId)

            // Check if this existing customer is already in our database
            receiverAccount = await prisma.businessAccount.findFirst({
              where: { dwollaId: existingCustomerId },
            })

            if (!receiverAccount) {
              // Get the existing customer details from Dwolla
              const existingCustomerResponse = await makeDwollaRequest(`${baseUrl}/customers/${existingCustomerId}`, {
                method: "GET",
              })

              if (existingCustomerResponse.ok) {
                const customerData = await existingCustomerResponse.json()

                // Store the existing customer in our database
                receiverAccount = await prisma.businessAccount.create({
                  data: {
                    name:
                      customerData.firstName && customerData.lastName
                        ? `${customerData.firstName} ${customerData.lastName}`
                        : "Platform Receiver",
                    dwollaId: existingCustomerId,
                    email: customerData.email || "admin@gatorbudz.com",
                    type: customerData.type || "personal",
                    status: customerData.status || "verified",
                    businessName: "Gator Budz",
                    businessType: "platform",
                    businessAddress: {
                      address1: customerData.address1 || "123 Main St",
                      city: customerData.city || "New York",
                      state: customerData.state || "NY",
                      postalCode: customerData.postalCode || "10001",
                    },
                  },
                })

                console.log("[Dwolla] Stored existing receiver account in database:", existingCustomerId)
              } else {
                console.error("[Dwolla] Failed to fetch existing customer details")
              }
            } else {
              console.log("[Dwolla] Existing receiver account already in database:", existingCustomerId)
            }
          }
        } catch (parseError) {
          console.error("[Dwolla] Error parsing error response:", parseError)
        }

        if (!receiverAccount) {
          receiverAccount = await prisma.businessAccount.findFirst({
            where: { status: "verified" },
          })
        }

        if (!receiverAccount) {
          console.warn("[Dwolla] No receiver account found, creating minimal fallback")
          try {
            receiverAccount = await prisma.businessAccount.create({
              data: {
                name: "Platform Receiver",
                dwollaId: "fallback-receiver",
                email: "admin@gatorbudz.com",
                type: "personal",
                status: "verified",
                businessName: "Gator Budz",
                businessType: "platform",
                businessAddress: {
                  address1: "123 Main St",
                  city: "New York",
                  state: "NY",
                  postalCode: "10001",
                },
              },
            })
          } catch (createError) {
            console.warn("[Dwolla] Could not create fallback receiver account, continuing...")
          }
        }
      }
    } catch (error) {
      console.error("[Dwolla] Receiver account setup error:", error)
    }
  }

  return receiverAccount
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth.api.getSession({ headers: request.headers })

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { publicToken } = await request.json()

    if (!publicToken) {
      return NextResponse.json({ error: "Public token is required" }, { status: 400 })
    }

    if (!PLAID_CLIENT_ID || !PLAID_SECRET) {
      return NextResponse.json({ error: "Plaid credentials not configured" }, { status: 500 })
    }

    const dwollaAuthToken = await getDwollaAuthToken()
    if (!dwollaAuthToken) {
      console.warn("[Dwolla] Not configured - proceeding with Plaid account linking only")
      // Return early with basic account info without Dwolla setup
      return NextResponse.json({
        success: true,
        itemId: "demo",
        accountsLinked: 1,
        fundingSourcesCreated: 0,
        warning:
          "Dwolla credentials not configured. Add DWOLLA_TOKEN or DWOLLA_KEY + DWOLLA_SECRET to enable payments.",
        accounts: [
          {
            id: "demo_account",
            accountName: "Demo Bank Account",
            bankName: "Demo Bank",
            accountMask: "****0123",
            verificationStatus: "DEMO",
          },
        ],
        fundingSources: [],
      })
    }

    // Step 1: Ensure receiver account exists (for receiving payments)
    const receiverAccount = await getOrCreateReceiverAccount()

    // Step 2: Exchange public token for access token
    const exchangeResponse = await fetch(`https://${PLAID_ENV}.plaid.com/item/public_token/exchange`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        client_id: PLAID_CLIENT_ID,
        secret: PLAID_SECRET,
        public_token: publicToken,
      }),
    })

    const exchangeData = await exchangeResponse.json()

    if (!exchangeResponse.ok || exchangeData.error) {
      console.error("[Plaid] Token exchange failed:", exchangeData.error)
      return NextResponse.json(
        {
          error: exchangeData.error_message || "Token exchange failed",
        },
        { status: 400 },
      )
    }

    const accessToken = exchangeData.access_token
    const itemId = exchangeData.item_id

    // Step 3: Get account details
    const accountsResponse = await fetch(`https://${PLAID_ENV}.plaid.com/accounts/get`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        client_id: PLAID_CLIENT_ID,
        secret: PLAID_SECRET,
        access_token: accessToken,
      }),
    })

    const accountsData = await accountsResponse.json()

    if (!accountsResponse.ok || accountsData.error) {
      console.error("[Plaid] Accounts fetch failed:", accountsData.error)
      return NextResponse.json({ error: "Failed to get accounts" }, { status: 400 })
    }

    // Step 4: Get institution info
    const institutionResponse = await fetch(`https://${PLAID_ENV}.plaid.com/institutions/get_by_id`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        client_id: PLAID_CLIENT_ID,
        secret: PLAID_SECRET,
        institution_id: accountsData.item.institution_id,
        country_codes: ["US"],
      }),
    })

    const institutionData = await institutionResponse.json()
    const bankName = institutionData.institution?.name || "Bank"

    // Step 5: Check/create Dwolla customer (SENDER - unverified for sandbox)
    let dwollaCustomer = await prisma.dwollaCustomer.findUnique({
      where: { userId: session.user.id },
    })

    const baseUrl = DWOLLA_ENV === "production" ? "https://api.dwolla.com" : "https://api-sandbox.dwolla.com"

    if (!dwollaCustomer) {
      try {
        // For SANDBOX: Use unverified customer (no SSN/address required)
        const customerResponse = await makeDwollaRequest(`${baseUrl}/customers`, {
          method: "POST",
          body: JSON.stringify({
            firstName: session.user.name?.split(" ")[0] || "Customer",
            lastName: session.user.name?.split(" ").slice(1).join(" ") || "User",
            email: session.user.email,
            type: "unverified",
          }),
        })

        if (customerResponse.ok) {
          const dwollaId = customerResponse.headers.get("location")?.split("/").pop()

          if (!dwollaId) {
            return NextResponse.json(
              {
                error: "Failed to create payment account",
              },
              { status: 500 },
            )
          }

          // Store Dwolla customer in database
          dwollaCustomer = await prisma.dwollaCustomer.create({
            data: {
              userId: session.user.id,
              dwollaId,
              email: session.user.email,
              firstName: session.user.name?.split(" ")[0] || "Customer",
              lastName: session.user.name?.split(" ").slice(1).join(" ") || "User",
              status: "unverified",
            },
          })

          console.log("[Dwolla] Unverified customer created:", dwollaId)
        } else {
          const errorText = await customerResponse.text()
          console.error("[Dwolla] Customer creation failed:", errorText)

          try {
            const errorJson = JSON.parse(errorText)
            if (
              errorJson.code === "ValidationError" &&
              errorJson._embedded?.errors?.[0]?.code === "Duplicate" &&
              errorJson._embedded.errors[0]._links?.about?.href
            ) {
              const existingCustomerUrl = errorJson._embedded.errors[0]._links.about.href
              const existingCustomerId = existingCustomerUrl.split("/").pop()

              console.log("[v0] Duplicate customer found:", existingCustomerId)
              console.log("[v0] Current user ID:", session.user.id)

              // Check if this existing customer is already in our database
              dwollaCustomer = await prisma.dwollaCustomer.findFirst({
                where: {
                  OR: [{ dwollaId: existingCustomerId }, { email: session.user.email }],
                },
              })

              if (!dwollaCustomer) {
                console.log("[v0] Customer not in DB, fetching from Dwolla")
                // Get the existing customer details from Dwolla
                const existingCustomerResponse = await makeDwollaRequest(`${baseUrl}/customers/${existingCustomerId}`, {
                  method: "GET",
                })

                if (existingCustomerResponse.ok) {
                  const customerData = await existingCustomerResponse.json()

                  console.log("[v0] Creating DB record for existing customer")
                  // Store the existing customer in our database
                  dwollaCustomer = await prisma.dwollaCustomer.create({
                    data: {
                      userId: session.user.id,
                      dwollaId: existingCustomerId,
                      email: customerData.email || session.user.email,
                      firstName: customerData.firstName || session.user.name?.split(" ")[0] || "Customer",
                      lastName: customerData.lastName || session.user.name?.split(" ").slice(1).join(" ") || "User",
                      status: customerData.status || "unverified",
                    },
                  })

                  console.log("[Dwolla] Stored existing customer in database:", existingCustomerId)
                } else {
                  console.error("[Dwolla] Failed to fetch existing customer details")
                  return NextResponse.json(
                    {
                      error: "Failed to retrieve existing payment account. Please try again.",
                    },
                    { status: 500 },
                  )
                }
              } else {
                console.log("[v0] Customer already in DB, updating user ID if needed")
                // Update the customer record with current user ID if needed
                if (dwollaCustomer.userId !== session.user.id) {
                  dwollaCustomer = await prisma.dwollaCustomer.update({
                    where: { id: dwollaCustomer.id },
                    data: { userId: session.user.id },
                  })
                }
              }
            } else {
              console.error("[Dwolla] Unexpected error code:", errorJson.code)
              // Some other validation error
              return NextResponse.json(
                {
                  error: "Failed to create payment account. Please try again.",
                },
                { status: 500 },
              )
            }
          } catch (parseError) {
            console.error("[Dwolla] Error parsing duplicate error:", parseError)
            return NextResponse.json(
              {
                error: "Failed to create payment account. Please try again.",
              },
              { status: 500 },
            )
          }
        }
      } catch (error) {
        console.error("[Dwolla] Customer setup failed:", error)
        return NextResponse.json(
          {
            error: "Failed to setup payment account. Please try again.",
          },
          { status: 500 },
        )
      }
    }

    // If we still don't have a dwollaCustomer at this point, return error
    if (!dwollaCustomer) {
      return NextResponse.json(
        {
          error: "Failed to setup payment account. Please try again.",
        },
        { status: 500 },
      )
    }

    // Step 6: Process bank accounts and create funding sources
    const linkedAccounts = []
    const createdFundingSources = []

    for (const account of accountsData.accounts) {
      if (account.subtype === "checking" || account.subtype === "savings") {
        try {
          // This links the Plaid account to the Dwolla customer via processor token
          const plaidAccount = await prisma.plaidAccount.upsert({
            where: {
              userId_accountId: {
                userId: session.user.id,
                accountId: account.account_id,
              },
            },
            create: {
              userId: session.user.id,
              accountId: account.account_id,
              accessToken,
              bankName,
              accountName: account.name,
              accountMask: account.mask || "****",
              accountSubtype: account.subtype,
              verificationStatus: "PENDING",
            },
            update: {
              accessToken,
              bankName,
              accountName: account.name,
              accountMask: account.mask || "****",
            },
          })

          linkedAccounts.push(plaidAccount)

          console.log(`[Plaid] Creating processor token for account ${account.account_id} (${account.name})`)

          // Processor token allows Dwolla to access bank account via Plaid without storing credentials
          const processorTokenResponse = await fetch(
            `https://${PLAID_ENV}.plaid.com/processor/dwolla/processor_token/create`,
            {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                client_id: PLAID_CLIENT_ID,
                secret: PLAID_SECRET,
                access_token: accessToken,
                account_id: account.account_id,
              }),
            },
          )

          console.log(`[Plaid] Processor token response status: ${processorTokenResponse.status}`)

          const processorTokenText = await processorTokenResponse.text()
          console.log(`[Plaid] Processor token raw response: ${processorTokenText}`)

          if (!processorTokenResponse.ok) {
            try {
              const errorData = JSON.parse(processorTokenText)
              console.error(
                `[Plaid] Processor token failed for account ${account.account_id}:`,
                JSON.stringify(errorData, null, 2),
              )
            } catch {
              console.error(`[Plaid] Processor token failed for account ${account.account_id}: ${processorTokenText}`)
            }
            continue
          }

          let processorTokenData
          try {
            processorTokenData = JSON.parse(processorTokenText)
          } catch (parseError) {
            console.error(`[Plaid] Failed to parse processor token response:`, parseError)
            continue
          }

          const processorToken = processorTokenData.processor_token

          if (!processorToken) {
            console.error(`[Plaid] No processor token in response`, processorTokenData)
            continue
          }

          console.log(`[Plaid] Processor token created successfully`)

          // This creates a verified funding source in Dwolla for ACH payments
          const fundingSourceResponse = await makeDwollaRequest(
            `${baseUrl}/customers/${dwollaCustomer.dwollaId}/funding-sources`,
            {
              method: "POST",
              body: JSON.stringify({
                plaidToken: processorToken,
                name: `${account.name} - ${account.mask}`,
              }),
            },
          )

          if (fundingSourceResponse.ok) {
            const fundingSourceLocation = fundingSourceResponse.headers.get("location")
            const fundingSourceId = fundingSourceLocation?.split("/").pop()

            if (fundingSourceId) {
              // The funding source is immediately verified through Plaid processor token
              const fundingSource = await prisma.dwollaFundingSource.create({
                data: {
                  userId: session.user.id,
                  dwollaId: fundingSourceId,
                  dwollaCustomerId: dwollaCustomer.dwollaId,
                  bankName,
                  accountName: account.name,
                  accountMask: account.mask || "****",
                  bankAccountType: account.subtype === "savings" ? "savings" : "checking",
                  verified: true, // Set to true as processor token is pre-verified
                  removed: false,
                },
              })

              createdFundingSources.push(fundingSource)
              console.log(`[Dwolla] Funding source created and verified: ${fundingSourceId}`)
            }
          } else {
            const errorText = await fundingSourceResponse.text()
            console.error(`[Dwolla] Funding source creation failed:`, errorText)
          }
        } catch (error) {
          console.error(`[Processing] Error processing account ${account.account_id}:`, error)
          continue
        }
      }
    }

    // Step 7: Return success response
    return NextResponse.json({
      success: true,
      itemId,
      accountsLinked: linkedAccounts.length,
      fundingSourcesCreated: createdFundingSources.length,
      receiverAccountId: receiverAccount.dwollaId,
      accounts: linkedAccounts.map((account) => ({
        id: account.id,
        accountName: account.accountName,
        bankName: account.bankName,
        accountMask: account.accountMask,
        verificationStatus: account.verificationStatus,
      })),
      fundingSources: createdFundingSources.map((source) => ({
        id: source.id,
        accountName: source.accountName,
        bankName: source.bankName,
        accountMask: source.accountMask,
        verified: source.verified,
      })),
    })
  } catch (error) {
    console.error("[API] Token exchange error:", error)
    return NextResponse.json(
      {
        error: "Internal server error. Please try again.",
      },
      { status: 500 },
    )
  }
}
