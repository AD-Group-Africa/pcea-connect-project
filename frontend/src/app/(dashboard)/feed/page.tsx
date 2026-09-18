"use client"
import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Skeleton } from "@/components/ui/skeleton"
import api, { apiErrorMessage } from "@/lib/api"
import { getUserId } from "@/lib/auth"
import { EmptyState } from "@/components/empty-state"
import { ThumbsUp, Heart, Hand, BookOpen, MessagesSquare, Plus } from "lucide-react"
import { toast } from "sonner"

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
  const [posting, setPosting] = useState(false)
  const [refresh, setRefresh] = useState(0)

  useEffect(() => {
    const uid = getUserId()
    setUserId(uid)
    if (!uid) return
    api.get("/api/feed")
      .then(res => { setPosts(res.data.data || []); setLoading(false) })
      .catch(() => setLoading(false))
  }, [refresh])

  const handleCreatePost = async () => {
    if (!content.trim()) {
      toast.error("Write something before posting")
      return
    }
    setPosting(true)
    try {
      // Posts are scoped server-side by congregation membership where available.
      await api.post("/api/feed", { content: content.trim(), type: "TEXT", mediaUrl, congregationId: "", ministryId: null })
      setNewPostOpen(false)
      setContent("")
      setMediaUrl("")
      toast.success("Post published")
      setRefresh(refresh + 1)
    } catch (e) {
      toast.error(apiErrorMessage(e, "Could not publish your post. Please try again."))
    } finally {
      setPosting(false)
    }
  }

  const handleReact = async (postId: String, type: string) => {
    try {
      await api.post(`/api/feed/${postId}/react`, { type })
      setRefresh(refresh + 1)
    } catch (e) {
      toast.error(apiErrorMessage(e, "Reaction not added — you may have already reacted to this post."))
    }
  }

  if (!userId) return <div className="flex items-center justify-center py-20 text-muted-foreground">Please log in.</div>
  if (loading) return <Skeleton className="h-96 w-full" />

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-white">Church Feed</h1>
        <Dialog open={newPostOpen} onOpenChange={setNewPostOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2"><Plus className="h-4 w-4" /> New Post</Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <DialogHeader><DialogTitle>New Post</DialogTitle></DialogHeader>
            <div className="space-y-3">
              <div><Label htmlFor="feed-content">What&apos;s on your heart?</Label><Input id="feed-content" value={content} onChange={(e) => setContent(e.target.value)} placeholder="Share an encouragement, praise or update…" /></div>
              <div><Label htmlFor="feed-media">Photo / video link (optional)</Label><Input id="feed-media" value={mediaUrl} onChange={(e) => setMediaUrl(e.target.value)} placeholder="https://…" /></div>
              <Button className="w-full" disabled={posting} onClick={handleCreatePost}>{posting ? "Posting…" : "Post"}</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {posts.length === 0 ? (
        <EmptyState
          icon={<MessagesSquare className="h-16 w-16" />}
          title="No posts yet"
          description="Be the first to share an encouragement with your church family."
        />
      ) : (
      <div className="space-y-4">
        {posts.map(post => (
          <Card key={post.id} className="bg-card">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-sm font-bold text-primary-foreground">
                    {(post.authorName || "?").charAt(0).toUpperCase()}
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
      )}
    </div>
  )
}
