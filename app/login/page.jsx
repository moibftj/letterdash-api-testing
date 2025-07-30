"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { toast } from "sonner"

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError("")
    if (!email || !password) {
      setError("Please enter both email and password.")
      return
    }
    setLoading(true)
    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password }),
      })
      const data = await response.json()
      if (!response.ok) {
        setError(data.error || "Login failed. Please try again.")
        setLoading(false)
        return
      }
      localStorage.setItem("token", data.token)
      toast.success("Login successful!")
      router.push("/")
    } catch (err) {
      setError("Network error. Please try again.")
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-[#C8A8E9] to-[#FF6B35] px-4">
      <Card className="w-full max-w-md bg-white/95 rounded-[24px] shadow-[0_25px_50px_-12px_rgba(0,0,0,0.15),0_8px_16px_-4px_rgba(0,0,0,0.1)] p-8 max-w-[400px]">
        <CardHeader>
          <CardTitle className="text-[#1F2937] text-center text-2xl font-medium">
            Welcome to Talk-to-My-Lawyer
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <Label htmlFor="email" className="text-[#6B7280]">
                Email
              </Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="bg-[#F9FAFB] border border-[#E5E7EB] text-[#111827] rounded-md focus:outline-none focus:border-[#3B82F6]"
                required
              />
            </div>
            <div>
              <Label htmlFor="password" className="text-[#6B7280]">
                Password
              </Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="bg-[#F9FAFB] border border-[#E5E7EB] text-[#111827] rounded-md focus:outline-none focus:border-[#3B82F6]"
                required
              />
            </div>
            {error && <p className="text-red-500 text-sm">{error}</p>}
            <Button
              type="submit"
              className="w-full bg-black hover:bg-[#1F2937] text-white"
              disabled={loading}
            >
              {loading ? "Logging in..." : "Log In"}
            </Button>
          </form>
          <div className="mt-6">
            <Button
              type="button"
              className="w-full bg-white text-[#111827] shadow-sm border border-[#E5E7EB] hover:bg-gray-100"
              onClick={() => {
                // Placeholder for Google OAuth flow
                toast("Google OAuth not implemented yet.")
              }}
            >
              Continue with Google
            </Button>
          </div>
          <div className="mt-4 text-center">
            <a href="/register" className="text-[#1F2937] underline hover:text-[#3B82F6]">
              Sign up
            </a>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
