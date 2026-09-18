"use client"
import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Skeleton } from "@/components/ui/skeleton"
import api, { apiErrorMessage } from "@/lib/api"
import { getUserId, getRoles } from "@/lib/auth"

const STAFF_ROLES = ["SUPER_ADMIN", "CHURCH_ADMIN", "ADMIN", "PASTOR", "ELDER", "MINISTRY_LEADER"]
import { Calendar, MapPin, Plus, CheckCircle2, CalendarDays } from "lucide-react"
import { toast } from "sonner"
import { EmptyState } from "@/components/empty-state"

interface Event {
  id: string; title: string; type: string; location: string; startTime: string; status: string; recurrenceType: string
}

export default function EventsPage() {
  const [events, setEvents] = useState<Event[]>([])
  const [loading, setLoading] = useState(true)
  const [userId, setUserId] = useState<string | null>(null)
  const [isStaff, setIsStaff] = useState(false)
  const [createOpen, setCreateOpen] = useState(false)
  const [title, setTitle] = useState("")
  const [type, setType] = useState("SUNDAY_SERVICE")
  const [location, setLocation] = useState("")
  const [startTime, setStartTime] = useState("")
  const [saving, setSaving] = useState(false)

  const loadEvents = async () => {
    setLoading(true)
    try {
      const res = await api.get("/api/events")
      setEvents(res.data.data || [])
    } catch {
      setEvents([])
    } finally { setLoading(false) }
  }

  useEffect(() => {
    const uid = getUserId()
    setUserId(uid)
    setIsStaff(getRoles().some((r) => STAFF_ROLES.includes(r)))
    if (uid) loadEvents()
    else setLoading(false)
  }, [])

  const handleCreate = async () => {
    if (!title.trim() || !startTime) {
      toast.error("Please add a title and start time")
      return
    }
    setSaving(true)
    try {
      await api.post("/api/events", {
        title: title.trim(), description: "", type, location, organizerId: userId, startTime,
        requiresRegistration: false, qrCheckInEnabled: false, recurrenceType: "NONE"
      })
      setCreateOpen(false)
      setTitle(""); setLocation(""); setStartTime("")
      toast.success("Event created")
      loadEvents()
    } catch (e) {
      toast.error(apiErrorMessage(e, "Could not create the event. Please try again."))
    } finally {
      setSaving(false)
    }
  }

  const handlePublish = async (id: string) => {
    try {
      await api.put(`/api/events/${id}/publish`)
      toast.success("Event published")
      loadEvents()
    } catch (e) {
      toast.error(apiErrorMessage(e, "Could not publish this event"))
    }
  }

  if (!userId) return <div className="py-20 text-center text-white">Please log in.</div>
  if (loading) return <Skeleton className="h-96 w-full" />

  return (
    <div className="space-y-6 text-white">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Events</h1>
        {isStaff && (
          <Dialog open={createOpen} onOpenChange={setCreateOpen}>
            <DialogTrigger asChild>
              <Button className="gap-2"><Plus className="h-4 w-4" /> New Event</Button>
            </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <DialogHeader><DialogTitle>New Event</DialogTitle></DialogHeader>
            <div className="space-y-3">
              <div><Label htmlFor="event-title">Title</Label><Input id="event-title" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Harvest Sunday" required /></div>
              <div><Label htmlFor="event-type">Type</Label>
                <Select value={type} onValueChange={setType}>
                  <SelectTrigger id="event-type"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="SUNDAY_SERVICE">Sunday Service</SelectItem>
                    <SelectItem value="FELLOWSHIP">Fellowship</SelectItem>
                    <SelectItem value="BRIGADE">Brigade</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div><Label htmlFor="event-location">Location</Label><Input id="event-location" value={location} onChange={(e) => setLocation(e.target.value)} placeholder="Church grounds" /></div>
              <div><Label htmlFor="event-start">Start Time</Label><Input id="event-start" type="datetime-local" value={startTime} onChange={(e) => setStartTime(e.target.value)} required /></div>
              <Button className="w-full" disabled={saving} onClick={handleCreate}>{saving ? "Creating…" : "Create Event"}</Button>
            </div>
          </DialogContent>
          </Dialog>
        )}
      </div>

      {events.length === 0 ? (
        <EmptyState
          icon={<CalendarDays className="h-16 w-16" />}
          title="No events yet"
          description="Services and fellowship events will appear here once they are scheduled."
        />
      ) : (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {events.map(event => (
          <Card key={event.id} className="bg-card border-0 shadow-lg">
            <CardHeader>
              <CardTitle className="text-lg text-white">{event.title}</CardTitle>
              <Badge variant={event.status === "PUBLISHED" ? "default" : "secondary"}>{event.status}</Badge>
              <div className="text-sm text-gray-400">
                <span className="flex items-center gap-1"><Calendar className="h-3 w-3" /> {new Date(event.startTime).toLocaleString()}</span>
                {event.location && <span className="flex items-center gap-1"><MapPin className="h-3 w-3" /> {event.location}</span>}
              </div>
            </CardHeader>
            <CardContent>
              {isStaff && event.status === "DRAFT" && (
                <Button size="sm" variant="outline" className="border-green-400/60 text-green-400 hover:bg-green-500/10 hover:text-green-300" onClick={() => handlePublish(event.id)}>
                  <CheckCircle2 className="mr-1 h-4 w-4" aria-hidden="true" /> Publish
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
