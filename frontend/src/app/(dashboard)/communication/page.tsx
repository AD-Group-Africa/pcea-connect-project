"use client"
import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import api from "@/lib/api"
import { getUserId } from "@/lib/auth"
import { Megaphone, Heart } from "lucide-react"

export default function CommunicationPage() {
  const [announcements, setAnnouncements] = useState<any[]>([])
  const [prayers, setPrayers] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const userId = getUserId()

  const loadData = async () => {
    try {
      const [annRes, prayRes] = await Promise.all([
        api.get("/api/communication/announcements"),
        api.get("/api/communication/prayer")
      ])
      setAnnouncements(annRes.data.data || [])
      setPrayers(prayRes.data.data || [])
    } catch (e) { console.error(e) } finally { setLoading(false) }
  }

  useEffect(() => { if (userId) loadData() }, [userId])

  if (!userId) return <div className="py-20 text-center text-white">Please log in.</div>
  if (loading) return <Skeleton className="h-96 w-full" />

  return (
    <div className="space-y-6 text-white">
      <h1 className="text-3xl font-bold">Communication</h1>
      <div>
        <h2 className="text-xl font-semibold mb-3"><Megaphone className="inline h-5 w-5 mr-2" />Announcements</h2>
        {announcements.length === 0 ? <p className="text-gray-400">No announcements yet.</p> :
          announcements.map(a => (
            <Card key={a.id} className="bg-[#1E293B] border-0 shadow-lg mb-2">
              <CardHeader><CardTitle className="text-white">{a.title}</CardTitle></CardHeader>
              <CardContent><p className="text-gray-300">{a.content}</p></CardContent>
            </Card>
          ))
        }
      </div>
      <div>
        <h2 className="text-xl font-semibold mb-3"><Heart className="inline h-5 w-5 mr-2" />Prayer Feed</h2>
        {prayers.length === 0 ? <p className="text-gray-400">No prayer requests yet.</p> :
          prayers.map(p => (
            <Card key={p.id} className="bg-[#1E293B] border-0 shadow-lg mb-2">
              <CardContent className="p-4"><p className="text-white">{p.request}</p></CardContent>
            </Card>
          ))
        }
      </div>
    </div>
  )
}
