/**
 * Communion Tracker — shared API contracts + helpers for the frontend.
 * Mirrors the backend DTOs (ke.pcea.connect.modules.communion.api.dto).
 */

export interface CommunionEventRow {
  id: string;
  serviceDate: string;
  serviceStartTime: string | null;
  serviceEndTime: string | null;
  location: string;
  status: "DRAFT" | "OPEN" | "CLOSED" | "CANCELLED";
  recordedCount: number;
  createdBy?: string;
  createdAt?: string;
}

export interface CommunionVerificationResult {
  memberId: string;
  fullName: string;
  congregationName: string;
  memberStatus: string;
  communionEligibility: string;
  previousCommunionCount: number;
  duplicate: boolean;
  recordable: boolean;
  blockReason: string;
  verificationMethod: string;
  /** Stable machine-readable reason when recordable=false (spec STEP 12). */
  blockReasonCode?: string;
}

export interface CommunionRecordRow {
  id: string;
  userId: string;
  serviceDate: string;
  note: string;
  recordedBy: string;
  recordedAt: string;
  eventId: string | null;
  verificationMethod: string;
  status: "RECORDED" | "VOIDED";
  voidReason: string | null;
  /** Resolved display name — present on event record listings (§29 Recent panel). */
  memberName?: string;
}

export interface CommunionMemberSearchRow {
  userId: string;
  fullName: string;
  email: string;
  memberStatus: string;
  congregationName: string | null;
}

export interface CommunionEventReport {
  eventId: string;
  serviceDate: string;
  location: string;
  status: string;
  congregationMemberCount: number;
  recordedTotal: number;
  voidedTotal: number;
  recordedByMethod: Record<string, number>;
  duplicatesBlocked: number;
  verificationAttempts: number;
  // Spec §33 additions
  rejectedAttempts: number;
  pendingEligibility: number;
  restrictedMembers: number;
  suspendedMembers: number;
}

export interface CommunionEligibility {
  userId: string;
  status: "ELIGIBLE" | "PENDING" | "RESTRICTED" | "SUSPENDED";
  reason: string;
  updatedBy: string;
  updatedAt: string;
}

/**
 * §31 failure UX: every Communion error code gets a distinct, non-generic
 * message. The code map wins so the §31 wording is stable across releases;
 * server copy is the fallback; no HTTP response at all means a network error.
 */
export const COMMUNION_ERROR_MESSAGES: Record<string, string> = {
  INVALID_CREDENTIAL: "Credential invalid.",
  TAMPERED_CREDENTIAL: "Credential signature invalid.",
  INACTIVE_MEMBER: "Membership inactive.",
  WRONG_CONGREGATION: "Member does not belong to this Communion event's congregation.",
  PENDING_ELIGIBILITY: "Communion eligibility pending.",
  RESTRICTED_MEMBER: "Member is currently restricted.",
  DUPLICATE_RECORD: "Communion already recorded for this service.",
  EVENT_CLOSED: "This Communion event is closed.",
  REASON_REQUIRED: "A reason is required to record manually.",
  UNAUTHORIZED: "You are not authorized to record Communion.",
  NETWORK_ERROR: "Network error — check your connection and try again.",
};

export function communionErrorMessage(error: unknown, fallback: string): string {
  const response = (error as { response?: { data?: unknown } } | null | undefined)?.response;
  if (!response) return COMMUNION_ERROR_MESSAGES.NETWORK_ERROR;
  const data = (response.data ?? {}) as { message?: unknown; code?: unknown };
  const code = typeof data.code === "string" ? data.code : "";
  if (code && COMMUNION_ERROR_MESSAGES[code]) return COMMUNION_ERROR_MESSAGES[code];
  if (typeof data.message === "string" && data.message.trim()) return data.message;
  return fallback;
}

/** Client-generated idempotency key: retries/refreshes can never double-record. */
export function newIdempotencyKey(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) return crypto.randomUUID();
  return `idem-${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

/** Staff roles allowed to run the scanner (mirrors Roles.STAFF_OR_CLERK_SPEL). */
export function isCommunionStaff(roles: string[]): boolean {
  return roles.some((r) =>
    ["ADMIN", "SUPER_ADMIN", "ELDER", "CLERK", "PASTOR", "MINISTER", "SECRETARY"].includes(r)
  );
}
