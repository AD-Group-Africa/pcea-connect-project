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
import api, { apiErrorMessage } from "@/lib/api"
import { Radio, Play, ExternalLink } from "lucide-react"
import { toast } from "sonner"
import { EmptyState } from "@/components/empty-state"

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
  const [type, setType] = useState("VIDEO_FILE")
  const [isLive, setIsLive] = useState(false)
  const [saving, setSaving] = useState(false)

  const loadSermons = async () => {
    try {
      const [allRes, liveRes] = await Promise.all([
        api.get("/api/media/sermons"),
        api.get("/api/media/sermons/live")
      ])
      setSermons(allRes.data.data || [])
      setLiveSermons(liveRes.data.data || [])
    } catch {
      setSermons([])
      setLiveSermons([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { loadSermons() }, [])

  const handleCreate = async () => {
    if (!title.trim() || !videoUrl.trim()) {
      toast.error("Please add a title and video URL")
      return
    }
    setSaving(true)
    try {
      await api.post("/api/media/sermons", {
        title: title.trim(), description: "", preacher, scriptureRef, type, videoUrl: videoUrl.trim(), thumbnailUrl: "", isLive
      })
      setCreateOpen(false)
      setTitle(""); setPreacher(""); setScriptureRef(""); setVideoUrl("")
      toast.success("Sermon added")
      loadSermons()
    } catch (e) {
      toast.error(apiErrorMessage(e, "Could not add the sermon. Please try again."))
    } finally {
      setSaving(false)
    }
  }

  const handleEndLive = async (id: string) => {
    try {
      await api.put(`/api/media/sermons/${id}/end-live`)
      toast.success("Livestream ended")
      loadSermons()
    } catch (e) {
      toast.error(apiErrorMessage(e, "Could not end the livestream"))
    }
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
              <div><Label htmlFor="sermon-title">Title</Label><Input id="sermon-title" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Sunday Service" /></div>
              <div><Label htmlFor="sermon-preacher">Preacher</Label><Input id="sermon-preacher" value={preacher} onChange={(e) => setPreacher(e.target.value)} placeholder="Rev. John" /></div>
              <div><Label htmlFor="sermon-scripture">Scripture</Label><Input id="sermon-scripture" value={scriptureRef} onChange={(e) => setScriptureRef(e.target.value)} placeholder="John 3:16" /></div>
              <div><Label htmlFor="sermon-url">Video URL</Label><Input id="sermon-url" value={videoUrl} onChange={(e) => setVideoUrl(e.target.value)} placeholder="https://www.youtube.com/watch?v=…" required /></div>
              <div><Label htmlFor="sermon-type">Type</Label>
                <Select value={type} onValueChange={setType}>
                  <SelectTrigger id="sermon-type"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="YOUTUBE">YouTube</SelectItem>
                    <SelectItem value="VIDEO_FILE">Video File</SelectItem>
                    <SelectItem value="FACEBOOK">Facebook</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-center gap-2"><input id="isLive" type="checkbox" checked={isLive} onChange={(e) => setIsLive(e.target.checked)} className="h-4 w-4 accent-primary" /><Label htmlFor="isLive">Currently Live</Label></div>
              <Button className="w-full" disabled={saving} onClick={handleCreate}>{saving ? "Adding…" : "Create"}</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {liveSermons.length > 0 && (
        <section className="mb-6">
          <h2 className="text-xl font-semibold flex items-center gap-2 mb-3"><Radio className="h-5 w-5 text-red-600 animate-pulse" /> Live Now</h2>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {liveSermons.map(s => (
              <Card key={s.id} className="border-red-500/50 bg-card">
                <CardHeader>
                  <CardTitle className="text-lg">{s.title}</CardTitle>
                  <Badge variant="destructive" className="w-fit">LIVE</Badge>
                </CardHeader>
                <CardContent className="space-y-2">
                  <p className="text-sm">Preacher: {s.preacher}</p>
                  <p className="text-sm">Scripture: {s.scriptureRef}</p>
                  <a href={s.videoUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-blue-400 hover:underline">
                    <Play className="h-4 w-4" aria-hidden="true" /> Watch Now
                  </a>
                  <Button size="sm" variant="outline" onClick={() => handleEndLive(s.id)} className="w-full mt-2">End Livestream</Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>
      )}

      <h2 className="text-xl font-semibold text-white">Recent Sermons</h2>
      {sermons.length === 0 ? (
        <EmptyState
          icon={<Play className="h-16 w-16" />}
          title="No sermons yet"
          description="Sermon recordings and live streams will appear here."
        />
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {sermons.map(s => (
            <Card key={s.id} className="bg-card">
              <CardHeader>
                <CardTitle className="text-lg">{s.title}</CardTitle>
                <Badge variant="outline" className="w-fit">{s.type}</Badge>
              </CardHeader>
              <CardContent className="space-y-1 text-sm">
                <p>Preacher: {s.preacher}</p>
                <p>Scripture: {s.scriptureRef}</p>
                <p>Published: {new Date(s.publishedAt).toLocaleDateString()}</p>
                <a href={s.videoUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-blue-400 hover:underline">
                  <ExternalLink className="h-3 w-3" aria-hidden="true" /> Watch
                </a>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
