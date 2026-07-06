package ke.pcea.connect.modules.giving.api.controller

import com.fasterxml.jackson.databind.ObjectMapper
import ke.pcea.connect.modules.giving.domain.*
import ke.pcea.connect.modules.giving.infrastructure.*
import ke.pcea.connect.shared.api.ApiResponse
import org.springframework.http.ResponseEntity
import org.springframework.web.bind.annotation.*
import org.springframework.transaction.annotation.Transactional

@RestController
@RequestMapping("/api/giving")
class MpesaCallbackController(
    private val contributionRepo: ContributionRepository,
    private val statementRepo: ContributionStatementRepository,
    private val objectMapper: ObjectMapper
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

    @PostMapping("/mpesa-callback")
    @Transactional
    fun handleCallback(@RequestBody rawBody: String): ResponseEntity<ApiResponse<String>> {
        val json = objectMapper.readTree(rawBody)
        val resultCode = json.at("/Body/stkCallback/ResultCode").asInt(1)
        val checkoutRequestId = json.at("/Body/stkCallback/CheckoutRequestID").asText("")

        if (resultCode == 0) {
            // Payment successful – find the contribution by checkout request ID
            val contribution = contributionRepo.findAll()
                .firstOrNull { it.transactionRef == checkoutRequestId }
            if (contribution != null) {
                contribution.status = PaymentStatus.COMPLETED
                contributionRepo.save(contribution)
                // Update statement
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
