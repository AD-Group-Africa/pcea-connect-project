"use client"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { toast } from "sonner"
import api from "@/lib/api"

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("")
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      await api.post("/api/auth/forgot-password", { email })
      toast.success("If this email exists, a reset link has been sent.")
    } catch {
      toast.success("If this email exists, a reset link has been sent.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#0B1622] p-4">
      <Card className="w-full max-w-md backdrop-blur-sm bg-[#111827] border-0 shadow-2xl shadow-black/50 rounded-2xl">
        <form onSubmit={handleSubmit}>
          <CardHeader className="items-center space-y-2">
            <img src="/logo.png" alt="PCEA Connect" className="w-24 h-24 mb-4" />
            <CardTitle className="text-2xl font-bold text-white">Forgot Password</CardTitle>
            <p className="text-sm text-gray-400">Enter your email to receive a reset link</p>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="email" className="text-gray-300">Email</Label>
              <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required
                className="bg-gray-800 border-gray-700 text-white placeholder:text-gray-500" />
            </div>
            <Button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 text-white" disabled={loading}>
              {loading ? "Sending…" : "Send Reset Link"}
            </Button>
          </CardContent>
          <CardFooter className="justify-center">
            <a href="/login" className="text-blue-400 hover:underline text-sm">Back to Sign In</a>
          </CardFooter>
        </form>
      </Card>
    </div>
  )
}
