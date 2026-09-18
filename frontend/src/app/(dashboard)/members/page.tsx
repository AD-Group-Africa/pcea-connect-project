"use client"
import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import api from "@/lib/api"
import { getUserId } from "@/lib/auth"
import { Search, User, MapPin } from "lucide-react"
import { PageTransition } from "@/components/page-transition"
import { EmptyState } from "@/components/empty-state"

interface Member {
  userId: string; fullName: string; email: string; phone: string;
  gender: string; occupation: string; memberStatus: string; congregationName: string | null
}

export default function MembersPage() {
  const [userId, setUserId] = useState<string | null>(null)
  const [members, setMembers] = useState<Member[]>([])
  const [query, setQuery] = useState("")
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)

  const loadMembers = async (search: string = "") => {
    setLoading(true)
    setError(false)
    try {
      const res = search ? await api.get(`/api/members/search?q=${search}`) : await api.get("/api/members")
      setMembers(res.data.data || [])
    } catch {
      setError(true)
    } finally { setLoading(false) }
  }

  useEffect(() => {
    const uid = getUserId()
    setUserId(uid)
    if (uid) loadMembers()
    else setLoading(false)
  }, [])

  if (!userId) return <div className="py-20 text-center text-white">Please log in.</div>
  if (loading) return <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">{Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-32" />)}</div>
  if (error) return (
    <div className="py-16 text-center">
      <p className="text-white">We couldn&apos;t load the member directory.</p>
      <Button className="mt-4" onClick={() => loadMembers(query)}>Try again</Button>
    </div>
  )

  return (
    <PageTransition>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row justify-between gap-4">
          <h1 className="text-3xl font-bold text-white">Members</h1>
          <div className="flex gap-2">
            <Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search members…"
              className="w-full sm:w-64" aria-label="Search members"
              onKeyDown={(e) => { if (e.key === "Enter") loadMembers(query) }} />
            <Button onClick={() => loadMembers(query)}>
              <Search className="h-5 w-5 mr-2" /> Search
            </Button>
          </div>
        </div>

        {members.length === 0 ? (
          <EmptyState icon={<User className="h-16 w-16" />} title="No members found" description="Try a different search term." />
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {members.map(m => (
              <Card key={m.userId} className="bg-card border-0 shadow-lg">
                <CardHeader>
                  <CardTitle className="text-lg text-white flex items-center gap-2">
                    <User className="h-6 w-6 text-blue-500" /> {m.fullName}
                  </CardTitle>
                  <Badge variant={m.memberStatus === "ACTIVE" ? "default" : "secondary"} className="w-fit">
                    {m.memberStatus}
                  </Badge>
                </CardHeader>
                <CardContent className="space-y-1 text-sm text-muted-foreground">
                  <p className="truncate">{m.email}</p>
                  {m.phone && <p className="truncate">{m.phone}</p>}
                  {m.congregationName && (
                    <p className="flex items-center gap-1.5 text-xs">
                      <MapPin className="h-3.5 w-3.5" aria-hidden="true" /> {m.congregationName}
                    </p>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </PageTransition>
  )
}
