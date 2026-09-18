"use client"
import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Skeleton } from "@/components/ui/skeleton"
import api from "@/lib/api"
import { MapPin, Phone, Mail, Video, Globe, Search, Clock, Church, ArrowRight } from "lucide-react"
import Link from "next/link"
import { EmptyState } from "@/components/empty-state"

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
      .catch(() => setLocations([]))
      .finally(() => setLoading(false))
  }, [])

  const handleSearch = async () => {
    setLoading(true)
    try {
      const res = await api.get(`/api/locator?query=${encodeURIComponent(query.trim())}`)
      setLocations(res.data.data || [])
    } catch {
      setLocations([])
    } finally {
      setLoading(false)
    }
  }

  if (!mounted) return null
  if (loading) return <Skeleton className="h-96 w-full" />

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">Find a Church</h1>
          <p className="mt-1 text-sm text-muted-foreground">PCEA congregations near you and online</p>
        </div>
        <form
          className="flex w-full gap-2 sm:w-auto"
          onSubmit={(e) => { e.preventDefault(); handleSearch() }}
          role="search"
        >
          <Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search churches…" aria-label="Search churches" className="sm:w-64" />
          <Button type="submit" onClick={handleSearch}><Search className="h-4 w-4" aria-hidden="true" /> Search</Button>
        </form>
      </div>

      {locations.length === 0 ? (
        <EmptyState
          icon={<Church className="h-16 w-16" />}
          title="No churches found"
          description={query ? "Try a different search term or city name." : "Church locations will appear here once they are added."}
        />
      ) : (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {locations.map(loc => (
          <Card key={loc.id} className="bg-card">
            <CardHeader>
              <CardTitle className="text-lg">{loc.name}</CardTitle>
              {loc.address && (
                <p className="text-xs text-muted-foreground">{loc.address}</p>
              )}
            </CardHeader>
            <CardContent className="space-y-2">
              {loc.serviceTimes && <p className="flex items-center gap-2 text-sm"><Clock className="h-4 w-4 text-muted-foreground" aria-hidden="true" />{loc.serviceTimes}</p>}
              {loc.phone && <p className="flex items-center gap-2 text-sm"><Phone className="h-4 w-4 text-muted-foreground" aria-hidden="true" />{loc.phone}</p>}
              {loc.email && <p className="flex items-center gap-2 text-sm"><Mail className="h-4 w-4 text-muted-foreground" aria-hidden="true" />{loc.email}</p>}
                      {loc.livestreamUrl && (
                <a href={loc.livestreamUrl} target="_blank" rel="noopener noreferrer" className="block text-sm text-blue-400 hover:underline">
                  <Video className="mr-1 inline h-4 w-4" aria-hidden="true" />Watch Livestream
                </a>
              )}
              {loc.website && (
                <a href={loc.website} target="_blank" rel="noopener noreferrer" className="block text-sm text-blue-400 hover:underline">
                  <Globe className="mr-1 inline h-4 w-4" aria-hidden="true" />Website
                </a>
              )}
              <Link href={`/churches/${loc.id}`} className="block pt-1 text-sm font-medium text-blue-400 hover:underline">
                View church profile <ArrowRight className="ml-0.5 inline h-3.5 w-3.5" aria-hidden="true" />
              </Link>
            </CardContent>
          </Card>
        ))}
      </div>
      )}
    </div>
  )
}
