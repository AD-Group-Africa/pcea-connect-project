package ke.pcea.connect.modules.livestream.api.controller
import ke.pcea.connect.modules.livestream.api.dto.*
import ke.pcea.connect.modules.livestream.application.LivestreamService
import ke.pcea.connect.shared.api.ApiResponse
import ke.pcea.connect.shared.security.Roles
import org.springframework.http.ResponseEntity
import org.springframework.security.access.prepost.PreAuthorize
import org.springframework.web.bind.annotation.*
import java.time.LocalDateTime

@RestController
@RequestMapping("/api/livestream")
class LivestreamController(private val service: LivestreamService) {

    @GetMapping
    fun getAll() = ResponseEntity.ok(ApiResponse.success(
        service.getAll().map {
            LivestreamResponse(it.id, it.title, it.description, it.preacher, it.scriptureRef,
                it.platform.name, it.embedUrl, it.thumbnailUrl, it.scheduledAt.toString(),
                it.status.name, it.endedAt?.toString())
        }))

    @GetMapping("/live")
    fun getLive() = ResponseEntity.ok(ApiResponse.success(
        service.getLive().map {
            LivestreamResponse(it.id, it.title, it.description, it.preacher, it.scriptureRef,
                it.platform.name, it.embedUrl, it.thumbnailUrl, it.scheduledAt.toString(),
                it.status.name, it.endedAt?.toString())
        }))

    @GetMapping("/upcoming")
    fun getUpcoming() = ResponseEntity.ok(ApiResponse.success(
        service.getUpcoming().map {
            LivestreamResponse(it.id, it.title, it.description, it.preacher, it.scriptureRef,
                it.platform.name, it.embedUrl, it.thumbnailUrl, it.scheduledAt.toString(),
                it.status.name, it.endedAt?.toString())
        }))

    @GetMapping("/past")
    fun getPast() = ResponseEntity.ok(ApiResponse.success(
        service.getPast().map {
            LivestreamResponse(it.id, it.title, it.description, it.preacher, it.scriptureRef,
                it.platform.name, it.embedUrl, it.thumbnailUrl, it.scheduledAt.toString(),
                it.status.name, it.endedAt?.toString())
        }))

    @PreAuthorize(Roles.STAFF_SPEL)
    @PostMapping
    fun schedule(@RequestBody req: ScheduleRequest) = ResponseEntity.ok(ApiResponse.success(
        service.schedule(req.title, req.description, req.preacher, req.scriptureRef,
            req.platform, req.embedUrl, req.thumbnailUrl, LocalDateTime.parse(req.scheduledAt))
            .let {
                LivestreamResponse(it.id, it.title, it.description, it.preacher, it.scriptureRef,
                    it.platform.name, it.embedUrl, it.thumbnailUrl, it.scheduledAt.toString(),
                    it.status.name, it.endedAt?.toString())
            }))

    @PreAuthorize(Roles.STAFF_SPEL)
    @PutMapping("/{id}/go-live")
    fun goLive(@PathVariable id: String) = ResponseEntity.ok(ApiResponse.success(
        service.goLive(id).let {
            LivestreamResponse(it.id, it.title, it.description, it.preacher, it.scriptureRef,
                it.platform.name, it.embedUrl, it.thumbnailUrl, it.scheduledAt.toString(),
                it.status.name, it.endedAt?.toString())
        }))

    @PreAuthorize(Roles.STAFF_SPEL)
    @PutMapping("/{id}/end")
    fun endStream(@PathVariable id: String) = ResponseEntity.ok(ApiResponse.success(
        service.endStream(id).let {
            LivestreamResponse(it.id, it.title, it.description, it.preacher, it.scriptureRef,
                it.platform.name, it.embedUrl, it.thumbnailUrl, it.scheduledAt.toString(),
                it.status.name, it.endedAt?.toString())
        }))
}
