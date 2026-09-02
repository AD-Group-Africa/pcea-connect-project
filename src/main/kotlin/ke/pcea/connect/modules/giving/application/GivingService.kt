package ke.pcea.connect.modules.giving.application
import ke.pcea.connect.modules.giving.domain.*
import ke.pcea.connect.modules.giving.infrastructure.*
import ke.pcea.connect.shared.api.BusinessRuleException
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional
import java.time.LocalDateTime

@Service
@Transactional
class GivingService(
    private val contributionRepo: ContributionRepository,
    private val statementRepo: ContributionStatementRepository
) {
    fun recordContribution(userId: String, type: ContributionType, amount: java.math.BigDecimal,
                           method: PaymentMethod, phoneNumber: String, description: String, congregationId: String): Contribution {
        val contribution = Contribution(userId = userId, type = type, amount = amount, method = method,
            phoneNumber = phoneNumber, description = description, congregationId = congregationId, status = PaymentStatus.PENDING)
        return contributionRepo.save(contribution)
    }

    fun updateContribution(contribution: Contribution) = contributionRepo.save(contribution)

    fun confirmPayment(contributionId: String, mpesaCode: String): Contribution {
        val contribution = contributionRepo.findById(contributionId)
            .orElseThrow { BusinessRuleException("Contribution not found") }
        contribution.status = PaymentStatus.COMPLETED
        contribution.transactionRef = mpesaCode
        val saved = contributionRepo.save(contribution)
        updateStatement(saved.userId)
        return saved
    }

    fun getUserContributions(userId: String) = contributionRepo.findByUserId(userId)
    fun getCongregationContributions(congregationId: String) = contributionRepo.findByCongregationId(congregationId)

    fun getStatement(userId: String, year: Int?): ContributionStatement {
        val y = year ?: LocalDateTime.now().year
        val statement = statementRepo.findByUserIdAndStatementYear(userId, y)
        if (statement != null) return statement
        return statementRepo.save(ContributionStatement(userId = userId, statementYear = y))
    }

    private fun updateStatement(userId: String) {
        val year = LocalDateTime.now().year
        val allContributions = contributionRepo.findByUserId(userId)
            .filter { it.status == PaymentStatus.COMPLETED && it.createdAt.year == year }
        val statement = statementRepo.findByUserIdAndStatementYear(userId, year)
            ?: ContributionStatement(userId = userId, statementYear = year)
        statement.totalAmount = allContributions.fold(java.math.BigDecimal.ZERO) { acc, c -> acc.add(c.amount) }
        statement.titheAmount = allContributions.filter { it.type == ContributionType.TITHE }.fold(java.math.BigDecimal.ZERO) { acc, c -> acc.add(c.amount) }
        statement.offeringAmount = allContributions.filter { it.type == ContributionType.OFFERING }.fold(java.math.BigDecimal.ZERO) { acc, c -> acc.add(c.amount) }
        statement.donationAmount = allContributions.filter { it.type == ContributionType.DONATION || it.type == ContributionType.PROJECT }.fold(java.math.BigDecimal.ZERO) { acc, c -> acc.add(c.amount) }
        statementRepo.save(statement)
    }
}
