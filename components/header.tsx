"use client"

import { useState } from "react"
import Link from "next/link"
import { Menu, X, LogOut, ShoppingCart, User, MonitorCog, LayoutDashboard } from "lucide-react"
import { useAuth } from "@/lib/auth-context"
import { useCart } from "@/lib/cart-context"
import Image from "next/image"

export default function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false)
  const { user, logout, isAuthenticated } = useAuth()
  const { cartCount } = useCart()

  const handleLogout = () => {
    logout()
    setIsUserMenuOpen(false)
    setIsMenuOpen(false)
  }
  
  

  return (
    <header className="sticky top-0 z-50 bg-background border-b border-border">
      <div className="max-w-7xl mx-auto px-4 md:px-8 py-3 md:py-4 flex items-center justify-between">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2" onClick={() => setIsMenuOpen(false)}>
          <Image src="/my-logo.png" alt="Gator Budz Logo" width={150} height={150} />
        </Link>

        {/* Desktop Auth & Cart Section */}
        <div className="hidden md:flex items-center gap-4">
          {isAuthenticated && user?.role !== "PUBLIC" && <Link href="/cart" className="relative p-2 text-foreground hover:text-accent transition">
            <ShoppingCart size={20} />
            {cartCount > 0 && (
              <span className="absolute -top-1 -right-1 bg-accent text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
                {cartCount}
              </span>
            )}
          </Link> }

          {user ? (
            <div className="relative">
              <button
                onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                className="flex items-center gap-2 p-2 rounded-lg hover:bg-muted transition"
              >
                <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center border">
                  {isAuthenticated && user.image ? (
                    <Image
                      src={user.image}
                      alt="Profile"
                      width={32}
                      height={32}
                      className="rounded-full"
                    />
                  ) : (
                    <User size={16} className="text-muted-foreground" />
                  )}
                </div>
                <span className="text-sm text-foreground max-w-32 truncate">
                  {user.name || user.email}
                </span>
              </button>

              {/* User Dropdown Menu */}
              {isUserMenuOpen && (
                <div className="absolute right-0 top-full mt-2 w-48 bg-background border border-border rounded-lg shadow-lg py-2">
                  <div className="px-4 py-2 border-b border-border">
                    <p className="text-sm font-medium text-foreground truncate">
                      {user.name || "User"}
                    </p>
                    <p className="text-xs text-muted-foreground truncate">
                      {user.email}
                    </p>
                  </div>
                  <Link
                    href="/dashboard"
                    className="flex items-center gap-2 px-4 py-2 text-sm text-foreground hover:bg-muted transition"
                    onClick={() => setIsUserMenuOpen(false)}
                  >
                    <LayoutDashboard size={16} />
                    Dashboard
                  </Link>


                  { isAuthenticated && user.role === "ADMIN" && <Link
                    href="/admin-dashboard"
                    className="flex items-center gap-2 px-4 py-2 text-sm text-foreground hover:bg-muted transition"
                    onClick={() => setIsUserMenuOpen(false)}
                  >
                    <MonitorCog size={16} />
                    Admin Panel
                  </Link> }

                  <Link
                    href="/dashboard/account"
                    className="flex items-center gap-2 px-4 py-2 text-sm text-foreground hover:bg-muted transition"
                    onClick={() => setIsUserMenuOpen(false)}
                  >
                    <User size={16} />
                    Profile
                  </Link>


                  <button
                    onClick={handleLogout}
                    className="flex items-center gap-2 w-full px-4 py-2 text-sm text-red-600 hover:bg-muted transition"
                  >
                    <LogOut size={16} />
                    Logout
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Link href="/login" className="px-4 py-2 text-foreground hover:text-accent transition text-sm">
                Login
              </Link>
              <Link
                href="/register"
                className="px-4 py-2 bg-accent text-accent-foreground rounded-lg hover:opacity-90 transition text-sm"
              >
                Register
              </Link>
            </div>
          )}
        </div>

        {/* Mobile Menu Button */}
        <div className="flex items-center gap-4 md:hidden">
          <Link href="/cart" className="relative p-2 text-foreground">
            <ShoppingCart size={20} />
            {cartCount > 0 && (
              <span className="absolute -top-1 -right-1 bg-accent text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
                {cartCount}
              </span>
            )}
          </Link>
          <button onClick={() => setIsMenuOpen(!isMenuOpen)}>
            {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      {isMenuOpen && (
        <div className="md:hidden border-t border-border bg-background">
          <nav className="flex flex-col gap-0 p-4">            
            <div className="pt-3 mt-3">
              {user ? (
                <>
                  <div className="flex items-center gap-3 py-3 border-b border-border">
                    <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center border">
                      {user.image ? (
                        <Image
                          src={user.image}
                          alt="Profile"
                          width={32}
                          height={32}
                          className="rounded-full"
                        />
                      ) : (
                        <User size={16} className="text-muted-foreground" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground truncate">
                        {user.name || "User"}
                      </p>
                      <p className="text-xs text-muted-foreground truncate">
                        {user.email}
                      </p>
                    </div>
                  </div>
                  
                  <Link 
                    href="/dashboard" 
                    className="flex items-center gap-3 py-3 text-foreground hover:text-accent text-sm border-b border-border"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    <LayoutDashboard size={16} />
                    Dashboard
                  </Link>


                  { isAuthenticated && user.role === "ADMIN" && <Link 
                    href="/admin-dashboard" 
                    className="flex items-center gap-3 py-3 text-foreground hover:text-accent text-sm border-b border-border"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    <MonitorCog size={16} />
                    Admin Panel
                  </Link> }


                  <Link 
                    href="/dashboard/account" 
                    className="flex items-center gap-3 py-3 text-foreground hover:text-accent text-sm border-b border-border"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    <User size={16} />
                    Profile
                  </Link> 



                  <button
                    onClick={handleLogout}
                    className="flex items-center gap-3 w-full py-3 text-red-600 text-sm"
                  >
                    <LogOut size={16} />
                    Logout
                  </button>
                </>
              ) : (
                <>
                  <Link 
                    href="/login" 
                    className="block py-3 text-foreground hover:text-accent text-sm border-b border-border"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    Login
                  </Link>
                  <Link
                    href="/register"
                    className="block w-full px-4 py-3 bg-accent text-accent-foreground rounded-lg hover:opacity-90 transition text-center text-sm mt-3"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    Register
                  </Link>
                </>
              )}
            </div>
          </nav>
        </div>
      )}
    </header>
  )
}