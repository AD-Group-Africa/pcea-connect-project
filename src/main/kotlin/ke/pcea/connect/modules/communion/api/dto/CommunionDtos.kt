package ke.pcea.connect.modules.communion.api.dto

import java.time.LocalDate

// ── Existing DTOs (preserved; response extended additively) ────────────────

data class CommunionRecordRequest(val userId: String, val serviceDate: String, val note: String = "")

data class CommunionRecordResponse(
    val id: String,
    val userId: String,
    val serviceDate: LocalDate,
    val note: String,
    val recordedBy: String,
    val recordedAt: String,
    // V057 additions (defaults keep existing API consumers compatible)
    val eventId: String? = null,
    val verificationMethod: String = "MANUAL",
    val status: String = "RECORDED",
    val voidReason: String? = null,
    /** Resolved member display name — populated for event record listings (§29 Recent panel). */
    val memberName: String = ""
)

// ── Communion events ───────────────────────────────────────────────────────

data class CommunionEventRequest(
    val serviceDate: String,
    val startTime: String? = null,
    val endTime: String? = null,
    val location: String = ""
)

data class CommunionEventResponse(
    val id: String,
    val congregationId: String,
    val serviceDate: LocalDate,
    val serviceStartTime: String?,
    val serviceEndTime: String?,
    val location: String,
    val status: String,
    val createdBy: String,
    val closedAt: String?,
    val createdAt: String,
    val recordedCount: Long = 0
)

// ── Verification pipeline (verify is read-only; record is explicit) ───────

data class CommunionVerifyRequest(
    val identityToken: String = "",
    val method: String = "QR",
    val deviceId: String = ""
)

data class CommunionVerificationResponse(
    val memberId: String,
    val fullName: String,
    val congregationName: String,
    val memberStatus: String,
    val communionEligibility: String,
    val previousCommunionCount: Int,
    val duplicate: Boolean,
    val recordable: Boolean,
    val blockReason: String,
    val verificationMethod: String,
    /** Stable machine-readable reason when recordable=false (spec STEP 12). */
    val blockReasonCode: String = ""
)

data class CommunionRecordConfirmRequest(
    val identityToken: String = "",
    val method: String = "QR",
    val idempotencyKey: String = "",
    val deviceId: String = "",
    val note: String = ""
)

/** Manual fallback: no credential, but reason is REQUIRED and all checks still run. */
data class CommunionManualRecordRequest(
    val memberId: String = "",
    val reason: String = "",
    val idempotencyKey: String = "",
    val note: String = ""
)

data class CommunionVoidRequest(val reason: String = "")

// ── Eligibility ────────────────────────────────────────────────────────────

data class CommunionEligibilityRequest(val status: String, val reason: String = "")

data class CommunionEligibilityResponse(
    val userId: String,
    val status: String,
    val reason: String,
    val updatedBy: String,
    val updatedAt: String
)

// ── Event report ───────────────────────────────────────────────────────────

data class CommunionEventReportResponse(
    val eventId: String,
    val serviceDate: LocalDate,
    val location: String,
    val status: String,
    val congregationMemberCount: Long,
    val recordedTotal: Long,
    val voidedTotal: Long,
    val recordedByMethod: Map<String, Long>,
    val duplicatesBlocked: Long,
    val verificationAttempts: Long,
    // Spec §33 additions (defaults keep existing consumers compatible)
    val rejectedAttempts: Long = 0,
    val pendingEligibility: Long = 0,
    val restrictedMembers: Long = 0,
    val suspendedMembers: Long = 0
)
