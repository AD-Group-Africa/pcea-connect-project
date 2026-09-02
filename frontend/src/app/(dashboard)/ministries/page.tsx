"use client"
import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Skeleton } from "@/components/ui/skeleton"
import { Church, Users, ArrowRight, Compass, Plus } from "lucide-react"
import Link from "next/link"
import api from "@/lib/api"
import { PageTransition } from "@/components/page-transition"
import { EmptyState } from "@/components/empty-state"

interface Ministry {
  id: string; name: string; type: string; description: string; congregationId: string
}

const MINISTRY_ROUTES: Record<string, string> = {
  PCMF: "/ministries/pcmf",
  YPCMF: "/ministries/ypcmf",
  WOMANS_GUILD: "/ministries/guild",
  YOUTH_FELLOWSHIP: "/ministries/youth",
  CHOIR: "/ministries/choir",
  MISSION_EVANGELISM: "/ministries/mission",
}

export default function MinistriesPage() {
  const [myMinistries, setMyMinistries] = useState<Ministry[]>([])
  const [exploreMinistries, setExploreMinistries] = useState<Ministry[]>([])
  const [memberCounts, setMemberCounts] = useState<Record<string, number>>({})
  const [loading, setLoading] = useState(true)
  const [createOpen, setCreateOpen] = useState(false)
  const [newName, setNewName] = useState("")
  const [newType, setNewType] = useState("YOUTH_FELLOWSHIP")

  const loadMinistries = async () => {
    try {
      const [my, explore] = await Promise.all([
        api.get("/api/ministries/me").catch(() => ({ data: { data: [] } })),
        api.get("/api/ministries/explore").catch(() => ({ data: { data: [] } })),
      ])
      const myMins = my.data.data || []
      const exploreMins = explore.data.data || []
      setMyMinistries(myMins)
      setExploreMinistries(exploreMins)

      const counts: Record<string, number> = {}
      await Promise.all(myMins.map(async (m: Ministry) => {
        try {
          const res = await api.get(`/api/ministries/${m.id}/members`)
          counts[m.id] = (res.data.data || []).length
        } catch { counts[m.id] = 0 }
      }))
      setMemberCounts(counts)
    } catch { /* empty */ }
    setLoading(false)
  }

  useEffect(() => { loadMinistries() }, [])

  const handleCreate = async () => {
    await api.post("/api/ministries", { name: newName, type: newType })
    setCreateOpen(false); setNewName(""); loadMinistries()
  }

  if (loading) return <Skeleton className="h-96 w-full" />

  return (
    <PageTransition>
      <div className="space-y-6 text-white">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold">Ministries</h1>
          <Dialog open={createOpen} onOpenChange={setCreateOpen}>
            <DialogTrigger asChild>
              <Button className="gap-2 bg-blue-600 hover:bg-blue-700"><Plus className="h-4 w-4" /> Create</Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md bg-gray-900 text-white">
              <DialogHeader><DialogTitle>New Ministry</DialogTitle></DialogHeader>
              <div className="space-y-3">
                <div><Label>Name</Label><Input value={newName} onChange={(e) => setNewName(e.target.value)} className="bg-gray-800 border-gray-700 text-white" /></div>
                <div><Label>Type</Label>
                  <Select value={newType} onValueChange={setNewType}>
                    <SelectTrigger className="bg-gray-800 border-gray-700 text-white"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="YOUTH_FELLOWSHIP">Youth Fellowship</SelectItem>
                      <SelectItem value="PCMF">PCMF</SelectItem>
                      <SelectItem value="YPCMF">YPCMF</SelectItem>
                      <SelectItem value="WOMANS_GUILD">Woman&apos;s Guild</SelectItem>
                      <SelectItem value="BOYS_BRIGADE">Boys Brigade</SelectItem>
                      <SelectItem value="GIRLS_BRIGADE">Girls Brigade</SelectItem>
                      <SelectItem value="CHOIR">Choir</SelectItem>
                      <SelectItem value="CHURCH_SCHOOL">Sunday School</SelectItem>
                      <SelectItem value="MISSION_EVANGELISM">Mission &amp; Evangelism</SelectItem>
                      <SelectItem value="DEVELOPMENT_COMMITTEE">Development Committee</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <Button className="w-full bg-blue-600 hover:bg-blue-700" onClick={handleCreate}>Create</Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        <div>
          <h2 className="text-xl font-semibold mb-3 flex items-center gap-2">
            <Users className="h-5 w-5 text-yellow-500" /> My Ministries
          </h2>
          {myMinistries.length === 0 ? (
            <EmptyState icon={<Users className="h-16 w-16" />} title="No memberships" description="You are not a member of any ministry yet. Explore ministries below." />
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {myMinistries.map(m => (
                <Card key={m.id} className="bg-[#1E293B] border-0 shadow-lg hover:shadow-xl transition-shadow">
                  <CardHeader>
                    <CardTitle className="text-white">{m.name}</CardTitle>
                    <Badge className="w-fit">{m.type.replace(/_/g, " ")}</Badge>
                  </CardHeader>
                  <CardContent>
                    {m.description && <p className="text-sm text-gray-400 mb-3">{m.description}</p>}
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-gray-500">{memberCounts[m.id] || 0} members</span>
                      <Link href={MINISTRY_ROUTES[m.type] || "/ministries"} className="inline-flex items-center gap-1 text-sm font-medium text-blue-400 hover:text-blue-300">
                        Open <ArrowRight className="h-4 w-4" />
                      </Link>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>

        {exploreMinistries.length > 0 && (
          <div>
            <h2 className="text-xl font-semibold mb-3 flex items-center gap-2">
              <Compass className="h-5 w-5 text-green-400" /> Explore Ministries
            </h2>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {exploreMinistries.map(m => (
                <Card key={m.id} className="bg-[#1E293B] border-0 shadow-lg hover:shadow-xl transition-shadow">
                  <CardHeader>
                    <CardTitle className="text-white">{m.name}</CardTitle>
                    <Badge className="w-fit">{m.type.replace(/_/g, " ")}</Badge>
                  </CardHeader>
                  <CardContent>
                    {m.description && <p className="text-sm text-gray-400 mb-3">{m.description}</p>}
                    {MINISTRY_ROUTES[m.type] && (
                      <Link href={MINISTRY_ROUTES[m.type]} className="inline-flex items-center gap-1 text-sm font-medium text-blue-400 hover:text-blue-300">
                        View <ArrowRight className="h-4 w-4" />
                      </Link>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        <div>
          <h2 className="text-xl font-semibold mb-3 flex items-center gap-2">
            <Church className="h-5 w-5 text-blue-400" /> Learning &amp; Children
          </h2>
          <div className="grid gap-4 md:grid-cols-2">
            <Card className="bg-[#1E293B] border-0 shadow-lg hover:shadow-xl transition-shadow">
              <CardContent className="p-4 flex items-center justify-between">
                <div>
                  <p className="font-medium text-white">Sunday School</p>
                  <p className="text-sm text-gray-400">Child, parent &amp; teacher views</p>
                </div>
                <Link href="/sunday-school"><Button variant="outline">Open</Button></Link>
              </CardContent>
            </Card>
            <Card className="bg-[#1E293B] border-0 shadow-lg hover:shadow-xl transition-shadow">
              <CardContent className="p-4 flex items-center justify-between">
                <div>
                  <p className="font-medium text-white">Catechism</p>
                  <p className="text-sm text-gray-400">Courses, modules &amp; lessons</p>
                </div>
                <Link href="/catechism"><Button variant="outline">Open</Button></Link>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </PageTransition>
  )
}
