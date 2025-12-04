import { PrismaClient, ProductCategory, ProductSubcategory } from '@prisma/client'
import { NextRequest, NextResponse } from 'next/server'
import { v4 as uuidv4 } from 'uuid'
import { generateProductSlug } from '@/lib/utils'

const prisma = new PrismaClient()

// Map category from sheet data to your enum
const mapCategory = (category: string): ProductCategory => {
  const categoryMap: Record<string, ProductCategory> = {
    'FRESH DEPS': 'FRESH_DEPS',
    'SUPER EXOTICS': 'SUPER_EXOTICS',
    'PREMIUM EXOTICS': 'PREMIUM_EXOTICS',
    'EXOTICS': 'EXOTICS',
    'LIVING SOIL': 'LIVING_SOIL',
    'COMMERCIAL INDOORS': 'COMMERCIAL_INDOORS',
    'DEPS': 'DEPS',
  }
  
  const upperCategory = category.trim().toUpperCase()
  return categoryMap[upperCategory] || 'EXOTICS'
}

// Map subcategory from strain
const mapSubcategory = (strain: string): ProductSubcategory => {
  const strainMap: Record<string, ProductSubcategory> = {
    'GLADES': 'GLADES',
    'CYPRESS': 'CYPRESS',
    'SEAGLASS': 'SEAGLASS',
    'SANDBAR': 'SANDBAR',
  }
  
  const upperStrain = strain.trim().toUpperCase()
  return strainMap[upperStrain] || 'GLADES'
}

// Map status
const mapStatus = (status: string): 'ACTIVE' | 'INACTIVE' => {
  return status?.toUpperCase() === 'TRUE' ? 'ACTIVE' : 'INACTIVE'
}

// Parse number from string (returns null if empty/invalid)
const parseNumber = (str: string | undefined): number | null => {
  if (!str || str.trim() === '') return null
  const num = parseFloat(str)
  return isNaN(num) ? null : num
}

// Find product by productId or by name and strain
const findProduct = async (productId: string | undefined, name: string, strain: string) => {
  // First try to find by productId if provided
  if (productId && productId.trim()) {
    const product = await prisma.product.findFirst({
      where: {
        productId: productId.trim(),
      },
      include: {
        variants: true
      }
    })
    
    if (product) {
      return { product, variant: null }
    }
  }
  
  // If no productId or not found by productId, try to find by name and strain
  const subcategory = strain ? mapSubcategory(strain) : 'GLADES'
  
  // Find products with same name (case-insensitive)
  const products = await prisma.product.findMany({
    where: {
      name: {
        equals: name,
        mode: 'insensitive',
      },
    },
    include: {
      variants: true
    }
  })

  // If strain provided, find matching variant
  if (strain && strain.trim()) {
    for (const product of products) {
      const matchingVariant = product.variants.find(v => 
        v.subcategory === subcategory
      )
      
      if (matchingVariant) {
        return { product, variant: matchingVariant }
      }
    }
  }

  // Return first product if no strain match
  return products.length > 0 ? { product: products[0], variant: null } : null
}

// Function to safely parse JSON with better error details
const safeParseJSON = async (request: NextRequest): Promise<any> => {
  try {
    const text = await request.text()
    
    // Log the raw text for debugging (truncate if too long)
    console.log('Raw request body (first 500 chars):', text.substring(0, 500))
    
    // Try to parse the JSON
    return JSON.parse(text)
  } catch (error) {
    console.error('Failed to parse JSON:', error)
    
    // Try to find the problematic character
    const text = await request.text()
    const position = (error as any).position || 0
    
    console.error('JSON parsing error details:')
    console.error('Error position:', position)
    console.error('Context around error:')
    
    // Show context around the error
    const start = Math.max(0, position - 50)
    const end = Math.min(text.length, position + 50)
    console.error('...' + text.substring(start, end) + '...')
    
    throw new Error(`Invalid JSON: ${error instanceof Error ? error.message : 'Unknown error'}`)
  }
}

export async function POST(request: NextRequest) {
  try {
    // Log request headers for debugging
    console.log('Request headers:', Object.fromEntries(request.headers.entries()))
    
    // Use safe JSON parsing
    const body = await safeParseJSON(request)
    
    console.log('Parsed body:', JSON.stringify(body, null, 2))

    // Simple validation - just ensure required fields exist
    if (!body.productName || !body.category) {
      return NextResponse.json(
        { 
          error: "productName and category are required",
          receivedBody: body 
        },
        { status: 400 }
      )
    }

    // Process the data
    const row_index = body.row_index.toString().trim()

    const productName = body.productName.toString().trim()
    const productId = body.productId?.toString().trim()
    const category = mapCategory(body.category.toString())
    const strain = body.strain?.toString().trim() || ''
    const subcategory = strain ? mapSubcategory(strain) : 'GLADES'
    
    // Parse numeric values
    const priceGold = parseNumber(body.gold)
    const priceDiamond = parseNumber(body.diamond)
    const pricePlatinum = parseNumber(body.platinum)
    const minimumQty = parseNumber(body.minimumOrder) || 10
    const status = mapStatus(body.status?.toString())
    const isDelete = body.isDelete;


    if (isDelete === "True") {
      const isExist = await prisma.product.findUnique(productId)

      if (isExist) {
        await prisma.product.delete(productId)
        return NextResponse.json({
          success: true,
          row_index,
        })
      }
    }
    
    // Find existing product by productId or name/strain
    const existing = await findProduct(productId, productName, strain)
    
    let product
    let operationType: 'CREATED' | 'UPDATED' = 'UPDATED'
    
    if (existing?.product) {
      // UPDATE EXISTING PRODUCT
      product = await prisma.product.update({
        where: { id: existing.product.id },
        data: {
          // Update productId if provided in the row (allows updating productId)
          productId: productId || existing.product.productId,
          name: productName,
          description: strain ? `Strain: ${strain}` : existing.product.description,
          videoUrl: body.productVideoURL?.toString() || existing.product.videoUrl,
          category: category,
          minimumQty: minimumQty,
          status: status,
          // Keep existing slug
          slug: existing.product.slug,
        },
        include: {
          variants: true
        }
      })

      // Handle variant update/create
      if (existing.variant) {
        // Update existing variant
        await prisma.productVariant.update({
          where: { id: existing.variant.id },
          data: {
            priceGold,
            priceDiamond,
            pricePlatinum,
          }
        })
      } else if (strain) {
        // Add new variant to existing product
        await prisma.productVariant.create({
          data: {
            subcategory,
            priceGold,
            priceDiamond,
            pricePlatinum,
            productId: product.id,
          }
        })
      }
      
    } else if (productId && productName && strain && priceGold) {
      // CREATE NEW PRODUCT
      operationType = 'CREATED'
      
      // Generate product slug
      let slug = generateProductSlug(productName)
      
      // Generate unique slug if needed
      const isExistingSlug = await prisma.product.findUnique({
        where: { slug }
      })
      if (isExistingSlug) {
        slug += `-${uuidv4().split('-')[1]}`
      }


      // Create variants array from the sheet data
      const variants = []
      if (strain) {
        variants.push({
          subcategory,
          priceGold,
          priceDiamond,
          pricePlatinum,
        })
      }

      // Create new product
      product = await prisma.product.create({
        data: {
          productId,
          name: productName,
          description: strain ? `Strain: ${strain}` : undefined,
          videoUrl: body.productVideoURL?.toString() || "",
          category: category,
          minimumQty: minimumQty,
          status: status,
          slug,
          variants: {
            create: variants
          }
        },
        include: {
          variants: true
        }
      })
    }

    if (!product) {
      return NextResponse.json(
        { 
          error: "Something went wrong",
          receivedBody: body 
        },
        { status: 400 }
      )
    }
    

    return NextResponse.json({
      success: true,
      message: operationType === 'UPDATED' ? "Product updated via sync" : "Product created via sync",
      operation: operationType,
      product: {
        id: product.id,
        productId: product.productId,
        name: product.name,
        slug: product.slug,
        category: product.category,
        variants: product.variants,
      }
    }, { status: operationType === 'UPDATED' ? 200 : 201 })

  } catch (error) {
    console.error("Error syncing product:", error)
    
    // Return specific error messages
    if (error instanceof Error && error.message.includes('Invalid JSON')) {
      return NextResponse.json(
        { 
          error: "Invalid JSON payload received",
          details: error.message
        },
        { status: 400 }
      )
    }
    
    // Handle duplicate errors (Prisma unique constraint P2002)
    // Narrow to any to safely read code/meta without TypeScript errors
    const errAny = error as any
    if (errAny && errAny.code === 'P2002') {
      const meta = errAny.meta as { target?: string[] } | undefined
      const targets = Array.isArray(meta?.target) ? meta!.target : undefined
      if (targets?.includes('productId')) {
        return NextResponse.json(
          { error: "Product with this productId already exists" },
          { status: 409 }
        )
      } else if (targets?.includes('slug')) {
        return NextResponse.json(
          { error: "Product with this slug already exists" },
          { status: 409 }
        )
      }
    }
    
    return NextResponse.json(
      { 
        error: "Failed to sync product",
        details: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    )
  }
}