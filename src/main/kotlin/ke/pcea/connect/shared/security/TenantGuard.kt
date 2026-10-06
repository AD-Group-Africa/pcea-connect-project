package ke.pcea.connect.shared.security

import ke.pcea.connect.modules.identity.infrastructure.UserRepository
import org.slf4j.LoggerFactory
import org.springframework.stereotype.Component

/**
 * Thrown when a principal attempts to reach a resource owned by another congregation.
 * Mapped to 403 by GlobalExceptionHandler; the message is intentionally generic so no
 * tenancy topology leaks to clients.
 */
class TenantViolationException : RuntimeException("Access denied")

/**
 * Single primitive for congregation-scoped authorization.
 *
 * Derives the caller's congregation from the authenticated principal (users.congregation_id)
 * and compares it against the congregation that owns the target resource. Client-supplied
 * congregation/member/group ids are treated as untrusted references — ownership is always
 * resolved server-side here.
 *
 * Staff roles are congregation-scoped too: an admin of congregation A does not gain
 * write access to congregation B by role alone.
 */
@Component
class TenantGuard(
    private val users: UserRepository
) {
    private val log = LoggerFactory.getLogger(TenantGuard::class.java)

    /** The caller's congregation id, or null if the user has no congregation assigned. */
    fun congregationOf(userId: String): String? =
        users.findById(userId).map { it.congregation?.id }.orElse(null)

    /**
     * Ensures the caller belongs to [resourceCongregationId].
     * A caller with NO congregation is denied every congregation-scoped operation.
     */
    fun requireMember(userId: String, resourceCongregationId: String) {
        val own = congregationOf(userId)
        if (own == null || own != resourceCongregationId) {
            log.warn(
                "TENANT_VIOLATION user={} claimedCongregation={} resourceCongregation={}",
                userId, own, resourceCongregationId
            )
            throw TenantViolationException()
        }
    }

    /**
     * Ensures the caller is staff (ADMIN/SUPER_ADMIN/ELDER/CLERK/PASTOR/MINISTER/SECRETARY)
     * of the SAME congregation that owns the resource. Congregation-wide mutation gate.
     */
    fun requireStaffOf(userId: String, resourceCongregationId: String) {
        val user = users.findById(userId).orElseThrow { TenantViolationException() }
        requireMember(userId, resourceCongregationId)
        if (!Roles.isStaff(user.roles)) {
            log.warn("TENANT_FORBIDDEN non-staff user={} tried staff mutation in congregation={}", userId, resourceCongregationId)
            throw TenantViolationException()
        }
    }

    /** Resolves the congregation a new resource should belong to: the caller's own. */
    fun requireCongregationContext(userId: String): String {
        val own = congregationOf(userId)
        if (own == null) {
            log.warn("TENANT_VIOLATION user={} has no congregation context", userId)
            throw TenantViolationException()
        }
        return own
    }

    /**
     * Ensures the caller belongs to the congregation that owns the given team.
     * Generic over the team id → congregation lookup so other modules reuse it.
     */
    fun requireMemberOfTeam(userId: String, teamId: String, congregationIdOfTeam: (String) -> String?) {
        val teamCongregation = congregationIdOfTeam(teamId)
            ?: throw TenantViolationException()
        requireMember(userId, teamCongregation)
    }
}
