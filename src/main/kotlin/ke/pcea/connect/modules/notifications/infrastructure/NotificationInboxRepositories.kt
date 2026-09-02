package ke.pcea.connect.modules.notifications.infrastructure
import ke.pcea.connect.modules.notifications.domain.*
import org.springframework.data.jpa.repository.JpaRepository
import org.springframework.stereotype.Repository

@Repository interface UserNotificationRepository : JpaRepository<UserNotification, String> {
    fun findByUserIdOrderByCreatedAtDesc(userId: String): List<UserNotification>
    fun findByUserIdAndIsReadFalseOrderByCreatedAtDesc(userId: String): List<UserNotification>
    fun countByUserIdAndIsReadFalse(userId: String): Long
}

@Repository interface NotificationPreferenceRepository : JpaRepository<NotificationPreference, String> {
    fun findByUserId(userId: String): List<NotificationPreference>
    fun findByUserIdAndCategory(userId: String, category: String): List<NotificationPreference>
}

@Repository interface NotificationTargetRepository : JpaRepository<NotificationTarget, String> {
    fun findByUserId(userId: String): List<NotificationTarget>
}