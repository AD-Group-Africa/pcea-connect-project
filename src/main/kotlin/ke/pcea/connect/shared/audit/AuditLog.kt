package ke.pcea.connect.shared.audit

import jakarta.persistence.*
import org.springframework.data.jpa.repository.JpaRepository
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Propagation
import org.springframework.transaction.annotation.Transactional
import java.time.LocalDateTime

/**
 * One immutable audit-trail row. Append-only: rows are never updated or deleted by
 * application code. Covers the high-risk mutation categories:
 * financial mutations, payment confirmations, role changes, membership/committee
 * changes and sensitive pastoral records.
 *
 * NEVER store secrets, raw payment credentials, tokens or pastoral note contents here —
 * `detail` is a short, non-sensitive summary for investigators, not a data dump.
 */
@Entity
@Table(name = "audit_log")
data class AuditLog(
    @Id @GeneratedValue(strategy = GenerationType.UUID) val id: String = "",
    /** The authenticated principal that performed the action ("mpesa-callback" for webhooks). */
    val actorId: String = "",
    /** Comma-joined role names at action time — context only, never an authorization source. */
    @Column(length = 500) val actorRoles: String = "",
    /** Stable action identifier, e.g. GIVING_CONFIRM, ROLE_ASSIGN, COMMUNION_RECORD. */
    @Column(nullable = false, length = 100) val action: String = "",
    @Column(nullable = false, length = 100) val entityType: String = "",
    val entityId: String = "",
    @Column(length = 500) val detail: String = "",
    @Column(nullable = false) val createdAt: LocalDateTime = LocalDateTime.now()
)

interface AuditLogRepository : JpaRepository<AuditLog, String> {
    fun findTop50ByOrderByCreatedAtDesc(): List<AuditLog>
    fun countByActionAndEntityTypeAndEntityId(action: String, entityType: String, entityId: String): Long
    fun findByEntityTypeAndEntityIdOrderByCreatedAtDesc(entityType: String, entityId: String): List<AuditLog>
}

@Service
class AuditService(private val repo: AuditLogRepository) {

    /**
     * Best-effort append in an independent transaction: an audit-write failure must
     * never break or roll back the business action being audited.
     */
    @Transactional(propagation = Propagation.REQUIRES_NEW)
    fun record(
        actorId: String,
        action: String,
        entityType: String,
        entityId: String,
        detail: String = "",
        actorRoles: Collection<String> = emptyList()
    ) {
        try {
            repo.save(
                AuditLog(
                    actorId = actorId,
                    actorRoles = actorRoles.joinToString(",").take(500),
                    action = action,
                    entityType = entityType,
                    entityId = entityId,
                    detail = detail.take(500)
                )
            )
        } catch (_: Exception) {
            // Swallowed deliberately: auditing is defense-in-depth, not a feature gate.
        }
    }
}
