package ke.pcea.connect.modules.communion.api.controller

import ke.pcea.connect.modules.communion.api.dto.*
import ke.pcea.connect.modules.communion.application.CommunionService
import ke.pcea.connect.modules.communion.domain.CommunionEligibilityStatus
import ke.pcea.connect.modules.communion.domain.CommunionEvent
import ke.pcea.connect.modules.communion.domain.CommunionRecord
import ke.pcea.connect.modules.communion.domain.CommunionVerificationMethod
import ke.pcea.connect.shared.api.ApiResponse
import ke.pcea.connect.shared.api.BusinessRuleException
import ke.pcea.connect.shared.security.Roles
import org.springframework.http.ResponseEntity
import org.springframework.security.access.prepost.PreAuthorize
import org.springframework.security.core.Authentication
import org.springframework.web.bind.annotation.*

@RestController
@RequestMapping("/api/communion")
class CommunionController(private val service: CommunionService) {

    /** Plain role names from the JWT authorities (ROLE_ prefix stripped). */
    private fun roles(auth: Authentication): Collection<String> =
        auth.authorities.map { it.authority.removePrefix("ROLE_") }

    private fun toResponse(r: CommunionRecord) = CommunionRecordResponse(
        id = r.id, userId = r.userId, serviceDate = r.serviceDate, note = r.note,
        recordedBy = r.recordedBy, recordedAt = r.recordedAt.toString(),
        eventId = r.eventId, verificationMethod = r.verificationMethod.name,
        status = r.status.name, voidReason = r.voidReason
    )

    private fun toEventResponse(e: CommunionEvent, recordedCount: Long = 0) = CommunionEventResponse(
        id = e.id, congregationId = e.congregationId, serviceDate = e.serviceDate,
        serviceStartTime = e.serviceStartTime?.toString(), serviceEndTime = e.serviceEndTime?.toString(),
        location = e.location, status = e.status.name, createdBy = e.createdBy,
        closedAt = e.closedAt?.toString(), createdAt = e.createdAt.toString(),
        recordedCount = recordedCount
    )

    // ── Original routes (preserved exactly — additive response fields only) ─

    /** Record participation — pastoral roles only (PASTOR/MINISTER/ELDER/CLERK/ADMIN). */
    @PreAuthorize(Roles.PASTORAL_SPEL)
    @PostMapping("/records")
    fun record(auth: Authentication, @RequestBody req: CommunionRecordRequest) =
        ResponseEntity.ok(ApiResponse.success(toResponse(
            service.record(auth.name, req.userId, java.time.LocalDate.parse(req.serviceDate), req.note)
        )))

    /** The caller's own communion record — always visible to them, nothing else. */
    @GetMapping("/me")
    fun mine(auth: Authentication) = ResponseEntity.ok(ApiResponse.success(
        service.myRecords(auth.name).map { toResponse(it) }))

    /** Congregation participation list — pastoral roles only, scoped to their own congregation. */
    @PreAuthorize(Roles.PASTORAL_SPEL)
    @GetMapping("/records")
    fun congregationRecords(auth: Authentication) = ResponseEntity.ok(ApiResponse.success(
        service.congregationRecords(auth.name).map { toResponse(it) }))

    // ── Communion events (Communion Tracker) ────────────────────────────────
    // Route note: the existing API surface lives at /api/communion, so the tracker
    // routes stay there too (a /api/v1 split would fork the API for one module).

    @PreAuthorize(Roles.STAFF_OR_CLERK_SPEL)
    @PostMapping("/events")
    fun createEvent(auth: Authentication, @RequestBody req: CommunionEventRequest): ResponseEntity<ApiResponse<CommunionEventResponse>> {
        val event = service.createEvent(
            actorId = auth.name,
            serviceDate = java.time.LocalDate.parse(req.serviceDate),
            startTime = req.startTime?.let { java.time.LocalTime.parse(it) },
            endTime = req.endTime?.let { java.time.LocalTime.parse(it) },
            location = req.location
        )
        return ResponseEntity.ok(ApiResponse.success(toEventResponse(event)))
    }

    @PreAuthorize(Roles.STAFF_OR_CLERK_SPEL)
    @GetMapping("/events")
    fun listEvents(auth: Authentication) = ResponseEntity.ok(ApiResponse.success(
        service.listEvents(auth.name).map { e -> toEventResponse(e, service.eventRecordedCount(e.id)) }))

    @PreAuthorize(Roles.STAFF_OR_CLERK_SPEL)
    @GetMapping("/events/{id}")
    fun getEvent(auth: Authentication, @PathVariable id: String) =
        ResponseEntity.ok(ApiResponse.success(toEventResponse(service.getEvent(auth.name, roles(auth), id), service.eventRecordedCount(id))))

    @PreAuthorize(Roles.STAFF_OR_CLERK_SPEL)
    @PostMapping("/events/{id}/open")
    fun openEvent(auth: Authentication, @PathVariable id: String) =
        ResponseEntity.ok(ApiResponse.success(toEventResponse(service.openEvent(auth.name, roles(auth), id), service.eventRecordedCount(id))))

    @PreAuthorize(Roles.STAFF_OR_CLERK_SPEL)
    @PostMapping("/events/{id}/close")
    fun closeEvent(auth: Authentication, @PathVariable id: String) =
        ResponseEntity.ok(ApiResponse.success(toEventResponse(service.closeEvent(auth.name, roles(auth), id), service.eventRecordedCount(id))))

    @PreAuthorize(Roles.STAFF_OR_CLERK_SPEL)
    @PostMapping("/events/{id}/cancel")
    fun cancelEvent(auth: Authentication, @PathVariable id: String) =
        ResponseEntity.ok(ApiResponse.success(toEventResponse(service.cancelEvent(auth.name, roles(auth), id), service.eventRecordedCount(id))))

    // ── Verification pipeline ───────────────────────────────────────────────

    /**
     * Verify a member's Church ID credential against an OPEN event. READ-ONLY:
     * returns the verification result (identity, eligibility, duplicate state);
     * recording requires the explicit confirm call. A scan never auto-records.
     */
    @PreAuthorize(Roles.STAFF_OR_CLERK_SPEL)
    @PostMapping("/events/{id}/verify")
    fun verify(auth: Authentication, @PathVariable id: String, @RequestBody req: CommunionVerifyRequest): ResponseEntity<ApiResponse<CommunionVerificationResponse>> {
        val method = parseMethod(req.method)
        return ResponseEntity.ok(ApiResponse.success(
            service.verifyForEvent(auth.name, roles(auth), id, method, req.identityToken)))
    }

    /** Explicit record confirmation (steps 13–15). Requires an idempotency key. */
    @PreAuthorize(Roles.STAFF_OR_CLERK_SPEL)
    @PostMapping("/events/{id}/records")
    fun recordConfirmed(auth: Authentication, @PathVariable id: String, @RequestBody req: CommunionRecordConfirmRequest): ResponseEntity<ApiResponse<CommunionRecordResponse>> {
        val method = parseMethod(req.method, allowManual = false)
        return ResponseEntity.ok(ApiResponse.success(
            service.recordVerified(auth.name, roles(auth), id, method, req.identityToken, req.idempotencyKey, req.deviceId, req.note)))
    }

    /** Manual fallback: no credential, reason REQUIRED, every security check still runs. */
    @PreAuthorize(Roles.STAFF_OR_CLERK_SPEL)
    @PostMapping("/events/{id}/records/manual")
    fun recordManual(auth: Authentication, @PathVariable id: String, @RequestBody req: CommunionManualRecordRequest): ResponseEntity<ApiResponse<CommunionRecordResponse>> =
        ResponseEntity.ok(ApiResponse.success(
            service.recordManual(auth.name, roles(auth), id, req.memberId, req.reason, req.idempotencyKey, req.note)))

    /** Soft-void a record (error correction). Never a hard delete. */
    @PreAuthorize(Roles.STAFF_OR_CLERK_SPEL)
    @PostMapping("/records/{recordId}/void")
    fun voidRecord(auth: Authentication, @PathVariable recordId: String, @RequestBody req: CommunionVoidRequest) =
        ResponseEntity.ok(ApiResponse.success(toResponse(service.voidRecord(auth.name, roles(auth), recordId, req.reason))))

    // ── Report ──────────────────────────────────────────────────────────────

    /** Spec §19: event record list (RECORDED + VOIDED — history is never hidden). */
    @PreAuthorize(Roles.STAFF_OR_CLERK_SPEL)
    @GetMapping("/events/{id}/records")
    fun eventRecords(auth: Authentication, @PathVariable id: String): ResponseEntity<ApiResponse<List<CommunionRecordResponse>>> =
        ResponseEntity.ok(ApiResponse.success(service.eventRecords(auth.name, roles(auth), id)))

    @PreAuthorize(Roles.STAFF_OR_CLERK_SPEL)
    @GetMapping("/events/{id}/report")
    fun report(auth: Authentication, @PathVariable id: String) =
        ResponseEntity.ok(ApiResponse.success(service.eventReport(auth.name, roles(auth), id)))

    // ── Eligibility (separate from credential validity) ─────────────────────

    /** Self-view for members; congregation staff may view any of their members. */
    @GetMapping("/eligibility/self")
    fun myEligibility(auth: Authentication): ResponseEntity<ApiResponse<CommunionEligibilityResponse>> {
        val e = service.getEligibility(auth.name, roles(auth), auth.name)
        return ResponseEntity.ok(ApiResponse.success(
            CommunionEligibilityResponse(e.userId, e.status.name, e.reason, e.updatedBy, e.updatedAt.toString())))
    }

    @GetMapping("/eligibility/{memberId}")
    fun getEligibility(auth: Authentication, @PathVariable memberId: String): ResponseEntity<ApiResponse<CommunionEligibilityResponse>> {
        val e = service.getEligibility(auth.name, roles(auth), memberId)
        return ResponseEntity.ok(ApiResponse.success(
            CommunionEligibilityResponse(e.userId, e.status.name, e.reason, e.updatedBy, e.updatedAt.toString())))
    }

    /** Administrative change — audited (COMMUNION_ELIGIBILITY_CHANGED). */
    @PreAuthorize(Roles.STAFF_OR_CLERK_SPEL)
    @PutMapping("/eligibility/{memberId}")
    fun setEligibility(auth: Authentication, @PathVariable memberId: String, @RequestBody req: CommunionEligibilityRequest): ResponseEntity<ApiResponse<CommunionEligibilityResponse>> {
        val status = try {
            CommunionEligibilityStatus.valueOf(req.status.uppercase())
        } catch (_: IllegalArgumentException) {
            throw BusinessRuleException("Unknown eligibility status (use ELIGIBLE, PENDING, RESTRICTED or SUSPENDED)")
        }
        val e = service.setEligibility(auth.name, roles(auth), memberId, status, req.reason)
        return ResponseEntity.ok(ApiResponse.success(
            CommunionEligibilityResponse(e.userId, e.status.name, e.reason, e.updatedBy, e.updatedAt.toString())))
    }

    private fun parseMethod(name: String, allowManual: Boolean = true): CommunionVerificationMethod {
        val m = try {
            CommunionVerificationMethod.valueOf(name.uppercase())
        } catch (_: IllegalArgumentException) {
            throw BusinessRuleException("Unknown verification method (use NFC, QR, MANUAL or MEMBER_APP)")
        }
        if (m == CommunionVerificationMethod.MANUAL && !allowManual)
            throw BusinessRuleException("Use the manual recording endpoint for MANUAL entries")
        return m
    }
}
