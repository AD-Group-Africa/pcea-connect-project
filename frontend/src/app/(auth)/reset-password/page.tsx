"use client"
import { useState, Suspense } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { toast } from "sonner"
import api from "@/lib/api"

function ResetPasswordForm() {
  const [newPassword, setNewPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const searchParams = useSearchParams()
  const token = searchParams.get("token") || ""

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      await api.post("/api/auth/reset-password", { token, newPassword })
      toast.success("Password reset! Please sign in.")
      router.push("/login")
    } catch {
      toast.error("Invalid or expired token.")
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
            <CardTitle className="text-2xl font-bold text-white">Reset Password</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="newPassword" className="text-gray-300">New Password</Label>
              <Input id="newPassword" type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} required
                className="bg-gray-800 border-gray-700 text-white placeholder:text-gray-500" />
            </div>
            <Button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 text-white" disabled={loading}>
              {loading ? "Resetting…" : "Reset Password"}
            </Button>
          </CardContent>
        </form>
      </Card>
    </div>
  )
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<div className="flex min-h-screen items-center justify-center bg-[#0B1622] text-white">Loading…</div>}>
      <ResetPasswordForm />
    </Suspense>
  )
}
