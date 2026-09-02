package ke.pcea.connect.modules.worship.api.controller
import ke.pcea.connect.modules.worship.api.dto.*
import ke.pcea.connect.modules.worship.application.WorshipService
import ke.pcea.connect.modules.worship.domain.ServiceType
import ke.pcea.connect.shared.api.ApiResponse
import ke.pcea.connect.shared.security.Roles
import org.springframework.http.ResponseEntity
import org.springframework.security.access.prepost.PreAuthorize
import org.springframework.web.bind.annotation.*
import java.time.LocalDate
import java.time.LocalTime

@RestController
@RequestMapping("/api/worship")
class WorshipController(private val service: WorshipService) {

    // ---------- Public GET (authenticated members) ----------

    // Today's worship — drives the congregation home screen "TODAY'S WORSHIP" card.
    @GetMapping("/today")
    fun today(@RequestParam(required = false) congregationId: String?): ResponseEntity<ApiResponse<ServiceResponse?>> {
        val svc = service.getWeek(congregationId).firstOrNull { it.serviceDate == LocalDate.now() }
        return ResponseEntity.ok(ApiResponse.success(svc?.let { toServiceResponse(it) }))
    }

    @GetMapping("/services/upcoming")
    fun upcoming(@RequestParam(required = false) congregationId: String?, @RequestParam(defaultValue = "10") limit: Int) = ResponseEntity.ok(ApiResponse.success(
        service.getUpcoming(congregationId, limit).map { toServiceResponse(it) }))

    @GetMapping("/services/week")
    fun week(@RequestParam(required = false) congregationId: String?) = ResponseEntity.ok(ApiResponse.success(
        service.getWeek(congregationId).map { toServiceResponse(it) }))

    @GetMapping("/services/{id}")
    fun getService(@PathVariable id: String) = ResponseEntity.ok(ApiResponse.success(
        toServiceResponse(service.getService(id))))

    @GetMapping("/bulletins/latest")
    fun latestBulletin(@RequestParam(required = false) congregationId: String?) = ResponseEntity.ok(ApiResponse.success(
        service.getLatestBulletin(congregationId)?.let { toBulletinResponse(it) }))

    @GetMapping("/bulletins")
    fun bulletins(@RequestParam(required = false) congregationId: String?) = ResponseEntity.ok(ApiResponse.success(
        service.getBulletins(congregationId).map { toBulletinResponse(it) }))

    @GetMapping("/bulletins/{id}")
    fun getBulletin(@PathVariable id: String) = ResponseEntity.ok(ApiResponse.success(
        toBulletinResponse(service.getBulletin(id))))

    // ---------- Staff-only mutations ----------

    @PreAuthorize(Roles.STAFF_SPEL)
    @PostMapping("/services")
    fun createService(@RequestBody req: CreateServiceRequest) = ResponseEntity.ok(ApiResponse.success(
        service.createService(
            req.title, LocalDate.parse(req.serviceDate), LocalTime.parse(req.serviceTime),
            req.congregationId, ServiceType.valueOf(req.serviceType), req.preacherName, req.preacherUserId,
            req.sermonId, req.theme, req.scriptureRef, req.worshipTeam, req.orderOfService,
            req.livestreamId, req.announcements
        ).let { toServiceResponse(it) }))

    @PreAuthorize(Roles.STAFF_SPEL)
    @PutMapping("/services/{id}")
    fun updateService(@PathVariable id: String, @RequestBody req: UpdateServiceRequest) = ResponseEntity.ok(ApiResponse.success(
        service.updateService(id, mapOf(
            "title" to req.title, "serviceDate" to req.serviceDate?.let { LocalDate.parse(it) },
            "serviceTime" to req.serviceTime?.let { LocalTime.parse(it) },
            "serviceType" to req.serviceType?.let { ServiceType.valueOf(it) },
            "preacherName" to req.preacherName, "preacherUserId" to req.preacherUserId,
            "sermonId" to req.sermonId, "theme" to req.theme, "scriptureRef" to req.scriptureRef,
            "worshipTeam" to req.worshipTeam, "orderOfService" to req.orderOfService,
            "livestreamId" to req.livestreamId, "announcements" to req.announcements
        )).let { toServiceResponse(it) }))

    @PreAuthorize(Roles.STAFF_SPEL)
    @DeleteMapping("/services/{id}")
    fun deleteService(@PathVariable id: String) = ResponseEntity.ok(ApiResponse.success(service.deleteService(id).let { "Deleted" }))

    @PreAuthorize(Roles.STAFF_SPEL)
    @PostMapping("/bulletins")
    fun createBulletin(@RequestBody req: CreateBulletinRequest) = ResponseEntity.ok(ApiResponse.success(
        service.createBulletin(
            req.title, req.congregationId, req.churchServiceId, LocalDate.parse(req.serviceDate),
            req.welcomeMessage, req.orderOfService, req.scriptureRef, req.preacher, req.sermonTheme,
            req.announcements, req.weeklyCalendar, req.ministryNotices, req.givingInformation,
            req.livestreamUrl, req.specialEvents
        ).let { toBulletinResponse(it) }))

    @PreAuthorize(Roles.STAFF_SPEL)
    @PutMapping("/bulletins/{id}")
    fun updateBulletin(@PathVariable id: String, @RequestBody req: UpdateBulletinRequest) = ResponseEntity.ok(ApiResponse.success(
        service.updateBulletin(id, mapOf(
            "title" to req.title, "welcomeMessage" to req.welcomeMessage, "orderOfService" to req.orderOfService,
            "scriptureRef" to req.scriptureRef, "preacher" to req.preacher, "sermonTheme" to req.sermonTheme,
            "announcements" to req.announcements, "weeklyCalendar" to req.weeklyCalendar,
            "ministryNotices" to req.ministryNotices, "givingInformation" to req.givingInformation,
            "livestreamUrl" to req.livestreamUrl, "specialEvents" to req.specialEvents
        )).let { toBulletinResponse(it) }))

    @PreAuthorize(Roles.STAFF_SPEL)
    @PostMapping("/bulletins/{id}/publish")
    fun publishBulletin(@PathVariable id: String) = ResponseEntity.ok(ApiResponse.success(
        service.publishBulletin(id).let { toBulletinResponse(it) }))

    @PreAuthorize(Roles.STAFF_SPEL)
    @DeleteMapping("/bulletins/{id}")
    fun deleteBulletin(@PathVariable id: String) = ResponseEntity.ok(ApiResponse.success(service.deleteBulletin(id).let { "Deleted" }))

    // ---------- Mapping ----------

    private fun toServiceResponse(s: ke.pcea.connect.modules.worship.domain.ChurchService) = ServiceResponse(
        s.id, s.title, s.serviceDate.toString(), s.serviceTime.toString(), s.congregationId,
        s.serviceType.name, s.preacherName, s.preacherUserId, s.sermonId, s.theme, s.scriptureRef,
        s.worshipTeam, s.orderOfService, s.livestreamId, s.announcements, s.bulletinId
    )
    private fun toBulletinResponse(b: ke.pcea.connect.modules.worship.domain.Bulletin) = BulletinResponse(
        b.id, b.title, b.congregationId, b.churchServiceId, b.serviceDate.toString(),
        b.welcomeMessage, b.orderOfService, b.scriptureRef, b.preacher, b.sermonTheme,
        b.announcements, b.weeklyCalendar, b.ministryNotices, b.givingInformation,
        b.livestreamUrl, b.specialEvents, b.status.name, b.publishedAt?.toString()
    )
}