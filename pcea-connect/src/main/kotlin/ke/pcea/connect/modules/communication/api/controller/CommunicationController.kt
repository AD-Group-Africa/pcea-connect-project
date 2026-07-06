package ke.pcea.connect.modules.communication.api.controller
import ke.pcea.connect.modules.communication.api.dto.*
import ke.pcea.connect.modules.communication.application.CommunicationService
import ke.pcea.connect.modules.communication.domain.NotificationChannel
import ke.pcea.connect.shared.api.ApiResponse
import org.springframework.http.ResponseEntity
import org.springframework.web.bind.annotation.*

@RestController
@RequestMapping("/api/communication")
class CommunicationController(private val service: CommunicationService) {

    @PostMapping("/announcements")
    fun createAnnouncement(@RequestBody req: CreateAnnouncementRequest): ResponseEntity<ApiResponse<AnnouncementResponse>> {
        val ann = service.createAnnouncement(req.title, req.content, req.type, req.senderId, req.targetScope)
        return ResponseEntity.ok(ApiResponse.success(AnnouncementResponse(ann.id, ann.title, ann.content, ann.type.name, ann.senderId, ann.publishedAt.toString())))
    }

    @GetMapping("/announcements")
    fun getAnnouncements(@RequestParam(required = false) scopes: String?): ResponseEntity<ApiResponse<List<AnnouncementResponse>>> {
        val list = if (scopes.isNullOrBlank()) service.getAllAnnouncements()
                    else service.getAnnouncementsForUser("", scopes.split(","))
        val resp = list.map { AnnouncementResponse(it.id, it.title, it.content, it.type.name, it.senderId, it.publishedAt.toString()) }
        return ResponseEntity.ok(ApiResponse.success(resp))
    }

    @PostMapping("/notifications")
    fun sendNotification(@RequestBody req: SendNotificationRequest): ResponseEntity<ApiResponse<NotificationResponse>> {
        val notif = service.sendNotification(req.recipientId, req.title, req.body, req.channel)
        return ResponseEntity.ok(ApiResponse.success(NotificationResponse(notif.id, notif.title, notif.body, notif.channel.name, notif.read, notif.createdAt.toString())))
    }

    @GetMapping("/notifications/{userId}")
    fun getNotifications(@PathVariable userId: String, @RequestParam(required = false) unreadOnly: Boolean?): ResponseEntity<ApiResponse<List<NotificationResponse>>> {
        val list = if (unreadOnly == true) service.getUnreadNotifications(userId) else service.getAllNotifications(userId)
        val resp = list.map { NotificationResponse(it.id, it.title, it.body, it.channel.name, it.read, it.createdAt.toString()) }
        return ResponseEntity.ok(ApiResponse.success(resp))
    }

    @PutMapping("/notifications/{notificationId}/read")
    fun markAsRead(@PathVariable notificationId: String): ResponseEntity<ApiResponse<String>> {
        service.markAsRead(notificationId)
        return ResponseEntity.ok(ApiResponse.success("marked read"))
    }
}
