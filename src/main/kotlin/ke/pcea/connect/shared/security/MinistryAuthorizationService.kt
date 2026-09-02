package ke.pcea.connect.shared.security

import ke.pcea.connect.modules.identity.infrastructure.UserRepository
import ke.pcea.connect.modules.ministries.domain.MinistryRole
import ke.pcea.connect.modules.ministries.infrastructure.MinistryMemberRepository
import ke.pcea.connect.shared.api.BusinessRuleException
import org.springframework.stereotype.Service

/**
 * Reusable scoped authorization for the shared Ministry framework.
 *
 * Evolves the previous broad STAFF-level checks toward:
 *
 *     ROLE  +  MINISTRY  +  SCOPE
 *
 * A PCMF leader can manage their PCMF ministry without automatically controlling
 * Sunday School. A Sunday School teacher cannot manage PCMF. Congregation-wide roles
 * (ADMIN, SUPER_ADMIN, ELDER) retain broad access but ministry-specific leadership
 * roles (PCMF_LEADER, GUILD_LEADER, YOUTH_LEADER, etc.) are scoped to their ministry.
 *
 * This does NOT replace Spring Security's @PreAuthorize — it complements it. The
 * @PreAuthorize on the controller method gates broad role access; this service performs
 * the fine-grained object-level check (does this user lead THIS ministry?).
 */
@Service
class MinistryAuthorizationService(
    private val userRepo: UserRepository,
    private val memberRepo: MinistryMemberRepository
) {
    /**
     * Returns true if the user can manage the given ministry (create events,
     * announcements, projects, manage members). True if:
     *   - user is a congregation-wide admin role, OR
     *   - user is a LEADER/COORDINATOR/ADMIN member of this specific ministry.
     */
    fun canManageMinistry(userId: String, ministryId: String): Boolean {
        val user = userRepo.findById(userId).orElseThrow { BusinessRuleException("User not found") }
        val roles = user.roles

        // Congregation-wide roles always pass
        if (roles.any { it in CONGREGATION_WIDE_ADMIN_ROLES }) return true

        // Otherwise the user must hold a leadership role IN this ministry
        val membership = memberRepo.findByMinistryIdAndUserId(ministryId, userId)
            ?: return false
        return membership.role in setOf(MinistryRole.LEADER, MinistryRole.COORDINATOR, MinistryRole.ADMIN)
    }

    /**
     * Returns true if the user is a member of the given ministry (any role).
     * Congregation-wide admins are implicitly members for read purposes.
     */
    fun isMemberOrStaff(userId: String, ministryId: String): Boolean {
        val user = userRepo.findById(userId).orElseThrow { BusinessRuleException("User not found") }
        if (user.roles.any { it in CONGREGATION_WIDE_ADMIN_ROLES }) return true
        return memberRepo.findByMinistryIdAndUserId(ministryId, userId) != null
    }

    /**
     * Throws AccessDeniedException (mapped to 403) if the user cannot manage the
     * ministry. Convenience for controllers.
     */
    fun requireCanManageMinistry(userId: String, ministryId: String) {
        if (!canManageMinistry(userId, ministryId)) {
            throw org.springframework.security.access.AccessDeniedException(
                "You do not have leadership access to this ministry"
            )
        }
    }

    companion object {
        /** Roles that implicitly manage any ministry in their congregation. */
        private val CONGREGATION_WIDE_ADMIN_ROLES = setOf(
            "SUPER_ADMIN", "ADMIN", "ELDER", "PASTOR", "MINISTER"
        )
    }
}
