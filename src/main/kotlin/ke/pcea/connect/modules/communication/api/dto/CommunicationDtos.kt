package ke.pcea.connect.modules.communication.api.dto
import ke.pcea.connect.modules.communication.domain.AnnouncementType
import ke.pcea.connect.modules.communication.domain.NotificationChannel

data class AnnouncementRequest(val title: String, val content: String, val type: AnnouncementType = AnnouncementType.GENERAL,
                                val senderId: String, val targetScope: String = "all")
data class PrayerRequest(val userId: String, val request: String, val isAnonymous: Boolean = false)
data class TemplateRequest(val name: String, val title: String, val body: String, val channel: NotificationChannel = NotificationChannel.PUSH)
data class AnnouncementResponse(val id: String, val title: String, val content: String, val type: String, val publishedAt: String)
data class PrayerFeedResponse(val id: String, val userId: String, val request: String, val prayerCount: Int, val createdAt: String)
data class TemplateResponse(val id: String, val name: String, val title: String, val body: String, val channel: String)
