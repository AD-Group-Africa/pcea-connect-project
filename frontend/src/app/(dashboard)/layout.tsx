"use client"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { useState, useEffect } from "react"
import { Home, Church, Users, DollarSign, Bell, User, LogOut, Menu, X } from "lucide-react"

const apiHost = (process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080").replace(/\/+$/, "")

const navItems = [
  { label: "Home", path: "/dashboard", icon: Home },
  { label: "Worship", path: "/worship", icon: Church },
  { label: "Ministries", path: "/ministries", icon: Users },
  { label: "Give", path: "/giving", icon: DollarSign },
  { label: "Profile", path: "/profile", icon: User },
]

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const pathname = usePathname()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [unreadCount, setUnreadCount] = useState(0)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    // Fetch unread notifications count
    const token = localStorage.getItem("token")
    if (token) {
      fetch(`${apiHost}/api/notifications/me/unread-count`, {
        headers: { Authorization: `Bearer ${token}` }
      }).then(r => r.json()).then(data => {
        setUnreadCount(data?.data?.count || 0)
      }).catch(() => {})
    }
  }, [pathname])

  const handleLogout = () => {
    const token = localStorage.getItem("token")
    if (token) {
      fetch(`${apiHost}/api/auth/logout`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` }
      }).catch(() => {})
    }
    localStorage.removeItem("token")
    localStorage.removeItem("user")
    router.push("/login")
  }

  // Close mobile menu on route change
  useEffect(() => { setMobileMenuOpen(false) }, [pathname])

  return (
    <div className="min-h-screen flex flex-col bg-[#0a0f1e] text-white" style={{ fontFamily: "system-ui, -apple-system, sans-serif" }}>
      {/* Desktop Header */}
      <header className="sticky top-0 z-50 border-b border-white/8 bg-[#111827]/95 backdrop-blur-md">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            {/* Logo */}
            <Link href="/dashboard" className="flex items-center gap-2.5 shrink-0">
              <svg viewBox="0 0 100 140" width="26" height="36" xmlns="http://www.w3.org/2000/svg" aria-label="PCEA Connect">
                <path d="M35 0 L40 0 L40 45 L0 45 L0 50 L40 50 L40 95 L35 95 L35 140 L40 140 L40 95 L100 95 L100 90 L40 90 L40 50 L60 50 L60 45 L40 45 L40 0 Z" fill="#1A3C8F" />
                <path d="M40 0 L45 0 L45 45 L100 45 L100 50 L45 50 L45 90 L100 90 L100 95 L45 95 L45 140 L40 140 L40 0 Z" fill="#E2A619" />
                <rect x="39.5" y="0" width="1" height="140" fill="white" />
              </svg>
              <span className="text-lg font-bold">
                PCEA <span className="text-[#E2A619]">Connect</span>
              </span>
            </Link>

            {/* Desktop Nav */}
            <nav className="hidden md:flex items-center gap-1" aria-label="Main navigation">
              {navItems.map(item => {
                const Icon = item.icon
                const active = pathname === item.path
                return (
                  <Link
                    key={item.label}
                    href={item.path}
                    className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                      active ? "text-white bg-white/8" : "text-gray-400 hover:text-white hover:bg-white/5"
                    }`}
                  >
                    <Icon className="h-4 w-4" />
                    {item.label}
                  </Link>
                )
              })}
            </nav>

            {/* Right Actions */}
            <div className="flex items-center gap-2">
              {/* Notifications */}
              <Link href="/notifications" className="relative p-2 rounded-lg text-gray-400 hover:text-white hover:bg-white/5 transition-colors" aria-label="Notifications">
                <Bell className="h-5 w-5" />
                {mounted && unreadCount > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 bg-[#E2A619] text-black text-[10px] font-bold rounded-full h-4 min-w-4 px-1 flex items-center justify-center">
                    {unreadCount}
                  </span>
                )}
              </Link>

              {/* Logout Button */}
              <button
                onClick={handleLogout}
                className="hidden md:flex items-center gap-1.5 bg-[#1A3C8F] hover:bg-[#153074] text-white px-3 py-1.5 rounded-lg text-sm font-semibold transition-colors"
              >
                <LogOut className="h-4 w-4" />
                <span className="hidden lg:inline">Sign Out</span>
              </button>

              {/* Mobile Menu Toggle */}
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="md:hidden p-2 rounded-lg text-gray-400 hover:text-white hover:bg-white/5"
                aria-label="Toggle menu"
                aria-expanded={mobileMenuOpen}
              >
                {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Dropdown Menu */}
        {mobileMenuOpen && (
          <nav className="md:hidden border-t border-white/8 bg-[#111827] px-4 py-3 space-y-1" aria-label="Mobile navigation">
            {navItems.map(item => {
              const Icon = item.icon
              const active = pathname === item.path
              return (
                <Link
                  key={item.label}
                  href={item.path}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                    active ? "text-white bg-white/8" : "text-gray-400 hover:text-white hover:bg-white/5"
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  {item.label}
                </Link>
              )
            })}
            <button
              onClick={handleLogout}
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-red-400 hover:bg-red-900/20 transition-colors"
            >
              <LogOut className="h-4 w-4" />
              Sign Out
            </button>
          </nav>
        )}
      </header>

      {/* Main Content */}
      <main className="flex-1 mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8 py-6 pb-24 md:pb-6">
        {children}
      </main>

      {/* Mobile Bottom Navigation */}
      <nav className="md:hidden fixed bottom-0 inset-x-0 z-50 border-t border-white/8 bg-[#111827]/95 backdrop-blur-md" aria-label="Bottom navigation">
        <div className="flex items-center justify-around h-16">
          {navItems.map(item => {
            const Icon = item.icon
            const active = pathname === item.path || (item.path === "/dashboard" && pathname === "/")
            return (
              <Link
                key={item.label}
                href={item.path}
                className={`flex flex-col items-center gap-0.5 px-2 py-1.5 transition-colors ${
                  active ? "text-[#E2A619]" : "text-gray-500"
                }`}
              >
                <Icon className="h-5 w-5" />
                <span className="text-[10px] font-medium">{item.label}</span>
              </Link>
            )
          })}
        </div>
      </nav>
    </div>
  )
}
