package ke.pcea.connect.shared.security

/**
 * Central role registry for PCEA Connect.
 *
 * Roles are plain strings stored on the user (ElementCollection). The registry keeps them
 * in one place so controllers and documentation cannot drift apart. Add new roles here and
 * they become assignable through the SUPER_ADMIN role API.
 */
object Roles {
    /** Every role assignable through /api/admin/users/{id}/roles. */
    val ALL: Set<String> = setOf(
        // Core / congregation administration
        "MEMBER", "ELDER", "CLERK", "TREASURER", "ADMIN", "SUPER_ADMIN",
        // Pastoral
        "PASTOR", "MINISTER", "SECRETARY",
        // Ministry leadership
        "TEACHER", "YOUTH_LEADER", "GUILD_LEADER", "PCMF_LEADER", "YPCMF_LEADER",
        "CHOIR_LEADER", "BRIGADE_OFFICER", "MISSION_LEADER", "DEV_LEADER",
        "SUNDAY_SCHOOL_TEACHER", "CATECHISM_TEACHER",
        // Finance
        "FINANCE_OFFICER"
    )

    /** Roles able to manage worship services, bulletins and other congregation content. */
    const val STAFF_SPEL = "hasAnyRole('ADMIN','SUPER_ADMIN','ELDER','CLERK','PASTOR','MINISTER','SECRETARY')"

    /** Roles able to see and confirm giving records. */
    const val FINANCE_SPEL = "hasAnyRole('TREASURER','FINANCE_OFFICER','ADMIN','SUPER_ADMIN')"

    /** Roles able to access sensitive pastoral care data (prayer lists, visits, tasks). */
    const val PASTORAL_SPEL = "hasAnyRole('ADMIN','SUPER_ADMIN','PASTOR','MINISTER','ELDER','CLERK')"

    /** Roles able to administer members (profiles, congregation assignment). */
    const val STAFF_OR_CLERK_SPEL = "hasAnyRole('ADMIN','SUPER_ADMIN','ELDER','CLERK','PASTOR','MINISTER','SECRETARY')"

    fun isStaff(roles: Collection<String>): Boolean =
        roles.any { it in setOf("ADMIN", "SUPER_ADMIN", "ELDER", "CLERK", "PASTOR", "MINISTER", "SECRETARY") }

    fun isFinance(roles: Collection<String>): Boolean =
        roles.any { it in setOf("TREASURER", "FINANCE_OFFICER", "ADMIN", "SUPER_ADMIN") }

    fun isPastoral(roles: Collection<String>): Boolean =
        roles.any { it in setOf("ADMIN", "SUPER_ADMIN", "PASTOR", "MINISTER", "ELDER", "CLERK") }
}