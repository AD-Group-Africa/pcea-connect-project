"use client"
import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import api from "@/lib/api"
import { Search } from "lucide-react"

export default function SearchPage() {
  const [query, setQuery] = useState("")
  const [results, setResults] = useState<any>(null)

  const handleSearch = async () => {
    const res = await api.get(`/api/search?q=${query}`)
    setResults(res.data.data)
  }

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-white">Search</h1>
      <div className="flex gap-2">
        <Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search members, sermons, events, Bible..." />
        <Button onClick={handleSearch}><Search className="h-4 w-4 mr-2" /> Search</Button>
      </div>
      {results && (
        <div className="grid gap-6">
          {Object.entries(results).map(([category, items]: any) => (
            <div key={category}>
              <h2 className="text-xl font-semibold capitalize mb-2">{category.replace("_", " ")}</h2>
              <div className="grid gap-2">
                {items.length === 0 && <p className="text-muted-foreground">No results.</p>}
                {items.map((item: any) => (
                  <Card key={item.id} className="backdrop-blur-sm">
                    <CardContent className="p-4">
                      <p className="font-medium">{item.name || item.title || item.fullName || item.text?.slice(0, 100)}</p>
                      <p className="text-sm text-muted-foreground">{item.description || item.location || item.email || ""}</p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
