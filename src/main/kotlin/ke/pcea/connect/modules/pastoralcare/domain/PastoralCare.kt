package ke.pcea.connect.modules.pastoralcare.domain
import jakarta.persistence.*
import java.time.LocalDateTime

enum class PrayerStatus { SUBMITTED, PRAYING, ANSWERED }
enum class VisitType { HOSPITAL, HOME, BEREAVEMENT, COUNSELING }
enum class TaskPriority { LOW, MEDIUM, HIGH, URGENT }
enum class TaskStatus { PENDING, IN_PROGRESS, COMPLETED }

@Entity
@Table(name = "prayer_requests")
data class PrayerRequest(
    @Id @GeneratedValue(strategy = GenerationType.UUID) val id: String = "",
    val userId: String = "",
    val request: String = "",
    var isAnonymous: Boolean = false,
    @Enumerated(EnumType.STRING) var status: PrayerStatus = PrayerStatus.SUBMITTED,
    val createdAt: LocalDateTime = LocalDateTime.now(),
    var prayedBy: String = ""
)

@Entity
@Table(name = "pastoral_visits")
data class PastoralVisit(
    @Id @GeneratedValue(strategy = GenerationType.UUID) val id: String = "",
    val userId: String = "",
    @Enumerated(EnumType.STRING) val type: VisitType = VisitType.HOME,
    val visitorId: String = "",
    val scheduledAt: LocalDateTime = LocalDateTime.now(),
    var completedAt: LocalDateTime? = null,
    var notes: String = "",
    var followUpNeeded: Boolean = false
)

@Entity
@Table(name = "pastoral_tasks")
data class PastoralTask(
    @Id @GeneratedValue(strategy = GenerationType.UUID) val id: String = "",
    val title: String = "",
    val description: String = "",
    val assignedTo: String = "",
    @Enumerated(EnumType.STRING) val priority: TaskPriority = TaskPriority.MEDIUM,
    @Enumerated(EnumType.STRING) var status: TaskStatus = TaskStatus.PENDING,
    val dueDate: LocalDateTime? = null,
    var completedAt: LocalDateTime? = null,   // <-- changed to var
    val createdAt: LocalDateTime = LocalDateTime.now()
)
