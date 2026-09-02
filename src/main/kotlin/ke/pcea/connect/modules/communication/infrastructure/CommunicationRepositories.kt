package ke.pcea.connect.modules.communication.infrastructure
import ke.pcea.connect.modules.communication.domain.*
import org.springframework.data.jpa.repository.JpaRepository
import org.springframework.stereotype.Repository

@Repository interface AnnouncementRepository : JpaRepository<Announcement, String> {
    fun findByTargetScopeContaining(scope: String): List<Announcement>
    fun findByType(type: AnnouncementType): List<Announcement>
}

@Repository interface PrayerFeedRepository : JpaRepository<PrayerFeedItem, String> {
    fun findAllByOrderByCreatedAtDesc(): List<PrayerFeedItem>
    fun findByUserId(userId: String): List<PrayerFeedItem>
}

@Repository interface NotificationTemplateRepository : JpaRepository<NotificationTemplate, String>
