"use client"
import { useEffect, useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  MinistryHero, MinistryStatsGrid, MinistryEvents, MinistryAnnouncements,
  MinistryProjects, MinistryEmptyState, MinistryLoadingSkeleton
} from "@/components/ministry/ministry-components"
import { getTheme } from "@/lib/ministry-themes"
import api from "@/lib/api"
import { Users, Calendar, Briefcase, Heart, HandHeart, Sparkles } from "lucide-react"

interface MinistryEvent { id: string; title: string; description: string; startTime: string; endTime: string | null; location: string }
interface MinistryAnnouncement { id: string; title: string; content: string; authorId: string; createdAt: string; pinned: boolean }
interface MinistryProject { id: string; name: string; description: string; startDate: string; endDate: string | null; status: string }
interface MinistryMember { id: string; userId: string; role: string; joinedAt: string }

export default function GuildPage() {
  const theme = getTheme("WOMANS_GUILD")
  const [ministry, setMinistry] = useState<any>(null)
  const [members, setMembers] = useState<MinistryMember[]>([])
  const [events, setEvents] = useState<MinistryEvent[]>([])
  const [announcements, setAnnouncements] = useState<MinistryAnnouncement[]>([])
  const [projects, setProjects] = useState<MinistryProject[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.get("/api/ministries").then(res => {
      const guild = (res.data.data || []).find((m: any) => m.type === "WOMANS_GUILD")
      if (!guild) { setLoading(false); return }
      setMinistry(guild)
      Promise.all([
        api.get(`/api/ministries/${guild.id}/members`).catch(() => ({ data: { data: [] } })),
        api.get(`/api/ministries/${guild.id}/events`).catch(() => ({ data: { data: [] } })),
        api.get(`/api/ministries/${guild.id}/announcements`).catch(() => ({ data: { data: [] } })),
        api.get(`/api/ministries/${guild.id}/projects`).catch(() => ({ data: { data: [] } })),
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
      {/* Guild hero — warm, dignified, calm */}
      <div className="rounded-lg p-6" style={{ background: `linear-gradient(135deg, ${theme.accent}, ${theme.accentLight})` }}>
        <h1 className="text-3xl font-bold text-white">WOMAN&apos;S GUILD</h1>
        <p className="text-white/80 mt-1">Faith &bull; Fellowship &bull; Service</p>
        {ministry?.description && <p className="text-white/60 text-sm mt-2">{ministry.description}</p>}
      </div>

      {!ministry ? (
        <MinistryEmptyState theme={theme} message="The Woman's Guild ministry has not been set up for your congregation yet." />
      ) : (
        <>
          {/* Next Fellowship highlight — elegant, understated */}
          {events.length > 0 && (
            <Card style={{ background: theme.accentBg, borderColor: theme.accentLight }} className="border">
              <CardContent className="p-5 flex items-center justify-between">
                <div>
                  <p className="text-xs uppercase tracking-wide font-semibold" style={{ color: theme.accent }}>NEXT FELLOWSHIP</p>
                  <p className="text-lg font-bold text-white mt-1">{events[0].title}</p>
                  <p className="text-sm text-gray-400">{new Date(events[0].startTime).toLocaleString()}</p>
                </div>
                <Heart className="h-10 w-10" style={{ color: theme.accent }} />
              </CardContent>
            </Card>
          )}

          {/* Stats */}
          <MinistryStatsGrid theme={theme} stats={[
            { icon: Users, value: members.length, label: "Members" },
            { icon: Calendar, value: events.length, label: "Upcoming Events" },
            { icon: HandHeart, value: projects.length, label: "Service Projects" },
          ]} />

          <MinistryAnnouncements theme={theme} announcements={announcements} />
          <MinistryProjects theme={theme} projects={projects} />
          <MinistryEvents theme={theme} events={events} />

          {events.length === 0 && announcements.length === 0 && projects.length === 0 && members.length === 0 && (
            <MinistryEmptyState theme={theme} message="No Guild activities yet. Check back soon!" />
          )}
        </>
      )}
    </div>
  )
}
