"use client"
import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Skeleton } from "@/components/ui/skeleton"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import api from "@/lib/api"
import { getUserId } from "@/lib/auth"
import { TrendingUp, Download, Users, DollarSign, Activity, Church, Calendar } from "lucide-react"
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts"

interface Metrics {
  totalMembers: number; newMembersThisMonth: number; attendanceRate: number;
  totalGiving: number; activeMinistries: number; upcomingEvents: number
}

interface TrendPoint { label: string; value: number }
interface TrendData { title: string; data: TrendPoint[] }

export default function AnalyticsPage() {
  const [level, setLevel] = useState("national")
  const [entityId, setEntityId] = useState("")
  const [metrics, setMetrics] = useState<Metrics | null>(null)
  const [trends, setTrends] = useState<TrendData[]>([])
  const [loading, setLoading] = useState(true)
  const userId = getUserId()

  const loadData = async () => {
    setLoading(true)
    try {
      const url = level === "national" ? "/api/analytics/national" : `/api/analytics/drill-down/${level}/${entityId}`
      const res = await api.get(url)
      const data = res.data.data
      setMetrics(data.metrics || data)
      setTrends(data.trends || [])
    } catch (e) { console.error(e) } finally { setLoading(false) }
  }

  useEffect(() => { if (userId) loadData() }, [level, entityId])

  const exportCsv = () => {
    const base = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080/api"
    window.open(`${base}/analytics/export/csv`, "_blank")
  }

  if (!userId) return <div className="py-20 text-center text-white">Please log in.</div>
  if (loading) return <Skeleton className="h-96 w-full" />

  const chartColors = ["#3B82F6", "#10B981", "#F59E0B"]

  return (
    <div className="space-y-6 text-white">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Analytics</h1>
        <div className="flex gap-2">
          <Select value={level} onValueChange={setLevel}>
            <SelectTrigger className="w-40 bg-gray-800 border-gray-700 text-white">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="national">National</SelectItem>
              <SelectItem value="region">Region</SelectItem>
              <SelectItem value="presbytery">Presbytery</SelectItem>
              <SelectItem value="parish">Parish</SelectItem>
              <SelectItem value="congregation">Congregation</SelectItem>
            </SelectContent>
          </Select>
          {level !== "national" && (
            <input
              value={entityId}
              onChange={(e) => setEntityId(e.target.value)}
              placeholder="Entity ID"
              className="w-40 bg-gray-800 border border-gray-700 rounded-lg px-3 text-white text-sm"
            />
          )}
          <Button variant="outline" className="text-gray-300 border-gray-600" onClick={exportCsv}>
            <Download className="h-4 w-4 mr-2" /> Export CSV
          </Button>
        </div>
      </div>

      {metrics && (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
          <MetricCard icon={Users} label="Members" value={metrics.totalMembers} />
          <MetricCard icon={TrendingUp} label="New" value={metrics.newMembersThisMonth} />
          <MetricCard icon={Activity} label="Attendance" value={Math.round(metrics.attendanceRate * 100) + "%"} />
          <MetricCard icon={DollarSign} label="Giving (KES)" value={metrics.totalGiving.toLocaleString()} />
          <MetricCard icon={Church} label="Ministries" value={metrics.activeMinistries} />
          <MetricCard icon={Calendar} label="Events" value={metrics.upcomingEvents} />
        </div>
      )}

      <Tabs defaultValue="charts" className="w-full">
        <TabsList className="bg-gray-800">
          <TabsTrigger value="charts" className="text-gray-300 data-[state=active]:text-white">Charts</TabsTrigger>
          <TabsTrigger value="trends" className="text-gray-300 data-[state=active]:text-white">Trends</TabsTrigger>
        </TabsList>

        <TabsContent value="charts" className="mt-4">
          <div className="grid gap-6 md:grid-cols-2">
            {trends.map((t, i) => (
              <Card key={t.title} className="bg-[#1E293B] border-0 shadow-lg">
                <CardHeader><CardTitle className="text-sm text-gray-400">{t.title}</CardTitle></CardHeader>
                <CardContent className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    {i === 0 ? (
                      <LineChart data={t.data}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                        <XAxis dataKey="label" stroke="#94a3b8" fontSize={12} />
                        <YAxis stroke="#94a3b8" fontSize={12} />
                        <Tooltip contentStyle={{ backgroundColor: "#1E293B", border: "none", borderRadius: 8, color: "#fff" }} />
                        <Line type="monotone" dataKey="value" stroke={chartColors[i]} strokeWidth={3} dot={{ r: 4 }} />
                      </LineChart>
                    ) : (
                      <BarChart data={t.data}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                        <XAxis dataKey="label" stroke="#94a3b8" fontSize={12} />
                        <YAxis stroke="#94a3b8" fontSize={12} />
                        <Tooltip contentStyle={{ backgroundColor: "#1E293B", border: "none", borderRadius: 8, color: "#fff" }} />
                        <Bar dataKey="value" fill={chartColors[i]} radius={[6, 6, 0, 0]} />
                      </BarChart>
                    )}
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="trends" className="mt-4">
          <div className="grid gap-6">
            {trends.map((t, i) => (
              <Card key={t.title} className="bg-[#1E293B] border-0 shadow-lg">
                <CardHeader><CardTitle className="text-sm text-gray-400">{t.title}</CardTitle></CardHeader>
                <CardContent className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={t.data}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                      <XAxis dataKey="label" stroke="#94a3b8" fontSize={12} />
                      <YAxis stroke="#94a3b8" fontSize={12} />
                      <Tooltip contentStyle={{ backgroundColor: "#1E293B", border: "none", borderRadius: 8, color: "#fff" }} />
                      <Line type="monotone" dataKey="value" stroke={chartColors[i]} strokeWidth={3} dot={{ r: 4 }} />
                    </LineChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}

function MetricCard({ icon: Icon, label, value }: any) {
  return (
    <Card className="bg-[#1E293B] border-0 shadow-lg">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm text-gray-400">{label}</CardTitle>
        <Icon className="h-4 w-4 text-blue-500" />
      </CardHeader>
      <CardContent><div className="text-2xl font-bold">{value}</div></CardContent>
    </Card>
  )
}
