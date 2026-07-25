package ke.pcea.connect.modules.communication.api.controller
import ke.pcea.connect.modules.communication.api.dto.*
import ke.pcea.connect.modules.communication.application.CommunicationService
import ke.pcea.connect.shared.api.ApiResponse
import org.springframework.http.ResponseEntity
import org.springframework.web.bind.annotation.*

@RestController
@RequestMapping("/api/communication")
class CommunicationController(private val service: CommunicationService) {

    @PostMapping("/announcements")
    fun createAnnouncement(@RequestBody req: AnnouncementRequest): ResponseEntity<ApiResponse<AnnouncementResponse>> {
        val ann = service.createAnnouncement(req.title, req.content, req.type, req.senderId, req.targetScope)
        return ResponseEntity.ok(ApiResponse.success(AnnouncementResponse(ann.id, ann.title, ann.content, ann.type.name, ann.publishedAt.toString())))
    }

    @GetMapping("/announcements")
    fun getAnnouncements(@RequestParam(required = false) scopes: String?): ResponseEntity<ApiResponse<List<AnnouncementResponse>>> {
        val list = if (scopes.isNullOrBlank()) service.getAllAnnouncements()
                    else service.getAnnouncementsForUser(scopes.split(","))
        return ResponseEntity.ok(ApiResponse.success(list.map { AnnouncementResponse(it.id, it.title, it.content, it.type.name, it.publishedAt.toString()) }))
    }

    @PostMapping("/prayer")
    fun postPrayer(@RequestBody req: PrayerRequest): ResponseEntity<ApiResponse<PrayerFeedResponse>> {
        val item = service.postPrayer(req.userId, req.request, req.isAnonymous)
        return ResponseEntity.ok(ApiResponse.success(PrayerFeedResponse(item.id, item.userId, item.request, item.prayerCount, item.createdAt.toString())))
    }

    @PostMapping("/prayer/{id}/pray")
    fun prayForItem(@PathVariable id: String): ResponseEntity<ApiResponse<PrayerFeedResponse>> {
        val item = service.prayForItem(id)
        return ResponseEntity.ok(ApiResponse.success(PrayerFeedResponse(item.id, item.userId, item.request, item.prayerCount, item.createdAt.toString())))
    }

    @GetMapping("/prayer")
    fun getPrayerFeed(): ResponseEntity<ApiResponse<List<PrayerFeedResponse>>> {
        return ResponseEntity.ok(ApiResponse.success(service.getPrayerFeed().map {
            PrayerFeedResponse(it.id, it.userId, it.request, it.prayerCount, it.createdAt.toString()) }))
    }

    @PostMapping("/templates")
    fun createTemplate(@RequestBody req: TemplateRequest): ResponseEntity<ApiResponse<TemplateResponse>> {
        val t = service.createTemplate(req.name, req.title, req.body, req.channel)
        return ResponseEntity.ok(ApiResponse.success(TemplateResponse(t.id, t.name, t.title, t.body, t.channel.name)))
    }

    @GetMapping("/templates")
    fun getTemplates(): ResponseEntity<ApiResponse<List<TemplateResponse>>> {
        return ResponseEntity.ok(ApiResponse.success(service.getTemplates().map { TemplateResponse(it.id, it.name, it.title, it.body, it.channel.name) }))
    }
}
