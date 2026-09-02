package ke.pcea.connect

import org.junit.jupiter.api.Test
import org.springframework.http.HttpStatus

/**
 * Integration tests for the scoped Ministry authorization service.
 *
 * Verifies that the shared Ministry architecture enforces:
 *  - member can view ministry data
 *  - member cannot mutate ministry content without leadership role
 *  - leader/staff can create announcements
 *  - announcements remain scoped to the correct ministry
 *
 * Uses explicit role setup (admin() helper) to avoid first-user SUPER_ADMIN issues.
 */
class MinistryScopedAuthorizationTest : AbstractIntegrationTest() {

    @Test
    fun `member can view ministry data`() {
        admin()  // Claim SUPER_ADMIN first
        val member = registerUser()

        // Any authenticated user can list ministries
        val ministries = get("/api/ministries", member.token)
        assertOk(ministries)
    }

    @Test
    fun `member cannot create announcements - scoped authorization`() {
        val admin = admin()
        val member = registerUser()

        // Admin creates a ministry
        val ministry = post("/api/ministries",
            """{"name":"Test PCMF","type":"PCMF","description":"test","congregationId":""}""", admin.token)
        assertOk(ministry)
        val ministryId = ministry.path("data").path("id").asText()
        check(ministryId.isNotBlank())

        // Ordinary member (not a leader of this ministry, not a staff role) should be denied
        // creating an announcement. The @PreAuthorize(STAFF_SPEL) gate catches this first.
        val create = postRaw("/api/ministries/$ministryId/announcements",
            """{"title":"Unauthorized","content":"should fail"}""", member.token)
        check(create.statusCode == HttpStatus.FORBIDDEN) {
            "Expected 403 for member creating announcement, got ${create.statusCode}: ${create.body}"
        }
    }

    @Test
    fun `admin can create announcement and it is scoped to correct ministry`() {
        val admin = admin()

        // Create two ministries
        val m1 = post("/api/ministries",
            """{"name":"PCMF","type":"PCMF","description":"test","congregationId":""}""", admin.token)
        val m2 = post("/api/ministries",
            """{"name":"Youth","type":"YOUTH_FELLOWSHIP","description":"test","congregationId":""}""", admin.token)
        val m1Id = m1.path("data").path("id").asText()
        val m2Id = m2.path("data").path("id").asText()

        // Create announcement in m1
        val ann = post("/api/ministries/$m1Id/announcements",
            """{"title":"PCMF Meeting","content":"Saturday 3pm"}""", admin.token)
        assertOk(ann)
        check(ann.path("data").path("ministryId").asText() == m1Id) {
            "Announcement should be scoped to ministry $m1Id"
        }

        // m1 should have 1 announcement
        val m1Anns = get("/api/ministries/$m1Id/announcements", admin.token)
        assertOk(m1Anns)
        check(m1Anns.path("data").size() == 1) { "Expected 1 announcement in m1" }

        // m2 should have 0 announcements
        val m2Anns = get("/api/ministries/$m2Id/announcements", admin.token)
        assertOk(m2Anns)
        check(m2Anns.path("data").size() == 0) { "Expected 0 announcements in m2" }
    }

    @Test
    fun `my ministries endpoint returns only joined ministries`() {
        val admin = admin()
        val member = registerUser()

        // Create a ministry
        val ministry = post("/api/ministries",
            """{"name":"Test Ministry","type":"OTHER","description":"test","congregationId":""}""", admin.token)
        val ministryId = ministry.path("data").path("id").asText()

        // Member has no ministries yet
        val beforeJoin = get("/api/ministries/me", member.token)
        assertOk(beforeJoin)
        check(beforeJoin.path("data").size() == 0) { "Expected 0 my ministries before joining" }

        // Admin adds member to the ministry
        val addMember = post("/api/ministries/$ministryId/members",
            """{"userId":"${member.id}","role":"MEMBER"}""", admin.token)
        assertOk(addMember)

        // Now member should see it in my ministries
        val afterJoin = get("/api/ministries/me", member.token)
        assertOk(afterJoin)
        check(afterJoin.path("data").size() == 1) { "Expected 1 my ministry after joining" }
        check(afterJoin.path("data").path(0).path("id").asText() == ministryId)
    }
}
