"use client"
import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { BookOpen, Lock, CheckCircle2, Circle, PlayCircle, ArrowRight, GraduationCap } from "lucide-react"
import { PageTransition } from "@/components/page-transition"
import api from "@/lib/api"

const accent = "#2563EB"
const accentLight = "#3B82F6"
const successColor = "#16A34A"
const lockedColor = "#6B7280"

interface Course { id: string; name: string; description: string; active: boolean }
interface Module { id: string; name: string; description: string; sequenceOrder: number }
interface Lesson { id: string; title: string; content: string; bibleReference: string; sequenceOrder: number }
interface Enrollment { id: string; courseId: string; courseName: string; status: string }
interface Journey {
  enrollmentId: string; courseId: string; courseName: string;
  totalLessons: number; completedLessons: number; percentage: number; enrollmentStatus: string
}
interface Progress { id: string; lessonId: string; status: string }

export default function CatechismPage() {
  const [courses, setCourses] = useState<Course[]>([])
  const [enrollments, setEnrollments] = useState<Enrollment[]>([])
  const [journey, setJourney] = useState<Journey | null>(null)
  const [modules, setModules] = useState<Module[]>([])
  const [lessons, setLessons] = useState<Record<string, Lesson[]>>({})
  const [progress, setProgress] = useState<Progress[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([
      api.get("/api/catechism/courses").catch(() => ({ data: { data: [] } })),
      api.get("/api/catechism/my-enrollments").catch(() => ({ data: { data: [] } })),
    ]).then(([c, e]) => {
      setCourses(c.data.data || [])
      const myEnrollments = e.data.data || []
      setEnrollments(myEnrollments)

      if (myEnrollments.length > 0) {
        loadJourney(myEnrollments[0])
      } else {
        setLoading(false)
      }
    }).catch(() => setLoading(false))
  }, [])

  const loadJourney = (enrollment: Enrollment) => {
    Promise.all([
      api.get(`/api/catechism/enrollments/${enrollment.id}/journey`).catch(() => ({ data: { data: null } })),
      api.get(`/api/catechism/courses/${enrollment.courseId}/modules`).catch(() => ({ data: { data: [] } })),
      api.get(`/api/catechism/enrollments/${enrollment.id}/progress`).catch(() => ({ data: { data: [] } })),
    ]).then(([j, mods, prog]) => {
      setJourney(j.data.data)
      const moduleList = mods.data.data || []
      setModules(moduleList.sort((a: Module, b: Module) => a.sequenceOrder - b.sequenceOrder))
      setProgress(prog.data.data || [])

      // Load lessons for each module
      Promise.all(moduleList.map((m: Module) =>
        api.get(`/api/catechism/modules/${m.id}/lessons`).catch(() => ({ data: { data: [] } }))
      )).then(results => {
        const lessonMap: Record<string, Lesson[]> = {}
        moduleList.forEach((m: Module, i: number) => {
          lessonMap[m.id] = (results[i].data.data || []).sort((a: Lesson, b: Lesson) => a.sequenceOrder - b.sequenceOrder)
        })
        setLessons(lessonMap)
        setLoading(false)
      })
    })
  }

  const handleEnroll = async (course: Course) => {
    try {
      const res = await api.post("/api/catechism/enroll", { courseId: course.id })
      const enrollment = res.data.data
      setEnrollments([enrollment])
      loadJourney(enrollment)
    } catch { /* empty */ }
  }

  if (loading) return <Skeleton className="h-96 w-full" />

  return (
    <PageTransition>
      <div className="space-y-6 text-white">
        {/* Catechism header — calm, educational, blue/green */}
        <div className="rounded-lg p-6" style={{ background: `linear-gradient(135deg, ${accent}, ${accentLight})` }}>
          <div className="flex items-center gap-3">
            <GraduationCap className="h-8 w-8 text-white" />
            <div>
              <h1 className="text-3xl font-bold text-white">Catechism</h1>
              <p className="text-white/80 text-sm">My Journey</p>
            </div>
          </div>
        </div>

        {enrollments.length === 0 ? (
          <>
            {/* No enrollment — show available courses */}
            <p className="text-gray-400">Available courses:</p>
            {courses.length === 0 ? (
              <Card className="bg-[#1E293B] border-0 shadow-lg">
                <CardContent className="p-8 text-center">
                  <BookOpen className="h-12 w-12 mx-auto mb-2 text-gray-600" />
                  <p className="text-gray-400">No catechism courses available yet.</p>
                  <p className="text-sm text-gray-500 mt-1">Contact your church administrator.</p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-2">
                {courses.map(c => (
                  <Card key={c.id} className="bg-[#1E293B] border-0 shadow-lg">
                    <CardContent className="p-4 flex items-center justify-between">
                      <div>
                        <p className="font-medium text-white">{c.name}</p>
                        {c.description && <p className="text-sm text-gray-400">{c.description}</p>}
                      </div>
                      <Button onClick={() => handleEnroll(c)} style={{ background: accent, color: "white" }}>
                        Enroll <ArrowRight className="h-4 w-4 ml-1" />
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </>
        ) : journey ? (
          <>
            {/* Progress overview */}
            <Card className="bg-[#1E293B] border-0 shadow-lg">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <p className="text-sm text-gray-400">Course</p>
                    <p className="font-semibold text-white">{journey.courseName}</p>
                  </div>
                  <Badge style={{ background: accent, color: "white" }}>{journey.percentage}%</Badge>
                </div>
                <div className="w-full bg-gray-700 rounded-full h-3">
                  <div className="rounded-full h-3 transition-all" style={{ width: `${journey.percentage}%`, background: successColor }} />
                </div>
                <p className="text-xs text-gray-500 mt-2">{journey.completedLessons}/{journey.totalLessons} lessons completed</p>
              </CardContent>
            </Card>

            {/* Modules with lessons */}
            <div className="space-y-4">
              {modules.map((m, idx) => {
                const moduleLessons = lessons[m.id] || []
                const moduleCompleted = moduleLessons.every(l =>
                  progress.some(p => p.lessonId === l.id && p.status === "COMPLETED")
                )
                const isCurrent = !moduleCompleted && idx > 0 && modules.slice(0, idx).every((prevM) => {
                  const prevLessons = lessons[prevM.id] || []
                  return prevLessons.every(l => progress.some(p => p.lessonId === l.id && p.status === "COMPLETED"))
                })

                return (
                  <Card key={m.id} className="bg-[#1E293B] border-0 shadow-lg">
                    <CardHeader>
                      <CardTitle className="text-lg flex items-center gap-2">
                        {moduleCompleted ? (
                          <CheckCircle2 className="h-5 w-5" style={{ color: successColor }} />
                        ) : isCurrent ? (
                          <PlayCircle className="h-5 w-5" style={{ color: accent }} />
                        ) : (
                          <Lock className="h-5 w-5" style={{ color: lockedColor }} />
                        )}
                        Module {idx + 1}: {m.name}
                        {moduleCompleted && <Badge style={{ background: successColor, color: "white" }}>✓</Badge>}
                        {isCurrent && <Badge style={{ background: accent, color: "white" }}>CURRENT</Badge>}
                      </CardTitle>
                      {m.description && <p className="text-sm text-gray-400">{m.description}</p>}
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        {moduleLessons.map(l => {
                          const lessonProgress = progress.find(p => p.lessonId === l.id)
                          const status = lessonProgress?.status || "NOT_STARTED"
                          return (
                            <div key={l.id} className="flex items-center gap-2 p-2 rounded bg-[#0F172A]">
                              {status === "COMPLETED" ? (
                                <CheckCircle2 className="h-4 w-4" style={{ color: successColor }} />
                              ) : status === "IN_PROGRESS" ? (
                                <PlayCircle className="h-4 w-4" style={{ color: accent }} />
                              ) : (
                                <Circle className="h-4 w-4 text-gray-600" />
                              )}
                              <div className="flex-1">
                                <p className="text-sm text-white">{l.title}</p>
                                {l.bibleReference && <p className="text-xs text-gray-500">{l.bibleReference}</p>}
                              </div>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={async () => {
                                  const newStatus = status === "COMPLETED" ? "IN_PROGRESS" : "COMPLETED"
                                  try {
                                    await api.post("/api/catechism/progress", {
                                      enrollmentId: journey.enrollmentId,
                                      lessonId: l.id,
                                      status: newStatus
                                    })
                                    loadJourney(enrollments[0])
                                  } catch { /* empty */ }
                                }}
                              >
                                {status === "COMPLETED" ? "Completed" : "Continue"}
                              </Button>
                            </div>
                          )
                        })}
                        {moduleLessons.length === 0 && (
                          <p className="text-sm text-gray-500">No lessons in this module yet.</p>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          </>
        ) : null}
      </div>
    </PageTransition>
  )
}
