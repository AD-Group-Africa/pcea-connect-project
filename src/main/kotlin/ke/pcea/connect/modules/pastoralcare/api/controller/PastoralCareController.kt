package ke.pcea.connect.modules.pastoralcare.api.controller
import ke.pcea.connect.modules.pastoralcare.api.dto.*
import ke.pcea.connect.modules.pastoralcare.application.PastoralCareService
import ke.pcea.connect.shared.api.ApiResponse
import ke.pcea.connect.shared.security.Roles
import org.springframework.http.ResponseEntity
import org.springframework.security.access.prepost.PreAuthorize
import org.springframework.security.core.Authentication
import org.springframework.web.bind.annotation.*
import java.time.LocalDateTime

@RestController
@RequestMapping("/api/pastoralcare")
class PastoralCareController(private val service: PastoralCareService) {

    @PostMapping("/prayer")
    fun submitPrayer(auth: Authentication, @RequestBody req: PrayerRequestDto) = ResponseEntity.ok(ApiResponse.success(
        service.submitPrayerRequest(auth.name, req.request, req.isAnonymous)))

    @PreAuthorize(Roles.PASTORAL_SPEL)
    @GetMapping("/prayer")
    fun getAllPrayers() = ResponseEntity.ok(ApiResponse.success(service.getAllPrayerRequests()))

    @GetMapping("/prayer/mine")
    fun myPrayers(auth: Authentication) = ResponseEntity.ok(ApiResponse.success(
        service.getPrayerRequestsForUser(auth.name)))

    @PreAuthorize(Roles.PASTORAL_SPEL)
    @PutMapping("/prayer/{id}/status")
    fun updatePrayerStatus(@PathVariable id: String, @RequestBody req: UpdatePrayerStatusDto) = ResponseEntity.ok(ApiResponse.success(
        service.updatePrayerStatus(id, req.status, req.prayedBy)))

    @PostMapping("/visit")
    fun scheduleVisit(auth: Authentication, @RequestBody req: ScheduleVisitDto) = ResponseEntity.ok(ApiResponse.success(
        service.scheduleVisit(req.userId.ifBlank { auth.name }, req.type, auth.name, LocalDateTime.parse(req.scheduledAt), req.notes)))

    @PreAuthorize(Roles.PASTORAL_SPEL)
    @PutMapping("/visit/{id}/complete")
    fun completeVisit(@PathVariable id: String, @RequestBody req: CompleteVisitDto) = ResponseEntity.ok(ApiResponse.success(
        service.completeVisit(id, req.notes, req.followUpNeeded)))

    @PreAuthorize(Roles.PASTORAL_SPEL)
    @GetMapping("/visit/user/{userId}")
    fun getVisits(@PathVariable userId: String) = ResponseEntity.ok(ApiResponse.success(service.getVisitsForUser(userId)))

    @PreAuthorize(Roles.PASTORAL_SPEL)
    @PostMapping("/task")
    fun createTask(@RequestBody req: CreateTaskDto) = ResponseEntity.ok(ApiResponse.success(
        service.createTask(req.title, req.description, req.assignedTo, req.priority,
            req.dueDate?.let { LocalDateTime.parse(it) })))

    @PreAuthorize(Roles.PASTORAL_SPEL)
    @PutMapping("/task/{id}/status")
    fun updateTaskStatus(@PathVariable id: String, @RequestBody req: UpdateTaskStatusDto) = ResponseEntity.ok(ApiResponse.success(
        service.updateTaskStatus(id, req.status)))

    @PreAuthorize(Roles.PASTORAL_SPEL)
    @GetMapping("/task/user/{userId}")
    fun getTasks(@PathVariable userId: String) = ResponseEntity.ok(ApiResponse.success(service.getTasksForUser(userId)))
}
