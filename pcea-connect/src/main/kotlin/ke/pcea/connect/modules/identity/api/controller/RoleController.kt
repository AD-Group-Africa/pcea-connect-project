package ke.pcea.connect.modules.identity.api.controller

import ke.pcea.connect.modules.identity.infrastructure.UserRepository
import ke.pcea.connect.shared.api.ApiResponse
import ke.pcea.connect.shared.api.BusinessRuleException
import org.springframework.http.ResponseEntity
import org.springframework.security.access.prepost.PreAuthorize
import org.springframework.web.bind.annotation.*

// Valid roles for this deployment. Keep in sync with docs/10-Security.md.
val VALID_ROLES = setOf("MEMBER", "ELDER", "CLERK", "TREASURER", "ADMIN", "SUPER_ADMIN")

data class AssignRoleRequest(val role: String)
data class UserRolesResponse(val userId: String, val roles: List<String>)

@RestController
@RequestMapping("/api/admin/users")
class RoleController(private val userRepo: UserRepository) {

    // SUPER_ADMIN only, deliberately narrower than plain ADMIN — granting roles (including
    // granting ADMIN/SUPER_ADMIN itself) is the highest-privilege action in the system.
    @PreAuthorize("hasRole('SUPER_ADMIN')")
    @PostMapping("/{userId}/roles")
    fun assignRole(@PathVariable userId: String, @RequestBody req: AssignRoleRequest): ResponseEntity<ApiResponse<UserRolesResponse>> {
        if (req.role !in VALID_ROLES) throw BusinessRuleException("Unknown role: ${req.role}")
        val user = userRepo.findById(userId).orElseThrow { BusinessRuleException("User not found") }
        user.roles.add(req.role)
        userRepo.save(user)
        return ResponseEntity.ok(ApiResponse.success(UserRolesResponse(user.id, user.roles.toList())))
    }

    @PreAuthorize("hasRole('SUPER_ADMIN')")
    @DeleteMapping("/{userId}/roles/{role}")
    fun removeRole(@PathVariable userId: String, @PathVariable role: String): ResponseEntity<ApiResponse<UserRolesResponse>> {
        val user = userRepo.findById(userId).orElseThrow { BusinessRuleException("User not found") }
        if (role == "SUPER_ADMIN" && user.roles.contains("SUPER_ADMIN") &&
            userRepo.findAll().count { it.roles.contains("SUPER_ADMIN") } <= 1) {
            throw BusinessRuleException("Cannot remove the last SUPER_ADMIN")
        }
        user.roles.remove(role)
        userRepo.save(user)
        return ResponseEntity.ok(ApiResponse.success(UserRolesResponse(user.id, user.roles.toList())))
    }

    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'ADMIN')")
    @GetMapping("/{userId}/roles")
    fun getRoles(@PathVariable userId: String): ResponseEntity<ApiResponse<UserRolesResponse>> {
        val user = userRepo.findById(userId).orElseThrow { BusinessRuleException("User not found") }
        return ResponseEntity.ok(ApiResponse.success(UserRolesResponse(user.id, user.roles.toList())))
    }
}
