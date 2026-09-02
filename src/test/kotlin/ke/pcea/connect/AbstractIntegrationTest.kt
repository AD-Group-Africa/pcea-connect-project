package ke.pcea.connect

import com.fasterxml.jackson.databind.JsonNode
import com.fasterxml.jackson.databind.ObjectMapper
import org.springframework.beans.factory.annotation.Autowired
import org.springframework.boot.test.context.SpringBootTest
import org.springframework.boot.test.web.client.TestRestTemplate
import org.springframework.boot.test.web.server.LocalServerPort
import org.springframework.http.*
import org.springframework.test.context.ActiveProfiles
import ke.pcea.connect.modules.identity.infrastructure.UserRepository
import java.util.concurrent.atomic.AtomicInteger

/**
 * Base class for integration tests.
 *
 * The Spring context (and its in-memory H2 database) is shared across test methods and
 * classes, and JUnit 5 creates a NEW instance per test method — so email counters must be
 * static or registrations collide. The FIRST user registered in the whole JVM automatically
 * becomes SUPER_ADMIN (see AuthService); [admin] lazily bootstraps that single admin so tests
 * never depend on execution order.
 */
@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
@ActiveProfiles("test")
abstract class AbstractIntegrationTest {

    @LocalServerPort
    protected var port: Int = 0

    @Autowired
    protected lateinit var rest: TestRestTemplate

    @Autowired
    protected lateinit var mapper: ObjectMapper

    @Autowired
    protected lateinit var userRepo: UserRepository

    protected fun base() = "http://localhost:$port"

    protected data class TestUser(val id: String, val email: String, val password: String, val token: String)

    private companion object {
        val counter = AtomicInteger(0)
        @Volatile
        var adminUser: TestUser? = null
    }

    /**
     * The single JVM-wide SUPER_ADMIN. Rather than relying on registration order (the first
     * user registered becomes SUPER_ADMIN), this explicitly ensures the admin user has the
     * SUPER_ADMIN role regardless of how many users were registered before it.
     */
    protected fun admin(): TestUser {
        adminUser?.let { return it }
        synchronized(this) {
            adminUser?.let { return it }
            val u = registerUser(emailPrefix = "admin")
            // Ensure SUPER_ADMIN role regardless of registration order
            val user = userRepo.findById(u.id).orElseThrow()
            if (!user.roles.contains("SUPER_ADMIN")) {
                user.roles.add("SUPER_ADMIN")
                user.roles.add("ADMIN")
                userRepo.save(user)
            }
            // Re-login to get a fresh token with the updated roles
            val newToken = login(u.email, u.password)
            val updated = u.copy(token = newToken)
            adminUser = updated
            return updated
        }
    }

    protected fun registerUser(password: String = "StrongPass123!", emailPrefix: String = "user"): TestUser {
        val n = counter.incrementAndGet()
        val email = "$emailPrefix$n@test.pcea"
        val body = """{"email":"$email","password":"$password","fullName":"Test User $n","phone":"0712345678"}"""
        val resp = post("/api/auth/register", body, null)
        val id = resp.path("data").path("id").asText()
        check(id.isNotBlank()) { "Registration failed: $resp" }
        val token = login(email, password)
        return TestUser(id, email, password, token)
    }

    protected fun login(email: String, password: String): String {
        val resp = post("/api/auth/login", """{"email":"$email","password":"$password"}""", null)
        val token = resp.path("data").path("accessToken").asText()
        check(token.isNotBlank()) { "Login failed: $resp" }
        return token
    }

    protected fun get(path: String, token: String? = null): JsonNode {
        val headers = headers(token)
        val resp = rest.exchange("${base()}$path", HttpMethod.GET, HttpEntity<String>(headers), String::class.java)
        return mapper.readTree(resp.body ?: "{}")
    }

    protected fun getRaw(path: String, token: String? = null): ResponseEntity<String> {
        val headers = headers(token)
        return rest.exchange("${base()}$path", HttpMethod.GET, HttpEntity<String>(headers), String::class.java)
    }

    protected fun post(path: String, body: String, token: String?): JsonNode {
        return postRaw(path, body, token).let { mapper.readTree(it.body ?: "{}") }
    }

    protected fun postRaw(path: String, body: String, token: String?): ResponseEntity<String> {
        val headers = headers(token)
        headers.contentType = MediaType.APPLICATION_JSON
        return rest.exchange("${base()}$path", HttpMethod.POST, HttpEntity(body, headers), String::class.java)
    }

    protected fun putRaw(path: String, body: String, token: String?): ResponseEntity<String> {
        val headers = headers(token)
        headers.contentType = MediaType.APPLICATION_JSON
        return rest.exchange("${base()}$path", HttpMethod.PUT, HttpEntity(body, headers), String::class.java)
    }

    protected fun delete(path: String, token: String?): ResponseEntity<String> {
        val headers = headers(token)
        return rest.exchange("${base()}$path", HttpMethod.DELETE, HttpEntity<String>(headers), String::class.java)
    }

    private fun headers(token: String?): HttpHeaders {
        val headers = HttpHeaders()
        if (token != null) headers.setBearerAuth(token)
        return headers
    }

    protected fun assertOk(body: JsonNode) = check(body.path("success").asBoolean()) { "Expected success, got: $body" }
    protected fun assertForbidden(resp: ResponseEntity<String>) =
        check(resp.statusCode == HttpStatus.FORBIDDEN) { "Expected 403, got ${resp.statusCode}: ${resp.body}" }
}