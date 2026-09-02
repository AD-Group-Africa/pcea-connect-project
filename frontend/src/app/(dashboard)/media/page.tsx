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
import { Play, Plus, ListMusic, Mic, Music, BookOpen } from "lucide-react"

interface Track {
  id: string
  title: string
  preacher: string
  category: string
  audioUrl: string
  videoUrl: string
  thumbnailUrl: string
  publishedAt: string
  isLive: boolean
  views: number
}

interface Playlist {
  id: string
  name: string
  description: string
}

export default function MediaPage() {
  const [mounted, setMounted] = useState(false)
  const [userId, setUserId] = useState<string | null>(null)
  const [tracks, setTracks] = useState<Track[]>([])
  const [playlists, setPlaylists] = useState<Playlist[]>([])
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState("all")
  const [nowPlaying, setNowPlaying] = useState<Track | null>(null)

  // Create form
  const [createOpen, setCreateOpen] = useState(false)
  const [title, setTitle] = useState("")
  const [preacher, setPreacher] = useState("")
  const [category, setCategory] = useState("SERMON")
  const [audioUrl, setAudioUrl] = useState("")
  const [videoUrl, setVideoUrl] = useState("")
  const [thumbnailUrl, setThumbnailUrl] = useState("")

  // Playlist form
  const [playlistOpen, setPlaylistOpen] = useState(false)
  const [playlistName, setPlaylistName] = useState("")
  const [playlistDesc, setPlaylistDesc] = useState("")

  useEffect(() => {
    setMounted(true)
    const uid = getUserId()
    setUserId(uid)
    if (!uid) { setLoading(false); return }
    Promise.all([
      api.get("/api/media/sermons"),
      api.get("/api/media/playlists")
    ]).then(([tracksRes, playlistsRes]) => {
      setTracks(tracksRes.data.data || [])
      setPlaylists(playlistsRes.data.data || [])
    }).catch(console.error).finally(() => setLoading(false))
  }, [])

  const handleCreateTrack = async () => {
    await api.post("/api/media/sermons", {
      title, description: "", preacher, scriptureRef: "",
      type: "AUDIO_FILE", videoUrl, audioUrl, thumbnailUrl, category
    })
    setCreateOpen(false)
    const res = await api.get("/api/media/sermons")
    setTracks(res.data.data || [])
  }

  const handleCreatePlaylist = async () => {
    await api.post("/api/media/playlists", { name: playlistName, description: playlistDesc })
    setPlaylistOpen(false)
    setPlaylistName(""); setPlaylistDesc("")
    const res = await api.get("/api/media/playlists")
    setPlaylists(res.data.data || [])
  }

  const handleAddToPlaylist = async (playlistId: string, sermonId: string) => {
    await api.post(`/api/media/playlists/${playlistId}/items`, { sermonId })
  }

  if (!mounted) return null
  if (!userId) return <div className="py-20 text-center text-muted-foreground">Please log in.</div>
  if (loading) return <Skeleton className="h-96 w-full" />

  const categories = ["SERMON", "PODCAST", "WORSHIP", "TESTIMONY"]
  const categoryIcons: Record<string, any> = { SERMON: BookOpen, PODCAST: Mic, WORSHIP: Music, TESTIMONY: Mic }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-white">Media</h1>
        <div className="flex gap-2">
          <Dialog open={createOpen} onOpenChange={setCreateOpen}>
            <DialogTrigger asChild>
              <Button className="gap-2"><Plus className="h-4 w-4" /> Add Track</Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <DialogHeader><DialogTitle>Add Media</DialogTitle></DialogHeader>
              <div className="space-y-3">
                <div><Label>Title</Label><Input value={title} onChange={(e) => setTitle(e.target.value)} /></div>
                <div><Label>Preacher / Artist</Label><Input value={preacher} onChange={(e) => setPreacher(e.target.value)} /></div>
                <div><Label>Category</Label>
                  <Select value={category} onValueChange={setCategory}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {categories.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div><Label>Audio URL</Label><Input value={audioUrl} onChange={(e) => setAudioUrl(e.target.value)} placeholder="https://..." /></div>
                <div><Label>Thumbnail URL</Label><Input value={thumbnailUrl} onChange={(e) => setThumbnailUrl(e.target.value)} /></div>
                <Button className="w-full" onClick={handleCreateTrack}>Add</Button>
              </div>
            </DialogContent>
          </Dialog>
          <Dialog open={playlistOpen} onOpenChange={setPlaylistOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" className="gap-2"><ListMusic className="h-4 w-4" /> Playlist</Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <DialogHeader><DialogTitle>New Playlist</DialogTitle></DialogHeader>
              <div className="space-y-3">
                <div><Label>Name</Label><Input value={playlistName} onChange={(e) => setPlaylistName(e.target.value)} /></div>
                <div><Label>Description</Label><Input value={playlistDesc} onChange={(e) => setPlaylistDesc(e.target.value)} /></div>
                <Button className="w-full" onClick={handleCreatePlaylist}>Create</Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Now Playing Bar */}
      {nowPlaying && (
        <Card className="bg-green-50 dark:bg-green-900/20 border-blue-200 dark:border-blue-800">
          <CardContent className="p-4 flex items-center gap-4">
            <Button size="icon" variant="ghost" onClick={() => setNowPlaying(null)}>?</Button>
            <div>
              <p className="font-semibold">{nowPlaying.title}</p>
              <p className="text-sm text-muted-foreground">{nowPlaying.preacher}</p>
            </div>
            {nowPlaying.audioUrl && (
              <audio controls autoPlay className="flex-1 h-10">
                <source src={nowPlaying.audioUrl} type="audio/mpeg" />
              </audio>
            )}
          </CardContent>
        </Card>
      )}

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList className="mb-4">
          <TabsTrigger value="all">All</TabsTrigger>
          {categories.map(c => (
            <TabsTrigger key={c} value={c}>{c.charAt(0) + c.slice(1).toLowerCase() + 's'}</TabsTrigger>
          ))}
          <TabsTrigger value="playlists">Playlists</TabsTrigger>
        </TabsList>

        <TabsContent value="all">
          <TrackList tracks={tracks} setNowPlaying={setNowPlaying} playlists={playlists} handleAddToPlaylist={handleAddToPlaylist} />
        </TabsContent>
        {categories.map(c => (
          <TabsContent key={c} value={c}>
            <TrackList tracks={tracks.filter(t => t.category === c)} setNowPlaying={setNowPlaying} playlists={playlists} handleAddToPlaylist={handleAddToPlaylist} />
          </TabsContent>
        ))}
        <TabsContent value="playlists">
          {playlists.length === 0 ? <p className="text-muted-foreground">No playlists yet.</p> :
            playlists.map(p => (
              <Card key={p.id} className="mb-2 backdrop-blur-sm bg-white/80 dark:bg-gray-900/80">
                <CardHeader><CardTitle className="text-lg">{p.name}</CardTitle></CardHeader>
                <CardContent><p className="text-sm text-muted-foreground">{p.description}</p></CardContent>
              </Card>
            ))
          }
        </TabsContent>
      </Tabs>
    </div>
  )
}

function TrackList({ tracks, setNowPlaying, playlists, handleAddToPlaylist }: any) {
  return (
    <div className="space-y-2">
      {tracks.length === 0 ? <p className="text-muted-foreground">No tracks yet.</p> :
        tracks.map((track: Track) => (
          <Card key={track.id} className="backdrop-blur-sm bg-white/80 dark:bg-gray-900/80">
            <CardContent className="p-4 flex items-center gap-4">
              {track.thumbnailUrl && <img src={track.thumbnailUrl} className="w-16 h-16 rounded object-cover" />}
              <div className="flex-1">
                <p className="font-semibold">{track.title}</p>
                <p className="text-sm text-muted-foreground">{track.preacher}</p>
              </div>
              <div className="flex items-center gap-2">
                {track.audioUrl && (
                  <Button size="icon" variant="ghost" onClick={() => setNowPlaying(track)}>
                    <Play className="h-5 w-5" />
                  </Button>
                )}
                {playlists.length > 0 && (
                  <Select onValueChange={(val) => handleAddToPlaylist(val, track.id)}>
                    <SelectTrigger className="w-24"><SelectValue placeholder="+ Playlist" /></SelectTrigger>
                    <SelectContent>
                      {playlists.map((p: Playlist) => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                )}
              </div>
            </CardContent>
          </Card>
        ))
      }
    </div>
  )
}
