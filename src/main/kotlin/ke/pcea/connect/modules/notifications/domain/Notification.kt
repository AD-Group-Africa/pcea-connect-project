package ke.pcea.connect.modules.notifications.domain
import jakarta.persistence.*
import java.time.LocalDateTime

@Entity @Table(name = "device_tokens")
data class DeviceToken(
    @Id @GeneratedValue(strategy = GenerationType.UUID) val id: String = "",
    val userId: String = "",
    val token: String = "",
    val platform: String = "ANDROID" // ANDROID, IOS, WEB
)

@Entity @Table(name = "scheduled_notifications")
data class ScheduledNotification(
    @Id @GeneratedValue(strategy = GenerationType.UUID) val id: String = "",
    val title: String = "",
    val body: String = "",
    val targetType: String = "ALL",       // ALL, USER, CONGREGATION, MINISTRY
    val targetId: String = "",
    val channel: String = "PUSH",         // PUSH, EMAIL, SMS, IN_APP
    val scheduledAt: LocalDateTime = LocalDateTime.now(),
    var sent: Boolean = false
)

@Entity @Table(name = "notification_logs")
data class NotificationLog(
    @Id @GeneratedValue(strategy = GenerationType.UUID) val id: String = "",
    val title: String = "",
    val body: String = "",
    val recipientId: String = "",
    val channel: String = "PUSH",
    val sentAt: LocalDateTime = LocalDateTime.now(),
    var status: String = "SENT"
)
