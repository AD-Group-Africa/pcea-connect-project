"use client"
import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import api from "@/lib/api"
import { MapPin, Phone, Mail, Video, Globe, Search } from "lucide-react"

interface Location {
  id: string
  name: string
  address: string
  latitude: number
  longitude: number
  serviceTimes: string
  phone: string
  email: string
  livestreamUrl: string
  website: string
}

export default function LocatorPage() {
  const [locations, setLocations] = useState<Location[]>([])
  const [loading, setLoading] = useState(true)
  const [query, setQuery] = useState("")
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    api.get("/api/locator")
      .then(res => setLocations(res.data.data || []))
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  const handleSearch = async () => {
    setLoading(true)
    const res = await api.get(`/api/locator?query=${query}`)
    setLocations(res.data.data || [])
    setLoading(false)
  }

  if (!mounted) return null
  if (loading) return <Skeleton className="h-96 w-full" />

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-white">Find a Church</h1>
        <div className="flex gap-2">
          <Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search churches..." />
          <Button onClick={handleSearch}><Search className="h-4 w-4 mr-2" /> Search</Button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {locations.map(loc => (
          <Card key={loc.id} className="backdrop-blur-sm bg-white/80 dark:bg-gray-900/80">
            <CardHeader>
              <CardTitle className="text-lg">{loc.name}</CardTitle>
              <Badge variant="outline" className="w-fit">{loc.address}</Badge>
            </CardHeader>
            <CardContent className="space-y-2">
              {loc.serviceTimes && <p className="text-sm">?? {loc.serviceTimes}</p>}
              {loc.phone && <p className="text-sm"><Phone className="inline h-4 w-4 mr-1" />{loc.phone}</p>}
              {loc.email && <p className="text-sm"><Mail className="inline h-4 w-4 mr-1" />{loc.email}</p>}
              {loc.livestreamUrl && (
                <a href={loc.livestreamUrl} target="_blank" rel="noopener noreferrer" className="text-sm text-blue-600 hover:underline block">
                  <Video className="inline h-4 w-4 mr-1" />Watch Livestream
                </a>
              )}
              {loc.website && (
                <a href={loc.website} target="_blank" rel="noopener noreferrer" className="text-sm text-blue-600 hover:underline block">
                  <Globe className="inline h-4 w-4 mr-1" />Website
                </a>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
