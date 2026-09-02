"use client"
import { useEffect, useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Skeleton } from "@/components/ui/skeleton"
import api from "@/lib/api"
import { getUserId } from "@/lib/auth"
import { Hand, Stethoscope, Plus } from "lucide-react"

export default function PastoralCarePage() {
  const [mounted, setMounted] = useState(false)
  const userId = getUserId()
  const [prayers, setPrayers] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [prayerOpen, setPrayerOpen] = useState(false)
  const [prayerRequest, setPrayerRequest] = useState("")
  const [isAnonymous, setIsAnonymous] = useState(false)

  const loadData = async () => {
    try {
      const res = await api.get("/api/pastoralcare/prayer/mine")
      setPrayers(res.data.data || [])
    } catch (e) {
      console.error(e)
    } finally { setLoading(false) }
  }

  useEffect(() => { setMounted(true); if (userId) loadData(); else setLoading(false) }, [userId])

  const handleSubmitPrayer = async () => {
    await api.post("/api/pastoralcare/prayer", { request: prayerRequest, isAnonymous })
    setPrayerOpen(false)
    setPrayerRequest("")
    setIsAnonymous(false)
    loadData()
  }

  if (!mounted) return null
  if (!userId) return <div className="py-20 text-center text-white">Please log in.</div>
  if (loading) return <Skeleton className="h-96 w-full" />

  return (
    <div className="space-y-8 text-white">
      <div>
        <h1 className="text-3xl font-bold">Pastoral Care</h1>
        <p className="text-gray-400 mt-1">Submit prayer requests and pastoral care needs confidentially.</p>
      </div>
      <section>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-xl font-semibold flex items-center gap-2">
            <Hand className="h-5 w-5 text-blue-500" /> My Prayer Requests
          </h2>
          <Dialog open={prayerOpen} onOpenChange={setPrayerOpen}>
            <DialogTrigger asChild>
              <Button size="sm" className="bg-blue-600 hover:bg-blue-700 gap-2">
                <Plus className="h-4 w-4" /> Submit Prayer
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md bg-gray-900 text-white">
              <DialogHeader><DialogTitle>Submit Prayer Request</DialogTitle></DialogHeader>
              <div className="space-y-3">
                <div>
                  <Label>Your Request</Label>
                  <textarea
                    className="w-full bg-gray-800 border-gray-700 text-white rounded p-2 min-h-[100px]"
                    value={prayerRequest}
                    onChange={(e) => setPrayerRequest(e.target.value)}
                    placeholder="Share your prayer need..."
                  />
                </div>
                <div className="flex items-center gap-2">
                  <input type="checkbox" id="anonymous" checked={isAnonymous} onChange={(e) => setIsAnonymous(e.target.checked)} />
                  <Label htmlFor="anonymous" className="text-sm">Submit anonymously</Label>
                </div>
                <Button className="w-full bg-blue-600 hover:bg-blue-700" onClick={handleSubmitPrayer}>Submit</Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
        {prayers.length === 0 ? (
          <Card className="bg-[#1E293B] border-0 shadow-lg">
            <CardContent className="p-6 text-center">
              <Hand className="h-10 w-10 mx-auto mb-2 text-gray-600" />
              <p className="text-gray-400">No prayer requests submitted yet.</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-2">
            {prayers.map(p => (
              <Card key={p.id} className="bg-[#1E293B] border-0 shadow-lg">
                <CardContent className="p-4">
                  <p className="text-white">{p.request}</p>
                  <div className="flex items-center gap-2 mt-2">
                    {p.isAnonymous && <Badge variant="secondary">Anonymous</Badge>}
                    <span className="text-xs text-gray-500">{new Date(p.createdAt).toLocaleString()}</span>
                    {p.status && <Badge variant="outline">{p.status}</Badge>}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </section>
      <Card className="bg-[#1E293B] border-0 shadow-lg">
        <CardContent className="p-6">
          <div className="flex items-center gap-2 mb-2">
            <Stethoscope className="h-5 w-5 text-blue-500" />
            <h2 className="text-lg font-semibold">Need Pastoral Care?</h2>
          </div>
          <p className="text-gray-400 text-sm">
            For pastoral visits, hospital visits, counselling, bereavement support, or family support,
            please contact your church office directly or submit a prayer request above.
            All pastoral care information is kept strictly confidential and is only accessible to
            authorized pastoral staff.
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
