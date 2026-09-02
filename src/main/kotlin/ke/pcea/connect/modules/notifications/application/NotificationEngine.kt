package ke.pcea.connect.modules.notifications.application
import ke.pcea.connect.modules.notifications.domain.*
import ke.pcea.connect.modules.notifications.infrastructure.*
import org.springframework.http.*
import org.springframework.scheduling.annotation.Scheduled
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional
import org.springframework.web.client.RestTemplate
import java.time.LocalDateTime

@Service
@Transactional
class NotificationEngine(
    private val deviceTokenRepo: DeviceTokenRepository,
    private val scheduledRepo: ScheduledNotificationRepository,
    private val logRepo: NotificationLogRepository
) {
    private val restTemplate = RestTemplate()
    // Replace with your Firebase server key
    private val fcmServerKey = "YOUR_FCM_SERVER_KEY"

    fun registerDevice(userId: String, token: String, platform: String) {
        val existing = deviceTokenRepo.findByUserId(userId).find { it.token == token }
        if (existing == null) {
            deviceTokenRepo.save(DeviceToken(userId = userId, token = token, platform = platform))
        }
    }

    fun sendPushNotification(recipientId: String, title: String, body: String) {
        val tokens = deviceTokenRepo.findByUserId(recipientId)
        tokens.forEach { dt ->
            val payload = mapOf(
                "to" to dt.token,
                "notification" to mapOf("title" to title, "body" to body)
            )
            val headers = HttpHeaders().apply {
                contentType = MediaType.APPLICATION_JSON
                set("Authorization", "key=$fcmServerKey")
            }
            try {
                restTemplate.postForEntity(
                    "https://fcm.googleapis.com/fcm/send",
                    HttpEntity(payload, headers),
                    String::class.java
                )
                logRepo.save(NotificationLog(title = title, body = body, recipientId = recipientId, channel = "PUSH"))
            } catch (e: Exception) {
                logRepo.save(NotificationLog(title = title, body = body, recipientId = recipientId, channel = "PUSH", status = "FAILED"))
            }
        }
    }

    fun sendEmailNotification(recipientId: String, title: String, body: String) {
        // Mock email sending – replace with real SMTP integration
        logRepo.save(NotificationLog(title = title, body = body, recipientId = recipientId, channel = "EMAIL"))
    }

    fun sendSmsNotification(recipientId: String, title: String, body: String) {
        // Mock SMS sending – replace with real gateway integration
        logRepo.save(NotificationLog(title = title, body = body, recipientId = recipientId, channel = "SMS"))
    }

    fun sendInAppNotification(recipientId: String, title: String, body: String) {
        logRepo.save(NotificationLog(title = title, body = body, recipientId = recipientId, channel = "IN_APP"))
    }

    fun scheduleNotification(title: String, body: String, targetType: String, targetId: String, channel: String, scheduledAt: LocalDateTime): ScheduledNotification {
        val sched = ScheduledNotification(title = title, body = body, targetType = targetType, targetId = targetId, channel = channel, scheduledAt = scheduledAt)
        return scheduledRepo.save(sched)
    }

    fun getScheduledNotifications() = scheduledRepo.findAll()

    @Scheduled(fixedRate = 60000) // check every minute
    fun processScheduledNotifications() {
        val now = LocalDateTime.now()
        val due = scheduledRepo.findBySentFalseAndScheduledAtBefore(now)
        due.forEach { sched ->
            when (sched.channel) {
                "PUSH" -> sendPushNotification(sched.targetId, sched.title, sched.body)
                "EMAIL" -> sendEmailNotification(sched.targetId, sched.title, sched.body)
                "SMS" -> sendSmsNotification(sched.targetId, sched.title, sched.body)
                "IN_APP" -> sendInAppNotification(sched.targetId, sched.title, sched.body)
            }
            sched.sent = true
            scheduledRepo.save(sched)
        }
    }

    fun getLogs() = logRepo.findAllByOrderBySentAtDesc()
    fun getLogsForUser(userId: String) = logRepo.findByRecipientId(userId)
}
