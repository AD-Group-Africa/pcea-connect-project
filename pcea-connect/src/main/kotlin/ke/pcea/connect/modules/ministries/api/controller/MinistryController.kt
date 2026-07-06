package ke.pcea.connect.modules.ministries.api.controller
import ke.pcea.connect.modules.ministries.api.dto.*
import ke.pcea.connect.modules.ministries.application.MinistryService
import ke.pcea.connect.shared.api.ApiResponse
import org.springframework.http.ResponseEntity
import org.springframework.web.bind.annotation.*
import java.time.LocalDateTime

@RestController
@RequestMapping("/api/ministries")
class MinistryController(private val service: MinistryService) {

    @GetMapping
    fun getAll() = ResponseEntity.ok(ApiResponse.success(service.getAllMinistries().map {
        MinistryResponse(it.id, it.name, it.type.name, it.description, it.congregationId)
    }))

    @PostMapping
    fun create(@RequestBody req: CreateMinistryRequest) = ResponseEntity.ok(ApiResponse.success(
        service.createMinistry(req.name, req.type, req.description, req.congregationId).let {
            MinistryResponse(it.id, it.name, it.type.name, it.description, it.congregationId)
        }))

    @GetMapping("/congregation/{congregationId}")
    fun getByCongregation(@PathVariable congregationId: String) = ResponseEntity.ok(ApiResponse.success(
        service.getMinistriesByCongregation(congregationId).map {
            MinistryResponse(it.id, it.name, it.type.name, it.description, it.congregationId)
        }))

    @PostMapping("/{ministryId}/members")
    fun addMember(@PathVariable ministryId: String, @RequestBody req: AddMemberRequest) = ResponseEntity.ok(ApiResponse.success(
        service.addMember(ministryId, req.userId, req.role).let {
            MinistryMemberResponse(it.id, it.userId, it.role.name, it.joinedAt.toString())
        }))

    @GetMapping("/{ministryId}/members")
    fun getMembers(@PathVariable ministryId: String) = ResponseEntity.ok(ApiResponse.success(
        service.getMembers(ministryId).map {
            MinistryMemberResponse(it.id, it.userId, it.role.name, it.joinedAt.toString())
        }))

    @PostMapping("/{ministryId}/events")
    fun createEvent(@PathVariable ministryId: String, @RequestBody req: CreateEventRequest) = ResponseEntity.ok(ApiResponse.success(
        service.createEvent(ministryId, req.title, req.description, LocalDateTime.parse(req.startTime),
            req.endTime?.let { LocalDateTime.parse(it) }, req.location).let {
                MinistryEventResponse(it.id, it.title, it.description, it.startTime.toString(), it.endTime?.toString(), it.location)
            }))

    @GetMapping("/{ministryId}/events")
    fun getEvents(@PathVariable ministryId: String) = ResponseEntity.ok(ApiResponse.success(
        service.getEvents(ministryId).map {
            MinistryEventResponse(it.id, it.title, it.description, it.startTime.toString(), it.endTime?.toString(), it.location)
        }))

    @PostMapping("/{ministryId}/projects")
    fun createProject(@PathVariable ministryId: String, @RequestBody req: CreateProjectRequest) = ResponseEntity.ok(ApiResponse.success(
        service.createProject(ministryId, req.name, req.description, LocalDateTime.parse(req.startDate),
            req.endDate?.let { LocalDateTime.parse(it) }).let {
                MinistryProjectResponse(it.id, it.name, it.description, it.startDate.toString(), it.endDate?.toString(), it.status)
            }))

    @GetMapping("/{ministryId}/projects")
    fun getProjects(@PathVariable ministryId: String) = ResponseEntity.ok(ApiResponse.success(
        service.getProjects(ministryId).map {
            MinistryProjectResponse(it.id, it.name, it.description, it.startDate.toString(), it.endDate?.toString(), it.status)
        }))
}
