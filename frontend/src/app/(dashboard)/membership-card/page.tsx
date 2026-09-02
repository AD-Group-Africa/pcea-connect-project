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
  if (!card) return <p className="text-muted-foreground">No membership data available.</p>

  return (
    <div className="max-w-md mx-auto mt-8">
      <Card className="backdrop-blur-sm bg-white/80 dark:bg-gray-900/80 shadow-lg shadow-black/30 border-blue-600/20">
        <CardHeader className="text-center">
          <div className="mx-auto w-20 h-20 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center mb-3">
            <User className="h-10 w-10 text-blue-600" />
          </div>
          <CardTitle className="text-2xl font-bold text-white">{card.fullName}</CardTitle>
          <Badge variant="default" className="mt-1">PCEA Member</Badge>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center gap-2 text-sm">
            <Church className="h-4 w-4 text-blue-600" />
            <span>{card.congregationName}</span>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <Mail className="h-4 w-4 text-muted-foreground" />
            <span>{card.email}</span>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <Phone className="h-4 w-4 text-muted-foreground" />
            <span>{card.phone}</span>
          </div>
          {card.memberSince && (
            <div className="flex items-center gap-2 text-sm">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <span>Member since: {card.memberSince}</span>
            </div>
          )}
          <div className="flex justify-center pt-4">
            <img src={card.qrCode} alt="QR Code" className="w-32 h-32" />
          </div>
          <p className="text-center text-xs text-muted-foreground">
            Scan this QR code for verification
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
