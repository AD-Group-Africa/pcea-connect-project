package ke.pcea.connect.modules.communication.application
import ke.pcea.connect.modules.communication.domain.*
import ke.pcea.connect.modules.communication.infrastructure.*
import ke.pcea.connect.shared.api.BusinessRuleException
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional

@Service
@Transactional
class CommunicationService(
    private val announcementRepo: AnnouncementRepository,
    private val notificationRepo: NotificationRepository
) {
    fun createAnnouncement(title: String, content: String, type: AnnouncementType, senderId: String, targetScope: String): Announcement {
        val ann = Announcement(title = title, content = content, type = type, senderId = senderId, targetScope = targetScope)
        return announcementRepo.save(ann)
    }

    fun getAnnouncementsForUser(userId: String, userScopes: List<String>): List<Announcement> {
        // userScopes could include congregation ID, parish ID, etc.
        return announcementRepo.findAll().filter { ann ->
            userScopes.any { scope -> ann.targetScope.contains(scope) } || ann.targetScope == "all"
        }
    }

    fun getAllAnnouncements() = announcementRepo.findAll()

    fun sendNotification(recipientId: String, title: String, body: String, channel: NotificationChannel): Notification {
        val notif = Notification(recipientId = recipientId, title = title, body = body, channel = channel)
        // TODO: integrate FCM, email, SMS gateway here
        return notificationRepo.save(notif)
    }

    fun getUnreadNotifications(userId: String) = notificationRepo.findByRecipientIdAndReadFalse(userId)
    fun getAllNotifications(userId: String) = notificationRepo.findByRecipientId(userId)

    fun markAsRead(notificationId: String) {
        val notif = notificationRepo.findById(notificationId).orElseThrow { BusinessRuleException("Notification not found") }
        notif.read = true
        notificationRepo.save(notif)
    }
}
