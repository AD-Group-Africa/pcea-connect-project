"use client"
import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import api from "@/lib/api"
import { getUserId } from "@/lib/auth"
import { Search, User } from "lucide-react"
import Link from "next/link"
import { PageTransition } from "@/components/page-transition"
import { EmptyState } from "@/components/empty-state"

interface Member {
  userId: string; fullName: string; email: string; phone: string;
  gender: string; occupation: string; memberStatus: string; congregationName: string | null
}

export default function MembersPage() {
  const [members, setMembers] = useState<Member[]>([])
  const [query, setQuery] = useState("")
  const [loading, setLoading] = useState(true)
  const userId = getUserId()

  const loadMembers = async (search: string = "") => {
    setLoading(true)
    try {
      const res = search ? await api.get(`/api/members/search?q=${search}`) : await api.get("/api/members")
      setMembers(res.data.data || [])
    } catch (e) { console.error(e) } finally { setLoading(false) }
  }

  useEffect(() => { if (userId) loadMembers() }, [userId])

  if (!userId) return <div className="py-20 text-center text-white">Please log in.</div>

  return (
    <PageTransition>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row justify-between gap-4">
          <h1 className="text-3xl font-bold text-white">Members</h1>
          <div className="flex gap-2">
            <Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search members..."
              className="bg-gray-800 border-gray-700 text-white placeholder:text-gray-400 w-64" aria-label="Search members" />
            <Button onClick={() => loadMembers(query)} className="bg-blue-600 hover:bg-blue-700">
              <Search className="h-5 w-5 mr-2" /> Search
            </Button>
          </div>
        </div>

        {loading ? (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {[1,2,3,4,5,6].map(i => <Skeleton key={i} className="h-32" />)}
          </div>
        ) : members.length === 0 ? (
          <EmptyState icon={<User className="h-16 w-16" />} title="No members found" description="Try a different search term." />
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {members.map(m => (
              <Card key={m.userId} className="bg-[#1E293B] border-0 shadow-lg">
                <CardHeader>
                  <CardTitle className="text-lg text-white flex items-center gap-2">
                    <User className="h-6 w-6 text-blue-500" /> {m.fullName}
                  </CardTitle>
                  <Badge variant={m.memberStatus === "ACTIVE" ? "default" : "secondary"} className="w-fit">
                    {m.memberStatus}
                  </Badge>
                </CardHeader>
                <CardContent className="text-sm text-gray-300 space-y-1">
                  <p>{m.email}</p><p>{m.phone}</p>
                  {m.congregationName && <p>? {m.congregationName}</p>}
                  <Link href={`/members/${m.userId}`} className="text-blue-400 hover:underline text-sm">View Profile</Link>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </PageTransition>
  )
}
