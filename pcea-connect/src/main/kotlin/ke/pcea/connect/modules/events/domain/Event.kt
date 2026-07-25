package ke.pcea.connect.modules.events.domain
import jakarta.persistence.*
import java.time.LocalDateTime

enum class EventType { SUNDAY_SERVICE, FELLOWSHIP, BRIGADE, GUILD, CONFERENCE, TRAINING, OTHER }
enum class EventStatus { DRAFT, PUBLISHED, CANCELLED, COMPLETED }
enum class RegistrationStatus { REGISTERED, ATTENDED, CANCELLED }
enum class RecurrenceType { NONE, DAILY, WEEKLY, MONTHLY, YEARLY }

@Entity @Table(name = "events")
data class Event(
    @Id @GeneratedValue(strategy = GenerationType.UUID) val id: String = "",
    val title: String = "",
    @Column(length = 2000) val description: String = "",
    @Enumerated(EnumType.STRING) val type: EventType = EventType.OTHER,
    val location: String = "",
    val organizerId: String = "",
    val startTime: LocalDateTime = LocalDateTime.now(),
    val endTime: LocalDateTime? = null,
    val maxAttendees: Int = 0,
    val requiresRegistration: Boolean = false,
    val qrCheckInEnabled: Boolean = false,
    @Enumerated(EnumType.STRING) var status: EventStatus = EventStatus.DRAFT,
    val createdAt: LocalDateTime = LocalDateTime.now(),
    // Recurrence
    @Enumerated(EnumType.STRING) val recurrenceType: RecurrenceType = RecurrenceType.NONE,
    val recurrenceEndDate: LocalDateTime? = null,
    val parentEventId: String? = null   // for recurring instances
)

@Entity @Table(name = "event_registrations")
data class EventRegistration(
    @Id @GeneratedValue(strategy = GenerationType.UUID) val id: String = "",
    @ManyToOne(fetch = FetchType.LAZY) @JoinColumn(name = "event_id") val event: Event? = null,
    val userId: String = "",
    @Enumerated(EnumType.STRING) var status: RegistrationStatus = RegistrationStatus.REGISTERED,
    val registeredAt: LocalDateTime = LocalDateTime.now(),
    var attendedAt: LocalDateTime? = null,
    val ticketCode: String = ""
)
