"use client"

import type React from "react"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ThemeToggle } from "@/components/theme-toggle"
import { Package, Eye, EyeOff } from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { createClient } from '@supabase/supabase-js'

// Direct Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://itobpwmrtzmehslljqiz.supabase.co'
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'sb_publishable_ppbf8V9jFXiQJHqV2bqgMg_jooqeiL8'

console.log("🔍 Loading env vars:")
console.log("URL:", supabaseUrl)
console.log("Key:", supabaseKey ? "Present" : "Missing")

let supabase = null
if (supabaseUrl && supabaseKey && supabaseUrl !== 'PASTE_YOUR_SUPABASE_URL_HERE') {
  supabase = createClient(supabaseUrl, supabaseKey)
  console.log("✅ Supabase client created")
} else {
  console.log("❌ Missing real Supabase values")
}

const blockchainOptions = [
  { value: "ethereum", label: "Ethereum" },
  { value: "polygon", label: "Polygon" },
  { value: "hyperledger", label: "Hyperledger Fabric" },
  { value: "solana", label: "Solana" },
  { value: "bsc", label: "Binance Smart Chain" },
  { value: "default", label: "Use Default (Ethereum)" },
]

export default function SignUpPage() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    company: "",
    companyEmail: "",
    password: "",
    confirmPassword: "",
    blockchain: "",
  })
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const router = useRouter()

  const validateForm = () => {
    const newErrors: Record<string, string> = {}

    if (!formData.name.trim()) {
      newErrors.name = "Name is required"
    }

    if (!formData.company.trim()) {
      newErrors.company = "Company name is required"
    }

    if (!formData.password) {
      newErrors.password = "Password is required"
    } else if (formData.password.length < 8) {
      newErrors.password = "Password must be at least 8 characters"
    }

    if (!formData.confirmPassword) {
      newErrors.confirmPassword = "Please confirm your password"
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = "Passwords do not match"
    }

    if (!formData.blockchain) {
      newErrors.blockchain = "Please select a blockchain network"
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    alert("🚀 RUNNING FROM /app/ FOLDER!")
    console.log("🚀 RUNNING FROM /app/ FOLDER!")
    console.log("🔧 Env URL:", process.env.NEXT_PUBLIC_SUPABASE_URL || "EMPTY")
    console.log("🔧 Env Key:", process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? "EXISTS" : "MISSING")

    if (!validateForm()) return

    setIsLoading(true)

    try {
      // Insert user data directly into Supabase
      const insertResult = await supabase
        .from('users')
        .insert([{
          email: formData.email,
          password_hash: formData.password,
          full_name: formData.name,
          company_email: formData.companyEmail
        }])
        .select()
      
      const userData = insertResult.data?.[0]
      const userError = insertResult.error

      console.log("📊 Supabase response:", { userData, userError })

      if (userError) {
        console.error("❌ Signup error:", userError)
        alert(`Error: ${userError.message}`)
        setIsLoading(false)
        return
      }

      // Create workspace for the user
      const workspaceResult = await supabase
        .from('workspaces')
        .insert([{
          user_id: userData.id,
          workspace_name: formData.company,
          workspace_description: `${formData.company} workspace`
        }])
        .select()
      
      const workspaceData = workspaceResult.data
      const workspaceError = workspaceResult.error

      console.log("✅ User created:", userData)
      console.log("✅ Workspace created:", workspaceData)

      alert("✅ SUCCESS! User created in database!")
      router.push("/login")

    } catch (error) {
      console.error("💥 Unexpected error:", error)
      alert(`Unexpected error: ${error}`)
    } finally {
      setIsLoading(false)
    }
  }

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: "" }))
    }
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="absolute top-4 right-4">
        <ThemeToggle />
      </div>

      <div className="w-full max-w-md space-y-6">
        {/* Logo and Title */}
        <div className="text-center space-y-2">
          <div className="flex justify-center">
            <div className="flex items-center gap-2 text-2xl font-bold">
              <Package className="h-8 w-8 text-primary" />
              <span>SupplyChain</span>
            </div>
          </div>
          <h1 className="text-2xl font-semibold tracking-tight">Create your account</h1>
          <p className="text-muted-foreground">Join the supply chain network</p>
        </div>

        {/* Sign Up Form */}
        <Card>
          <CardHeader className="space-y-1">
            <CardTitle className="text-xl">Sign up</CardTitle>
            <CardDescription>Create your account to get started</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Full Name</Label>
                <Input
                  id="name"
                  type="text"
                  placeholder="John Doe"
                  value={formData.name}
                  onChange={(e) => handleInputChange("name", e.target.value)}
                  className={errors.name ? "border-red-500" : ""}
                />
                {errors.name && <p className="text-sm text-red-500">{errors.name}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="john@company.com"
                  value={formData.email}
                  onChange={(e) => handleInputChange("email", e.target.value)}
                  className={errors.email ? "border-red-500" : ""}
                />
                {errors.email && <p className="text-sm text-red-500">{errors.email}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="company">Company</Label>
                <Input
                  id="company"
                  type="text"
                  placeholder="Acme Corporation"
                  value={formData.company}
                  onChange={(e) => handleInputChange("company", e.target.value)}
                  className={errors.company ? "border-red-500" : ""}
                />
                {errors.company && <p className="text-sm text-red-500">{errors.company}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="companyEmail">Company Email</Label>
                <Input
                  id="companyEmail"
                  type="email"
                  placeholder="info@company.com"
                  value={formData.companyEmail}
                  onChange={(e) => handleInputChange("companyEmail", e.target.value)}
                  className={errors.companyEmail ? "border-red-500" : ""}
                />
                {errors.companyEmail && <p className="text-sm text-red-500">{errors.companyEmail}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Create a strong password"
                    value={formData.password}
                    onChange={(e) => handleInputChange("password", e.target.value)}
                    className={errors.password ? "border-red-500 pr-10" : "pr-10"}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                {errors.password && <p className="text-sm text-red-500">{errors.password}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirm Password</Label>
                <div className="relative">
                  <Input
                    id="confirmPassword"
                    type={showConfirmPassword ? "text" : "password"}
                    placeholder="Confirm your password"
                    value={formData.confirmPassword}
                    onChange={(e) => handleInputChange("confirmPassword", e.target.value)}
                    className={errors.confirmPassword ? "border-red-500 pr-10" : "pr-10"}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                {errors.confirmPassword && <p className="text-sm text-red-500">{errors.confirmPassword}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="blockchain">Connect Blockchain</Label>
                <Select value={formData.blockchain} onValueChange={(value) => handleInputChange("blockchain", value)}>
                  <SelectTrigger className={errors.blockchain ? "border-red-500" : ""}>
                    <SelectValue placeholder="Select blockchain network" />
                  </SelectTrigger>
                  <SelectContent>
                    {blockchainOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.blockchain && <p className="text-sm text-red-500">{errors.blockchain}</p>}
              </div>

              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? "Creating account..." : "Create account"}
              </Button>
            </form>

            <div className="mt-6 text-center text-sm">
              <span className="text-muted-foreground">Already have an account? </span>
              <Link href="/login" className="text-primary hover:underline">
                Sign in
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

