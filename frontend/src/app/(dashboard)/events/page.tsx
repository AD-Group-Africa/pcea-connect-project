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
import api from "@/lib/api"
import { getUserId } from "@/lib/auth"
import { Calendar, MapPin, Plus, CheckCircle } from "lucide-react"

interface Event {
  id: string; title: string; type: string; location: string; startTime: string; status: string; recurrenceType: string
}

export default function EventsPage() {
  const [events, setEvents] = useState<Event[]>([])
  const [loading, setLoading] = useState(true)
  const userId = getUserId()
  const [createOpen, setCreateOpen] = useState(false)
  const [title, setTitle] = useState("")
  const [type, setType] = useState("SUNDAY_SERVICE")
  const [location, setLocation] = useState("")
  const [startTime, setStartTime] = useState("")

  const loadEvents = async () => {
    setLoading(true)
    try {
      const res = await api.get("/api/events")
      setEvents(res.data.data || [])
    } catch (e) { console.error(e) }
    finally { setLoading(false) }
  }

  useEffect(() => { if (userId) loadEvents() }, [userId])

  const handleCreate = async () => {
    await api.post("/api/events", {
      title, description: "", type, location, organizerId: userId, startTime,
      requiresRegistration: false, qrCheckInEnabled: false, recurrenceType: "NONE"
    })
    setCreateOpen(false)
    loadEvents()
  }

  const handlePublish = async (id: string) => {
    await api.put(`/api/events/${id}/publish`)
    loadEvents()
  }

  if (!userId) return <div className="py-20 text-center text-white">Please log in.</div>
  if (loading) return <Skeleton className="h-96 w-full" />

  return (
    <div className="space-y-6 text-white">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Events</h1>
        <Dialog open={createOpen} onOpenChange={setCreateOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2 bg-blue-600 hover:bg-blue-700"><Plus className="h-4 w-4" /> Create</Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md bg-gray-900 text-white">
            <DialogHeader><DialogTitle>New Event</DialogTitle></DialogHeader>
            <div className="space-y-3">
              <div><Label>Title</Label><Input value={title} onChange={(e) => setTitle(e.target.value)} className="bg-gray-800 border-gray-700 text-white" /></div>
              <div><Label>Type</Label>
                <Select value={type} onValueChange={setType}>
                  <SelectTrigger className="bg-gray-800 border-gray-700 text-white"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="SUNDAY_SERVICE">Sunday Service</SelectItem>
                    <SelectItem value="FELLOWSHIP">Fellowship</SelectItem>
                    <SelectItem value="BRIGADE">Brigade</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div><Label>Location</Label><Input value={location} onChange={(e) => setLocation(e.target.value)} className="bg-gray-800 border-gray-700 text-white" /></div>
              <div><Label>Start Time</Label><Input type="datetime-local" value={startTime} onChange={(e) => setStartTime(e.target.value)} className="bg-gray-800 border-gray-700 text-white" /></div>
              <Button className="w-full bg-blue-600 hover:bg-blue-700" onClick={handleCreate}>Create</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {events.map(event => (
          <Card key={event.id} className="bg-[#1E293B] border-0 shadow-lg">
            <CardHeader>
              <CardTitle className="text-lg text-white">{event.title}</CardTitle>
              <Badge variant={event.status === "PUBLISHED" ? "default" : "secondary"}>{event.status}</Badge>
              <div className="text-sm text-gray-400">
                <span className="flex items-center gap-1"><Calendar className="h-3 w-3" /> {new Date(event.startTime).toLocaleString()}</span>
                {event.location && <span className="flex items-center gap-1"><MapPin className="h-3 w-3" /> {event.location}</span>}
              </div>
            </CardHeader>
            <CardContent>
              {event.status === "DRAFT" && (
                <Button size="sm" variant="outline" className="text-green-400 border-green-400" onClick={() => handlePublish(event.id)}>
                  <CheckCircle className="h-4 w-4 mr-1" /> Publish
                </Button>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
