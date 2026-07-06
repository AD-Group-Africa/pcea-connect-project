package ke.pcea.connect.modules.volunteer.api.controller
import ke.pcea.connect.modules.volunteer.application.VolunteerService
import ke.pcea.connect.shared.api.ApiResponse
import org.springframework.http.ResponseEntity
import org.springframework.web.bind.annotation.*
import java.time.LocalDateTime

@RestController
@RequestMapping("/api/volunteer")
class VolunteerController(private val service: VolunteerService) {

    @PostMapping("/teams")
    fun createTeam(@RequestBody req: Map<String, String>): ResponseEntity<ApiResponse<Map<String, Any?>>> {
        val team = service.createTeam(req["name"] ?: "", req["description"] ?: "", req["congregationId"] ?: "")
        return ResponseEntity.ok(ApiResponse.success(mapOf("id" to team.id, "name" to team.name)))
    }

    @GetMapping("/teams/{congregationId}")
    fun getTeams(@PathVariable congregationId: String) = ResponseEntity.ok(ApiResponse.success(
        service.getTeams(congregationId).map { mapOf("id" to it.id, "name" to it.name) }))

    @PostMapping("/schedules")
    fun createSchedule(@RequestBody req: Map<String, String>) = ResponseEntity.ok(ApiResponse.success(
        service.createSchedule(req["teamId"] ?: "", req["eventName"] ?: "",
            LocalDateTime.parse(req["scheduledAt"] ?: LocalDateTime.now().toString()),
            (req["durationMinutes"] ?: "60").toInt())
            .let { mapOf("id" to it.id, "eventName" to it.eventName) }))

    @GetMapping("/schedules/{teamId}")
    fun getSchedules(@PathVariable teamId: String) = ResponseEntity.ok(ApiResponse.success(
        service.getSchedules(teamId).map { mapOf("id" to it.id, "eventName" to it.eventName) }))

    @PostMapping("/signups")
    fun signUp(@RequestParam scheduleId: String, @RequestBody req: Map<String, String>) = ResponseEntity.ok(ApiResponse.success(
        service.signUp(scheduleId, req["userId"] ?: "", req["role"] ?: "Volunteer")
            .let { mapOf("id" to it.id, "userId" to it.userId) }))

    @PutMapping("/signups/{signupId}/attend")
    fun markAttended(@PathVariable signupId: String) = ResponseEntity.ok(ApiResponse.success(
        service.markAttended(signupId).let { mapOf("id" to it.id, "attended" to it.attended) }))
}
