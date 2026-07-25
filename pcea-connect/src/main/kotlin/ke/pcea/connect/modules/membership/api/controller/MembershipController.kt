package ke.pcea.connect.modules.membership.api.controller
import ke.pcea.connect.modules.membership.api.dto.*
import ke.pcea.connect.modules.membership.application.MembershipService
import ke.pcea.connect.modules.membership.domain.MemberProfile
import ke.pcea.connect.shared.api.ApiResponse
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
    @GetMapping("/{userId}/profile")
    fun getProfile(@PathVariable userId: String): ResponseEntity<ApiResponse<MemberProfile>> {
        return ResponseEntity.ok(ApiResponse.success(service.getProfile(userId)))
    }

    @PutMapping("/{userId}/profile")
    fun updateProfile(@PathVariable userId: String, @RequestBody req: MemberProfileRequest): ResponseEntity<ApiResponse<MemberProfile>> {
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
