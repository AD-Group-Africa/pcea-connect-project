package ke.pcea.connect.modules.notifications.application
import ke.pcea.connect.modules.notifications.domain.*
import ke.pcea.connect.modules.notifications.infrastructure.*
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional
import java.time.LocalDateTime

/**
 * In-app notification inbox with role-aware fan-out and per-user preferences.
 *
 * Fan-out modes:
 *  - USER: deliver to one member
 *  - CONGREGATION: deliver to every member of a congregation (userIds resolved upstream)
 *  - MINISTRY: deliver to every member of a ministry (userIds resolved upstream)
 *  - ROLE: deliver to every user holding a role (userIds resolved upstream)
 *
 * No user is spammed twice for the same announcement: a per-user dedupe marker (targets
 * table) is consulted before enqueueing.
 */
@Service
@Transactional
class InAppNotificationService(
    private val notificationRepo: UserNotificationRepository,
    private val preferenceRepo: NotificationPreferenceRepository,
    private val targetRepo: NotificationTargetRepository,
    private val engine: NotificationEngine
) {
    fun sendToUser(userId: String, title: String, body: String, category: String = "GENERAL",
                   referenceType: String = "", referenceId: String = "") {
        if (isOptedOut(userId, category)) return
        notificationRepo.save(UserNotification(userId = userId, title = title, body = body,
            category = category, referenceType = referenceType, referenceId = referenceId))
        engine.sendInAppNotification(userId, title, body)
    }

    /** Fan out to many users (resolved by the caller) with per-user dedupe within 5 minutes. */
    fun fanOut(userIds: List<String>, title: String, body: String, category: String = "GENERAL") {
        val now = LocalDateTime.now()
        userIds.distinct().forEach { uid ->
            if (isOptedOut(uid, category)) return@forEach
            val recent = targetRepo.findByUserId(uid).any {
                it.title == title && it.body == body && it.category == category &&
                    it.createdAt.isAfter(now.minusMinutes(5))
            }
            if (recent) return@forEach
            targetRepo.save(NotificationTarget(userId = uid, title = title, body = body, category = category))
            sendToUser(uid, title, body, category)
        }
    }

    fun isOptedOut(userId: String, category: String): Boolean {
        val prefs = preferenceRepo.findByUserId(userId)
        if (prefs.isEmpty()) return false  // defaults: everything on
        return prefs.any { it.category == category && !it.enabled }
    }

    fun setPreference(userId: String, category: String, channel: String = "IN_APP", enabled: Boolean): NotificationPreference {
        val existing = preferenceRepo.findByUserIdAndCategory(userId, category)
            .firstOrNull { it.channel == channel }
        if (existing != null) {
            existing.enabled = enabled
            return preferenceRepo.save(existing)
        }
        return preferenceRepo.save(NotificationPreference(userId = userId, category = category, channel = channel, enabled = enabled))
    }

    fun getPreferences(userId: String) = preferenceRepo.findByUserId(userId)

    fun inbox(userId: String) = notificationRepo.findByUserIdOrderByCreatedAtDesc(userId)
    fun unread(userId: String) = notificationRepo.findByUserIdAndIsReadFalseOrderByCreatedAtDesc(userId)
    fun unreadCount(userId: String) = notificationRepo.countByUserIdAndIsReadFalse(userId)

    fun markRead(userId: String, notificationId: String) {
        val n = notificationRepo.findById(notificationId).orElse(null) ?: return
        if (n.userId != userId) return  // owner-only
        n.isRead = true
        notificationRepo.save(n)
    }

    fun markAllRead(userId: String) {
        unread(userId).forEach { it.isRead = true; notificationRepo.save(it) }
    }
}