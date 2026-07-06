package ke.pcea.connect.modules.attendance.api.dto
import ke.pcea.connect.modules.attendance.domain.AttendanceType
import java.time.LocalDate

data class MarkAttendanceRequest(
    val userId: String,
    val type: AttendanceType = AttendanceType.SUNDAY_SERVICE,
    val referenceId: String = "",
    val congregationId: String = "",
    val date: LocalDate? = null
)

data class AttendanceResponse(
    val id: String,
    val userId: String,
    val type: String,
    val referenceId: String,
    val date: String,
    val checkInTime: String?,
    val status: String,
    val congregationId: String
)
