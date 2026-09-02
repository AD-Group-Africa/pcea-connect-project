package ke.pcea.connect.modules.membership.api.controller
import ke.pcea.connect.modules.identity.infrastructure.UserRepository
import ke.pcea.connect.modules.membership.application.MembershipService
import ke.pcea.connect.modules.membership.domain.MemberProfile
import ke.pcea.connect.shared.api.ApiResponse
import org.springframework.http.ResponseEntity
import org.springframework.security.core.Authentication
import org.springframework.web.bind.annotation.*

@RestController
@RequestMapping("/api/membership-card")
class MembershipCardController(
    private val userRepo: UserRepository,
    private val membershipService: MembershipService
) {
    @GetMapping
    fun getCard(auth: Authentication): ResponseEntity<ApiResponse<Map<String, Any?>>> {
        val userId = auth.name
        val user = userRepo.findById(userId).orElseThrow()
        var profile: MemberProfile? = null
        try {
            profile = membershipService.getProfile(userId)
        } catch (_: Exception) { }
        val card = mapOf(
            "id" to user.id,
            "fullName" to user.fullName,
            "email" to user.email,
            "phone" to user.phone,
            "congregationName" to (user.congregation?.name ?: ""),
            "memberSince" to (profile?.membershipDate?.toString() ?: ""),
            "gender" to (profile?.gender ?: ""),
            "qrCode" to "https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=MEMBER:${user.id}"
        )
        return ResponseEntity.ok(ApiResponse.success(card))
    }
}
