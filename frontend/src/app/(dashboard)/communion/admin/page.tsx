"use client";

import { useCallback, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import api, { apiErrorMessage } from "@/lib/api";
import { isCommunionStaff, type CommunionEventReport, type CommunionEventRow, type CommunionRecordRow } from "@/lib/communion";
import { Ban, CalendarPlus, CheckCircle2, FileText, Loader2, Lock, ShieldAlert, XCircle } from "lucide-react";

/**
 * Communion administration: event lifecycle (create → open → close/cancel),
 * the per-event report, eligibility administration and record voiding.
 * All mutations are backend-gated (STAFF_OR_CLERK + congregation scope); the UI
 * mirrors those rules for clarity but never trusts them for security.
 */

interface MemberSearchRow {
  userId: string;
  fullName: string;
  memberStatus: string;
  congregationName: string | null;
}

export default function CommunionAdminPage() {
  const [allowed, setAllowed] = useState<boolean | null>(null);
  const [events, setEvents] = useState<CommunionEventRow[] | null>(null);
  const [busyEvent, setBusyEvent] = useState<string>("");
  const [error, setError] = useState("");

  // New event form
  const [serviceDate, setServiceDate] = useState("");
  const [startTime, setStartTime] = useState("10:00");
  const [location, setLocation] = useState("Main Sanctuary");

  // Report panel
  const [reportEventId, setReportEventId] = useState<string>("");
  const [report, setReport] = useState<CommunionEventReport | null>(null);

  // Eligibility admin
  const [memberQuery, setMemberQuery] = useState("");
  const [memberResults, setMemberResults] = useState<MemberSearchRow[]>([]);
  const [selectedMember, setSelectedMember] = useState<MemberSearchRow | null>(null);
  const [eligStatus, setEligStatus] = useState<"ELIGIBLE" | "PENDING" | "RESTRICTED" | "SUSPENDED">("ELIGIBLE");
  const [eligReason, setEligReason] = useState("");
  const [eligBusy, setEligBusy] = useState(false);
  const [eligMsg, setEligMsg] = useState("");

  useEffect(() => {
    try {
      const token = localStorage.getItem("token");
      const jwtRoles: string[] = token
        ? (() => {
            try {
              return ((JSON.parse(atob(token.split(".")[1]))?.roles ?? []) as unknown[]).map((r) => String(r).replace(/^ROLE_/, ""));
            } catch {
              return [];
            }
          })()
        : [];
      setAllowed(isCommunionStaff(jwtRoles));
    } catch {
      setAllowed(false);
    }
  }, []);

  const loadEvents = useCallback(() => {
    api
      .get("/api/communion/events")
      .then((res) => setEvents(res.data?.data ?? []))
      .catch(() => setEvents([]));
  }, []);

  useEffect(() => {
    if (allowed) loadEvents();
  }, [allowed, loadEvents]);

  const lifecycle = useCallback(
    async (eventId: string, action: "open" | "close" | "cancel") => {
      setBusyEvent(eventId);
      setError("");
      try {
        await api.post(`/api/communion/events/${eventId}/${action}`, {});
        loadEvents();
        if (reportEventId === eventId) setReportEventId("");
      } catch (e) {
        setError(apiErrorMessage(e, `${action} failed.`));
      } finally {
        setBusyEvent("");
      }
    },
    [loadEvents, reportEventId]
  );

  const createEvent = useCallback(async () => {
    if (!serviceDate) {
      setError("Pick a service date first.");
      return;
    }
    setBusyEvent("new");
    setError("");
    try {
      const res = await api.post("/api/communion/events", {
        serviceDate,
        startTime: startTime ? `${startTime}:00` : null,
        location,
      });
      setServiceDate("");
      loadEvents();
      const newId = res.data?.data?.id;
      if (newId) await lifecycle(newId, "open");
    } catch (e) {
      setError(apiErrorMessage(e, "Could not create the event."));
    } finally {
      setBusyEvent("");
    }
  }, [serviceDate, startTime, location, loadEvents, lifecycle]);

  const showReport = useCallback(async (eventId: string) => {
    setError("");
    try {
      const res = await api.get(`/api/communion/events/${eventId}/report`);
      setReport(res.data?.data ?? null);
      setReportEventId(eventId);
    } catch (e) {
      setError(apiErrorMessage(e, "Report unavailable."));
    }
  }, []);

  // Member search for eligibility administration
  useEffect(() => {
    if (memberQuery.trim().length < 2) {
      setMemberResults([]);
      return;
    }
    const t = setTimeout(() => {
      api
        .get(`/api/members/search?q=${encodeURIComponent(memberQuery.trim())}`)
        .then((res) => setMemberResults(res.data?.data ?? []))
        .catch(() => setMemberResults([]));
    }, 250);
    return () => clearTimeout(t);
  }, [memberQuery]);

  const setEligibility = useCallback(async () => {
    if (!selectedMember) return;
    setEligBusy(true);
    setEligMsg("");
    try {
      await api.put(`/api/communion/eligibility/${selectedMember.userId}`, {
        status: eligStatus,
        reason: eligReason.trim() || "Administrative update",
      });
      setEligMsg(`${selectedMember.fullName} is now ${eligStatus}.`);
      setSelectedMember(null);
      setEligReason("");
    } catch (e) {
      setEligMsg(apiErrorMessage(e, "Could not update eligibility."));
    } finally {
      setEligBusy(false);
    }
  }, [selectedMember, eligStatus, eligReason]);

  if (allowed === null) return <Skeleton className="h-64 w-full" />;
  if (allowed === false) {
    return (
      <div className="mx-auto max-w-md py-16 text-center">
        <ShieldAlert className="mx-auto mb-3 size-10 text-red-400" aria-hidden="true" />
        <p className="text-lg font-medium text-white">Elder/staff access required</p>
        <p className="mt-1 text-sm text-muted-foreground">Communion administration is restricted to congregational staff.</p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-white">Communion Events</h1>
        <p className="text-sm text-muted-foreground">Holy Communion services for your congregation.</p>
      </div>

      {error && <p className="text-sm text-red-400">{error}</p>}

      {/* Create event */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-base">
            <CalendarPlus className="size-5 text-blue-400" aria-hidden="true" /> New Communion Service
          </CardTitle>
        </CardHeader>
        <CardContent className="grid gap-3 sm:grid-cols-4">
          <div className="sm:col-span-1">
            <label className="mb-1 block text-xs text-muted-foreground" htmlFor="ce-date">Date</label>
            <Input id="ce-date" type="date" value={serviceDate} onChange={(e) => setServiceDate(e.target.value)} />
          </div>
          <div className="sm:col-span-1">
            <label className="mb-1 block text-xs text-muted-foreground" htmlFor="ce-time">Start</label>
            <Input id="ce-time" type="time" value={startTime} onChange={(e) => setStartTime(e.target.value)} />
          </div>
          <div className="sm:col-span-1">
            <label className="mb-1 block text-xs text-muted-foreground" htmlFor="ce-loc">Location</label>
            <Input id="ce-loc" value={location} onChange={(e) => setLocation(e.target.value)} />
          </div>
          <div className="flex items-end sm:col-span-1">
            <Button className="w-full" onClick={createEvent} disabled={busyEvent === "new" || !serviceDate}>
              {busyEvent === "new" ? <Loader2 className="size-4 animate-spin" aria-hidden="true" /> : <CalendarPlus className="size-4" aria-hidden="true" />}
              Create &amp; Open
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Events list */}
      <div className="space-y-2">
        {(events ?? []).map((e) => (
          <Card key={e.id}>
            <CardContent className="flex flex-wrap items-center justify-between gap-3 py-3">
              <div>
                <p className="font-medium text-white">
                  {new Date(e.serviceDate).toLocaleDateString(undefined, { weekday: "short", year: "numeric", month: "long", day: "numeric" })}
                  {e.location ? <span className="text-muted-foreground"> · {e.location}</span> : null}
                </p>
                <p className="text-xs text-muted-foreground">
                  {e.serviceStartTime?.slice(0, 5)}{e.serviceEndTime ? `–${e.serviceEndTime.slice(0, 5)}` : ""} · {e.recordedCount} recorded
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-1.5">
                <Badge variant={e.status === "OPEN" ? "default" : e.status === "CLOSED" ? "secondary" : e.status === "CANCELLED" ? "destructive" : "outline"}>
                  {e.status}
                </Badge>
                {e.status === "DRAFT" && (
                  <Button size="sm" variant="outline" onClick={() => lifecycle(e.id, "open")} disabled={busyEvent === e.id}>
                    Open
                  </Button>
                )}
                {e.status === "OPEN" && (
                  <Button size="sm" variant="outline" onClick={() => lifecycle(e.id, "close")} disabled={busyEvent === e.id}>
                    <Lock className="size-3.5" aria-hidden="true" /> Close
                  </Button>
                )}
                {(e.status === "DRAFT" || e.status === "OPEN") && (
                  <Button size="sm" variant="destructive" onClick={() => lifecycle(e.id, "cancel")} disabled={busyEvent === e.id}>
                    <Ban className="size-3.5" aria-hidden="true" /> Cancel
                  </Button>
                )}
                <Button size="sm" variant="ghost" onClick={() => showReport(e.id)}>
                  <FileText className="size-3.5" aria-hidden="true" /> Report
                </Button>
              </div>
            </CardContent>
            {reportEventId === e.id && report && (
              <CardContent className="border-t border-white/10 pt-3">
                <div className="grid grid-cols-2 gap-2 text-sm sm:grid-cols-4">
                  <div><p className="text-lg font-bold text-white">{report.recordedTotal}</p><p className="text-xs text-muted-foreground">Recorded</p></div>
                  <div><p className="text-lg font-bold text-white">{report.voidedTotal}</p><p className="text-xs text-muted-foreground">Voided</p></div>
                  <div><p className="text-lg font-bold text-white">{report.duplicatesBlocked}</p><p className="text-xs text-muted-foreground">Duplicates blocked</p></div>
                  <div><p className="text-lg font-bold text-white">{report.congregationMemberCount}</p><p className="text-xs text-muted-foreground">Congregation members</p></div>
                  <div><p className="text-lg font-bold text-white">{report.rejectedAttempts}</p><p className="text-xs text-muted-foreground">Rejected scans</p></div>
                  <div><p className="text-lg font-bold text-white">{report.pendingEligibility}</p><p className="text-xs text-muted-foreground">Pending eligibility</p></div>
                  <div><p className="text-lg font-bold text-white">{report.restrictedMembers}</p><p className="text-xs text-muted-foreground">Restricted members</p></div>
                  <div><p className="text-lg font-bold text-white">{report.suspendedMembers}</p><p className="text-xs text-muted-foreground">Suspended members</p></div>
                </div>
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {Object.entries(report.recordedByMethod).map(([m, n]) => (
                    <Badge key={m} variant="outline">{m}: {n}</Badge>
                  ))}
                </div>
                <p className="mt-2 text-xs text-muted-foreground">
                  Manual records: {report.recordedByMethod?.MANUAL ?? 0} · Verification attempts (audit log): {report.verificationAttempts}
                </p>
              </CardContent>
            )}
          </Card>
        ))}
        {events !== null && events.length === 0 && (
          <Card><CardContent className="py-8 text-center text-sm text-muted-foreground">No communion events yet — create the first one above.</CardContent></Card>
        )}
      </div>

      {/* Eligibility administration */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-base">
            <CheckCircle2 className="size-5 text-blue-400" aria-hidden="true" /> Communion Eligibility
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <Input
            value={memberQuery}
            onChange={(e) => setMemberQuery(e.target.value)}
            placeholder="Search a member by name…"
            aria-label="Search member for eligibility"
          />
          {memberResults.length > 0 && (
            <div className="max-h-40 space-y-1 overflow-y-auto">
              {memberResults.map((m) => (
                <button
                  key={m.userId}
                  className={`flex w-full items-center justify-between rounded-lg border px-3 py-2 text-left text-sm ${selectedMember?.userId === m.userId ? "border-blue-500/50 bg-blue-500/10" : "border-white/10 hover:bg-muted/40"}`}
                  onClick={() => setSelectedMember(m)}
                >
                  <span className="text-white">{m.fullName}</span>
                  <span className="text-xs text-muted-foreground">{m.congregationName ?? m.memberStatus}</span>
                </button>
              ))}
            </div>
          )}
          {selectedMember && (
            <div className="space-y-2 rounded-lg border border-white/10 p-3">
              <p className="text-sm font-medium text-white">Set eligibility: {selectedMember.fullName}</p>
              <div className="flex flex-wrap gap-1.5">
                {(["ELIGIBLE", "PENDING", "RESTRICTED", "SUSPENDED"] as const).map((s) => (
                  <button
                    key={s}
                    onClick={() => setEligStatus(s)}
                    className={`rounded-full px-3 py-1 text-xs font-medium ${eligStatus === s ? "bg-primary text-primary-foreground" : "border border-white/15 text-muted-foreground hover:bg-muted/40"}`}
                  >
                    {s}
                  </button>
                ))}
              </div>
              <Input value={eligReason} onChange={(e) => setEligReason(e.target.value)} placeholder="Reason (audited)" aria-label="Eligibility reason" />
              <div className="flex items-center gap-2">
                <Button size="sm" onClick={setEligibility} disabled={eligBusy}>
                  {eligBusy ? <Loader2 className="size-4 animate-spin" aria-hidden="true" /> : <CheckCircle2 className="size-4" aria-hidden="true" />}
                  Save (audited)
                </Button>
                {eligMsg && <p className="text-xs text-muted-foreground">{eligMsg}</p>}
              </div>
            </div>
          )}
          <p className="text-xs text-muted-foreground">
            Eligibility is pastoral and independent of the Church ID QR code. Every change is written to the append-only audit log.
          </p>
        </CardContent>
      </Card>

      <p className="flex items-center gap-1.5 px-1 pb-2 text-xs text-muted-foreground">
        <XCircle className="size-3" aria-hidden="true" />
        Records are never deleted — correction is done by voiding with a reason, which is audited.
      </p>
    </div>
  );
}
