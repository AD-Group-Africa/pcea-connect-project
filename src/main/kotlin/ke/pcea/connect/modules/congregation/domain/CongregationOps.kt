package ke.pcea.connect.modules.congregation.domain
import jakarta.persistence.*
import java.time.LocalDateTime

@Entity @Table(name = "small_groups")
data class SmallGroup(
    @Id @GeneratedValue(strategy = GenerationType.UUID) val id: String = "",
    val name: String = "",
    val description: String = "",
    val congregationId: String = "",
    val leaderId: String = "",
    val meetingDay: String = "",
    val meetingTime: String = "",
    val location: String = "",
    val active: Boolean = true
)

@Entity @Table(name = "committees")
data class Committee(
    @Id @GeneratedValue(strategy = GenerationType.UUID) val id: String = "",
    val name: String = "",
    val description: String = "",
    val congregationId: String = "",
    val chairpersonId: String = "",
    val meetingFrequency: String = "",
    val active: Boolean = true
)

@Entity @Table(name = "visitors")
data class Visitor(
    @Id @GeneratedValue(strategy = GenerationType.UUID) val id: String = "",
    val fullName: String = "",
    val phone: String = "",
    val email: String = "",
    val visitDate: LocalDateTime = LocalDateTime.now(),
    val purpose: String = "",
    val congregationId: String = "",
    var followedUp: Boolean = false
)
