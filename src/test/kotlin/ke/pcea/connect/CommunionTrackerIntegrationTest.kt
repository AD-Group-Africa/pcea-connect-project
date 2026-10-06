package ke.pcea.connect

import ke.pcea.connect.modules.communion.domain.CommunionRecordStatus
import ke.pcea.connect.modules.communion.infrastructure.CommunionRecordRepository
import ke.pcea.connect.shared.audit.AuditLogRepository
import org.junit.jupiter.api.Test
import org.junit.jupiter.api.TestInstance
import org.springframework.beans.factory.annotation.Autowired
import org.springframework.http.HttpStatus

/**
 * Communion Tracker integration tests (V057): events, verification pipeline,
 * eligibility, duplicates, idempotency, manual fallback, voiding, audit and RBAC.
 */
@TestInstance(TestInstance.Lifecycle.PER_CLASS)
class CommunionTrackerIntegrationTest : AbstractIntegrationTest() {

    @Autowired
    protected lateinit var auditLogRepo: AuditLogRepository

    @Autowired
    protected lateinit var communionRecordRepo: CommunionRecordRepository

    // ── shared fixtures (built once per class) ──────────────────────────────

    private fun ensureRoles(userId: String, vararg roles: String): String {
        val admin = admin()
        for (r in roles) post("/api/admin/users/$userId/roles", """{"role":"$r"}""", admin.token)
        return login(userRepo.findById(userId).orElseThrow().email, "StrongPass123!")
    }

    private fun createCongregation(name: String): String {
        val admin = admin()
        val region = post("/api/church/regions", """{"name":"$name Region"}""", admin.token)
        assertOk(region)
        val presbytery = post("/api/church/presbyteries",
            """{"name":"$name Presbytery","regionId":"${region.path("data").path("id").asText()}"}""", admin.token)
        assertOk(presbytery)
        val parish = post("/api/church/parishes",
            """{"name":"$name Parish","presbyteryId":"${presbytery.path("data").path("id").asText()}"}""", admin.token)
        assertOk(parish)
        val congregation = post("/api/church/congregations",
            """{"name":"$name","parishId":"${parish.path("data").path("id").asText()}"}""", admin.token)
        assertOk(congregation)
        return congregation.path("data").path("id").asText()
    }

    private fun joinCongregation(user: TestUser, congregationId: String) {
        val join = putRaw("/api/members/me/congregation", """{"congregationId":"$congregationId"}""", user.token)
        check(join.statusCode == HttpStatus.OK) { "join failed: ${join.body}" }
    }

    private fun makeElder(congregationId: String, prefix: String): TestUser {
        val elder = registerUser(emailPrefix = prefix)
        val token = ensureRoles(elder.id, "ELDER")
        joinCongregation(elder.copy(token = token), congregationId)
        return elder.copy(token = token)
    }

    /** Creates + opens a communion event for the congregation and returns its id. */
    private fun openEvent(elder: TestUser, date: String): String {
        val created = post("/api/communion/events",
            """{"serviceDate":"$date","startTime":"10:00:00","location":"Main Sanctuary"}""", elder.token)
        assertOk(created)
        val id = created.path("data").path("id").asText()
        val opened = post("/api/communion/events/$id/open", "{}", elder.token)
        assertOk(opened)
        return id
    }

    private fun credentialOf(user: TestUser): String {
        val card = get("/api/membership-card", user.token)
        val credential = card.path("data").path("credential").asText()
        check(credential.startsWith("MC1.")) { "no credential: $card" }
        return credential
    }

    private fun makeMemberEligible(elder: TestUser, memberId: String) {
        val resp = putRaw("/api/communion/eligibility/$memberId",
            """{"status":"ELIGIBLE","reason":"Confirmed communicant (test)"}""", elder.token)
        check(resp.statusCode == HttpStatus.OK) { "eligibility failed: ${resp.body}" }
    }

    // ── Event lifecycle ─────────────────────────────────────────────────────

    @Test
    fun `event lifecycle - create open close and guards`() {
        admin()
        val cong = createCongregation("CT Lifecycle " + System.nanoTime())
        val elder = makeElder(cong, "elder")

        val created = post("/api/communion/events",
            """{"serviceDate":"2026-10-04","startTime":"10:00:00","endTime":"12:00:00","location":"Sanctuary"}""", elder.token)
        assertOk(created)
        val id = created.path("data").path("id").asText()
        check(created.path("data").path("status").asText() == "DRAFT") { "must start DRAFT: $created" }

        // Recording against a DRAFT event is refused.
        val verifyOnDraft = postRaw("/api/communion/events/$id/verify",
            """{"identityToken":"MC1.x.1.y","method":"QR"}""", elder.token)
        check(verifyOnDraft.statusCode == HttpStatus.BAD_REQUEST) { "expected 400 on DRAFT verify, got ${verifyOnDraft.statusCode}" }

        assertOk(post("/api/communion/events/$id/open", "{}", elder.token))

        // Opening again fails (only DRAFT can be opened).
        val reopen = postRaw("/api/communion/events/$id/open", "{}", elder.token)
        check(reopen.statusCode == HttpStatus.BAD_REQUEST) { "expected 400 on reopen, got ${reopen.statusCode}" }

        assertOk(post("/api/communion/events/$id/close", "{}", elder.token))

        // Recording against a CLOSED event is refused.
        val verifyOnClosed = postRaw("/api/communion/events/$id/verify",
            """{"identityToken":"MC1.x.1.y","method":"QR"}""", elder.token)
        check(verifyOnClosed.statusCode == HttpStatus.BAD_REQUEST) { "expected 400 on CLOSED verify, got ${verifyOnClosed.statusCode}" }

        // A CLOSED event cannot be cancelled.
        val cancelClosed = postRaw("/api/communion/events/$id/cancel", "{}", elder.token)
        check(cancelClosed.statusCode == HttpStatus.BAD_REQUEST) { "expected 400 on cancel CLOSED, got ${cancelClosed.statusCode}" }
    }

    @Test
    fun `event cancellation blocks recording`() {
        admin()
        val cong = createCongregation("CT Cancel " + System.nanoTime())
        val elder = makeElder(cong, "elder")
        val created = post("/api/communion/events", """{"serviceDate":"2026-10-05"}""", elder.token)
        val id = created.path("data").path("id").asText()
        assertOk(post("/api/communion/events/$id/cancel", "{}", elder.token))
        val verify = postRaw("/api/communion/events/$id/verify", """{"identityToken":"MC1.x.1.y","method":"QR"}""", elder.token)
        check(verify.statusCode == HttpStatus.BAD_REQUEST) { "expected 400 on CANCELLED verify, got ${verify.statusCode}" }
    }

    // ── Verification pipeline + recording + duplicates + idempotency ───────

    @Test
    fun `verify pipeline - record - duplicate blocked - idempotent replay`() {
        admin()
        val cong = createCongregation("CT Pipeline " + System.nanoTime())
        val elder = makeElder(cong, "elder")
        val member = registerUser()
        joinCongregation(member, cong)
        makeMemberEligible(elder, member.id)
        val eventId = openEvent(elder, "2026-10-11")
        val credential = credentialOf(member)

        // Verify (read-only): recordable, not duplicate, ELIGIBLE.
        val verify = post("/api/communion/events/$eventId/verify",
            """{"identityToken":"$credential","method":"QR","deviceId":"test-scanner"}""", elder.token)
        assertOk(verify)
        val v = verify.path("data")
        check(v.path("memberId").asText() == member.id) { "resolved wrong member: $verify" }
        check(v.path("recordable").asBoolean()) { "member should be recordable: $verify" }
        check(!v.path("duplicate").asBoolean()) { "first verify is not a duplicate" }
        check(v.path("communionEligibility").asText() == "ELIGIBLE") { "expected ELIGIBLE: $verify" }

        // No record was written by the verify step.
        check(communionRecordRepo.findByEventIdOrderByRecordedAtAsc(eventId).isEmpty()) {
            "verify must never write a record"
        }

        // Explicit confirm records the communion.
        val key = "test-${System.nanoTime()}"
        val confirm = post("/api/communion/events/$eventId/records",
            """{"identityToken":"$credential","method":"QR","idempotencyKey":"$key","deviceId":"test-scanner"}""", elder.token)
        assertOk(confirm)
        val recordId = confirm.path("data").path("id").asText()
        check(confirm.path("data").path("verificationMethod").asText() == "QR") { "method must be QR" }
        check(confirm.path("data").path("status").asText() == "RECORDED") { "status must be RECORDED" }
        check(confirm.path("data").path("eventId").asText() == eventId) { "record must link the event" }

        // Audit: COMMUNION_RECORDED exists for this record.
        val audits = auditLogRepo.findByEntityTypeAndEntityIdOrderByCreatedAtDesc("communion_record", recordId)
        check(audits.any { it.action == "COMMUNION_RECORDED" }) { "missing COMMUNION_RECORDED audit" }

        // Second recording attempt for the same member → duplicate blocked (400 + audit).
        val dup = postRaw("/api/communion/events/$eventId/records",
            """{"identityToken":"$credential","method":"QR","idempotencyKey":"test-dup-${System.nanoTime()}"}""", elder.token)
        check(dup.statusCode == HttpStatus.BAD_REQUEST) { "expected 400 duplicate, got ${dup.statusCode}: ${dup.body}" }
        val dupAudits = auditLogRepo.findByEntityTypeAndEntityIdOrderByCreatedAtDesc("communion_event", eventId)
        check(dupAudits.any { it.action == "COMMUNION_DUPLICATE_BLOCKED" }) { "missing COMMUNION_DUPLICATE_BLOCKED audit" }

        // Verify now reports the duplicate and is not recordable.
        val verify2 = post("/api/communion/events/$eventId/verify",
            """{"identityToken":"$credential","method":"QR"}""", elder.token)
        assertOk(verify2)
        check(verify2.path("data").path("duplicate").asBoolean()) { "verify must flag duplicate" }
        check(!verify2.path("data").path("recordable").asBoolean()) { "duplicate must not be recordable" }

        // Idempotent replay: same key returns the SAME record, no second row.
        val replay = post("/api/communion/events/$eventId/records",
            """{"identityToken":"$credential","method":"QR","idempotencyKey":"$key"}""", elder.token)
        assertOk(replay)
        check(replay.path("data").path("id").asText() == recordId) { "idempotent replay must return the same record" }
        check(communionRecordRepo.findByEventIdOrderByRecordedAtAsc(eventId).size == 1) { "exactly one record must exist" }

        // Event report counts one recorded, one duplicate blocked.
        val report = get("/api/communion/events/$eventId/report", elder.token)
        assertOk(report)
        check(report.path("data").path("recordedTotal").asLong() == 1L) { "report recordedTotal: $report" }
        check(report.path("data").path("duplicatesBlocked").asLong() >= 1L) { "report duplicatesBlocked: $report" }
        check(report.path("data").path("recordedByMethod").path("QR").asLong() == 1L) { "report byMethod: $report" }
    }

    @Test
    fun `invalid and tampered credentials are rejected`() {
        admin()
        val cong = createCongregation("CT Tamper " + System.nanoTime())
        val elder = makeElder(cong, "elder")
        val member = registerUser()
        joinCongregation(member, cong)
        makeMemberEligible(elder, member.id)
        val eventId = openEvent(elder, "2026-10-11")

        // Malformed credential.
        val malformed = postRaw("/api/communion/events/$eventId/verify",
            """{"identityToken":"not-a-credential","method":"QR"}""", elder.token)
        check(malformed.statusCode == HttpStatus.BAD_REQUEST) { "expected 400 malformed, got ${malformed.statusCode}" }

        // Tampered credential: valid structure, broken signature.
        val credential = credentialOf(member)
        val parts = credential.split(".")
        val tamperedSig = if (parts[3].first() == 'A') "B${parts[3].substring(1)}" else "A${parts[3].substring(1)}"
        val tampered = postRaw("/api/communion/events/$eventId/verify",
            """{"identityToken":"${parts[0]}.${parts[1]}.${parts[2]}.$tamperedSig","method":"QR"}""", elder.token)
        check(tampered.statusCode == HttpStatus.BAD_REQUEST) { "expected 400 tampered, got ${tampered.statusCode}" }

        // The rejected attempt is audited.
        val audits = auditLogRepo.findByEntityTypeAndEntityIdOrderByCreatedAtDesc("communion_event", eventId)
        check(audits.any { it.action == "COMMUNION_VERIFICATION_ATTEMPT" && it.detail.contains("REJECTED") }) {
            "missing rejected COMMUNION_VERIFICATION_ATTEMPT audit"
        }
    }

    @Test
    fun `revoked credential fails verification`() {
        admin()
        val cong = createCongregation("CT Revoke " + System.nanoTime())
        val elder = makeElder(cong, "elder")
        val member = registerUser()
        joinCongregation(member, cong)
        makeMemberEligible(elder, member.id)
        val eventId = openEvent(elder, "2026-10-11")
        val credential = credentialOf(member)

        // SUPER_ADMIN revokes the member's credential (disables the account).
        val revoke = postRaw("/api/membership-card/${member.id}/revoke", "{}", admin().token)
        check(revoke.statusCode == HttpStatus.OK) { "revoke failed: ${revoke.body}" }

        // Audit written.
        val audits = auditLogRepo.findByEntityTypeAndEntityIdOrderByCreatedAtDesc("user", member.id)
        check(audits.any { it.action == "IDENTITY_CREDENTIAL_REVOKED" }) { "missing IDENTITY_CREDENTIAL_REVOKED audit" }

        // Verification now fails even though the signature is valid.
        val verify = postRaw("/api/communion/events/$eventId/verify",
            """{"identityToken":"$credential","method":"QR"}""", elder.token)
        check(verify.statusCode == HttpStatus.BAD_REQUEST) { "expected 400 revoked, got ${verify.statusCode}" }
    }

    @Test
    fun `wrong congregation member and cross-congregation elder are rejected`() {
        admin()
        val congA = createCongregation("CT CrossA " + System.nanoTime())
        val congB = createCongregation("CT CrossB " + System.nanoTime())
        val elderA = makeElder(congA, "elder")
        val elderB = makeElder(congB, "elder")
        val memberB = registerUser()
        joinCongregation(memberB, congB)
        makeMemberEligible(elderB, memberB.id)

        val eventIdA = openEvent(elderA, "2026-10-11")
        val credentialB = credentialOf(memberB)

        // Elder A verifies a member of congregation B → 400 (scope violation).
        val verify = postRaw("/api/communion/events/$eventIdA/verify",
            """{"identityToken":"$credentialB","method":"QR"}""", elderA.token)
        check(verify.statusCode == HttpStatus.BAD_REQUEST) { "expected 400 wrong congregation, got ${verify.statusCode}" }

        // Elder B (not staff of congregation A) cannot verify against A's event → 403.
        val cross = postRaw("/api/communion/events/$eventIdA/verify",
            """{"identityToken":"$credentialB","method":"QR"}""", elderB.token)
        check(cross.statusCode == HttpStatus.FORBIDDEN) { "expected 403 cross-congregation elder, got ${cross.statusCode}" }

        // Elder B cannot even list congregation A's events.
        val listB = get("/api/communion/events", elderB.token)
        assertOk(listB)
        check(listB.path("data").none { it.path("id").asText() == eventIdA }) { "cross-congregation event leaked in list" }
    }

    // ── Eligibility ─────────────────────────────────────────────────────────

    @Test
    fun `ineligible member is verified but not recordable - eligibility change is audited`() {
        admin()
        val cong = createCongregation("CT Elig " + System.nanoTime())
        val elder = makeElder(cong, "elder")
        val member = registerUser()  // no eligibility set → defaults to PENDING
        joinCongregation(member, cong)
        val eventId = openEvent(elder, "2026-10-11")
        val credential = credentialOf(member)

        // Verify succeeds (identity + scope fine) but blocking reason = eligibility.
        val verify = post("/api/communion/events/$eventId/verify",
            """{"identityToken":"$credential","method":"QR"}""", elder.token)
        assertOk(verify)
        check(verify.path("data").path("communionEligibility").asText() == "PENDING") { "default PENDING: $verify" }
        check(!verify.path("data").path("recordable").asBoolean()) { "PENDING member must not be recordable" }

        // Recording directly is refused.
        val confirm = postRaw("/api/communion/events/$eventId/records",
            """{"identityToken":"$credential","method":"QR","idempotencyKey":"test-elg-${System.nanoTime()}"}""", elder.token)
        check(confirm.statusCode == HttpStatus.BAD_REQUEST) { "expected 400 ineligible record, got ${confirm.statusCode}" }

        // Elder marks ELIGIBLE (audited) — now recordable.
        makeMemberEligible(elder, member.id)
        // entityId is the eligibility row id, so search by action across the recent audit trail:
        val all = auditLogRepo.findTop50ByOrderByCreatedAtDesc()
        check(all.any { it.action == "COMMUNION_ELIGIBILITY_CHANGED" && it.detail.contains("member=${member.id}") }) {
            "missing COMMUNION_ELIGIBILITY_CHANGED audit"
        }

        val confirm2 = post("/api/communion/events/$eventId/records",
            """{"identityToken":"$credential","method":"QR","idempotencyKey":"test-elg2-${System.nanoTime()}"}""", elder.token)
        assertOk(confirm2)
    }

    @Test
    fun `suspended member cannot be recorded - self eligibility visible`() {
        admin()
        val cong = createCongregation("CT Susp " + System.nanoTime())
        val elder = makeElder(cong, "elder")
        val member = registerUser()
        joinCongregation(member, cong)
        makeMemberEligible(elder, member.id)
        val suspend = putRaw("/api/communion/eligibility/${member.id}",
            """{"status":"SUSPENDED","reason":"Discipline case (test)"}""", elder.token)
        check(suspend.statusCode == HttpStatus.OK) { "suspend failed: ${suspend.body}" }

        // Member sees their own eligibility.
        val self = get("/api/communion/eligibility/self", member.token)
        assertOk(self)
        check(self.path("data").path("status").asText() == "SUSPENDED") { "self eligibility: $self" }

        val eventId = openEvent(elder, "2026-10-11")
        val credential = credentialOf(member)
        val verify = post("/api/communion/events/$eventId/verify",
            """{"identityToken":"$credential","method":"QR"}""", elder.token)
        assertOk(verify)
        check(!verify.path("data").path("recordable").asBoolean()) { "SUSPENDED must not be recordable" }
    }

    // ── Manual fallback ─────────────────────────────────────────────────────

    @Test
    fun `manual recording requires reason and passes all checks`() {
        admin()
        val cong = createCongregation("CT Manual " + System.nanoTime())
        val elder = makeElder(cong, "elder")
        val member = registerUser()
        joinCongregation(member, cong)
        makeMemberEligible(elder, member.id)
        val eventId = openEvent(elder, "2026-10-11")

        // Missing reason → 400.
        val noReason = postRaw("/api/communion/events/$eventId/records/manual",
            """{"memberId":"${member.id}","reason":"","idempotencyKey":"test-man1-${System.nanoTime()}"}""", elder.token)
        check(noReason.statusCode == HttpStatus.BAD_REQUEST) { "expected 400 no reason, got ${noReason.statusCode}" }

        // MANUAL method is refused on the credential pipeline.
        val manualOnPipeline = postRaw("/api/communion/events/$eventId/records",
            """{"identityToken":"","method":"MANUAL","idempotencyKey":"test-man2-${System.nanoTime()}"}""", elder.token)
        check(manualOnPipeline.statusCode == HttpStatus.BAD_REQUEST) { "expected 400 MANUAL on pipeline, got ${manualOnPipeline.statusCode}" }

        // Valid manual record.
        val key = "test-man3-${System.nanoTime()}"
        val manual = post("/api/communion/events/$eventId/records/manual",
            """{"memberId":"${member.id}","reason":"Card damaged — identity confirmed from the roll","idempotencyKey":"$key"}""", elder.token)
        assertOk(manual)
        check(manual.path("data").path("verificationMethod").asText() == "MANUAL") { "manual method: $manual" }

        // Duplicate manual record for the same member → 400.
        val dup = postRaw("/api/communion/events/$eventId/records/manual",
            """{"memberId":"${member.id}","reason":"again","idempotencyKey":"test-man4-${System.nanoTime()}"}""", elder.token)
        check(dup.statusCode == HttpStatus.BAD_REQUEST) { "expected 400 manual duplicate, got ${dup.statusCode}" }

        // Manual is idempotent too.
        val replay = post("/api/communion/events/$eventId/records/manual",
            """{"memberId":"${member.id}","reason":"Card damaged — identity confirmed from the roll","idempotencyKey":"$key"}""", elder.token)
        assertOk(replay)
        check(replay.path("data").path("id").asText() == manual.path("data").path("id").asText()) { "manual replay idempotent" }
    }

    // ── Voiding ─────────────────────────────────────────────────────────────

    @Test
    fun `void record keeps history and frees the slot - reason required - audited`() {
        admin()
        val cong = createCongregation("CT Void " + System.nanoTime())
        val elder = makeElder(cong, "elder")
        val member = registerUser()
        joinCongregation(member, cong)
        makeMemberEligible(elder, member.id)
        val eventId = openEvent(elder, "2026-10-11")
        val credential = credentialOf(member)

        val confirm = post("/api/communion/events/$eventId/records",
            """{"identityToken":"$credential","method":"QR","idempotencyKey":"test-void-${System.nanoTime()}"}""", elder.token)
        assertOk(confirm)
        val recordId = confirm.path("data").path("id").asText()

        // Missing reason → 400.
        val noReason = postRaw("/api/communion/records/$recordId/void", """{"reason":""}""", elder.token)
        check(noReason.statusCode == HttpStatus.BAD_REQUEST) { "expected 400 void no reason, got ${noReason.statusCode}" }

        // Void with reason.
        val voided = post("/api/communion/records/$recordId/void",
            """{"reason":"Wrong member scanned (test)"}""", elder.token)
        assertOk(voided)
        check(voided.path("data").path("status").asText() == "VOIDED") { "status VOIDED: $voided" }
        check(voided.path("data").path("voidReason").asText().isNotBlank()) { "void reason kept" }

        val audits = auditLogRepo.findByEntityTypeAndEntityIdOrderByCreatedAtDesc("communion_record", recordId)
        check(audits.any { it.action == "COMMUNION_VOIDED" }) { "missing COMMUNION_VOIDED audit" }

        // The member can be recorded again (slot freed by the partial unique index).
        val reConfirm = post("/api/communion/events/$eventId/records",
            """{"identityToken":"$credential","method":"QR","idempotencyKey":"test-void2-${System.nanoTime()}"}""", elder.token)
        assertOk(reConfirm)

        // History keeps BOTH rows (no hard delete): one VOIDED, one RECORDED.
        val rows = communionRecordRepo.findByEventIdOrderByRecordedAtAsc(eventId)
        check(rows.size == 2) { "expected 2 rows (voided + re-recorded), got ${rows.size}" }
        check(rows.any { it.status == CommunionRecordStatus.VOIDED }) { "voided row must remain" }
    }

    // ── Role boundaries ─────────────────────────────────────────────────────

    @Test
    fun `member cannot use staff endpoints - member sees own records`() {
        admin()
        val cong = createCongregation("CT RBAC " + System.nanoTime())
        val elder = makeElder(cong, "elder")
        val member = registerUser()
        joinCongregation(member, cong)
        makeMemberEligible(elder, member.id)
        val eventId = openEvent(elder, "2026-10-11")
        val credential = credentialOf(member)

        // Member cannot verify / record / list events / create events / set eligibility.
        val endpoints = listOf(
            "/api/communion/events/$eventId/verify" to """{"identityToken":"$credential","method":"QR"}""",
            "/api/communion/events/$eventId/records" to """{"identityToken":"$credential","method":"QR","idempotencyKey":"test-rbac-${System.nanoTime()}"}""",
        )
        for ((path, body) in endpoints) {
            val resp = postRaw(path, body, member.token)
            check(resp.statusCode == HttpStatus.FORBIDDEN) { "expected 403 member at $path, got ${resp.statusCode}" }
        }
        val list = getRaw("/api/communion/events", member.token)
        check(list.statusCode == HttpStatus.FORBIDDEN) { "expected 403 member event list, got ${list.statusCode}" }
        val create = postRaw("/api/communion/events", """{"serviceDate":"2026-10-11"}""", member.token)
        check(create.statusCode == HttpStatus.FORBIDDEN) { "expected 403 member event create, got ${create.statusCode}" }
        val elig = putRaw("/api/communion/eligibility/${member.id}", """{"status":"ELIGIBLE","reason":"self"}""", member.token)
        check(elig.statusCode == HttpStatus.FORBIDDEN) { "expected 403 member self-eligibility-set, got ${elig.statusCode}" }

        // Elder records manually; member then sees their own record via /me.
        post("/api/communion/events/$eventId/records/manual",
            """{"memberId":"${member.id}","reason":"Roll confirmation","idempotencyKey":"test-rbac2-${System.nanoTime()}"}""", elder.token)
        val mine = get("/api/communion/me", member.token)
        assertOk(mine)
        val mineActive = mine.path("data").filter { it.path("status").asText() == "RECORDED" && it.path("eventId").asText() == eventId }
        check(mineActive.size == 1) { "member should see exactly their own tracker record: $mine" }
    }
}
