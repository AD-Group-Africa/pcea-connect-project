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
import api from "@/lib/api"
import { getUserId } from "@/lib/auth"
import { Plus, Play } from "lucide-react"

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
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  const handleSchedule = async () => {
    await api.post("/api/livestream", {
      title, description: "", preacher, scriptureRef: "", platform,
      embedUrl, thumbnailUrl: "", scheduledAt
    })
    setScheduleOpen(false)
    const res = await api.get("/api/livestream")
    setStreams(res.data.data || [])
  }

  const handleGoLive = async (id: string) => {
    await api.put(`/api/livestream/${id}/go-live`)
    const res = await api.get("/api/livestream")
    setStreams(res.data.data || [])
  }

  const handleEnd = async (id: string) => {
    await api.put(`/api/livestream/${id}/end`)
    const res = await api.get("/api/livestream")
    setStreams(res.data.data || [])
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
              <div><Label>Embed URL</Label><Input value={embedUrl} onChange={(e) => setEmbedUrl(e.target.value)} /></div>
              <div><Label>Scheduled At</Label><Input type="datetime-local" value={scheduledAt} onChange={(e) => setScheduledAt(e.target.value)} /></div>
              <Button className="w-full" onClick={handleSchedule}>Schedule</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <Tabs defaultValue="live" className="w-full">
        <TabsList className="mb-4">
          <TabsTrigger value="live">?? Live Now</TabsTrigger>
          <TabsTrigger value="upcoming">?? Upcoming</TabsTrigger>
          <TabsTrigger value="past">?? Past</TabsTrigger>
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
                <Card key={s.id} className="backdrop-blur-sm bg-white/80 dark:bg-gray-900/80">
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
                      <iframe src={s.embedUrl} className="w-full h-48 rounded-lg" allowFullScreen />
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
