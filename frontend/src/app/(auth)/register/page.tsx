"use client"
import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import api from "@/lib/api"

export default function RegisterPage() {
  const [firstName, setFirstName] = useState("")
  const [lastName, setLastName] = useState("")
  const [email, setEmail] = useState("")
  const [phone, setPhone] = useState("")
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [termsAccepted, setTermsAccepted] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")
  const router = useRouter()

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")

    if (password !== confirmPassword) {
      setError("Passwords do not match.")
      return
    }
    if (password.length < 8) {
      setError("Password must be at least 8 characters.")
      return
    }
    if (!termsAccepted) {
      setError("Please accept the Terms and Privacy Policy to continue.")
      return
    }

    setLoading(true)
    try {
      const res = await api.post("/api/auth/register", {
        email, password, phone, termsAccepted,
        fullName: `${firstName} ${lastName}`.trim(),
      })
      if (res.data?.success) {
        setSuccess("Account created! Redirecting to login...")
        setTimeout(() => router.push("/login"), 1500)
      } else {
        setError(res.data?.message || "Registration failed.")
      }
    } catch (err: any) {
      if (err.response?.status === 400) {
        setError("This email is already registered. Please log in instead.")
      } else {
        setError("Network or server error. Please try again.")
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-b from-[#0a0f1e] to-[#1e2736] p-4">
      <div className="w-full max-w-md bg-[#111827] rounded-2xl border border-white/5 shadow-xl shadow-black/40 p-8">
        <div className="flex justify-center mb-8">
          <svg viewBox="0 0 100 140" width="64" height="89" xmlns="http://www.w3.org/2000/svg">
            <path d="M35 0 L40 0 L40 45 L0 45 L0 50 L40 50 L40 95 L35 95 L35 140 L40 140 L40 95 L100 95 L100 90 L40 90 L40 50 L60 50 L60 45 L40 45 L40 0 Z" fill="#1A3C8F" />
            <path d="M40 0 L45 0 L45 45 L100 45 L100 50 L45 50 L45 90 L100 90 L100 95 L45 95 L45 140 L40 140 L40 0 Z" fill="#E2A619" />
            <rect x="39.5" y="0" width="1" height="140" fill="white" />
          </svg>
        </div>

        <h1 className="text-2xl font-bold text-white text-center mb-2">Create Your PCEA Connect Account</h1>
        <p className="text-sm text-gray-400 text-center mb-6">
          Join your congregation and stay connected to worship, ministries and church life.
        </p>

        <form onSubmit={handleRegister} className="space-y-4">
          {/* Personal */}
          <div>
            <label htmlFor="firstName" className="block mb-1.5 text-sm font-medium text-gray-300">First Name</label>
            <input
              id="firstName" type="text" placeholder="John" value={firstName}
              onChange={(e) => setFirstName(e.target.value)} required
              className="w-full px-4 py-2.5 rounded-lg bg-gray-800 border border-gray-700 text-white placeholder:text-gray-500 text-sm outline-none focus:border-blue-500 transition-colors"
            />
          </div>
          <div>
            <label htmlFor="lastName" className="block mb-1.5 text-sm font-medium text-gray-300">Last Name</label>
            <input
              id="lastName" type="text" placeholder="Doe" value={lastName}
              onChange={(e) => setLastName(e.target.value)} required
              className="w-full px-4 py-2.5 rounded-lg bg-gray-800 border border-gray-700 text-white placeholder:text-gray-500 text-sm outline-none focus:border-blue-500 transition-colors"
            />
          </div>

          {/* Contact */}
          <div>
            <label htmlFor="email" className="block mb-1.5 text-sm font-medium text-gray-300">Email</label>
            <input
              id="email" type="email" placeholder="you@example.com" value={email}
              onChange={(e) => setEmail(e.target.value)} required
              className="w-full px-4 py-2.5 rounded-lg bg-gray-800 border border-gray-700 text-white placeholder:text-gray-500 text-sm outline-none focus:border-blue-500 transition-colors"
            />
          </div>
          <div>
            <label htmlFor="phone" className="block mb-1.5 text-sm font-medium text-gray-300">Phone</label>
            <input
              id="phone" type="tel" placeholder="0712345678" value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="w-full px-4 py-2.5 rounded-lg bg-gray-800 border border-gray-700 text-white placeholder:text-gray-500 text-sm outline-none focus:border-blue-500 transition-colors"
            />
          </div>

          {/* Security */}
          <div>
            <label htmlFor="password" className="block mb-1.5 text-sm font-medium text-gray-300">Password</label>
            <input
              id="password" type="password" placeholder="Min 8 characters" value={password}
              onChange={(e) => setPassword(e.target.value)} required
              className="w-full px-4 py-2.5 rounded-lg bg-gray-800 border border-gray-700 text-white placeholder:text-gray-500 text-sm outline-none focus:border-blue-500 transition-colors"
            />
          </div>
          <div>
            <label htmlFor="confirmPassword" className="block mb-1.5 text-sm font-medium text-gray-300">Confirm Password</label>
            <input
              id="confirmPassword" type="password" placeholder="Re-enter password" value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)} required
              className="w-full px-4 py-2.5 rounded-lg bg-gray-800 border border-gray-700 text-white placeholder:text-gray-500 text-sm outline-none focus:border-blue-500 transition-colors"
            />
          </div>

          {/* Agreement */}
          <div className="flex items-start gap-2 pt-1">
            <input
              id="terms" type="checkbox" checked={termsAccepted}
              onChange={(e) => setTermsAccepted(e.target.checked)}
              className="mt-1 h-4 w-4 rounded border-gray-600 bg-gray-800 text-blue-600 focus:ring-blue-500 shrink-0"
            />
            <label htmlFor="terms" className="text-xs text-gray-400 leading-relaxed">
              I have read and agree to the
              <Link href="/terms" className="text-blue-400 hover:underline">Terms of Service</Link> and
              <Link href="/privacy" className="text-blue-400 hover:underline">Privacy Policy</Link>, including how my data and my children's data will be handled.
            </label>
          </div>

          {error && (
            <p className="text-sm text-red-400 bg-red-900/20 border border-red-900/30 px-3 py-2 rounded-lg text-center">{error}</p>
          )}
          {success && (
            <p className="text-sm text-green-400 bg-green-900/20 border border-green-900/30 px-3 py-2 rounded-lg text-center">{success}</p>
          )}

          <button
            type="submit" disabled={loading}
            className="w-full bg-[#1A3C8F] hover:bg-[#153074] text-white font-semibold py-2.5 rounded-lg text-sm transition-colors disabled:opacity-50"
          >
            {loading ? "Creating account..." : "Create Account"}
          </button>
        </form>

        <p className="text-sm text-gray-400 text-center mt-6">
          Already have an account?{" "}
          <Link href="/login" className="text-[#E2A619] font-semibold hover:underline">Sign In</Link>
        </p>

        <div className="mt-6 pt-6 border-t border-white/5">
          <div className="flex flex-col sm:flex-row items-center justify-center gap-2">
            <span className="text-xs text-gray-500">Or continue with</span>
            <div className="flex gap-2">
              {/* Google sign-in - shown only when configured */}
              {/* <Button className="flex-1 h-10 rounded-full bg-white p-0 flex items-center justify-center">
                <GoogleIcon className="h-5 w-5" />{" "}
                <span className="text-gray-700 text-sm">Google</span>
              </Button> */}
              <span className="text-gray-500 text-sm disabled:opacity-50">Google</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}