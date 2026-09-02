"use client"
import { useEffect, useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  MinistryHero, MinistryStatsGrid, MinistryEvents, MinistryAnnouncements,
  MinistryProjects, MinistryEmptyState, MinistryLoadingSkeleton
} from "@/components/ministry/ministry-components"
import { getTheme } from "@/lib/ministry-themes"
import api from "@/lib/api"
import { Users, Calendar, Briefcase, Target, GraduationCap, Rocket, ArrowRight } from "lucide-react"
import Link from "next/link"

interface MinistryEvent { id: string; title: string; description: string; startTime: string; endTime: string | null; location: string }
interface MinistryAnnouncement { id: string; title: string; content: string; authorId: string; createdAt: string; pinned: boolean }
interface MinistryProject { id: string; name: string; description: string; startDate: string; endDate: string | null; status: string }
interface MinistryMember { id: string; userId: string; role: string; joinedAt: string }

export default function YPCMFPage() {
  const theme = getTheme("YPCMF")
  const [ministry, setMinistry] = useState<any>(null)
  const [members, setMembers] = useState<MinistryMember[]>([])
  const [events, setEvents] = useState<MinistryEvent[]>([])
  const [announcements, setAnnouncements] = useState<MinistryAnnouncement[]>([])
  const [projects, setProjects] = useState<MinistryProject[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.get("/api/ministries").then(res => {
      const ypcmf = (res.data.data || []).find((m: any) => m.type === "YPCMF")
      if (!ypcmf) { setLoading(false); return }
      setMinistry(ypcmf)
      Promise.all([
        api.get(`/api/ministries/${ypcmf.id}/members`).catch(() => ({ data: { data: [] } })),
        api.get(`/api/ministries/${ypcmf.id}/events`).catch(() => ({ data: { data: [] } })),
        api.get(`/api/ministries/${ypcmf.id}/announcements`).catch(() => ({ data: { data: [] } })),
        api.get(`/api/ministries/${ypcmf.id}/projects`).catch(() => ({ data: { data: [] } })),
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

  // YPCMF represents opportunities & mentorship through reusable content/events/projects
  const upcomingEvents = events.filter(e => new Date(e.startTime) >= new Date()).length
  const activeProjects = projects.length

  return (
    <div className="space-y-6 text-white">
      <MinistryHero
        theme={theme}
        name="YPCMF"
        description={ministry?.description}
        actionLabel="Join Network"
        actionHref="/ministries"
      />

      {!ministry ? (
        <MinistryEmptyState theme={theme} message="YPCMF has not been set up for your congregation yet. Contact your church administrator." />
      ) : (
        <>
          {/* NEXT highlight — the next upcoming event gets prominence */}
          {events.length > 0 && (
            <Card style={{ background: theme.accentBg, borderColor: theme.accentLight }} className="border">
              <CardContent className="p-5 flex items-center justify-between">
                <div>
                  <p className="text-xs uppercase tracking-wide font-semibold" style={{ color: theme.accent }}>NEXT</p>
                  <p className="text-lg font-bold text-white mt-1">{events[0].title}</p>
                  <p className="text-sm text-gray-400">{new Date(events[0].startTime).toLocaleString()}</p>
                </div>
                <Calendar className="h-10 w-10" style={{ color: theme.accent }} />
              </CardContent>
            </Card>
          )}

          {/* Stats — career/network/mentorship represented through real data */}
          <MinistryStatsGrid theme={theme} stats={[
            { icon: Users, value: members.length, label: "Network" },
            { icon: Rocket, value: activeProjects, label: "Opportunities" },
            { icon: Calendar, value: upcomingEvents, label: "Events" },
          ]} />

          {/* Mentorship — represented through projects (real data) */}
          {activeProjects > 0 && (
            <Card className="bg-[#1E293B] border-0 shadow-lg">
              <CardContent className="p-4 flex items-center gap-3">
                <GraduationCap className="h-8 w-8" style={{ color: theme.accent }} />
                <div>
                  <p className="font-semibold text-white">{activeProjects} Active Initiative{activeProjects !== 1 ? "s" : ""}</p>
                  <p className="text-sm text-gray-400">Mentorship, career forums &amp; service projects</p>
                </div>
              </CardContent>
            </Card>
          )}

          <MinistryAnnouncements theme={theme} announcements={announcements} />
          <MinistryEvents theme={theme} events={events} />
          <MinistryProjects theme={theme} projects={projects} />

          {events.length === 0 && announcements.length === 0 && projects.length === 0 && members.length === 0 && (
            <MinistryEmptyState theme={theme} message="No YPCMF activities yet. Check back soon!" />
          )}
        </>
      )}
    </div>
  )
}
