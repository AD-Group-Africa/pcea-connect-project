package ke.pcea.connect

import org.junit.jupiter.api.Test
import org.springframework.http.HttpStatus

class AuthAndRbacIntegrationTest : AbstractIntegrationTest() {

    @Test
    fun `register login refresh and protected access`() {
        val user = registerUser()

        // Login again with credentials
        val loginResp = post("/api/auth/login", """{"email":"${user.email}","password":"${user.password}"}""", null)
        assertOk(loginResp)
        val access = loginResp.path("data").path("accessToken").asText()
        val refresh = loginResp.path("data").path("refreshToken").asText()
        check(access.isNotBlank() && refresh.isNotBlank())

        // Refresh rotates the access token
        val refreshResp = post("/api/auth/refresh", """{"refreshToken":"$refresh"}""", null)
        assertOk(refreshResp)
        check(refreshResp.path("data").path("accessToken").asText().isNotBlank())

        // No token => 401/403 on protected endpoints
        val anon = getRaw("/api/ministries")
        check(anon.statusCode == HttpStatus.UNAUTHORIZED || anon.statusCode == HttpStatus.FORBIDDEN) { "Expected 401/403 for anonymous, got ${anon.statusCode}" }

        // Garbage token => rejected
        val bad = getRaw("/api/ministries", "not-a-real-jwt")
        check(bad.statusCode == HttpStatus.UNAUTHORIZED || bad.statusCode == HttpStatus.FORBIDDEN) { "Expected 401/403 for bad token, got ${bad.statusCode}" }

        // Invalid refresh token => rejected
        val badRefresh = postRaw("/api/auth/refresh", """{"refreshToken":"garbage"}""", null)
        check(badRefresh.statusCode == HttpStatus.BAD_REQUEST) { "Expected 400 for bad refresh token, got ${badRefresh.statusCode}" }
    }

    @Test
    fun `super admin can assign roles but member cannot`() {
        val admin = admin()
        val member = registerUser()

        // SUPER_ADMIN can grant ELDER to a member
        val assign = post("/api/admin/users/${member.id}/roles", """{"role":"ELDER"}""", admin.token)
        assertOk(assign)
        check(assign.path("data").path("roles").toString().contains("ELDER"))

        // Ordinary member cannot assign roles
        val denied = postRaw("/api/admin/users/${member.id}/roles", """{"role":"ADMIN"}""", member.token)
        check(denied.statusCode == HttpStatus.FORBIDDEN) { "Expected 403, got ${denied.statusCode}" }
    }

    @Test
    fun `member cannot access analytics or create ministries`() {
        val member = registerUser()

        val analytics = getRaw("/api/analytics/national", member.token)
        check(analytics.statusCode == HttpStatus.FORBIDDEN) { "Expected 403 on analytics, got ${analytics.statusCode}" }

        val createMinistry = postRaw("/api/ministries",
            """{"name":"PCMF","type":"PCMF","description":"x","congregationId":""}""", member.token)
        check(createMinistry.statusCode == HttpStatus.FORBIDDEN) { "Expected 403 on ministry create, got ${createMinistry.statusCode}" }
    }

    @Test
    fun `admin can access analytics`() {
        val admin = admin()
        val analytics = getRaw("/api/analytics/national", admin.token)
        check(analytics.statusCode == HttpStatus.OK) { "Expected 200 for admin, got ${analytics.statusCode}: ${analytics.body}" }
    }
}