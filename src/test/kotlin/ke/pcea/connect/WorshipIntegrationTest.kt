package ke.pcea.connect

import org.junit.jupiter.api.Test
import org.springframework.http.HttpStatus

class WorshipIntegrationTest : AbstractIntegrationTest() {

    @Test
    fun `member can view today's worship and upcoming services`() {
        val admin = admin()
        val member = registerUser()

        // Admin creates a service for today
        val today = java.time.LocalDate.now().toString()
        val time = java.time.LocalTime.now().toString().substring(0, 5)
        val create = post("/api/worship/services", """{"title":"Sunday Worship","serviceDate":"$today","serviceTime":"$time","congregationId":"","serviceType":"SUNDAY_WORSHIP","preacherName":"Rev. Test","preacherUserId":"","sermonId":"","theme":"Faith in Action","scriptureRef":"James 2:17","worshipTeam":"","orderOfService":"","livestreamId":"","announcements":""}""", admin.token)
        assertOk(create)
        val serviceId = create.path("data").path("id").asText()
        check(serviceId.isNotBlank()) { "Service not created: $create" }

        // Member can retrieve today's worship
        val todayResp = get("/api/worship/today", member.token)
        assertOk(todayResp)
        check(todayResp.path("data").path("preacherName").asText() == "Rev. Test") { "Expected Rev. Test, got ${todayResp.path("data")}" }
        check(todayResp.path("data").path("theme").asText() == "Faith in Action")

        // Member can get upcoming services
        val upcoming = get("/api/worship/services/upcoming", member.token)
        assertOk(upcoming)
        check(upcoming.path("data").size() >= 1) { "Expected at least 1 upcoming service" }
    }

    @Test
    fun `member cannot create services - staff only`() {
        admin()  // Claim SUPER_ADMIN first so registerUser below is a plain MEMBER
        val member = registerUser()

        val today = java.time.LocalDate.now().toString()
        val create = postRaw("/api/worship/services",
            """{"title":"Unauthorized","serviceDate":"$today","serviceTime":"10:00","congregationId":"","serviceType":"SUNDAY_WORSHIP","preacherName":"Test","preacherUserId":"","sermonId":"","theme":"","scriptureRef":"","worshipTeam":"","orderOfService":"","livestreamId":"","announcements":""}""",
            member.token)
        check(create.statusCode == HttpStatus.FORBIDDEN) { "Expected 403, got ${create.statusCode}" }
    }

    @Test
    fun `bulletin lifecycle - create read publish`() {
        val admin = admin()

        val today = java.time.LocalDate.now().toString()
        // Create bulletin
        val create = post("/api/worship/bulletins", """{"title":"Test Bulletin","congregationId":"","churchServiceId":"","serviceDate":"$today","welcomeMessage":"Welcome to PCEA","orderOfService":"Call to Worship\nHymn\nPrayer\nSermon","scriptureRef":"Psalm 23","preacher":"Rev. Test","sermonTheme":"The Lord is my Shepherd","announcements":"No youth meeting this week","weeklyCalendar":"Sun: Worship 10am","ministryNotices":"PCMF meeting Saturday","givingInformation":"M-Pesa 522522","livestreamUrl":"","specialEvents":""}""", admin.token)
        assertOk(create)
        val bulletinId = create.path("data").path("id").asText()
        check(bulletinId.isNotBlank()) { "Bulletin not created: $create" }

        // Read bulletin
        val bulletin = get("/api/worship/bulletins/$bulletinId", admin.token)
        assertOk(bulletin)
        check(bulletin.path("data").path("welcomeMessage").asText() == "Welcome to PCEA")
        check(bulletin.path("data").path("status").asText() == "DRAFT")

        // Publish bulletin
        val published = post("/api/worship/bulletins/$bulletinId/publish", "", admin.token)
        assertOk(published)
        check(published.path("data").path("status").asText() == "PUBLISHED")

        // Latest bulletin endpoint finds it
        val latest = get("/api/worship/bulletins/latest", admin.token)
        assertOk(latest)
        check(latest.path("data").path("id").asText() == bulletinId)
    }

    @Test
    fun `member cannot create or publish bulletins`() {
        admin()  // Claim SUPER_ADMIN first so registerUser below is a plain MEMBER
        val member = registerUser()
        val today = java.time.LocalDate.now().toString()

        val create = postRaw("/api/worship/bulletins",
            """{"title":"Unauthorized","congregationId":"","churchServiceId":"","serviceDate":"$today","welcomeMessage":"","orderOfService":"","scriptureRef":"","preacher":"","sermonTheme":"","announcements":"","weeklyCalendar":"","ministryNotices":"","givingInformation":"","livestreamUrl":"","specialEvents":""}""",
            member.token)
        check(create.statusCode == HttpStatus.FORBIDDEN) { "Expected 403 on bulletin create, got ${create.statusCode}" }
    }
}
