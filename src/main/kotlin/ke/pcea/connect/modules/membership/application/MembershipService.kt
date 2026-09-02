package ke.pcea.connect.modules.membership.application
import ke.pcea.connect.modules.membership.domain.MemberProfile
import ke.pcea.connect.modules.membership.infrastructure.MemberProfileRepository
import ke.pcea.connect.modules.identity.infrastructure.UserRepository
import ke.pcea.connect.shared.api.BusinessRuleException
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional
import java.time.LocalDate

@Service
@Transactional
class MembershipService(
    private val profileRepo: MemberProfileRepository,
    private val userRepo: UserRepository
) {
    fun getProfile(userId: String): MemberProfile {
        return profileRepo.findById(userId).orElseThrow { BusinessRuleException("Profile not found") }
    }

    fun updateProfile(userId: String, updated: MemberProfile): MemberProfile {
        val existing = profileRepo.findById(userId).orElseThrow { BusinessRuleException("Profile not found") }
        // Copy all updatable fields
        existing.gender = updated.gender
        existing.dateOfBirth = updated.dateOfBirth
        existing.maritalStatus = updated.maritalStatus
        existing.occupation = updated.occupation
        existing.baptismDate = updated.baptismDate
        existing.confirmationDate = updated.confirmationDate
        existing.marriageDate = updated.marriageDate
        existing.membershipDate = updated.membershipDate
        existing.spiritualGifts = updated.spiritualGifts
        existing.skills = updated.skills
        existing.bio = updated.bio
        existing.spouseName = updated.spouseName
        existing.fatherName = updated.fatherName
        existing.motherName = updated.motherName
        existing.emergencyContact = updated.emergencyContact
        existing.emergencyPhone = updated.emergencyPhone
        existing.address = updated.address
        existing.city = updated.city
        existing.postalCode = updated.postalCode
        existing.country = updated.country
        existing.active = updated.active
        existing.memberStatus = updated.memberStatus
        return profileRepo.save(existing)
    }

    fun searchMembers(query: String): List<MemberProfile> {
        return profileRepo.search(query)
    }

    fun getAllMembers(): List<MemberProfile> {
        return profileRepo.findAll()
    }

    fun getMembersByStatus(status: String): List<MemberProfile> {
        return profileRepo.findByMemberStatus(status)
    }
}
