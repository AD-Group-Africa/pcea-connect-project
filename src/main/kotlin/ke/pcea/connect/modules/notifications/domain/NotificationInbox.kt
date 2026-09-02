package ke.pcea.connect.modules.notifications.domain
import jakarta.persistence.*
import java.time.LocalDateTime

const val DEFAULT_NOTIFICATION_CATEGORIES = "WORSHIP,EVENTS,MINISTRY,GIVING,NEWS,GENERAL"

@Entity @Table(name = "user_notifications")
data class UserNotification(
    @Id @GeneratedValue(strategy = GenerationType.UUID) val id: String = "",
    val userId: String = "",
    val title: String = "",
    val body: String = "",
    val category: String = "GENERAL",
    val referenceType: String = "",
    val referenceId: String = "",
    var isRead: Boolean = false,
    val createdAt: LocalDateTime = LocalDateTime.now()
)

@Entity @Table(name = "notification_preferences")
data class NotificationPreference(
    @Id @GeneratedValue(strategy = GenerationType.UUID) val id: String = "",
    val userId: String = "",
    val channel: String = "IN_APP",      // IN_APP, PUSH, EMAIL, SMS
    val category: String = "GENERAL",
    var enabled: Boolean = true,
    val createdAt: LocalDateTime = LocalDateTime.now()
)

/** Fan-out target: a notification addressed to an entire congregation, ministry or role. */
@Entity @Table(name = "notification_targets")
data class NotificationTarget(
    @Id @GeneratedValue(strategy = GenerationType.UUID) val id: String = "",
    val userId: String = "",
    val title: String = "",
    val body: String = "",
    val category: String = "GENERAL",
    val createdAt: LocalDateTime = LocalDateTime.now()
)