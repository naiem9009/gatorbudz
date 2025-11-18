import { InvoiceStatus } from '@prisma/client';
import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}



export function generateInvoiceNumber() {
  const prefix = "GBINV";
  const datePart = new Date().toISOString().slice(2, 10).replace(/-/g, ''); 
  const randomPart = Math.random().toString(36).substr(2, 4).toUpperCase(); 
  return `${prefix}-${datePart}-${randomPart}`;
}


export function calculateInvoiceStatus(dueDate: Date, currentStatus: InvoiceStatus): InvoiceStatus {
  if (currentStatus === InvoiceStatus.PAID || currentStatus === InvoiceStatus.CANCELLED) {
    return currentStatus
  }
  
  const now = new Date()
  if (now > dueDate && currentStatus === InvoiceStatus.PENDING) {
    return InvoiceStatus.OVERDUE
  }
  
  return currentStatus
}


export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(amount)
}



type SlugOptions = {
  separator?: string;
  fallback?: string;
};

export function generateProductSlug(
  value: string,
  options: SlugOptions = {}
): string {
  const { separator = "-", fallback = "item" } = options;

  if (!value) return fallback;

  let slug = value
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "");

  slug = slug.toLowerCase();

  slug = slug.replace(/[^a-z0-9]+/g, separator);

  const sepEscaped = separator.replace(/[-/\\^$*+?.()|[\]{}]/g, "\\$&");
  slug = slug.replace(new RegExp(`${sepEscaped}{2,}`, "g"), separator);

  slug = slug.replace(new RegExp(`^${sepEscaped}|${sepEscaped}$`, "g"), "");

  return slug || fallback;
}



export function getCategory(category: string) {
  switch (category) {
    case "SUPER_EXOTICS":
      return "Super Exotics";
    case "PREMIUM_EXOTICS":
      return "Premium Exotics";
    case "EXOTICS":
      return "Exotics";
    case "LIVING_SOIL":
      return "Living Soil";
    case "COMMERCIAL_INDOORS":
      return "Ccommerical Indoors";
    case "FRESH_DEPS":
      return "Fresh Deps";
    case "SUPER_EXOTICS":
      return "Super Exotics";
    case "DEPS":
      return "Deps";
    default:
      return "ALL";
  }
}



export function generateOrderNumber() {
  const prefix = "GBORD";
  const datePart = new Date().toISOString().slice(2, 10).replace(/-/g, ''); 
  const randomPart = Math.random().toString(36).substr(2, 4).toUpperCase(); 
  return `${prefix}-${datePart}-${randomPart}`;
}
