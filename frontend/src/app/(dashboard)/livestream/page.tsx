"use client"
import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Skeleton } from "@/components/ui/skeleton"
import api, { apiErrorMessage } from "@/lib/api"
import { getUserId } from "@/lib/auth"
import { CalendarDays, History, Plus, Play, Radio } from "lucide-react"
import { toast } from "sonner"

interface Livestream {
  id: string
  title: string
  description: string
  preacher: string
  scriptureRef: string
  platform: string
  embedUrl: string
  thumbnailUrl: string
  scheduledAt: string
  status: string
  endedAt: string | null
}

export default function LivestreamPage() {
  const [mounted, setMounted] = useState(false)
  const [streams, setStreams] = useState<Livestream[]>([])
  const [loading, setLoading] = useState(true)
  const [userId, setUserId] = useState<string | null>(null)

  const [scheduleOpen, setScheduleOpen] = useState(false)
  const [title, setTitle] = useState("")
  const [preacher, setPreacher] = useState("")
  const [platform, setPlatform] = useState("YOUTUBE")
  const [embedUrl, setEmbedUrl] = useState("")
  const [scheduledAt, setScheduledAt] = useState("")
  const [scheduling, setScheduling] = useState(false)

  useEffect(() => {
    setMounted(true)
    const uid = getUserId()
    setUserId(uid)
    if (!uid) {
      setLoading(false)
      return
    }
    api.get("/api/livestream")
      .then(res => setStreams(res.data.data || []))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  const reloadStreams = async () => {
    try {
      const res = await api.get("/api/livestream")
      setStreams(res.data.data || [])
    } catch { /* keep existing list */ }
  }

  const handleSchedule = async () => {
    if (!title.trim() || !scheduledAt) {
      toast.error("Please add a title and start time")
      return
    }
    setScheduling(true)
    try {
      await api.post("/api/livestream", {
        title: title.trim(), description: "", preacher, scriptureRef: "", platform,
        embedUrl, thumbnailUrl: "", scheduledAt
      })
      setScheduleOpen(false)
      setTitle(""); setPreacher(""); setEmbedUrl(""); setScheduledAt("")
      toast.success("Livestream scheduled")
      reloadStreams()
    } catch (e) {
      toast.error(apiErrorMessage(e, "Could not schedule the livestream. Please try again."))
    } finally {
      setScheduling(false)
    }
  }

  const handleGoLive = async (id: string) => {
    try {
      await api.put(`/api/livestream/${id}/go-live`)
      toast.success("You are live")
      reloadStreams()
    } catch (e) {
      toast.error(apiErrorMessage(e, "Could not start the livestream"))
    }
  }

  const handleEnd = async (id: string) => {
    try {
      await api.put(`/api/livestream/${id}/end`)
      toast.success("Livestream ended")
      reloadStreams()
    } catch (e) {
      toast.error(apiErrorMessage(e, "Could not end the livestream"))
    }
  }

  if (!mounted) return null

  if (!userId) return (
    <div className="py-20 text-center text-muted-foreground">Please log in.</div>
  )

  if (loading) return <Skeleton className="h-96 w-full" />

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-white">Livestream</h1>
        <Dialog open={scheduleOpen} onOpenChange={setScheduleOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2"><Plus className="h-4 w-4" /> Schedule</Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <DialogHeader><DialogTitle>Schedule Livestream</DialogTitle></DialogHeader>
            <div className="space-y-3">
              <div><Label>Title</Label><Input value={title} onChange={(e) => setTitle(e.target.value)} /></div>
              <div><Label>Preacher</Label><Input value={preacher} onChange={(e) => setPreacher(e.target.value)} /></div>
              <div><Label>Platform</Label>
                <Select value={platform} onValueChange={setPlatform}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="YOUTUBE">YouTube</SelectItem>
                    <SelectItem value="FACEBOOK">Facebook</SelectItem>
                    <SelectItem value="VIMEO">Vimeo</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div><Label htmlFor="ls-embed">Embed / video URL</Label><Input id="ls-embed" value={embedUrl} onChange={(e) => setEmbedUrl(e.target.value)} placeholder="https://www.youtube.com/embed/…" /></div>
              <div><Label htmlFor="ls-scheduled">Start time</Label><Input id="ls-scheduled" type="datetime-local" value={scheduledAt} onChange={(e) => setScheduledAt(e.target.value)} required /></div>
              <Button className="w-full" disabled={scheduling} onClick={handleSchedule}>{scheduling ? "Scheduling…" : "Schedule"}</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <Tabs defaultValue="live" className="w-full">
        <TabsList className="mb-4">
          <TabsTrigger value="live"><Radio className="h-4 w-4" /> Live Now</TabsTrigger>
          <TabsTrigger value="upcoming"><CalendarDays className="h-4 w-4" /> Upcoming</TabsTrigger>
          <TabsTrigger value="past"><History className="h-4 w-4" /> Past</TabsTrigger>
        </TabsList>

        {["live","upcoming","past"].map(tab => (
          <TabsContent key={tab} value={tab}>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {streams.filter(s => tab === "live" ? s.status === "LIVE" :
                                     tab === "upcoming" ? s.status === "SCHEDULED" :
                                     s.status === "ENDED").length === 0 &&
                <p className="text-muted-foreground col-span-full">No {tab} streams.</p>}
              {streams.filter(s => tab === "live" ? s.status === "LIVE" :
                                     tab === "upcoming" ? s.status === "SCHEDULED" :
                                     s.status === "ENDED").map(s => (
                <Card key={s.id} className="bg-card">
                  <CardHeader>
                    <CardTitle className="text-lg">{s.title}</CardTitle>
                    <div className="flex gap-2">
                      <Badge variant={s.status === "LIVE" ? "destructive" : "outline"}>{s.status}</Badge>
                      <Badge variant="secondary">{s.platform}</Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    {s.preacher && <p className="text-sm">Preacher: {s.preacher}</p>}
                    <p className="text-sm text-muted-foreground">{new Date(s.scheduledAt).toLocaleString()}</p>
                    {s.embedUrl && s.status === "LIVE" && (
                      <iframe src={s.embedUrl} title={s.title} className="aspect-video w-full rounded-lg" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowFullScreen />
                    )}
                    <div className="flex gap-2 mt-2">
                      {s.status === "LIVE" && (
                        <Button size="sm" onClick={() => handleEnd(s.id)}>End Stream</Button>
                      )}
                      {s.status === "SCHEDULED" && (
                        <Button size="sm" onClick={() => handleGoLive(s.id)}>Go Live</Button>
                      )}
                      {s.status === "ENDED" && s.embedUrl && (
                        <a href={s.embedUrl} target="_blank" rel="noopener noreferrer">
                          <Button size="sm" variant="outline"><Play className="h-4 w-4 mr-1" /> Replay</Button>
                        </a>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>
        ))}
      </Tabs>
    </div>
  )
}
