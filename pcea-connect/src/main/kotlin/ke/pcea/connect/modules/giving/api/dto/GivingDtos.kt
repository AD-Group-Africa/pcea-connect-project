package ke.pcea.connect.modules.giving.api.dto
import ke.pcea.connect.modules.giving.domain.ContributionType
import ke.pcea.connect.modules.giving.domain.PaymentMethod

data class ContributionRequest(
    val userId: String, val type: ContributionType = ContributionType.OFFERING,
    val amount: java.math.BigDecimal, val method: PaymentMethod = PaymentMethod.MPESA,
    val phoneNumber: String = "", val description: String = "", val congregationId: String = ""
)
data class PaymentConfirmationRequest(val contributionId: String, val mpesaCode: String)
data class ContributionResponse(
    val id: String, val userId: String, val type: String, val amount: java.math.BigDecimal,
    val method: String, val status: String, val transactionRef: String, val createdAt: String
)
data class StatementResponse(
    val userId: String, val statementYear: Int, val totalAmount: java.math.BigDecimal,
    val titheAmount: java.math.BigDecimal, val offeringAmount: java.math.BigDecimal,
    val donationAmount: java.math.BigDecimal
)
