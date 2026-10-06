"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import api from "@/lib/api";
import {
  communionErrorMessage,
  isCommunionStaff,
  newIdempotencyKey,
  type CommunionEventRow,
  type CommunionRecordRow,
  type CommunionVerificationResult,
} from "@/lib/communion";
import {
  CheckCircle2, ChevronLeft, Loader2, Nfc, QrCode, ScanLine, Search, ShieldAlert, XCircle,
} from "lucide-react";

/**
 * Elder Communion scanner. Optimized for repeated use during a service:
 *   VERIFY → (recordable) RECORD COMMUNION → SCAN NEXT MEMBER
 * A scan NEVER auto-records — the elder confirms every record explicitly.
 * Duplicate, ineligible, wrong-congregation and closed-event cases are all
 * server-checked again at record time.
 */

type Phase = "pick" | "scan" | "verified" | "recorded";

/** §31 failure UX: stable wording per code; server copy remains the fallback. */
const FAILURE_MESSAGES: Record<string, string> = {
  INVALID_CREDENTIAL: "Credential invalid.",
  TAMPERED_CREDENTIAL: "Credential signature invalid.",
  INACTIVE_MEMBER: "Membership inactive.",
  WRONG_CONGREGATION: "Member does not belong to this Communion event's congregation.",
  PENDING_ELIGIBILITY: "Communion eligibility pending.",
  REASON_REQUIRED: "A reason is required for manual recording.",
  RESTRICTED_MEMBER: "Member is currently restricted.",
  DUPLICATE_RECORD: "Communion already recorded for this service.",
  EVENT_CLOSED: "This Communion event is closed.",
  UNAUTHORIZED: "You are not authorized to record Communion.",
};

/** §29 Recent panel: latest verifications/records for the selected OPEN event. */
interface RecentEntry {
  key: string;
  name: "record" | "blocked";
  displayName: string;
  detail: string;
  ok: boolean;
}

function toRecentEntry(r: CommunionRecordRow, now: number): RecentEntry {
  const recordedMs = Date.parse(r.recordedAt) || 0;
  const ageMin = Math.max(0, Math.round((now - recordedMs) / 60000));
  const when = ageMin === 0 ? "just now" : `${ageMin}m ago`;
  return {
    key: r.id,
    name: "record",
    displayName: r.memberName || "Member",
    detail: r.status === "VOIDED" ? `Voided entry ${when}` : `Recorded ${when}`,
    ok: r.status !== "VOIDED",
  };
}

interface MemberSearchRow {
  userId: string;
  fullName: string;
  memberStatus: string;
  congregationName: string | null;
}

export default function CommunionScannerPage() {
  const router = useRouter();
  const [allowed, setAllowed] = useState<boolean | null>(null);
  const [events, setEvents] = useState<CommunionEventRow[]>([]);
  const [eventsLoading, setEventsLoading] = useState(true);
  const [event, setEvent] = useState<CommunionEventRow | null>(null);

  const [phase, setPhase] = useState<Phase>("pick");
  const [identityToken, setIdentityToken] = useState("");
  const [method, setMethod] = useState<"QR" | "MEMBER_APP">("QR");
  const [verifyResult, setVerifyResult] = useState<CommunionVerificationResult | null>(null);
  const [recordedInfo, setRecordedInfo] = useState<{ method: string; time: string } | null>(null);
  const [searchQ, setSearchQ] = useState("");
  const [searchResults, setSearchResults] = useState<MemberSearchRow[]>([]);
  const [manualOpen, setManualOpen] = useState(false);
  const [manualMember, setManualMember] = useState<MemberSearchRow | null>(null);
  const [manualReason, setManualReason] = useState("");
  const [manualNote, setManualNote] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [recent, setRecent] = useState<RecentEntry[]>([]);
  const recentRefreshRef = useRef<() => void>(() => {});
  const scanInputRef = useRef<HTMLInputElement>(null);

  // Role gate (same roles as the backend STAFF_OR_CLERK_SPEL gate).
  useEffect(() => {
    try {
      const raw = localStorage.getItem("user");
      const roles: string[] = raw ? (JSON.parse(raw)?.roles ?? []) : [];
      // Roles may also live in the JWT; fall back to decoding it.
      const token = localStorage.getItem("token");
      const jwtRoles: string[] = token
        ? ((() => {
            try {
              const payload = JSON.parse(atob(token.split(".")[1]));
              return (payload?.roles ?? []).map((r: unknown) => String(r).replace(/^ROLE_/, ""));
            } catch {
              return [];
            }
          })())
        : [];
      setAllowed(isCommunionStaff([...roles, ...jwtRoles]));
    } catch {
      setAllowed(false);
    }
  }, []);

  // Load congregation events; auto-select the OPEN one.
  useEffect(() => {
    if (allowed === false) return;
    api
      .get("/api/communion/events")
      .then((res) => {
        const list: CommunionEventRow[] = res.data?.data ?? [];
        setEvents(list);
        setEvent(list.find((e) => e.status === "OPEN") ?? null);
        setEventsLoading(false);
      })
      .catch(() => {
        setEventsLoading(false);
        setAllowed(false);
      });
  }, [allowed]);

  const resetScan = useCallback(() => {
    setPhase("scan");
    setIdentityToken("");
    setVerifyResult(null);
    setRecordedInfo(null);
    setError("");
    setManualOpen(false);
    setManualMember(null);
    setManualReason("");
    setManualNote("");
    setSearchQ("");
    setSearchResults([]);
    scanInputRef.current?.focus();
  }, []);

  // §29 Recent panel: the event's record listing (server-authorized), newest first.
  const refreshRecent = useCallback(
    (selectedEventId: string) => {
      api
        .get(`/api/communion/events/${selectedEventId}/records`)
        .then((res) => {
          const rows: CommunionRecordRow[] = res.data?.data ?? [];
          setRecent(rows.slice(0, 5).map((r) => toRecentEntry(r, Date.now())));
        })
        .catch(() => setRecent([]));
    },
    [],
  );

  // Re-fetch on event change; a ref lets record-success trigger a refresh without
  // churning the verify/record callback identities.
  useEffect(() => {
    if (event?.id) refreshRecent(event.id);
  }, [event?.id, refreshRecent]);
  useEffect(() => {
    recentRefreshRef.current = () => {
      if (event?.id) refreshRecent(event.id);
    };
  });

  /** §31: the code map wins so wording stays stable; server copy is the fallback. */
  const showFailure = useCallback((e: unknown, fallback: string) => {
    setError(communionErrorMessage(e, fallback));
  }, []);

  const verify = useCallback(
    async (token: string) => {
      if (!event || !token.trim()) return;
      setBusy(true);
      setError("");
      try {
        const res = await api.post(`/api/communion/events/${event.id}/verify`, {
          identityToken: token.trim(),
          method,
          deviceId: "web-scanner",
        });
        setVerifyResult(res.data?.data ?? null);
        setPhase("verified");
      } catch (e) {
        showFailure(e, "Verification failed. Check the credential and try again.");
        setIdentityToken("");
        scanInputRef.current?.focus();
      } finally {
        setBusy(false);
      }
    },
    [event, method, showFailure]
  );

  const record = useCallback(
    async (idempotencyKey: string) => {
      if (!event || !verifyResult) return;
      setBusy(true);
      setError("");
      try {
        const res = await api.post(`/api/communion/events/${event.id}/records`, {
          identityToken,
          method,
          idempotencyKey,
          deviceId: "web-scanner",
        });
        const rec = res.data?.data;
        setRecordedInfo({ method: rec?.verificationMethod ?? method, time: new Date().toLocaleTimeString() });
        setPhase("recorded");
        recentRefreshRef.current();
      } catch (e) {
        showFailure(e, "Recording failed.");
      } finally {
        setBusy(false);
      }
    },
    [event, verifyResult, identityToken, method, showFailure]
  );

  const recordManual = useCallback(
    async () => {
      if (!event || !manualMember) return;
      if (!manualReason.trim()) {
        setError("A reason is required for manual recording.");
        return;
      }
      setBusy(true);
      setError("");
      try {
        const res = await api.post(`/api/communion/events/${event.id}/records/manual`, {
          memberId: manualMember.userId,
          reason: manualReason.trim(),
          note: manualNote.trim(),
          idempotencyKey: newIdempotencyKey(),
        });
        const rec = res.data?.data;
        setRecordedInfo({ method: rec?.verificationMethod ?? "MANUAL", time: new Date().toLocaleTimeString() });
        setVerifyResult(null);
        setManualOpen(false);
        setPhase("recorded");
        recentRefreshRef.current();
      } catch (e) {
        showFailure(e, "Manual recording failed.");
      } finally {
        setBusy(false);
      }
    },
    [event, manualMember, manualReason, manualNote, showFailure]
  );

  // Member search for the MANUAL fallback (staff directory search).
  useEffect(() => {
    if (!manualOpen || searchQ.trim().length < 2) {
      setSearchResults([]);
      return;
    }
    const t = setTimeout(() => {
      api
        .get(`/api/members/search?q=${encodeURIComponent(searchQ.trim())}`)
        .then((res) => setSearchResults(res.data?.data ?? []))
        .catch(() => setSearchResults([]));
    }, 250);
    return () => clearTimeout(t);
  }, [manualOpen, searchQ]);

  if (allowed === null || (allowed && eventsLoading)) {
    return <Skeleton className="h-64 w-full" />;
  }

  if (allowed === false) {
    return (
      <div className="mx-auto max-w-md py-16 text-center">
        <ShieldAlert className="mx-auto mb-3 size-10 text-red-400" aria-hidden="true" />
        <p className="text-lg font-medium text-white">Elder access required</p>
        <p className="mt-1 text-sm text-muted-foreground">
          The Communion scanner is available to elders and congregational staff only.
        </p>
        <Button className="mt-4" variant="outline" onClick={() => router.push("/dashboard")}>
          Back to dashboard
        </Button>
      </div>
    );
  }

  // ── Event picker ──────────────────────────────────────────────────────────
  if (phase === "pick") {
    return (
      <div className="mx-auto max-w-2xl space-y-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Communion Service</h1>
          <p className="text-sm text-muted-foreground">Select the communion event to record against.</p>
        </div>
        {events.length === 0 ? (
          <Card>
            <CardContent className="py-10 text-center text-sm text-muted-foreground">
              No communion events yet. Ask your administrator to create one.
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-2">
            {events.slice(0, 12).map((e) => (
              <button
                key={e.id}
                onClick={() => {
                  setEvent(e);
                  resetScan();
                }}
                disabled={e.status !== "OPEN"}
                className="flex w-full items-center justify-between rounded-xl border border-white/10 bg-card px-4 py-3 text-left transition-colors hover:bg-muted/40 disabled:opacity-50"
              >
                <div>
                  <p className="font-medium text-white">
                    {new Date(e.serviceDate).toLocaleDateString(undefined, { weekday: "long", year: "numeric", month: "long", day: "numeric" })}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {e.serviceStartTime?.slice(0, 5)}{e.serviceEndTime ? `–${e.serviceEndTime.slice(0, 5)}` : ""}{e.location ? ` · ${e.location}` : ""}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-muted-foreground">{e.recordedCount} recorded</span>
                  <Badge variant={e.status === "OPEN" ? "default" : "secondary"}>{e.status}</Badge>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    );
  }

  const canSelect = event?.status === "OPEN";

  return (
    <div className="mx-auto max-w-2xl space-y-4">
      {/* Event header */}
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs uppercase tracking-wider text-muted-foreground">Communion Service</p>
          <h1 className="text-lg font-bold text-white">
            {event ? new Date(event.serviceDate).toLocaleDateString(undefined, { weekday: "short", year: "numeric", month: "short", day: "numeric" }) : ""}
            {event?.location ? ` · ${event.location}` : ""}
          </h1>
        </div>
        <Button variant="ghost" size="sm" onClick={() => setPhase("pick")}>
          <ChevronLeft className="size-4" aria-hidden="true" /> Events
        </Button>
      </div>

      {/* ── SCAN phase ── */}
      {phase === "scan" && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <ScanLine className="size-5 text-blue-400" aria-hidden="true" /> Scan Member
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {!canSelect ? (
              <p className="text-sm text-muted-foreground">This event is {event?.status}. Recording is only possible while the event is OPEN.</p>
            ) : (
              <>
                <div className="rounded-xl border border-dashed border-white/15 bg-black/20 p-6 text-center">
                  <QrCode className="mx-auto mb-2 size-10 text-blue-400" aria-hidden="true" />
                  <p className="text-sm font-medium text-white">Ask the member to present their PCEA Church ID</p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Scan the QR with a hardware scanner, or paste/type the credential below (format MC1.…).
                  </p>
                  <Input
                    ref={scanInputRef}
                    value={identityToken}
                    onChange={(e) => setIdentityToken(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") verify(identityToken);
                    }}
                    placeholder="MC1.memberId.issuedAt.signature"
                    className="mx-auto mt-3 max-w-md font-mono text-xs"
                    aria-label="Church ID credential"
                  />
                  <Button className="mt-3" onClick={() => verify(identityToken)} disabled={busy || !identityToken.trim()}>
                    {busy ? <Loader2 className="size-4 animate-spin" aria-hidden="true" /> : <QrCode className="size-4" aria-hidden="true" />}
                    Verify Member
                  </Button>
                </div>

                <div className="flex flex-wrap gap-2">
                  <Button variant="outline" size="sm" disabled title="NFC hardware not configured — see docs/COMMUNION_SECURITY.md">
                    <Nfc className="size-4" aria-hidden="true" /> NFC (not available)
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => setManualOpen(true)}>
                    <Search className="size-4" aria-hidden="true" /> Search Member
                  </Button>
                </div>
                {error && <p className="text-sm text-red-400">{error}</p>}
              </>
            )}
          </CardContent>
        </Card>
      )}

      {/* ── Recent (§29): the service's latest activity at a glance ── */}
      {phase === "scan" && canSelect && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-base">
              <ScanLine className="size-5 text-blue-400" aria-hidden="true" /> Recent
            </CardTitle>
          </CardHeader>
          <CardContent>
            {recent.length === 0 ? (
              <p className="text-sm text-muted-foreground">No communion recorded at this service yet.</p>
            ) : (
              <ul className="space-y-1.5">
                {recent.map((entry) => (
                  <li key={entry.key} className="flex items-center gap-2 text-sm">
                    {entry.ok ? (
                      <CheckCircle2 className="size-4 shrink-0 text-green-400" aria-hidden="true" />
                    ) : (
                      <XCircle className="size-4 shrink-0 text-amber-400" aria-hidden="true" />
                    )}
                    <span className="text-white">{entry.displayName}</span>
                    <span className="text-xs text-muted-foreground">— {entry.detail}</span>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      )}

      {/* ── VERIFIED phase ── */}
      {phase === "verified" && verifyResult && (
        <Card className={verifyResult.recordable ? "border-green-500/40" : "border-amber-500/40"}>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              {verifyResult.recordable ? (
                <>
                  <CheckCircle2 className="size-5 text-green-400" aria-hidden="true" /> Member Verified
                </>
              ) : (
                <>
                  <XCircle className="size-5 text-amber-400" aria-hidden="true" /> Cannot Record
                </>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="rounded-xl bg-muted/40 p-4">
              <p className="text-lg font-bold text-white">{verifyResult.fullName}</p>
              <p className="text-sm text-muted-foreground">{verifyResult.congregationName}</p>
              <div className="mt-2 flex flex-wrap items-center gap-2 text-xs">
                <Badge variant="secondary">Membership: {verifyResult.memberStatus}</Badge>
                <Badge variant={verifyResult.communionEligibility === "ELIGIBLE" ? "default" : "destructive"}>
                  Communion: {verifyResult.communionEligibility}
                </Badge>
                <Badge variant="outline">Previous communion: {verifyResult.previousCommunionCount}</Badge>
                {verifyResult.duplicate && <Badge variant="destructive">Duplicate</Badge>}
              </div>
            </div>

            {verifyResult.recordable ? (
              <Button className="w-full" size="lg" onClick={() => record(newIdempotencyKey())} disabled={busy}>
                {busy ? <Loader2 className="size-4 animate-spin" aria-hidden="true" /> : <CheckCircle2 className="size-4" aria-hidden="true" />}
                Record Communion
              </Button>
            ) : (
              <div className="rounded-lg border border-amber-500/30 bg-amber-500/10 p-3 text-sm text-amber-200">
                {FAILURE_MESSAGES[verifyResult.blockReasonCode ?? ""] ?? verifyResult.blockReason}
                <Button variant="outline" size="sm" className="mt-2" onClick={resetScan}>
                  Scan Next Member
                </Button>
              </div>
            )}
            {error && <p className="text-sm text-red-400">{error}</p>}
          </CardContent>
        </Card>
      )}

      {/* ── RECORDED phase ── */}
      {phase === "recorded" && (
        <Card className="border-green-500/40">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <CheckCircle2 className="size-5 text-green-400" aria-hidden="true" /> Communion Recorded
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="rounded-xl bg-green-500/10 p-4 text-sm text-green-200">
              <p>Method: {recordedInfo?.method}</p>
              <p>Time: {recordedInfo?.time}</p>
              <p>Recorded by: you (elder/staff on duty)</p>
            </div>
            <Button className="w-full" size="lg" onClick={resetScan}>
              <ScanLine className="size-4" aria-hidden="true" /> Scan Next Member
            </Button>
          </CardContent>
        </Card>
      )}

      {/* ── MANUAL fallback dialog ── */}
      {manualOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4" role="dialog" aria-modal="true" aria-label="Manual member recording">
          <Card className="w-full max-w-md">
            <CardHeader>
              <CardTitle className="text-base">Manual Recording — Search Member</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Input
                autoFocus
                value={searchQ}
                onChange={(e) => setSearchQ(e.target.value)}
                placeholder="Search members by name…"
                aria-label="Search members"
              />
              <div className="max-h-48 space-y-1 overflow-y-auto">
                {searchResults.map((m) => (
                  <button
                    key={m.userId}
                    className={`flex w-full items-center justify-between rounded-lg border px-3 py-2 text-left text-sm ${manualMember?.userId === m.userId ? "border-green-500/50 bg-green-500/10" : "border-white/10 hover:bg-muted/40"}`}
                    onClick={() => setManualMember(m)}
                  >
                    <span className="text-white">{m.fullName}</span>
                    <span className="text-xs text-muted-foreground">{m.memberStatus}</span>
                  </button>
                ))}
                {searchQ.trim().length >= 2 && searchResults.length === 0 && (
                  <p className="px-1 py-2 text-xs text-muted-foreground">No members found.</p>
                )}
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-muted-foreground" htmlFor="manual-reason">
                  Reason (required)
                </label>
                <Input
                  id="manual-reason"
                  value={manualReason}
                  onChange={(e) => setManualReason(e.target.value)}
                  placeholder="e.g. Card damaged — identity confirmed from the roll"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-muted-foreground" htmlFor="manual-note">
                  Note (optional)
                </label>
                <Input id="manual-note" value={manualNote} onChange={(e) => setManualNote(e.target.value)} placeholder="Optional note" />
              </div>
              {error && <p className="text-sm text-red-400">{error}</p>}
              <div className="flex justify-end gap-2">
                <Button variant="ghost" onClick={() => { setManualOpen(false); setManualMember(null); setError(""); }}>
                  Cancel
                </Button>
                <Button onClick={recordManual} disabled={busy || !manualMember || !manualReason.trim()}>
                  {busy ? <Loader2 className="size-4 animate-spin" aria-hidden="true" /> : <CheckCircle2 className="size-4" aria-hidden="true" />}
                  Record Communion
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                Manual entries are marked MANUAL and are audited. Every security check still applies.
              </p>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
