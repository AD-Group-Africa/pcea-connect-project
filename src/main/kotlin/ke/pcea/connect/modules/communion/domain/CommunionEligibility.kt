package ke.pcea.connect.modules.communion.domain

import jakarta.persistence.*
import java.time.LocalDateTime

/** ELIGIBLE / PENDING / RESTRICTED / SUSPENDED. Unknown members default to PENDING. */
enum class CommunionEligibilityStatus { ELIGIBLE, PENDING, RESTRICTED, SUSPENDED }

/**
 * A member's communion eligibility, per user (congregation scope comes from the user's
 * own congregation assignment). Deliberately NOT derived from QR credential validity:
 * a valid credential proves identity, not sacramental standing. Every administrative
 * change is audited (COMMUNION_ELIGIBILITY_CHANGED) with the reason.
 */
@Entity
@Table(name = "communion_eligibility")
data class CommunionEligibility(
    @Id @GeneratedValue(strategy = GenerationType.UUID) val id: String = "",
    @Column(unique = true) val userId: String = "",
    @Enumerated(EnumType.STRING) @Column(length = 20) var status: CommunionEligibilityStatus = CommunionEligibilityStatus.PENDING,
    @Column(length = 500) var reason: String = "",
    var updatedBy: String = "",
    var updatedAt: LocalDateTime = LocalDateTime.now()
)
