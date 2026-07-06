package ke.pcea.connect.modules.notifications.infrastructure
import ke.pcea.connect.modules.notifications.domain.*
import org.springframework.data.jpa.repository.JpaRepository
import org.springframework.stereotype.Repository

@Repository interface DeviceTokenRepository : JpaRepository<DeviceToken, String> {
    fun findByUserId(userId: String): List<DeviceToken>
    fun findByUserIdIn(userIds: List<String>): List<DeviceToken>
}

@Repository interface ScheduledNotificationRepository : JpaRepository<ScheduledNotification, String> {
    fun findBySentFalseAndScheduledAtBefore(now: java.time.LocalDateTime): List<ScheduledNotification>
}

@Repository interface NotificationLogRepository : JpaRepository<NotificationLog, String> {
    fun findByRecipientId(recipientId: String): List<NotificationLog>
    fun findAllByOrderBySentAtDesc(): List<NotificationLog>
}
