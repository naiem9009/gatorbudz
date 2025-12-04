// middleware.ts
import { NextResponse, type NextRequest } from "next/server"
import { auth } from "./lib/auth"

type Role = "PUBLIC" | "VERIFIED" | "MANAGER" | "ADMIN"

const PUBLIC_ROUTES = ["/", "/login", "/register", "/about", "/contact"];
const AUTH_ROUTES = ["/login", "/register"];

// Skip auth for these API routes (webhooks)
const UNAUTH_API_ROUTES = ["/api/webhooks"];

const RULES: Array<{ prefix: string; allowed: Role[]; redirect: string; withNext?: boolean }> = [
  { prefix: "/dashboard", allowed: ["VERIFIED", "MANAGER", "ADMIN"], redirect: "/login", withNext: true },
  { prefix: "/manager",   allowed: ["MANAGER", "ADMIN"],             redirect: "/" },
  { prefix: "/admin",     allowed: ["ADMIN"],                        redirect: "/" },
  { prefix: "/admin-dashboard", allowed: ["ADMIN"],                  redirect: "/" },
  { prefix: "/profile",   allowed: ["VERIFIED", "MANAGER", "ADMIN"], redirect: "/login", withNext: true },
]

function normalize(pathname: string) {
  const p = pathname.replace(/\/+$/, "")
  return p.length ? p : "/"
}

function redirectWithNext(req: NextRequest, to: string) {
  const next = encodeURIComponent(req.nextUrl.pathname + (req.nextUrl.search || ""))
  return NextResponse.redirect(new URL(`${to}?next=${next}`, req.url))
}

export async function middleware(request: NextRequest) {
  const pathname = normalize(request.nextUrl.pathname)

  // Skip middleware for API routes that do not require auth, static files, and Next.js internals
  if (
    pathname.startsWith('/api/') && UNAUTH_API_ROUTES.some(route => pathname.startsWith(route)) ||
    pathname.startsWith('/_next/') ||
    pathname.includes('.')
  ) {
    return NextResponse.next()
  }

  let user: { role?: Role } | null = null
  try {
    const session = await auth.api.getSession({
      headers: {
        cookie: request.headers.get("cookie") || ""
      }
    })
    user = session?.user ? { role: (session.user as any).role } : null
  } catch (error) {
    console.log('Auth error:', error)
    user = null
  }

  const role: Role = (user?.role as Role) ?? "PUBLIC"

  // Redirect authenticated users away from auth pages
  if (user && AUTH_ROUTES.includes(pathname)) {
    return NextResponse.redirect(new URL('/dashboard', request.url))
  }

  // Check route rules
  for (const rule of RULES) {
    if (pathname.startsWith(rule.prefix)) {
      if (!user) {
        return rule.withNext
          ? redirectWithNext(request, rule.redirect)
          : NextResponse.redirect(new URL(rule.redirect, request.url))
      }
      
      if (!rule.allowed.includes(role)) {
        return NextResponse.redirect(new URL("/", request.url))
      }
      break
    }
  }

  return NextResponse.next()
}

export const runtime = 'nodejs'

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|robots.txt|sitemap.xml).*)",
  ],
}
