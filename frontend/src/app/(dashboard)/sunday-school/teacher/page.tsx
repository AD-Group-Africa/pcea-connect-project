"use client"
import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { GraduationCap, Users, Calendar, BookOpen, ClipboardList, Check, X } from "lucide-react"
import { PageTransition } from "@/components/page-transition"
import { getTheme } from "@/lib/ministry-themes"
import api from "@/lib/api"

const theme = getTheme("CHURCH_SCHOOL")

interface SSClass {
  id: string; name: string; ageGroup: string; congregationId: string
}
interface Child {
  id: string; childName: string; className: string
}
interface Lesson {
  id: string; title: string; bibleReference: string; lessonDate: string
}
interface ClassStats {
  classId: string; learnerCount: number; presentToday: number;
  todaysLessonTitle: string | null; todaysLessonReference: string | null
}

export default function SundaySchoolTeacherPage() {
  const [classes, setClasses] = useState<SSClass[]>([])
  const [selectedClass, setSelectedClass] = useState<SSClass | null>(null)
  const [children, setChildren] = useState<Child[]>([])
  const [lessons, setLessons] = useState<Lesson[]>([])
  const [stats, setStats] = useState<ClassStats | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.get("/api/sunday-school/classes").then(res => {
      const myClasses = res.data.data || []
      setClasses(myClasses)
      if (myClasses.length > 0) {
        loadClassDetails(myClasses[0])
      } else {
        setLoading(false)
      }
    }).catch(() => setLoading(false))
  }, [])

  const loadClassDetails = (ssClass: SSClass) => {
    setSelectedClass(ssClass)
    Promise.all([
      api.get(`/api/sunday-school/classes/${ssClass.id}/children`).catch(() => ({ data: { data: [] } })),
      api.get(`/api/sunday-school/classes/${ssClass.id}/lessons`).catch(() => ({ data: { data: [] } })),
      api.get(`/api/sunday-school/classes/${ssClass.id}/stats`).catch(() => ({ data: { data: null } })),
    ]).then(([c, l, s]) => {
      setChildren(c.data.data || [])
      setLessons(l.data.data || [])
      setStats(s.data.data)
      setLoading(false)
    })
  }

  const takeAttendance = async (childId: string, lessonId: string, present: boolean) => {
    try {
      await api.post("/api/sunday-school/attendance", {
        childId, lessonId, present, note: ""
      })
    } catch { /* teacher may not have a lesson yet */ }
  }

  if (loading) return <Skeleton className="h-96 w-full" />

  return (
    <PageTransition>
      <div className="space-y-6 text-white">
        {/* Teacher header */}
        <div className="rounded-lg p-6" style={{ background: `linear-gradient(135deg, ${theme.accent}, ${theme.accentLight})` }}>
          <div className="flex items-center gap-3">
            <GraduationCap className="h-8 w-8 text-white" />
            <div>
              <h1 className="text-3xl font-bold text-white">Sunday School</h1>
              <p className="text-white/80 text-sm">
                {selectedClass ? selectedClass.name : "Teacher Dashboard"}
              </p>
            </div>
          </div>
        </div>

        {classes.length === 0 ? (
          <Card className="bg-[#1E293B] border-0 shadow-lg">
            <CardContent className="p-8 text-center">
              <Users className="h-12 w-12 mx-auto mb-2 text-gray-600" />
              <p className="text-gray-400">No classes assigned to you yet.</p>
              <p className="text-sm text-gray-500 mt-1">Contact your church administrator.</p>
            </CardContent>
          </Card>
        ) : (
          <>
            {/* Class selector */}
            <div className="flex gap-2 overflow-x-auto pb-2">
              {classes.map(c => (
                <Button
                  key={c.id}
                  variant={selectedClass?.id === c.id ? "default" : "outline"}
                  onClick={() => loadClassDetails(c)}
                  className="whitespace-nowrap"
                  style={selectedClass?.id === c.id ? { background: theme.accent, color: "white" } : {}}
                >
                  {c.name}
                </Button>
              ))}
            </div>

            {selectedClass && stats && (
              <>
                {/* Stats grid */}
                <div className="grid gap-4 md:grid-cols-3">
                  <Card className="bg-[#1E293B] border-0 shadow-lg">
                    <CardContent className="p-4 flex items-center gap-3">
                      <Users className="h-8 w-8" style={{ color: theme.accent }} />
                      <div>
                        <p className="font-semibold text-white">{stats.learnerCount}</p>
                        <p className="text-sm text-gray-400">Learners</p>
                      </div>
                    </CardContent>
                  </Card>
                  <Card className="bg-[#1E293B] border-0 shadow-lg">
                    <CardContent className="p-4 flex items-center gap-3">
                      <ClipboardList className="h-8 w-8" style={{ color: theme.accent }} />
                      <div>
                        <p className="font-semibold text-white">{stats.presentToday} / {stats.learnerCount}</p>
                        <p className="text-sm text-gray-400">Today&apos;s Attendance</p>
                      </div>
                    </CardContent>
                  </Card>
                  <Card className="bg-[#1E293B] border-0 shadow-lg">
                    <CardContent className="p-4 flex items-center gap-3">
                      <BookOpen className="h-8 w-8" style={{ color: theme.accent }} />
                      <div>
                        <p className="font-semibold text-white text-sm">{stats.todaysLessonTitle || "No lesson today"}</p>
                        {stats.todaysLessonReference && (
                          <p className="text-xs text-gray-500">{stats.todaysLessonReference}</p>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Learners list */}
                <div>
                  <h3 className="text-lg font-semibold text-white mb-3">Learners</h3>
                  {children.length === 0 ? (
                    <p className="text-gray-500 text-sm">No children enrolled in this class yet.</p>
                  ) : (
                    <div className="space-y-2">
                      {children.map(child => (
                        <Card key={child.id} className="bg-[#1E293B] border-0 shadow-lg">
                          <CardContent className="p-3 flex items-center justify-between">
                            <div>
                              <p className="text-sm font-medium text-white">{child.childName}</p>
                            </div>
                            {stats.todaysLessonTitle && lessons[0] && (
                              <div className="flex gap-1">
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => takeAttendance(child.id, lessons[0].id, true)}
                                  className="h-8 px-2"
                                >
                                  <Check className="h-4 w-4 text-green-400" />
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => takeAttendance(child.id, lessons[0].id, false)}
                                  className="h-8 px-2"
                                >
                                  <X className="h-4 w-4 text-red-400" />
                                </Button>
                              </div>
                            )}
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  )}
                </div>

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
