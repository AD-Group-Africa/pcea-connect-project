"use client"
import { useEffect, useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { Sun, Users, GraduationCap, Shield } from "lucide-react"
import Link from "next/link"
import { PageTransition } from "@/components/page-transition"
import { getTheme } from "@/lib/ministry-themes"
import { getUserId } from "@/lib/auth"

const theme = getTheme("CHURCH_SCHOOL")

export default function SundaySchoolHub() {
  const [userRoles, setUserRoles] = useState<string[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const token = localStorage.getItem("token")
    if (!token) { setLoading(false); return }
    try {
      const payload = JSON.parse(atob(token.split(".")[1]))
      // Roles may be in the JWT as 'roles' or 'authorities'
      const roles = payload.roles || payload.authorities || []
      setUserRoles(roles.map((r: string) => r.replace("ROLE_", "")))
    } catch { /* empty */ }
    setLoading(false)
  }, [])

  if (loading) return <Skeleton className="h-96 w-full" />

  const isAdmin = userRoles.some((r) => ["SUPER_ADMIN", "ADMIN", "ELDER"].includes(r))
  const isTeacher = userRoles.includes("SUNDAY_SCHOOL_TEACHER") || isAdmin

  return (
    <PageTransition>
      <div className="space-y-6 text-white">
        {/* Sunday School hero — warm, friendly, light orange */}
        <div className="rounded-lg p-6" style={{ background: `linear-gradient(135deg, ${theme.accent}, ${theme.accentLight})` }}>
          <div className="flex items-center gap-3">
            <Sun className="h-8 w-8 text-white" />
            <div>
              <h1 className="text-3xl font-bold text-white">Sunday School</h1>
              <p className="text-white/80 text-sm">Warm &bull; Friendly &bull; Simple</p>
            </div>
          </div>
        </div>

        <p className="text-gray-400">
          Welcome to Sunday School! Choose your view below.
        </p>

        {/* Role-based entry cards */}
        <div className="grid gap-4 md:grid-cols-3">
          <Card className="bg-[#1E293B] border-0 shadow-lg hover:shadow-xl transition-shadow">
            <CardContent className="p-6 text-center">
              <Sun className="h-12 w-12 mx-auto mb-3" style={{ color: theme.accent }} />
              <h3 className="text-lg font-semibold text-white">Child View</h3>
              <p className="text-sm text-gray-400 mt-1">Today&apos;s lesson, progress &amp; activities</p>
              <Link href="/sunday-school/child">
                <Button className="mt-4 w-full" style={{ background: theme.accent, color: "white" }}>Open</Button>
              </Link>
            </CardContent>
          </Card>

          <Card className="bg-[#1E293B] border-0 shadow-lg hover:shadow-xl transition-shadow">
            <CardContent className="p-6 text-center">
              <Users className="h-12 w-12 mx-auto mb-3" style={{ color: theme.accent }} />
              <h3 className="text-lg font-semibold text-white">Parent View</h3>
              <p className="text-sm text-gray-400 mt-1">My children, attendance &amp; progress</p>
              <Link href="/sunday-school/parent">
                <Button className="mt-4 w-full" style={{ background: theme.accent, color: "white" }}>Open</Button>
              </Link>
            </CardContent>
          </Card>

          {isTeacher && (
            <Card className="bg-[#1E293B] border-0 shadow-lg hover:shadow-xl transition-shadow">
              <CardContent className="p-6 text-center">
                <GraduationCap className="h-12 w-12 mx-auto mb-3" style={{ color: theme.accent }} />
                <h3 className="text-lg font-semibold text-white">Teacher View</h3>
                <p className="text-sm text-gray-400 mt-1">Classes, learners, attendance &amp; lessons</p>
                <Link href="/sunday-school/teacher">
                  <Button className="mt-4 w-full" style={{ background: theme.accent, color: "white" }}>Open</Button>
                </Link>
              </CardContent>
            </Card>
          )}

          {isAdmin && (
            <Card className="bg-[#1E293B] border-0 shadow-lg hover:shadow-xl transition-shadow">
              <CardContent className="p-6 text-center">
                <Shield className="h-12 w-12 mx-auto mb-3" style={{ color: theme.accent }} />
                <h3 className="text-lg font-semibold text-white">Admin</h3>
                <p className="text-sm text-gray-400 mt-1">Create classes, assign teachers, link parents</p>
                <Link href="/sunday-school/teacher">
                  <Button className="mt-4 w-full" style={{ background: theme.accent, color: "white" }}>Open</Button>
                </Link>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </PageTransition>
  )
}
