"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import api, { apiErrorMessage } from "@/lib/api";
import { getUserId } from "@/lib/auth";
import { Users, CalendarPlus, ClipboardCheck, Clock, HeartHandshake } from "lucide-react";
import { PageTransition } from "@/components/page-transition";
import { EmptyState } from "@/components/empty-state";
import { toast } from "sonner";

interface Team { id: string; name: string }
interface Schedule {
  id: string; teamId: string; eventName: string; scheduledAt: string; status?: string;
}
interface HourRecord { id: string; hours: number; date: string }

export default function VolunteerPage() {
  const [userId, setUserId] = useState<string | null>(null);
  const [teams, setTeams] = useState<Team[]>([]);
  const [hours, setHours] = useState<HourRecord[]>([]);
  const [loading, setLoading] = useState(true);

  const [teamOpen, setTeamOpen] = useState(false);
  const [teamName, setTeamName] = useState("");
  const [creating, setCreating] = useState(false);

  const [schedTeam, setSchedTeam] = useState<Team | null>(null);
  const [eventName, setEventName] = useState("");
  const [schedAt, setSchedAt] = useState("");
  const [scheduling, setScheduling] = useState(false);

  const [signupTeam, setSignupTeam] = useState<Team | null>(null);
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [loadingSchedules, setLoadingSchedules] = useState(false);

  const loadTeams = async () => {
    try {
      const res = await api.get("/api/volunteer/teams/")
      setTeams(res.data.data || [])
    } catch {
      setTeams([])
    }
  }

  useEffect(() => {
    const uid = getUserId();
    setUserId(uid);
    if (!uid) { setLoading(false); return; }
    loadTeams()
    api.get(`/api/volunteer/hours/${uid}`)
      .then((res) => setHours(res.data.data || []))
      .catch(() => setHours([]))
      .finally(() => setLoading(false));
  }, []);

  const handleCreateTeam = async () => {
    if (!teamName.trim()) { toast.error("Give your team a name"); return; }
    setCreating(true);
    try {
      // Teams are scoped to the member's congregation by the server when it
      // supports it; the empty value keeps existing deployments working.
      await api.post("/api/volunteer/teams", { name: teamName.trim(), congregationId: "" });
      setTeamOpen(false);
      setTeamName("");
      toast.success("Volunteer team created");
      loadTeams();
    } catch (e) {
      toast.error(apiErrorMessage(e, "Could not create the team. Please try again."));
    } finally {
      setCreating(false);
    }
  };

  const handleCreateSchedule = async () => {
    if (!schedTeam) return;
    if (!eventName.trim() || !schedAt) { toast.error("Add an event name and time"); return; }
    setScheduling(true);
    try {
      await api.post("/api/volunteer/schedules", { teamId: schedTeam.id, eventName: eventName.trim(), scheduledAt: schedAt });
      setSchedTeam(null);
      setEventName("");
      setSchedAt("");
      toast.success("Service scheduled");
    } catch (e) {
      toast.error(apiErrorMessage(e, "Could not schedule the service. Please try again."));
    } finally {
      setScheduling(false);
    }
  };

  const openSignups = async (team: Team) => {
    setSignupTeam(team);
    setSchedules([]);
    setLoadingSchedules(true);
    try {
      const res = await api.get(`/api/volunteer/schedules/${team.id}`);
      setSchedules(res.data.data || []);
    } catch {
      setSchedules([]);
    } finally {
      setLoadingSchedules(false);
    }
  };

  const handleSignup = async (scheduleId: string) => {
    if (!userId) return;
    try {
      await api.post(`/api/volunteer/signups?scheduleId=${scheduleId}`, { userId, role: "" });
      toast.success("You're signed up. Thank you for serving!");
    } catch (e) {
      toast.error(apiErrorMessage(e, "Could not sign you up — you may already be signed up."));
    }
  };

  if (!userId) return <div className="py-20 text-center text-white">Please log in.</div>;
  if (loading) return <Skeleton className="h-96 w-full" />;

  return (
    <PageTransition>
      <div className="space-y-6 text-white">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="text-3xl font-bold">Volunteer Hub</h1>
            <p className="mt-1 text-sm text-muted-foreground">Serve your church family</p>
          </div>
          <Dialog open={teamOpen} onOpenChange={setTeamOpen}>
            <DialogTrigger asChild>
              <Button className="gap-2"><Users className="h-4 w-4" aria-hidden="true" /> New Team</Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <DialogHeader><DialogTitle>Create Volunteer Team</DialogTitle></DialogHeader>
              <div className="space-y-3">
                <div><Label htmlFor="team-name">Team Name</Label>
                  <Input id="team-name" value={teamName} onChange={(e) => setTeamName(e.target.value)} placeholder="Ushering, Choir support, Hospitality…" required /></div>
                <Button className="w-full" disabled={creating} onClick={handleCreateTeam}>{creating ? "Creating…" : "Create Team"}</Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        <Tabs defaultValue="teams">
          <TabsList>
            <TabsTrigger value="teams">Teams</TabsTrigger>
            <TabsTrigger value="hours">My Service Hours</TabsTrigger>
          </TabsList>

          <TabsContent value="teams" className="mt-4 space-y-3">
            {teams.length === 0 ? (
              <EmptyState
                icon={<HeartHandshake className="h-16 w-16" />}
                title="No volunteer teams yet"
                description="Create your congregation's first team, or ask your church administrator to set one up."
              />
            ) : (
              teams.map((t) => (
                <Card key={t.id} className="border-0 bg-card shadow-lg">
                  <CardHeader>
                    <CardTitle className="text-white">{t.name}</CardTitle>
                  </CardHeader>
                  <CardContent className="flex flex-wrap gap-2">
                    <Button size="sm" variant="outline" onClick={() => setSchedTeam(t)}>
                      <CalendarPlus className="mr-1 h-4 w-4" aria-hidden="true" /> Schedule
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => openSignups(t)}>
                      <ClipboardCheck className="mr-1 h-4 w-4" aria-hidden="true" /> Sign Up
                    </Button>
                  </CardContent>
                </Card>
              ))
            )}
          </TabsContent>

          <TabsContent value="hours" className="mt-4 space-y-2">
            {hours.length === 0 ? (
              <p className="py-10 text-center text-sm text-muted-foreground">
                You haven&apos;t recorded any service hours yet.
              </p>
            ) : (
              hours.map((h) => (
                <Card key={h.id} className="border-0 bg-card p-4 shadow-lg">
                  <Clock className="mr-2 inline h-4 w-4 text-blue-500" aria-hidden="true" />
                  <span className="text-white">{h.hours} {h.hours === 1 ? "hour" : "hours"}</span>
                  <span className="text-muted-foreground"> — {new Date(h.date).toLocaleDateString()}</span>
                </Card>
              ))
            )}
          </TabsContent>
        </Tabs>
      </div>

      {/* Schedule dialog */}
      <Dialog open={schedTeam !== null} onOpenChange={(open) => { if (!open) setSchedTeam(null) }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader><DialogTitle>Schedule Service{schedTeam ? ` — ${schedTeam.name}` : ""}</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div><Label htmlFor="sched-event">Event / Activity</Label>
              <Input id="sched-event" value={eventName} onChange={(e) => setEventName(e.target.value)} placeholder="Sunday ushering, cleaning day…" required /></div>
            <div><Label htmlFor="sched-at">Date &amp; time</Label>
              <Input id="sched-at" type="datetime-local" value={schedAt} onChange={(e) => setSchedAt(e.target.value)} required /></div>
            <Button className="w-full" disabled={scheduling} onClick={handleCreateSchedule}>{scheduling ? "Scheduling…" : "Schedule"}</Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Sign-up dialog */}
      <Dialog open={signupTeam !== null} onOpenChange={(open) => { if (!open) setSignupTeam(null) }}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Sign Up to Serve{signupTeam ? ` — ${signupTeam.name}` : ""}</DialogTitle>
          </DialogHeader>
          {loadingSchedules ? (
            <Skeleton className="h-24 w-full" />
          ) : schedules.length === 0 ? (
            <div className="py-6 text-center">
              <p className="text-sm text-muted-foreground">No upcoming service slots scheduled yet.</p>
            </div>
          ) : (
            <div className="max-h-80 space-y-2 overflow-y-auto pr-1">
              {schedules.map((s) => (
                <div key={s.id} className="flex items-center justify-between gap-3 rounded-lg border border-white/10 bg-muted/40 p-3">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-white">{s.eventName || "Volunteer service"}</p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(s.scheduledAt).toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" })}
                    </p>
                  </div>
                  <div className="flex shrink-0 items-center gap-2">
                    {s.status && <Badge variant="outline">{s.status.replace(/_/g, " ").toLowerCase()}</Badge>}
                    <Button size="sm" onClick={() => handleSignup(s.id)}>Sign Up</Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </PageTransition>
  );
}
