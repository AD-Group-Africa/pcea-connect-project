package ke.pcea.connect.modules.attendance.domain
import jakarta.persistence.*
import java.time.LocalDate
import java.time.LocalDateTime

enum class AttendanceType { SUNDAY_SERVICE, BRIGADE, GUILD, YOUTH, EVENT, OTHER }

@Entity
@Table(name = "attendance_records")
data class AttendanceRecord(
    @Id @GeneratedValue(strategy = GenerationType.UUID) val id: String = "",
    val userId: String = "",
    @Enumerated(EnumType.STRING) val type: AttendanceType = AttendanceType.SUNDAY_SERVICE,
    val referenceId: String = "",   // event ID, ministry ID, or "general"
    val date: LocalDate = LocalDate.now(),
    var checkInTime: LocalDateTime? = null,
    var checkOutTime: LocalDateTime? = null,
    var status: String = "PRESENT",  // PRESENT, ABSENT, LATE
    val congregationId: String = "",
    val notes: String = ""
)
