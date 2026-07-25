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
    private val prayerFeedRepo: PrayerFeedRepository,
    private val templateRepo: NotificationTemplateRepository
) {
    fun createAnnouncement(title: String, content: String, type: AnnouncementType, senderId: String, targetScope: String): Announcement {
        return announcementRepo.save(Announcement(title = title, content = content, type = type, senderId = senderId, targetScope = targetScope))
    }

    fun getAnnouncementsForUser(userScopes: List<String>): List<Announcement> {
        return announcementRepo.findAll().filter { ann ->
            userScopes.any { scope -> ann.targetScope.contains(scope) } || ann.targetScope == "all"
        }
    }

    fun getAllAnnouncements() = announcementRepo.findAll()

    fun postPrayer(userId: String, request: String, isAnonymous: Boolean): PrayerFeedItem {
        return prayerFeedRepo.save(PrayerFeedItem(userId = userId, request = request, isAnonymous = isAnonymous))
    }

    fun prayForItem(itemId: String): PrayerFeedItem {
        val item = prayerFeedRepo.findById(itemId).orElseThrow { BusinessRuleException("Prayer not found") }
        item.prayerCount += 1
        return prayerFeedRepo.save(item)
    }

    fun getPrayerFeed() = prayerFeedRepo.findAllByOrderByCreatedAtDesc()

    fun createTemplate(name: String, title: String, body: String, channel: NotificationChannel): NotificationTemplate {
        return templateRepo.save(NotificationTemplate(name = name, title = title, body = body, channel = channel))
    }

    fun getTemplates() = templateRepo.findAll()
}
