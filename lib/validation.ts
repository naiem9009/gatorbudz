export function validateEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

export function validatePassword(password: string): { valid: boolean; errors: string[] } {
  const errors: string[] = []

  if (password.length < 8) {
    errors.push("Password must be at least 8 characters")
  }
  if (!/[A-Z]/.test(password)) {
    errors.push("Password must contain at least one uppercase letter")
  }
  if (!/[a-z]/.test(password)) {
    errors.push("Password must contain at least one lowercase letter")
  }
  if (!/[0-9]/.test(password)) {
    errors.push("Password must contain at least one number")
  }

  return {
    valid: errors.length === 0,
    errors,
  }
}

export function validatePhone(phone: string): boolean {
  const phoneRegex = /^[\d\s\-+$$$$]+$/
  return phoneRegex.test(phone) && phone.replace(/\D/g, "").length >= 10
}

export function validateCompanyName(company: string): boolean {
  return company.trim().length >= 2 && company.trim().length <= 100
}

export function validateOrderItems(items: Array<{ productId: string; quantity: number }>): {
  valid: boolean
  errors: string[]
} {
  const errors: string[] = []

  if (!Array.isArray(items) || items.length === 0) {
    errors.push("Order must contain at least one item")
  }

  items.forEach((item, index) => {
    if (!item.productId) {
      errors.push(`Item ${index + 1}: Missing product ID`)
    }
    if (!item.quantity || item.quantity <= 0) {
      errors.push(`Item ${index + 1}: Quantity must be greater than 0`)
    }
  })

  return {
    valid: errors.length === 0,
    errors,
  }
}
