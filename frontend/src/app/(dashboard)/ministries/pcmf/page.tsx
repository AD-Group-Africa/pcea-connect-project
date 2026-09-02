"use client"
import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import api from "@/lib/api"
import { getUserId } from "@/lib/auth"
import { Users, Calendar, Briefcase, Heart, ArrowRight, Megaphone } from "lucide-react"
import Link from "next/link"

interface MinistryMember {
  id: string; userId: string; role: string; joinedAt: string
}
interface MinistryEvent {
  id: string; title: string; description: string; startTime: string; endTime: string | null; location: string
}
interface MinistryAnnouncement {
  id: string; title: string; content: string; authorId: string; createdAt: string; pinned: boolean
}
interface MinistryProject {
  id: string; name: string; description: string; startDate: string; endDate: string | null; status: string
}

export default function PCMFPage() {
  const [ministry, setMinistry] = useState<any>(null)
  const [members, setMembers] = useState<MinistryMember[]>([])
  const [events, setEvents] = useState<MinistryEvent[]>([])
  const [announcements, setAnnouncements] = useState<MinistryAnnouncement[]>([])
  const [projects, setProjects] = useState<MinistryProject[]>([])
  const [loading, setLoading] = useState(true)
  const userId = getUserId()

  useEffect(() => {
    // Find the PCMF ministry from all ministries
    api.get("/api/ministries").then(res => {
      const pcmf = (res.data.data || []).find((m: any) => m.type === "PCMF")
      if (!pcmf) { setLoading(false); return }
      setMinistry(pcmf)
      Promise.all([
        api.get(`/api/ministries/${pcmf.id}/members`).catch(() => ({ data: { data: [] } })),
        api.get(`/api/ministries/${pcmf.id}/events`).catch(() => ({ data: { data: [] } })),
        api.get(`/api/ministries/${pcmf.id}/announcements`).catch(() => ({ data: { data: [] } })),
        api.get(`/api/ministries/${pcmf.id}/projects`).catch(() => ({ data: { data: [] } })),
      ]).then(([m, e, a, p]) => {
        setMembers(m.data.data || [])
        setEvents(e.data.data || [])
        setAnnouncements(a.data.data || [])
        setProjects(p.data.data || [])
        setLoading(false)
      })
    }).catch(() => setLoading(false))
  }, [userId])

  if (loading) return <Skeleton className="h-96 w-full" />

  // PCMF visual identity: deep maroon
  const maroon = "#7B1E3A"
  const maroonLight = "#9B3355"
  const maroonBg = "rgba(123, 30, 58, 0.1)"

  return (
    <div className="space-y-6 text-white">
      {/* PCMF Header */}
      <div className="rounded-lg p-6" style={{ background: `linear-gradient(135deg, ${maroon}, ${maroonLight})` }}>
        <h1 className="text-3xl font-bold text-white">PCMF</h1>
        <p className="text-white/80 mt-1">PCEA Men's Christian Fellowship — Fellowship • Leadership • Professional Networking</p>
        {ministry?.description && <p className="text-white/60 text-sm mt-2">{ministry.description}</p>}
      </div>

      {!ministry ? (
        <Card className="bg-[#1E293B] border-0 shadow-lg">
          <CardContent className="p-8 text-center">
            <Users className="h-12 w-12 mx-auto mb-2 text-gray-600" />
            <p className="text-gray-400">PCMF ministry has not been set up for your congregation yet.</p>
            <p className="text-sm text-gray-500 mt-1">Contact your church administrator.</p>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Quick Stats */}
          <div className="grid gap-4 md:grid-cols-3">
            <Card style={{ background: maroonBg, borderColor: maroonLight }} className="border shadow-lg">
              <CardContent className="p-4 flex items-center gap-3">
                <Users className="h-8 w-8" style={{ color: maroon }} />
                <div>
                  <p className="font-semibold text-white">{members.length}</p>
                  <p className="text-sm text-gray-400">Members</p>
                </div>
              </CardContent>
            </Card>
            <Card style={{ background: maroonBg, borderColor: maroonLight }} className="border shadow-lg">
              <CardContent className="p-4 flex items-center gap-3">
                <Calendar className="h-8 w-8" style={{ color: maroon }} />
                <div>
                  <p className="font-semibold text-white">{events.length}</p>
                  <p className="text-sm text-gray-400">Upcoming Events</p>
                </div>
              </CardContent>
            </Card>
            <Card style={{ background: maroonBg, borderColor: maroonLight }} className="border shadow-lg">
              <CardContent className="p-4 flex items-center gap-3">
                <Briefcase className="h-8 w-8" style={{ color: maroon }} />
                <div>
                  <p className="font-semibold text-white">{projects.length}</p>
                  <p className="text-sm text-gray-400">Projects</p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Announcements */}
          {announcements.length > 0 && (
            <div>
              <h2 className="text-xl font-semibold mb-3 flex items-center gap-2">
                <Megaphone className="h-5 w-5" style={{ color: maroon }} /> Announcements
              </h2>
              <div className="space-y-2">
                {announcements.map(a => (
                  <Card key={a.id} className="bg-[#1E293B] border-0 shadow-lg">
                    <CardContent className="p-4">
                      <div className="flex items-center gap-2 mb-1">
                        {a.pinned && <Badge style={{ background: maroon, color: "white" }}>Pinned</Badge>}
                        <p className="font-medium text-white">{a.title}</p>
                      </div>
                      {a.content && <p className="text-sm text-gray-400">{a.content}</p>}
                      <p className="text-xs text-gray-500 mt-1">{new Date(a.createdAt).toLocaleString()}</p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {/* Events */}
          {events.length > 0 && (
            <div>
              <h2 className="text-xl font-semibold mb-3 flex items-center gap-2">
                <Calendar className="h-5 w-5" style={{ color: maroon }} /> Events
              </h2>
              <div className="grid gap-4 md:grid-cols-2">
                {events.map(e => (
                  <Card key={e.id} className="bg-[#1E293B] border-0 shadow-lg">
                    <CardHeader>
                      <CardTitle className="text-lg text-white">{e.title}</CardTitle>
                      {e.location && <p className="text-sm text-gray-400 flex items-center gap-1">📍 {e.location}</p>}
                    </CardHeader>
                    <CardContent>
                      {e.description && <p className="text-sm text-gray-400">{e.description}</p>}
                      <p className="text-xs text-gray-500 mt-2">
                        {new Date(e.startTime).toLocaleString()}
                      </p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {/* Projects */}
          {projects.length > 0 && (
            <div>
              <h2 className="text-xl font-semibold mb-3 flex items-center gap-2">
                <Briefcase className="h-5 w-5" style={{ color: maroon }} /> Projects
              </h2>
              <div className="space-y-2">
                {projects.map(p => (
                  <Card key={p.id} className="bg-[#1E293B] border-0 shadow-lg">
                    <CardContent className="p-4 flex items-center justify-between">
                      <div>
                        <p className="font-medium text-white">{p.name}</p>
                        {p.description && <p className="text-sm text-gray-400">{p.description}</p>}
                      </div>
                      <Badge variant="outline">{p.status}</Badge>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {/* Members */}
          {members.length > 0 && (
            <div>
              <h2 className="text-xl font-semibold mb-3 flex items-center gap-2">
                <Heart className="h-5 w-5" style={{ color: maroon }} /> Fellowship Members
              </h2>
              <div className="grid gap-2 md:grid-cols-3">
                {members.map(m => (
                  <Card key={m.id} className="bg-[#1E293B] border-0 shadow-lg">
                    <CardContent className="p-3 flex items-center justify-between">
                      <span className="text-sm text-gray-300">{m.userId.substring(0, 8)}...</span>
                      <Badge style={m.role === "LEADER" ? { background: maroon, color: "white" } : {}}>
                        {m.role}
                      </Badge>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {events.length === 0 && announcements.length === 0 && projects.length === 0 && members.length === 0 && (
            <Card className="bg-[#1E293B] border-0 shadow-lg">
              <CardContent className="p-8 text-center">
                <Users className="h-12 w-12 mx-auto mb-2 text-gray-600" />
                <p className="text-gray-400">No PCMF activities yet. Check back soon!</p>
              </CardContent>
            </Card>
          )}
        </>
      )}
    </div>
  )
}
