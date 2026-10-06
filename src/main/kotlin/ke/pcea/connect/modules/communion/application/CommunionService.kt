package ke.pcea.connect.modules.communion.application

import ke.pcea.connect.modules.communion.api.dto.*
import ke.pcea.connect.modules.communion.domain.*
import ke.pcea.connect.modules.communion.infrastructure.CommunionEligibilityRepository
import ke.pcea.connect.modules.communion.infrastructure.CommunionEventRepository
import ke.pcea.connect.modules.communion.infrastructure.CommunionRecordRepository
import ke.pcea.connect.modules.communion.verification.IdentityReaderRegistry
import ke.pcea.connect.modules.identity.infrastructure.UserRepository
import ke.pcea.connect.modules.membership.application.MemberCredentialService
import ke.pcea.connect.shared.audit.AuditLogRepository
import ke.pcea.connect.shared.audit.AuditService
import ke.pcea.connect.shared.api.BusinessRuleException
import ke.pcea.connect.shared.security.Roles
import ke.pcea.connect.shared.security.TenantGuard
import org.springframework.dao.DataIntegrityViolationException
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional
import java.time.LocalDate
import java.time.LocalTime

/**
 * Communion Tracker service.
 *
 * Preserves the original pastoral record flow ([record]) and adds, on the same
 * domain: event lifecycle (DRAFT→OPEN→CLOSED / CANCELLED), the verify→confirm
 * recording pipeline (a scan NEVER auto-records), duplicate prevention via
 * idempotency keys + a unique active record per member per event, soft-void
 * correction, and the event report. Eligibility is a separate concept — it is
 * never derived from QR credential validity.
 */
@Service
@Transactional
class CommunionService(
    private val recordRepo: CommunionRecordRepository,
    private val eventRepo: CommunionEventRepository,
    private val eligibilityRepo: CommunionEligibilityRepository,
    private val users: UserRepository,
    private val tenantGuard: TenantGuard,
    private val audit: AuditService,
    private val auditLogRepo: AuditLogRepository,
    private val credentials: MemberCredentialService,
    private val identityReaders: IdentityReaderRegistry
) {

    // ── Original pastoral flow (preserved) ─────────────────────────────────

    /**
     * Records a member's communion participation without a tracker event (legacy
     * pastoral note flow). The congregation is ALWAYS the recorded member's own —
     * a client-supplied congregation id cannot select a different church.
     */
    fun record(recorderId: String, memberId: String, serviceDate: LocalDate, note: String): CommunionRecord {
        val member = users.findById(memberId).orElseThrow { BusinessRuleException("Member not found") }
        val congregationId = member.congregation?.id
            ?: throw BusinessRuleException("The member has no congregation assigned")
        // The recorder must share the member's congregation (pastoral role already enforced upstream).
        tenantGuard.requireMember(recorderId, congregationId)
        val saved = recordRepo.save(
            CommunionRecord(userId = memberId, congregationId = congregationId, serviceDate = serviceDate, note = note, recordedBy = recorderId)
        )
        // AUDIT: sacramental records are sensitive. The note itself is deliberately NOT
        // logged — only the fact, date and actor (the record itself keeps the content).
        audit.record(
            actorId = recorderId,
            action = "COMMUNION_RECORD",
            entityType = "communion_record",
            entityId = saved.id,
            detail = "member=$memberId date=$serviceDate"
        )
        return saved
    }

    fun myRecords(userId: String) = recordRepo.findByUserIdOrderByServiceDateDesc(userId)

    /** Congregation-scoped read for pastoral roles; the congregation comes from the caller. */
    fun congregationRecords(callerId: String): List<CommunionRecord> {
        val congregationId = tenantGuard.requireCongregationContext(callerId)
        return recordRepo.findByCongregationIdOrderByServiceDateDesc(congregationId)
    }

    // ── Event lifecycle ────────────────────────────────────────────────────

    fun createEvent(actorId: String, serviceDate: LocalDate, startTime: LocalTime?, endTime: LocalTime?, location: String): CommunionEvent {
        val congregationId = tenantGuard.requireCongregationContext(actorId)
        if (endTime != null && startTime != null && endTime.isBefore(startTime))
            throw BusinessRuleException("Service end time cannot be before the start time")
        val event = eventRepo.save(
            CommunionEvent(
                congregationId = congregationId, serviceDate = serviceDate,
                serviceStartTime = startTime, serviceEndTime = endTime,
                location = location, createdBy = actorId
            )
        )
        audit.record(actorId, "COMMUNION_EVENT_CREATED", "communion_event", event.id, "date=$serviceDate")
        return event
    }

    fun openEvent(actorId: String, actorRoles: Collection<String>, eventId: String): CommunionEvent {
        val event = requireEvent(eventId)
        requireEventStaff(actorId, actorRoles, event.congregationId)
        if (event.status != CommunionEventStatus.DRAFT)
            throw BusinessRuleException("Only a DRAFT communion event can be opened")
        event.status = CommunionEventStatus.OPEN
        event.updatedAt = java.time.LocalDateTime.now()
        audit.record(actorId, "COMMUNION_EVENT_OPENED", "communion_event", event.id, actorRoles = actorRoles)
        return event
    }

    fun closeEvent(actorId: String, actorRoles: Collection<String>, eventId: String): CommunionEvent {
        val event = requireEvent(eventId)
        requireEventStaff(actorId, actorRoles, event.congregationId)
        if (event.status != CommunionEventStatus.OPEN)
            throw BusinessRuleException("Only an OPEN communion event can be closed")
        event.status = CommunionEventStatus.CLOSED
        event.closedBy = actorId
        val closedAt = java.time.LocalDateTime.now()
        event.closedAt = closedAt
        event.updatedAt = closedAt
        audit.record(actorId, "COMMUNION_EVENT_CLOSED", "communion_event", event.id, actorRoles = actorRoles)
        return event
    }

    fun cancelEvent(actorId: String, actorRoles: Collection<String>, eventId: String): CommunionEvent {
        val event = requireEvent(eventId)
        requireEventStaff(actorId, actorRoles, event.congregationId)
        if (event.status == CommunionEventStatus.CLOSED)
            throw BusinessRuleException("A CLOSED communion event cannot be cancelled")
        event.status = CommunionEventStatus.CANCELLED
        event.closedBy = actorId
        val cancelledAt = java.time.LocalDateTime.now()
        event.closedAt = cancelledAt
        event.updatedAt = cancelledAt
        audit.record(actorId, "COMMUNION_EVENT_CANCELLED", "communion_event", event.id, actorRoles = actorRoles)
        return event
    }

    /** Read access: staff of the event's congregation, or SUPER_ADMIN (platform view). */
    fun getEvent(actorId: String, actorRoles: Collection<String>, eventId: String): CommunionEvent {
        val event = requireEvent(eventId)
        requireEventStaff(actorId, actorRoles, event.congregationId)
        return event
    }

    fun listEvents(actorId: String): List<CommunionEvent> {
        val congregationId = tenantGuard.requireCongregationContext(actorId)
        return eventRepo.findByCongregationIdOrderByServiceDateDesc(congregationId)
    }

    /** Active (non-voided) record count for one event — used in event listings. */
    fun eventRecordedCount(eventId: String): Long =
        recordRepo.countByEventIdAndStatus(eventId, CommunionRecordStatus.RECORDED)

    /**
     * All records for one event (RECORDED and VOIDED — history is never hidden).
     * Staff of the event's congregation or SUPER_ADMIN only.
     */
    fun eventRecords(actorId: String, actorRoles: Collection<String>, eventId: String): List<CommunionRecordResponse> {
        val event = requireEvent(eventId)
        requireEventStaff(actorId, actorRoles, event.congregationId)
        val records = recordRepo.findByEventIdOrderByRecordedAtDesc(eventId)
        // One batched lookup: the scanner's Recent panel shows names, never raw member ids (§35 privacy).
        val names = users.findAllById(records.map { it.userId }.toSet()).associate { it.id to it.fullName }
        return records.map { toResponse(it).copy(memberName = names[it.userId] ?: "") }
    }

    // ── Eligibility (independent of credential validity) ───────────────────

    /**
     * Administrative eligibility change. The actor must be staff of the member's own
     * congregation (or SUPER_ADMIN). Every change is audited with the given reason.
     */
    fun setEligibility(actorId: String, actorRoles: Collection<String>, memberId: String, status: CommunionEligibilityStatus, reason: String): CommunionEligibility {
        val member = users.findById(memberId).orElseThrow { BusinessRuleException("Member not found") }
        val congregationId = member.congregation?.id
            ?: throw BusinessRuleException("The member has no congregation assigned")
        if (!actorRoles.contains("SUPER_ADMIN")) tenantGuard.requireStaffOf(actorId, congregationId)
        val existing = eligibilityRepo.findByUserId(memberId).orElse(null)
        val row = existing ?: CommunionEligibility(userId = memberId)
        val previous = row.status.name
        row.status = status
        row.reason = reason
        row.updatedBy = actorId
        row.updatedAt = java.time.LocalDateTime.now()
        val saved = eligibilityRepo.save(row)
        audit.record(
            actorId, "COMMUNION_ELIGIBILITY_CHANGED", "communion_eligibility", saved.id,
            detail = "member=$memberId from=$previous to=${status.name} reason=$reason",
            actorRoles = actorRoles
        )
        return saved
    }

    /** Admin read for one member's eligibility (self or congregation staff). */
    fun getEligibility(actorId: String, actorRoles: Collection<String>, memberId: String): CommunionEligibility {
        val member = users.findById(memberId).orElseThrow { BusinessRuleException("Member not found") }
        if (actorId != memberId && !actorRoles.contains("SUPER_ADMIN")) {
            val congregationId = member.congregation?.id
                ?: throw BusinessRuleException("The member has no congregation assigned")
            tenantGuard.requireStaffOf(actorId, congregationId)
        }
        return eligibilityRepo.findByUserId(memberId).orElse(
            // Never persist on read: unknown members simply ARE pending until staff decide.
            CommunionEligibility(userId = memberId, status = CommunionEligibilityStatus.PENDING, reason = "No eligibility decision recorded yet")
        )
    }

    /** Internal resolution used by the verification pipeline (defaults to PENDING). */
    private fun resolveEligibility(memberId: String): CommunionEligibilityStatus =
        eligibilityRepo.findByUserId(memberId).orElse(null)?.status ?: CommunionEligibilityStatus.PENDING

    // ── Verification pipeline (verify is read-only; recording is separate) ─

    /**
     * Steps 1–12 of the verification pipeline. Authenticates + authorizes the actor,
     * validates the event is OPEN, resolves and verifies the credential through the
     * [IdentityReaderRegistry], checks member status, congregation scope and
     * eligibility, and detects duplicates — but NEVER writes a record.
     * A scan alone never records communion.
     */
    fun verifyForEvent(actorId: String, actorRoles: Collection<String>, eventId: String, method: CommunionVerificationMethod, rawCredential: String): CommunionVerificationResponse {
        val event = requireEvent(eventId)
        requireEventStaff(actorId, actorRoles, event.congregationId)
        if (event.status != CommunionEventStatus.OPEN)
            throw BusinessRuleException(CommunionErrorCodes.EVENT_CLOSED, "Communion can only be recorded against an OPEN event")

        // Credential + member resolution via the reader abstraction (QR/MEMBER_APP now;
        // NFC is a documented hardware integration, MANUAL never enters this pipeline).
        val verification = try {
            val resolvedId = identityReaders.resolve(method, rawCredential)
            resolvedId to users.findById(resolvedId).orElseThrow { BusinessRuleException(CommunionErrorCodes.INVALID_CREDENTIAL, "Unknown credential") }
        } catch (ex: BusinessRuleException) {
            audit.record(actorId, "COMMUNION_VERIFICATION_ATTEMPT", "communion_event", eventId,
                detail = "method=$method result=REJECTED reason=${ex.message}", actorRoles = actorRoles)
            throw ex
        }
        val memberId = verification.first
        val member = verification.second
        if (!member.enabled) {
            audit.record(actorId, "COMMUNION_VERIFICATION_ATTEMPT", "communion_event", eventId,
                detail = "member=$memberId method=$method result=REJECTED reason=INACTIVE", actorRoles = actorRoles)
            throw BusinessRuleException(CommunionErrorCodes.INACTIVE_MEMBER, "Credential holder is not active")
        }

        // Congregation scope: the member must belong to the event's congregation.
        val memberCongregationId = member.congregation?.id
        if (memberCongregationId != event.congregationId) {
            audit.record(actorId, "COMMUNION_VERIFICATION_ATTEMPT", "communion_event", eventId,
                detail = "member=$memberId method=$method result=REJECTED reason=SCOPE", actorRoles = actorRoles)
            throw BusinessRuleException(CommunionErrorCodes.WRONG_CONGREGATION, "The member does not belong to this congregation")
        }

        val eligibility = resolveEligibility(memberId)
        val duplicate = recordRepo.findByEventIdAndUserIdAndStatus(eventId, memberId, CommunionRecordStatus.RECORDED) != null
        val previous = recordRepo.findByUserIdOrderByServiceDateDesc(memberId).count { it.status == CommunionRecordStatus.RECORDED }

        val blockReason = when {
            duplicate -> "This member has already been recorded for this event" to CommunionErrorCodes.DUPLICATE_RECORD
            eligibility == CommunionEligibilityStatus.SUSPENDED -> "Communion eligibility is SUSPENDED" to CommunionErrorCodes.RESTRICTED_MEMBER
            eligibility == CommunionEligibilityStatus.RESTRICTED -> "Communion eligibility is RESTRICTED" to CommunionErrorCodes.RESTRICTED_MEMBER
            eligibility != CommunionEligibilityStatus.ELIGIBLE -> "Communion eligibility is ${eligibility.name}" to CommunionErrorCodes.PENDING_ELIGIBILITY
            else -> "" to "" // recordable
        }
        audit.record(actorId, "COMMUNION_VERIFICATION_ATTEMPT", "communion_event", eventId,
            detail = "member=$memberId method=$method result=VERIFIED duplicate=$duplicate eligibility=$eligibility",
            actorRoles = actorRoles)

        return CommunionVerificationResponse(
            memberId = memberId,
            fullName = member.fullName,
            congregationName = member.congregation?.name ?: "",
            memberStatus = if (member.enabled) "ACTIVE" else "INACTIVE",
            communionEligibility = eligibility.name,
            previousCommunionCount = previous,
            duplicate = duplicate,
            recordable = blockReason.first.isEmpty(),
            blockReason = blockReason.first,
            verificationMethod = method.name,
            blockReasonCode = blockReason.second
        )
    }

    /**
     * Step 13–15: explicit record confirmation. ALL pipeline checks are re-run
     * server-side (the earlier verification is never trusted); the idempotency key
     * makes retries, refreshes and multi-device double-submits safe.
     */
    fun recordVerified(
        actorId: String, actorRoles: Collection<String>, eventId: String,
        method: CommunionVerificationMethod, rawCredential: String,
        idempotencyKey: String, deviceId: String, note: String
    ): CommunionRecordResponse {
        if (idempotencyKey.isBlank() || idempotencyKey.length > 100)
            throw BusinessRuleException("A valid idempotency key is required")

        // Idempotent replay: the same key returns the SAME record, never a duplicate.
        recordRepo.findByIdempotencyKey(idempotencyKey)?.let { existing ->
            return toResponse(existing)
        }

        val event = requireEvent(eventId)
        requireEventStaff(actorId, actorRoles, event.congregationId)
        if (event.status != CommunionEventStatus.OPEN)
            throw BusinessRuleException(CommunionErrorCodes.EVENT_CLOSED, "Communion can only be recorded against an OPEN event")

        val memberId = identityReaders.resolve(method, rawCredential)
        val member = users.findById(memberId).orElseThrow { BusinessRuleException(CommunionErrorCodes.INVALID_CREDENTIAL, "Unknown credential") }
        if (!member.enabled) throw BusinessRuleException(CommunionErrorCodes.INACTIVE_MEMBER, "Credential holder is not active")
        if (member.congregation?.id != event.congregationId)
            throw BusinessRuleException(CommunionErrorCodes.WRONG_CONGREGATION, "The member does not belong to this congregation")
        if (resolveEligibility(memberId) != CommunionEligibilityStatus.ELIGIBLE)
            throw BusinessRuleException(CommunionErrorCodes.PENDING_ELIGIBILITY, "The member is not eligible for communion")

        // Duplicate check (unique active record per member per event).
        if (recordRepo.findByEventIdAndUserIdAndStatus(eventId, memberId, CommunionRecordStatus.RECORDED) != null) {
            audit.record(actorId, "COMMUNION_DUPLICATE_BLOCKED", "communion_event", eventId,
                detail = "member=$memberId method=$method", actorRoles = actorRoles)
            throw BusinessRuleException(CommunionErrorCodes.DUPLICATE_RECORD, "This member has already been recorded for this event")
        }

        val now = java.time.LocalDateTime.now()
        val saved = try {
            recordRepo.save(
                CommunionRecord(
                    userId = memberId, congregationId = event.congregationId, serviceDate = event.serviceDate,
                    note = note, recordedBy = actorId, recordedAt = now,
                    eventId = eventId, verificationMethod = method,
                    status = CommunionRecordStatus.RECORDED, verifiedBy = actorId, verifiedAt = now,
                    deviceId = deviceId.take(120).ifBlank { null }, idempotencyKey = idempotencyKey,
                    activeSlot = "E:$eventId|U:$memberId"
                )
            )
        } catch (ex: DataIntegrityViolationException) {
            // Concurrent double-submit raced past the pre-check: the unique slot index is
            // the real guarantee. Surface as a duplicate, never a second record.
            audit.record(actorId, "COMMUNION_DUPLICATE_BLOCKED", "communion_event", eventId,
                detail = "member=$memberId method=$method reason=CONSTRAINT", actorRoles = actorRoles)
            throw BusinessRuleException(CommunionErrorCodes.DUPLICATE_RECORD, "This member has already been recorded for this event")
        }
        audit.record(actorId, "COMMUNION_RECORDED", "communion_record", saved.id,
            detail = "member=$memberId event=$eventId method=$method", actorRoles = actorRoles)
        return toResponse(saved)
    }

    /** Manual fallback — no credential, but every security check still applies. */
    fun recordManual(
        actorId: String, actorRoles: Collection<String>, eventId: String,
        memberId: String, reason: String, idempotencyKey: String, note: String
    ): CommunionRecordResponse {
        if (reason.isBlank()) throw BusinessRuleException(CommunionErrorCodes.REASON_REQUIRED, "A reason is required for manual recording")
        if (idempotencyKey.isBlank() || idempotencyKey.length > 100)
            throw BusinessRuleException("A valid idempotency key is required")
        recordRepo.findByIdempotencyKey(idempotencyKey)?.let { return toResponse(it) }

        val event = requireEvent(eventId)
        requireEventStaff(actorId, actorRoles, event.congregationId)
        if (event.status != CommunionEventStatus.OPEN)
            throw BusinessRuleException(CommunionErrorCodes.EVENT_CLOSED, "Communion can only be recorded against an OPEN event")
        val member = users.findById(memberId).orElseThrow { BusinessRuleException(CommunionErrorCodes.INVALID_CREDENTIAL, "Member not found") }
        if (!member.enabled) throw BusinessRuleException(CommunionErrorCodes.INACTIVE_MEMBER, "Member account is not active")
        if (member.congregation?.id != event.congregationId)
            throw BusinessRuleException(CommunionErrorCodes.WRONG_CONGREGATION, "The member does not belong to this congregation")
        if (resolveEligibility(memberId) != CommunionEligibilityStatus.ELIGIBLE)
            throw BusinessRuleException(CommunionErrorCodes.PENDING_ELIGIBILITY, "The member is not eligible for communion")
        if (recordRepo.findByEventIdAndUserIdAndStatus(eventId, memberId, CommunionRecordStatus.RECORDED) != null) {
            audit.record(actorId, "COMMUNION_DUPLICATE_BLOCKED", "communion_event", eventId,
                detail = "member=$memberId method=MANUAL", actorRoles = actorRoles)
            throw BusinessRuleException(CommunionErrorCodes.DUPLICATE_RECORD, "This member has already been recorded for this event")
        }

        val now = java.time.LocalDateTime.now()
        val saved = try {
            recordRepo.save(
                CommunionRecord(
                    userId = memberId, congregationId = event.congregationId, serviceDate = event.serviceDate,
                    note = note.ifBlank { "Manual entry — $reason" }, recordedBy = actorId, recordedAt = now,
                    eventId = eventId, verificationMethod = CommunionVerificationMethod.MANUAL,
                    status = CommunionRecordStatus.RECORDED, verifiedBy = actorId, verifiedAt = now,
                    idempotencyKey = idempotencyKey,
                    activeSlot = "E:$eventId|U:$memberId"
                )
            )
        } catch (ex: DataIntegrityViolationException) {
            audit.record(actorId, "COMMUNION_DUPLICATE_BLOCKED", "communion_event", eventId,
                detail = "member=$memberId method=MANUAL reason=CONSTRAINT", actorRoles = actorRoles)
            throw BusinessRuleException(CommunionErrorCodes.DUPLICATE_RECORD, "This member has already been recorded for this event")
        }
        audit.record(actorId, "COMMUNION_RECORDED", "communion_record", saved.id,
            detail = "member=$memberId event=$eventId method=MANUAL reason=$reason", actorRoles = actorRoles)
        return toResponse(saved)
    }

    // ── Void (soft delete only — records are never hard-deleted) ───────────

    fun voidRecord(actorId: String, actorRoles: Collection<String>, recordId: String, reason: String): CommunionRecord {
        if (reason.isBlank()) throw BusinessRuleException("A reason is required to void a communion record")
        val rec = recordRepo.findById(recordId).orElseThrow { BusinessRuleException("Record not found") }
        if (!actorRoles.contains("SUPER_ADMIN")) tenantGuard.requireStaffOf(actorId, rec.congregationId)
        if (rec.status == CommunionRecordStatus.VOIDED)
            throw BusinessRuleException("This record is already voided")
        rec.status = CommunionRecordStatus.VOIDED
        rec.voidReason = reason
        rec.voidedBy = actorId
        rec.voidedAt = java.time.LocalDateTime.now()
        // Free the (event, member) slot so a corrected re-record can succeed.
        rec.activeSlot = rec.id
        audit.record(actorId, "COMMUNION_VOIDED", "communion_record", rec.id,
            detail = "member=${rec.userId} event=${rec.eventId} reason=$reason", actorRoles = actorRoles)
        return rec
    }

    // ── Event report ───────────────────────────────────────────────────────

    fun eventReport(actorId: String, actorRoles: Collection<String>, eventId: String): CommunionEventReportResponse {
        val event = requireEvent(eventId)
        requireEventStaff(actorId, actorRoles, event.congregationId)
        val recorded = recordRepo.countByEventIdAndStatus(eventId, CommunionRecordStatus.RECORDED)
        val voided = recordRepo.countByEventIdAndStatus(eventId, CommunionRecordStatus.VOIDED)
        val byMethod = CommunionVerificationMethod.values().associate { m ->
            m.name to recordRepo.countByEventIdAndVerificationMethod(eventId, m)
        }
        // Blocked/failed attempts are reconstructed from the append-only audit log —
        // they were deliberately never stored as records.
        val duplicatesBlocked = auditLogRepo.countByActionAndEntityTypeAndEntityId("COMMUNION_DUPLICATE_BLOCKED", "communion_event", eventId)
        val attempts = auditLogRepo.countByActionAndEntityTypeAndEntityId("COMMUNION_VERIFICATION_ATTEMPT", "communion_event", eventId)
        val rejected = auditLogRepo.findByEntityTypeAndEntityIdOrderByCreatedAtDesc("communion_event", eventId)
            .count { it.action == "COMMUNION_VERIFICATION_ATTEMPT" && it.detail.contains("result=REJECTED") }.toLong()
        // Eligibility breakdown over the congregation's members (PENDING = no row).
        var pendingEligibility = 0L
        var restrictedMembers = 0L
        var suspendedMembers = 0L
        for (u in users.findByCongregationId(event.congregationId)) {
            when (resolveEligibility(u.id)) {
                CommunionEligibilityStatus.PENDING -> pendingEligibility++
                CommunionEligibilityStatus.RESTRICTED -> restrictedMembers++
                CommunionEligibilityStatus.SUSPENDED -> suspendedMembers++
                else -> {}
            }
        }
        return CommunionEventReportResponse(
            eventId = eventId, serviceDate = event.serviceDate, location = event.location,
            status = event.status.name, congregationMemberCount = users.countByCongregationId(event.congregationId),
            recordedTotal = recorded, voidedTotal = voided, recordedByMethod = byMethod,
            duplicatesBlocked = duplicatesBlocked, verificationAttempts = attempts,
            rejectedAttempts = rejected, pendingEligibility = pendingEligibility,
            restrictedMembers = restrictedMembers, suspendedMembers = suspendedMembers
        )
    }

        // ── helpers ────────────────────────────────────────────────────────────

    private fun requireEvent(eventId: String): CommunionEvent =
        eventRepo.findById(eventId).orElseThrow { BusinessRuleException("Communion event not found") }

    /** Staff of the owning congregation, or SUPER_ADMIN (platform administration). */
    private fun requireEventStaff(actorId: String, actorRoles: Collection<String>, congregationId: String) {
        if (actorRoles.contains("SUPER_ADMIN")) return
        tenantGuard.requireStaffOf(actorId, congregationId)
    }

    private fun toResponse(r: CommunionRecord) = CommunionRecordResponse(
        id = r.id, userId = r.userId, serviceDate = r.serviceDate, note = r.note,
        recordedBy = r.recordedBy, recordedAt = r.recordedAt.toString(),
        eventId = r.eventId, verificationMethod = r.verificationMethod.name,
        status = r.status.name, voidReason = r.voidReason
    )
}

/** Stable machine-readable failure reasons for the Communion pipeline (spec STEP 12). */
object CommunionErrorCodes {
    const val INVALID_CREDENTIAL = "INVALID_CREDENTIAL"
    const val TAMPERED_CREDENTIAL = "TAMPERED_CREDENTIAL"
    const val INACTIVE_MEMBER = "INACTIVE_MEMBER"
    const val WRONG_CONGREGATION = "WRONG_CONGREGATION"
    const val PENDING_ELIGIBILITY = "PENDING_ELIGIBILITY"
    const val RESTRICTED_MEMBER = "RESTRICTED_MEMBER"
    const val DUPLICATE_RECORD = "DUPLICATE_RECORD"
    const val EVENT_CLOSED = "EVENT_CLOSED"
    const val REASON_REQUIRED = "REASON_REQUIRED"
    const val UNAUTHORIZED = "UNAUTHORIZED"
}
