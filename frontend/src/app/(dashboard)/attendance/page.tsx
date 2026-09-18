"use client"
import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Skeleton } from "@/components/ui/skeleton"
import api, { apiErrorMessage } from "@/lib/api"
import { getUserId } from "@/lib/auth"
import { ClipboardCheck, UserCheck, UserX, Clock } from "lucide-react"
import { toast } from "sonner"
import { PageTransition } from "@/components/page-transition"

interface AttendanceRecord { id: string; userId: string; type: string; date: string; checkInTime: string | null; checkOutTime: string | null; status: string }

export default function AttendancePage() {
  const [mounted, setMounted] = useState(false); const [userId, setUserId] = useState<string | null>(null)
  const [records, setRecords] = useState<AttendanceRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [markOpen, setMarkOpen] = useState(false); const [attType, setAttType] = useState("SUNDAY_SERVICE"); const [saving, setSaving] = useState(false)

  useEffect(() => { setMounted(true); const id = getUserId(); setUserId(id); if (id) loadRecords(id); else setLoading(false) }, [])
  const loadRecords = async (uid: string) => { try { const res = await api.get(`/api/attendance/user/${uid}`); setRecords(res.data.data || []) } catch (e) {} finally { setLoading(false) } }

  const handleMarkAttendance = async () => {
    setSaving(true)
    try {
      // Congregation is derived from the member's record server-side when left empty.
      await api.post("/api/attendance", { userId, type: attType, referenceId: "", congregationId: "" })
      setMarkOpen(false)
      toast.success("Attendance recorded")
      if (userId) loadRecords(userId)
    } catch (e) {
      toast.error(apiErrorMessage(e, "Could not record attendance. Please try again."))
    } finally {
      setSaving(false)
    }
  }
  const handleCheckIn = async (id: string) => {
    try { await api.put(`/api/attendance/${id}/checkin`); toast.success("Checked in"); if (userId) loadRecords(userId) }
    catch (e) { toast.error(apiErrorMessage(e, "Could not check in")) }
  }
  const handleCheckOut = async (id: string) => {
    try { await api.put(`/api/attendance/${id}/checkout`); toast.success("Checked out"); if (userId) loadRecords(userId) }
    catch (e) { toast.error(apiErrorMessage(e, "Could not check out")) }
  }

  if (!mounted) return null
  if (!userId) return <div className="py-20 text-center text-white">Please log in.</div>
  if (loading) return <Skeleton className="h-96 w-full" />

  return (
    <PageTransition>
      <div className="space-y-6 text-white">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold">Attendance</h1>
          <Dialog open={markOpen} onOpenChange={setMarkOpen}>
            <DialogTrigger asChild><Button className="gap-2"><ClipboardCheck className="h-4 w-4" /> Mark Attendance</Button></DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <DialogHeader><DialogTitle>Mark Attendance</DialogTitle></DialogHeader>
              <div className="space-y-3">
                <div><Label htmlFor="att-type">Activity</Label><Select value={attType} onValueChange={setAttType}>
                  <SelectTrigger id="att-type"><SelectValue /></SelectTrigger>
                  <SelectContent><SelectItem value="SUNDAY_SERVICE">Sunday Service</SelectItem><SelectItem value="BRIGADE">Brigade</SelectItem><SelectItem value="GUILD">Guild</SelectItem><SelectItem value="YOUTH">Youth</SelectItem></SelectContent></Select></div>
                <p className="text-xs text-muted-foreground">Records your attendance for your own congregation.</p>
                <Button className="w-full" disabled={saving} onClick={handleMarkAttendance}>{saving ? "Recording…" : "Record"}</Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {records.length === 0 ? (
          <div className="text-center py-16 text-gray-400"><ClipboardCheck className="h-16 w-16 mx-auto mb-4 opacity-20" /><p>No attendance records yet.</p></div>
        ) : (
          <Card className="bg-card border-0 shadow-lg overflow-hidden">
            <Table>
              <TableHeader><TableRow><TableHead className="text-gray-400">Date</TableHead><TableHead className="text-gray-400">Type</TableHead><TableHead className="text-gray-400">Status</TableHead><TableHead className="text-gray-400">Check-In</TableHead><TableHead className="text-gray-400">Actions</TableHead></TableRow></TableHeader>
              <TableBody>
                {records.map(r => (
                  <TableRow key={r.id}>
                    <TableCell className="text-white">{new Date(r.date).toLocaleDateString()}</TableCell>
                    <TableCell className="text-white capitalize">{r.type.replace("_"," ").toLowerCase()}</TableCell>
                    <TableCell><Badge variant={r.status==="PRESENT"?"default":"secondary"}>{r.status.replace(/_/g, " ").toLowerCase()}</Badge></TableCell>
                    <TableCell className="text-gray-300">{r.checkInTime ? new Date(r.checkInTime).toLocaleTimeString() : "—"}</TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        {!r.checkInTime && <Button size="sm" variant="outline" className="text-green-400 border-green-400" onClick={() => handleCheckIn(r.id)}><UserCheck className="h-4 w-4" /> Check In</Button>}
                        {r.checkInTime && !r.checkOutTime && <Button size="sm" variant="outline" className="text-orange-400 border-orange-400" onClick={() => handleCheckOut(r.id)}><UserX className="h-4 w-4" /> Check Out</Button>}
                        {r.checkOutTime && <span className="text-sm text-gray-400"><Clock className="inline h-3 w-3 mr-1" />{new Date(r.checkOutTime).toLocaleTimeString()}</span>}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Card>
        )}
      </div>
    </PageTransition>
  )
}
