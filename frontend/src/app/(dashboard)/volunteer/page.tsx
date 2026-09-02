"use client"
import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Skeleton } from "@/components/ui/skeleton"
import api from "@/lib/api"
import { getUserId } from "@/lib/auth"
import { Users, CalendarPlus, ClipboardCheck, Clock } from "lucide-react"
import { PageTransition } from "@/components/page-transition"
import { EmptyState } from "@/components/empty-state"

export default function VolunteerPage() {
  const [teams, setTeams] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const userId = getUserId()
  const [teamOpen, setTeamOpen] = useState(false); const [teamName, setTeamName] = useState(""); const [congId, setCongId] = useState("")
  const [schedOpen, setSchedOpen] = useState(false); const [schedTeamId, setSchedTeamId] = useState(""); const [eventName, setEventName] = useState(""); const [schedAt, setSchedAt] = useState("")
  const [signupOpen, setSignupOpen] = useState(false); const [scheduleId, setScheduleId] = useState(""); const [role, setRole] = useState("")
  const [hours, setHours] = useState<any[]>([])

  useEffect(() => {
    if (!userId) return
    api.get("/api/volunteer/teams/").then(res => setTeams(res.data.data || [])).finally(() => setLoading(false))
    api.get(`/api/volunteer/hours/${userId}`).then(res => setHours(res.data.data || []))
  }, [userId])

  const handleCreateTeam = async () => { await api.post("/api/volunteer/teams", { name: teamName, congregationId: congId }); setTeamOpen(false); const res = await api.get("/api/volunteer/teams/"); setTeams(res.data.data || []) }
  const handleCreateSched = async () => { await api.post("/api/volunteer/schedules", { teamId: schedTeamId, eventName, scheduledAt: schedAt }); setSchedOpen(false) }
  const handleSignup = async () => { if (!userId) return; await api.post(`/api/volunteer/signups?scheduleId=${scheduleId}`, { userId, role }); setSignupOpen(false) }

  if (!userId) return <div className="py-20 text-center text-white">Please log in.</div>
  if (loading) return <Skeleton className="h-96 w-full" />

  return (
    <PageTransition>
      <div className="space-y-6 text-white">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold">Volunteer Hub</h1>
          <Dialog open={teamOpen} onOpenChange={setTeamOpen}>
            <DialogTrigger asChild><Button className="gap-2 bg-blue-600 hover:bg-blue-700"><Users className="h-4 w-4" /> New Team</Button></DialogTrigger>
            <DialogContent className="sm:max-w-md bg-gray-900 text-white">
              <DialogHeader><DialogTitle>Create Team</DialogTitle></DialogHeader>
              <div className="space-y-3">
                <div><Label>Name</Label><Input value={teamName} onChange={(e) => setTeamName(e.target.value)} className="bg-gray-800 border-gray-700 text-white" /></div>
                <div><Label>Congregation ID</Label><Input value={congId} onChange={(e) => setCongId(e.target.value)} className="bg-gray-800 border-gray-700 text-white" /></div>
                <Button className="w-full bg-blue-600 hover:bg-blue-700" onClick={handleCreateTeam}>Create</Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        <Tabs defaultValue="teams">
          <TabsList className="bg-gray-800">
            <TabsTrigger value="teams" className="text-gray-300 data-[state=active]:text-white">Teams</TabsTrigger>
            <TabsTrigger value="hours" className="text-gray-300 data-[state=active]:text-white">My Hours</TabsTrigger>
          </TabsList>
          <TabsContent value="teams" className="mt-4 space-y-3">
            {teams.length === 0 ? (
              <EmptyState icon={<Users className="h-16 w-16" />} title="No teams yet" description="Create your first volunteer team." />
            ) : teams.map((t: any) => (
              <Card key={t.id} className="bg-[#1E293B] border-0 shadow-lg">
                <CardHeader><CardTitle className="text-white">{t.name}</CardTitle></CardHeader>
                <CardContent className="flex gap-2">
                  <Button size="sm" variant="outline" className="text-gray-300 border-gray-600" onClick={() => { setSchedTeamId(t.id); setSchedOpen(true) }}><CalendarPlus className="h-4 w-4 mr-1" /> Schedule</Button>
                  <Button size="sm" variant="outline" className="text-gray-300 border-gray-600" onClick={() => { setScheduleId(t.id); setSignupOpen(true) }}><ClipboardCheck className="h-4 w-4 mr-1" /> Sign Up</Button>
                </CardContent>
              </Card>
            ))}
          </TabsContent>
          <TabsContent value="hours" className="mt-4 space-y-2">
            {hours.map((h: any) => (
              <Card key={h.id} className="bg-[#1E293B] border-0 shadow-lg p-4"><Clock className="inline h-4 w-4 mr-2 text-blue-500" />{h.hours} hours – {new Date(h.date).toLocaleDateString()}</Card>
            ))}
          </TabsContent>
        </Tabs>
      </div>
    </PageTransition>
  )
}
