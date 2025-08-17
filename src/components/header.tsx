"use client"

import React, { useState, useEffect } from "react"
import { ThemeToggle } from "@/components/theme-toggle"
import { WalletConnect } from "@/components/wallet-connect"
import { Button } from "@/components/ui/button"
import { LogOut, User } from "lucide-react"
import { useRouter } from "next/navigation"
// import { useAuth } from "@/hooks/useAuth"

export function Header() {
  const router = useRouter()
  const [user, setUser] = useState<any>(null)

  // Load user from localStorage
  useEffect(() => {
    const userData = localStorage.getItem('currentUser')
    if (userData) {
      setUser(JSON.parse(userData))
    }
  }, [])

  const handleLogout = async () => {
    // Clear user data
    localStorage.removeItem('currentUser')
    setUser(null)
    router.push("/login")
  }

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center justify-between px-6">
        <div className="flex items-center space-x-2">
          <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center">
            <div className="h-4 w-4 rounded bg-primary-foreground" />
          </div>
          <div>
            <h1 className="text-xl font-semibold">Supply Chain</h1>
            <p className="text-sm text-muted-foreground">Dashboard</p>
          </div>
        </div>

        <div className="flex items-center space-x-4">
          <nav className="hidden md:flex items-center space-x-6">
            <a href="/dashboard" className="text-sm font-medium transition-colors hover:text-primary">
              Dashboard
            </a>
            <a href="/stats" className="text-sm font-medium text-muted-foreground transition-colors hover:text-primary">
              Stats
            </a>
            <a
              href="/management"
              className="text-sm font-medium text-muted-foreground transition-colors hover:text-primary"
            >
              Management
            </a>
            <a
              href="/users"
              className="text-sm font-medium text-muted-foreground transition-colors hover:text-primary"
            >
              Users
            </a>
          </nav>
          {user && (
            <div className="flex items-center gap-2 text-sm">
              <User className="h-4 w-4" />
              <span className="hidden sm:inline">{user.email}</span>
            </div>
          )}
          <WalletConnect />
          <Button variant="ghost" size="sm" onClick={handleLogout} className="flex items-center gap-2">
            <LogOut className="h-4 w-4" />
            <span className="hidden sm:inline">Logout</span>
          </Button>
          <ThemeToggle />
        </div>
      </div>
    </header>
  )
}
