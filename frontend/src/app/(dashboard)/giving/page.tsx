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
import { getUserId } from "@/lib/auth"
import { DollarSign, HandCoins, CheckCircle2 } from "lucide-react"
import { toast } from "sonner"

interface Contribution {
  id: string; type: string; amount: number; method: string; status: string; transactionRef: string; createdAt: string
}

interface Statement {
  totalAmount: number; titheAmount: number; offeringAmount: number; donationAmount: number; statementYear: number
}

const CONGREGATION_ID = ""

export default function GivingPage() {
  const [userId, setUserId] = useState<string | null>(null)
  const [contributions, setContributions] = useState<Contribution[]>([])
  const [statement, setStatement] = useState<Statement | null>(null)
  const [loading, setLoading] = useState(true)
  const [contributeOpen, setContributeOpen] = useState(false)
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [amount, setAmount] = useState("")
  const [type, setType] = useState("TITHE")
  const [phone, setPhone] = useState("")
  const [description, setDescription] = useState("")
  const [submitting, setSubmitting] = useState(false)
  const [selectedContributionId, setSelectedContributionId] = useState("")
  const [mpesaCode, setMpesaCode] = useState("")

  const loadData = async (uid: string) => {
    try {
      const [contribRes, stmtRes] = await Promise.all([
        api.get(`/api/giving/contributions/${uid}`),
        api.get(`/api/giving/statement/${uid}?year=${new Date().getFullYear()}`)
      ])
      setContributions(contribRes.data.data || [])
      setStatement(stmtRes.data.data)
    } catch {
      setContributions([])
    } finally { setLoading(false) }
  }

  useEffect(() => {
    const uid = getUserId()
    setUserId(uid)
    if (uid) loadData(uid)
    else setLoading(false)
  }, [])

  const handleContribute = async () => {
    if (!userId) return
    const value = parseFloat(amount)
    if (!value || value <= 0) {
      toast.error("Enter a valid amount")
      return
    }
    if (!phone.trim()) {
      toast.error("Enter the M-Pesa number to use")
      return
    }
    setSubmitting(true)
    try {
      // userId is derived from the JWT on the server — do not send it in the body
      await api.post("/api/giving/contribute", {
        type, amount: value, method: "MPESA", phoneNumber: phone.trim(), description, congregationId: CONGREGATION_ID
      })
      setContributeOpen(false)
      setAmount(""); setPhone(""); setDescription("")
      toast.success("Contribution recorded", { description: "Your giving statement has been updated." })
      loadData(userId)
    } catch (e) {
      toast.error(apiErrorMessage(e, "Could not record your contribution. Please try again."))
    } finally {
      setSubmitting(false)
    }
  }

  // Payment confirmation is finance/staff-only. Members see pending status until confirmed.
  const handleConfirmPayment = async () => {
    if (!mpesaCode.trim()) {
      toast.error("Enter the M-Pesa confirmation code")
      return
    }
    setSubmitting(true)
    try {
      await api.post("/api/giving/confirm-payment", { contributionId: selectedContributionId, mpesaCode: mpesaCode.trim() })
      setConfirmOpen(false)
      setMpesaCode("")
      toast.success("Payment confirmed")
      if (userId) loadData(userId)
    } catch (e) {
      setConfirmOpen(false)
      const status = (e as { response?: { status?: number } })?.response?.status
      if (status === 403) {
        toast.info("Only finance staff can confirm payments. Your contribution remains pending.")
      } else {
        toast.error(apiErrorMessage(e, "Could not confirm this payment"))
      }
    } finally {
      setSubmitting(false)
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
              <Button className="gap-2"><HandCoins className="h-4 w-4" /> Give</Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <DialogHeader><DialogTitle>Make a Contribution</DialogTitle></DialogHeader>
              <div className="space-y-3">
                <div><Label>Type</Label>
                  <Select value={type} onValueChange={setType}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="TITHE">Tithe</SelectItem>
                      <SelectItem value="OFFERING">Offering</SelectItem>
                      <SelectItem value="DONATION">Donation</SelectItem>
                      <SelectItem value="PROJECT">Project</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div><Label htmlFor="give-amount">Amount (KES)</Label><Input id="give-amount" type="number" min="1" step="1" inputMode="numeric" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="500" /></div>
                <div><Label htmlFor="give-phone">M-Pesa Phone</Label><Input id="give-phone" type="tel" inputMode="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="0712 345 678" /></div>
                <div><Label htmlFor="give-description">Description (optional)</Label><Input id="give-description" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Tithe for June" /></div>
                <Button className="w-full" disabled={submitting} onClick={handleContribute}>{submitting ? "Submitting…" : "Submit"}</Button>
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
          <Card className="border-0 bg-card shadow-lg">
            <CardContent className="p-10 text-center">
              <DollarSign className="mx-auto mb-3 h-12 w-12 text-muted-foreground/40" aria-hidden="true" />
              <p className="font-medium text-white">No contributions yet</p>
              <p className="mt-1 text-sm text-muted-foreground">
                Your tithes and offerings will appear here after your first gift.
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {contributions.map(c => (
              <Card key={c.id} className="bg-card border-0 shadow-lg">
                <div className="flex items-center justify-between p-4">
                  <div className="flex items-center gap-4">
                    <div className="text-2xl font-bold">{c.amount.toLocaleString()} KES</div>
                    <div>
                      <p className="font-medium capitalize">{c.type.toLowerCase()}</p>
                      <p className="text-sm text-gray-400">{new Date(c.createdAt).toLocaleDateString()}</p>
                    </div>
                  </div>
                  <Badge variant={c.status === "COMPLETED" ? "default" : "secondary"}>{c.status.replace(/_/g, " ").toLowerCase()}</Badge>
                </div>
                {c.transactionRef && (
                  <div className="flex items-center gap-1 px-4 pb-3 text-sm text-muted-foreground">
                    <CheckCircle2 className="h-3 w-3 text-green-500" aria-hidden="true" /> M-Pesa: {c.transactionRef}
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
    <Card className="bg-card border-0 shadow-lg">
      <CardHeader className="pb-2"><CardTitle className="text-sm text-gray-400">{label}</CardTitle></CardHeader>
      <CardContent><div className="text-2xl font-bold">{value}</div></CardContent>
    </Card>
  )
}
