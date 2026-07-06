package ke.pcea.connect.modules.notifications.api.controller
import ke.pcea.connect.modules.notifications.api.dto.*
import ke.pcea.connect.modules.notifications.application.NotificationEngine
import ke.pcea.connect.shared.api.ApiResponse
import org.springframework.http.ResponseEntity
import org.springframework.security.core.Authentication
import org.springframework.web.bind.annotation.*
import java.time.LocalDateTime

@RestController
@RequestMapping("/api/notifications")
class NotificationController(private val engine: NotificationEngine) {

    @PostMapping("/register-device")
    fun registerDevice(auth: Authentication, @RequestBody req: RegisterDeviceRequest) =
        ResponseEntity.ok(ApiResponse.success(engine.registerDevice(auth.name, req.token, req.platform).let { "Device registered" }))

    @PostMapping("/send")
    fun send(@RequestBody req: SendNotificationRequest): ResponseEntity<ApiResponse<String>> {
        when (req.channel) {
            "PUSH" -> engine.sendPushNotification(req.recipientId, req.title, req.body)
            "EMAIL" -> engine.sendEmailNotification(req.recipientId, req.title, req.body)
            "SMS" -> engine.sendSmsNotification(req.recipientId, req.title, req.body)
            "IN_APP" -> engine.sendInAppNotification(req.recipientId, req.title, req.body)
        }
        return ResponseEntity.ok(ApiResponse.success("Notification sent"))
    }

    @PostMapping("/schedule")
    fun schedule(@RequestBody req: SendNotificationRequest): ResponseEntity<ApiResponse<String>> {
        val scheduledAt = if (req.scheduledAt != null) LocalDateTime.parse(req.scheduledAt) else LocalDateTime.now()
        engine.scheduleNotification(req.title, req.body, req.targetType, req.targetId, req.channel, scheduledAt)
        return ResponseEntity.ok(ApiResponse.success("Scheduled"))
    }

    @GetMapping("/logs")
    fun getLogs(@RequestParam(required = false) userId: String?) = ResponseEntity.ok(ApiResponse.success(
        (if (userId != null) engine.getLogsForUser(userId) else engine.getLogs()).map {
            NotificationLogResponse(it.id, it.title, it.body, it.recipientId, it.channel, it.sentAt.toString(), it.status)
        }
    ))
}
