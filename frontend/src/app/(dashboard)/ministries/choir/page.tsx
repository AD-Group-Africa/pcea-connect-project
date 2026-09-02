"use client"
import { useEffect, useState } from "react"
import { MinistryHero, MinistryStatsGrid, MinistryEvents, MinistryAnnouncements, MinistryProjects, MinistryEmptyState, MinistryLoadingSkeleton } from "@/components/ministry/ministry-components"
import { getTheme } from "@/lib/ministry-themes"
import api from "@/lib/api"
import { Users, Calendar, Briefcase, Music } from "lucide-react"

interface MinistryEvent { id: string; title: string; description: string; startTime: string; endTime: string | null; location: string }
interface MinistryAnnouncement { id: string; title: string; content: string; authorId: string; createdAt: string; pinned: boolean }
interface MinistryProject { id: string; name: string; description: string; startDate: string; endDate: string | null; status: string }
interface MinistryMember { id: string; userId: string; role: string; joinedAt: string }

export default function ChoirPage() {
  const theme = getTheme("CHOIR")
  const [ministry, setMinistry] = useState<any>(null)
  const [members, setMembers] = useState<MinistryMember[]>([])
  const [events, setEvents] = useState<MinistryEvent[]>([])
  const [announcements, setAnnouncements] = useState<MinistryAnnouncement[]>([])
  const [projects, setProjects] = useState<MinistryProject[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.get("/api/ministries").then(res => {
      const choir = (res.data.data || []).find((m: any) => m.type === "CHOIR")
      if (!choir) { setLoading(false); return }
      setMinistry(choir)
      Promise.all([
        api.get(`/api/ministries/${choir.id}/members`).catch(() => ({ data: { data: [] } })),
        api.get(`/api/ministries/${choir.id}/events`).catch(() => ({ data: { data: [] } })),
        api.get(`/api/ministries/${choir.id}/announcements`).catch(() => ({ data: { data: [] } })),
        api.get(`/api/ministries/${choir.id}/projects`).catch(() => ({ data: { data: [] } })),
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
      <MinistryHero theme={theme} name="Choir" description={ministry?.description} />
      {!ministry ? (
        <MinistryEmptyState theme={theme} message="Choir ministry has not been set up for your congregation yet." />
      ) : (
        <>
          <MinistryStatsGrid theme={theme} stats={[
            { icon: Users, value: members.length, label: "Members" },
            { icon: Calendar, value: events.length, label: "Practices" },
            { icon: Music, value: projects.length, label: "Projects" },
          ]} />
          <MinistryAnnouncements theme={theme} announcements={announcements} />
          <MinistryEvents theme={theme} events={events} />
          <MinistryProjects theme={theme} projects={projects} />
        </>
      )}
    </div>
  )
}
