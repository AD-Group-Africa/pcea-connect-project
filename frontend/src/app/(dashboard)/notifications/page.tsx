"use client"
import { useCallback, useEffect, useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import api, { apiErrorMessage } from "@/lib/api"
import { getUserId } from "@/lib/auth"
import { Bell, CheckCircle2, MailOpen, Inbox } from "lucide-react"
import { toast } from "sonner"

interface NotificationItem {
  id: string
  title: string
  body: string
  category: string
  isRead: boolean
  createdAt: string
}

export default function NotificationsPage() {
  const [items, setItems] = useState<NotificationItem[]>([])
  const [loading, setLoading] = useState(true)
  const [userId, setUserId] = useState<string | null>(null)
  const [filter, setFilter] = useState<"all" | "unread">("all")

  const load = useCallback(async (uid: string, f: "all" | "unread") => {
    try {
      const endpoint = f === "unread"
        ? "/api/notifications/me/unread"
        : "/api/notifications/me/inbox"
      const res = await api.get(endpoint)
      setItems(res.data.data || [])
    } catch {
      setItems([])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    const uid = getUserId()
    setUserId(uid)
    if (uid) load(uid, filter)
    else setLoading(false)
  }, [filter, load])

  const markRead = async (id: string) => {
    try {
      await api.post(`/api/notifications/me/${id}/read`)
      setItems(prev => prev.map(n => n.id === id ? { ...n, isRead: true } : n))
    } catch (e) {
      toast.error(apiErrorMessage(e, "Could not update this notification"))
    }
  }

  const markAllRead = async () => {
    try {
      await api.post("/api/notifications/me/read-all")
      setItems(prev => prev.map(n => ({ ...n, isRead: true })))
      toast.success("All notifications marked as read")
    } catch (e) {
      toast.error(apiErrorMessage(e, "Could not update notifications"))
    }
  }

  if (!userId) return <div className="py-20 text-center text-muted-foreground">Please log in.</div>
  if (loading) return <Skeleton className="h-96 w-full" />

  const unreadCount = items.filter(n => !n.isRead).length

  return (
    <div className="space-y-6 text-white">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Notifications</h1>
        <div className="flex items-center gap-3">
          <div className="flex gap-1 bg-card rounded-lg p-1">
            <button
              onClick={() => setFilter("all")}
              className={`rounded px-3 py-1 text-sm font-medium transition-colors ${filter === "all" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-white"}`}
            >All</button>
            <button
              onClick={() => setFilter("unread")}
              className={`rounded px-3 py-1 text-sm font-medium transition-colors ${filter === "unread" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-white"}`}
            >Unread {unreadCount > 0 && <span className="ml-1 rounded-full bg-accent px-1.5 py-0.5 text-xs font-bold text-accent-foreground">{unreadCount}</span>}</button>
          </div>
          {unreadCount > 0 && (
            <Button variant="outline" className="gap-2" onClick={markAllRead}>
              <CheckCircle2 className="h-4 w-4" /> Mark all read
            </Button>
          )}
        </div>
      </div>

      {items.length === 0 ? (
        <Card className="border-0 bg-card shadow-lg">
          <CardContent className="p-10 text-center">
            <Inbox className="mx-auto mb-3 h-12 w-12 text-muted-foreground/50" aria-hidden="true" />
            <p className="font-medium text-white">
              {filter === "unread" ? "No unread notifications" : "No notifications yet"}
            </p>
            <p className="mt-1 text-sm text-muted-foreground">
              {filter === "unread" ? "You're all caught up." : "Updates about services and ministries will appear here."}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {items.map(n => (
            <Card key={n.id} className={`border-0 shadow-lg ${n.isRead ? "bg-card" : "border-l-4 border-l-accent bg-secondary"}`}>
              <CardContent className="p-4 flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    {!n.isRead && <span className="bg-blue-500 h-2 w-2 rounded-full flex-shrink-0" />}
                    <p className={`font-medium ${n.isRead ? "text-gray-300" : "text-white"}`}>{n.title}</p>
                    {n.category && <Badge variant="secondary" className="text-xs">{n.category}</Badge>}
                  </div>
                  {n.body && <p className="text-sm text-gray-400">{n.body}</p>}
                  <p className="text-xs text-gray-500 mt-1">{new Date(n.createdAt).toLocaleString()}</p>
                </div>
                {!n.isRead && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-blue-400 hover:text-blue-300 flex items-center gap-1"
                    onClick={() => markRead(n.id)}
                  >
                    <MailOpen className="h-4 w-4" />
                  </Button>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
