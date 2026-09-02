package ke.pcea.connect.modules.attendance.api.controller
import ke.pcea.connect.modules.attendance.api.dto.*
import ke.pcea.connect.modules.attendance.application.AttendanceService
import ke.pcea.connect.shared.api.ApiResponse
import ke.pcea.connect.shared.api.BusinessRuleException
import ke.pcea.connect.shared.security.Roles
import org.springframework.http.ResponseEntity
import org.springframework.security.access.prepost.PreAuthorize
import org.springframework.security.core.Authentication
import org.springframework.web.bind.annotation.*

@RestController
@RequestMapping("/api/attendance")
class AttendanceController(private val service: AttendanceService) {

    // Members can mark their own attendance; userId derived from JWT
    @PostMapping
    fun markAttendance(auth: Authentication, @RequestBody req: MarkAttendanceRequest) = ResponseEntity.ok(ApiResponse.success(
        service.markAttendance(auth.name, req.type, req.referenceId, req.congregationId, req.date).let {
            AttendanceResponse(it.id, it.userId, it.type.name, it.referenceId, it.date.toString(), it.checkInTime?.toString(), it.status, it.congregationId)
        }))

    @PutMapping("/{recordId}/checkin")
    fun checkIn(@PathVariable recordId: String) = ResponseEntity.ok(ApiResponse.success(
        service.checkIn(recordId).let {
            AttendanceResponse(it.id, it.userId, it.type.name, it.referenceId, it.date.toString(), it.checkInTime?.toString(), it.status, it.congregationId)
        }))

    @PutMapping("/{recordId}/checkout")
    fun checkout(@PathVariable recordId: String) = ResponseEntity.ok(ApiResponse.success(
        service.checkout(recordId).let {
            AttendanceResponse(it.id, it.userId, it.type.name, it.referenceId, it.date.toString(), it.checkInTime?.toString(), it.status, it.congregationId)
        }))

    // OBJECT-LEVEL AUTHORIZATION: members see only their own attendance; staff can see any
    @GetMapping("/user/{userId}")
    fun getUserAttendance(auth: Authentication, @PathVariable userId: String): ResponseEntity<ApiResponse<List<AttendanceResponse>>> {
        if (userId != auth.name && !Roles.isStaff(auth.authorities.map { it.authority.removePrefix("ROLE_") })) {
            throw BusinessRuleException("You are not authorized to view another member's attendance")
        }
        return ResponseEntity.ok(ApiResponse.success(
            service.getAttendanceByUser(userId).map {
                AttendanceResponse(it.id, it.userId, it.type.name, it.referenceId, it.date.toString(), it.checkInTime?.toString(), it.status, it.congregationId)
            }))
    }

    @PreAuthorize(Roles.STAFF_SPEL)
    @GetMapping("/congregation/{congregationId}")
    fun getCongregationAttendance(@PathVariable congregationId: String, @RequestParam(required = false) date: java.time.LocalDate?) =
        ResponseEntity.ok(ApiResponse.success(
            service.getAttendanceByCongregation(congregationId, date).map {
                AttendanceResponse(it.id, it.userId, it.type.name, it.referenceId, it.date.toString(), it.checkInTime?.toString(), it.status, it.congregationId)
            }))
}
