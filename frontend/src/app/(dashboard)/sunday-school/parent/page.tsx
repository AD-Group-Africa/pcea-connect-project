"use client"
import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { Sun, Users, BookOpen, Calendar, TrendingUp, FileText, ChevronRight } from "lucide-react"
import { PageTransition } from "@/components/page-transition"
import { getTheme } from "@/lib/ministry-themes"
import api from "@/lib/api"

const theme = getTheme("CHURCH_SCHOOL")

interface Child {
  id: string; childName: string; className: string; dateOfBirth: string | null
}
interface Lesson {
  id: string; title: string; bibleReference: string; lessonDate: string
}
interface Attendance {
  id: string; present: boolean; attendanceDate: string; note: string
}
interface Progress {
  id: string; status: string; note: string
}

export default function SundaySchoolParentPage() {
  const [children, setChildren] = useState<Child[]>([])
  const [selectedChild, setSelectedChild] = useState<Child | null>(null)
  const [lessons, setLessons] = useState<Lesson[]>([])
  const [attendance, setAttendance] = useState<Attendance[]>([])
  const [progress, setProgress] = useState<Progress[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.get("/api/sunday-school/my-children").then(res => {
      const myChildren = res.data.data || []
      setChildren(myChildren)
      if (myChildren.length > 0) {
        loadChildDetails(myChildren[0])
      } else {
        setLoading(false)
      }
    }).catch(() => setLoading(false))
  }, [])

  const loadChildDetails = (child: Child) => {
    setSelectedChild(child)
    Promise.all([
      api.get(`/api/sunday-school/children/${child.id}/lessons`).catch(() => ({ data: { data: [] } })),
      api.get(`/api/sunday-school/children/${child.id}/attendance`).catch(() => ({ data: { data: [] } })),
      api.get(`/api/sunday-school/children/${child.id}/progress`).catch(() => ({ data: { data: [] } })),
    ]).then(([l, a, p]) => {
      setLessons(l.data.data || [])
      setAttendance(a.data.data || [])
      setProgress(p.data.data || [])
      setLoading(false)
    })
  }

  if (loading) return <Skeleton className="h-96 w-full" />

  const attendancePct = attendance.length > 0
    ? Math.round((attendance.filter(a => a.present).length / attendance.length) * 100)
    : 0

  const latestLesson = lessons[0]
  const latestProgress = progress[0]
  const onTrack = latestProgress?.status !== "NEEDS_HELP"

  return (
    <PageTransition>
      <div className="space-y-6 text-white">
        {/* Parent header */}
        <div className="rounded-lg p-6" style={{ background: `linear-gradient(135deg, ${theme.accent}, ${theme.accentLight})` }}>
          <div className="flex items-center gap-3">
            <Users className="h-8 w-8 text-white" />
            <div>
              <h1 className="text-3xl font-bold text-white">My Children</h1>
              <p className="text-white/80 text-sm">Attendance, lessons &amp; progress</p>
            </div>
          </div>
        </div>

        {children.length === 0 ? (
          <Card className="bg-[#1E293B] border-0 shadow-lg">
            <CardContent className="p-8 text-center">
              <Sun className="h-12 w-12 mx-auto mb-2 text-gray-600" />
              <p className="text-gray-400">No children linked to your account.</p>
              <p className="text-sm text-gray-500 mt-1">Contact your church administrator to link your child.</p>
            </CardContent>
          </Card>
        ) : (
          <>
            {/* Child selector */}
            <div className="flex gap-2 overflow-x-auto pb-2">
              {children.map(c => (
                <Button
                  key={c.id}
                  variant={selectedChild?.id === c.id ? "default" : "outline"}
                  onClick={() => loadChildDetails(c)}
                  className="whitespace-nowrap"
                  style={selectedChild?.id === c.id ? { background: theme.accent, color: "white" } : {}}
                >
                  {c.childName}
                </Button>
              ))}
            </div>

            {selectedChild && (
              <>
                {/* Child summary card */}
                <Card style={{ background: theme.accentBg, borderColor: theme.accentLight }} className="border">
                  <CardContent className="p-5">
                    <h2 className="text-xl font-bold text-white">{selectedChild.childName}</h2>
                    <p className="text-sm text-gray-400">{selectedChild.className}</p>
                  </CardContent>
                </Card>

                {/* Stats grid */}
                <div className="grid gap-4 md:grid-cols-3">
                  <Card className="bg-[#1E293B] border-0 shadow-lg">
                    <CardContent className="p-4 flex items-center gap-3">
                      <Calendar className="h-8 w-8" style={{ color: theme.accent }} />
                      <div>
                        <p className="font-semibold text-white">{attendancePct}%</p>
                        <p className="text-sm text-gray-400">Attendance</p>
                      </div>
                    </CardContent>
                  </Card>
                  <Card className="bg-[#1E293B] border-0 shadow-lg">
                    <CardContent className="p-4 flex items-center gap-3">
                      <BookOpen className="h-8 w-8" style={{ color: theme.accent }} />
                      <div>
                        <p className="font-semibold text-white">{latestLesson?.title || "—"}</p>
                        <p className="text-sm text-gray-400">Latest Lesson</p>
                      </div>
                    </CardContent>
                  </Card>
                  <Card className="bg-[#1E293B] border-0 shadow-lg">
                    <CardContent className="p-4 flex items-center gap-3">
                      <TrendingUp className="h-8 w-8" style={{ color: theme.accent }} />
                      <div>
                        <p className="font-semibold text-white">{onTrack ? "On track" : "Needs help"}</p>
                        <p className="text-sm text-gray-400">Progress</p>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Teacher Note */}
                {latestProgress?.note && (
                  <Card className="bg-[#1E293B] border-0 shadow-lg">
                    <CardContent className="p-4">
                      <div className="flex items-center gap-2 mb-1">
                        <FileText className="h-4 w-4" style={{ color: theme.accent }} />
                        <p className="text-sm font-medium text-white">Teacher Note</p>
                      </div>
                      <p className="text-sm text-gray-400">{latestProgress.note}</p>
                    </CardContent>
                  </Card>
                )}

                {/* Attendance history */}
                {attendance.length > 0 && (
                  <div>
                    <h3 className="text-lg font-semibold text-white mb-3">Attendance History</h3>
                    <div className="space-y-2">
                      {attendance.map(a => (
                        <Card key={a.id} className="bg-[#1E293B] border-0 shadow-lg">
                          <CardContent className="p-3 flex items-center justify-between">
                            <span className="text-sm text-gray-300">{new Date(a.attendanceDate).toLocaleDateString()}</span>
                            <Badge style={{ background: a.present ? theme.accent : "#555", color: "white" }}>
                              {a.present ? "Present" : "Absent"}
                            </Badge>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </div>
                )}

                {/* Lessons */}
                {lessons.length > 0 && (
                  <div>
                    <h3 className="text-lg font-semibold text-white mb-3">Lessons</h3>
                    <div className="space-y-2">
                      {lessons.map(l => (
                        <Card key={l.id} className="bg-[#1E293B] border-0 shadow-lg">
                          <CardContent className="p-3 flex items-center justify-between">
                            <div>
                              <p className="text-sm font-medium text-white">{l.title}</p>
                              {l.bibleReference && <p className="text-xs text-gray-500">{l.bibleReference}</p>}
                            </div>
                            <span className="text-xs text-gray-500">{new Date(l.lessonDate).toLocaleDateString()}</span>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </div>
                )}
              </>
            )}
          </>
        )}
      </div>
    </PageTransition>
  )
}
