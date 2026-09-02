"use client"
import { useEffect, useState } from "react"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import api from "@/lib/api"
import { getUserId } from "@/lib/auth"
import { Region, Presbytery, Parish, Congregation } from "@/types"
import { Church, Building2, MapPin, Phone, Mail } from "lucide-react"

export default function ChurchStructurePage() {
  const [regions, setRegions] = useState<Region[]>([])
  const [presbyteries, setPresbyteries] = useState<Record<string, Presbytery[]>>({})
  const [parishes, setParishes] = useState<Record<string, Parish[]>>({})
  const [congregations, setCongregations] = useState<Record<string, Congregation[]>>({})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)

  useEffect(() => {
    if (!getUserId()) { setError(true); setLoading(false); return }
    api.get("/api/church/regions").then((res) => {
      const regionList: Region[] = res.data.data || []
      setRegions(regionList)
      regionList.forEach((region) => {
        api.get(`/api/church/presbyteries?regionId=${region.id}`).then((presRes) => {
          setPresbyteries(prev => ({ ...prev, [region.id]: presRes.data.data }))
          presRes.data.data.forEach((pres: Presbytery) => {
            api.get(`/api/church/parishes?presbyteryId=${pres.id}`).then((parishRes) => {
              setParishes(prev => ({ ...prev, [pres.id]: parishRes.data.data }))
              parishRes.data.data.forEach((parish: Parish) => {
                api.get(`/api/church/congregations?parishId=${parish.id}`).then((congRes) => {
                  setCongregations(prev => ({ ...prev, [parish.id]: congRes.data.data }))
                })
              })
            })
          })
        })
      })
      setLoading(false)
    }).catch(() => { setError(true); setLoading(false) })
  }, [])

  if (error) return (
    <div className="flex items-center justify-center py-20 text-muted-foreground">
      Please log in to view church structure.
    </div>
  )

  if (loading) return <Skeleton className="h-96 w-full" />

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-white">Church Structure</h1>
      <Accordion type="single" collapsible className="w-full space-y-3">
        {regions.map((region) => (
          <AccordionItem key={region.id} value={region.id} className="border rounded-lg bg-card/50 backdrop-blur-sm">
            <AccordionTrigger className="px-6 py-4 hover:no-underline">
              <div className="flex items-center gap-3 text-left">
                <Church className="h-5 w-5 text-blue-600" />
                <span className="font-semibold text-lg">{region.name}</span>
                <Badge variant="outline" className="ml-2 text-xs">Region</Badge>
              </div>
            </AccordionTrigger>
            <AccordionContent className="px-6 pb-4 space-y-2">
              <div className="text-sm text-muted-foreground flex gap-4 mb-3">
                {region.address && <span><MapPin className="inline h-4 w-4 mr-1"/>{region.address}</span>}
                {region.phone && <span><Phone className="inline h-4 w-4 mr-1"/>{region.phone}</span>}
                {region.email && <span><Mail className="inline h-4 w-4 mr-1"/>{region.email}</span>}
              </div>
              {(presbyteries[region.id] || []).map((pres) => (
                <Accordion key={pres.id} type="single" collapsible className="pl-4 border-l-2 border-blue-100 dark:border-blue-900">
                  <AccordionItem value={pres.id} className="border-0">
                    <AccordionTrigger className="py-2 hover:no-underline">
                      <div className="flex items-center gap-2">
                        <Building2 className="h-4 w-4 text-blue-500" />
                        <span className="font-medium">{pres.name}</span>
                        <Badge variant="secondary" className="text-xs">Presbytery</Badge>
                      </div>
                    </AccordionTrigger>
                    <AccordionContent className="pb-2 space-y-2">
                      {(parishes[pres.id] || []).map((parish) => (
                        <Accordion key={parish.id} type="single" collapsible className="pl-4 border-l-2 border-blue-200 dark:border-blue-800">
                          <AccordionItem value={parish.id} className="border-0">
                            <AccordionTrigger className="py-2 hover:no-underline">
                              <div className="flex items-center gap-2">
                                <Building2 className="h-4 w-4 text-green-400" />
                                <span>{parish.name}</span>
                                <Badge variant="outline" className="text-xs">Parish</Badge>
                              </div>
                            </AccordionTrigger>
                            <AccordionContent className="pb-2 pl-4 space-y-1">
                              {(congregations[parish.id] || []).map((cong) => (
                                <Card key={cong.id} className="p-3 bg-background/50 backdrop-blur-sm">
                                  <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                      <Church className="h-4 w-4 text-blue-600" />
                                      <span className="font-medium">{cong.name}</span>
                                    </div>
                                    <Badge variant="outline" className="text-xs">Congregation</Badge>
                                  </div>
                                  <div className="text-sm text-muted-foreground mt-1 flex gap-4">
                                    {cong.address && <span><MapPin className="inline h-3 w-3 mr-1"/>{cong.address}</span>}
                                    {cong.phone && <span><Phone className="inline h-3 w-3 mr-1"/>{cong.phone}</span>}
                                    {cong.email && <span><Mail className="inline h-3 w-3 mr-1"/>{cong.email}</span>}
                                  </div>
                                </Card>
                              ))}
                            </AccordionContent>
                          </AccordionItem>
                        </Accordion>
                      ))}
                    </AccordionContent>
                  </AccordionItem>
                </Accordion>
              ))}
            </AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
    </div>
  )
}
