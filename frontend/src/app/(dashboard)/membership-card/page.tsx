"use client"
import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import api from "@/lib/api"
import { getUserId } from "@/lib/auth"
import { QrCode, User, Church, Phone, Mail, Calendar } from "lucide-react"

interface CardData {
  id: string
  fullName: string
  email: string
  phone: string
  congregationName: string
  memberSince: string
  gender: string
  qrCode: string
}

export default function MembershipCardPage() {
  const [card, setCard] = useState<CardData | null>(null)
  const [loading, setLoading] = useState(true)
  const [qrFailed, setQrFailed] = useState(false)
  const userId = getUserId()

  useEffect(() => {
    if (!userId) return
    api.get("/api/membership-card").then((res) => {
      setCard(res.data.data)
      setLoading(false)
    }).catch(() => setLoading(false))
  }, [userId])

  if (!userId) return <div className="flex items-center justify-center py-20 text-muted-foreground">Please log in.</div>
  if (loading) return <Skeleton className="h-64 w-full" />
  if (!card) return (
    <div className="mx-auto max-w-md py-16 text-center">
      <p className="text-lg font-medium text-white">No membership record yet</p>
      <p className="mt-1 text-sm text-muted-foreground">
        Ask your church administrator to link your congregation and member profile.
      </p>
    </div>
  )

  return (
    <div className="max-w-md mx-auto mt-8">
      <Card className="border border-primary/25 bg-card shadow-lg shadow-black/30">
        <CardHeader className="text-center">
          <div className="mx-auto mb-3 flex h-20 w-20 items-center justify-center rounded-full bg-primary/15">
            <User className="h-10 w-10 text-blue-400" aria-hidden="true" />
          </div>
          <CardTitle className="text-2xl font-bold text-white">{card.fullName}</CardTitle>
          <Badge variant="default" className="mx-auto">PCEA Church ID</Badge>
        </CardHeader>
        <CardContent className="space-y-3">
          {card.congregationName && (
            <div className="flex items-center gap-2 text-sm">
              <Church className="h-4 w-4 text-blue-400" aria-hidden="true" />
              <span>{card.congregationName}</span>
            </div>
          )}
          {card.email && (
            <div className="flex items-center gap-2 text-sm">
              <Mail className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
              <span className="break-all">{card.email}</span>
            </div>
          )}
          {card.phone && (
            <div className="flex items-center gap-2 text-sm">
              <Phone className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
              <span>{card.phone}</span>
            </div>
          )}
          {card.memberSince && (
            <div className="flex items-center gap-2 text-sm">
              <Calendar className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
              <span>Member since {new Date(card.memberSince).toLocaleDateString(undefined, { year: "numeric", month: "long" })}</span>
            </div>
          )}
          <div className="flex justify-center pt-4">
            {card.qrCode && !qrFailed ? (
              <img
                src={card.qrCode}
                alt="Membership QR code for verification"
                className="h-32 w-32 rounded-md bg-white p-1.5"
                onError={() => setQrFailed(true)}
              />
            ) : (
              <p className="max-w-xs text-xs leading-relaxed text-muted-foreground">
                The QR code cannot be displayed right now. Your membership details above can be
                used for verification.
              </p>
            )}
          </div>
          {!qrFailed && card.qrCode && (
            <p className="text-center text-xs text-muted-foreground">
              Your Church ID — present this QR for membership and communion verification
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
