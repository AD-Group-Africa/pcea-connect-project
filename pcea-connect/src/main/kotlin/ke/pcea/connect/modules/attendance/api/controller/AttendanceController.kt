package ke.pcea.connect.modules.attendance.api.controller
import ke.pcea.connect.modules.attendance.api.dto.*
import ke.pcea.connect.modules.attendance.application.AttendanceService
import ke.pcea.connect.shared.api.ApiResponse
import org.springframework.http.ResponseEntity
import org.springframework.web.bind.annotation.*

@RestController
@RequestMapping("/api/attendance")
class AttendanceController(private val service: AttendanceService) {

    @PostMapping
    fun markAttendance(@RequestBody req: MarkAttendanceRequest) = ResponseEntity.ok(ApiResponse.success(
        service.markAttendance(req.userId, req.type, req.referenceId, req.congregationId, req.date).let {
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

    @GetMapping("/user/{userId}")
    fun getUserAttendance(@PathVariable userId: String) = ResponseEntity.ok(ApiResponse.success(
        service.getAttendanceByUser(userId).map {
            AttendanceResponse(it.id, it.userId, it.type.name, it.referenceId, it.date.toString(), it.checkInTime?.toString(), it.status, it.congregationId)
        }))

    @GetMapping("/congregation/{congregationId}")
    fun getCongregationAttendance(@PathVariable congregationId: String, @RequestParam(required = false) date: java.time.LocalDate?) =
        ResponseEntity.ok(ApiResponse.success(
            service.getAttendanceByCongregation(congregationId, date).map {
                AttendanceResponse(it.id, it.userId, it.type.name, it.referenceId, it.date.toString(), it.checkInTime?.toString(), it.status, it.congregationId)
            }))
}
