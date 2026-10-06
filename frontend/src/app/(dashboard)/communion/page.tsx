"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import api from "@/lib/api";
import type { CommunionEligibility, CommunionRecordRow } from "@/lib/communion";
import { CalendarDays, CheckCircle2, CupSoda, Lock, ShieldCheck } from "lucide-react";

/**
 * Member-facing Communion page: eligibility status + the member's own communion
 * history (only their own records — the API scopes /me to the JWT principal).
 */
export default function CommunionPage() {
  const [records, setRecords] = useState<CommunionRecordRow[] | null>(null);
  const [eligibility, setEligibility] = useState<CommunionEligibility | null>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    api
      .get("/api/communion/me")
      .then((res) => setRecords(res.data?.data ?? []))
      .catch(() => setError(true));
  }, []);

  useEffect(() => {
    // Eligibility is self-viewable; until the backend knows the member id client-side
    // we rely on /me-style resolution below.
    api
      .get("/api/communion/eligibility/self")
      .then((res) => setEligibility(res.data?.data ?? null))
      .catch(() => setEligibility(null));
  }, []);

  const active = (records ?? []).filter((r) => r.status === "RECORDED");

  return (
    <div className="mx-auto max-w-2xl space-y-4">
      <div>
        <h1 className="text-2xl font-bold text-white">Communion</h1>
        <p className="text-sm text-muted-foreground">Your participation in Holy Communion.</p>
      </div>

      {/* Eligibility card */}
      {eligibility && (
        <Card className="border border-primary/25">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-base">
              <ShieldCheck className="size-5 text-blue-400" aria-hidden="true" /> Communion Eligibility
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-1">
            <Badge variant={eligibility.status === "ELIGIBLE" ? "default" : "secondary"}>{eligibility.status}</Badge>
            {eligibility.reason && <p className="pt-1 text-xs text-muted-foreground">{eligibility.reason}</p>}
            <p className="text-[11px] text-muted-foreground">
              Eligibility is a pastoral decision recorded by your congregation — it is independent of your Church ID QR code.
            </p>
          </CardContent>
        </Card>
      )}

      {/* Summary */}
      <div className="grid grid-cols-2 gap-3">
        <Card>
          <CardContent className="flex items-center gap-3 pt-4">
            <CheckCircle2 className="size-8 text-green-400" aria-hidden="true" />
            <div>
              <p className="text-2xl font-bold text-white">{active.length}</p>
              <p className="text-xs text-muted-foreground">Communion services attended</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-3 pt-4">
            <CalendarDays className="size-8 text-blue-400" aria-hidden="true" />
            <div>
              <p className="text-sm font-semibold text-white">
                {active[0] ? new Date(active[0].serviceDate).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" }) : "—"}
              </p>
              <p className="text-xs text-muted-foreground">Most recent</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* History */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-base">
            <CupSoda className="size-5 text-blue-400" aria-hidden="true" /> Communion History
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {records === null && !error ? (
            <Skeleton className="h-20 w-full" />
          ) : error ? (
            <p className="text-sm text-red-400">Could not load your communion history. Please try again later.</p>
          ) : active.length === 0 ? (
            <p className="py-4 text-sm text-muted-foreground">
              No communion records yet. When your elders record communion at a service, it will appear here.
            </p>
          ) : (
            active.map((r) => (
              <div key={r.id} className="flex items-center justify-between rounded-lg border border-white/10 px-3 py-2.5">
                <div className="flex items-center gap-3">
                  <CheckCircle2 className="size-4 text-green-400" aria-hidden="true" />
                  <div>
                    <p className="text-sm font-medium text-white">
                      {new Date(r.serviceDate).toLocaleDateString(undefined, { weekday: "short", year: "numeric", month: "long", day: "numeric" })}
                    </p>
                    {r.note && <p className="text-xs text-muted-foreground">{r.note}</p>}
                  </div>
                </div>
                <Badge variant="outline">{r.verificationMethod}</Badge>
              </div>
            ))
          )}
        </CardContent>
      </Card>

      <p className="flex items-center gap-1.5 px-1 text-xs text-muted-foreground">
        <Lock className="size-3" aria-hidden="true" />
        Sacramental records are private to you and your congregation&apos;s pastoral team.
      </p>
      <div className="pb-2 text-center">
        <Link href="/membership-card" className="text-sm font-medium text-blue-400 hover:underline">
          Show my PCEA Church ID →
        </Link>
      </div>
    </div>
  );
}
