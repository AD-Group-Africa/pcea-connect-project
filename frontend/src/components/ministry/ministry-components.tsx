"use client"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { Calendar, Megaphone, Briefcase, Users, ArrowRight, Clock, MapPin } from "lucide-react"
import Link from "next/link"
import { MinistryTheme } from "@/lib/ministry-themes"

// ── MinistryHero ─────────────────────────────────────────────────────

export function MinistryHero({ theme, name, description, actionLabel, actionHref }: {
  theme: MinistryTheme
  name: string
  description?: string
  actionLabel?: string
  actionHref?: string
}) {
  return (
    <div className="rounded-lg p-6" style={{ background: `linear-gradient(135deg, ${theme.accent}, ${theme.accentLight})` }}>
      <h1 className="text-3xl font-bold text-white">{name}</h1>
      <p className="text-white/80 mt-1">{theme.tagline}</p>
      {description && <p className="text-white/60 text-sm mt-2">{description}</p>}
      <p className="text-white/50 text-xs mt-2">{theme.personality}</p>
      {actionLabel && actionHref && (
        <Link href={actionHref} className="inline-flex items-center gap-1 mt-3 text-white/90 text-sm font-medium hover:text-white">
          {actionLabel} <ArrowRight className="h-4 w-4" />
        </Link>
      )}
    </div>
  )
}

// ── MinistryStatCard ─────────────────────────────────────────────────

export function MinistryStatCard({ theme, icon: Icon, value, label }: {
  theme: MinistryTheme
  icon: any
  value: string | number
  label: string
}) {
  return (
    <Card style={{ background: theme.accentBg, borderColor: theme.accentLight }} className="border shadow-lg">
      <CardContent className="p-4 flex items-center gap-3">
        <Icon className="h-8 w-8" style={{ color: theme.accent }} />
        <div>
          <p className="font-semibold text-white">{value}</p>
          <p className="text-sm text-gray-400">{label}</p>
        </div>
      </CardContent>
    </Card>
  )
}

// ── MinistryStatsGrid ─────────────────────────────────────────────────

export function MinistryStatsGrid({ theme, stats }: {
  theme: MinistryTheme
  stats: { icon: any; value: string | number; label: string }[]
}) {
  return (
    <div className="grid gap-4 md:grid-cols-3">
      {stats.map((s, i) => (
        <MinistryStatCard key={i} theme={theme} icon={s.icon} value={s.value} label={s.label} />
      ))}
    </div>
  )
}

// ── MinistryEvents ───────────────────────────────────────────────────

interface MinistryEvent {
  id: string; title: string; description: string; startTime: string; endTime: string | null; location: string
}

export function MinistryEvents({ theme, events }: { theme: MinistryTheme; events: MinistryEvent[] }) {
  if (events.length === 0) return null
  return (
    <div>
      <h2 className="text-xl font-semibold mb-3 flex items-center gap-2 text-white">
        <Calendar className="h-5 w-5" style={{ color: theme.accent }} /> Events
      </h2>
      <div className="grid gap-4 md:grid-cols-2">
        {events.map(e => (
          <Card key={e.id} className="bg-[#1E293B] border-0 shadow-lg">
            <CardHeader>
              <CardTitle className="text-lg text-white">{e.title}</CardTitle>
              {e.location && <p className="text-sm text-gray-400 flex items-center gap-1"><MapPin className="h-3 w-3" /> {e.location}</p>}
            </CardHeader>
            <CardContent>
              {e.description && <p className="text-sm text-gray-400">{e.description}</p>}
              <p className="text-xs text-gray-500 mt-2 flex items-center gap-1">
                <Clock className="h-3 w-3" /> {new Date(e.startTime).toLocaleString()}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}

// ── MinistryAnnouncements ─────────────────────────────────────────────

interface MinistryAnnouncement {
  id: string; title: string; content: string; authorId: string; createdAt: string; pinned: boolean
}

export function MinistryAnnouncements({ theme, announcements }: { theme: MinistryTheme; announcements: MinistryAnnouncement[] }) {
  if (announcements.length === 0) return null
  return (
    <div>
      <h2 className="text-xl font-semibold mb-3 flex items-center gap-2 text-white">
        <Megaphone className="h-5 w-5" style={{ color: theme.accent }} /> Announcements
      </h2>
      <div className="space-y-2">
        {announcements.map(a => (
          <Card key={a.id} className="bg-[#1E293B] border-0 shadow-lg">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-1">
                {a.pinned && <Badge style={{ background: theme.accent, color: "white" }}>Pinned</Badge>}
                <p className="font-medium text-white">{a.title}</p>
              </div>
              {a.content && <p className="text-sm text-gray-400">{a.content}</p>}
              <p className="text-xs text-gray-500 mt-1">{new Date(a.createdAt).toLocaleString()}</p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}

// ── MinistryProjects ──────────────────────────────────────────────────

interface MinistryProject {
  id: string; name: string; description: string; startDate: string; endDate: string | null; status: string
}

export function MinistryProjects({ theme, projects }: { theme: MinistryTheme; projects: MinistryProject[] }) {
  if (projects.length === 0) return null
  return (
    <div>
      <h2 className="text-xl font-semibold mb-3 flex items-center gap-2 text-white">
        <Briefcase className="h-5 w-5" style={{ color: theme.accent }} /> Projects
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
  )
}

// ── MinistryEmptyState ────────────────────────────────────────────────

export function MinistryEmptyState({ theme, message }: { theme: MinistryTheme; message: string }) {
  return (
    <Card className="bg-[#1E293B] border-0 shadow-lg">
      <CardContent className="p-8 text-center">
        <Users className="h-12 w-12 mx-auto mb-2 text-gray-600" />
        <p className="text-gray-400">{message}</p>
      </CardContent>
    </Card>
  )
}

// ── MinistryLoadingSkeleton ───────────────────────────────────────────

export function MinistryLoadingSkeleton() {
  return <Skeleton className="h-96 w-full" />
}
