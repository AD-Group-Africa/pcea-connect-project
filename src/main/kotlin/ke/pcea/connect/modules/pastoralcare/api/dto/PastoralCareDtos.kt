package ke.pcea.connect.modules.pastoralcare.api.dto
import ke.pcea.connect.modules.pastoralcare.domain.*

data class PrayerRequestDto(
    val userId: String,
    val request: String,
    val isAnonymous: Boolean = false
)

data class UpdatePrayerStatusDto(
    val status: PrayerStatus,
    val prayedBy: String = ""
)

data class ScheduleVisitDto(
    val userId: String,
    val type: VisitType = VisitType.HOME,
    val visitorId: String,
    val scheduledAt: String,
    val notes: String = ""
)

data class CompleteVisitDto(
    val notes: String = "",
    val followUpNeeded: Boolean = false
)

data class CreateTaskDto(
    val title: String,
    val description: String = "",
    val assignedTo: String,
    val priority: TaskPriority = TaskPriority.MEDIUM,
    val dueDate: String? = null
)

data class UpdateTaskStatusDto(val status: TaskStatus)
