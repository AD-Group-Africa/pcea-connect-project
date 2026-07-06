package ke.pcea.connect.modules.pastoralcare.api.controller
import ke.pcea.connect.modules.pastoralcare.api.dto.*
import ke.pcea.connect.modules.pastoralcare.application.PastoralCareService
import ke.pcea.connect.shared.api.ApiResponse
import org.springframework.http.ResponseEntity
import org.springframework.web.bind.annotation.*
import java.time.LocalDateTime

@RestController
@RequestMapping("/api/pastoralcare")
class PastoralCareController(private val service: PastoralCareService) {

    @PostMapping("/prayer")
    fun submitPrayer(@RequestBody req: PrayerRequestDto) = ResponseEntity.ok(ApiResponse.success(
        service.submitPrayerRequest(req.userId, req.request, req.isAnonymous)))

    @GetMapping("/prayer")
    fun getAllPrayers() = ResponseEntity.ok(ApiResponse.success(service.getAllPrayerRequests()))

    @PutMapping("/prayer/{id}/status")
    fun updatePrayerStatus(@PathVariable id: String, @RequestBody req: UpdatePrayerStatusDto) = ResponseEntity.ok(ApiResponse.success(
        service.updatePrayerStatus(id, req.status, req.prayedBy)))

    @PostMapping("/visit")
    fun scheduleVisit(@RequestBody req: ScheduleVisitDto) = ResponseEntity.ok(ApiResponse.success(
        service.scheduleVisit(req.userId, req.type, req.visitorId, LocalDateTime.parse(req.scheduledAt), req.notes)))

    @PutMapping("/visit/{id}/complete")
    fun completeVisit(@PathVariable id: String, @RequestBody req: CompleteVisitDto) = ResponseEntity.ok(ApiResponse.success(
        service.completeVisit(id, req.notes, req.followUpNeeded)))

    @GetMapping("/visit/user/{userId}")
    fun getVisits(@PathVariable userId: String) = ResponseEntity.ok(ApiResponse.success(service.getVisitsForUser(userId)))

    @PostMapping("/task")
    fun createTask(@RequestBody req: CreateTaskDto) = ResponseEntity.ok(ApiResponse.success(
        service.createTask(req.title, req.description, req.assignedTo, req.priority,
            req.dueDate?.let { LocalDateTime.parse(it) })))

    @PutMapping("/task/{id}/status")
    fun updateTaskStatus(@PathVariable id: String, @RequestBody req: UpdateTaskStatusDto) = ResponseEntity.ok(ApiResponse.success(
        service.updateTaskStatus(id, req.status)))

    @GetMapping("/task/user/{userId}")
    fun getTasks(@PathVariable userId: String) = ResponseEntity.ok(ApiResponse.success(service.getTasksForUser(userId)))
}
