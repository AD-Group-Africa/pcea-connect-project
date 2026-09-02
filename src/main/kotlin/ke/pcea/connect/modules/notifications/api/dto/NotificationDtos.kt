package ke.pcea.connect.modules.notifications.api.dto

data class RegisterDeviceRequest(val token: String, val platform: String = "ANDROID")
data class SendNotificationRequest(
    val recipientId: String = "",
    val title: String,
    val body: String,
    val channel: String = "PUSH",
    val targetType: String = "ALL",
    val targetId: String = "",
    val scheduledAt: String? = null
)
data class NotificationLogResponse(
    val id: String, val title: String, val body: String,
    val recipientId: String, val channel: String, val sentAt: String, val status: String
)
