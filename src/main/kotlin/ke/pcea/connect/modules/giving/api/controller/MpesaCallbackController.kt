package ke.pcea.connect.modules.giving.api.controller

import com.fasterxml.jackson.databind.ObjectMapper
import ke.pcea.connect.modules.giving.domain.*
import ke.pcea.connect.modules.giving.infrastructure.*
import ke.pcea.connect.shared.api.ApiResponse
import org.springframework.beans.factory.annotation.Value
import org.springframework.http.HttpStatus
import org.springframework.http.ResponseEntity
import org.springframework.web.bind.annotation.*
import org.springframework.transaction.annotation.Transactional

@RestController
@RequestMapping("/api/giving")
class MpesaCallbackController(
    private val contributionRepo: ContributionRepository,
    private val statementRepo: ContributionStatementRepository,
    private val objectMapper: ObjectMapper,
    @Value("\${mpesa.callback-secret}") private val expectedSecret: String
) {
    data class StkCallbackBody(
        val Body: Body?,
        val stkCallback: StkCallback?
    )
    data class Body(val stkCallback: StkCallback?)
    data class StkCallback(
        val MerchantRequestID: String?,
        val CheckoutRequestID: String?,
        val ResultCode: Int?,
        val ResultDesc: String?,
        val CallbackMetadata: CallbackMetadata?
    )
    data class CallbackMetadata(val Item: List<Item>?)
    data class Item(val Name: String?, val Value: Any?)

    /**
     * M-Pesa STK push callback webhook.
     *
     * SECURITY MODEL: This is the one route permitted without a JWT (Safaricom's servers
     * cannot authenticate to us). Authentication here is a shared-secret path segment — NOT
     * cryptographic proof of Safaricom origin. Anyone with the secret can POST a callback,
     * so the secret must be tightly controlled. Defense-in-depth: the path pattern in
     * SecurityConfig only permits the mpesa-callback path pattern, and the controller rejects
     * any request whose secret path segment does not match the configured value.
     *
     * IDEMPOTENCY: Safaricom retries callbacks. The guard `contribution.status !=
     * PaymentStatus.COMPLETED` ensures a retried callback cannot double-count in the
     * statement.
     */
    @PostMapping("/mpesa-callback/{secret}")
    @Transactional
    fun handleCallback(@PathVariable secret: String, @RequestBody rawBody: String): ResponseEntity<ApiResponse<*>> {
        if (secret != expectedSecret) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                .body(ApiResponse.error("Not found"))
        }

        val json = objectMapper.readTree(rawBody)
        val resultCode = json.at("/Body/stkCallback/ResultCode").asInt(1)
        val checkoutRequestId = json.at("/Body/stkCallback/CheckoutRequestID").asText("")

        if (resultCode == 0 && checkoutRequestId.isNotBlank()) {
            // Look up by the M-Pesa CheckoutRequestID (stored as transactionRef during STK push).
            // Fall back to direct ID lookup for test/sandbox flows where STK push was simulated.
            val contribution = contributionRepo.findAll()
                .firstOrNull { it.transactionRef == checkoutRequestId }
                ?: contributionRepo.findById(checkoutRequestId).orElse(null)
            // Idempotency: only transition PENDING → COMPLETED. A duplicate callback for an
            // already-completed contribution is a safe no-op.
            if (contribution != null && contribution.status != PaymentStatus.COMPLETED) {
                contribution.status = PaymentStatus.COMPLETED
                contributionRepo.save(contribution)

                val year = java.time.LocalDateTime.now().year
                val statement = statementRepo.findByUserIdAndStatementYear(contribution.userId, year)
                    ?: ContributionStatement(userId = contribution.userId, statementYear = year)
                statement.totalAmount = contributionRepo.findByUserId(contribution.userId)
                    .filter { it.status == PaymentStatus.COMPLETED && it.createdAt.year == year }
                    .fold(java.math.BigDecimal.ZERO) { acc, c -> acc.add(c.amount) }
                statementRepo.save(statement)
            }
        }
        return ResponseEntity.ok(ApiResponse.success("Callback processed"))
    }
}
