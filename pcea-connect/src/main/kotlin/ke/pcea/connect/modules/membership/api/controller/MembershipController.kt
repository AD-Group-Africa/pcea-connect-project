package ke.pcea.connect.modules.membership.api.controller

import ke.pcea.connect.modules.identity.domain.User
import ke.pcea.connect.modules.identity.infrastructure.UserRepository
import ke.pcea.connect.modules.membership.api.dto.*
import ke.pcea.connect.modules.membership.application.MembershipService
import ke.pcea.connect.modules.membership.domain.MemberProfile
import ke.pcea.connect.shared.api.ApiResponse
import org.springframework.http.ResponseEntity
import org.springframework.security.core.Authentication
import org.springframework.web.bind.annotation.*
import java.time.LocalDate

@RestController
@RequestMapping("/api/members")
class MembershipController(
    private val membershipService: MembershipService,
    private val userRepository: UserRepository
) {
    @GetMapping
    fun getMembers(auth: Authentication?): ResponseEntity<ApiResponse<List<MemberResponse>>> {
        val userId = auth?.name // null if no JWT
        val members = membershipService.getMembersForUser(userId)
        val response = members.map { user ->
            MemberResponse(
                userId = user.id,
                fullName = user.fullName,
                email = user.email,
                phone = user.phone,
                congregationName = user.congregation?.name,
                roles = user.roles.toList()
            )
        }
        return ResponseEntity.ok(ApiResponse.success(response))
    }

    @PostMapping("/{userId}/assign-congregation")
    fun assignCongregation(@PathVariable userId: String, @RequestBody req: AssignCongregationRequest): ResponseEntity<ApiResponse<MemberResponse>> {
        val user = membershipService.assignCongregation(userId, req.congregationId)
        val resp = MemberResponse(
            userId = user.id,
            fullName = user.fullName,
            email = user.email,
            phone = user.phone,
            congregationName = user.congregation?.name,
            roles = user.roles.toList()
        )
        return ResponseEntity.ok(ApiResponse.success(resp))
    }

    @GetMapping("/{userId}/profile")
    fun getProfile(@PathVariable userId: String): ResponseEntity<ApiResponse<MemberProfile>> {
        val profile = membershipService.getProfile(userId)
        return ResponseEntity.ok(ApiResponse.success(profile))
    }

    @PutMapping("/{userId}/profile")
    fun updateProfile(@PathVariable userId: String, @RequestBody req: MemberProfileRequest): ResponseEntity<ApiResponse<MemberProfile>> {
        val profile = membershipService.updateProfile(userId, MemberProfile(
            userId = userId,
            gender = req.gender,
            dateOfBirth = req.dateOfBirth?.let { LocalDate.parse(it) },
            maritalStatus = req.maritalStatus,
            occupation = req.occupation,
            baptismDate = req.baptismDate?.let { LocalDate.parse(it) },
            membershipDate = req.membershipDate?.let { LocalDate.parse(it) },
            spiritualGifts = req.spiritualGifts,
            skills = req.skills,
            bio = req.bio
        ))
        return ResponseEntity.ok(ApiResponse.success(profile))
    }
}
