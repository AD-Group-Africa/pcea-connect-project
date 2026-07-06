package ke.pcea.connect.modules.volunteer.domain
import jakarta.persistence.*
import java.time.LocalDateTime

@Entity @Table(name = "volunteer_teams")
data class VolunteerTeam(
    @Id @GeneratedValue(strategy = GenerationType.UUID) val id: String = "",
    val name: String = "", val description: String = "", val congregationId: String = ""
)

@Entity @Table(name = "volunteer_schedules")
data class VolunteerSchedule(
    @Id @GeneratedValue(strategy = GenerationType.UUID) val id: String = "",
    val teamId: String = "", val eventName: String = "",
    val scheduledAt: LocalDateTime = LocalDateTime.now(), val durationMinutes: Int = 60
)

@Entity @Table(name = "volunteer_signups")
data class VolunteerSignup(
    @Id @GeneratedValue(strategy = GenerationType.UUID) val id: String = "",
    val scheduleId: String = "", val userId: String = "", val role: String = "",
    var attended: Boolean = false
)

@Entity @Table(name = "volunteer_service_hours")
data class VolunteerServiceHours(
    @Id @GeneratedValue(strategy = GenerationType.UUID) val id: String = "",
    val userId: String = "", val teamId: String = "", val hours: Double = 0.0,
    val date: LocalDateTime = LocalDateTime.now()
)
