package ke.pcea.connect

import org.junit.jupiter.api.Test
import org.springframework.http.HttpStatus

class GivingAuthorizationTest : AbstractIntegrationTest() {

    @Test
    fun `member can only see own giving records`() {
        val memberA = registerUser()
        val memberB = registerUser()

        // A gives (cash so no M-Pesa STK call is attempted)
        val give = post("/api/giving/contribute",
            """{"type":"TITHE","amount":1000,"method":"CASH","phoneNumber":"","description":"test","congregationId":""}""",
            memberA.token)
        assertOk(give)
        val contributionId = give.path("data").path("id").asText()
        check(contributionId.isNotBlank()) { "Contribution id missing: $give" }

        // A sees own contributions
        val own = get("/api/giving/contributions/${memberA.id}", memberA.token)
        assertOk(own)
        check(own.path("data").size() == 1) { "Expected 1 contribution, got ${own.path("data").size()}" }

        // B cannot see A's contributions
        val cross = getRaw("/api/giving/contributions/${memberA.id}", memberB.token)
        check(cross.statusCode == HttpStatus.BAD_REQUEST || cross.statusCode == HttpStatus.FORBIDDEN) {
            "Expected denial, got ${cross.statusCode}: ${cross.body}"
        }

        // B cannot confirm A's payment
        val confirm = postRaw("/api/giving/confirm-payment", """{"contributionId":"$contributionId","mpesaCode":"FAKE"}""", memberB.token)
        check(confirm.statusCode == HttpStatus.FORBIDDEN) { "Expected 403, got ${confirm.statusCode}" }

        // A cannot confirm payments either (finance-only)
        val confirmA = postRaw("/api/giving/confirm-payment", """{"contributionId":"$contributionId","mpesaCode":"FAKE"}""", memberA.token)
        check(confirmA.statusCode == HttpStatus.FORBIDDEN) { "Expected 403 for member confirm, got ${confirmA.statusCode}" }
    }

    @Test
    fun `finance role can confirm cash contributions and see congregation totals`() {
        val admin = admin()   // SUPER_ADMIN (finance-capable)
        val member = registerUser()

        val give = post("/api/giving/contribute",
            """{"type":"OFFERING","amount":500,"method":"CASH","phoneNumber":"","description":"offering","congregationId":""}""",
            member.token)
        assertOk(give)
        val contributionId = give.path("data").path("id").asText()
        check(contributionId.isNotBlank()) { "Contribution id missing: $give" }

        val confirm = post("/api/giving/confirm-payment", """{"contributionId":"$contributionId","mpesaCode":"CASH-001"}""", admin.token)
        assertOk(confirm)
        check(confirm.path("data").path("status").asText() == "COMPLETED")

        // Statement reflects the confirmed amount
        val statement = get("/api/giving/statement/${member.id}", admin.token)
        assertOk(statement)
        check(statement.path("data").path("totalAmount").asInt() == 500) { "Expected 500, got ${statement.path("data")}" }
    }

    @Test
    fun `mpesa callback is secret-gated and idempotent`() {
        val member = registerUser()

        // Record an M-Pesa contribution (PENDING)
        val give = post("/api/giving/contribute",
            """{"type":"TITHE","amount":2000,"method":"MPESA","phoneNumber":"254712345678","description":"tithe","congregationId":""}""",
            member.token)
        assertOk(give)
        val id = give.path("data").path("id").asText()

        // Wrong secret path => 404, status stays PENDING
        val wrong = postRaw("/api/giving/mpesa-callback/wrong-secret",
            """{"Body":{"stkCallback":{"ResultCode":0,"CheckoutRequestID":"$id"}}}""", null)
        check(wrong.statusCode == HttpStatus.NOT_FOUND) { "Expected 404 for wrong secret, got ${wrong.statusCode}" }

        // Correct secret + success result => COMPLETED
        val good = postRaw("/api/giving/mpesa-callback/unit-test-callback-secret",
            """{"Body":{"stkCallback":{"ResultCode":0,"CheckoutRequestID":"$id"}}}""", null)
        check(good.statusCode == HttpStatus.OK) { "Expected 200, got ${good.statusCode}: ${good.body}" }

        val after = get("/api/giving/contributions/${member.id}", member.token)
        check(after.path("data").get(0).path("status").asText() == "COMPLETED")

        // Duplicate callback => still COMPLETED, statement not double-counted
        val dup = postRaw("/api/giving/mpesa-callback/unit-test-callback-secret",
            """{"Body":{"stkCallback":{"ResultCode":0,"CheckoutRequestID":"$id"}}}""", null)
        check(dup.statusCode == HttpStatus.OK)

        val statement = get("/api/giving/statement/${member.id}", member.token)
        check(statement.path("data").path("totalAmount").asInt() == 2000) { "Statement double-counted: ${statement.path("data")}" }
    }
}