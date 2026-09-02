package ke.pcea.connect.modules.identity.application

import ke.pcea.connect.modules.identity.domain.EmailVerificationToken
import ke.pcea.connect.modules.identity.infrastructure.EmailVerificationTokenRepository
import ke.pcea.connect.modules.identity.infrastructure.UserRepository
import ke.pcea.connect.shared.api.BusinessRuleException
import org.springframework.beans.factory.annotation.Value
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional
import java.time.Instant
import java.util.UUID

/**
 * Email verification service. Generates single-use, time-limited tokens.
 * When [EmailProvider] is not enabled (dev/local), the verification link is returned to
 * the controller so the dev UI can display it — this is the explicit dev boundary.
 */
@Service
@Transactional
class EmailVerificationService(
    private val tokenRepo: EmailVerificationTokenRepository,
    private val userRepo: UserRepository,
    private val emailProvider: EmailProvider,
    @Value("\${app.base-url:http://localhost:3000}") private val baseUrl: String
) {
    /**
     * Generates a verification token for the user and sends the verification email.
     * Returns the verification link if email is not enabled (dev mode), null otherwise.
     */
    fun sendVerificationEmail(userId: String, email: String, fullName: String): String? {
        val token = UUID.randomUUID().toString()
        tokenRepo.save(EmailVerificationToken(userId = userId, token = token))

        val link = "$baseUrl/verify-email?token=$token"
        val subject = "Verify your PCEA Connect account"
        val body = """
            <h2>Welcome to PCEA Connect, $fullName!</h2>
            <p>Please verify your email address by clicking the link below:</p>
            <p><a href="$link">Verify Email</a></p>
            <p>This link expires in 24 hours.</p>
        """.trimIndent()

        emailProvider.sendEmail(email, subject, body)
        return if (emailProvider.isEnabled()) null else link
    }

    fun verifyEmail(token: String): Boolean {
        val verifToken = tokenRepo.findByToken(token) ?: return false
        if (verifToken.used || verifToken.expiryDate.isBefore(Instant.now())) return false
        val user = userRepo.findById(verifToken.userId).orElse(null) ?: return false
        userRepo.save(user.copy(emailVerified = true))
        verifToken.used = true
        tokenRepo.save(verifToken)
        return true
    }

    fun resendVerification(email: String): String? {
        val user = userRepo.findByEmail(email).orElseThrow { BusinessRuleException("User not found") }
        if (user.emailVerified) throw BusinessRuleException("Email already verified")
        return sendVerificationEmail(user.id, user.email, user.fullName)
    }
}
