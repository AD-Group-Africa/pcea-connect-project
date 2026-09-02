package ke.pcea.connect.modules.ministries.api.controller
import ke.pcea.connect.modules.ministries.api.dto.*
import ke.pcea.connect.modules.ministries.application.MinistryService
import ke.pcea.connect.shared.api.ApiResponse
import ke.pcea.connect.shared.security.MinistryAuthorizationService
import ke.pcea.connect.shared.security.Roles
import org.springframework.http.ResponseEntity
import org.springframework.security.access.prepost.PreAuthorize
import org.springframework.security.core.Authentication
import org.springframework.web.bind.annotation.*
import java.time.LocalDateTime

@RestController
@RequestMapping("/api/ministries")
class MinistryController(
    private val service: MinistryService,
    private val authz: MinistryAuthorizationService
) {

    @GetMapping
    fun getAll() = ResponseEntity.ok(ApiResponse.success(service.getAllMinistries().map {
        MinistryResponse(it.id, it.name, it.type.name, it.description, it.congregationId)
    }))

    /** Returns all ministries the current user is a member of — powers the "My Ministries" hub. */
    @GetMapping("/me")
    fun getMyMinistries(auth: Authentication) = ResponseEntity.ok(ApiResponse.success(
        service.getMyMinistries(auth.name).map {
            MinistryResponse(it.id, it.name, it.type.name, it.description, it.congregationId)
        }))

    /** Returns ministries the user is NOT a member of — powers the "Explore Ministries" section. */
    @GetMapping("/explore")
    fun getExploreMinistries(auth: Authentication) = ResponseEntity.ok(ApiResponse.success(
        service.getExploreMinistries(auth.name).map {
            MinistryResponse(it.id, it.name, it.type.name, it.description, it.congregationId)
        }))

    @PreAuthorize("hasAnyRole('ADMIN', 'SUPER_ADMIN', 'ELDER')")
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

    @PreAuthorize("hasAnyRole('ADMIN', 'SUPER_ADMIN', 'ELDER')")
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

    @PreAuthorize(Roles.STAFF_SPEL)
    @PostMapping("/{ministryId}/events")
    fun createEvent(auth: Authentication, @PathVariable ministryId: String, @RequestBody req: CreateEventRequest) = ResponseEntity.ok(ApiResponse.success(
        service.createEvent(ministryId, req.title, req.description, LocalDateTime.parse(req.startTime),
            req.endTime?.let { LocalDateTime.parse(it) }, req.location).let {
                MinistryEventResponse(it.id, it.title, it.description, it.startTime.toString(), it.endTime?.toString(), it.location)
            }
        ).also { authz.requireCanManageMinistry(auth.name, ministryId) })

    @GetMapping("/{ministryId}/events")
    fun getEvents(@PathVariable ministryId: String) = ResponseEntity.ok(ApiResponse.success(
        service.getEvents(ministryId).map {
            MinistryEventResponse(it.id, it.title, it.description, it.startTime.toString(), it.endTime?.toString(), it.location)
        }))

    @PreAuthorize(Roles.STAFF_SPEL)
    @PostMapping("/{ministryId}/projects")
    fun createProject(auth: Authentication, @PathVariable ministryId: String, @RequestBody req: CreateProjectRequest) = ResponseEntity.ok(ApiResponse.success(
        service.createProject(ministryId, req.name, req.description, LocalDateTime.parse(req.startDate),
            req.endDate?.let { LocalDateTime.parse(it) }).let {
                MinistryProjectResponse(it.id, it.name, it.description, it.startDate.toString(), it.endDate?.toString(), it.status)
            }
        ).also { authz.requireCanManageMinistry(auth.name, ministryId) })

    @GetMapping("/{ministryId}/projects")
    fun getProjects(@PathVariable ministryId: String) = ResponseEntity.ok(ApiResponse.success(
        service.getProjects(ministryId).map {
            MinistryProjectResponse(it.id, it.name, it.description, it.startDate.toString(), it.endDate?.toString(), it.status)
        }))

    @GetMapping("/{ministryId}/announcements")
    fun getAnnouncements(@PathVariable ministryId: String) = ResponseEntity.ok(ApiResponse.success(
        service.getAnnouncements(ministryId).map {
            MinistryAnnouncementResponse(it.id, it.ministry?.id ?: "", it.title, it.content, it.authorId, it.createdAt.toString(), it.pinned)
        }))

    @PreAuthorize(Roles.STAFF_SPEL)
    @PostMapping("/{ministryId}/announcements")
    fun createAnnouncement(auth: Authentication, @PathVariable ministryId: String, @RequestBody req: CreateAnnouncementRequest): ResponseEntity<ApiResponse<MinistryAnnouncementResponse>> {
        authz.requireCanManageMinistry(auth.name, ministryId)
        val announcement = service.createAnnouncement(ministryId, req.title, req.content, auth.name)
        return ResponseEntity.ok(ApiResponse.success(
            MinistryAnnouncementResponse(announcement.id, announcement.ministry?.id ?: "", announcement.title,
                announcement.content, announcement.authorId, announcement.createdAt.toString(), announcement.pinned)))
    }
}
