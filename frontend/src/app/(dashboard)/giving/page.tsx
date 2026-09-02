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
import { DollarSign, HandCoins, Smartphone, CheckCircle } from "lucide-react"

interface Contribution {
  id: string; type: string; amount: number; method: string; status: string; transactionRef: string; createdAt: string
}

interface Statement {
  totalAmount: number; titheAmount: number; offeringAmount: number; donationAmount: number; statementYear: number
}

const CONGREGATION_ID = ""

export default function GivingPage() {
  const userId = getUserId()
  const [contributions, setContributions] = useState<Contribution[]>([])
  const [statement, setStatement] = useState<Statement | null>(null)
  const [loading, setLoading] = useState(true)
  const [contributeOpen, setContributeOpen] = useState(false)
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [amount, setAmount] = useState("")
  const [type, setType] = useState("TITHE")
  const [phone, setPhone] = useState("")
  const [description, setDescription] = useState("")
  const [selectedContributionId, setSelectedContributionId] = useState("")
  const [mpesaCode, setMpesaCode] = useState("")

  const loadData = async () => {
    if (!userId) return
    try {
      const [contribRes, stmtRes] = await Promise.all([
        api.get(`/api/giving/contributions/${userId}`),
        api.get(`/api/giving/statement/${userId}?year=${new Date().getFullYear()}`)
      ])
      setContributions(contribRes.data.data || [])
      setStatement(stmtRes.data.data)
    } catch (e) { console.error(e) } finally { setLoading(false) }
  }

  useEffect(() => { if (userId) loadData() }, [userId])

  const handleContribute = async () => {
    if (!userId) return
    // userId is derived from the JWT on the server — do not send it in the body
    await api.post("/api/giving/contribute", {
      type, amount: parseFloat(amount), method: "MPESA", phoneNumber: phone, description, congregationId: CONGREGATION_ID
    })
    setContributeOpen(false)
    setAmount(""); setPhone(""); setDescription("")
    loadData()
  }

  // Payment confirmation is finance/staff-only. Members see pending status until confirmed.
  const handleConfirmPayment = async () => {
    try {
      await api.post("/api/giving/confirm-payment", { contributionId: selectedContributionId, mpesaCode })
      setConfirmOpen(false)
      setMpesaCode("")
      loadData()
    } catch (e: any) {
      if (e?.response?.status === 403) {
        alert("Only finance staff can confirm payments. Your contribution is pending.")
      }
      setConfirmOpen(false)
    }
  }

  if (!userId) return <div className="py-20 text-center text-white">Please log in.</div>
  if (loading) return <Skeleton className="h-96 w-full" />

  return (
    <div className="space-y-6 text-white">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Giving</h1>
        <div className="flex gap-2">
          <Dialog open={contributeOpen} onOpenChange={setContributeOpen}>
            <DialogTrigger asChild>
              <Button className="gap-2 bg-blue-600 hover:bg-blue-700"><HandCoins className="h-4 w-4" /> Give</Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md bg-gray-900 text-white">
              <DialogHeader><DialogTitle>Make a Contribution</DialogTitle></DialogHeader>
              <div className="space-y-3">
                <div><Label>Type</Label>
                  <Select value={type} onValueChange={setType}>
                    <SelectTrigger className="bg-gray-800 border-gray-700 text-white"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="TITHE">Tithe</SelectItem>
                      <SelectItem value="OFFERING">Offering</SelectItem>
                      <SelectItem value="DONATION">Donation</SelectItem>
                      <SelectItem value="PROJECT">Project</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div><Label>Amount (KES)</Label><Input type="number" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="500" className="bg-gray-800 border-gray-700 text-white" /></div>
                <div><Label>M-Pesa Phone</Label><Input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="0712345678" className="bg-gray-800 border-gray-700 text-white" /></div>
                <div><Label>Description</Label><Input value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Tithe for June" className="bg-gray-800 border-gray-700 text-white" /></div>
                <Button className="w-full bg-blue-600 hover:bg-blue-700" onClick={handleContribute}>Submit</Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {statement && (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <MetricCard label={`Total ${statement.statementYear}`} value={statement.totalAmount.toLocaleString() + " KES"} />
          <MetricCard label="Tithes" value={statement.titheAmount.toLocaleString() + " KES"} />
          <MetricCard label="Offerings" value={statement.offeringAmount.toLocaleString() + " KES"} />
          <MetricCard label="Donations" value={statement.donationAmount.toLocaleString() + " KES"} />
        </div>
      )}

      <div>
        <h2 className="text-xl font-semibold mb-3">Recent Contributions</h2>
        {contributions.length === 0 ? (
          <div className="text-center py-10 text-gray-400">
            <DollarSign className="h-12 w-12 mx-auto mb-2 opacity-20" />
            <p>No contributions yet.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {contributions.map(c => (
              <Card key={c.id} className="bg-[#1E293B] border-0 shadow-lg">
                <div className="flex items-center justify-between p-4">
                  <div className="flex items-center gap-4">
                    <div className="text-2xl font-bold">{c.amount.toLocaleString()} KES</div>
                    <div>
                      <p className="font-medium capitalize">{c.type.toLowerCase()}</p>
                      <p className="text-sm text-gray-400">{new Date(c.createdAt).toLocaleDateString()}</p>
                    </div>
                  </div>
                  <Badge variant={c.status === "COMPLETED" ? "default" : "secondary"}>{c.status}</Badge>
                </div>
                {c.transactionRef && (
                  <div className="px-4 pb-3 text-sm text-gray-400 flex items-center gap-1">
                    <CheckCircle className="h-3 w-3 text-green-500" /> M-Pesa: {c.transactionRef}
                  </div>
                )}
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

function MetricCard({ label, value }: any) {
  return (
    <Card className="bg-[#1E293B] border-0 shadow-lg">
      <CardHeader className="pb-2"><CardTitle className="text-sm text-gray-400">{label}</CardTitle></CardHeader>
      <CardContent><div className="text-2xl font-bold">{value}</div></CardContent>
    </Card>
  )
}
