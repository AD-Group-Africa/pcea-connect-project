"use client"
import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Skeleton } from "@/components/ui/skeleton"
import api from "@/lib/api"
import { getUserId } from "@/lib/auth"
import { ThumbsUp, Heart, Hand, BookOpen, Send, Plus } from "lucide-react"

interface Post {
  id: string
  authorName: string
  content: string
  type: string
  mediaUrl: string
  createdAt: string
  likes: number
  loves: number
  prays: number
  amens: number
  congregationId: string
  ministryId: string | null
}

export default function FeedPage() {
  const [posts, setPosts] = useState<Post[]>([])
  const [loading, setLoading] = useState(true)
  const [userId, setUserId] = useState<string | null>(null)
  const [newPostOpen, setNewPostOpen] = useState(false)
  const [content, setContent] = useState("")
  const [mediaUrl, setMediaUrl] = useState("")
  const [congregationId, setCongregationId] = useState("")
  const [refresh, setRefresh] = useState(0)

  useEffect(() => {
    const uid = getUserId()
    setUserId(uid)
    if (!uid) return
    api.get("/api/feed").then(res => {
      setPosts(res.data.data || [])
      setLoading(false)
    }).catch(() => setLoading(false))
  }, [refresh])

  const handleCreatePost = async () => {
    await api.post("/api/feed", {
      content, type: "TEXT", mediaUrl, congregationId, ministryId: null
    })
    setNewPostOpen(false)
    setContent("")
    setRefresh(refresh + 1)
  }

  const handleReact = async (postId: String, type: string) => {
    await api.post(`/api/feed/${postId}/react`, { type })
    setRefresh(refresh + 1)
  }

  if (!userId) return <div className="flex items-center justify-center py-20 text-muted-foreground">Please log in.</div>
  if (loading) return <Skeleton className="h-96 w-full" />

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-white">Social Feed</h1>
        <Dialog open={newPostOpen} onOpenChange={setNewPostOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2"><Plus className="h-4 w-4" /> New Post</Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <DialogHeader><DialogTitle>Create Post</DialogTitle></DialogHeader>
            <div className="space-y-3">
              <div><Input value={content} onChange={(e) => setContent(e.target.value)} placeholder="What's happening?" /></div>
              <div><Input value={congregationId} onChange={(e) => setCongregationId(e.target.value)} placeholder="Congregation ID (optional)" /></div>
              <div><Input value={mediaUrl} onChange={(e) => setMediaUrl(e.target.value)} placeholder="Image/Video URL (optional)" /></div>
              <Button className="w-full" onClick={handleCreatePost}>Post</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="space-y-4">
        {posts.map(post => (
          <Card key={post.id} className="backdrop-blur-sm bg-white/80 dark:bg-gray-900/80">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                    <span className="text-sm font-bold text-white">{post.authorName[0]}</span>
                  </div>
                  <div>
                    <p className="font-medium">{post.authorName}</p>
                    <p className="text-xs text-muted-foreground">{new Date(post.createdAt).toLocaleString()}</p>
                  </div>
                </div>
                <Badge variant="outline">{post.type}</Badge>
              </div>
              <p className="mt-2 whitespace-pre-wrap">{post.content}</p>
              {post.mediaUrl && <img src={post.mediaUrl} className="mt-2 rounded-lg max-h-96 object-cover" />}
            </CardHeader>
            <CardContent>
              <div className="flex gap-4">
                <Button variant="ghost" size="sm" onClick={() => handleReact(post.id, "LIKE")} className="gap-1">
                  <ThumbsUp className="h-4 w-4" /> {post.likes}
                </Button>
                <Button variant="ghost" size="sm" onClick={() => handleReact(post.id, "LOVE")} className="gap-1">
                  <Heart className="h-4 w-4" /> {post.loves}
                </Button>
                <Button variant="ghost" size="sm" onClick={() => handleReact(post.id, "PRAY")} className="gap-1">
                  <Hand className="h-4 w-4" /> {post.prays}
                </Button>
                <Button variant="ghost" size="sm" onClick={() => handleReact(post.id, "AMEN")} className="gap-1">
                  <BookOpen className="h-4 w-4" /> {post.amens}
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
