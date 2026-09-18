"use client";

import { useCallback, useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import api, { apiErrorMessage } from "@/lib/api";
import { getUserId } from "@/lib/auth";
import { Activity, BarChart3, Calendar, Church, DollarSign, Download, TrendingUp, Users } from "lucide-react";
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from "recharts";
import { toast } from "sonner";

interface Metrics {
  totalMembers: number; newMembersThisMonth: number; attendanceRate: number;
  totalGiving: number; activeMinistries: number; upcomingEvents: number;
}

interface TrendPoint { label: string; value: number }
interface TrendData { title: string; data: TrendPoint[] }

interface OrgUnit { id: string; name: string }

const LEVELS: { value: string; label: string }[] = [
  { value: "national", label: "National" },
  { value: "region", label: "Region" },
  { value: "presbytery", label: "Presbytery" },
  { value: "parish", label: "Parish" },
  { value: "congregation", label: "Congregation" },
];

const CHART_COLORS = ["#3B82F6", "#10B981", "#F59E0B"];
const TOOLTIP_STYLE = {
  backgroundColor: "#1E293B",
  border: "none",
  borderRadius: 8,
  color: "#fff",
  fontSize: 12,
} as const;

export default function AnalyticsPage() {
  const [userId, setUserId] = useState<string | null>(null);
  const [level, setLevel] = useState("national");
  const [regionId, setRegionId] = useState("");
  const [presbyteryId, setPresbyteryId] = useState("");
  const [parishId, setParishId] = useState("");
  const [congregationId, setCongregationId] = useState("");
  const [regions, setRegions] = useState<OrgUnit[]>([]);
  const [presbyteries, setPresbyteries] = useState<OrgUnit[]>([]);
  const [parishes, setParishes] = useState<OrgUnit[]>([]);
  const [congregations, setCongregations] = useState<OrgUnit[]>([]);
  const [metrics, setMetrics] = useState<Metrics | null>(null);
  const [trends, setTrends] = useState<TrendData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [exporting, setExporting] = useState(false);

  const entityId = level === "national" ? "" :
    level === "region" ? regionId :
    level === "presbytery" ? presbyteryId :
    level === "parish" ? parishId : congregationId;

  useEffect(() => {
    const uid = getUserId();
    setUserId(uid);
    if (!uid) setLoading(false);
  }, []);

  // Load the organisation list once a drill-down level is picked
  useEffect(() => {
    if (level === "national") {
      setRegionId(""); setPresbyteryId(""); setParishId(""); setCongregationId("");
      setRegions([]); setPresbyteries([]); setParishes([]); setCongregations([]);
      return;
    }
    setLoading(true);
    api.get("/api/church/regions")
      .then((res) => setRegions(res.data.data || []))
      .catch(() => { toast.error("Could not load the church structure") })
      .finally(() => setLoading(false));
  }, [level]);

  // Load the drill-down list for a parent selection
  const loadChildren = useCallback(async (endpoint: string, setter: (v: OrgUnit[]) => void) => {
    try {
      const res = await api.get(endpoint);
      setter(res.data.data || []);
    } catch {
      setter([]);
    }
  }, []);

  useEffect(() => {
    setPresbyteryId(""); setParishId(""); setCongregationId("");
    setPresbyteries([]); setParishes([]); setCongregations([]);
    if (regionId) loadChildren(`/api/church/presbyteries?regionId=${regionId}`, setPresbyteries);
  }, [regionId, loadChildren]);

  useEffect(() => {
    setParishId(""); setCongregationId("");
    setParishes([]); setCongregations([]);
    if (presbyteryId) loadChildren(`/api/church/parishes?presbyteryId=${presbyteryId}`, setParishes);
  }, [presbyteryId, loadChildren]);

  useEffect(() => {
    setCongregationId("");
    setCongregations([]);
    if (parishId) loadChildren(`/api/church/congregations?parishId=${parishId}`, setCongregations);
  }, [parishId, loadChildren]);

  const loadData = useCallback(async () => {
    if (!userId) return;
    if (level !== "national" && !entityId) { setLoading(false); return }
    setLoading(true);
    setError(false);
    try {
      const url = level === "national" ? "/api/analytics/national" : `/api/analytics/drill-down/${level}/${entityId}`;
      const res = await api.get(url);
      const data = res.data.data;
      setMetrics(data.metrics || data);
      setTrends(data.trends || []);
    } catch {
      setMetrics(null);
      setTrends([]);
      setError(true);
    } finally {
      setLoading(false);
    }
  }, [userId, level, entityId]);

  useEffect(() => { loadData() }, [loadData]);

  const exportCsv = async () => {
    setExporting(true);
    try {
      const res = await api.get("/api/analytics/export/csv", { responseType: "blob" });
      const blob = res.data as Blob;
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = "pcea-connect-analytics.csv";
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (e) {
      const status = (e as { response?: { status?: number } })?.response?.status;
      if (status === 403) {
        toast.error("Could not export the CSV. Only leaders with analytics access can download reports.");
      } else {
        toast.error(apiErrorMessage(e, "Could not export the CSV. Please try again."));
      }
    } finally {
      setExporting(false);
    }
  };

  if (!userId) return <div className="py-20 text-center text-white">Please log in.</div>;

  const pickLevel = LEVELS.find((l) => l.value === level);

  return (
    <div className="space-y-6 text-white">
      <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
        <div>
          <h1 className="text-3xl font-bold">Church Analytics</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Membership, attendance and giving trends{pickLevel && level !== "national" ? ` for ${pickLevel.label.toLowerCase()}` : ""}
          </p>
        </div>

        <div className="flex flex-wrap items-end gap-2">
          <Select value={level} onValueChange={setLevel} aria-label="Scope">
            <SelectTrigger className="w-40" aria-label="Analytics scope">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {LEVELS.map((l) => <SelectItem key={l.value} value={l.value}>{l.label}</SelectItem>)}
            </SelectContent>
          </Select>

          {level === "region" || level === "presbytery" || level === "parish" || level === "congregation" ? (
            <>
              <Select value={regionId} onValueChange={setRegionId} aria-label="Region">
                <SelectTrigger className="w-44"><SelectValue placeholder="Region…" /></SelectTrigger>
                <SelectContent>
                  {regions.map((r) => <SelectItem key={r.id} value={r.id}>{r.name}</SelectItem>)}
                </SelectContent>
              </Select>
              {(level === "presbytery" || level === "parish" || level === "congregation") && (
                <Select value={presbyteryId} onValueChange={setPresbyteryId} aria-label="Presbytery">
                  <SelectTrigger className="w-44" disabled={!regionId}><SelectValue placeholder="Presbytery…" /></SelectTrigger>
                  <SelectContent>
                    {presbyteries.map((p) => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              )}
              {(level === "parish" || level === "congregation") && (
                <Select value={parishId} onValueChange={setParishId} aria-label="Parish">
                  <SelectTrigger className="w-44" disabled={!presbyteryId}><SelectValue placeholder="Parish…" /></SelectTrigger>
                  <SelectContent>
                    {parishes.map((p) => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              )}
              {level === "congregation" && (
                <Select value={congregationId} onValueChange={setCongregationId} aria-label="Congregation">
                  <SelectTrigger className="w-44" disabled={!parishId}><SelectValue placeholder="Congregation…" /></SelectTrigger>
                  <SelectContent>
                    {congregations.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              )}
            </>
          ) : null}

          <Button variant="outline" onClick={exportCsv} disabled={exporting}>
            <Download className="mr-2 h-4 w-4" aria-hidden="true" />
            {exporting ? "Exporting…" : "Export CSV"}
          </Button>
        </div>
      </div>

      {level !== "national" && !entityId && (
        <p className="rounded-lg border border-white/10 bg-card px-4 py-3 text-sm text-muted-foreground">
          Pick a {pickLevel?.label.toLowerCase()} to view its analytics.
        </p>
      )}

      {loading ? (
        <Skeleton className="h-96 w-full" />
      ) : error ? (
        <div className="rounded-xl border border-white/10 bg-card p-10 text-center">
          <p className="font-medium text-white">Analytics are not available at this level</p>
          <p className="mx-auto mt-1 max-w-md text-sm text-muted-foreground">
            Either you don&apos;t have permission to view church-wide analytics, or there is no data
            for this selection yet.
          </p>
          <Button className="mt-5" variant="outline" onClick={() => loadData()}>Try again</Button>
        </div>
      ) : !metrics ? (
        <div className="rounded-xl border border-white/10 bg-card p-10 text-center">
          <BarChart3 className="mx-auto mb-3 h-12 w-12 text-muted-foreground/50" aria-hidden="true" />
          <p className="font-medium text-white">No analytics available yet</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Trends appear once the congregation has worship, attendance and giving records.
          </p>
        </div>
      ) : (
        <>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
            <MetricCard icon={Users} label="Members" value={metrics.totalMembers} />
            <MetricCard icon={TrendingUp} label="New this month" value={metrics.newMembersThisMonth} />
            <MetricCard icon={Activity} label="Attendance" value={Math.round(metrics.attendanceRate * 100) + "%"} />
            <MetricCard icon={DollarSign} label="Giving (KES)" value={metrics.totalGiving.toLocaleString()} />
            <MetricCard icon={Church} label="Ministries" value={metrics.activeMinistries} />
            <MetricCard icon={Calendar} label="Events" value={metrics.upcomingEvents} />
          </div>

          <Tabs defaultValue="charts" className="w-full">
            <TabsList>
              <TabsTrigger value="charts">Charts</TabsTrigger>
              <TabsTrigger value="trends">Trends</TabsTrigger>
            </TabsList>

            <TabsContent value="charts" className="mt-4">
              {trends.length === 0 ? (
                <p className="text-sm text-muted-foreground">No trend data to chart yet.</p>
              ) : (
                <div className="grid gap-6 md:grid-cols-2">
                  {trends.map((t, i) => (
                    <Card key={t.title} className="border-0 bg-card shadow-lg">
                      <CardHeader><CardTitle className="text-sm text-gray-400">{t.title}</CardTitle></CardHeader>
                      <CardContent className="h-64">
                        <ResponsiveContainer width="100%" height="100%">
                          {i === 0 ? (
                            <LineChart data={t.data}>
                              <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                              <XAxis dataKey="label" stroke="#94a3b8" fontSize={12} />
                              <YAxis stroke="#94a3b8" fontSize={12} />
                              <Tooltip contentStyle={TOOLTIP_STYLE} />
                              <Line type="monotone" dataKey="value" stroke={CHART_COLORS[i]} strokeWidth={3} dot={{ r: 4 }} />
                            </LineChart>
                          ) : (
                            <BarChart data={t.data}>
                              <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                              <XAxis dataKey="label" stroke="#94a3b8" fontSize={12} />
                              <YAxis stroke="#94a3b8" fontSize={12} />
                              <Tooltip contentStyle={TOOLTIP_STYLE} />
                              <Bar dataKey="value" fill={CHART_COLORS[i]} radius={[6, 6, 0, 0]} />
                            </BarChart>
                          )}
                        </ResponsiveContainer>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>

            <TabsContent value="trends" className="mt-4">
              {trends.length === 0 ? (
                <p className="text-sm text-muted-foreground">No trend data to show yet.</p>
              ) : (
                <div className="grid gap-6">
                  {trends.map((t, i) => (
                    <Card key={t.title} className="border-0 bg-card shadow-lg">
                      <CardHeader><CardTitle className="text-sm text-gray-400">{t.title}</CardTitle></CardHeader>
                      <CardContent className="h-64">
                        <ResponsiveContainer width="100%" height="100%">
                          <LineChart data={t.data}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                            <XAxis dataKey="label" stroke="#94a3b8" fontSize={12} />
                            <YAxis stroke="#94a3b8" fontSize={12} />
                            <Tooltip contentStyle={TOOLTIP_STYLE} />
                            <Line type="monotone" dataKey="value" stroke={CHART_COLORS[i]} strokeWidth={3} dot={{ r: 4 }} />
                          </LineChart>
                        </ResponsiveContainer>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>
          </Tabs>
        </>
      )}
    </div>
  );
}

function MetricCard({ icon: Icon, label, value }: { icon: any; label: string; value: string | number }) {
  return (
    <Card className="border-0 bg-card shadow-lg">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm text-gray-400">{label}</CardTitle>
        <Icon className="h-4 w-4 text-blue-500" aria-hidden="true" />
      </CardHeader>
      <CardContent><div className="text-2xl font-bold">{value}</div></CardContent>
    </Card>
  );
}
