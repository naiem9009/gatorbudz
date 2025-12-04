// lib/zoho-sync.ts
import { prisma } from "@/lib/db"

const ZOHO_WEBHOOK_TO_SEND_DATA_URL = process.env.ZOHO_WEBHOOK_TO_SEND_DATA!

// Function to sync single product TO Zoho
export async function syncProductToZoho(productId: string) {
  try {
    // Fetch the product with variants
    const product = await prisma.product.findUnique({
      where: { id: productId },
      include: {
        variants: true
      }
    })
    
    if (!product) {
      throw new Error(`Product with ID ${productId} not found`)
    }

    // Send each variant to Zoho
    const syncPromises = product.variants.map(async (variant) => {
      // Map category back to sheet format
      const reverseCategoryMap: Record<string, string> = {
        'FRESH_DEPS': 'FRESH DEPS',
        'SUPER_EXOTICS': 'SUPER EXOTICS',
        'PREMIUM_EXOTICS': 'PREMIUM EXOTICS',
        'EXOTICS': 'EXOTICS',
        'LIVING_SOIL': 'LIVING SOIL',
        'COMMERCIAL_INDOORS': 'COMMERCIAL INDOORS',
        'DEPS': 'DEPS',
      }
      
      const categoryForSheet = reverseCategoryMap[product.category] || product.category
      
      // Map strain from subcategory
      const reverseStrainMap: Record<string, string> = {
        'GLADES': 'GLADES',
        'CYPRESS': 'CYPRESS',
        'SEAGLASS': 'SEAGLASS',
        'SANDBAR': 'SANDBAR',
      }
      
      const strain = Object.keys(reverseStrainMap).find(
        key => reverseStrainMap[key] === variant.subcategory
      ) || variant.subcategory

      const payload = {
        // Database IDs for Zoho to store
        productId: product.id,
        variantId: variant.id,
        
        // Product data
        productName: product.name,
        category: categoryForSheet,
        strain: strain,
        gold: variant.priceGold?.toString() || '',
        diamond: variant.priceDiamond?.toString() || '',
        platinum: variant.pricePlatinum?.toString() || '',
        minimumOrder: product.minimumQty.toString(),
        status: product.status === 'ACTIVE' ? 'true' : 'false',
        productVideoURL: product.videoUrl || '',
        description: product.description || '',
        
        // Metadata
        syncType: 'FROM_WEBSITE',
        syncTimestamp: new Date().toISOString(),
      }

      // Send to Zoho
      const response = await fetch(ZOHO_WEBHOOK_TO_SEND_DATA_URL, {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "X-Sync-Source": "website"
        },
        body: JSON.stringify(payload),
      })
      
      if (!response.ok) {
        const errorText = await response.text()
        console.error(`Failed to sync variant ${variant.id}:`, errorText)
        throw new Error(`Zoho sync failed: ${errorText}`)
      }
      
      console.log(`Synced variant ${variant.id} to Zoho`)
      return response.json()
    })
    
    await Promise.all(syncPromises)
    
    return { 
      success: true, 
      message: `Synced product ${productId} with ${product.variants.length} variants to Zoho` 
    }
    
  } catch (error) {
    console.error("Error syncing product to Zoho:", error)
    throw error
  }
}

// Function to delete product from Zoho
export async function deleteProductFromZoho(productId: string) {
  try {
    const payload = {
      productId: productId,
      action: 'DELETE',
      syncType: 'FROM_WEBSITE',
      syncTimestamp: new Date().toISOString(),
    }
    
    const response = await fetch(ZOHO_WEBHOOK_TO_SEND_DATA_URL, {
      method: "POST",
      headers: { 
        "Content-Type": "application/json",
        "X-Sync-Source": "website"
      },
      body: JSON.stringify(payload),
    })
    
    if (!response.ok) {
      const errorText = await response.text()
      console.error(`Failed to delete product ${productId} from Zoho:`, errorText)
      return { success: false, error: errorText }
    }
    
    return { success: true, message: "Delete request sent to Zoho" }
    
  } catch (error) {
    console.error("Error deleting product from Zoho:", error)
    throw error
  }
}

// Function to sync variant status changes
export async function syncVariantStatusToZoho(variantId: string, isActive: boolean) {
  try {
    const variant = await prisma.productVariant.findUnique({
      where: { id: variantId },
      include: { product: true }
    })
    
    if (!variant) {
      throw new Error(`Variant ${variantId} not found`)
    }
    
    const payload = {
      productId: variant.productId,
      variantId: variant.id,
      status: isActive ? 'true' : 'false',
      syncType: 'STATUS_UPDATE',
      syncTimestamp: new Date().toISOString(),
    }
    
    const response = await fetch(ZOHO_WEBHOOK_TO_SEND_DATA_URL, {
      method: "POST",
      headers: { 
        "Content-Type": "application/json",
        "X-Sync-Source": "website"
      },
      body: JSON.stringify(payload),
    })
    
    if (!response.ok) {
      throw new Error(`Failed to sync variant status: ${await response.text()}`)
    }
    
    return { success: true }
    
  } catch (error) {
    console.error("Error syncing variant status to Zoho:", error)
    throw error
  }
}