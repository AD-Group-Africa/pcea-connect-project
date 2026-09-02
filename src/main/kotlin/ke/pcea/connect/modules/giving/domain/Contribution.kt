package ke.pcea.connect.modules.giving.domain
import jakarta.persistence.*
import java.math.BigDecimal
import java.time.LocalDateTime

enum class ContributionType { TITHE, OFFERING, DONATION, PROJECT, PLEDGE }
enum class PaymentMethod { MPESA, CASH, BANK_TRANSFER }
enum class PaymentStatus { PENDING, COMPLETED, FAILED }

@Entity @Table(name = "contributions")
data class Contribution(
    @Id @GeneratedValue(strategy = GenerationType.UUID) val id: String = "",
    val userId: String = "",
    @Enumerated(EnumType.STRING) val type: ContributionType = ContributionType.OFFERING,
    val amount: BigDecimal = BigDecimal.ZERO,
    val currency: String = "KES",
    @Enumerated(EnumType.STRING) val method: PaymentMethod = PaymentMethod.MPESA,
    var transactionRef: String = "",
    val phoneNumber: String = "",
    val description: String = "",
    val congregationId: String = "",
    @Enumerated(EnumType.STRING) var status: PaymentStatus = PaymentStatus.PENDING,
    val createdAt: LocalDateTime = LocalDateTime.now()
)

@Entity @Table(name = "contribution_statements")
data class ContributionStatement(
    @Id @GeneratedValue(strategy = GenerationType.UUID) val id: String = "",
    val userId: String = "",
    @Column(name = "statement_year") var statementYear: Int = LocalDateTime.now().year,
    var totalAmount: BigDecimal = BigDecimal.ZERO,
    var titheAmount: BigDecimal = BigDecimal.ZERO,
    var offeringAmount: BigDecimal = BigDecimal.ZERO,
    var donationAmount: BigDecimal = BigDecimal.ZERO,
    val generatedAt: LocalDateTime = LocalDateTime.now()
)
