package ke.pcea.connect.modules.notifications.api.dto

data class NotificationInboxItem(
    val id: String, val userId: String, val title: String, val body: String,
    val category: String, val referenceType: String, val referenceId: String,
    val isRead: Boolean, val createdAt: String
)
data class PreferenceDto(val category: String, val channel: String, val enabled: Boolean)
data class SetPreferenceRequest(val category: String, val channel: String = "IN_APP", val enabled: Boolean = true)
data class FanOutRequest(val userIds: List<String>, val title: String, val body: String, val category: String = "GENERAL")
data class UnreadCountResponse(val count: Long)