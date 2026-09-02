"use client"
import { useEffect, useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  MinistryStatsGrid, MinistryAnnouncements, MinistryProjects,
  MinistryEmptyState, MinistryLoadingSkeleton
} from "@/components/ministry/ministry-components"
import { getTheme } from "@/lib/ministry-themes"
import api from "@/lib/api"
import { Users, Calendar, Briefcase, Zap, Music, Trophy, BookOpen, Heart, ArrowRight } from "lucide-react"
import Link from "next/link"

interface MinistryEvent { id: string; title: string; description: string; startTime: string; endTime: string | null; location: string }
interface MinistryAnnouncement { id: string; title: string; content: string; authorId: string; createdAt: string; pinned: boolean }
interface MinistryProject { id: string; name: string; description: string; startDate: string; endDate: string | null; status: string }
interface MinistryMember { id: string; userId: string; role: string; joinedAt: string }

// Event type detection for visual badges
function getEventIcon(title: string): any {
  const t = title.toLowerCase()
  if (t.includes("worship") || t.includes("music") || t.includes("praise")) return Music
  if (t.includes("sport") || t.includes("football") || t.includes("soccer") || t.includes("game")) return Trophy
  if (t.includes("bible") || t.includes("study") || t.includes("lesson")) return BookOpen
  if (t.includes("service") || t.includes("community") || t.includes("outreach")) return Heart
  return Calendar
}

export default function YouthPage() {
  const theme = getTheme("YOUTH_FELLOWSHIP")
  const [ministry, setMinistry] = useState<any>(null)
  const [members, setMembers] = useState<MinistryMember[]>([])
  const [events, setEvents] = useState<MinistryEvent[]>([])
  const [announcements, setAnnouncements] = useState<MinistryAnnouncement[]>([])
  const [projects, setProjects] = useState<MinistryProject[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.get("/api/ministries").then(res => {
      const youth = (res.data.data || []).find((m: any) => m.type === "YOUTH_FELLOWSHIP")
      if (!youth) { setLoading(false); return }
      setMinistry(youth)
      Promise.all([
        api.get(`/api/ministries/${youth.id}/members`).catch(() => ({ data: { data: [] } })),
        api.get(`/api/ministries/${youth.id}/events`).catch(() => ({ data: { data: [] } })),
        api.get(`/api/ministries/${youth.id}/announcements`).catch(() => ({ data: { data: [] } })),
        api.get(`/api/ministries/${youth.id}/projects`).catch(() => ({ data: { data: [] } })),
      ]).then(([m, e, a, p]) => {
        setMembers(m.data.data || [])
        setEvents(e.data.data || [])
        setAnnouncements(a.data.data || [])
        setProjects(p.data.data || [])
        setLoading(false)
      })
    }).catch(() => setLoading(false))
  }, [])

  if (loading) return <MinistryLoadingSkeleton />

  return (
    <div className="space-y-6 text-white">
      {/* Youth hero — energetic, bold */}
      <div className="rounded-lg p-6" style={{ background: `linear-gradient(135deg, ${theme.accent}, ${theme.accentLight})` }}>
        <h1 className="text-3xl font-bold text-white">YOUTH</h1>
        <p className="text-white/80 mt-1">What&apos;s Happening?</p>
        {ministry?.description && <p className="text-white/60 text-sm mt-2">{ministry.description}</p>}
      </div>

      {!ministry ? (
        <MinistryEmptyState theme={theme} message="Youth Fellowship has not been set up for your congregation yet." />
      ) : (
        <>
          {/* What's Happening — visual event grid with emoji-style icons */}
          {events.length > 0 && (
            <div>
              <h2 className="text-xl font-semibold mb-3 flex items-center gap-2 text-white">
                <Zap className="h-5 w-5" style={{ color: theme.accent }} /> What&apos;s Happening
              </h2>
              <div className="grid gap-3 grid-cols-2 md:grid-cols-3">
                {events.map(e => {
                  const EventIcon = getEventIcon(e.title)
                  return (
                    <Card key={e.id} className="bg-[#1E293B] border-0 shadow-lg">
                      <CardContent className="p-4">
                        <div className="flex items-center gap-2 mb-2">
                          <EventIcon className="h-6 w-6" style={{ color: theme.accent }} />
                        </div>
                        <p className="font-medium text-white text-sm">{e.title}</p>
                        <p className="text-xs text-gray-500 mt-1">{new Date(e.startTime).toLocaleDateString()}</p>
                      </CardContent>
                    </Card>
                  )
                })}
              </div>
            </div>
          )}

          {/* COMING UP — next event highlighted */}
          {events.length > 0 && (
            <Card style={{ background: theme.accentBg, borderColor: theme.accentLight }} className="border">
              <CardContent className="p-5 flex items-center justify-between">
                <div>
                  <p className="text-xs uppercase tracking-wide font-semibold" style={{ color: theme.accent }}>COMING UP</p>
                  <p className="text-lg font-bold text-white mt-1">{events[0].title}</p>
                  <p className="text-sm text-gray-400">{new Date(events[0].startTime).toLocaleString()}</p>
                </div>
                <Calendar className="h-10 w-10" style={{ color: theme.accent }} />
              </CardContent>
            </Card>
          )}

          <MinistryStatsGrid theme={theme} stats={[
            { icon: Users, value: members.length, label: "My Group" },
            { icon: Calendar, value: events.length, label: "Events" },
            { icon: Briefcase, value: projects.length, label: "Serve" },
          ]} />

          <MinistryAnnouncements theme={theme} announcements={announcements} />
          <MinistryProjects theme={theme} projects={projects} />

          {events.length === 0 && announcements.length === 0 && projects.length === 0 && members.length === 0 && (
            <MinistryEmptyState theme={theme} message="No youth activities yet. Check back soon!" />
          )}
        </>
      )}
    </div>
  )
}
