package ke.pcea.connect.modules.membership.api.controller
import ke.pcea.connect.modules.membership.api.dto.*
import ke.pcea.connect.modules.membership.application.MembershipService
import ke.pcea.connect.modules.membership.domain.MemberProfile
import ke.pcea.connect.shared.api.ApiResponse
import ke.pcea.connect.shared.api.BusinessRuleException
import ke.pcea.connect.shared.security.Roles
import org.springframework.http.ResponseEntity
import org.springframework.security.access.prepost.PreAuthorize
import org.springframework.security.core.Authentication
import org.springframework.web.bind.annotation.*
import java.time.LocalDate

@RestController
@RequestMapping("/api/members")
class MembershipController(
    private val service: MembershipService
) {
    // Object-level authorization: a member may only view/edit their own profile;
    // leadership/staff may view/edit any member profile in their congregation.
    private fun requireSelfOrStaff(auth: Authentication, userId: String) {
        val roles = auth.authorities.map { it.authority.removePrefix("ROLE_") }
        if (userId != auth.name && !Roles.isStaff(roles))
            throw BusinessRuleException("Not authorized to access this member profile")
    }

    @GetMapping("/{userId}/profile")
    fun getProfile(auth: Authentication, @PathVariable userId: String): ResponseEntity<ApiResponse<MemberProfile>> {
        requireSelfOrStaff(auth, userId)
        return ResponseEntity.ok(ApiResponse.success(service.getProfile(userId)))
    }

    @PutMapping("/{userId}/profile")
    fun updateProfile(auth: Authentication, @PathVariable userId: String, @RequestBody req: MemberProfileRequest): ResponseEntity<ApiResponse<MemberProfile>> {
        requireSelfOrStaff(auth, userId)
        val updated = service.updateProfile(userId, MemberProfile(
            userId = userId,
            gender = req.gender,
            dateOfBirth = req.dateOfBirth?.let { LocalDate.parse(it) },
            maritalStatus = req.maritalStatus,
            occupation = req.occupation,
            baptismDate = req.baptismDate?.let { LocalDate.parse(it) },
            confirmationDate = req.confirmationDate?.let { LocalDate.parse(it) },
            marriageDate = req.marriageDate?.let { LocalDate.parse(it) },
            membershipDate = req.membershipDate?.let { LocalDate.parse(it) },
            spiritualGifts = req.spiritualGifts,
            skills = req.skills,
            bio = req.bio,
            spouseName = req.spouseName,
            fatherName = req.fatherName,
            motherName = req.motherName,
            emergencyContact = req.emergencyContact,
            emergencyPhone = req.emergencyPhone,
            address = req.address,
            city = req.city,
            postalCode = req.postalCode,
            country = req.country,
            active = req.active,
            memberStatus = req.memberStatus
        ))
        return ResponseEntity.ok(ApiResponse.success(updated))
    }

    @PreAuthorize(Roles.STAFF_OR_CLERK_SPEL)
    @GetMapping("/search")
    fun searchMembers(@RequestParam q: String): ResponseEntity<ApiResponse<List<MemberProfileResponse>>> {
        val profiles = service.searchMembers(q)
        val response = profiles.map { p ->
            MemberProfileResponse(
                userId = p.userId,
                fullName = p.user?.fullName ?: "",
                email = p.user?.email ?: "",
                phone = p.user?.phone ?: "",
                gender = p.gender,
                occupation = p.occupation,
                memberStatus = p.memberStatus,
                congregationName = p.user?.congregation?.name
            )
        }
        return ResponseEntity.ok(ApiResponse.success(response))
    }

    @PreAuthorize(Roles.STAFF_OR_CLERK_SPEL)
    @GetMapping
    fun getAllMembers(): ResponseEntity<ApiResponse<List<MemberProfileResponse>>> {
        val profiles = service.getAllMembers()
        val response = profiles.map { p ->
            MemberProfileResponse(
                userId = p.userId,
                fullName = p.user?.fullName ?: "",
                email = p.user?.email ?: "",
                phone = p.user?.phone ?: "",
                gender = p.gender,
                occupation = p.occupation,
                memberStatus = p.memberStatus,
                congregationName = p.user?.congregation?.name
            )
        }
        return ResponseEntity.ok(ApiResponse.success(response))
    }
}