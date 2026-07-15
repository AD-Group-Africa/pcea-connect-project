package ke.pcea.connect.modules.identity.api.controller
import ke.pcea.connect.modules.identity.infrastructure.UserRepository
import ke.pcea.connect.shared.api.ApiResponse
import org.springframework.http.ResponseEntity
import org.springframework.security.crypto.password.PasswordEncoder
import org.springframework.web.bind.annotation.*
import java.time.Instant
import java.util.UUID
import jakarta.persistence.*
import org.springframework.data.jpa.repository.JpaRepository
import org.springframework.stereotype.Repository
import org.springframework.transaction.annotation.Transactional
import org.springframework.stereotype.Service

@Entity
@Table(name = "password_reset_tokens")
data class PasswordResetToken(
    @Id @GeneratedValue(strategy = GenerationType.UUID) val id: String = "",
    val userId: String = "",
    val token: String = "",
    val expiryDate: Instant = Instant.now().plusSeconds(3600),
    var used: Boolean = false
)

@Repository
interface PasswordResetTokenRepository : JpaRepository<PasswordResetToken, String> {
    fun findByToken(token: String): PasswordResetToken?
}

@Service
class PasswordResetService(
    private val userRepo: UserRepository,
    private val tokenRepo: PasswordResetTokenRepository,
    private val passwordEncoder: PasswordEncoder
) {
    @Transactional
    fun createResetToken(email: String): String {
        val user = userRepo.findByEmail(email).orElse(null) ?: return ""
        val token = UUID.randomUUID().toString()
        tokenRepo.save(PasswordResetToken(userId = user.id, token = token))
        return token
    }

    @Transactional
    fun resetPassword(token: String, newPassword: String): Boolean {
        val resetToken = tokenRepo.findByToken(token) ?: return false
        if (resetToken.used || resetToken.expiryDate.isBefore(Instant.now())) return false
        val user = userRepo.findById(resetToken.userId).orElse(null) ?: return false
        user.password = passwordEncoder.encode(newPassword)
        userRepo.save(user)
        resetToken.used = true
        tokenRepo.save(resetToken)
        return true
    }
}

@RestController
@RequestMapping("/api/auth")
class PasswordResetController(
    private val resetService: PasswordResetService
) {
    data class ForgotPasswordRequest(val email: String)
    data class ResetPasswordRequest(val token: String, val newPassword: String)

    @PostMapping("/forgot-password")
    fun forgotPassword(@RequestBody req: ForgotPasswordRequest): ResponseEntity<ApiResponse<String>> {
        val token = resetService.createResetToken(req.email)
        return ResponseEntity.ok(ApiResponse.success(if (token.isNotEmpty()) "Reset link sent" else "If email exists, reset link sent"))
    }

    @PostMapping("/reset-password")
    fun resetPassword(@RequestBody req: ResetPasswordRequest): ResponseEntity<ApiResponse<Any>> {
        val success = resetService.resetPassword(req.token, req.newPassword)
        return if (success) ResponseEntity.ok(ApiResponse.success("Password reset successful"))
        else ResponseEntity.badRequest().body(ApiResponse.error("Invalid or expired token") as ApiResponse<Any>)
    }
}

