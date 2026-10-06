package ke.pcea.connect.modules.communion.domain

import jakarta.persistence.*
import java.time.LocalDate
import java.time.LocalDateTime
import java.time.LocalTime

/** DRAFT → OPEN → CLOSED, or DRAFT → CANCELLED. No recording against CLOSED/CANCELLED. */
enum class CommunionEventStatus { DRAFT, OPEN, CLOSED, CANCELLED }

/**
 * A Holy Communion service event in one congregation. All communion recording happens
 * against an OPEN event; the event is the unit of reporting and closing.
 */
@Entity
@Table(name = "communion_events")
data class CommunionEvent(
    @Id @GeneratedValue(strategy = GenerationType.UUID) val id: String = "",
    val congregationId: String = "",
    val serviceDate: LocalDate = LocalDate.now(),
    val serviceStartTime: LocalTime? = null,
    val serviceEndTime: LocalTime? = null,
    @Column(length = 200) val location: String = "",
    @Enumerated(EnumType.STRING) @Column(length = 20) var status: CommunionEventStatus = CommunionEventStatus.DRAFT,
    val createdBy: String = "",
    var closedBy: String? = null,
    var closedAt: LocalDateTime? = null,
    val createdAt: LocalDateTime = LocalDateTime.now(),
    var updatedAt: LocalDateTime = LocalDateTime.now()
)
