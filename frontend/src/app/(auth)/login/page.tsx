"use client"
import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import api from "@/lib/api"

export default function LoginPage() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setError("")
    setLoading(true)
    try {
      const res = await api.post("/api/auth/login", { email, password })
      const data = res.data?.data
      if (data?.accessToken) {
        localStorage.setItem("token", data.accessToken)
        localStorage.setItem("user", JSON.stringify({ id: data.userId, name: data.fullName }))
        router.push("/dashboard")
      } else {
        setError("Login failed. Please try again.")
      }
    } catch (err: any) {
      setError(err.response?.data?.message || "Invalid credentials. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-[#0a0f1e] to-[#1e2736] p-4">
      <div className="w-full max-w-md bg-[#111827] rounded-2xl border border-white/5 shadow-xl shadow-black/40 p-8">
        <div className="flex justify-center mb-8">
          <svg viewBox="0 0 100 140" width="64" height="89" xmlns="http://www.w3.org/2000/svg">
            <path d="M35 0 L40 0 L40 45 L0 45 L0 50 L40 50 L40 95 L35 95 L35 140 L40 140 L40 95 L100 95 L100 90 L40 90 L40 50 L60 50 L60 45 L40 45 L40 0 Z" fill="#1A3C8F" />
            <path d="M40 0 L45 0 L45 45 L100 45 L100 50 L45 50 L45 90 L100 90 L100 95 L45 95 L45 140 L40 140 L40 0 Z" fill="#E2A619" />
            <rect x="39.5" y="0" width="1" height="140" fill="white" />
          </svg>
        </div>

        <h1 className="text-2xl font-bold text-white text-center mb-2">Sign in to your account</h1>

        {error && (
          <p className="text-sm text-red-400 bg-red-900/20 border border-red-900/30 px-3 py-2 rounded-lg text-center mb-4">
            {error}
          </p>
        )}

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label htmlFor="email" className="block mb-1.5 text-sm font-medium text-gray-300">Email</label>
            <input
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full px-4 py-2.5 rounded-lg bg-gray-800 border border-gray-700 text-white placeholder:text-gray-500 text-sm outline-none focus:border-blue-500 transition-colors"
            />
          </div>

          <div>
            <label htmlFor="password" className="block mb-1.5 text-sm font-medium text-gray-300">Password</label>
            <input
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full px-4 py-2.5 rounded-lg bg-gray-800 border border-gray-700 text-white placeholder:text-gray-500 text-sm outline-none focus:border-blue-500 transition-colors"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-[#1A3C8F] hover:bg-[#153074] text-white font-semibold py-2.5 rounded-lg text-sm transition-colors disabled:opacity-50"
          >
            {loading ? "Signing in..." : "Sign In"}
          </button>
        </form>

        <div className="mt-6 text-sm">
          <Link href="/forgot-password" style={{ color: "#E2A619", textDecoration: "none", fontWeight: 500 }}>
            Forgot password?
          </Link>
        </div>
        <div className="mt-3 text-gray-500 text-sm">
          Don't have an account?{" "}
          <Link href="/register" style={{ color: "#E2A619", textDecoration: "none", fontWeight: 600 }}>
            Register
          </Link>
        </div>
        <div className="mt-4 text-gray-500 text-xs">
          By signing in you agree to our
          <Link href="/terms" style={{ color: "#64748b" }}>Terms</Link> and
          <Link href="/privacy" style={{ color: "#64748b" }}>Privacy Policy</Link>
        </div>
      </div>
    </div>
  )
}