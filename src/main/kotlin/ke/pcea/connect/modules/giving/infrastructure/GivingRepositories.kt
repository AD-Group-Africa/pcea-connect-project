package ke.pcea.connect.modules.giving.infrastructure
import ke.pcea.connect.modules.giving.domain.*
import org.springframework.data.jpa.repository.JpaRepository
import org.springframework.data.jpa.repository.Query
import org.springframework.stereotype.Repository

@Repository interface ContributionRepository : JpaRepository<Contribution, String> {
    fun findByUserId(userId: String): List<Contribution>
    fun findByCongregationId(congregationId: String): List<Contribution>
    fun findByTransactionRef(transactionRef: String): Contribution?
    @Query("select coalesce(sum(c.amount), 0) from Contribution c where c.congregationId = :congregationId and c.status = :status")
    fun sumAmountByCongregationIdAndStatus(congregationId: String, status: PaymentStatus): java.math.BigDecimal

    @Query("select coalesce(sum(c.amount), 0) from Contribution c where c.status = :status and c.createdAt >= :start and c.createdAt < :end")
    fun sumAmountByStatusAndDateRange(status: PaymentStatus, start: java.time.LocalDateTime, end: java.time.LocalDateTime): java.math.BigDecimal

    @Query("select coalesce(sum(c.amount), 0) from Contribution c where c.status = :status and c.congregationId = :congregationId and c.createdAt >= :start and c.createdAt < :end")
    fun sumAmountByCongregationAndStatusAndDateRange(congregationId: String, status: PaymentStatus, start: java.time.LocalDateTime, end: java.time.LocalDateTime): java.math.BigDecimal
}

@Repository interface ContributionStatementRepository : JpaRepository<ContributionStatement, String> {
    fun findByUserIdAndStatementYear(userId: String, year: Int): ContributionStatement?
    fun findByUserId(userId: String): List<ContributionStatement>
}
