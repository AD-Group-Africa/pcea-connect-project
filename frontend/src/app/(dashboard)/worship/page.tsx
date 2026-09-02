"use client"
import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import api from "@/lib/api"
import { Church, Clock, User, BookMarked, Radio, Video, BookOpen, Calendar, ArrowRight } from "lucide-react"
import Link from "next/link"

interface ServiceItem {
  id: string; title: string; serviceDate: string; serviceTime: string
  serviceType: string; preacherName: string; theme: string; scriptureRef: string
  worshipTeam: string; livestreamId: string; bulletinId: string
}

interface Bulletin {
  id: string; title: string; welcomeMessage: string; orderOfService: string
  scriptureRef: string; preacher: string; sermonTheme: string; announcements: string
  weeklyCalendar: string; ministryNotices: string; givingInformation: string
  livestreamUrl: string; specialEvents: string; status: string
}

export default function WorshipPage() {
  const [today, setToday] = useState<ServiceItem | null>(null)
  const [upcoming, setUpcoming] = useState<ServiceItem[]>([])
  const [bulletin, setBulletin] = useState<Bulletin | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([
      api.get("/api/worship/today").then(r => r.data.data).catch(() => null),
      api.get("/api/worship/services/upcoming?limit=5").then(r => r.data.data || []).catch(() => []),
      api.get("/api/worship/bulletins/latest").then(r => r.data.data).catch(() => null),
    ]).then(([t, u, b]) => {
      setToday(t); setUpcoming(u); setBulletin(b); setLoading(false)
    })
  }, [])

  if (loading) return <Skeleton className="h-96 w-full" />

  return (
    <div className="space-y-6 text-white">
      <h1 className="text-3xl font-bold">Worship</h1>

      {/* TODAY'S WORSHIP */}
      {today ? (
        <Card className="bg-gradient-to-r from-[#1A3C8F] to-[#0a0f1e] border border-blue-800 shadow-xl">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Church className="h-6 w-6 text-blue-400" />
                <h2 className="text-xl font-bold">Today&apos;s Worship</h2>
              </div>
              {today.livestreamId && (
                <Badge variant="destructive" className="flex items-center gap-1">
                  <Radio className="h-3 w-3" /> LIVE NOW
                </Badge>
              )}
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              {today.preacherName && (
                <div className="flex items-center gap-2 text-gray-300">
                  <User className="h-4 w-4 text-blue-400" /> {today.preacherName}
                </div>
              )}
              {today.theme && (
                <div className="flex items-center gap-2 text-gray-300">
                  <BookMarked className="h-4 w-4 text-blue-400" /> {today.theme}
                </div>
              )}
              {today.scriptureRef && (
                <div className="flex items-center gap-2 text-gray-300">
                  <BookOpen className="h-4 w-4 text-blue-400" /> {today.scriptureRef}
                </div>
              )}
              {today.serviceTime && (
                <div className="flex items-center gap-2 text-gray-300">
                  <Clock className="h-4 w-4 text-blue-400" /> {today.serviceTime}
                </div>
              )}
            </div>
            {today.title && <p className="text-sm text-gray-400 mt-3">{today.title}</p>}
            {today.livestreamId && (
              <Link href="/livestream" className="inline-flex items-center gap-2 mt-4 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg font-medium">
                <Video className="h-4 w-4" /> Watch Live
              </Link>
            )}
          </CardContent>
        </Card>
      ) : (
        <Card className="bg-[#1E293B] border-0 shadow-lg">
          <CardContent className="p-6 text-center">
            <Church className="h-12 w-12 mx-auto mb-2 text-gray-600" />
            <p className="text-gray-400">No service scheduled for today.</p>
            {upcoming.length > 0 && (
              <p className="text-sm text-gray-500 mt-1">Next service: {new Date(upcoming[0].serviceDate).toLocaleDateString()} at {upcoming[0].serviceTime}</p>
            )}
          </CardContent>
        </Card>
      )}

      {/* BULLETIN */}
      {bulletin && (
        <Card className="bg-[#1E293B] border-0 shadow-lg">
          <CardHeader>
            <CardTitle className="text-xl text-white flex items-center gap-2">
              <BookOpen className="h-5 w-5 text-blue-400" /> {bulletin.title || "Weekly Bulletin"}
            </CardTitle>
            {bulletin.status === "PUBLISHED" && <Badge className="w-fit">Published</Badge>}
          </CardHeader>
          <CardContent className="space-y-4">
            {bulletin.welcomeMessage && (
              <div>
                <h3 className="text-sm font-semibold text-gray-400 mb-1">Welcome</h3>
                <p className="text-gray-300">{bulletin.welcomeMessage}</p>
              </div>
            )}
            {bulletin.orderOfService && (
              <div>
                <h3 className="text-sm font-semibold text-gray-400 mb-1">Order of Service</h3>
                <pre className="text-gray-300 whitespace-pre-wrap text-sm font-sans">{bulletin.orderOfService}</pre>
              </div>
            )}
            {bulletin.scriptureRef && (
              <div>
                <h3 className="text-sm font-semibold text-gray-400 mb-1">Scripture</h3>
                <p className="text-gray-300">{bulletin.scriptureRef}</p>
              </div>
            )}
            {bulletin.preacher && (
              <div>
                <h3 className="text-sm font-semibold text-gray-400 mb-1">Preacher</h3>
                <p className="text-gray-300">{bulletin.preacher}</p>
              </div>
            )}
            {bulletin.sermonTheme && (
              <div>
                <h3 className="text-sm font-semibold text-gray-400 mb-1">Sermon Theme</h3>
                <p className="text-gray-300">{bulletin.sermonTheme}</p>
              </div>
            )}
            {bulletin.announcements && (
              <div>
                <h3 className="text-sm font-semibold text-gray-400 mb-1">Announcements</h3>
                <pre className="text-gray-300 whitespace-pre-wrap text-sm font-sans">{bulletin.announcements}</pre>
              </div>
            )}
            {bulletin.weeklyCalendar && (
              <div>
                <h3 className="text-sm font-semibold text-gray-400 mb-1">This Week</h3>
                <pre className="text-gray-300 whitespace-pre-wrap text-sm font-sans">{bulletin.weeklyCalendar}</pre>
              </div>
            )}
            {bulletin.ministryNotices && (
              <div>
                <h3 className="text-sm font-semibold text-gray-400 mb-1">Ministry Notices</h3>
                <pre className="text-gray-300 whitespace-pre-wrap text-sm font-sans">{bulletin.ministryNotices}</pre>
              </div>
            )}
            {bulletin.givingInformation && (
              <div>
                <h3 className="text-sm font-semibold text-gray-400 mb-1">Giving</h3>
                <p className="text-gray-300">{bulletin.givingInformation}</p>
              </div>
            )}
            {bulletin.livestreamUrl && (
              <div>
                <h3 className="text-sm font-semibold text-gray-400 mb-1">Livestream</h3>
                <a href={bulletin.livestreamUrl} target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:underline flex items-center gap-1">
                  <Video className="h-4 w-4" /> Watch Online <ArrowRight className="h-4 w-4" />
                </a>
              </div>
            )}
            {bulletin.specialEvents && (
              <div>
                <h3 className="text-sm font-semibold text-gray-400 mb-1">Special Events</h3>
                <p className="text-gray-300">{bulletin.specialEvents}</p>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* UPCOMING SERVICES */}
      {upcoming.length > 0 && (
        <div>
          <h2 className="text-xl font-semibold mb-3">Upcoming Services</h2>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {upcoming.map(s => (
              <Card key={s.id} className="bg-[#1E293B] border-0 shadow-lg">
                <CardHeader>
                  <CardTitle className="text-lg text-white">{s.title || s.serviceType}</CardTitle>
                  <div className="flex items-center gap-1 text-sm text-gray-400">
                    <Calendar className="h-4 w-4" /> {new Date(s.serviceDate).toLocaleDateString()}
                    <Clock className="h-4 w-4 ml-2" /> {s.serviceTime}
                  </div>
                </CardHeader>
                <CardContent>
                  {s.preacherName && <p className="text-sm text-gray-300 flex items-center gap-1"><User className="h-3 w-3" /> {s.preacherName}</p>}
                  {s.theme && <p className="text-sm text-gray-400 mt-1">{s.theme}</p>}
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {!today && !bulletin && upcoming.length === 0 && (
        <Card className="bg-[#1E293B] border-0 shadow-lg">
          <CardContent className="p-8 text-center">
            <Church className="h-12 w-12 mx-auto mb-2 text-gray-600" />
            <p className="text-gray-400">No worship services or bulletins scheduled yet.</p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
