package ke.pcea.connect.modules.membership.api.controller
import ke.pcea.connect.modules.identity.infrastructure.UserRepository
import ke.pcea.connect.modules.membership.application.MemberCredentialService
import ke.pcea.connect.modules.membership.application.MembershipService
import ke.pcea.connect.modules.membership.domain.MemberProfile
import ke.pcea.connect.shared.audit.AuditService
import ke.pcea.connect.shared.api.ApiResponse
import ke.pcea.connect.shared.api.BusinessRuleException
import ke.pcea.connect.shared.security.Roles
import org.springframework.http.ResponseEntity
import org.springframework.security.access.prepost.PreAuthorize
import org.springframework.security.core.Authentication
import org.springframework.web.bind.annotation.*

data class VerifyCredentialRequest(val credential: String, val deviceId: String = "")

@RestController
@RequestMapping("/api/membership-card")
class MembershipCardController(
    private val userRepo: UserRepository,
    private val membershipService: MembershipService,
    private val credentials: MemberCredentialService,
    private val audit: AuditService
) {
    @GetMapping
    fun getCard(auth: Authentication): ResponseEntity<ApiResponse<Map<String, Any?>>> {
        val userId = auth.name
        val user = userRepo.findById(userId).orElseThrow()
        var profile: MemberProfile? = null
        try {
            profile = membershipService.getProfile(userId)
        } catch (_: Exception) { }
        // Server-signed credential + locally rendered QR (no third-party QR service).
        val credential = credentials.issue(user.id)
        val card = mapOf(
            "id" to user.id,
            "fullName" to user.fullName,
            "email" to user.email,
            "phone" to user.phone,
            "congregationName" to (user.congregation?.name ?: ""),
            "memberSince" to (profile?.membershipDate?.toString() ?: ""),
            "gender" to (profile?.gender ?: ""),
            "credential" to credential,
            "qrCode" to credentials.qrDataUri(credential),
            // Product language: the credential layer is the PCEA Church ID — the identity
            // used by membership, communion and (future) sacraments. The signed payload
            // format is UNCHANGED (MC1.<memberId>.<issuedAt>.<hmac>).
            "productName" to "PCEA Church ID",
            "productNote" to "Your Church ID verifies your membership and sacramental participation. Never share it as a screenshot."
        )
        return ResponseEntity.ok(ApiResponse.success(card))
    }

    /**
     * Server-side credential verification for elders/clerk/staff scanning a member's
     * card. A forged or tampered QR fails HMAC validation; a valid QR of a disabled
     * account is rejected. Reveals only directory-grade identity fields.
     */
    @PostMapping("/verify")
    @PreAuthorize(Roles.STAFF_OR_CLERK_SPEL)
    fun verifyCredential(@RequestBody req: VerifyCredentialRequest): ResponseEntity<ApiResponse<Map<String, Any?>>> {
        val memberId = credentials.verify(req.credential)
        val user = userRepo.findById(memberId).orElseThrow { BusinessRuleException("Unknown credential") }
        return ResponseEntity.ok(ApiResponse.success(mapOf(
            "memberId" to user.id,
            "fullName" to user.fullName,
            "congregationName" to (user.congregation?.name ?: "")
        )))
    }

    /**
     * Revoke a member's Church ID credential by disabling the account. The signed QR
     * becomes permanently unusable (verify() rejects disabled accounts) — revocation
     * is instantaneous and needs no credential list. Audited as
     * IDENTITY_CREDENTIAL_REVOKED. SUPER_ADMIN only: disabling an account is a
     * platform-level administrative action.
     */
    @PostMapping("/{memberId}/revoke")
    @PreAuthorize("hasRole('SUPER_ADMIN')")
    fun revokeCredential(auth: Authentication, @PathVariable memberId: String): ResponseEntity<ApiResponse<Map<String, Any?>>> {
        val user = userRepo.findById(memberId).orElseThrow { BusinessRuleException("Member not found") }
        if (!user.enabled) throw BusinessRuleException("Credential is already revoked")
        // User.enabled is val — replace the instance (true → false) and save.
        userRepo.save(user.copy(enabled = false))
        audit.record(
            actorId = auth.name,
            action = "IDENTITY_CREDENTIAL_REVOKED",
            entityType = "user",
            entityId = user.id,
            detail = "member=${user.id} reason=account disabled by administrator",
            actorRoles = auth.authorities.map { it.authority.removePrefix("ROLE_") }
        )
        return ResponseEntity.ok(ApiResponse.success(mapOf(
            "memberId" to user.id,
            "revoked" to true
        )))
    }
}
