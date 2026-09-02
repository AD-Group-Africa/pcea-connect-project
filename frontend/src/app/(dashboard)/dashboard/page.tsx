"use client"
import { useEffect, useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { PageTransition } from "@/components/page-transition"
import api from "@/lib/api"
import { getUserId } from "@/lib/auth"
import { Calendar, Video, Heart, DollarSign, BookOpen, Church, MapPin, ArrowRight, Radio, Clock, User, BookMarked, Megaphone, Users } from "lucide-react"
import Link from "next/link"

export default function DashboardPage() {
  const [mounted, setMounted] = useState(false)
  const [userName, setUserName] = useState("")
  const [verseOfDay, setVerseOfDay] = useState("")
  const [verseRef, setVerseRef] = useState("")
  const [events, setEvents] = useState<any[]>([])
  const [todaysWorship, setTodaysWorship] = useState<any>(null)
  const [latestBulletin, setLatestBulletin] = useState<any>(null)
  const [myMinistries, setMyMinistries] = useState<any[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setMounted(true)
    const userId = getUserId()
    if (!userId) { setLoading(false); return }

    // Parallel data fetching — silently ignore failures (empty states)
    Promise.allSettled([
      api.get("/api/membership-card"),
      api.get("/api/bible/devotional"),
      api.get("/api/events"),
      api.get("/api/worship/today"),
      api.get("/api/worship/bulletins/latest"),
      api.get("/api/ministries/me"),
      api.get("/api/notifications/me/unread-count"),
    ]).then(([userRes, verseRes, eventsRes, worshipRes, bulletinRes, ministriesRes, notifRes]) => {
      if (userRes.status === "fulfilled") setUserName(userRes.value.data.data?.fullName || "")
      if (verseRes.status === "fulfilled") {
        const d = verseRes.value.data.data
        if (d) { setVerseOfDay(d.content); setVerseRef(d.verseRef) }
      }
      if (eventsRes.status === "fulfilled") {
        const all = eventsRes.value.data.data || []
        setEvents(all.filter((e: any) => e.status === "PUBLISHED").slice(0, 4))
      }
      if (worshipRes.status === "fulfilled") setTodaysWorship(worshipRes.value.data.data)
      if (bulletinRes.status === "fulfilled") setLatestBulletin(bulletinRes.value.data.data)
      if (ministriesRes.status === "fulfilled") setMyMinistries(ministriesRes.value.data.data || [])
      if (notifRes.status === "fulfilled") setUnreadCount(notifRes.value.data.data?.count || 0)
      setLoading(false)
    })
  }, [])

  if (!mounted) return null
  if (loading) return <DashboardSkeleton />

  const hour = new Date().getHours()
  const greeting = hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening"
  const firstName = userName ? userName.split(" ")[0] : "Friend"

  return (
    <PageTransition>
      <div className="space-y-6">
        {/* Greeting */}
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-white">{greeting}, {firstName}</h1>
          <p className="text-gray-400 mt-0.5 text-sm">Welcome to your church home</p>
        </div>

        {/* Today's Worship — Hero Card */}
        {todaysWorship ? (
          <Card className="border border-blue-800/50 shadow-xl overflow-hidden">
            <div className="bg-gradient-to-r from-[#1A3C8F] to-[#0a0f1e] p-5 sm:p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <Church className="h-5 w-5 text-blue-400" />
                  <h2 className="text-lg font-bold text-white">Today&apos;s Worship</h2>
                </div>
                {todaysWorship.livestreamId && (
                  <Badge variant="destructive" className="flex items-center gap-1">
                    <Radio className="h-3 w-3 animate-pulse" /> LIVE
                  </Badge>
                )}
              </div>
              <div className="grid gap-2.5 sm:grid-cols-2">
                {todaysWorship.preacherName && (
                  <div className="flex items-center gap-2 text-gray-300 text-sm">
                    <User className="h-4 w-4 text-blue-400 shrink-0" />
                    {todaysWorship.preacherName}
                  </div>
                )}
                {todaysWorship.theme && (
                  <div className="flex items-center gap-2 text-gray-300 text-sm">
                    <BookMarked className="h-4 w-4 text-blue-400 shrink-0" />
                    {todaysWorship.theme}
                  </div>
                )}
                {todaysWorship.scriptureRef && (
                  <div className="flex items-center gap-2 text-gray-300 text-sm">
                    <BookOpen className="h-4 w-4 text-blue-400 shrink-0" />
                    {todaysWorship.scriptureRef}
                  </div>
                )}
                {todaysWorship.serviceTime && (
                  <div className="flex items-center gap-2 text-gray-300 text-sm">
                    <Clock className="h-4 w-4 text-blue-400 shrink-0" />
                    {todaysWorship.serviceTime}
                  </div>
                )}
              </div>
              <div className="flex gap-3 mt-4 flex-wrap">
                {todaysWorship.livestreamId && (
                  <Link href="/livestream" className="inline-flex items-center gap-1 text-sm font-medium text-blue-400 hover:text-blue-300">
                    <Video className="h-4 w-4" /> Watch Live
                  </Link>
                )}
                {latestBulletin && (
                  <Link href="/worship" className="inline-flex items-center gap-1 text-sm font-medium text-blue-400 hover:text-blue-300">
                    <BookOpen className="h-4 w-4" /> View Bulletin
                  </Link>
                )}
              </div>
            </div>
          </Card>
        ) : latestBulletin ? (
          <Card className="bg-[#1E293B] border-0 shadow-lg">
            <CardContent className="p-5 sm:p-6">
              <div className="flex items-center gap-2 mb-2">
                <Church className="h-5 w-5 text-blue-400" />
                <h2 className="text-lg font-bold text-white">Latest Bulletin</h2>
              </div>
              <p className="text-gray-300">{latestBulletin.title || "Weekly Bulletin"}</p>
              {latestBulletin.welcomeMessage && <p className="text-sm text-gray-400 mt-1">{latestBulletin.welcomeMessage}</p>}
              <Link href="/worship" className="inline-flex items-center gap-1 text-sm font-medium text-blue-400 hover:text-blue-300 mt-3">
                Open Bulletin <ArrowRight className="h-4 w-4" />
              </Link>
            </CardContent>
          </Card>
        ) : (
          <Card className="bg-[#1E293B] border-0 shadow-lg">
            <CardContent className="p-5 sm:p-6 text-center">
              <Church className="h-10 w-10 mx-auto mb-2 text-gray-600" />
              <p className="text-gray-400 text-sm">Your church hasn&apos;t published a bulletin yet.</p>
              <p className="text-xs text-gray-500 mt-1">Check back for today&apos;s service information.</p>
            </CardContent>
          </Card>
        )}

        {/* Notifications Banner */}
        {unreadCount > 0 && (
          <Link href="/notifications" className="block">
            <Card className="bg-[#1E293B] border border-blue-800/50 shadow-lg hover:shadow-xl transition-shadow cursor-pointer">
              <CardContent className="p-4 flex items-center gap-3">
                <div className="bg-[#E2A619] text-black rounded-full h-8 w-8 flex items-center justify-center text-sm font-bold shrink-0">
                  {unreadCount}
                </div>
                <p className="text-white text-sm">You have {unreadCount} unread notification{unreadCount > 1 ? "s" : ""}</p>
                <ArrowRight className="h-4 w-4 text-gray-500 ml-auto" />
              </CardContent>
            </Card>
          </Link>
        )}

        {/* Verse of the Day */}
        {verseOfDay && (
          <Card className="bg-[#1E293B] border-0 shadow-lg">
            <CardContent className="p-5 sm:p-6">
              <p className="text-base font-medium italic text-gray-200">&ldquo;{verseOfDay}&rdquo;</p>
              {verseRef && <p className="text-sm text-gray-500 mt-2">&mdash; {verseRef}</p>}
            </CardContent>
          </Card>
        )}

        {/* Quick Actions */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          <QuickAction href="/giving" icon={DollarSign} label="Give" />
          <QuickAction href="/worship" icon={Church} label="Worship" />
          <QuickAction href="/ministries" icon={Users} label="Ministries" />
          <QuickAction href="/events" icon={Calendar} label="Events" />
          <QuickAction href="/bible" icon={BookOpen} label="Bible" />
          <QuickAction href="/pastoral-care" icon={Heart} label="Prayer" />
        </div>

        {/* My Ministries */}
        {myMinistries.length > 0 && (
          <div>
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-lg font-semibold text-white">My Ministries</h2>
              <Link href="/ministries" className="text-sm text-blue-400 hover:underline">View all</Link>
            </div>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {myMinistries.map((m: any) => (
                <Link key={m.id} href={`/ministries/${getMinistryRoute(m.type)}`} className="block">
                  <Card className="bg-[#1E293B] border-0 shadow-lg hover:shadow-xl transition-shadow h-full">
                    <CardContent className="p-4">
                      <p className="font-medium text-white text-sm">{m.name}</p>
                      <Badge className="mt-1 text-xs">{m.type.replace(/_/g, " ")}</Badge>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* Upcoming Events */}
        {events.length > 0 && (
          <div>
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-lg font-semibold text-white">Upcoming Events</h2>
              <Link href="/events" className="text-sm text-blue-400 hover:underline">View all</Link>
            </div>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {events.map(event => (
                <Card key={event.id} className="bg-[#1E293B] border-0 shadow-lg">
                  <CardContent className="p-4">
                    <p className="font-medium text-white text-sm">{event.title}</p>
                    <div className="flex items-center gap-2 mt-2 text-xs text-gray-400">
                      <Calendar className="h-3.5 w-3.5" />
                      {new Date(event.startTime).toLocaleDateString(undefined, { month: "short", day: "numeric" })}
                      {event.location && (
                        <span className="flex items-center gap-1">
                          <MapPin className="h-3.5 w-3.5" />
                          {event.location}
                        </span>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* Footer Info */}
        <div className="pt-6 border-t border-white/5">
          <div className="flex flex-wrap gap-4 text-xs text-gray-500">
            <Link href="/privacy" className="hover:text-gray-400">Privacy</Link>
            <Link href="/terms" className="hover:text-gray-400">Terms</Link>
            <Link href="/child-privacy" className="hover:text-gray-400">Child Privacy</Link>
            <Link href="/support" className="hover:text-gray-400">Support</Link>
            <span className="text-gray-600">A product of Afrika Digitalis</span>
          </div>
        </div>
      </div>
    </PageTransition>
  )
}

function QuickAction({ href, icon: Icon, label }: { href: string; icon: any; label: string }) {
  return (
    <Link href={href} className="block">
      <Card className="bg-[#1E293B] border-0 shadow-md hover:shadow-lg transition-all hover:-translate-y-0.5 cursor-pointer">
        <CardContent className="p-3 sm:p-4 flex flex-col items-center gap-2 text-center">
          <Icon className="h-6 w-6 sm:h-7 sm:w-7 text-[#E2A619]" />
          <span className="text-xs sm:text-sm font-medium text-white">{label}</span>
        </CardContent>
      </Card>
    </Link>
  )
}

function DashboardSkeleton() {
  return (
    <div className="space-y-6">
      <Skeleton className="h-10 w-64" />
      <Skeleton className="h-48 w-full rounded-lg" />
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-20 rounded-lg" />)}
      </div>
    </div>
  )
}

function getMinistryRoute(type: string): string {
  const routes: Record<string, string> = {
    PCMF: "/ministries/pcmf",
    YPCMF: "/ministries/ypcmf",
    WOMANS_GUILD: "/ministries/guild",
    YOUTH_FELLOWSHIP: "/ministries/youth",
    CHOIR: "/ministries/choir",
    MISSION_EVANGELISM: "/ministries/mission",
  }
  return routes[type] || "/ministries"
}
