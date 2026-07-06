package ke.pcea.connect.modules.communication.domain
import jakarta.persistence.*
import java.time.LocalDateTime

enum class AnnouncementType { CIRCULAR, EVENT, EMERGENCY, GENERAL }
enum class NotificationChannel { PUSH, EMAIL, SMS, IN_APP }

@Entity
@Table(name = "announcements")
data class Announcement(
    @Id @GeneratedValue(strategy = GenerationType.UUID) val id: String = "",
    val title: String = "",
    @Column(length = 3000) val content: String = "",
    @Enumerated(EnumType.STRING) val type: AnnouncementType = AnnouncementType.GENERAL,
    val senderId: String = "",
    val targetScope: String = "",
    val publishedAt: LocalDateTime = LocalDateTime.now(),
    val expiresAt: LocalDateTime? = null
)

@Entity
@Table(name = "notifications")
data class Notification(
    @Id @GeneratedValue(strategy = GenerationType.UUID) val id: String = "",
    val recipientId: String = "",
    val title: String = "",
    val body: String = "",
    @Enumerated(EnumType.STRING) val channel: NotificationChannel = NotificationChannel.IN_APP,
    var read: Boolean = false,   // <-- changed to var
    val createdAt: LocalDateTime = LocalDateTime.now()
)
