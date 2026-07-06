package ke.pcea.connect.modules.membership.application
import ke.pcea.connect.modules.church.domain.*
import ke.pcea.connect.modules.church.infrastructure.*
import ke.pcea.connect.modules.identity.domain.User
import ke.pcea.connect.modules.identity.infrastructure.UserRepository
import ke.pcea.connect.modules.membership.domain.MemberProfile
import ke.pcea.connect.modules.membership.infrastructure.MemberProfileRepository
import ke.pcea.connect.shared.api.BusinessRuleException
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional

@Service
@Transactional
class MembershipService(
    private val userRepo: UserRepository,
    private val memberProfileRepo: MemberProfileRepository,
    private val congregationRepo: CongregationRepository,
    private val parishRepo: ParishRepository,
    private val presbyteryRepo: PresbyteryRepository,
    private val regionRepo: RegionRepository
) {
    fun assignCongregation(userId: String, congregationId: String): User {
        val user = userRepo.findById(userId).orElseThrow { BusinessRuleException("User not found") }
        val congregation = congregationRepo.findById(congregationId)
            .orElseThrow { BusinessRuleException("Congregation not found") }
        // Direct assignment instead of copy()
        user.congregation = congregation
        return userRepo.save(user)
    }

    fun getProfile(userId: String): MemberProfile {
        return memberProfileRepo.findById(userId)
            .orElseThrow { BusinessRuleException("Profile not found") }
    }

    fun updateProfile(userId: String, profile: MemberProfile): MemberProfile {
        val existing = memberProfileRepo.findById(userId)
            .orElseThrow { BusinessRuleException("Profile not found") }
        existing.gender = profile.gender
        existing.dateOfBirth = profile.dateOfBirth
        existing.maritalStatus = profile.maritalStatus
        existing.occupation = profile.occupation
        existing.baptismDate = profile.baptismDate
        existing.membershipDate = profile.membershipDate
        existing.spiritualGifts = profile.spiritualGifts
        existing.skills = profile.skills
        existing.bio = profile.bio
        return memberProfileRepo.save(existing)
    }

    fun getMembersForUser(currentUserId: String?): List<User> {
        if (currentUserId == null) {
            // No auth context – return all members (for testing)
            return userRepo.findAll()
        }
        val currentUser = userRepo.findById(currentUserId).orElseThrow { BusinessRuleException("Current user not found") }
        val roles = currentUser.roles
        val congregation = currentUser.congregation

        return when {
            roles.contains("SUPER_ADMIN") || roles.contains("GA_ADMIN") -> userRepo.findAll()
            roles.contains("REGION_ADMIN") -> {
                val region = congregation?.parish?.presbytery?.region
                    ?: throw BusinessRuleException("Admin not assigned to a congregation")
                userRepo.findAll().filter { user ->
                    user.congregation?.parish?.presbytery?.region?.id == region.id
                }
            }
            roles.contains("PRESBYTERY_ADMIN") -> {
                val presbytery = congregation?.parish?.presbytery
                    ?: throw BusinessRuleException("Admin not assigned to a congregation")
                userRepo.findAll().filter { user ->
                    user.congregation?.parish?.presbytery?.id == presbytery.id
                }
            }
            roles.contains("PARISH_ADMIN") -> {
                val parish = congregation?.parish
                    ?: throw BusinessRuleException("Admin not assigned to a congregation")
                userRepo.findAll().filter { user ->
                    user.congregation?.parish?.id == parish.id
                }
            }
            roles.contains("ELDER") -> {
                if (congregation == null) throw BusinessRuleException("Elder not assigned to a congregation")
                userRepo.findAll().filter { it.congregation?.id == congregation.id }
            }
            else -> listOf(currentUser)
        }
    }
}
