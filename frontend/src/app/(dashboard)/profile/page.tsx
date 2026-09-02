"use client"
import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { Shield, Lock, Users, Bell, Heart, LogOut, Key, User, ChevronRight } from "lucide-react"
import api from "@/lib/api"
import { PageTransition } from "@/components/page-transition"
import { getUserId } from "@/lib/auth"
import { useRouter } from "next/navigation"
import Link from "next/link"

export default function ProfilePage() {
  const [user, setUser] = useState<any>(null)
  const [ministries, setMinistries] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    const uid = getUserId()
    if (!uid) { router.push("/login"); return }
    Promise.all([
      api.get("/api/membership-card").catch(() => ({ data: { data: null } })),
      api.get("/api/ministries/me").catch(() => ({ data: { data: [] } })),
    ]).then(([u, m]) => {
      setUser(u.data.data)
      setMinistries(m.data.data || [])
      setLoading(false)
    })
  }, [])

  const handleLogout = () => {
    const token = localStorage.getItem("token")
    if (token) {
      api.post("/api/auth/logout", {}, { headers: { Authorization: `Bearer ${token}` } }).catch(() => {})
    }
    localStorage.removeItem("token")
    localStorage.removeItem("user")
    router.push("/login")
  }

  if (loading) return <Skeleton className="h-96 w-full" />

  return (
    <PageTransition>
      <div className="space-y-6 text-white">
        <div>
          <h1 className="text-3xl font-bold">My Profile</h1>
          <p className="text-gray-400 mt-1">Account, security and privacy settings</p>
        </div>

        {/* Account Info */}
        <Card className="bg-[#1E293B] border-0 shadow-lg">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="h-16 w-16 rounded-full bg-blue-600 flex items-center justify-center text-2xl font-bold">
                {(user?.fullName || "U").charAt(0)}
              </div>
              <div>
                <p className="text-xl font-semibold">{user?.fullName || "User"}</p>
                <p className="text-sm text-gray-400">{user?.email || ""}</p>
                {user?.phone && <p className="text-sm text-gray-500">{user.phone}</p>}
                <div className="flex gap-1 mt-1">
                  {user?.roles?.map((r: string) => (
                    <Badge key={r} variant="outline">{r}</Badge>
                  ))}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Settings Sections */}
        <div className="grid gap-4 md:grid-cols-2">
          {/* Security */}
          <Card className="bg-[#1E293B] border-0 shadow-lg">
            <CardHeader><CardTitle className="text-lg flex items-center gap-2"><Shield className="h-5 w-5 text-blue-400" /> Security</CardTitle></CardHeader>
            <CardContent className="space-y-2">
              <Link href="/profile/change-password" className="flex items-center justify-between p-2 rounded hover:bg-gray-800 transition-colors">
                <span className="text-sm text-gray-300 flex items-center gap-2"><Key className="h-4 w-4" /> Change Password</span>
                <ChevronRight className="h-4 w-4 text-gray-600" />
              </Link>
              <div className="flex items-center justify-between p-2">
                <span className="text-sm text-gray-300 flex items-center gap-2"><Lock className="h-4 w-4" /> Email Verification</span>
                <Badge variant={user?.emailVerified ? "default" : "destructive"}>{user?.emailVerified ? "Verified" : "Pending"}</Badge>
              </div>
              <button onClick={handleLogout} className="w-full flex items-center gap-2 p-2 rounded hover:bg-gray-800 transition-colors text-sm text-gray-300">
                <LogOut className="h-4 w-4" /> Sign Out Other Devices
              </button>
            </CardContent>
          </Card>

          {/* My Ministries */}
          <Card className="bg-[#1E293B] border-0 shadow-lg">
            <CardHeader><CardTitle className="text-lg flex items-center gap-2"><Users className="h-5 w-5 text-blue-400" /> My Ministries</CardTitle></CardHeader>
            <CardContent>
              {ministries.length === 0 ? (
                <p className="text-sm text-gray-500">Not a member of any ministry yet.</p>
              ) : (
                <div className="space-y-1">
                  {ministries.map(m => (
                    <div key={m.id} className="flex items-center justify-between p-2 rounded">
                      <span className="text-sm text-gray-300">{m.name}</span>
                      <Badge variant="outline">{m.type.replace(/_/g, " ")}</Badge>
                    </div>
                  ))}
                </div>
              )}
              <Link href="/ministries" className="block mt-2 text-sm text-blue-400 hover:underline">Explore ministries &rarr;</Link>
            </CardContent>
          </Card>

          {/* Privacy & Data */}
          <Card className="bg-[#1E293B] border-0 shadow-lg">
            <CardHeader><CardTitle className="text-lg flex items-center gap-2"><Heart className="h-5 w-5 text-blue-400" /> Privacy &amp; Data</CardTitle></CardHeader>
            <CardContent className="space-y-2">
              <Link href="/privacy" className="block p-2 rounded hover:bg-gray-800 transition-colors text-sm text-gray-300">Privacy Policy</Link>
              <Link href="/child-privacy" className="block p-2 rounded hover:bg-gray-800 transition-colors text-sm text-gray-300">Child Privacy</Link>
              <Link href="/terms" className="block p-2 rounded hover:bg-gray-800 transition-colors text-sm text-gray-300">Terms of Service</Link>
              <p className="text-xs text-gray-500 pt-1">Request data export or deletion by contacting your church administrator.</p>
            </CardContent>
          </Card>

          {/* Notifications */}
          <Card className="bg-[#1E293B] border-0 shadow-lg">
            <CardHeader><CardTitle className="text-lg flex items-center gap-2"><Bell className="h-5 w-5 text-blue-400" /> Notifications</CardTitle></CardHeader>
            <CardContent>
              <Link href="/notifications" className="block p-2 rounded hover:bg-gray-800 transition-colors text-sm text-gray-300">View notifications</Link>
              <p className="text-xs text-gray-500 pt-1">Manage notification preferences through your church administrator.</p>
            </CardContent>
          </Card>
        </div>

        {/* Sign Out */}
        <Button onClick={handleLogout} variant="outline" className="w-full">
          <LogOut className="h-4 w-4 mr-2" /> Sign Out
        </Button>
      </div>
    </PageTransition>
  )
}
