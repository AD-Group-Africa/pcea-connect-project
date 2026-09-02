package ke.pcea.connect.modules.notifications.api.controller
import ke.pcea.connect.modules.notifications.api.dto.*
import ke.pcea.connect.modules.notifications.application.InAppNotificationService
import ke.pcea.connect.modules.notifications.domain.UserNotification
import ke.pcea.connect.shared.api.ApiResponse
import org.springframework.http.ResponseEntity
import org.springframework.security.access.prepost.PreAuthorize
import org.springframework.security.core.Authentication
import org.springframework.web.bind.annotation.*

@RestController
@RequestMapping("/api/notifications/me")
class InAppNotificationController(private val service: InAppNotificationService) {

    @GetMapping("/inbox")
    fun inbox(auth: Authentication) = ResponseEntity.ok(ApiResponse.success(
        service.inbox(auth.name).map { toItem(it) }))

    @GetMapping("/unread")
    fun unread(auth: Authentication) = ResponseEntity.ok(ApiResponse.success(
        service.unread(auth.name).map { toItem(it) }))

    @GetMapping("/unread-count")
    fun unreadCount(auth: Authentication) = ResponseEntity.ok(ApiResponse.success(
        UnreadCountResponse(service.unreadCount(auth.name))))

    @PostMapping("/{notificationId}/read")
    fun markRead(auth: Authentication, @PathVariable notificationId: String) = ResponseEntity.ok(ApiResponse.success(
        service.markRead(auth.name, notificationId).let { "Marked" }))

    @PostMapping("/read-all")
    fun markAllRead(auth: Authentication) = ResponseEntity.ok(ApiResponse.success(
        service.markAllRead(auth.name).let { "Marked" }))

    @GetMapping("/preferences")
    fun preferences(auth: Authentication) = ResponseEntity.ok(ApiResponse.success(
        service.getPreferences(auth.name).map { PreferenceDto(it.category, it.channel, it.enabled) }))

    @PostMapping("/preferences")
    fun setPreference(auth: Authentication, @RequestBody req: SetPreferenceRequest) = ResponseEntity.ok(ApiResponse.success(
        service.setPreference(auth.name, req.category, req.channel, req.enabled)
            .let { PreferenceDto(it.category, it.channel, it.enabled) }))

    // Staff fan-out: send one announcement to many members without spamming.
    @PreAuthorize("hasAnyRole('ADMIN', 'SUPER_ADMIN', 'ELDER', 'CLERK')")
    @PostMapping("/fan-out")
    fun fanOut(@RequestBody req: FanOutRequest) = ResponseEntity.ok(ApiResponse.success(
        service.fanOut(req.userIds, req.title, req.body, req.category).let { "Queued" }))

    private fun toItem(n: UserNotification) = NotificationInboxItem(
        n.id, n.userId, n.title, n.body, n.category,
        n.referenceType, n.referenceId, n.isRead, n.createdAt.toString()
    )
}