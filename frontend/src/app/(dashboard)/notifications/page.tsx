"use client"
import { useEffect, useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import api from "@/lib/api"
import { getUserId } from "@/lib/auth"
import { Bell, CheckCircle, MailOpen, Inbox } from "lucide-react"

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
  const [filter, setFilter] = useState<"all" | "unread">("all")
  const userId = getUserId()

  const load = async () => {
    if (!userId) { setLoading(false); return }
    try {
      const endpoint = filter === "unread"
        ? "/api/notifications/me/unread"
        : "/api/notifications/me/inbox"
      const res = await api.get(endpoint)
      setItems(res.data.data || [])
    } catch (e) { console.error(e) }
    finally { setLoading(false) }
  }

  useEffect(() => { load() }, [userId, filter])

  const markRead = async (id: string) => {
    try {
      await api.post(`/api/notifications/me/${id}/read`)
      setItems(prev => prev.map(n => n.id === id ? { ...n, isRead: true } : n))
    } catch (e) { console.error(e) }
  }

  const markAllRead = async () => {
    try {
      await api.post("/api/notifications/me/read-all")
      setItems(prev => prev.map(n => ({ ...n, isRead: true })))
    } catch (e) { console.error(e) }
  }

  if (!userId) return <div className="py-20 text-center text-gray-400">Please log in.</div>
  if (loading) return <Skeleton className="h-96 w-full" />

  const unreadCount = items.filter(n => !n.isRead).length

  return (
    <div className="space-y-6 text-white">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Notifications</h1>
        <div className="flex items-center gap-3">
          <div className="flex gap-1 bg-[#1E293B] rounded-lg p-1">
            <button
              onClick={() => setFilter("all")}
              className={`px-3 py-1 rounded text-sm font-medium ${filter === "all" ? "bg-blue-600 text-white" : "text-gray-400"}`}
            >All</button>
            <button
              onClick={() => setFilter("unread")}
              className={`px-3 py-1 rounded text-sm font-medium ${filter === "unread" ? "bg-blue-600 text-white" : "text-gray-400"}`}
            >Unread {unreadCount > 0 && <span className="ml-1 bg-red-500 text-white text-xs px-1.5 rounded-full">{unreadCount}</span>}</button>
          </div>
          {unreadCount > 0 && (
            <Button variant="outline" className="gap-2 bg-[#1E293B] border-gray-700 text-white hover:bg-[#2a3a4f]" onClick={markAllRead}>
              <CheckCircle className="h-4 w-4" /> Mark all read
            </Button>
          )}
        </div>
      </div>

      {items.length === 0 ? (
        <Card className="bg-[#1E293B] border-0 shadow-lg">
          <CardContent className="p-8 text-center">
            <Inbox className="h-12 w-12 mx-auto mb-2 text-gray-600" />
            <p className="text-gray-400">{filter === "unread" ? "No unread notifications." : "No notifications yet."}</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {items.map(n => (
            <Card key={n.id} className={`border-0 shadow-lg ${n.isRead ? "bg-[#1E293B]" : "bg-[#243350] border-l-4 border-l-blue-500"}`}>
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
