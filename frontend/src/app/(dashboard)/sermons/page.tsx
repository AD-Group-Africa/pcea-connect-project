"use client"
import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Skeleton } from "@/components/ui/skeleton"
import api from "@/lib/api"
import { Globe, Video, Radio, Play, ExternalLink } from "lucide-react"

interface Sermon {
  id: string
  title: string
  description: string
  preacher: string
  scriptureRef: string
  type: string
  videoUrl: string
  thumbnailUrl: string
  isLive: boolean
  publishedAt: string
  views: number
}

export default function SermonsPage() {
  const [sermons, setSermons] = useState<Sermon[]>([])
  const [liveSermons, setLiveSermons] = useState<Sermon[]>([])
  const [loading, setLoading] = useState(true)
  const [createOpen, setCreateOpen] = useState(false)
  const [title, setTitle] = useState("")
  const [preacher, setPreacher] = useState("")
  const [scriptureRef, setScriptureRef] = useState("")
  const [videoUrl, setVideoUrl] = useState("")
  const [type, setType] = useState("")
  const [isLive, setIsLive] = useState(false)

  const loadSermons = async () => {
    const [allRes, liveRes] = await Promise.all([
      api.get("/api/media/sermons"),
      api.get("/api/media/sermons/live")
    ])
    setSermons(allRes.data.data || [])
    setLiveSermons(liveRes.data.data || [])
    setLoading(false)
  }

  useEffect(() => { loadSermons() }, [])

  const handleCreate = async () => {
    await api.post("/api/media/sermons", {
      title, description: "", preacher, scriptureRef, type, videoUrl, thumbnailUrl: "", isLive
    })
    setCreateOpen(false)
    setTitle(""); setPreacher(""); setScriptureRef(""); setVideoUrl("")
    loadSermons()
  }

  const handleEndLive = async (id: string) => {
    await api.put(`/api/media/sermons/${id}/end-live`)
    loadSermons()
  }

  if (loading) return <Skeleton className="h-96 w-full" />

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-white">Sermons & Livestream</h1>
        <Dialog open={createOpen} onOpenChange={setCreateOpen}>
          <DialogTrigger asChild><Button className="gap-2"><Radio className="h-4 w-4" /> Add Sermon/Stream</Button></DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <DialogHeader><DialogTitle>New Sermon</DialogTitle></DialogHeader>
            <div className="space-y-3">
              <div><Label>Title</Label><Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Sunday Service" /></div>
              <div><Label>Preacher</Label><Input value={preacher} onChange={(e) => setPreacher(e.target.value)} placeholder="Rev. John" /></div>
              <div><Label>Scripture</Label><Input value={scriptureRef} onChange={(e) => setScriptureRef(e.target.value)} placeholder="John 3:16" /></div>
              <div><Label>Video URL</Label><Input value={videoUrl} onChange={(e) => setVideoUrl(e.target.value)} placeholder="https://.com/watch?v=..." /></div>
              <div><Label>Type</Label>
                <Select value={type} onValueChange={setType}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value=""></SelectItem>
                    <SelectItem value="FACEBOOK">Facebook</SelectItem>
                    <SelectItem value="VIDEO_FILE">Video File</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-center gap-2"><input type="checkbox" checked={isLive} onChange={(e) => setIsLive(e.target.checked)} /><Label>Currently Live</Label></div>
              <Button className="w-full" onClick={handleCreate}>Create</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {liveSermons.length > 0 && (
        <section className="mb-6">
          <h2 className="text-xl font-semibold flex items-center gap-2 mb-3"><Radio className="h-5 w-5 text-red-600 animate-pulse" /> Live Now</h2>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {liveSermons.map(s => (
              <Card key={s.id} className="border-red-500/50 backdrop-blur-sm bg-white/80 dark:bg-gray-900/80">
                <CardHeader>
                  <CardTitle className="text-lg">{s.title}</CardTitle>
                  <Badge variant="destructive" className="w-fit">LIVE</Badge>
                </CardHeader>
                <CardContent className="space-y-2">
                  <p className="text-sm">Preacher: {s.preacher}</p>
                  <p className="text-sm">Scripture: {s.scriptureRef}</p>
                  <a href={s.videoUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-primary hover:underline">
                    <Play className="h-4 w-4" /> Watch Now
                  </a>
                  <Button size="sm" variant="outline" onClick={() => handleEndLive(s.id)} className="w-full mt-2">End Livestream</Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>
      )}

      <h2 className="text-xl font-semibold">Recent Sermons</h2>
      {sermons.length === 0 ? (
        <p className="text-muted-foreground">No sermons yet. Add one to get started.</p>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {sermons.map(s => (
            <Card key={s.id} className="backdrop-blur-sm bg-white/80 dark:bg-gray-900/80">
              <CardHeader>
                <CardTitle className="text-lg">{s.title}</CardTitle>
                <Badge variant="outline" className="w-fit">{s.type}</Badge>
              </CardHeader>
              <CardContent className="space-y-1 text-sm">
                <p>Preacher: {s.preacher}</p>
                <p>Scripture: {s.scriptureRef}</p>
                <p>Published: {new Date(s.publishedAt).toLocaleDateString()}</p>
                <a href={s.videoUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-primary hover:underline">
                  <ExternalLink className="h-3 w-3" /> Watch
                </a>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
