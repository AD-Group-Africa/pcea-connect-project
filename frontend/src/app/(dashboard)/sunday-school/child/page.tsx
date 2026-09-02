"use client"
import { useEffect, useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { Sun, BookOpen, Award, CheckCircle2 } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { PageTransition } from "@/components/page-transition"
import { EmptyState } from "@/components/empty-state"
import { getTheme } from "@/lib/ministry-themes"
import api from "@/lib/api"
import { getUserId } from "@/lib/auth"

const theme = getTheme("CHURCH_SCHOOL")

interface Lesson {
  id: string; title: string; bibleReference: string; description: string; lessonDate: string
}
interface Progress {
  id: string; status: string; note: string
}
interface Child {
  id: string; childName: string; className: string
}

export default function SundaySchoolChildPage() {
  const [children, setChildren] = useState<Child[]>([])
  const [lessons, setLessons] = useState<Lesson[]>([])
  const [progress, setProgress] = useState<Progress[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const uid = getUserId()
    if (!uid) { setLoading(false); return }

    // Get parent's children (a child view assumes the parent is viewing WITH their child)
    api.get("/api/sunday-school/my-children").then(res => {
      const myChildren = res.data.data || []
      setChildren(myChildren)
      if (myChildren.length === 0) { setLoading(false); return }

      // Load lessons for the first child
      const firstChild = myChildren[0]
      Promise.all([
        api.get(`/api/sunday-school/children/${firstChild.id}/lessons`).catch(() => ({ data: { data: [] } })),
        api.get(`/api/sunday-school/children/${firstChild.id}/progress`).catch(() => ({ data: { data: [] } })),
      ]).then(([l, p]) => {
        setLessons(l.data.data || [])
        setProgress(p.data.data || [])
        setLoading(false)
      })
    }).catch(() => setLoading(false))
  }, [])

  if (loading) return <Skeleton className="h-96 w-full" />

  const todaysLesson = lessons.find(l => {
    const today = new Date().toISOString().split("T")[0]
    return l.lessonDate === today
  }) || lessons[0]

  const completedCount = progress.filter(p => p.status === "COMPLETED" || p.status === "EXCELLENT").length
  const progressPct = lessons.length > 0 ? Math.round((completedCount / lessons.length) * 100) : 0

  return (
    <PageTransition>
      <div className="space-y-6 text-white">
        {/* Child header — light orange, warm, friendly */}
        <div className="rounded-lg p-6" style={{ background: `linear-gradient(135deg, ${theme.accent}, ${theme.accentLight})` }}>
          <div className="flex items-center gap-3">
            <Sun className="h-8 w-8 text-white" />
            <div>
              <h1 className="text-3xl font-bold text-white">Sunday School</h1>
              <p className="text-white/80 text-sm">
                {children.length > 0 ? `Hello ${children[0].childName}!` : "Welcome!"}
              </p>
            </div>
          </div>
        </div>

        {children.length === 0 ? (
          <Card className="bg-[#1E293B] border-0 shadow-lg">
            <CardContent className="p-8 text-center">
              <Sun className="h-12 w-12 mx-auto mb-2 text-gray-600" />
              <p className="text-gray-400">No children linked to your account yet.</p>
              <p className="text-sm text-gray-500 mt-1">Ask your church administrator to link your child.</p>
            </CardContent>
          </Card>
        ) : (
          <>
            {/* Today's Lesson */}
            {todaysLesson ? (
              <Card style={{ background: theme.accentBg, borderColor: theme.accentLight }} className="border">
                <CardContent className="p-6">
                  <p className="text-xs uppercase tracking-wide font-semibold" style={{ color: theme.accent }}>TODAY&apos;S LESSON</p>
                  <h2 className="text-2xl font-bold text-white mt-2">{todaysLesson.title}</h2>
                  {todaysLesson.bibleReference && (
                    <p className="text-sm text-gray-400 mt-1 flex items-center gap-1">
                      <BookOpen className="h-4 w-4" /> {todaysLesson.bibleReference}
                    </p>
                  )}
                  {todaysLesson.description && (
                    <p className="text-sm text-gray-400 mt-2">{todaysLesson.description}</p>
                  )}
                </CardContent>
              </Card>
            ) : (
              <Card className="bg-[#1E293B] border-0 shadow-lg">
                <CardContent className="p-8 text-center">
                  <BookOpen className="h-12 w-12 mx-auto mb-2 text-gray-600" />
                  <p className="text-gray-400">No lesson available yet.</p>
                  <p className="text-sm text-gray-500 mt-1">Check back soon!</p>
                </CardContent>
              </Card>
            )}

            {/* My Progress */}
            <Card className="bg-[#1E293B] border-0 shadow-lg">
              <CardContent className="p-6">
                <h3 className="text-lg font-semibold text-white flex items-center gap-2 mb-3">
                  <Award className="h-5 w-5" style={{ color: theme.accent }} /> My Progress
                </h3>
                <div className="w-full bg-gray-700 rounded-full h-3 mb-2">
                  <div className="rounded-full h-3 transition-all" style={{ width: `${progressPct}%`, background: theme.accent }} />
                </div>
                <p className="text-sm text-gray-400">{progressPct}% complete ({completedCount}/{lessons.length} lessons)</p>
              </CardContent>
            </Card>

            {/* Activities / Progress notes */}
            {progress.length > 0 && (
              <div>
                <h3 className="text-lg font-semibold text-white mb-3">Activities</h3>
                <div className="space-y-2">
                  {progress.map(p => (
                    <Card key={p.id} className="bg-[#1E293B] border-0 shadow-lg">
                      <CardContent className="p-4 flex items-center gap-3">
                        <CheckCircle2 className="h-5 w-5" style={{ color: theme.accent }} />
                        <div>
                          <Badge style={{ background: theme.accent, color: "white" }}>{p.status}</Badge>
                          {p.note && <p className="text-sm text-gray-400 mt-1">{p.note}</p>}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </PageTransition>
  )
}
