package ke.pcea.connect.modules.communication.api.dto
import ke.pcea.connect.modules.communication.domain.AnnouncementType
import ke.pcea.connect.modules.communication.domain.NotificationChannel

data class CreateAnnouncementRequest(
    val title: String,
    val content: String,
    val type: AnnouncementType = AnnouncementType.GENERAL,
    val senderId: String,
    val targetScope: String = "all"
)

data class SendNotificationRequest(
    val recipientId: String,
    val title: String,
    val body: String,
    val channel: NotificationChannel = NotificationChannel.IN_APP
)

data class AnnouncementResponse(
    val id: String,
    val title: String,
    val content: String,
    val type: String,
    val senderId: String,
    val publishedAt: String
)

data class NotificationResponse(
    val id: String,
    val title: String,
    val body: String,
    val channel: String,
    val read: Boolean,
    val createdAt: String
)
