package ke.pcea.connect.modules.communication.infrastructure
import ke.pcea.connect.modules.communication.domain.*
import org.springframework.data.jpa.repository.JpaRepository
import org.springframework.stereotype.Repository

@Repository
interface AnnouncementRepository : JpaRepository<Announcement, String> {
    fun findByTargetScopeContaining(scope: String): List<Announcement>
    fun findByType(type: AnnouncementType): List<Announcement>
}

@Repository
interface NotificationRepository : JpaRepository<Notification, String> {
    fun findByRecipientIdAndReadFalse(recipientId: String): List<Notification>
    fun findByRecipientId(recipientId: String): List<Notification>
}
